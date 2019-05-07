package site.imcoder.blog.controller.view.old;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.servlet.http.HttpServletRequest;

/**
 * description: 站点控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/site")
public class OldSiteController extends BaseController {

    @RequestMapping()
    public ModelAndView defaultHandle(HttpServletRequest request) {
        String path = Utils.getRequestPath(request);
        ModelAndView mv = new ModelAndView();
        if (path.matches("^/[^/]*/?$") && !"XMLHttpRequest".equals(request.getHeader("X-Requested-With"))) {
            buildRedirectView(mv, "/about", Config.getInt(ConfigConstants.SITE_OLD_PAGE_REDIRECT_CODE));
        } else {
            mv.setViewName(PAGE_NOT_FOUND_ERROR);
        }
        return mv;
    }

    /**
     * 查询公告列表
     */
    @RequestMapping(value = "notices")
    public ModelAndView listNotices(IRequest iRequest) {
        return getModelAndView("/notices" + appendQueryString(iRequest.getQueryString()));
    }

    // 公告页
    @RequestMapping(value = "notice")
    public ModelAndView notice(@RequestParam(defaultValue = "0") int id, IRequest iRequest) {
        String notice_id = IdUtil.convertToShortPrimaryKey(IdUtil.convertOldPrimaryKeyToNew(id));
        return getModelAndView("/notice/" + notice_id + appendQueryString(iRequest.getQueryString().replaceFirst("(^|&)id=\\d+", "")));
    }

    // 关于页
    @RequestMapping(value = "about")
    public ModelAndView about(IRequest iRequest) {
        return getModelAndView("/about" + appendQueryString(iRequest.getQueryString()));
    }

    // 帮助页
    @RequestMapping(value = "help")
    public ModelAndView help(String module) {
        if (Utils.isEmpty(module)) {
            return getModelAndView("/help");
        } else {
            return getModelAndView("/help/" + Utils.encodeURL(module));
        }
    }

    private ModelAndView getModelAndView(String page) {
        return buildRedirectView(page, Config.getInt(ConfigConstants.SITE_OLD_PAGE_REDIRECT_CODE));
    }

}
