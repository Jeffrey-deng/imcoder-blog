package site.imcoder.blog.controller;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.RedirectView;
import site.imcoder.blog.Interceptor.LoginRequired;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.UserGroup;
import site.imcoder.blog.service.IArticleService;
import site.imcoder.blog.service.INotifyService;
import site.imcoder.blog.service.ISiteService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * description: 站点控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/site.do")
public class SiteController extends BaseController {

    //依赖注入[service]
    @Resource
    private IArticleService articleService;

    @Resource
    private IUserService userService;

    @Resource
    private ISiteService siteService;

    @Resource
    private INotifyService notifyService;

    @RequestMapping()
    public ModelAndView defaultHandle(HttpServletRequest request) {
        String queryString = request.getQueryString();
        ModelAndView mv = new ModelAndView();
        if (queryString == null || queryString.length() == 0) {
            RedirectView redirectView = new RedirectView("site.do?method=about", true);
            redirectView.setStatusCode(HttpStatus.MOVED_PERMANENTLY);
            mv.setView(redirectView);
        } else {
            mv.setViewName(PAGE_NOT_FOUND_ERROR);
        }
        return mv;
    }

    /**
     * 查询公告列表
     *
     * @param jumpPage  跳转页
     * @param condition 条件
     * @param session
     * @return 通过权限检查的列表
     */
    @RequestMapping(params = "method=notices")
    public String listNotices(@RequestParam(defaultValue = "5") int pageSize, @RequestParam(defaultValue = "1") int jumpPage, Article condition, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (condition == null) {
            condition = new Article();
        }
        condition.setTags("公告|notice");
        UserGroup group = new UserGroup();
        group.setGid(1);
        User author = new User();
        author.setUserGroup(group);
        condition.setAuthor(author);
        Map<String, Object> map = articleService.list(pageSize, jumpPage, condition, loginUser);
        if (map != null) {
            request.setAttribute("articleList", map.get("articleList"));
            request.setAttribute("page", map.get("page"));
        }
        request.setAttribute("condition", condition);
        return "/site/notices";
    }

    @RequestMapping(params = "method=notice")
    public String notice(@RequestParam(defaultValue = "0") int id, HttpServletRequest request, HttpServletResponse response, HttpSession session) {
        User loginUser = getLoginUser(session);
        Map<String, Object> queryMap = articleService.detail(id, loginUser);
        Article article = (Article) queryMap.get("article");
        int flag = (int) queryMap.get(KEY_STATUS);
        String page = "/site/site_board";
        if (flag == 401) {
            request.setAttribute("http_code", 401);
            page = PAGE_LOGIN;
        } else if (flag == 404) {
            page = setNotFoundInfo(request, "该公告不存在~");
        } else if (flag == 403) {
            page = PAGE_FORBIDDEN_ERROR;
        } else if (article.getAuthor().getUserGroup().getGid() == 1 && article.getTags() != null && article.getTags().matches(".*(公告|notice).*")) {
            if (clickNewArticle(session, article)) {
                userService.hasClickArticle(loginUser, article);
            }
            request.setAttribute("article", article);
        } else {
            page = setNotFoundInfo(request, "该公告不存在~");
        }
        return page;
    }

    @RequestMapping(params = "method=about")
    public String about(HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        int aid = Config.getInt(ConfigConstants.SITE_ABOUT_ARTICLE_ID);
        Map<String, Object> queryMap = articleService.detail(aid, loginUser);
        Article article = (Article) queryMap.get("article");
        int flag = (int) queryMap.get(KEY_STATUS);
        String page = "/site/site_board";
        if (flag == 401) {
            request.setAttribute("http_code", 401);
            page = PAGE_LOGIN;
        } else if (flag == 404) {
            page = setNotFoundInfo(request, "站点还未设置关于页~");
        } else if (flag == 403) {
            page = PAGE_FORBIDDEN_ERROR;
        } else {
            if (clickNewArticle(session, article)) {
                userService.hasClickArticle(loginUser, article);
            }
            request.setAttribute("article", article);
        }
        return page;
    }

    @RequestMapping(params = "method=help")
    public String help(String module, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        int aid = 0;
        if (module == null || module.length() == 0) {
            String value = Config.getChildDefault(ConfigConstants.SITE_HELP_ARTICLE_ID, "@");
            if (value == null || value.length() == 0 || value.equals("0")) {
                return setNotFoundInfo(request, "站点还未设置默认帮助页~");
            } else {
                aid = Integer.valueOf(value);
            }
        } else {
            String value = Config.getChildNotDefault(ConfigConstants.SITE_HELP_ARTICLE_ID, "@", module, ":");
            if (value == null || value.length() == 0 || value.equals("0")) {
                return setNotFoundInfo(request, "站点还未设置" + module + "帮助页~");
            } else {
                aid = Integer.valueOf(value);
            }
        }
        Map<String, Object> queryMap = articleService.detail(aid, loginUser);
        Article article = (Article) queryMap.get("article");
        int flag = (int) queryMap.get(KEY_STATUS);
        String page = "/site/site_board";
        if (flag == 401) {
            request.setAttribute("http_code", 401);
            page = PAGE_LOGIN;
        } else if (flag == 404) {
            page = setNotFoundInfo(request, "帮助页不见了~ 请联系管理员");
        } else if (flag == 403) {
            page = PAGE_FORBIDDEN_ERROR;
        } else {
            if (clickNewArticle(session, article)) {
                userService.hasClickArticle(loginUser, article);
            }
            request.setAttribute("article", article);
        }
        return page;
    }

    /**
     * 发送验证码邮件
     *
     * @param session
     * @return code
     */
    @LoginRequired
    @RequestMapping(params = "method=sendValidateCode")
    @ResponseBody
    public Map<String, Object> sendValidateCode(HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        String code = notifyService.validateCode(loginUser);
        if (Utils.isNotEmpty(code)) {
            session.setAttribute("validateCode", code);
            map.put(KEY_STATUS, 200);
            map.put(KEY_STATUS_FRIENDLY, "邮件发送成功~");
        } else {
            map.put(KEY_STATUS, 500);
            map.put(KEY_STATUS_FRIENDLY, "邮件发送失败~");
        }
        return map;
    }

    /**
     * 验证验证码
     *
     * @param code
     * @param session
     * @return
     */
    @LoginRequired
    @RequestMapping(params = "method=checkValidateCode")
    @ResponseBody
    public Map<String, Object> checkValidateCode(String code, HttpSession session) {
        if (Utils.isNotEmpty(code)) {
            code = code.trim();
        }
        Map<String, Object> map = new HashMap<String, Object>();
        String validateCode = (String) session.getAttribute("validateCode");
        if (Utils.isEmpty(validateCode)) {
            map.put(KEY_STATUS, 404);
            map.put(KEY_STATUS_FRIENDLY, "未发送邮件呢~");
        } else if (Utils.isEmpty(code)) {
            map.put(KEY_STATUS, 400);
            map.put(KEY_STATUS_FRIENDLY, "请提交验证码~");
        } else if (validateCode.equalsIgnoreCase(code)) {
            map.put(KEY_STATUS, 200);
            map.put(KEY_STATUS_FRIENDLY, "验证码正确");
        } else {
            map.put(KEY_STATUS, 401);
            map.put(KEY_STATUS_FRIENDLY, "验证码错误");
        }
        return map;
    }

    /**
     * 清除系统消息未读状态
     *
     * @param session
     */
    @LoginRequired
    @RequestMapping(params = "method=clearSysMsgStatus")
    @ResponseBody
    public Map<String, Object> clearSystemMessageStatus(@RequestParam("smids") ArrayList<Integer> smids, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        if (smids != null) {
            User loginUser = (User) session.getAttribute("loginUser");
            int flag = notifyService.updateSystemMessageStatus(smids);
            map.put(KEY_STATUS, flag);
            convertStatusCodeToWord(map);
        } else {
            map.put(KEY_STATUS, 400);
            map.put(KEY_STATUS_FRIENDLY, "参数错误");
        }
        return map;
    }

    /**
     * 文字转语音
     *
     * @param text
     * @return session
     */
    @LoginRequired
    @RequestMapping(params = "method=runTextToVoice")
    @ResponseBody
    public Map<String, Object> textToVoice(HttpServletRequest request, String text, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        // to HashMap
        HashMap<String, Object> options = new HashMap<String, Object>();
        for (Iterator itr = request.getParameterMap().entrySet().iterator(); itr.hasNext(); ) {
            Map.Entry element = (Map.Entry) itr.next();
            String strKey = (String) element.getKey();
            String strValue = ((String[]) (element.getValue()))[0];
            options.put(strKey, strValue);
        }
        Map<String, Object> map = siteService.textToVoice(text, options, loginUser);
        convertStatusCodeToWord(map);
        return map;
    }

    /**
     * 文字转语音页面
     *
     * @return session
     */
    @LoginRequired
    @RequestMapping(params = "method=text_to_voice")
    public String textToVoice(HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (loginUser == null) {
            return PAGE_LOGIN;
        } else {
            return "/tool/text_to_voice";
        }
    }

    /**
     * 获取ip的地理位置
     */
    @RequestMapping(params = "method=ipLocation")
    @ResponseBody
    public Map<String, Object> ipLocation(@RequestParam("ip") String ip) {
        Map<String, Object> map = siteService.getIpLocation(ip);
        convertStatusCodeToWord(map);
        return map;
    }

    /**
     * 获取本机ip的地理位置
     */
    @RequestMapping(params = "method=currentIpLocation")
    @ResponseBody
    public Map<String, Object> currentIpLocation(HttpServletRequest request) {
        String ip = Utils.getRemoteAddr(request);
        Map<String, Object> map = siteService.getIpLocation(ip);
        convertStatusCodeToWord(map);
        return map;
    }

    /**
     * 获取新的客户端配置
     *
     * @return flag: {200：成功，404：没有配置}； config: 配置
     */
    @RequestMapping(params = "method=getConfigUpgrade", produces = "application/json;charset=UTF-8")
    @ResponseBody
    public String getConfigUpgrade() {
        String clientConfigStr = Config.get(ConfigConstants.SITE_CLIENT_CONFIG);
        int flag = 200;
        if (Utils.isBlank(clientConfigStr)) {
            flag = 404;
            clientConfigStr = "null";
        } else {
            clientConfigStr = clientConfigStr.replace('\'', '"').replaceFirst("\\^\"", "").replaceFirst("\"\\$", "");
        }
        return String.format("{\"flag\": %d, \"config\": %s}", flag, clientConfigStr);
    }

}
