package site.imcoder.blog.dao;

import site.imcoder.blog.entity.*;

import java.util.List;

/**
 * 站点和统计类持久化接口
 *
 * @author dengchao
 * @date 2017-3-23
 */
public interface ISiteDao {

    /**
     * 文章的基本信息
     */
    public List<Article> findArticleBaseList();


    /**
     * 持久化文章缓存
     */
    public int saveArticleBuffer(List<Article> articleList);


    /**
     * 得到每种文章类型的数量集合
     */
    public List<Category> getCategoryCount();

    /**
     * 得到user表
     */
    public List<User> loadUserTable();

    /**
     * 得到Friend表
     */
    public List<Friend> loadFriendTable();

    /**
     * 得到user_follow表
     */
    public List<Follow> loadFollowTable();

    /**
     * 管理员更新文章基本信息
     *
     * @param article
     * @return
     */
    public int updateArticleInfoByManager(Article article);


    public int saveSystemMessage(SysMsg sysMsg);

    /**
     * 清除系统消息未读状态
     *
     * @param smIdList
     * @return
     */
    public int updateSystemMessageStatus(List<Integer> smIdList);
}
