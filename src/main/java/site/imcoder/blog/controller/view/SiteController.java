package site.imcoder.blog.controller.view;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import site.imcoder.blog.Interceptor.annotation.AccessRecord;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.UserGroupType;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.UserGroup;
import site.imcoder.blog.service.IArticleService;
import site.imcoder.blog.service.ISiteService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;

/**
 * description: 站点控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
public class SiteController extends BaseController {

    //依赖注入[service]
    @Resource
    private IArticleService articleService;

    @Resource
    private IUserService userService;

    @Resource
    private ISiteService siteService;

    /**
     * 查询公告列表
     *
     * @param size      每页数量
     * @param page      跳转页
     * @param condition 条件
     * @param model
     * @param iRequest
     * @return 通过权限检查的列表
     */
    @RequestMapping(value = "/notices")
    public String listNotices(Article condition,
                              @RequestParam(defaultValue = "5") int size, @RequestParam(defaultValue = "1") int page,
                              Model model, IRequest iRequest) {
        condition.setTags("公告|notice");
        User author = new User();
        author.setUserGroup(new UserGroup(UserGroupType.MANAGER.value));
        condition.setAuthor(author);
        IResponse articlesResp = articleService.findArticleList(condition, size, page, iRequest);
        if (articlesResp.isSuccess()) {
            model.addAttribute("articleList", articlesResp.getAttr("articles"));
            model.addAttribute("page", articlesResp.getAttr("page"));
        }
        model.addAttribute("condition", condition);
        return "/site/notices";
    }

    // 公告页
    @RequestMapping(value = "/notice/{id}")
    @AccessRecord(type = AccessRecord.Types.ARTICLE, key = "article")
    public String notice(@PathVariable @PrimaryKeyConvert Long id, Model model, IRequest iRequest) {
        IResponse articleResp = articleService.findArticle(new Article(id), iRequest);
        Article article = articleResp.getAttr("article");
        String page;
        if (articleResp.equalsStatus(STATUS_NOT_LOGIN)) {
            model.addAttribute("http_code", 401);
            page = PAGE_LOGIN;
        } else if (articleResp.equalsStatus(STATUS_NOT_FOUND)) {
            page = setNotFoundInfo(model, "该公告不存在~");
        } else if (articleResp.equalsStatus(STATUS_FORBIDDEN)) {
            page = PAGE_FORBIDDEN_ERROR;
        } else if (articleResp.isSuccess() && article.getAuthor().getUserGroup().isManager() && article.getTags() != null && article.getTags().matches(".*(公告|notice).*")) {
            model.addAttribute("article", article);
            page = "/site/site_board";
        } else {
            page = setNotFoundInfo(model, "该公告不存在~");
        }
        return page;
    }

    // 关于页
    @RequestMapping(value = "/about")
    @AccessRecord(type = AccessRecord.Types.ARTICLE, key = "article")
    public String about(Model model, IRequest iRequest) {
        Long aid = IdUtil.convertToLongPrimaryKey(Config.get(ConfigConstants.SITE_ABOUT_ARTICLE_ID));
        IResponse articleResp = articleService.findArticle(new Article(aid), iRequest);
        if (articleResp.isSuccess()) {
            model.addAllAttributes(articleResp.getAttr());
        } else if (articleResp.equalsStatus(STATUS_NOT_LOGIN)) {
            model.addAttribute("http_code", 401);
        } else if (articleResp.equalsStatus(STATUS_NOT_FOUND)) {
            model.addAttribute(KEY_ERROR_INFO, "站点还未设置关于页~");
        }
        return getViewPage(articleResp, "/site/site_board");
    }

    // 帮助页
    @RequestMapping(value = {"/help", "/help/{module}"})
    @AccessRecord(type = AccessRecord.Types.ARTICLE, key = "article")
    public String help(@PathVariable(required = false) String module, Model model, IRequest iRequest) {
        Long aid;
        String value = Utils.isEmpty(module) ?
                Config.getChildDefault(ConfigConstants.SITE_HELP_ARTICLE_ID, "@") :
                Config.getChildNotDefault(ConfigConstants.SITE_HELP_ARTICLE_ID, "@", module, ":");
        if (value == null || value.length() == 0 || value.equals("0")) {
            return setNotFoundInfo(model, "站点还未设置" + (Utils.isEmpty(module) ? "" : module) + "帮助页~");
        } else {
            aid = IdUtil.convertToLongPrimaryKey(value);
        }
        IResponse articleResp = articleService.findArticle(new Article(aid), iRequest);
        if (articleResp.isSuccess()) {
            model.addAllAttributes(articleResp.getAttr());
        } else if (articleResp.equalsStatus(STATUS_NOT_LOGIN)) {
            model.addAttribute("http_code", 401);
        } else if (articleResp.equalsStatus(STATUS_NOT_LOGIN)) {
            model.addAttribute(KEY_ERROR_INFO, "帮助页不见了~ 请联系管理员");
        }
        return getViewPage(articleResp, "/site/site_board");
    }

}
