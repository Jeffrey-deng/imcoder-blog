package site.imcoder.blog.controller.api;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.support.SessionStatus;
import site.imcoder.blog.Interceptor.annotation.LoginRequired;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.type.UserAuthType;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.UserAuth;
import site.imcoder.blog.service.IAuthService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.List;

/**
 * 凭证鉴权控制器
 *
 * @author Jeffrey.Deng
 * @date 2016-10-04
 */
@Controller
@RequestMapping("/auth.api")
public class AuthApiController extends BaseController {

    //依赖注入[service]
    @Resource
    private IAuthService authService;

    /**
     * 检查该邮箱是否存在
     *
     * @param email
     * @param iRequest
     * @return ResponseEntity
     * type - 1: 该凭证已存在，0：此凭证可用
     */
    @RequestMapping(params = "method=checkEmailIsAvailable")
    @ResponseBody
    public IResponse checkEmailIsAvailable(String email, IRequest iRequest) {
        UserAuth userAuth = new UserAuth();
        userAuth.setIdentity_type(UserAuthType.EMAIL.value);
        userAuth.setIdentifier(email);
        return authService.hasUserAuth(userAuth, iRequest);
    }

    /**
     * 检查改用户名是否存在
     *
     * @param username 用户名
     * @param iRequest
     * @return ResponseEntity
     * type - 1: 该凭证已存在，0：此凭证可用
     */
    @RequestMapping(params = "method=checkUsernameIsAvailable")
    @ResponseBody
    public IResponse checkUsernameIsAvailable(String username, IRequest iRequest) {
        UserAuth userAuth = new UserAuth();
        userAuth.setIdentity_type(UserAuthType.USERNAME.value);
        userAuth.setIdentifier(username);
        return authService.hasUserAuth(userAuth, iRequest);
    }

    /**
     * 登陆
     *
     * @param userAuth
     * @param remember
     * @param request
     * @param response
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：凭证错误，403：账号冻结，404：无此用户
     * user - 用户对象
     */
    @RequestMapping(params = "method=login", method = RequestMethod.POST)
    @ResponseBody
    public IResponse login(UserAuth userAuth, @RequestParam(defaultValue = "false") boolean remember,
                           HttpSession session, HttpServletRequest request, HttpServletResponse response,
                           IRequest iRequest) {
        if (userAuth == null) {
            userAuth = new UserAuth();
        }
        userAuth.setLogin_ip(Utils.getRemoteAddr(request));
        IResponse loginResp = authService.login(userAuth, iRequest.putAttr("remember", remember));
        if (loginResp.isSuccess()) {
            //登陆成功
            User loginUser = loginResp.getAttr("user");
            session.setAttribute(KEY_LOGIN_USER, loginUser);
            // cookies
            String cookie_path = (request.getContextPath().length() == 0 ? "/" : request.getContextPath());
            boolean cookie_secure = request.getScheme().equalsIgnoreCase("https");
            Cookie identifier_cookie = new Cookie("identifier", String.valueOf(loginUser.getUid())); // uid
            identifier_cookie.setPath(cookie_path);
            identifier_cookie.setMaxAge(-1);
            identifier_cookie.setSecure(cookie_secure);
            Cookie credential_cookie = null; // token
            if (remember) {
                int max_age = 3600 * 24 * Integer.parseInt(Config.getChild(ConfigConstants.USER_LOGIN_REMEMBER_MAX_AGE, "@user_", loginUser.getUid() + "", ":"));
                credential_cookie = new Cookie("credential", loginResp.getAttr("token"));
                credential_cookie.setPath(cookie_path);
                credential_cookie.setSecure(cookie_secure);
                credential_cookie.setMaxAge(max_age); // max_age
                identifier_cookie.setMaxAge(max_age); // max_age
            }
            Cookie status_cookie = new Cookie("login_status", "true");  // login_status
            status_cookie.setPath(cookie_path);
            status_cookie.setSecure(cookie_secure);
            status_cookie.setMaxAge(-1);
            response.addCookie(identifier_cookie); // 一旦add，对象就不能修改了
            if (remember) {
                response.addCookie(credential_cookie);
            }
            response.addCookie(status_cookie);
        }
        return loginResp.putAttr("continue", "a/list");
    }

    /**
     * 用户获取自己凭证列表的凭证名
     *
     * @param iRequest
     * @return flag - 200：获取成功，404：未存在
     */
    @RequestMapping(params = "method=getUserAuthList")
    @ResponseBody
    @LoginRequired
    public IResponse getUserAuthList(IRequest iRequest) {
        return authService.findUserAuthList(iRequest);
    }

    /**
     * 更新账号信息
     *
     * @param username
     * @param email
     * @param password
     * @param validateCode
     * @param session
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录或验证码错误，403：无权限，404：无此用户，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=updateAccount")
    @ResponseBody
    public IResponse updateAccount(String username, String email, String password, String validateCode, HttpSession session, IRequest iRequest) {
        String memValidateCode = (String) session.getAttribute("validateCode");
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN, "未登录~");
            // 服务端再与Session中的验证码验证，防止修改html运行
        } else if (memValidateCode == null) {
            response.setStatus(STATUS_PARAM_ERROR, "请先发送验证码~");
        } else if (memValidateCode.equalsIgnoreCase(validateCode)) {
            User loginUser = iRequest.getLoginUser();
            List<UserAuth> userAuthList = new ArrayList<>();
            UserAuth usernameUserAuth = new UserAuth(loginUser.getUid(), UserAuthType.USERNAME, username, password);
            UserAuth emailUserAuth = new UserAuth(loginUser.getUid(), UserAuthType.EMAIL, email, password);
            userAuthList.add(usernameUserAuth);
            userAuthList.add(emailUserAuth);
            response = authService.updateAccount(userAuthList, iRequest);
            if (response.isSuccess()) {
                // 销毁session让其重新登录
                session.invalidate(); // 由于前面清除了token，使所有终端自动登录失效，重新登录是为了让其获取新的token
            }
        } else {
            response.setStatus(STATUS_FORBIDDEN, "验证码错误~");
        }
        return response;
    }

    /**
     * 安全退出
     *
     * @param session
     * @param request
     * @param response
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，404：无此用户或无token，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=logout")
    @ResponseBody
    public IResponse logout(SessionStatus sessionStatus, HttpSession session, HttpServletRequest request, HttpServletResponse response, IRequest iRequest) {
        sessionStatus.setComplete();
        session.invalidate();
        // 清除token，让所有终端自动登录失效
        IResponse clearResp = authService.clearAutoLoginToken(iRequest);
        if (clearResp.isSuccess()) {
            String cookie_path = (request.getContextPath().length() == 0 ? "/" : request.getContextPath());
            Cookie identifier_cookie = new Cookie("identifier", null); // uid
            identifier_cookie.setPath(cookie_path);
            identifier_cookie.setMaxAge(0);
            response.addCookie(identifier_cookie);
            Cookie credential_cookie = new Cookie("credential", null); // token
            credential_cookie.setPath(cookie_path);
            credential_cookie.setMaxAge(0);
            response.addCookie(credential_cookie);
            Cookie status_cookie = new Cookie("login_status", null);  // login_status
            status_cookie.setPath(cookie_path);
            status_cookie.setMaxAge(0);
            response.addCookie(status_cookie);
        }
        return clearResp;
    }

    /**
     * 发送验证码邮件
     *
     * @param userAuth - 当用户没有登录既忘记密码时，传入一个凭证名称，如果能找到用户就给该用户发送验证邮件
     * @param session
     * @param iRequest
     * @return code
     */
    @LoginRequired
    @RequestMapping(params = "method=sendValidateCode")
    @ResponseBody
    public IResponse sendValidateCode(UserAuth userAuth, HttpSession session, IRequest iRequest) {
        IResponse response = authService.sendValidateCode(iRequest.putAttr("userAuth", userAuth));
        if (response.isSuccess()) {
            session.setAttribute("validateCode", response.getAttr("validateCode"));
        }
        return response.removeAttr("validateCode");
    }

    /**
     * 验证验证码
     *
     * @param code
     * @param memValidateCode
     * @param iRequest
     * @return
     */
    @LoginRequired
    @RequestMapping(params = "method=checkValidateCode")
    @ResponseBody
    public IResponse checkValidateCode(String code, @SessionAttribute(value = "validateCode", required = false) String memValidateCode, IRequest iRequest) {
        if (Utils.isNotEmpty(code)) {
            code = code.trim();
        }
        IResponse response = new IResponse();
        if (Utils.isEmpty(memValidateCode)) {
            response.setStatus(STATUS_NOT_FOUND, "未发送邮件呢~");
        } else if (Utils.isEmpty(code)) {
            response.setStatus(STATUS_PARAM_ERROR, "请提交验证码~");
        } else if (memValidateCode.equalsIgnoreCase(code)) {
            response.setStatus(STATUS_SUCCESS, "验证码正确~");
        } else {
            response.setStatus(STATUS_NOT_LOGIN, "验证码错误~");
        }
        return response;
    }

}
