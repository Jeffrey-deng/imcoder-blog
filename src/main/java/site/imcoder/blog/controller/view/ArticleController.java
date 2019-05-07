package site.imcoder.blog.controller.view;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import site.imcoder.blog.Interceptor.annotation.AccessRecorder;
import site.imcoder.blog.Interceptor.annotation.GZIP;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.type.UserAuthType;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.resolver.annotation.BindNullIfEmpty;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.Category;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.UserAuth;
import site.imcoder.blog.service.IArticleService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;
import java.util.List;

/**
 * description: 文章控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
public class ArticleController extends BaseController {

    private static Logger logger = Logger.getLogger(ArticleController.class);

    //依赖注入[service]
    @Resource
    private IArticleService articleService;

    @Resource
    private IUserService userService;

    @Resource
    private Cache cache;

    /**
     * 打开文章
     *
     * @param aid      - aid
     * @param model
     * @param iRequest
     * @return ModelAndView
     */
    @RequestMapping(value = "/a/detail/{aid}")
    @GZIP
    @AccessRecorder(type = AccessRecorder.Types.ARTICLE, key = "article")
    public String findArticle(@PathVariable @PrimaryKeyConvert Long aid, Model model, IRequest iRequest) {
        IResponse articleResp = articleService.findArticle(new Article(aid), iRequest.putAttr("isNeedAdjacentArticle", true));
        int flag = articleResp.getStatus();
        if (articleResp.isSuccess()) {
            model.addAllAttributes(articleResp.getAttr());
        } else if (flag == STATUS_NOT_LOGIN) {
            model.addAttribute("http_code", 403);
        } else if (flag == STATUS_NOT_FOUND) {
            model.addAttribute(KEY_ERROR_INFO, "该文章不存在，请检查请求参数！");
        }
        return getViewPage(flag, "/article/article_detail");
    }


    /**
     * 跳转到编辑 mark=new : jump to article_edit.jsp / mark=update : jump to article_update.jsp
     */
    @RequestMapping(value = "/a/edit")
    @GZIP
    public String edit(@RequestParam(defaultValue = "new") String mark, @RequestParam(defaultValue = "0") @PrimaryKeyConvert Long aid,
                       Model model, HttpSession session, IRequest iRequest) {
        String page;
        if (mark.equals("update")) {
            IResponse articleResp = articleService.findArticle(new Article(aid), iRequest);
            int status = articleResp.getStatus();
            Article articleInfo = articleResp.getAttr("article");
            if (status == STATUS_SUCCESS) {
                if (iRequest.isHasNotLoggedIn()) {
                    status = STATUS_NOT_LOGIN;
                } else if (!iRequest.getLoginUser().getUid().equals(articleInfo.getAuthor().getUid())) {
                    status = STATUS_FORBIDDEN;
                } else {
                    // 提高session过期时间，防止编辑时间过长而使session过期
                    session.setMaxInactiveInterval(60 * 60);
                    return "/article/article_edit";
                }
            }
            if (status == STATUS_NOT_LOGIN) {
                if (articleInfo == null) {
                    page = PAGE_LOGIN;
                } else {
                    model.addAttribute("user", articleInfo.getAuthor());
                    model.addAttribute("userAuth", new UserAuth(UserAuthType.UID, "" + articleInfo.getAuthor().getUid(), null));
                    page = PAGE_LOGIN_EXPIRED;
                }
            } else {
                page = getErrorPage(status);
            }
        } else if (mark.equals("new")) {
            if (iRequest.isHasLoggedIn()) {
                // 提高session过期时间，防止编辑时间过长而使session过期
                session.setMaxInactiveInterval(60 * 60);
                page = "/article/article_edit";
            } else {
                page = PAGE_LOGIN;
            }
        } else {
            page = "redirect:/a/edit";
        }
        return page;
    }

    /**
     * 查询文章列表
     *
     * @param size      每页数量
     * @param page      跳转页
     * @param condition 条件article
     * @param model
     * @param iRequest
     * @return 通过权限检查的列表
     */
    @RequestMapping(value = "/a/list")
    public String list(@BindNullIfEmpty Article condition,
                       @RequestParam(defaultValue = "5") int size,
                       @RequestParam(defaultValue = "1") int page,
                       Model model, IRequest iRequest) {
        IResponse articleResp = articleService.findArticleList(condition, size, page, iRequest);
        List<Category> categoryCount = articleService.findCategoryCount(iRequest).getAttr("categories");
        if (articleResp.isSuccess()) {
            model.addAttribute("articleList", articleResp.getAttr("articles"));
            model.addAttribute("page", articleResp.getAttr("page"));
        }
        model.addAttribute("condition", condition);
        model.addAttribute("categoryCount", categoryCount);
        if (condition != null && condition.getCategory() != null) {
            int atid = condition.getCategory().getAtid();
            for (Category category : categoryCount) {
                if (category.getAtid() == atid) {
                    condition.getCategory().setAtname(category.getAtname());
                    break;
                }
            }
        }
        return "/site/index";
    }

    /**
     * 文章归档页
     *
     * @param user
     * @param iRequest
     * @return
     */
    @RequestMapping(value = "/a/archives")
    public String archives(User user, IRequest iRequest) {
        return "/article/article_archives";
    }

    /**
     * 文章标签页
     *
     * @param user
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = "/a/tags")
    public String tags(User user, Model model, IRequest iRequest) {
        model.addAttribute("tagList", articleService.findTagList(user, 0, iRequest).getAttr("tags"));
        return "/article/article_tags";
    }

}
