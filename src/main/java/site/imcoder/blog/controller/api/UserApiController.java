package site.imcoder.blog.controller.api;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.Interceptor.annotation.AccessRecord;
import site.imcoder.blog.Interceptor.annotation.GZIP;
import site.imcoder.blog.Interceptor.annotation.LoginRequired;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.UserAuthType;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.controller.resolver.annotation.BindNullIfEmpty;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.entity.rewrite.*;
import site.imcoder.blog.service.IArticleService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.List;

/**
 * description: 用户控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/user.api")
public class UserApiController extends BaseController {

    //依赖注入[service]
    @Resource
    private IUserService userService;

    @Resource
    private IArticleService articleService;

    /**
     * 注册
     *
     * @param user
     * @param iRequest
     * @return ResponseEntity
     * status - 200：成功，400: 参数错误，500: 失败
     * user - 用户
     */
    @RequestMapping(params = "method=register")
    @ResponseBody
    public IResponse register(User user, String username, String email, String password, IRequest iRequest) {
        if (user == null) {
            user = new User();
        }
        if (email == null) {
            email = user.getEmail();
        }
        List<UserAuth> userAuthList = new ArrayList<>();
        UserAuth usernameUserAuth = new UserAuth(null, UserAuthType.USERNAME, username, password);
        UserAuth emailUserAuth = new UserAuth(null, UserAuthType.EMAIL, email, password);
        userAuthList.add(usernameUserAuth);
        userAuthList.add(emailUserAuth);
        user.setUserAuths(userAuthList);
        return userService.register(user, iRequest);
    }

    /**
     * 查询个人资料
     *
     * @param user     为空返回loginUser
     * @param iRequest
     * @return ResponseEntity
     * status - 200：成功，404: 无此用户
     * user - 用户
     */
    @RequestMapping(params = "method=getUser")
    @ResponseBody
    public IResponse getUser(User user, IRequest iRequest) {
        // 查询用户为当前用户也要查询数据库 因为如果用户更新了资料(直接通过数据库改的方式)就会不同步
        return userService.findUser(user, iRequest);
    }

    /**
     * 保存个人资料
     *
     * @param user
     * @param session
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * user - 新用户资料
     */
    @LoginRequired
    @RequestMapping(params = "method=saveProfile")
    @ResponseBody
    public IResponse saveProfile(User user, HttpSession session, IRequest iRequest) {
        IResponse response = userService.saveProfile(user, iRequest);
        if (response.isSuccess()) {
            // 更新session中的loginUser
            session.setAttribute("loginUser", response.getAttr("user"));
        }
        return response;
    }

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
    @LoginRequired
    @RequestMapping(params = "method=updateHeadPhoto")
    @ResponseBody
    public IResponse updateUserHeadPhoto(@BindNullIfEmpty User user, MultipartFile imageFile, MultipartFile imageRawFile, String head_photo_path, IRequest iRequest) {
        if (user != null && IdUtil.containValue(user.getUid())) {
            iRequest.putAttr("user", user);
        }
        IResponse response = userService.saveHeadPhoto(imageFile, imageRawFile, head_photo_path, iRequest);
        if (response.isSuccess()) {
            User affectedUser = response.getAttr("user");
            if (iRequest.getLoginUser().getUid().equals(affectedUser.getUid())) {
                // 更新session中的loginUser
                iRequest.getLoginUser().setHead_photo(response.getAttr("head_photo"));
            }
        }
        return response;
    }

    /**
     * 取得用户设置
     *
     * @param user     不设置uid时默认为当前登陆用户，当uid与loginUser相同或loginUser为管理员时才返回
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * userSetting - 用户设置
     */
    @LoginRequired
    @RequestMapping(params = "method=getUserSetting")
    @ResponseBody
    public IResponse getUserSetting(User user, IRequest iRequest) {
        return userService.findUserSetting(user, iRequest);
    }

    /**
     * 更新用户设置
     *
     * @param userSetting 不设置uid时默认为当前登陆用户，当uid与loginUser相同或loginUser为管理员时才更新
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * userSetting - 用户设置
     */
    @LoginRequired
    @RequestMapping(params = "method=updateUserSetting")
    @ResponseBody
    public IResponse updateUserSetting(UserSetting userSetting, IRequest iRequest) {
        return userService.updateUserSetting(userSetting, iRequest);
    }

    /**
     * 检查是否loginUser关注了hostUser
     *
     * @param hostUser
     * @param iRequest
     * @return IResponse:
     * type - 1：已关注，0：未关注
     */
    @LoginRequired
    @RequestMapping(params = "method=checkIsFollowing")
    @ResponseBody
    public IResponse checkIsFollowing(User hostUser, IRequest iRequest) {
        return userService.checkIsFollowing(hostUser, iRequest);
    }

    /**
     * 关注，相互关注则成为好友
     *
     * @param hostUser
     * @param iRequest
     * @return IResponse:
     * status - 200：关注成功，401：需要登录，404：无此用户，500: 失败
     * type - 0：重复插入，1: 关注成功，2：关注成功并成为好友
     */
    @LoginRequired
    @RequestMapping(params = "method=follow")
    @ResponseBody
    public IResponse follow(User hostUser, IRequest iRequest) {
        return userService.follow(hostUser, iRequest);
    }

    /**
     * 取消关注
     *
     * @param hostUser
     * @param iRequest
     * @return IResponse:
     * status - 200：取消关注成功，401：需要登录，404：无此记录，500: 失败
     * type - 1: 取消关注成功, 2: 取消关注成功并取消好友
     */
    @LoginRequired
    @RequestMapping(params = "method=unfollow")
    @ResponseBody
    public IResponse unfollow(User hostUser, IRequest iRequest) {
        return userService.unfollow(hostUser, iRequest);
    }

    /**
     * 查询关注列表
     *
     * @param user     条件
     * @param iRequest
     * @return IResponse:
     * users - List<User>
     */
    @RequestMapping(params = "method=getUserFollowings")
    @ResponseBody
    public IResponse getUserFollowings(User user, IRequest iRequest) {
        return userService.findFollowingList(user, iRequest);
    }

    /**
     * 查询粉丝列表
     *
     * @param user     条件
     * @param iRequest
     * @return IResponse:
     * users - List<User>
     */
    @RequestMapping(params = "method=getUserFollowers")
    @ResponseBody
    public IResponse getUserFollowers(User user, IRequest iRequest) {
        return userService.findFollowerList(user, iRequest);
    }

    /**
     * 查询好友列表
     *
     * @param iRequest
     * @return IResponse:
     * users - List<User>
     */
    @LoginRequired
    @RequestMapping(params = "method=getUserFriends")
    @ResponseBody
    public IResponse getUserFriends(IRequest iRequest) {
        return userService.findFriendList(iRequest);
    }

    /**
     * 检查是否loginUser收藏了此文章
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * type - 1：已收藏，0：未收藏
     */
    @LoginRequired
    @RequestMapping(params = "method=checkArticleIsCollected")
    @ResponseBody
    public IResponse checkArticleIsCollected(Article article, IRequest iRequest) {
        return userService.checkArticleIsCollected(article, iRequest);
    }

    /**
     * 保存收藏
     *
     * @param iRequest
     * @param article
     * @return IResponse:
     * status - 200：成功，401：需要登录，404: 无此文章或无此用户，500: 失败
     * type - 0: 重复插入, 1: 收藏成功
     */
    @LoginRequired
    @RequestMapping(params = "method=collectArticle")
    @ResponseBody
    public IResponse collectArticle(Article article, IRequest iRequest) {
        return userService.collectArticle(article, iRequest);
    }

    /**
     * 删除收藏
     *
     * @param iRequest
     * @param article
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=uncollectArticle")
    @ResponseBody
    public IResponse uncollectArticle(Article article, IRequest iRequest) {
        return userService.uncollectArticle(article, iRequest);
    }

    /**
     * 请求收藏文章列表
     *
     * @param iRequest
     * @return IResponse:
     * collections - 收藏文章列表
     */
    @LoginRequired
    @RequestMapping(params = "method=getCollectedArticleList")
    @ResponseBody
    public IResponse getCollectedArticleList(IRequest iRequest) {
        return userService.findCollectedArticleList(iRequest);
    }

    /**
     * 查询用户对文章的动作记录
     *
     * @param accessRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * articleActionRecords
     * article_action_record_count
     */
    @RequestMapping(params = "method=getUserArticleActionRecords")
    @ResponseBody
    @GZIP
    public IResponse getUserArticleActionRecords(ArticleActionRecord accessRecord, IRequest iRequest) {
        return userService.findUserArticleActionRecordList(accessRecord, iRequest);
    }

    /**
     * 查询用户对视频的动作记录
     *
     * @param accessRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * videoActionRecords
     * video_action_record_count
     */
    @RequestMapping(params = "method=getUserVideoActionRecords")
    @ResponseBody
    @GZIP
    public IResponse getUserVideoActionRecords(VideoActionRecord accessRecord, IRequest iRequest) {
        return userService.findUserVideoActionRecordList(accessRecord, iRequest);
    }

    /**
     * 查询用户对照片的动作记录
     *
     * @param accessRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * photoActionRecords
     * photo_action_record_count
     */
    @RequestMapping(params = "method=getUserPhotoActionRecords")
    @ResponseBody
    @GZIP
    public IResponse getUserPhotoActionRecords(PhotoActionRecord accessRecord, IRequest iRequest) {
        return userService.findUserPhotoActionRecordList(accessRecord, iRequest);
    }

    /**
     * 查询用户对相册的动作记录
     *
     * @param accessRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * albumActionRecords
     * album_action_record_count
     */
    @RequestMapping(params = "method=getUserAlbumActionRecords")
    @ResponseBody
    @GZIP
    public IResponse getUserAlbumActionRecords(AlbumActionRecord accessRecord, IRequest iRequest) {
        return userService.findUserAlbumActionRecordList(accessRecord, iRequest);
    }

    /**
     * 查询用户对评论的动作记录
     *
     * @param accessRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * commentActionRecords
     * comment_action_record_count
     */
    @RequestMapping(params = "method=getUserCommentActionRecords")
    @ResponseBody
    @GZIP
    public IResponse getUserCommentActionRecords(CommentActionRecord accessRecord, IRequest iRequest) {
        return userService.findUserCommentActionRecordList(accessRecord, iRequest);
    }

    /**
     * 查询用户所有的动作记录
     *
     * @param accessRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * articleActionRecords
     * article_action_record_count
     * photoActionRecords
     * photo_action_record_count
     * videoActionRecords
     * video_action_record_count
     */
    @RequestMapping(params = "method=getUserActionRecords")
    @ResponseBody
    @GZIP
    public IResponse getUserActionRecords(ActionRecord accessRecord, IRequest iRequest) {
        if (accessRecord != null) {
            accessRecord.setCreation(null);
        }
        IResponse response = new IResponse();
        IResponse articleResp = userService.findUserArticleActionRecordList(accessRecord, iRequest);
        response.setStatus(articleResp);
        if (response.isSuccess()) {
            response.putAttr(articleResp.getAttr());
            response.putAttr(userService.findUserVideoActionRecordList(accessRecord, iRequest).getAttr());
            response.putAttr(userService.findUserPhotoActionRecordList(accessRecord, iRequest).getAttr());
            response.putAttr(userService.findUserAlbumActionRecordList(accessRecord, iRequest).getAttr());
        }
        return response;
    }

    /**
     * 删除用户访问文章的历史记录
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    @AccessRecord(type = AccessRecord.Types.ARTICLE, key = "article", action = AccessRecord.Actions.DELETE)
    @RequestMapping(params = "method=deleteUserArticleAccessDetail")
    @ResponseBody
    public IResponse deleteUserArticleAccessDetail(Article article, IRequest iRequest) {
        IResponse response = new IResponse();
        response.putAttr("article", article);
        return response;
    }

    /**
     * 删除用户访问视频的历史记录
     *
     * @param video
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    @AccessRecord(type = AccessRecord.Types.VIDEO, key = "video", action = AccessRecord.Actions.DELETE)
    @RequestMapping(params = "method=deleteUserVideoAccessDetail")
    @ResponseBody
    public IResponse deleteUserVideoAccessDetail(Video video, IRequest iRequest) {
        IResponse response = new IResponse();
        response.putAttr("video", video);
        return response;
    }

    /**
     * 删除用户访问照片的历史记录
     *
     * @param photo
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    @AccessRecord(type = AccessRecord.Types.PHOTO, key = "photo", action = AccessRecord.Actions.DELETE)
    @RequestMapping(params = "method=deleteUserPhotoAccessDetail")
    @ResponseBody
    public IResponse deleteUserPhotoAccessDetail(Photo photo, IRequest iRequest) {
        IResponse response = new IResponse();
        response.putAttr("photo", photo);
        return response;
    }

    /**
     * 删除用户访问相册的历史记录
     *
     * @param album
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    @AccessRecord(type = AccessRecord.Types.PHOTO, key = "album", action = AccessRecord.Actions.DELETE)
    @RequestMapping(params = "method=deleteUserAlbumAccessDetail")
    @ResponseBody
    public IResponse deleteUserAlbumAccessDetail(Album album, IRequest iRequest) {
        IResponse response = new IResponse();
        response.putAttr("album", album);
        return response;
    }

}
