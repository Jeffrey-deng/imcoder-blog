package site.imcoder.blog.Interceptor;

import org.apache.commons.httpclient.HttpStatus;
import org.springframework.context.annotation.DependsOn;
import org.springframework.web.method.HandlerMethod;
import site.imcoder.blog.Interceptor.annotation.AccessRecord;
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
public class AccessRecordInterceptor extends BaseInterceptor {

    @Resource
    private IEventTrigger trigger;

    private List<String> spiders = null;

    public AccessRecordInterceptor() {
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
        return ((HandlerMethod) handler).getMethodAnnotation(AccessRecord.class);
    }

    @Override
    public void afterRunHandler(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        if (getResponseStatus(request, response) != HttpStatus.SC_OK) {
            return;
        }
        AccessRecord accessRecord = ((HandlerMethod) handler).getMethodAnnotation(AccessRecord.class);
        if (accessRecord.action() == AccessRecord.Actions.SAVE && checkIsSpider(request)) {
            return; // 碰到蜘蛛访问，直接跳过，不记录
        }
        runRecordHandler(accessRecord, request);
    }

    @Override
    protected void afterOtherHandler(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        if (!isAjaxRequest(handler) && response.getStatus() == HttpStatus.SC_OK) {
            if (checkIsSpider(request)) {
                return; // 碰到蜘蛛访问，直接跳过，不记录
            }
            AccessDetail accessDetail = buildAccessDetail(request);
            trigger.accessSite(accessDetail);
        }
    }

    private AccessDetail runRecordHandler(AccessRecord accessRecord, HttpServletRequest request) {
        AccessDetail accessDetail = null;
        HttpSession session = request.getSession();
        AccessDetail rewriteAccessDetail;
        try {
            rewriteAccessDetail = findRewriteAccessDetail(request, accessRecord);
        } catch (SaveDeniedException e) {
            return null;
        }
        Long creation_id = null;
        switch (accessRecord.type()) {
            case ARTICLE:
                Article article = getPrintAttr(request, accessRecord.key());
                if (article != null && accessNewBean(session, article.getAid(), accessRecord, rewriteAccessDetail)) {
                    creation_id = article.getAid();
                }
                break;
            case VIDEO:
                Video video = getPrintAttr(request, accessRecord.key());
                if (video != null && accessNewBean(session, video.getVideo_id(), accessRecord, rewriteAccessDetail)) {
                    creation_id = video.getVideo_id();
                }
                break;
            case PHOTO:
                Photo photo = getPrintAttr(request, accessRecord.key());
                if (photo != null && accessNewBean(session, photo.getPhoto_id(), accessRecord, rewriteAccessDetail)) {
                    creation_id = photo.getPhoto_id();
                }
                break;
            case ALBUM:
                Album album = getPrintAttr(request, accessRecord.key());
                if (album != null && accessNewBean(session, album.getAlbum_id(), accessRecord, rewriteAccessDetail)) {
                    creation_id = album.getAlbum_id();
                }
                break;
            case USER:
                User user = getPrintAttr(request, accessRecord.key());
                if (user != null && accessNewBean(session, user.getUid(), accessRecord, rewriteAccessDetail)) {
                    creation_id = user.getUid();
                }
                break;
        }
        if (creation_id != null) {
            accessDetail = buildAccessDetail(request);
            accessDetail.setCreation_id(creation_id);
            if (rewriteAccessDetail != null) {
                if (rewriteAccessDetail.getDeep() != null) {
                    accessDetail.setDeep(rewriteAccessDetail.getDeep());
                }
                if (rewriteAccessDetail.getFirst_access_referer() != null) {
                    accessDetail.setFirst_access_referer(rewriteAccessDetail.getFirst_access_referer());
                }
                if (rewriteAccessDetail.getFirst_access_path() != null) {
                    accessDetail.setFirst_access_path(rewriteAccessDetail.getFirst_access_path());
                }
            }
            switch (accessRecord.type()) {
                case ARTICLE:
                    trigger.accessArticle(accessDetail, accessRecord);
                    break;
                case VIDEO:
                    trigger.accessVideo(accessDetail, accessRecord);
                    break;
                case PHOTO:
                    trigger.accessPhoto(accessDetail, accessRecord);
                    break;
                case ALBUM:
                    trigger.accessAlbum(accessDetail, accessRecord);
                    break;
                case USER:
                    trigger.accessUserHome(accessDetail, accessRecord);
                    break;
            }
            if (accessRecord.action() != AccessRecord.Actions.DELETE) {
                trigger.accessSite(accessDetail);
            }
        }
        return accessDetail;
    }

    protected int getResponseStatus(HttpServletRequest request, HttpServletResponse response) {
        if (response.getStatus() == HttpStatus.SC_OK) {
            Object returnValue = request.getAttribute(GlobalConstants.RESPONSE_BODY_RETURN_VALUE);
            if (returnValue != null && returnValue instanceof IResponse) {
                return ((IResponse) returnValue).getStatus();
            }
        }
        return response.getStatus();
    }

    protected <T> T getPrintAttr(HttpServletRequest request, String key) {
        Object returnValue = request.getAttribute(GlobalConstants.RESPONSE_BODY_RETURN_VALUE);
        if (returnValue != null && returnValue instanceof IResponse) {
            return ((IResponse) returnValue).getAttr(key);
        }
        return (T) request.getAttribute(key);
    }

    protected AccessDetail findRewriteAccessDetail(HttpServletRequest request, AccessRecord accessRecord) throws SaveDeniedException {
        Object rewriteAccess = getPrintAttr(request, accessRecord.recordRewriteKey());
        AccessDetail accessDetail = null;
        if (rewriteAccess != null) {
            if (rewriteAccess instanceof AccessDetail) {
                accessDetail = (AccessDetail)rewriteAccess;
                if (accessDetail.getFirst_access_path() != null && accessDetail.getFirst_access_path().startsWith("http")) {
                    Matcher matcher = Pattern.compile("^" + request.getScheme() + "://" +
                            Utils.escapeExprSpecialWord(request.getServerName()) +
                            "(:" + request.getServerPort() + ")?" +
                            Utils.escapeExprSpecialWord(request.getContextPath()) + "(.*)$").matcher(accessDetail.getFirst_access_path());
                    if (matcher.matches()) {
                        String fap = matcher.group(2);
                        if (fap == null || fap.length() == 0) {
                            accessDetail.setFirst_access_path("/");
                        } else {
                            accessDetail.setFirst_access_path(fap);
                        }
                    }
                }
                if (accessDetail.getDeep() == null) {
                    accessDetail.setDeep(accessRecord.deep());
                }
            } else if (rewriteAccess instanceof Boolean) {
                if (!(Boolean)rewriteAccess) {
                    throw new SaveDeniedException("保存记录被拒绝");
                }
            }
        }
        if (accessDetail == null) {
            accessDetail = new AccessDetail();
            accessDetail.setDeep(accessRecord.deep());
        }
        return accessDetail;
    }

    /**
     * 如果是这个session第一次访问此bean返回true，否则false
     *
     * @param session
     * @param accessRecord
     * @param primary_id
     * @return
     */
    protected boolean accessNewBean(HttpSession session, Long primary_id, AccessRecord accessRecord, AccessDetail rewriteRecord) {
        @SuppressWarnings("unchecked")
        String accessed_map_session_key = "accessed_" + accessRecord.type() + "_map";
        Map<Long, Integer> accessedMap = (Map<Long, Integer>) session.getAttribute(accessed_map_session_key);
        if (accessedMap == null) {
            accessedMap = new HashMap<>();
            session.setAttribute(accessed_map_session_key, accessedMap);
        }
        switch (accessRecord.action()) {
            case DELETE:
                if (accessedMap.containsKey(primary_id)) {
                    accessedMap.remove(primary_id);
                }
                return true;
            case SAVE:
                Integer beforeDeep = accessedMap.get(primary_id);
                Integer newDeep = (rewriteRecord != null && rewriteRecord.getDeep() != null) ? rewriteRecord.getDeep() : accessRecord.deep();
                if (beforeDeep == null || newDeep > beforeDeep) {
                    accessedMap.put(primary_id, newDeep);
                    return true;
                } else {
                    return false;
                }
            default:
                return false;
        }
    }

    private AccessDetail buildAccessDetail(HttpServletRequest request) {
        User loginUser = (User) (request.getSession().getAttribute(GlobalConstants.KEY_LOGIN_USER));
        String access_ip = Utils.getRemoteAddr(request);
        String user_agent = request.getHeader("user-agent");
        String access_path = Utils.getRequestPath(request);
        String referer = request.getHeader("referer");
        AccessDetail accessDetail = new AccessDetail();
        accessDetail.setUid(loginUser == null ? 0L : loginUser.getUid());
        accessDetail.setFirst_access_path(access_path);
        accessDetail.setFirst_access_referer(referer != null ? referer : "");
        long nowTime = System.currentTimeMillis();
        accessDetail.setFirst_access_time(nowTime);
        accessDetail.setLast_access_time(nowTime);
        accessDetail.setLast_access_ip(access_ip);
        accessDetail.setLast_access_user_agent(user_agent != null ? user_agent : "");
        accessDetail.setDeep(0);
        return accessDetail;
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

    /**
     * 此异常标记拒绝保存记录时的情况
     */
    private static class SaveDeniedException extends Exception {

        public SaveDeniedException() {
        }

        public SaveDeniedException(String name) {
            super(name);
        }
    }

}
