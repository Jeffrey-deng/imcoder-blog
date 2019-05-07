package site.imcoder.blog.controller.api;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.Interceptor.annotation.AccessRecorder;
import site.imcoder.blog.Interceptor.annotation.GZIP;
import site.imcoder.blog.Interceptor.annotation.LoginRequired;
import site.imcoder.blog.common.type.UserAuthType;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.entity.rewrite.ArticleAccessRecord;
import site.imcoder.blog.entity.rewrite.PhotoAccessRecord;
import site.imcoder.blog.entity.rewrite.VideoAccessRecord;
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
        //查询用户为当前用户也要查询数据库 因为如果用户更新了资料(直接通过数据库改的方式)就会不同步
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
            //更新session中的loginUser
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
    public IResponse updateUserHeadPhoto(MultipartFile imageFile, MultipartFile imageRawFile, String head_photo_path, IRequest iRequest) {
        IResponse response = userService.saveHeadPhoto(imageFile, imageRawFile, head_photo_path, iRequest);
        if (response.isSuccess()) {
            iRequest.getLoginUser().setHead_photo(response.getAttr("head_photo"));
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
    @RequestMapping(params = "method=checkFollow")
    @ResponseBody
    public IResponse checkFollow(User hostUser, IRequest iRequest) {
        return userService.checkFollow(hostUser, iRequest);
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
    @RequestMapping(params = "method=removeFollow")
    @ResponseBody
    public IResponse removeFollow(User hostUser, IRequest iRequest) {
        return userService.removeFollow(hostUser, iRequest);
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
    @RequestMapping(params = "method=checkCollection")
    @ResponseBody
    public IResponse checkCollection(Article article, IRequest iRequest) {
        return userService.checkCollection(article, iRequest);
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
    @RequestMapping(params = "method=unCollectArticle")
    @ResponseBody
    public IResponse removeArticleCollection(Article article, IRequest iRequest) {
        return userService.removeArticleCollection(article, iRequest);
    }

    /**
     * 请求收藏文章列表
     *
     * @param iRequest
     * @return IResponse:
     * collections - 收藏文章列表
     */
    @LoginRequired
    @RequestMapping(params = "method=getArticleCollections")
    @ResponseBody
    public IResponse getArticleCollections(IRequest iRequest) {
        return userService.findCollectList(iRequest);
    }

    /**
     * 查询用户访问文章的历史记录
     *
     * @param accessRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    @RequestMapping(params = "method=getUserArticleAccessRecordList")
    @ResponseBody
    @GZIP
    public IResponse getUserArticleAccessRecordList(ArticleAccessRecord accessRecord, IRequest iRequest) {
        return userService.findUserArticleAccessRecordList(accessRecord, iRequest);
    }

    /**
     * 删除用户访问文章的历史记录
     *
     * @param accessRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    @AccessRecorder(type = AccessRecorder.Types.ARTICLE, key = "article", action = AccessRecorder.Actions.DELETE)
    @RequestMapping(params = "method=deleteUserArticleAccessRecord")
    @ResponseBody
    public IResponse deleteUserArticleAccessRecord(ArticleAccessRecord accessRecord, IRequest iRequest) {
        IResponse response = userService.deleteUserArticleAccessRecord(accessRecord, iRequest);
        if (response.isSuccess()) {
            response.putAttr("article", ((AccessRecord) response.getAttr("accessRecord")).getBean());
        }
        return response;
    }

    /**
     * 查询用户访问视频的历史记录
     *
     * @param accessRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    @RequestMapping(params = "method=getUserVideoAccessRecordList")
    @ResponseBody
    @GZIP
    public IResponse getUserVideoAccessRecordList(VideoAccessRecord accessRecord, IRequest iRequest) {
        return userService.findUserVideoAccessRecordList(accessRecord, iRequest);
    }

    /**
     * 删除用户访问视频的历史记录
     *
     * @param accessRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    @AccessRecorder(type = AccessRecorder.Types.VIDEO, key = "video", action = AccessRecorder.Actions.DELETE)
    @RequestMapping(params = "method=deleteUserVideoAccessRecord")
    @ResponseBody
    public IResponse deleteUserVideoAccessRecord(VideoAccessRecord accessRecord, IRequest iRequest) {
        IResponse response = userService.deleteUserVideoAccessRecord(accessRecord, iRequest);
        if (response.isSuccess()) {
            response.putAttr("video", ((AccessRecord) response.getAttr("accessRecord")).getBean());
        }
        return response;
    }

    /**
     * 查询用户访问照片的历史记录
     *
     * @param accessRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    @RequestMapping(params = "method=getUserPhotoAccessRecordList")
    @ResponseBody
    @GZIP
    public IResponse getUserPhotoAccessRecordList(PhotoAccessRecord accessRecord, IRequest iRequest) {
        return userService.findUserPhotoAccessRecordList(accessRecord, iRequest);
    }

    /**
     * 删除用户访问照片的历史记录
     *
     * @param accessRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    @AccessRecorder(type = AccessRecorder.Types.PHOTO, key = "photo", action = AccessRecorder.Actions.DELETE)
    @RequestMapping(params = "method=deleteUserPhotoAccessRecord")
    @ResponseBody
    public IResponse deleteUserPhotoAccessRecord(PhotoAccessRecord accessRecord, IRequest iRequest) {
        IResponse response = userService.deleteUserPhotoAccessRecord(accessRecord, iRequest);
        if (response.isSuccess()) {
            response.putAttr("photo", ((AccessRecord) response.getAttr("accessRecord")).getBean());
        }
        return response;
    }

    /**
     * 查询用户所有访问的历史记录
     *
     * @param accessRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    @RequestMapping(params = "method=getUserAccessRecordList")
    @ResponseBody
    @GZIP
    public IResponse getUserAccessRecordList(AccessRecord accessRecord, IRequest iRequest) {
        if (accessRecord != null) {
            accessRecord.setBean(null);
        }
        IResponse response = new IResponse();
        IResponse articleResp = userService.findUserArticleAccessRecordList(accessRecord, iRequest);
        response.setStatus(articleResp);
        if (response.isSuccess()) {
            response.putAttr(articleResp.getAttr());
            response.putAttr(userService.findUserVideoAccessRecordList(accessRecord, iRequest).getAttr());
            response.putAttr(userService.findUserPhotoAccessRecordList(accessRecord, iRequest).getAttr());
        }
        return response;
    }
}
