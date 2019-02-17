package site.imcoder.blog.service;

import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.Collection;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.UserSetting;

import java.util.List;
import java.util.Map;

public interface IUserService {

    /**
     * 注册用户
     *
     * @param user
     * @return flag - 200：成功，500: 失败
     */
    public int register(User user);

    /**
     * 根据ID或name email查询用户
     *
     * @param user
     * @param loginUser
     * @return
     */
    public User findUser(User user, User loginUser);

    /**
     * 根据ID查询用户
     *
     * @param user
     * @param loginUser
     * @param synchronize 是否从缓存中查找，谨慎使用，安全性严重危险
     * @return
     */
    public User findUser(User user, User loginUser, boolean synchronize);

    /**
     * 查询的所有用户
     *
     * @param currentPage
     * @param user
     * @return
     */
    public Map<String, Object> findUserList(int currentPage, User user);

    /**
     * 删除用户
     *
     * @param user
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     */
    public int deleteUser(User user, User loginUser);

    /**
     * 更新个人资料
     *
     * @param user
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     */
    public int saveProfile(User user, User loginUser);

    /**
     * 返回用户的账户设置
     *
     * @param user      为null返回当前登陆用户，设置值时当uid与loginUser相同或loginUser为管理员时才返回
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * userSetting - 用户设置
     */
    public Map<String, Object> getUserSetting(User user, User loginUser);

    /**
     * 返回用户的账户设置
     *
     * @param userSetting 不设置uid时默认为当前登陆用户，当uid与loginUser相同或loginUser为管理员时才返回
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * userSetting - 用户设置
     */
    public Map<String, Object> updateUserSetting(UserSetting userSetting, User loginUser);

    /**
     * 检查是否fansUser关注了hostUser
     *
     * @param hostUser
     * @param loginUser
     * @return flag - 200：已关注，404：未关注
     */
    public int checkFollow(User hostUser, User loginUser);

    /**
     * 关注  相互关注则成为好友
     *
     * @param hostUser  被关注的用户
     * @param loginUser
     * @return flag - 200：关注成功，201：关注成功并成为好友，204：重复插入，401：需要登录，404：无此用户，500: 失败
     */
    public int follow(User hostUser, User loginUser);

    /**
     * 取消关注
     *
     * @param hostUser
     * @param loginUser
     * @return flag - 200：取消成功，201：取消关注成功并取消好友，401：需要登录，404：无此记录，500: 失败
     */
    public int removeFollow(User hostUser, User loginUser);

    /**
     * 查询关注列表
     *
     * @param user
     * @param loginUser
     * @return
     */
    public List<User> findFollowList(User user, User loginUser);

    /**
     * 查询粉丝列表
     *
     * @param user
     * @param loginUser
     * @return
     */
    public List<User> findFansList(User user, User loginUser);

    /**
     * 查询好友列表
     *
     * @param loginUser
     * @return
     */
    public List<User> findFriendList(User loginUser);

    /**
     * 点击了文章
     *
     * @param user
     * @param article
     * @return
     */
    public void hasClickArticle(User user, Article article);

    /**
     * 检查是否loginUser收藏了此文章
     *
     * @param article
     * @param user
     * @return flag - 200：已收藏，404：未收藏
     */
    public int checkCollection(Article article, User user);

    /**
     * 收藏文章
     *
     * @param user
     * @param article
     * @return flag - 200：成功，204: 重复插入，401：需要登录，404: 无此文章，500: 失败
     */
    public int collectArticle(User user, Article article);

    /**
     * 查找收藏文章列表
     *
     * @param user
     * @return list
     */
    public List<Collection> findCollectList(User user);

    /**
     * 取消收藏文章
     *
     * @param user
     * @param article
     * @return flag - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    public int unCollectArticle(User user, Article article);

    /**
     * 更新头像
     *
     * @param imageFile       与headPhotoPath二选一
     * @param imageRawFile    头像的原图
     * @param head_photo_path 设置默认头像时传入链接，不需要传file了
     * @param loginUser
     * @return flag - 200：成功，400: 图片为空，401：需要登录，403：无权限，404：无此用户，500: 失败
     * head_photo - 头像地址
     */
    public Map<String, Object> saveHeadPhoto(MultipartFile imageFile, MultipartFile imageRawFile, String head_photo_path, User loginUser);

}
