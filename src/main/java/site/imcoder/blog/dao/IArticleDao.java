package site.imcoder.blog.dao;

import site.imcoder.blog.common.PageUtil;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.User;

import java.util.List;
import java.util.Map;

/**
 * 数据处理层接口
 *
 * @author dengchao
 */
public interface IArticleDao {

    /**
     * 保存文章
     *
     * @param article
     * @return 如果成功返回    文章id在对象article里
     * 如果失败返回0
     */
    public int save(Article article);

    /**
     * 更新文章
     *
     * @param article
     * @return
     */
    public int update(Article article);

    /**
     * 打开文章
     *
     * @param aid
     * @return
     */
    public Article find(Long aid);

    /**
     * 查找文章数量 根据条件
     *
     * @param condition
     * @param loginUser
     * @return
     */
    public int findCount(Article condition, User loginUser);

    /**
     * 查找文章列表
     *
     * @param page
     * @param condition
     * @param loginUser
     * @return
     */
    public List<Article> findList(PageUtil page, Article condition, User loginUser);

    /**
     * 删除文章
     *
     * @param article
     * @return
     */
    public int delete(Article article);

    /**
     * 点击量加1
     *
     * @param article
     * @param step    - 步长，可为负数
     * @return
     */
    public int updateArticleClickCount(Article article, int step);

    /**
     * 收藏量量加1
     *
     * @param article
     * @param step    - 步长，可为负数
     * @return
     */
    public int updateArticleCollectCount(Article article, int step);

    /**
     * 评论量加1
     *
     * @param article
     * @param step    - 步长，可为负数
     * @return
     */
    public int updateArticleCommentCount(Article article, int step);

    /**
     * 获得置顶列表
     *
     * @param size      列表数量
     * @param loginUser
     * @return List<Article>
     */
    public List<Article> findTopArticleList(int size, User loginUser);

    /**
     * 获得排行榜列表
     *
     * @param uid  是否查询所有还是单个 uid=0 为查询所有
     * @param size list长度 默认5
     * @return Map<String,Object>
     */
    public Map<String, Object> findRankList(int uid, int size);

}