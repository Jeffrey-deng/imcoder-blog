package site.imcoder.blog.controller;

import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import site.imcoder.blog.controller.propertyeditors.IntEditor;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.User;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * @author Jeffrey.Deng
 */
public abstract class BaseController {

    public final static String KEY_LOGIN_USER = "loginUser";

    public final static String KEY_STATUS = "flag";

    public final static String KEY_STATUS_FRIENDLY = "info";

    public final static String KEY_ERROR_INFO = "errorInfo";

    public final static String PAGE_LOGIN = "/site/login";

    public final static String PAGE_LOGIN_EXPIRED = "/site/lockscreen";

    public final static String PAGE_PARAM_ERROR = "/error/400";

    public final static String PAGE_FORBIDDEN_ERROR = "/error/403";

    public final static String PAGE_NOT_FOUND_ERROR = "/error/404";

    public final static String PAGE_SERVER_ERROR = "/error/500";

    public final static String FRIENDLY_SUCCESS = "成功";

    public final static String FRIENDLY_PARAM_ERROR = "参数错误";

    public final static String FRIENDLY_NOT_LOGIN = "需要登录";

    public final static String FRIENDLY_FORBIDDEN = "没有权限";

    public final static String FRIENDLY_NOT_FOUND = "无此记录";

    public final static String FRIENDLY_SERVER_ERROR = "服务器错误";

    /**
     * @param session
     * @return int
     * 403 ： 不是管理员
     * 401 ： 未登录
     * 200 ： 是管理员
     */
    protected int isAdmin(HttpSession session) {
        User user = (User) session.getAttribute(KEY_LOGIN_USER);
        if (user == null) {
            return 401;
        } else if (user.getUserGroup().getGid() != 1) {
            return 403;
        } else {
            return 200;
        }
    }

    /**
     * 得到登录用户
     *
     * @param session
     * @return
     */
    protected User getLoginUser(HttpSession session) {
        return (User) session.getAttribute(KEY_LOGIN_USER);
    }

    /**
     * 设置404详细信息，并返回404页面地址
     *
     * @param request
     * @param detail
     * @return
     */
    protected String setNotFoundInfo(HttpServletRequest request, String detail) {
        request.setAttribute(KEY_ERROR_INFO, detail);
        return PAGE_NOT_FOUND_ERROR;
    }

    /**
     * 设置错误详细信息，并返回错误页面地址
     *
     * @param request
     * @param errorPage
     * @param errorInfo
     * @return
     */
    protected String setErrorInfo(HttpServletRequest request, String errorPage, String errorInfo) {
        request.setAttribute(KEY_ERROR_INFO, errorInfo);
        return errorPage;
    }

    /**
     * 得到flag_code对于错误页jsp地址
     *
     * @param flag
     * @return
     */
    protected String getErrorPage(int flag) {
        switch (flag) {
            case 400:
                return PAGE_PARAM_ERROR;
            case 401:
                return PAGE_LOGIN;
            case 403:
                return PAGE_FORBIDDEN_ERROR;
            case 404:
                return PAGE_NOT_FOUND_ERROR;
            case 500:
                return PAGE_SERVER_ERROR;
            default:
                return PAGE_NOT_FOUND_ERROR;
        }
    }

    /**
     * 得到状态码的提示信息
     *
     * @param map
     * @param codeKey
     * @param wordKey
     */
    protected void convertStatusCodeToWord(Map<String, Object> map, String codeKey, String wordKey) {
        int flag = (Integer) map.get(codeKey);
        if (flag == 200) {
            map.put(wordKey, FRIENDLY_SUCCESS);
        } else if (flag == 400) {
            map.put(wordKey, FRIENDLY_PARAM_ERROR);
        } else if (flag == 401) {
            map.put(wordKey, FRIENDLY_NOT_LOGIN);
        } else if (flag == 403) {
            map.put(wordKey, FRIENDLY_FORBIDDEN);
        } else if (flag == 404) {
            map.put(wordKey, FRIENDLY_NOT_FOUND);
        } else {
            map.put(wordKey, FRIENDLY_SERVER_ERROR);
        }
    }

    /**
     * 得到状态码的提示信息
     *
     * @param map
     */
    protected void convertStatusCodeToWord(Map<String, Object> map) {
        convertStatusCodeToWord(map, KEY_STATUS, KEY_STATUS_FRIENDLY);
    }

    /**
     * 如果是这个session第一次访问此文章返回true，否则false
     *
     * @param session
     * @param article
     * @return
     */
    protected boolean clickNewArticle(HttpSession session, Article article) {
        @SuppressWarnings("unchecked")
        List<Integer> openedArticle = (List<Integer>) session.getAttribute("openedArticle");
        if (openedArticle == null) {
            openedArticle = new ArrayList<Integer>();
            session.setAttribute("openedArticle", openedArticle);
        }
        if (!openedArticle.contains(article.getAid())) {
            openedArticle.add(article.getAid());
            return true;
        } else {
            return false;
        }
    }

    //注册类型转换
    @InitBinder
    protected void initBinder(WebDataBinder binder) {
        //binder.registerCustomEditor(Date.class, new CustomDateEditor(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"), true));
        binder.registerCustomEditor(int.class, new IntEditor());
    }

}
