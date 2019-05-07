package site.imcoder.blog.controller.view.old;

import org.apache.log4j.Logger;
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
 * description: 文章控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/article")
public class OldArticleController extends BaseController {

    private static Logger logger = Logger.getLogger(OldArticleController.class);

    @RequestMapping()
    public ModelAndView defaultHandle(HttpServletRequest request) {
        String path = Utils.getRequestPath(request);
        ModelAndView mv = new ModelAndView();
        if (path.matches("^/[^/]*/?$") && !"XMLHttpRequest".equals(request.getHeader("X-Requested-With"))) {
            buildRedirectView(mv, "/a/list", Config.getInt(ConfigConstants.SITE_OLD_PAGE_REDIRECT_CODE));
        } else {
            mv.setViewName(PAGE_NOT_FOUND_ERROR);
        }
        return mv;
    }

    /**
     * 打开文章
     *
     * @param aid
     * @param iRequest
     * @return String
     */
    @RequestMapping(value = "detail")
    public ModelAndView findArticle(@RequestParam(defaultValue = "0") int aid, IRequest iRequest) {
        String id = IdUtil.convertToShortPrimaryKey(IdUtil.convertOldPrimaryKeyToNew(aid));
        return getModelAndView("/a/detail/" + id + appendQueryString(iRequest.getQueryString().replaceFirst("(^|&)aid=\\d+", "")));
    }

    /**
     * 跳转到编辑 mark=new : jump to article_edit.jsp / mark=update : jump to article_update.jsp
     */
    @RequestMapping(value = "edit")
    public ModelAndView edit(@RequestParam(defaultValue = "0") int aid, IRequest iRequest) {
        String id = IdUtil.convertToShortPrimaryKey(IdUtil.convertOldPrimaryKeyToNew(aid));
        return getModelAndView("/a/edit" + appendQueryString(iRequest.getQueryString().replaceFirst("(^|&)aid=\\d+", "") + "&aid=" + id));
    }

    /**
     * 查询文章列表
     */
    @RequestMapping(value = "list")
    public ModelAndView list(IRequest iRequest) {
        return getModelAndView("/a/list" + appendQueryString(iRequest.getQueryString()));
    }

    /**
     * 文章归档页
     */
    @RequestMapping(value = "archives")
    public ModelAndView archives(IRequest iRequest) {
        return getModelAndView("/a/archives" + appendQueryString(iRequest.getQueryString()));
    }

    /**
     * 文章标签页
     */
    @RequestMapping(value = "tags")
    public ModelAndView tags(IRequest iRequest) {
        return getModelAndView("/a/tags" + appendQueryString(iRequest.getQueryString()));
    }

    private ModelAndView getModelAndView(String page) {
        return buildRedirectView(page, Config.getInt(ConfigConstants.SITE_OLD_PAGE_REDIRECT_CODE));
    }
}
