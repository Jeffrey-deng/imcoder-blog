package com.blog.Interceptor;

import com.blog.common.Utils;
import com.blog.entity.User;
import com.blog.service.IUserService;
import org.apache.commons.httpclient.HttpStatus;
import org.springframework.web.method.HandlerMethod;

import javax.annotation.Resource;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;
import java.lang.annotation.Annotation;
import java.util.Map;

/**
 * Created by Jeffrey.Deng on 2018/5/15.
 */
public class LoginRequiredInterceptor extends BaseInterceptor {

    @Resource
    private IUserService userService;

    @Override
    public Annotation findMethodAnnotation(Object handler) {
        return ((HandlerMethod) handler).getMethodAnnotation(LoginRequired.class);
    }

    @Override
    public boolean runHandler(HttpServletRequest request, HttpServletResponse response, Object handler) {
        HttpSession session = request.getSession();
        User loginUser = (User) session.getAttribute("loginUser");
        if (loginUser == null && !tryToLogin(request, response, session)) {
            permissionDeniedResponse(request, response, handler);
            return false;
        } else {
            return true;
        }
    }

    /**
     * 尝试登录
     * @param request
     * @param response
     * @param session
     * @return
     */
    private boolean tryToLogin(HttpServletRequest request, HttpServletResponse response, HttpSession session) {
        boolean isLogin = false;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            String uid = null;
            String token = null;
            for (Cookie cookie : cookies) {
                if (cookie == null) {
                    continue;
                }
                if ("uid".equalsIgnoreCase(cookie.getName())) {
                    uid = cookie.getValue();
                } else if ("token".equalsIgnoreCase(cookie.getName())) {
                    token = cookie.getValue();
                }
            }
            if (uid != null && token != null) {
                User postUser = new User();
                postUser.setLoginIP(Utils.getRemoteAddr(request));
                postUser.setUid(Integer.valueOf(uid));
                postUser.setToken(token);
                Map<String, Object> map = userService.login(postUser, false);
                if (((int) map.get("flag")) == 200) {
                    session.setAttribute("loginUser", map.get("user"));
                    Cookie responseCookie = new Cookie("login_status", "true");
                    response.addCookie(responseCookie);
                    isLogin = true;
                }
            }
            if (!isLogin) {
                for (Cookie cookie : cookies) {
                    if (cookie == null) {
                        continue;
                    }
                    if ("login_status".equalsIgnoreCase(cookie.getName()) || "uid".equalsIgnoreCase(cookie.getName()) || "token".equalsIgnoreCase(cookie.getName())) {
                        cookie.setValue(null);
                        cookie.setMaxAge(0);// 立即销毁cookie
                        response.addCookie(cookie);
                    }
                }
            }
        }
        return isLogin;
    }

    private void permissionDeniedResponse(HttpServletRequest request, HttpServletResponse response, Object handler) {
        PrintWriter out = null;
        try {
            LoginRequired loginRequired = (LoginRequired) findMethodAnnotation(handler);
            if (isAjaxRequest(request)) {
                String content = (loginRequired.content() == null ? "" : loginRequired.content());
                if ("".equals(content)) {
                    response.addHeader("Content-Length", "0");
                } else {
                    response.setCharacterEncoding("UTF-8");
                    if (loginRequired.contentIsJson()) {
                        response.setHeader("Content-Type", "application/json;charset=UTF-8");
                    } else {
                        response.setHeader("Content-Type", "text/plain;charset=UTF-8");
                    }
                    out = response.getWriter();
                    out.write(content);
                    out.flush();
                }
            } else {
                String url = "";
                if (loginRequired.url() != null) {
                    url = loginRequired.url();
                }
                if (loginRequired.isRedirect()) {
                    response.setStatus(HttpStatus.SC_UNAUTHORIZED);
                    response.sendRedirect(loginRequired.url());
                } else {
                    request.setAttribute("http_code", 401);
                    request.getRequestDispatcher(url).forward(request, response);
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        } catch (ServletException e) {
            e.printStackTrace();
        } finally {
            if (out != null) {
                out.close();
            }
        }
    }

    /**
     * 某个请求是否ajax请求
     * @param request
     * @return
     */
    private boolean isAjaxRequest(HttpServletRequest request) {
        String requestType = request.getHeader("X-Requested-With");
        if ("XMLHttpRequest".equals(requestType)) {
            return true;
        } else {
            return false;
        }
        //return ((HandlerMethod) handler).getMethodAnnotation(ResponseBody.class) != null;
    }

    @Override
    public boolean otherHandler(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (handler.getClass().isAssignableFrom(HandlerMethod.class)) {
            HttpSession session = request.getSession();
            User loginUser = (User) session.getAttribute("loginUser");
            if (loginUser == null){
                tryToLogin(request, response, session);
            }
        }
        return true;
    }
}
