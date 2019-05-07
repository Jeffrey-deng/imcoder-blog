package site.imcoder.blog.controller.view;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.RedirectView;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.service.ICloudService;
import site.imcoder.blog.service.message.IRequest;

import javax.annotation.Resource;

/**
 * @author Jeffrey.Deng
 * @date 2018-12-17
 */
@Controller
@RequestMapping("/cloud")
public class CloudController extends BaseController {

    @Resource
    private ICloudService cloudService;

    @RequestMapping()
    public ModelAndView defaultHandle(IRequest iRequest) {
        String path = iRequest.getAccessPath();
        ModelAndView mv = new ModelAndView();
        if (path.matches("^/[^/]*/?$")) {
            RedirectView redirectView = new RedirectView("cloud/share", false);
            redirectView.setStatusCode(HttpStatus.MOVED_PERMANENTLY);
            mv.setView(redirectView);
        } else {
            mv.setViewName(PAGE_NOT_FOUND_ERROR);
        }
        return mv;
    }

    @RequestMapping(value = "share")
    public String openShare() {
        return "/cloud/cloud_share";
    }

}
