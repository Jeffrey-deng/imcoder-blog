package site.imcoder.blog.Interceptor;

import org.apache.commons.httpclient.HttpStatus;
import org.springframework.context.annotation.DependsOn;
import org.springframework.web.method.HandlerMethod;
import site.imcoder.blog.Interceptor.annotation.AccessRecorder;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.event.IEventTrigger;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;
import site.imcoder.blog.setting.GlobalConstants;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.lang.annotation.Annotation;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 记录页面访问历史的拦截器
 *
 * @author Jeffrey.Deng
 * @date 2019-10-30
 */
@DependsOn({"configManager"})
public class AccessRecorderInterceptor extends BaseInterceptor {

    @Resource
    private IEventTrigger trigger;

    private static List<String> spiders = null;

    public AccessRecorderInterceptor() {
        spiders = Config.getList(ConfigConstants.ACCESS_RECORD_IGNORE_SPIDERS, String.class);
        for (int i = 0; i < spiders.size(); i++) {
            spiders.set(i, spiders.get(i).toLowerCase());
        }
    }

    /**
     * 需实现 从handler中找出注解类来判断是否需要拦截
     *
     * @param handler
     * @return
     */
    @Override
    protected Annotation findMethodAnnotation(Object handler) {
        return ((HandlerMethod) handler).getMethodAnnotation(AccessRecorder.class);
    }

    @Override
    public void afterRunHandler(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        if (getResponseStatus(request, response) != HttpStatus.SC_OK) {
            return;
        }
        HttpSession session = request.getSession();
        if (checkIsSpider(request)) {
            return; // 碰到蜘蛛访问，直接跳过，不记录
        }
        AccessRecorder accessRecorder = ((HandlerMethod) handler).getMethodAnnotation(AccessRecorder.class);
        AccessRecord rewriteRecord = getRewriteRecord(request, accessRecorder);
        Object bean = null;
        switch (accessRecorder.type()) {
            case ARTICLE:
                Article article = getPrintAttr(request, accessRecorder.key());
                if (article != null && accessNewBean(session, article.getAid(), accessRecorder, rewriteRecord)) {
                    bean = article;
                }
                break;
            case VIDEO:
                Video video = getPrintAttr(request, accessRecorder.key());
                if (video != null && accessNewBean(session, video.getVideo_id(), accessRecorder, rewriteRecord)) {
                    bean = video;
                }
                break;
            case PHOTO:
                Photo photo = getPrintAttr(request, accessRecorder.key());
                if (photo != null && accessNewBean(session, photo.getPhoto_id(), accessRecorder, rewriteRecord)) {
                    bean = photo;
                }
                break;
            case ALBUM:
                Album album = getPrintAttr(request, accessRecorder.key());
                if (album != null && accessNewBean(session, album.getAlbum_id(), accessRecorder, rewriteRecord)) {
                    bean = album;
                }
                break;
            case USER:
                User user = getPrintAttr(request, accessRecorder.key());
                if (user != null && accessNewBean(session, user.getUid(), accessRecorder, rewriteRecord)) {
                    bean = user;
                }
                break;
        }
        if (bean != null) {
            AccessRecord accessRecord = buildAccessRecord(request);
            accessRecord.setBean(bean);
            if (rewriteRecord != null) {
                if (rewriteRecord.getIs_like() != null) {
                    accessRecord.setIs_like(rewriteRecord.getIs_like());
                }
                if (rewriteRecord.getDeep() != null) {
                    accessRecord.setDeep(rewriteRecord.getDeep());
                }
                if (rewriteRecord.getFirst_access_referer() != null) {
                    accessRecord.setFirst_access_referer(rewriteRecord.getFirst_access_referer());
                }
                if (rewriteRecord.getFirst_access_path() != null) {
                    accessRecord.setFirst_access_path(rewriteRecord.getFirst_access_path());
                }
            }
            switch (accessRecorder.type()) {
                case ARTICLE:
                    trigger.accessArticle(accessRecord, accessRecorder);
                    break;
                case VIDEO:
                    trigger.accessVideo(accessRecord, accessRecorder);
                    break;
                case PHOTO:
                    trigger.accessPhoto(accessRecord, accessRecorder);
                    break;
                case ALBUM:
                    trigger.accessAlbum(accessRecord, accessRecorder);
                    break;
                case USER:
                    trigger.accessUserHome(accessRecord, accessRecorder);
                    break;
            }
            trigger.accessSite(accessRecord, accessRecorder);
        }
    }

    @Override
    protected void afterOtherHandler(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        if (!isAjaxRequest(handler) && response.getStatus() == HttpStatus.SC_OK) {
            if (checkIsSpider(request)) {
                return; // 碰到蜘蛛访问，直接跳过，不记录
            }
            AccessRecord accessRecord = buildAccessRecord(request);
            trigger.accessSite(accessRecord, null);
        }
    }

    protected int getResponseStatus(HttpServletRequest request, HttpServletResponse response) {
        if (response.getStatus() == HttpStatus.SC_OK) {
            Object returnValue = request.getAttribute("responseBodyReturnValue");
            if (returnValue != null && returnValue instanceof IResponse) {
                return ((IResponse) returnValue).getStatus();
            }
        }
        return response.getStatus();
    }

    protected <T> T getPrintAttr(HttpServletRequest request, String key) {
        Object returnValue = request.getAttribute("responseBodyReturnValue");
        if (returnValue != null && returnValue instanceof IResponse) {
            return ((IResponse) returnValue).getAttr(key);
        }
        return (T) request.getAttribute(key);
    }

    protected AccessRecord getRewriteRecord(HttpServletRequest request, AccessRecorder accessRecorder) {
        AccessRecord rewriteRecord = getPrintAttr(request, accessRecorder.recordRewriteKey());
        if (rewriteRecord == null) {
            rewriteRecord = new AccessRecord();
            rewriteRecord.setDeep(accessRecorder.deep());
        } else {
            if (rewriteRecord.getFirst_access_path() != null && rewriteRecord.getFirst_access_path().startsWith("http")) {
                Matcher matcher = Pattern.compile("^" + request.getScheme() + "://" +
                        Utils.escapeExprSpecialWord(request.getServerName()) +
                        "(:" + request.getServerPort() + ")?" +
                        Utils.escapeExprSpecialWord(request.getContextPath()) + "(.*)$").matcher(rewriteRecord.getFirst_access_path());
                if (matcher.matches()) {
                    String fap = matcher.group(2);
                    if (fap == null || fap.length() == 0) {
                        rewriteRecord.setFirst_access_path("/");
                    } else {
                        rewriteRecord.setFirst_access_path(fap);
                    }
                }
            }
            if (rewriteRecord.getDeep() == null) {
                rewriteRecord.setDeep(accessRecorder.deep());
            }
        }
        return rewriteRecord;
    }

    /**
     * 如果是这个session第一次访问此bean返回true，否则false
     *
     * @param session
     * @param accessRecorder
     * @param primary_id
     * @return
     */
    protected boolean accessNewBean(HttpSession session, Long primary_id, AccessRecorder accessRecorder, AccessRecord rewriteRecord) {
        switch (accessRecorder.action()) {
            case LIKE:
                if (rewriteRecord != null && rewriteRecord.getIs_like() != null) {
                    return true;
                } else {
                    return false;
                }
            case DELETE:
            case SAVE:
                @SuppressWarnings("unchecked")
                String accessed_map_session_key = "accessed_" + accessRecorder.type() + "_map";
                Map<Long, Integer> accessedMap = (Map<Long, Integer>) session.getAttribute(accessed_map_session_key);
                if (accessedMap == null) {
                    accessedMap = new HashMap<>();
                    session.setAttribute(accessed_map_session_key, accessedMap);
                }
                if (accessRecorder.action() == AccessRecorder.Actions.DELETE) {
                    if (accessedMap.containsKey(primary_id)) {
                        accessedMap.remove(primary_id);
                    }
                    return true;
                } else {
                    Integer beforeDeep = accessedMap.get(primary_id);
                    Integer newDeep = (rewriteRecord != null && rewriteRecord.getDeep() != null) ? rewriteRecord.getDeep() : accessRecorder.deep();
                    if (beforeDeep == null || newDeep > beforeDeep) {
                        accessedMap.put(primary_id, newDeep);
                        return true;
                    } else {
                        return false;
                    }
                }
            default:
                return false;
        }
    }

    private AccessRecord buildAccessRecord(HttpServletRequest request) {
        User loginUser = (User) (request.getSession().getAttribute(GlobalConstants.KEY_LOGIN_USER));
        String access_ip = Utils.getRemoteAddr(request);
        String user_agent = request.getHeader("user-agent");
        String access_path = Utils.getRequestPath(request);
        String referer = request.getHeader("referer");
        AccessRecord accessRecord = new AccessRecord();
        accessRecord.setUser(loginUser == null ? new User(0L) : loginUser);
        accessRecord.setFirst_access_path(access_path);
        accessRecord.setFirst_access_referer(referer != null ? referer : "");
        long nowTime = System.currentTimeMillis();
        accessRecord.setFirst_access_time(nowTime);
        accessRecord.setLast_access_time(nowTime);
        accessRecord.setLast_access_ip(access_ip);
        accessRecord.setLast_access_user_agent(user_agent != null ? user_agent : "");
        accessRecord.setDeep(0);
        accessRecord.setIs_like(null);
        return accessRecord;
    }

    private boolean checkIsSpider(HttpServletRequest request) {
        String userAgent = request.getHeader("user-agent");
        String referer = request.getHeader("referer");
        if (userAgent != null) {
            String userAgentLowerCase = userAgent.toLowerCase();
            for (String spiderBot : spiders) {  // 遍历检查 userAgent
                if (userAgentLowerCase.contains(spiderBot)) {
                    return true; // 碰到蜘蛛访问，直接跳过，不记录
                }
            }
            if (referer != null && referer.equals(request.getRequestURL().toString())) {
                return true; // 遍历检查 refer， refer 与 请求url 相同大概率是蜘蛛
            }
        }
        return false;
    }
}
