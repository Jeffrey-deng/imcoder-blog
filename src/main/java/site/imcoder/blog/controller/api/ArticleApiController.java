package site.imcoder.blog.controller.api;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.SessionAttribute;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.Interceptor.annotation.GZIP;
import site.imcoder.blog.Interceptor.annotation.LoginRequired;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.resolver.annotation.BindNullIfEmpty;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.service.IArticleService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;

/**
 * description: 文章控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/article.api")
public class ArticleApiController extends BaseController {

    private static Logger logger = Logger.getLogger(ArticleApiController.class);

    //依赖注入[service]
    @Resource
    private IArticleService articleService;

    @Resource
    private Cache cache;

    /**
     * 得到文章上传的配置信息
     *
     * @param iRequest
     * @return IResponse:
     * <pre>
     * allowCreateLowestLevel
     * isAllowCreate
     * uploadArgs
     *   mode
     *   maxPhotoUploadSize
     *   maxVideoUploadSize
     * </pre>
     */
    @RequestMapping(params = "method=getCreateConfigInfo")
    @ResponseBody
    public IResponse getCreateConfigInfo(IRequest iRequest) {
        return articleService.getCreateConfigInfo(iRequest);
    }

    /**
     * 保存文章
     *
     * @param article
     * @param mark
     * @param inform
     * @param session
     * @param iRequest
     * @return IResponse:
     * article：文章
     * status - 200：成功，400: 参数错误，401：需要登录，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=save")
    @ResponseBody
    public IResponse saveArticle(Article article, String mark, @RequestParam(defaultValue = "false") boolean inform, HttpSession session, IRequest iRequest) {
        IResponse response = null;
        iRequest.putAttr("inform", inform);
        if (mark != null && mark.equals("update")) {
            response = articleService.updateArticle(article, iRequest);
        } else {
            response = articleService.saveArticle(article, iRequest);
        }
        // 还原过期时间
        session.setMaxInactiveInterval(30 * 60);
        return response;
    }

    /**
     * 获取文章
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * article:文章
     */
    @RequestMapping(params = "method=getArticle")
    @ResponseBody
    @GZIP
    public IResponse getArticle(Article article, IRequest iRequest) {
        return articleService.findArticle(article, iRequest);
    }

    /**
     * 通过Ajax查询文章列表
     *
     * @param condition 条件article
     * @param iRequest
     * @return IResponse:
     * articles 文章列表
     */
    @RequestMapping(params = "method=getArticleList")
    @ResponseBody
    @GZIP
    public IResponse getArticleList(@BindNullIfEmpty Article condition, IRequest iRequest) {
        return articleService.findArticleList(condition, iRequest);
    }

    /**
     * 置顶文章列表
     *
     * @param size     指定需要的置顶文章数量
     * @param iRequest
     * @return IResponse:
     * articles
     */
    @RequestMapping(params = "method=getTopArticles")
    @ResponseBody
    public IResponse getTopArticles(@RequestParam(defaultValue = "0") int size, IRequest iRequest) {
        return articleService.findTopArticles(size, iRequest);
    }

    /**
     * description:获得排行榜列表
     *
     * @param uid      是否查询所有还是单个 uid=0 为查询所有
     * @param size     list长度 默认5
     * @param iRequest
     * @return IResponse:
     * clickRankList
     * newestList
     * hotTagList
     */
    @RequestMapping(params = "method=getRankingList")
    @ResponseBody
    public IResponse getRankingList(@RequestParam(defaultValue = "0") @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid,
                                    @RequestParam(defaultValue = "0") int size,
                                    IRequest iRequest) {
        return articleService.findRankingList(uid, size, iRequest);
    }

    /**
     * 文章删除接口
     *
     * @param article         文章id
     * @param validateCode    验证码
     * @param memValidateCode
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此文章，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=delete")
    @ResponseBody
    public IResponse deleteArticle(Article article,
                                   String validateCode,
                                   @SessionAttribute(value = "validateCode", required = false) String memValidateCode,
                                   IRequest iRequest) {
        IResponse response = new IResponse();
        if (validateCode != null && validateCode.equalsIgnoreCase(memValidateCode)) {
            response = articleService.deleteArticle(article, iRequest);
        } else {
            response.setStatus(STATUS_FORBIDDEN, "验证码错误");
        }
        return response;
    }

    /**
     * 图片或附件上传
     *
     * @param file
     * @param fileName 重命名名字
     * @param isImage  是否是图片
     * @param iRequest
     * @return IResponse:
     * image_url:
     * width:
     * height:
     * file_url:
     */
    @LoginRequired
    @RequestMapping(params = "method=uploadAttachment")
    @ResponseBody
    public IResponse uploadAttachment(
            @RequestParam(value = "file", required = false) MultipartFile file,
            String fileName,
            String isImage,
            IRequest iRequest) {
        return articleService.uploadAttachment(file, fileName, isImage, iRequest);
    }

    /**
     * 互联网图片本地化
     *
     * @param url
     * @param fileName
     * @param iRequest
     * @return IResponse:
     * image_url:
     * width:
     * height:
     * file_url:
     */
    @LoginRequired
    @RequestMapping(params = "method=uploadImageFromURL")
    @ResponseBody
    public IResponse uploadImageFromURL(String url, String fileName, IRequest iRequest) {
        return articleService.uploadImageFromURL(url, fileName, iRequest);
    }

    /**
     * 删除文件
     *
     * @param file_url
     * @param isImage  是否时图片
     * @param iRequest
     * @return flag: [200:服务器删除成功] [404:文章插入的图片为链接，不需要删除，返回成功] [500:图片删除失败]
     */
    @LoginRequired
    @RequestMapping(params = "method=deleteAttachment")
    @ResponseBody
    public IResponse deleteAttachment(String file_url, String isImage, IRequest iRequest) {
        return articleService.deleteAttachment(file_url, isImage, iRequest);
    }

    /**
     * 查询文章的用户动作记录
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * articleActionRecords
     * article_action_record_count
     * article
     */
    @LoginRequired
    @RequestMapping(params = "method=getArticleActionRecordList")
    @ResponseBody
    @GZIP
    public IResponse getArticleActionRecordList(Article article, IRequest iRequest) {
        return articleService.findArticleActionRecordList(article, iRequest);
    }

}
