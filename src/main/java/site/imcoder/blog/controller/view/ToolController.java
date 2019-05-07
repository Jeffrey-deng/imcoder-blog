package site.imcoder.blog.controller.view;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import site.imcoder.blog.Interceptor.annotation.LoginRequired;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.entity.User;

import javax.servlet.http.HttpSession;

/**
 * 工具控制器
 *
 * @author Jeffrey.Deng
 * @date 2019-10-21
 */
@Controller
public class ToolController extends BaseController {

    /**
     * 文字转语音页面
     *
     * @return session
     */
    @LoginRequired
    @RequestMapping(value = "/tool/text_to_voice")
    public String textToVoice(HttpSession session) {
        User loginUser = getLoginUser(session);
        if (loginUser == null) {
            return PAGE_LOGIN;
        } else {
            return "/tool/text_to_voice";
        }
    }

}
