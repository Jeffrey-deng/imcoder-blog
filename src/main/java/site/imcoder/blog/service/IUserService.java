package site.imcoder.blog.service;

import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

/**
 * 用户服务接口
 */
public interface IUserService {

    /**
     * 注册用户
     *
     * @param user
     * @param iRequest
     * @return ResponseEntity
     * status - 200：成功，400: 参数错误，500: 失败
     * user - 用户
     */
    public IResponse register(User user, IRequest iRequest);

    /**
     * 根据ID或name email查询用户
     *
     * @param user     为空返回loginUser
     * @param iRequest attr:
     *                 {Boolean} strict - true从数据库中查找, false从缓存中查找
     * @return ResponseEntity
     * status - 200：成功，404: 无此用户
     * user - 用户
     */
    public IResponse findUser(User user, IRequest iRequest);

    /**
     * 查找用户列表，分页
     *
     * @param user
     * @param pageSize 每页篇数
     * @param pageNum  跳转页
     * @param iRequest
     * @return IResponse:
     * status - 200: 成功, 404:该条件未找到用户
     * users 用户列表,
     * page 分页bean
     */
    public IResponse findUserList(User user, int pageSize, int pageNum, IRequest iRequest);

    /**
     * 删除用户
     *
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     */
    public IResponse deleteUser(IRequest iRequest);

    /**
     * 更新个人资料
     *
     * @param user
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * user - 新用户资料
     */
    public IResponse saveProfile(User user, IRequest iRequest);

    /**
     * 返回用户的账户设置
     *
     * @param user     为null返回当前登陆用户，设置值时当uid与loginUser相同或loginUser为管理员时才返回
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * userSetting - 用户设置
     */
    public IResponse findUserSetting(User user, IRequest iRequest);

    /**
     * 更新用户的账户设置
     *
     * @param userSetting 不设置uid时默认为当前登陆用户，当uid与loginUser相同或loginUser为管理员时才返回
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * userSetting - 用户设置
     */
    public IResponse updateUserSetting(UserSetting userSetting, IRequest iRequest);

    /**
     * 检查是否fansUser关注了hostUser
     *
     * @param hostUser
     * @param iRequest
     * @return IResponse:
     * type - 1：已关注，0：未关注
     */
    public IResponse checkFollow(User hostUser, IRequest iRequest);

    /**
     * 关注  相互关注则成为好友
     *
     * @param hostUser 被关注的用户
     * @param iRequest
     * @return IResponse:
     * status - 200：关注成功，401：需要登录，404：无此用户，500: 失败
     * type - 0：重复插入，1: 关注成功，2：关注成功并成为好友
     */
    public IResponse follow(User hostUser, IRequest iRequest);

    /**
     * 取消关注
     *
     * @param hostUser
     * @param iRequest
     * @return IResponse:
     * status - 200：取消关注成功，401：需要登录，404：无此记录，500: 失败
     * type - 1: 取消关注成功, 2: 取消关注成功并取消好友
     */
    public IResponse removeFollow(User hostUser, IRequest iRequest);

    /**
     * 查询关注列表
     *
     * @param user
     * @param iRequest
     * @return IResponse:
     * users - List<User>
     */
    public IResponse findFollowingList(User user, IRequest iRequest);

    /**
     * 查询粉丝列表
     *
     * @param user
     * @param iRequest
     * @return IResponse:
     * users - List<User>
     */
    public IResponse findFollowerList(User user, IRequest iRequest);

    /**
     * 查询好友列表
     *
     * @param iRequest
     * @return IResponse:
     * users - List<User>
     */
    public IResponse findFriendList(IRequest iRequest);

    /**
     * 检查是否loginUser收藏了此文章
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * type - 1：已收藏，0：未收藏
     */
    public IResponse checkCollection(Article article, IRequest iRequest);

    /**
     * 收藏文章
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，404: 无此文章或无此用户，500: 失败
     * type - 0: 重复插入, 1: 收藏成功
     */
    public IResponse collectArticle(Article article, IRequest iRequest);

    /**
     * 查找收藏文章列表
     *
     * @param iRequest
     * @return IResponse:
     * collections - 收藏文章列表
     */
    public IResponse findCollectList(IRequest iRequest);

    /**
     * 取消收藏文章
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    public IResponse removeArticleCollection(Article article, IRequest iRequest);

    /**
     * 更新头像
     *
     * @param imageFile       与headPhotoPath二选一
     * @param imageRawFile    头像的原图
     * @param head_photo_path 设置默认头像时传入链接，不需要传file了
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 图片为空，401：需要登录，403：无权限，404：无此用户，500: 失败
     * head_photo - 头像地址
     * head_photo_raw - 头像原图地址
     */
    public IResponse saveHeadPhoto(MultipartFile imageFile, MultipartFile imageRawFile, String head_photo_path, IRequest iRequest);

    /**
     * 查询用户对文章的动作记录
     *
     * @param queryActionRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * articleActionRecords
     * article_action_record_count
     */
    public IResponse findUserArticleActionRecordList(ActionRecord<Article> queryActionRecord, IRequest iRequest);

    /**
     * 查询用户对视频的动作记录
     *
     * @param queryActionRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * videoActionRecords
     * video_action_record_count
     */
    public IResponse findUserVideoActionRecordList(ActionRecord<Video> queryActionRecord, IRequest iRequest);

    /**
     * 查询用户对照片的动作记录
     *
     * @param queryActionRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * photoActionRecords
     * photo_action_record_count
     */
    public IResponse findUserPhotoActionRecordList(ActionRecord<Photo> queryActionRecord, IRequest iRequest);

    /**
     * 查询用户对评论的动作记录
     *
     * @param queryActionRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * commentActionRecords
     * comment_action_record_count
     */
    public IResponse findUserCommentActionRecordList(ActionRecord<Comment> queryActionRecord, IRequest iRequest);

}
