package site.imcoder.blog.controller;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.RedirectView;

import javax.servlet.http.HttpServletRequest;

/**
 * @author Jeffrey.Deng
 * @date 2018-12-17
 */
@Controller
@RequestMapping("/cloud.do")
public class CloudController extends BaseController {

    @RequestMapping()
    public ModelAndView defaultHandle(HttpServletRequest request) {
        String queryString = request.getQueryString();
        ModelAndView mv = new ModelAndView();
        if (queryString == null || queryString.length() == 0) {
            RedirectView redirectView = new RedirectView("cloud.do?method=share", true);
            redirectView.setStatusCode(HttpStatus.MOVED_PERMANENTLY);
            mv.setView(redirectView);
        } else {
            mv.setViewName(PAGE_NOT_FOUND_ERROR);
        }
        return mv;
    }

    @RequestMapping(params = "method=share")
    public String openShare() {
        return "/cloud/cloud_share";
    }
}
