package site.imcoder.blog.controller.view.old;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;
import site.imcoder.blog.Interceptor.annotation.LoginRequired;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.servlet.http.HttpServletRequest;

/**
 * description: 用户控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/user")
public class OldUserController extends BaseController {

    @RequestMapping()
    public ModelAndView defaultHandle(HttpServletRequest request, IRequest iRequest) {
        String path = iRequest.getAccessPath();
        User loginUser = iRequest.getLoginUser();
        ModelAndView mv = new ModelAndView();
        if (path.matches("^/[^/]*/?$") && !"XMLHttpRequest".equals(request.getHeader("X-Requested-With")) && iRequest.isHasLoggedIn()) {
            buildRedirectView(mv, "/u/" + loginUser.getUid() + "/home", Config.getInt(ConfigConstants.SITE_OLD_PAGE_REDIRECT_CODE));
        } else {
            mv.setViewName(PAGE_NOT_FOUND_ERROR);
        }
        return mv;
    }

    /**
     * 跳转注册
     */
    @RequestMapping(value = "register")
    public ModelAndView register(IRequest iRequest) {
        return getModelAndView("/auth/register" + appendQueryString(iRequest.getQueryString()));
    }

    /**
     * 查询文章列表(访问主人的主页)
     */
    @RequestMapping(value = "home")
    public ModelAndView user_home(@RequestParam(defaultValue = "0") int uid, IRequest iRequest) {
        long id = IdUtil.convertOldPrimaryKeyToNew(uid);
        return getModelAndView("/u/" + id + "/home" + appendQueryString(iRequest.getQueryString().replaceFirst("(^|&)uid=\\d+", "")));
    }

    /**
     * 转到用户 关注粉丝好友 信息页
     */
    @RequestMapping(value = "contact")
    public ModelAndView contact(@RequestParam(defaultValue = "0") int query_uid, String action, IRequest iRequest) {
        long id = IdUtil.convertOldPrimaryKeyToNew(query_uid);
        return getModelAndView("/u/" + id + "/contact" + (Utils.isNotEmpty(action) ? ("/" + action) : "") +
                appendQueryString(iRequest.getQueryString().replaceFirst("(^|&)query_uid=\\d+", "").replaceFirst("(^|&)action=[^&#]+", "")));
    }

    /**
     * 转到个人中心
     */
    @LoginRequired
    @RequestMapping(value = "center")
    public ModelAndView user_center(String action, @RequestParam(defaultValue = "0") int chatuid, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        if (iRequest.isHasLoggedIn()) {
            Long id = loginUser.getUid();
            long newChatUid = IdUtil.convertOldPrimaryKeyToNew(chatuid);
            return getModelAndView("/u/" + id + "/center" + (Utils.isNotEmpty(action) ? ("/" + action) : "") +
                    appendQueryString(iRequest.getQueryString()
                            .replaceFirst("(^|&)uid=\\d+", "").replaceFirst("(^|&)action=[^&]+", "")
                            .replaceFirst("(^|&)chatuid=[^&]+", "") + (newChatUid != 0 ? ("&chatuid=" + newChatUid) : "")
                    ));
        } else {
            return buildModelAndView(PAGE_LOGIN);
        }
    }

    private ModelAndView getModelAndView(String page) {
        return buildRedirectView(page, Config.getInt(ConfigConstants.SITE_OLD_PAGE_REDIRECT_CODE));
    }

}
