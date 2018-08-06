package site.imcoder.blog.controller;

import org.apache.log4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.RedirectView;
import site.imcoder.blog.Interceptor.LoginRequired;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.controller.propertyeditors.IntEditor;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.Category;
import site.imcoder.blog.entity.Comment;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.IArticleService;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * description: 文章控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/article.do")
public class ArticleController {

    private static Logger logger = Logger.getLogger(ArticleController.class);

    //依赖注入[service]
    @Resource
    private IArticleService articleService;

    @Resource
    private IUserService userService;

    @Resource
    private IFileService fileService;

    @Resource
    private Cache cache;

    @RequestMapping()
    public ModelAndView defaultHandle() {
        RedirectView redirectView = new RedirectView("article.do?method=list", true);
        redirectView.setStatusCode(HttpStatus.MOVED_PERMANENTLY);
        return new ModelAndView(redirectView);
    }

    /**
     * 保存文章
     *
     * @param article
     * @param category
     * @param flag
     * @param session
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此文章，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=save")
    @ResponseBody
    public Map<String, Object> save(Article article, Category category, String flag, HttpSession session) {
        Map<String, Object> map = new HashMap<>();
        User loginUser = (User) session.getAttribute("loginUser");
        article.setCategory(category);
        article.setAuthor(loginUser);
        int status = 0;
        if (flag != null && flag.equals("update")) {
            status = articleService.update(article, loginUser);
        } else {
            status = articleService.save(article, loginUser);
        }
        map.put("flag", status);
        convertStatusCodeToWord(map, "flag", "info");
        if (status == 200) {
            map.put("aid", article.getAid());
        }
        //还原过期时间
        session.setMaxInactiveInterval(30 * 60);

        return map;
    }

    /**
     * 打开文章
     *
     * @param mv
     * @param aid
     * @param session
     * @return
     */
    @RequestMapping(params = "method=detail")
    public ModelAndView detail(ModelAndView mv, int aid, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> queryMap = articleService.detail(aid, loginUser);
        Article article = (Article) queryMap.get("article");
        int flag = (int) queryMap.get("flag");
        if (flag == 401) {
            mv.addObject("http_code", 403);
            mv.setViewName("/error/403");
        } else if (flag == 404) {
            mv.addObject("errorInfo", "该文章不存在，请检查请求参数！");
            mv.setViewName("/error/404_detail");
        } else if (flag == 403) {
            mv.setViewName("/error/403");
        } else {
            //为文章访问次数加1 同一个session多次访问只算一次
            @SuppressWarnings("unchecked")
            List<Integer> openedArticle = (List<Integer>) session.getAttribute("openedArticle");
            if (openedArticle == null) {
                openedArticle = new ArrayList<Integer>();
                session.setAttribute("openedArticle", openedArticle);
            }
            if (!openedArticle.contains(aid)) {
                openedArticle.add(aid);
                userService.hasClickArticle(loginUser, article);
            }
            mv.addObject("article", article);
            mv.addObject("preArticle", queryMap.get("preArticle"));
            mv.addObject("nextArticle", queryMap.get("nextArticle"));
            mv.addObject("categoryCount", articleService.getCategoryCount());
            //不是ajax返回不需要加contextPath
            mv.setViewName("/article/article_detail");
        }
        return mv;
    }

    /**
     * ajax获取文章
     *
     * @param session
     * @param aid
     * @return map (article:文章，flag：{200, 401, 403：无权限，404：无此文章})
     */
    @RequestMapping(params = "method=getArticle")
    @ResponseBody
    public Map<String, Object> getArticle(HttpSession session, @RequestParam(defaultValue = "0") int aid) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> queryMap = articleService.detail(aid, loginUser);
        convertStatusCodeToWord(queryMap, "flag", "info");
        if (((int) queryMap.get("flag")) == 404) {
            queryMap.put("info", "无此文章");
        }
        return queryMap;
    }

    /**
     * 跳转到编辑 flag=new : jump to article_edit.jsp / flag=update : jump to article_update.jsp
     */
    @RequestMapping(params = "method=edit")
    public ModelAndView edit(HttpSession session, HttpServletRequest request, ModelAndView mv,
                             @RequestParam(defaultValue = "new") String flag, @RequestParam(defaultValue = "0") int aid) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (flag.equals("update")) {
            Map<String, Object> map = articleService.detail(aid, loginUser);
            int status = (int) map.get("flag");
            Article article = ((Article) map.get("article"));
            if (status == 200) {
                if (loginUser == null) {
                    status = 401;
                } else if (loginUser.getUid() != article.getAuthor().getUid()) {
                    status = 403;
                } else {
                    //提高session过期时间，防止编辑时间过长而使session过期
                    session.setMaxInactiveInterval(60 * 60);
                    mv.setViewName("/article/article_edit");
                    return mv;
                }
            }
            if (status == 404) {
                mv.setViewName("/error/404");
            } else if (status == 401) {
                if (article == null) {
                    mv.setViewName("/site/login");
                } else {
                    mv.addObject("user", article.getAuthor());
                    mv.setViewName("/site/lockscreen");
                }
            } else if (status == 403) {
                mv.setViewName("/error/403");
            }
        } else if (flag.equals("new")) {
            if (loginUser != null) {
                //提高session过期时间，防止编辑时间过长而使session过期
                session.setMaxInactiveInterval(60 * 60);
                mv.setViewName("/article/article_edit");
            } else {
                mv.setViewName("/site/login");
            }
        } else {
            RedirectView redirectView = new RedirectView("article.do?method=edit", true);
            mv = new ModelAndView(redirectView);
        }
        return mv;
    }

    /**
     * 查询文章列表
     *
     * @param jumpPage  跳转页
     * @param condition 条件article
     * @param session
     * @return 通过权限检查的列表
     */
    @RequestMapping(params = "method=list")
    public String list(@RequestParam(defaultValue = "5") int pageSize, @RequestParam(defaultValue = "1") int jumpPage, Article condition, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");

        Map<String, Object> map = articleService.list(pageSize, jumpPage, condition, loginUser);
        List<Category> categoryCount = articleService.getCategoryCount();

        if (map != null) {
            request.setAttribute("articleList", map.get("articleList"));
            request.setAttribute("page", map.get("page"));
        }
        request.setAttribute("condition", condition);
        request.setAttribute("categoryCount", categoryCount);

        if (condition.getCategory() != null) {
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

    //添加评论
    @LoginRequired
    @RequestMapping(params = "method=addComment")
    @ResponseBody
    public Map<String, Object> addComment(Comment comment, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = articleService.addComment(comment, loginUser);
        map.put("flag", flag);
        convertStatusCodeToWord(map, "flag", "info");
        return map;
    }

    /**
     * 请求评论列表
     */
    @RequestMapping(params = "method=listComment")
    @ResponseBody
    public List<Comment> listComment(int aid) {
        List<Comment> commentList = articleService.findCommentList(aid);
        return commentList;
    }

    //删除评论
    @LoginRequired
    @RequestMapping(params = "method=deleteComment")
    @ResponseBody
    public Map<String, Object> deleteComment(Comment comment, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = articleService.deleteComment(comment, loginUser);
        map.put("flag", flag);
        convertStatusCodeToWord(map, "flag", "info");
        return map;
    }

    /**
     * 置顶文章列表
     *
     * @param size 指定需要的置顶文章数量
     * @return ajax
     */
    @RequestMapping(params = "method=listTops")
    @ResponseBody
    public List<Article> listTops(@RequestParam(defaultValue = "0") int size) {
        if (size == 0) {
            size = Config.getInt(ConfigConstants.ARTICLE_HOME_SIZE_TOP);
        }
        List<Article> articleList = articleService.listTops(size);
        return articleList;
    }

    /**
     * description:获得排行榜列表
     *
     * @param uid  是否查询所有还是单个 uid=0 为查询所有
     * @param size list长度 默认5
     * @return {clickRankList, newestList, hotTagList}
     */
    @RequestMapping(params = "method=ranking_list")
    @ResponseBody
    public Map<String, Object> ranking_list(@RequestParam(defaultValue = "0") int uid, @RequestParam(defaultValue = "0") int size) {
        if (size == 0) {
            size = Config.getInt(ConfigConstants.ARTICLE_HOME_SIZE_RANK);
        }
        return articleService.listRanking(uid, size);
    }

    /**
     * 文章删除接口
     *
     * @param article      文章id
     * @param validateCode 验证码
     * @param session      登陆
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此文章，500: 失败
     * info - 提示
     */
    @LoginRequired
    @RequestMapping(params = "method=delete")
    @ResponseBody
    public Map<String, Object> delete(Article article, String validateCode, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        if (validateCode != null && validateCode.equalsIgnoreCase((String) (session.getAttribute("validateCode")))) {
            int flag = articleService.delete(article, loginUser);
            map.put("flag", flag);
            convertStatusCodeToWord(map, "flag", "info");
            return map;
        } else {
            map.put("flag", 403);
            map.put("info", "验证码错误");
        }
        return map;
    }

    /**
     * 图片或附件上传
     *
     * @param file
     * @param fileName 重命名名字
     * @param isImage  是否是图片
     * @param request
     * @param session
     * @return flag - 200：成功，400: 参数错误，401：需要登录，500: 失败
     * info - 提示
     */
    @LoginRequired
    @RequestMapping(params = "method=uploadAttachment")
    @ResponseBody
    public Map<String, Object> uploadAttachment(@RequestParam(value = "file", required = false) MultipartFile file, String fileName, String isImage, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = articleService.uploadAttachment(file, fileName, isImage, loginUser);
        int flag = (int) map.get("flag");
        if (flag == 400) {
            map.put("info", "文件为空，或你网络问题");
        } else if (flag == 401) {
            map.put("info", "你未登录，或登录状态失效");
        } else if (flag == 500) {
            map.put("info", "服务器异常");
        } else if (flag == 200) {
            map.put("info", "上传成功");
        }
        return map;
    }

    /**
     * 互联网图片本地化
     *
     * @param url
     * @param fileName
     * @param request
     * @return
     */
    @LoginRequired
    @RequestMapping(params = "method=localImage")
    @ResponseBody
    public Map<String, Object> localImage(String url, String fileName, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = articleService.localImage(url, fileName, loginUser);
        int flag = (int) map.get("flag");
        if (flag == 400) {
            map.put("info", "链接为空");
        } else if (flag == 401) {
            map.put("info", "你未登录，或登录状态失效");
        } else if (flag == 500) {
            map.put("info", "图片下载失败,或该网站禁止下载");
        } else if (flag == 200) {
            map.put("info", "成功");
        }
        return map;
    }

    /**
     * 删除文件
     *
     * @param file_url
     * @param isImage  是否时图片
     * @param request
     * @return flag: [200:服务器删除成功] [404:文章插入的图片为链接，不需要删除，返回成功] [500:图片删除失败]
     */
    @LoginRequired
    @RequestMapping(params = "method=deleteAttachment")
    @ResponseBody
    public Map<String, Object> deleteAttachment(String file_url, String isImage, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = articleService.deleteAttachment(file_url, isImage, loginUser);
        int flag = (int) map.get("flag");
        if (flag == 200) {
            map.put("info", "删除成功");
        } else if (flag == 400) {
            map.put("info", "链接为空");
        } else if (flag == 401) {
            map.put("info", "你未登录，或登录状态失效");
        } else if (flag == 404) {
            map.put("info", "链接为空文件不存在 或 该链接不属于本站");
        } else if (flag == 500) {
            map.put("info", "错误");
        }
        return map;
    }

    //注册类型转换
    @InitBinder
    protected void initBinder(WebDataBinder binder) {
        //binder.registerCustomEditor(Date.class, new CustomDateEditor(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"), true));
        binder.registerCustomEditor(int.class, new IntEditor());
    }

    private void convertStatusCodeToWord(Map<String, Object> map, String codeKey, String wordKey) {
        int flag = (Integer) map.get(codeKey);
        if (flag == 200) {
            map.put(wordKey, "成功");
        } else if (flag == 400) {
            map.put(wordKey, "参数错误");
        } else if (flag == 401) {
            map.put(wordKey, "需要登录");
        } else if (flag == 403) {
            map.put(wordKey, "没有权限");
        } else if (flag == 404) {
            map.put(wordKey, "无此记录");
        } else {
            map.put(wordKey, "服务器错误");
        }
    }
}
