package site.imcoder.blog.service;

import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.Category;
import site.imcoder.blog.entity.User;

import java.util.List;
import java.util.Map;


public interface IArticleService {

    /**
     * 得到文章上传的配置信息
     *
     * @param loginUser
     * @return
     */
    public Map<String, Object> getCreateConfigInfo(User loginUser);

    /**
     * description:保存文章
     *
     * @param article
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，500: 失败
     */
    public int save(Article article, User loginUser);

    /**
     * 更新文章
     *
     * @param article
     * @return
     */
    /**
     * @param article
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此文章，500: 失败
     */
    public int update(Article article, User loginUser);

    /**
     * 打开文章
     *
     * @param aid
     * @param loginUser (to check AUTH)
     * @return map (article:文章，flag：{200, 401, 403：无权限，404：无此文章})
     */
    public Map<String, Object> detail(int aid, User loginUser);

    /**
     * 查找文章列表，分页
     *
     * @param pageSize  每页篇数
     * @param jumpPage  跳转页
     * @param condition article查找条件
     * @param loginUser 发送请求的用户 用来判断权限
     * @return 文章列表, 分页bean
     */
    public Map<String, Object> list(int pageSize, int jumpPage, Article condition, User loginUser);

    /**
     * 查找文章列表, 不分页
     *
     * @param condition
     * @param loginUser
     * @return
     */
    public List<Article> list(Article condition, User loginUser);

    /**
     * 删除文章
     *
     * @param article
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此文章，500: 失败
     */
    public int delete(Article article, User loginUser);

    /**
     * 得到每种分类的数量
     *
     * @return
     */
    public List<Category> getCategoryCount();

    /**
     * description: 获得置顶列表
     *
     * @param size 列表数量
     * @return List<Article>
     */
    public List<Article> listTops(int size);

    /**
     * description:获得排行榜列表
     *
     * @param uid  是否查询所有还是单个用户 uid=0 为查询所有
     * @param size list长度 默认5
     * @return Map<String, List>
     */
    public Map<String, Object> listRanking(int uid, int size, User loginUser);

    /**
     * 获取文章标签列表，按文章数量降序排序
     *
     * @param hostUser  文章作者，为null,查询所有
     * @param size      列表长度，为0返回全部
     * @param loginUser
     * @return
     */
    public List<Map.Entry<String, Integer>> findTagList(User hostUser, int size, User loginUser);

    /**
     * 图片或附件上传
     *
     * @param file
     * @param fileName  重命名名字
     * @param isImage   是否是图片
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，500: 失败
     * info - 提示
     */

    public Map<String, Object> uploadAttachment(MultipartFile file, String fileName, String isImage, User loginUser);

    /**
     * 互联网图片本地化
     *
     * @param url
     * @param fileName
     * @param loginUser
     * @return
     */
    public Map<String, Object> localImage(String url, String fileName, User loginUser);

    /**
     * 删除文件
     *
     * @param file_url
     * @param isImage   是否时图片
     * @param loginUser
     * @return flag: [200:服务器删除成功] [404:文章插入的图片为链接，不需要删除，返回成功] [500:图片删除失败]
     */
    public Map<String, Object> deleteAttachment(String file_url, String isImage, User loginUser);
}
