package site.imcoder.blog.controller;

import org.springframework.http.HttpStatus;
import org.springframework.ui.Model;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.RedirectView;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.controller.propertyeditors.EntityPropertyEditor;
import site.imcoder.blog.controller.propertyeditors.IntEditor;
import site.imcoder.blog.controller.propertyeditors.annotation.EmojiConvert;
import site.imcoder.blog.controller.propertyeditors.converter.EscapeEmojiPropertyFieldConverter;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.GlobalConstants;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.Map;

/**
 * @author Jeffrey.Deng
 */
public abstract class BaseController implements GlobalConstants {

    public final static String KEY_ERROR_INFO = "errorInfo";

    public final static String PAGE_LOGIN = "/site/login";

    public final static String PAGE_LOGIN_EXPIRED = "/site/lockscreen";

    public final static String PAGE_PARAM_ERROR = "/error/400";

    public final static String PAGE_FORBIDDEN_ERROR = "/error/403";

    public final static String PAGE_NOT_FOUND_ERROR = "/error/404";

    public final static String PAGE_SERVER_ERROR = "/error/500";

    /**
     * @param session
     * @return int
     * 403 ： 不是管理员
     * 401 ： 未登录
     * 200 ： 是管理员
     */
    protected int isAdmin(HttpSession session) {
        return isAdmin((User) session.getAttribute(KEY_LOGIN_USER));
    }

    /**
     * @param loginUser
     * @return int
     * 403 ： 不是管理员
     * 401 ： 未登录
     * 200 ： 是管理员
     */
    protected int isAdmin(User loginUser) {
        if (loginUser == null || !loginUser.isHasLoggedIn()) {
            return STATUS_NOT_LOGIN;
        } else if (loginUser.getUserGroup().isGeneralUser()) {
            return STATUS_FORBIDDEN;
        } else {
            return STATUS_SUCCESS;
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
     * 复制ResponseEntity中的值到request
     *
     * @param response
     * @param request
     */
    protected void copyDataToRequest(IResponse response, HttpServletRequest request) {
        Map<String, Object> map = response.getAttr();
        if (map != null) {
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                request.setAttribute(entry.getKey(), entry.getValue());
            }
        }
    }

    /**
     * 设置404详细信息，并返回404页面地址
     *
     * @param model
     * @param detail
     * @return
     */
    protected String setNotFoundInfo(Model model, String detail) {
        return setErrorInfo(model, PAGE_NOT_FOUND_ERROR, detail);
    }

    /**
     * 设置错误详细信息，并返回错误页面地址
     *
     * @param model
     * @param errorPage
     * @param errorInfo
     * @return
     */
    protected String setErrorInfo(Model model, String errorPage, String errorInfo) {
        model.addAttribute(KEY_ERROR_INFO, errorInfo);
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
            case STATUS_PARAM_ERROR:
                return PAGE_PARAM_ERROR;
            case STATUS_NOT_LOGIN:
                return PAGE_LOGIN;
            case STATUS_FORBIDDEN:
                return PAGE_FORBIDDEN_ERROR;
            case STATUS_NOT_FOUND:
                return PAGE_NOT_FOUND_ERROR;
            case STATUS_SERVER_ERROR:
                return PAGE_SERVER_ERROR;
            default:
                return PAGE_NOT_FOUND_ERROR;
        }
    }

    /**
     * 得到status对应的页面
     *
     * @param status
     * @param successPage 状态成功返回的页面
     * @return
     */
    protected String getViewPage(int status, String successPage) {
        if (status == STATUS_SUCCESS) {
            return successPage;
        } else {
            return getErrorPage(status);
        }
    }

    /**
     * 得到status对应的页面
     *
     * @param iResponse
     * @param successPage 状态成功返回的页面
     * @return
     */
    protected String getViewPage(IResponse iResponse, String successPage) {
        return getViewPage(iResponse.getStatus(), successPage);
    }

    protected ModelAndView buildModelAndView(String page) {
        return new ModelAndView(page);
    }

    /**
     * 返回一个重定向ModelAndView，可设置httpCode
     *
     * @param mv
     * @param page
     * @param httpCode
     * @return
     */
    protected ModelAndView buildRedirectView(ModelAndView mv, String page, int httpCode) {
        RedirectView redirectView = new RedirectView(page, true);
        redirectView.setStatusCode(HttpStatus.valueOf(httpCode));
        mv.setView(redirectView);
        return mv;
    }

    /**
     * 返回一个重定向ModelAndView，可设置httpCode
     *
     * @param page
     * @param httpCode
     * @return
     */
    protected ModelAndView buildRedirectView(String page, int httpCode) {
        return buildRedirectView(new ModelAndView(), page, httpCode);
    }

    protected String appendQueryString(String queryString) {
        return Utils.isNotEmpty(queryString) ? ("?" + queryString.replaceFirst("^&", "")) : "";
    }

    protected String getQueryNotNull(HttpServletRequest request) {
        return request.getQueryString() != null ? request.getQueryString() : "";
    }

    // 注册类型转换，每次请求来都会执行，不是启动执行一次！！！
    @InitBinder
    protected void initBinder(WebDataBinder binder) {
        //  binder.registerCustomEditor(Date.class, new CustomDateEditor(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"), true));
        binder.registerCustomEditor(int.class, new IntEditor());
        //  自定义的PropertyEditor
        EntityPropertyEditor entityPropertyEditor = new EntityPropertyEditor(); // emoji转换
        // 绑定注解
        entityPropertyEditor.registerAnnotation(EmojiConvert.class, EscapeEmojiPropertyFieldConverter.getInstance());
        binder.registerCustomEditor(Comment.class, entityPropertyEditor);
        binder.registerCustomEditor(Letter.class, entityPropertyEditor);
        binder.registerCustomEditor(Album.class, entityPropertyEditor);
        binder.registerCustomEditor(Article.class, entityPropertyEditor);
        binder.registerCustomEditor(Photo.class, entityPropertyEditor);
        binder.registerCustomEditor(Video.class, entityPropertyEditor);
    }

}
