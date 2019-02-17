package site.imcoder.blog.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;
import site.imcoder.blog.Interceptor.LoginRequired;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.type.UserAuthType;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.UserAuth;
import site.imcoder.blog.service.IAuthService;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 凭证鉴权控制器
 *
 * @author Jeffrey.Deng
 * @date 2016-10-04
 */
@Controller
@RequestMapping("/auth.do")
public class AuthController extends BaseController {

    //依赖注入[service]
    @Resource
    private IAuthService authService;

    /**
     * 检查该邮箱是否存在
     *
     * @param email
     * @return flag - 200：已存在，400:参数错误，404：未使用
     */
    @RequestMapping(params = "method=checkEmail")
    @ResponseBody
    public Map<String, Object> checkEmail(String email) {
        Map<String, Object> map = new HashMap<String, Object>();
        UserAuth userAuth = new UserAuth();
        userAuth.setIdentity_type(UserAuthType.EMAIL.value);
        userAuth.setIdentifier(email);
        int flag = authService.hasUserAuth(userAuth);
        map.put(KEY_STATUS, flag);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "已存在");
        } else if (flag == 400) {
            map.put(KEY_STATUS_FRIENDLY, "参数错误");
        } else {
            map.put(KEY_STATUS_FRIENDLY, "未使用");
        }
        return map;
    }

    /**
     * 检查改用户名是否存在
     *
     * @param username 用户名
     * @return flag - 200：已存在，400:参数错误，404：未使用
     */
    @RequestMapping(params = "method=checkUsername")
    @ResponseBody
    public Map<String, Object> checkUsername(String username) {
        Map<String, Object> map = new HashMap<String, Object>();
        UserAuth userAuth = new UserAuth();
        userAuth.setIdentity_type(UserAuthType.USERNAME.value);
        userAuth.setIdentifier(username);
        int flag = authService.hasUserAuth(userAuth);
        map.put(KEY_STATUS, flag);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "已存在");
        } else if (flag == 400) {
            map.put(KEY_STATUS_FRIENDLY, "参数错误");
        } else {
            map.put(KEY_STATUS_FRIENDLY, "未使用");
        }
        return map;
    }

    /**
     * 登陆
     *
     * @param userAuth
     * @param remember
     * @param session
     * @param request
     * @return flag - 200：成功，400: 参数错误，401：凭证错误，403：账号冻结，404：无此用户
     * loginUser - 用户对象
     */
    @RequestMapping(params = "method=login", method = RequestMethod.POST)
    @ResponseBody
    public Map<String, Object> login(UserAuth userAuth, @RequestParam(defaultValue = "false") boolean remember, HttpSession session, HttpServletRequest request) {
        if (userAuth == null) {
            userAuth = new UserAuth();
        }
        userAuth.setLogin_ip(Utils.getRemoteAddr(request));
        Map<String, Object> map = authService.login(userAuth, remember);
        int flag = (int) map.get(KEY_STATUS);
        if (flag == 200) {
            //登陆成功
            User loginUser = (User) map.get("user");
            session.setAttribute("loginUser", loginUser);
            map.put("loginUser", loginUser);
            map.remove("user");
            if (remember) {
                map.put("token", map.get("token"));
            }
            map.put("continue", "article.do?method=list");
        } else if (flag == 400) {
            map.put(KEY_STATUS_FRIENDLY, "参数错误");
        } else if (flag == 401) {
            map.put(KEY_STATUS_FRIENDLY, "凭证错误");
        } else if (flag == 403) {
            map.put(KEY_STATUS_FRIENDLY, "账号为锁定状态");
        } else {
            map.put(KEY_STATUS_FRIENDLY, "该用户不存在");
        }
        return map;
    }

    /**
     * 跳转到 登陆
     *
     * @param userAuth
     * @param mv
     * @param request
     * @return
     */
    @RequestMapping(params = "method=jumpLogin")
    public ModelAndView jumpLogin(UserAuth userAuth, ModelAndView mv, HttpServletRequest request) {
        if (request.getAttribute("http_code") == null) {
            request.setAttribute("http_code", 200);
        }
        // 传入了参数则跳转到重新登录页面，没有则普通登陆
        Map<String, Object> queryMap = authService.findUserByUserAuth(userAuth);
        if ((int) queryMap.get(KEY_STATUS) == 200) {
            mv.addObject("user", queryMap.get("user"));
            mv.addObject("userAuth", userAuth);
            mv.setViewName(PAGE_LOGIN_EXPIRED);
            return mv;
        }
        mv.setViewName(PAGE_LOGIN);
        return mv;
    }

    /**
     * 用户获取自己凭证列表的凭证名
     *
     * @return flag - 200：获取成功，404：未存在
     */
    @RequestMapping(params = "method=getUserAuthList")
    @ResponseBody
    @LoginRequired
    public Map<String, Object> getUserAuthList(HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        List<UserAuth> userAuthList = authService.findUserAuthList(loginUser);
        if (userAuthList != null) {
            map.put("userAuths", userAuthList);
            map.put(KEY_STATUS, 200);
            map.put(KEY_STATUS_FRIENDLY, "成功");
        } else {
            map.put(KEY_STATUS, 404);
            map.put(KEY_STATUS_FRIENDLY, "不存在");
        }
        return map;
    }

    /**
     * 更新账号信息
     *
     * @param username
     * @param email
     * @param password
     * @param validateCode
     * @param session
     * @return flag - 200：成功，401：需要登录或验证码错误，403：无权限，404：无此用户，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=updateAccount")
    @ResponseBody
    public Map<String, Object> updateAccount(String username, String email, String password, String validateCode, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        String memValidateCode = (String) session.getAttribute("validateCode");
        Map<String, Object> map = new HashMap<String, Object>();
        if (loginUser == null) {
            map.put(KEY_STATUS, 401);
            map.put(KEY_STATUS_FRIENDLY, "未登录");
            //服务端再与Session中的验证码验证，防止修改html破解
        } else if (memValidateCode == null) {
            map.put(KEY_STATUS, 400);
            map.put(KEY_STATUS_FRIENDLY, "请先发送验证码~");
        } else if (memValidateCode.equalsIgnoreCase(validateCode)) {
            List<UserAuth> userAuthList = new ArrayList<>();
            UserAuth usernameUserAuth = new UserAuth(loginUser.getUid(), UserAuthType.USERNAME, username, password);
            UserAuth emailUserAuth = new UserAuth(loginUser.getUid(), UserAuthType.EMAIL, email, password);
            userAuthList.add(usernameUserAuth);
            userAuthList.add(emailUserAuth);
            Map<String, Object> updateMap = authService.updateAccount(userAuthList, loginUser);
            int flag = (int) updateMap.get(KEY_STATUS);
            map.put(KEY_STATUS, flag);
            if (flag == 200) {
                // 销毁session让其重新登录
                session.invalidate(); // 由于前面清除了token，使所有终端自动登录失效，重新登录是为了让其获取新的token
            }
            convertStatusCodeToWord(map);
        } else {
            map.put(KEY_STATUS, 401);
            map.put(KEY_STATUS_FRIENDLY, "验证码错误");
        }
        return map;
    }

    /**
     * 安全退出
     *
     * @param session
     * @return flag - 200：成功，401：需要登录，404：无此用户，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=logout")
    @ResponseBody
    public Map<String, Object> logout(HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = authService.clearAutoLoginToken(loginUser); //清除token，让所有终端自动登录失效
        map.put(KEY_STATUS, flag);
        convertStatusCodeToWord(map);
        session.invalidate();
        return map;
    }

}
