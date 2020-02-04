package site.imcoder.blog.Interceptor;

import org.apache.commons.httpclient.HttpStatus;
import org.apache.log4j.Logger;
import org.springframework.web.method.HandlerMethod;
import site.imcoder.blog.Interceptor.annotation.LoginRequired;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.UserAuthType;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.entity.rewrite.GuestUser;
import site.imcoder.blog.service.IAuthService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;
import site.imcoder.blog.setting.GlobalConstants;

import javax.annotation.Resource;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;
import java.lang.annotation.Annotation;
import java.util.Date;

/**
 * 登录权限过滤器
 *
 * @author Jeffrey.Deng
 * @date 2018/5/15
 */
public class LoginRequiredInterceptor extends BaseInterceptor {

    private static Logger logger = Logger.getLogger(LoginRequiredInterceptor.class);

    @Resource
    private IAuthService authService;

    @Override
    public Annotation findMethodAnnotation(Object handler) {
        return ((HandlerMethod) handler).getMethodAnnotation(LoginRequired.class);
    }

    @Override
    public boolean preRunHandler(HttpServletRequest request, HttpServletResponse response, Object handler) {
        HttpSession session = request.getSession();
        User loginUser = (User) session.getAttribute(GlobalConstants.KEY_LOGIN_USER);
        if (loginUser == null && !tryToLogin(request, response, session)) {
            permissionDeniedResponse(request, response, handler);
            return false;
        } else {
            return true;
        }
    }

    /**
     * 尝试登录
     *
     * @param request
     * @param response
     * @param session
     * @return
     */
    private boolean tryToLogin(HttpServletRequest request, HttpServletResponse response, HttpSession session) {
        boolean isLogin = false;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            String uid = null; // old api
            String token = null; // old api
            String identifier = null; // new api
            String credential = null; // new api
            for (Cookie cookie : cookies) {
                if (cookie == null) {
                    continue;
                }
                if ("identifier".equalsIgnoreCase(cookie.getName())) {
                    identifier = cookie.getValue();
                } else if ("credential".equalsIgnoreCase(cookie.getName())) {
                    credential = cookie.getValue();
                } else if ("uid".equalsIgnoreCase(cookie.getName())) {
                    uid = cookie.getValue();
                } else if ("token".equalsIgnoreCase(cookie.getName())) {
                    token = cookie.getValue();
                }
            }
            try {
                UserAuth userAuth = null;
                if (identifier != null && credential != null) {
                    long longIdentifier = Long.valueOf(identifier);
                    userAuth = new UserAuth(longIdentifier, UserAuthType.TOKEN, String.valueOf(longIdentifier), credential);
                } else if (uid != null && token != null) {
                    long longIdentifier = IdUtil.convertOldPrimaryKeyToNew(Long.valueOf(uid));
                    userAuth = new UserAuth(longIdentifier, UserAuthType.TOKEN, String.valueOf(longIdentifier), token);
                }
                if (userAuth != null) {
                    userAuth.setLogin_ip(Utils.getRemoteAddr(request));
                    // iRequest
                    IRequest iRequest = new IRequest(null);
                    iRequest.setAccessIp(Utils.getRemoteAddr(request));
                    iRequest.setAccessPath(Utils.getRequestPath(request));
                    iRequest.setQueryString(request.getQueryString() != null ? request.getQueryString() : "");
                    IResponse loginResp = authService.login(userAuth, iRequest.putAttr("remember", false));
                    if (loginResp.isSuccess()) {
                        // 存储标记
                        session.setAttribute(GlobalConstants.KEY_LOGIN_USER, loginResp.getAttr("user"));
                        // 登录成功cookie标记
                        Cookie responseCookie = new Cookie("login_status", "true");
                        responseCookie.setPath(request.getContextPath().length() == 0 ? "/" : request.getContextPath());
                        responseCookie.setSecure(request.getScheme().equalsIgnoreCase("https"));
                        responseCookie.setMaxAge(-1);
                        response.addCookie(responseCookie);
                        // 升级旧api为新api
                        if (identifier == null || credential == null) {
                            String longUid = String.valueOf(IdUtil.convertOldPrimaryKeyToNew(Long.parseLong(uid)));
                            String cookie_path = (request.getContextPath().length() == 0 ? "/" : request.getContextPath());
                            boolean cookie_secure = request.getScheme().equalsIgnoreCase("https");
                            int max_age = 3600 * 24 * Integer.parseInt(Config.getChild(ConfigConstants.USER_LOGIN_REMEMBER_MAX_AGE, "@user_", longUid + "", ":"));
                            Cookie identifier_cookie = new Cookie("identifier", longUid);
                            identifier_cookie.setPath(cookie_path);
                            identifier_cookie.setSecure(cookie_secure);
                            identifier_cookie.setMaxAge(max_age); // max_age
                            Cookie credential_cookie = new Cookie("credential", token);
                            credential_cookie.setPath(cookie_path);
                            credential_cookie.setSecure(cookie_secure);
                            credential_cookie.setMaxAge(max_age); // max_age
                            response.addCookie(identifier_cookie);
                            response.addCookie(credential_cookie);
                        }
                        for (Cookie cookie : request.getCookies()) {
                            if (cookie == null) {
                                continue;
                            }
                            // "guest_identifier".equalsIgnoreCase(cookie.getName()) 为了用户体验，这里游客uid不刷新
                            if ("uid".equalsIgnoreCase(cookie.getName()) || "token".equalsIgnoreCase(cookie.getName())) {
                                cookie.setValue(null);
                                cookie.setMaxAge(0);// 立即销毁cookie
                                response.addCookie(cookie);
                            }
                        }
                        isLogin = true;
                    } else {
                        logger.warn(String.format("用户 %s 自动登录失败，CODE：%d，IP：%s", userAuth.getUid(), loginResp.getStatus(), userAuth.getLogin_ip()));
                    }
                }
            } catch (NumberFormatException e) {
                logger.warn("用户自动登录失败: " + e.toString());
            }
            if (!isLogin) {
                for (Cookie cookie : cookies) {
                    if (cookie == null) {
                        continue;
                    }
                    if ("login_status".equalsIgnoreCase(cookie.getName()) ||
                            "uid".equalsIgnoreCase(cookie.getName()) || "token".equalsIgnoreCase(cookie.getName()) ||
                            "identifier".equalsIgnoreCase(cookie.getName()) || "credential".equalsIgnoreCase(cookie.getName())) {
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
            logger.warn("发送未登录response错误", e);
        } catch (ServletException e) {
            logger.warn("发送未登录response错误", e);
        } finally {
            if (out != null) {
                out.close();
            }
        }
    }

    @Override
    public boolean preOtherHandler(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (handler.getClass().isAssignableFrom(HandlerMethod.class)) {
            HttpSession session = request.getSession();
            User loginUser = (User) session.getAttribute(GlobalConstants.KEY_LOGIN_USER);
            User guestUser = (User) session.getAttribute(GlobalConstants.KEY_GUEST_USER);
            // 不需要登录的页面执行一下步骤：
            // 1、当没有登录时尝试登录
            // 2、登录失败且没有设置游客用户对象时，设置游客用户对象
            if (loginUser == null && !tryToLogin(request, response, session) && guestUser == null) {
                    Long guestIdentifier = findGuestIdentifier(request);
                    if (guestIdentifier == null) {
                        guestIdentifier = IdUtil.generatePrimaryKey();
                        String cookie_path = (request.getContextPath().length() == 0 ? "/" : request.getContextPath());
                        boolean cookie_secure = request.getScheme().equalsIgnoreCase("https");
                        int max_age = 3600 * 24 * Integer.parseInt(Config.getChildDefault(ConfigConstants.USER_LOGIN_REMEMBER_MAX_AGE, "@user_"));
                        Cookie guest_identifier_cookie = new Cookie("guest_identifier", String.valueOf(guestIdentifier));
                        guest_identifier_cookie.setPath(cookie_path);
                        guest_identifier_cookie.setSecure(cookie_secure);
                        guest_identifier_cookie.setMaxAge(max_age);
                        response.addCookie(guest_identifier_cookie);
                    }
                    guestUser = new GuestUser(guestIdentifier, "游客");
                    UserStatus userStatus = new UserStatus();
                    userStatus.setLast_login_ip(Utils.getRemoteAddr(request));
                    userStatus.setLast_login_time(new Date());
                    guestUser.setUserStatus(userStatus);
                    guestUser.setUserSetting(new UserSetting());
                    guestUser.setUserStats(new UserStats());
                    session.setAttribute(GlobalConstants.KEY_GUEST_USER, guestUser);
            }
        }
        return true;
    }

    private Long findGuestIdentifier (HttpServletRequest request)  {
        Long guestIdentifier = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie == null) {
                    continue;
                }
                if ("guest_identifier".equalsIgnoreCase(cookie.getName())) {
                    try {
                        guestIdentifier = Long.valueOf(cookie.getValue());
                    } catch (NumberFormatException e) {
                        guestIdentifier = null;
                    }
                }
            }
        }
        return guestIdentifier;
    }
}
