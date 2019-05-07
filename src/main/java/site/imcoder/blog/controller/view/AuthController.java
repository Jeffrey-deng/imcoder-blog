package site.imcoder.blog.controller.view;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.entity.UserAuth;
import site.imcoder.blog.service.IAuthService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import javax.annotation.Resource;

/**
 * 凭证鉴权控制器
 *
 * @author Jeffrey.Deng
 * @date 2016-10-04
 */
@Controller
@RequestMapping("/auth")
public class AuthController extends BaseController {

    //依赖注入[service]
    @Resource
    private IAuthService authService;

    /**
     * 跳转到 登陆
     *
     * @param userAuth
     * @param httpStatus
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = "login")
    public String jumpLogin(UserAuth userAuth, @RequestAttribute(value = "http_code", required = false) Integer httpStatus, Model model, IRequest iRequest) {
        if (httpStatus == null) {
            model.addAttribute("http_code", 200);
        }
        // 传入了参数则跳转到重新登录页面，没有则普通登陆
        IResponse userAuthResp = authService.findUserByUserAuth(userAuth, iRequest);
        if (userAuthResp.isSuccess()) {
            model.addAttribute("user", userAuthResp.getAttr("user"));
            model.addAttribute("userAuth", userAuth);
            return PAGE_LOGIN_EXPIRED;
        } else {
            return PAGE_LOGIN;
        }
    }

    /**
     * 跳转注册
     */
    @RequestMapping(value = "register")
    public String register() {
        return "/site/register";
    }

}
