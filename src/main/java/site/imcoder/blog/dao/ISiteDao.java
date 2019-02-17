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
     * 查询所有的用户组信息
     *
     * @return
     */
    public List<UserGroup> findUserGroupList();

    /**
     * 更换用户组
     *
     * @param user 需要参数：user.uid, user.userGroup.gid
     * @return
     */
    public int updateUserGroup(User user);

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

    /**
     * 加载相册列表
     *
     * @param user 为null查找所有
     * @return
     */
    public List<Album> loadAlbumTable(User user);

    /**
     * 加载照片列表
     *
     * @param album 为null查找所有
     * @return
     */
    public List<Photo> loadPhotoTable(Album album);

    /**
     * 加载视频列表
     *
     * @param user 为null查找所有
     * @return
     */
    public List<Video> loadVideoTable(User user);

    /**
     * 更新文章中的文件相对路径
     *
     * @param oldPath
     * @param newPath
     * @return
     */
    public int updateArticleFilePath(String oldPath, String newPath);
}
