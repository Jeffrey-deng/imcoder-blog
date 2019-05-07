package site.imcoder.blog.dao;

import site.imcoder.blog.common.PageUtil;
import site.imcoder.blog.entity.*;

import java.util.List;
import java.util.Map;

/**
 * 数据处理层接口
 *
 * @author dengchao
 */
public interface IUserDao {

    /**
     * 查询所有用户
     *
     * @return
     */
    public List<User> findUserList(PageUtil pageUtil, User user);

    /**
     * description:保存用户
     *
     * @param user
     * @return 成功则返回 用户id在对象user里
     */
    public int saveUser(User user);


    /**
     * 更新个人资料
     *
     * @param user
     * @return
     */
    public int saveProfile(User user);

    /**
     * 更新账号状态信息
     *
     * @param userStatus
     * @return
     */
    public int updateUserStatus(UserStatus userStatus);

    /**
     * 查询用户BY ID和用户名
     *
     * @param user
     * @return
     */
    public User findUser(User user);

    /**
     * 删除用户
     *
     * @param user
     */
    public int deleteUser(User user);

    /**
     * 根据用户的信息查询总行数
     */
    public int findUserListCount(User user);

    /**
     * 得到用户统计信息 例：关注数，粉丝数，文章数
     *
     * @param user
     * @return
     */
    public Map<String, Object> countUserInfo(User user);

    /**
     * 返回用户的账户设置
     *
     * @param user
     * @return
     */
    public UserSetting findUserSetting(User user);

    /**
     * 更新用户配置
     *
     * @param userSetting
     * @return
     */
    public int updateUserSetting(UserSetting userSetting);

    /**
     * 检查是否为好友
     *
     * @param friend
     * @return 不是返回0 是返回2
     */
    public int checkFriendRelationship(Friend friend);

    /**
     * 查询用户好友 List
     *
     * @param user
     * @return
     */
    public List<User> findFriendList(User user);


    /**
     * 检查是否fansUser关注了hostUser
     *
     * @param follow
     * @return 不是返回0 是返回1
     */
    public int checkFollow(Follow follow);

    /**
     * 关注  相互关注则成为好友
     *
     * @param follow
     * @return 0:插入失败 1关注成功 2成功并成为好友 11重复插入
     */
    public int saveFollow(Follow follow);

    /**
     * 查询关注列表
     *
     * @param user
     * @return
     */
    public List<User> findFollowingList(User user);

    /**
     * 查询粉丝列表
     *
     * @param user
     * @return
     */
    public List<User> findFollowerList(User user);

    /**
     * 删除关注行 如果是好友则随便删除好友行
     *
     * @param follow
     * @return 0:失败 1:成功 2:并删除好友
     */
    public int deleteFollow(Follow follow);

    /**
     * 检查是否loginUser收藏了此文章
     *
     * @param clet
     * @return 不是返回0 是返回1
     */
    public int checkCollection(Collection clet);

    /**
     * 插入用户收藏表行
     *
     * @param clet
     * @return 0 插入失败 1 插入成功 2 已经插入，无须再插入
     */
    public int saveCollection(Collection clet);

    /**
     * 删除用户收藏表行
     */
    public int deleteCollection(Collection clet);

    /**
     * 查找收藏文章列表
     *
     * @param user
     * @return
     */
    public List<Collection> findCollectList(User user);

    /**
     * 保存文章的访问记录
     *
     * @param accessRecord
     * @return
     */
    public int saveArticleAccessRecord(AccessRecord<Article> accessRecord);

    /**
     * 查询文章的访问记录
     *
     * @param accessRecord
     * @return
     */
    public AccessRecord<Article> findArticleAccessRecord(AccessRecord<Article> accessRecord);

    /**
     * 查询文章的访问记录列表
     *
     * @param accessRecord
     * @param loginUser
     * @return
     */
    public List<AccessRecord<Article>> findArticleAccessRecordList(AccessRecord<Article> accessRecord, User loginUser);

    /**
     * 删除文章的访问记录
     *
     * @param accessRecord
     * @return
     */
    public int deleteArticleAccessRecord(AccessRecord<Article> accessRecord);

    /**
     * 保存视频的访问记录
     *
     * @param accessRecord
     * @return
     */
    public int saveVideoAccessRecord(AccessRecord<Video> accessRecord);

    /**
     * 查询视频的的访问记录
     *
     * @param accessRecord
     * @return
     */
    public AccessRecord<Video> findVideoAccessRecord(AccessRecord<Video> accessRecord);

    /**
     * 查询视频的访问记录列表
     *
     * @param accessRecord
     * @param loginUser
     * @return
     */
    public List<AccessRecord<Video>> findVideoAccessRecordList(AccessRecord<Video> accessRecord, User loginUser);

    /**
     * 删除视频的访问记录
     *
     * @param accessRecord
     * @return
     */
    public int deleteVideoAccessRecord(AccessRecord<Video> accessRecord);

    /**
     * 保存照片的访问记录
     *
     * @param accessRecord
     * @return
     */
    public int savePhotoAccessRecord(AccessRecord<Photo> accessRecord);

    /**
     * 查询照片的访问记录
     *
     * @param accessRecord
     * @return
     */
    public AccessRecord<Photo> findPhotoAccessRecord(AccessRecord<Photo> accessRecord);

    /**
     * 查询照片的访问记录列表
     *
     * @param accessRecord
     * @param loginUser
     * @return
     */
    public List<AccessRecord<Photo>> findPhotoAccessRecordList(AccessRecord<Photo> accessRecord, User loginUser);

    /**
     * 删除照片的访问记录
     *
     * @param accessRecord
     * @return
     */
    public int deletePhotoAccessRecord(AccessRecord<Photo> accessRecord);

}
