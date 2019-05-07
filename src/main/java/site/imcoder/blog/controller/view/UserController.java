package site.imcoder.blog.controller.view;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import site.imcoder.blog.Interceptor.annotation.AccessRecorder;
import site.imcoder.blog.Interceptor.annotation.GZIP;
import site.imcoder.blog.Interceptor.annotation.LoginRequired;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.IArticleService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import javax.annotation.Resource;

/**
 * description: 用户控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
public class UserController extends BaseController {

    //依赖注入[service]
    @Resource
    private IUserService userService;

    @Resource
    private IArticleService articleService;

    /**
     * 查询文章列表(访问主人的主页)
     *
     * @param size      每页数量
     * @param page      跳转页
     * @param condition 条件 article
     * @param iRequest
     * @return 通过权限检查的列表
     */
    @RequestMapping(value = {"/u/{uid}/{home}", "/u/{uid}"})
    @AccessRecorder(type = AccessRecorder.Types.USER, key = "hostUser")
    public String user_home(
            @PathVariable(value = "home", required = false) String home_flag,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "1") int page,
            @PathVariable @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid,
            Article condition, Model model, IRequest iRequest) {
        // convert [uid] to [author.uid]
        if (IdUtil.containValue(uid)) {
            if (Utils.isEmpty(home_flag)) {
                return "redirect:/u/" + uid + "/home" + appendQueryString(iRequest.getQueryString());
            } else {
                if (condition == null) {
                    condition = new Article();
                    condition.setAuthor(new User());
                } else if (condition != null && condition.getAuthor() == null) {
                    condition.setAuthor(new User());
                }
                condition.getAuthor().setUid(uid);
            }
        }
        IResponse userResp = userService.findUser(condition.getAuthor(), iRequest);
        if (userResp.isSuccess()) {
            IResponse articlesResp = articleService.findArticleList(condition, size, page, iRequest);
            if (articlesResp.isSuccess()) {
                model.addAttribute("articleList", articlesResp.getAttr("articles"));
                model.addAttribute("page", articlesResp.getAttr("page"));
            }
            model.addAttribute("condition", condition);
            model.addAttribute("hostUser", userResp.getAttr("user"));
        } else if (userResp.equalsStatus(STATUS_NOT_FOUND)) {
            model.addAttribute("condition", "该用户不存在！请检查请求参数");
        }
        return getViewPage(userResp, "/user/user_home");
    }

    /**
     * 转到用户 关注粉丝好友 信息页
     *
     * @param uid
     * @param action
     * @param iRequest
     * @return
     */
    @RequestMapping(value = {"/u/contact", "/u/contact/{action}", "/u/{uid}/contact", "/u/{uid}/contact/{action}"})
    public String contact(@PathVariable(required = false) @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid,
                          @PathVariable(required = false) String action, IRequest iRequest) {
        if (IdUtil.containValue(uid)) {
            return "/user/contacts";
        } else {
            if (iRequest.isHasNotLoggedIn()) {
                return PAGE_LOGIN;
            } else {
                return "redirect:/u/" + iRequest.getLoginUser().getUid() +
                        "/contact" + (Utils.isNotEmpty(action) ? ("/" + action) : "") + appendQueryString(iRequest.getQueryString());
            }
        }
    }

    /**
     * 转到个人中心
     *
     * @param uid
     * @param action
     * @param iRequest
     * @return
     */
    @LoginRequired
    @RequestMapping(value = {"/u/center", "/u/center/{action}", "/u/{uid}/center", "/u/{uid}/center/{action}"})
    @GZIP
    public String user_center(@PathVariable(required = false) @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid,
                              @PathVariable(required = false) String action, IRequest iRequest) {
        // 登陆验证
        if (iRequest.isHasLoggedIn()) {
            if (!IdUtil.containValue(uid)) {
                return "redirect:/u/" + iRequest.getLoginUser().getUid() +
                        "/center" + (Utils.isNotEmpty(action) ? ("/" + action) : "") + appendQueryString(iRequest.getQueryString());
            } else if (iRequest.getLoginUser().getUid().equals(uid)) {
                return "/user/user_center";
            } else {
                return PAGE_FORBIDDEN_ERROR;
            }
        } else {
            return PAGE_LOGIN;
        }
    }

    /**
     * 用户浏览历史页面
     *
     * @param uid
     * @param iRequest
     * @return
     */
    @LoginRequired
    @RequestMapping(value = {"/u/history", "/u/{uid}/history"})
    public String user_center(@PathVariable(required = false) @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid, IRequest iRequest) {
        if (iRequest.isHasLoggedIn()) {
            if (!IdUtil.containValue(uid)) {
                return "redirect:/u/" + iRequest.getLoginUser().getUid() + "/history" + appendQueryString(iRequest.getQueryString());
            } else if (iRequest.getLoginUser().getUid().equals(uid)) {
                return "/user/user_history";
            } else {
                return PAGE_FORBIDDEN_ERROR;
            }
        } else {
            return PAGE_LOGIN;
        }
    }

}
