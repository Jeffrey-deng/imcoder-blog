package site.imcoder.blog.controller.view;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.RedirectView;
import site.imcoder.blog.Interceptor.annotation.GZIP;
import site.imcoder.blog.Interceptor.annotation.LoginRequired;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.IManagerService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * description: 站点控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/manager")
public class ManagerController extends BaseController {

    private static Logger logger = Logger.getLogger(ManagerController.class);

    @Resource
    private IManagerService managerService;

    @RequestMapping()
    public ModelAndView defaultHandle(IRequest iRequest) {
        String path = iRequest.getAccessPath();
        ModelAndView mv = new ModelAndView();
        if (path.matches("^/[^/]*/?$")) {
            RedirectView redirectView = new RedirectView("manager/backstage", false);
            redirectView.setStatusCode(org.springframework.http.HttpStatus.MOVED_PERMANENTLY);
            mv.setView(redirectView);
        } else {
            mv.setViewName(PAGE_NOT_FOUND_ERROR);
        }
        return mv;
    }

    /**
     * 后台管理页面
     *
     * @param model
     * @param request
     * @param request
     * @return
     */
    @LoginRequired
    @RequestMapping(value = "backstage")
    public String backstage(Model model, HttpServletRequest request, IRequest iRequest) {
        IResponse siteInfoResp = managerService.getSiteInfo(iRequest);
        if (siteInfoResp.isSuccess()) {
            model.addAllAttributes(siteInfoResp.getAttr());
            model.addAttribute("userActiveCount", request.getServletContext().getAttribute("user_active_count"));
        }
        return getViewPage(siteInfoResp, "/manager/main_manager");
    }

    /**
     * 用户管理页面
     *
     * @param iRequest
     * @return
     */
    @LoginRequired
    @RequestMapping(value = "user_manager")
    @GZIP
    public String userManager(Model model, IRequest iRequest) {
        IResponse userListResp = managerService.getUserList(iRequest);
        if (userListResp.isSuccess()) {
            List<User> userList = userListResp.getAttr("users");
            model.addAttribute("userList", userList);
            model.addAttribute("userCount", userList.size());
        }
        return getViewPage(userListResp, "/manager/user_manager");
    }

    /**
     * 文章管理页面
     *
     * @param iRequest
     * @return
     */
    @LoginRequired
    @RequestMapping(value = "article_manager")
    public String articleManager(IRequest iRequest) {
        return getViewPage(isAdmin(iRequest.getLoginUser()), "/manager/article_manager");
    }

    /**
     * 打开管理员更新文章内容
     *
     * @param iRequest
     * @return
     */
    @LoginRequired
    @RequestMapping(value = "article_modify")
    public String articleModify(IRequest iRequest) {
        return getViewPage(isAdmin(iRequest.getLoginUser()), "/manager/manager_article_modify");
    }

    /**
     * 查看日志页面
     *
     * @param iRequest
     * @return
     */
    @LoginRequired
    @RequestMapping(value = "log_view")
    public String checkLog(IRequest iRequest) {
        return getViewPage(isAdmin(iRequest.getLoginUser()), "/manager/log_view");
    }

}
