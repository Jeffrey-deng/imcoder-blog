package site.imcoder.blog.service;

import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;


public interface IArticleService {

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
    public IResponse getCreateConfigInfo(IRequest iRequest);

    /**
     * description:保存文章
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * article：文章
     * status - 200：成功，400: 参数错误，401：需要登录，500: 失败
     */
    public IResponse saveArticle(Article article, IRequest iRequest);

    /**
     * 更新文章
     *
     * @param article
     * @param iRequest
     * @return ResponseEntity
     * article：文章
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此文章，500: 失败
     */
    public IResponse updateArticle(Article article, IRequest iRequest);

    /**
     * 打开文章
     *
     * @param article
     * @param isNeedAdjacentArticle 是否一起返回文章的相邻文章信息
     * @param iRequest              (to check AUTH)
     * @return IResponse:
     * article:文章
     */
    public IResponse findArticle(Article article, boolean isNeedAdjacentArticle, IRequest iRequest);

    /**
     * 打开文章
     *
     * @param article
     * @param iRequest (to check AUTH) attr:
     *                 <p>{Boolean} isNeedAdjacentArticle - 是否一起返回文章的相邻文章信息</p>
     * @return IResponse:
     * article:文章
     */
    public IResponse findArticle(Article article, IRequest iRequest);

    /**
     * 查找文章列表，分页
     *
     * @param condition article查找条件
     * @param pageSize  每页篇数
     * @param pageNum   跳转页
     * @param iRequest  发送请求的用户 用来判断权限
     * @return IResponse:
     * articles 文章列表,
     * page 分页bean
     */
    public IResponse findArticleList(Article condition, int pageSize, int pageNum, IRequest iRequest);

    /**
     * 查找文章列表, 不分页
     *
     * @param condition
     * @param iRequest
     * @return IResponse:
     * articles 文章列表
     */
    public IResponse findArticleList(Article condition, IRequest iRequest);

    /**
     * 删除文章
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此文章，500: 失败
     */
    public IResponse deleteArticle(Article article, IRequest iRequest);

    /**
     * 点赞文章
     *
     * @param article  - 只需传aid
     * @param undo     - 是否取消赞
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    public IResponse likeArticle(Article article, boolean undo, IRequest iRequest);

    /**
     * 得到每种分类的数量
     *
     * @param iRequest:
     * @return IResponse:
     * categories
     */
    public IResponse findCategoryCount(IRequest iRequest);

    /**
     * description: 获得置顶列表
     *
     * @param size     列表数量
     * @param iRequest
     * @return IResponse:
     * articles
     */
    public IResponse findTopArticleList(int size, IRequest iRequest);

    /**
     * description:获得排行榜列表
     *
     * @param uid      是否查询所有还是单个用户 uid=0 为查询所有
     * @param size     list长度 默认5
     * @param iRequest
     * @return IResponse:
     * clickRankList
     * newestList
     * hotTagList
     */
    public IResponse findRankingList(Long uid, int size, IRequest iRequest);

    /**
     * 获取文章标签列表，按文章数量降序排序
     *
     * @param hostUser 文章作者，为null,查询所有
     * @param size     列表长度，为0返回全部
     * @param iRequest
     * @return IResponse:
     * {List<Entry<String, Integer>>} tags
     */
    public IResponse findTagList(User hostUser, int size, IRequest iRequest);

    /**
     * 图片或附件上传
     *
     * @param file
     * @param originName 源文件名
     * @param isImage    是否是图片
     * @param iRequest
     * @return IResponse:
     * image_url:
     * width:
     * height:
     * file_url:
     */
    public IResponse uploadAttachment(MultipartFile file, String originName, String isImage, IRequest iRequest);

    /**
     * 互联网图片本地化
     *
     * @param url
     * @param originName
     * @param iRequest
     * @return IResponse:
     * image_url:
     * width:
     * height:
     * file_url:
     */
    public IResponse uploadImageFromURL(String url, String originName, IRequest iRequest);

    /**
     * 删除文件
     *
     * @param file_url
     * @param isImage  是否时图片
     * @param iRequest
     * @return IResponse:
     * status: [200:服务器删除成功] [404:文章插入的图片为链接，不需要删除，返回成功] [500:图片删除失败]
     */
    public IResponse deleteAttachment(String file_url, String isImage, IRequest iRequest);

    /**
     * 查询文章的历史用户动作记录
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * articleActionRecords
     * article_action_record_count
     * article
     */
    public IResponse findArticleActionRecordList(Article article, IRequest iRequest);

}
