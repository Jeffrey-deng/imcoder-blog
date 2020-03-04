package site.imcoder.blog.service.impl;

import org.apache.log4j.Logger;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.PageUtil;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.UserAuthType;
import site.imcoder.blog.common.type.UserGroupType;
import site.imcoder.blog.dao.IUserDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.event.IEventTrigger;
import site.imcoder.blog.service.BaseService;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.service.INotifyService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Random;

/**
 * 业务实现类
 *
 * @author dengchao
 */
@Service("userService")
@DependsOn({"configManager"})
public class UserServiceImpl extends BaseService implements IUserService {

    private static Logger logger = Logger.getLogger(UserServiceImpl.class);

    //依赖注入DAO
    @Resource
    private IUserDao userDao;

    @Resource
    private Cache cache;

    @Resource
    private INotifyService notifyService;

    @Resource(name = "fileService")
    private IFileService fileService;

    @Resource
    private IEventTrigger trigger;

    private List<String> userDefaultManHeadPhotos;  //  默认的男生用户头像列表

    private List<String> userDefaultMissHeadPhotos; // 默认的女生用户头像列表

    @PostConstruct
    public void init() {
        userDefaultManHeadPhotos = Config.getList(ConfigConstants.USER_DEFAULT_HEADPHOTOS_MAN, String.class);
        userDefaultMissHeadPhotos = Config.getList(ConfigConstants.USER_DEFAULT_HEADPHOTOS_MISS, String.class);
    }

    private String getRandomUserHeadPhoto(List<String> headPhotos) {
        if (headPhotos.size() == 1) {
            return headPhotos.get(0);
        } else {
            Random random = new Random();
            return headPhotos.get(random.nextInt(headPhotos.size()));
        }
    }

    /**
     * 注册用户
     *
     * @param user
     * @return ResponseEntity
     * status - 200：成功，400: 参数错误，500: 失败
     * user - 用户
     */
    @Override
    public IResponse register(User user, IRequest iRequest) {
        IResponse response = new IResponse();
        if (user == null) {
            return response.setStatus(STATUS_PARAM_ERROR);
        } else if (user.getUserAuths() == null || user.getUserAuths().isEmpty()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        }

        user.setUid(IdUtil.generatePrimaryKey()); // 主键
        user.setUserGroup(new UserGroup(UserGroupType.NOVICE_USER.value));

        UserStatus userStatus = user.getUserStatus();
        if (userStatus == null) {
            userStatus = new UserStatus();
            user.setUserStatus(userStatus);
        }
        userStatus.setRegister_ip(iRequest.getAccessIp());
        userStatus.setRegister_time(new Date());
        userStatus.setLock_status(0);

        UserStats userStats = new UserStats(0, 0, 0, 0, 0, 0, 0, 0, null);
        List<Category> userArticleCateCount = Utils.copyListByJson(cache.categoryCount, Category.class);
        for (Category category : userArticleCateCount) {
            category.setCount(0);
        }
        userStats.setArticleCateCount(userArticleCateCount);
        user.setUserStats(userStats);

        // 校正检查账号凭证
        List<UserAuth> userAuths = reviseUserAuthList(user.getUserAuths());
        if (userAuths == null) {
            return response.setStatus(STATUS_PARAM_ERROR, "账号凭证输出错误~");
        } else {
            user.setUserAuths(userAuths);
            user.setEmail(getUserAuthFromList(userAuths, UserAuthType.EMAIL).getIdentifier());
        }

        if (Utils.isEmpty(user.getNickname())) {
            user.setNickname("用户-" + Utils.getValidateCode());
        }
        user.setHead_photo(getRandomUserHeadPhoto(userDefaultManHeadPhotos));
        if (Utils.isEmpty(user.getSex())) {
            user.setSex("男");
        } else if (user.getSex().equals("女")) {
            user.setHead_photo(getRandomUserHeadPhoto(userDefaultMissHeadPhotos));
        }
        if (user.getPhone() == null) {
            user.setPhone("");
        }
        if (user.getQq() == null) {
            user.setQq("");
        }
        if (user.getDescription() == null) {
            user.setDescription("");
        }

        int row = userDao.saveUser(user);
        if (row > 0) {
            UserSetting userSetting = userDao.findUserSetting(user);
            user.setUserSetting(userSetting);
            trigger.newUser(user);
            //欢迎通知
            notifyService.welcomeNewUser(user);
            List<User> managers = cache.getManagers();
            if (managers.size() > 0) {
                notifyService.notifyManagerNewUser(managers, user); //通知管理员
            }
            response.putAttr("user", user);
            return response.setStatus(STATUS_SUCCESS, "注册成功~");
        } else {
            return response.setStatus(STATUS_SERVER_ERROR, "注册失败，服务器错误~");
        }
    }

    // 校正检查账号凭证
    private List<UserAuth> reviseUserAuthList(List<UserAuth> userAuthList) {
        if (userAuthList == null || userAuthList.isEmpty()) {
            return null;
        }
        for (UserAuth userAuth : userAuthList) {
            if (userAuth.getIdentity_type() == null) {
                return null;
            }
        }
        UserAuth userNameUserAuth = getUserAuthFromList(userAuthList, UserAuthType.USERNAME);
        UserAuth emailUserAuth = getUserAuthFromList(userAuthList, UserAuthType.EMAIL);
        if (userNameUserAuth != null) {
            userNameUserAuth.setGroup_type(UserAuthType.USERNAME.group);
        }
        if (emailUserAuth != null) {
            userNameUserAuth.setGroup_type(UserAuthType.EMAIL.group);
        }
        for (UserAuth userAuth : userAuthList) {
            if (!userAuth.typeOfLegalAuth()) {
                return null;
            }
        }
        if (userNameUserAuth != null && emailUserAuth != null && userNameUserAuth.getCredential().equals(emailUserAuth.getCredential())) {
            String username = userNameUserAuth.getIdentifier();
            if (username.matches("^[0-9]+$") || username.contains("@") || !username.matches("^[a-zA-Z0-9][\\w\\.-]{0,20}$")) {
                return null;
            }
            String email = emailUserAuth.getIdentifier();
            if (!email.contains("@")) {
                return null;
            }
            UserAuth uidUserAuth = getUserAuthFromList(userAuthList, UserAuthType.UID);
            if (uidUserAuth != null) {
                userAuthList.remove(uidUserAuth);
                return null;
            } else {
                uidUserAuth = new UserAuth(null, UserAuthType.UID, null, userNameUserAuth.getCredential());
                userAuthList.add(uidUserAuth);
                UserAuth tempUserAuth = userAuthList.get(0);
                userAuthList.set(0, uidUserAuth);
                userAuthList.set(userAuthList.size() - 1, tempUserAuth);
                String encryptedPassword = Utils.MD("MD5", userNameUserAuth.getCredential(), true);
                for (UserAuth userAuth : userAuthList) {
                    userAuth.setVerified(1);
                    userAuth.setLogin_ip("");
                    if (userAuth.getGroup_type() == null) {
                        userAuth.setGroup_type(UserAuthType.QQ.group);
                    }
                    if (userAuth.typeOfInsideGroup()) {
                        userAuth.setCredential(encryptedPassword);  // 加密
                    }
                }
                return userAuthList;
            }
        } else {
            return null;
        }
    }

    private UserAuth getUserAuthFromList(List<UserAuth> userAuths, UserAuthType userAuthType) {
        if (userAuths != null && !userAuths.isEmpty()) {
            for (UserAuth userAuth : userAuths) {
                if (userAuth.getIdentity_type() == userAuthType.value) {
                    return userAuth;
                }
            }
        }
        return null;
    }

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
    @Override
    public IResponse findUser(User user, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (user == null || !IdUtil.containValue(user.getUid())) {
            if (iRequest.isHasNotLoggedIn()) {
                return response.setStatus(STATUS_PARAM_ERROR, "请设置要查询的用户id");
            } else {
                return response.putAttr("user", loginUser).setStatus(STATUS_SUCCESS, "未设置要查询的用户id，返回当前登录用户资料");
            }
        }
        User hostUser = null;
        boolean strict = iRequest.getAttr("strict", true);
        if (strict) {
            hostUser = userDao.findUser(user);
            if (hostUser != null) {
                if (cache.getUser(hostUser.getUid(), Cache.READ) == null) {
                    UserSetting userSetting = userDao.findUserSetting(user);
                    user.setUserSetting(userSetting);
                    trigger.newUser(hostUser);
                }
                boolean enableSecurity = (loginUser == null || (loginUser.getUserGroup().isGeneralUser() && !user.getUid().equals(loginUser.getUid())));
                cache.fillUserStats(hostUser, enableSecurity);
                hostUser.setUserAuths(null);
                // loginUser-->判断主人各项资料访客的查看权限
                if (enableSecurity) {
                    hostUser.setUserStatus(null);
                    hostUser.setEmail(null);
                }
            }
        } else {
            hostUser = cache.cloneSafetyUser(user);
        }
        if (hostUser != null) {
            response.putAttr("user", hostUser);
            response.setStatus(STATUS_SUCCESS);
        } else {
            response.setStatus(STATUS_NOT_FOUND, "该用户不存在~");
        }
        return response;
    }

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
    @Override
    public IResponse findUserList(User user, int pageSize, int pageNum, IRequest iRequest) {
        IResponse response = new IResponse();
        int rows = userDao.findUserListCount(user);
        if (rows > 0) {
            PageUtil page = new PageUtil(rows, pageSize, pageNum);
            // 想查出符合条件的LIST
            List<User> userList = userDao.findUserList(page, user);
            //填充统计数据
            cache.fillUserStats(userList);
            response.putAttr("users", userList);
            response.putAttr("page", page);
            return response.setStatus(STATUS_SUCCESS);
        } else {
            return response.setStatus(404, "该条件未找到用户~");
        }
    }

    /**
     * 删除用户
     *
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     */
    @Override
    public IResponse deleteUser(IRequest iRequest) {
        IResponse response = new IResponse();
        if (true) {
            return response.setStatus(STATUS_FORBIDDEN);
        }
        int status;
        if (iRequest.isHasNotLoggedIn()) {
            status = STATUS_NOT_LOGIN;
        }
        status = convertRowToHttpCode(userDao.deleteUser(iRequest.getLoginUser()));
        return response.setStatus(status);
    }

    /**
     * 更新个人资料
     *
     * @param user
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * user - 新用户资料
     */
    @Override
    public IResponse saveProfile(User user, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        int status;
        String message = null;
        if (iRequest.isHasNotLoggedIn()) {
            status = STATUS_NOT_LOGIN;
        } else if (user == null || !IdUtil.containValue(user.getUid())) {
            status = STATUS_PARAM_ERROR;
        } else if (!user.getUid().equals(loginUser.getUid()) && loginUser.getUserGroup().isGeneralUser()) {
            status = STATUS_FORBIDDEN;
        } else {
            User cacheUser = cache.getUser(user.getUid(), Cache.READ);
            if (cacheUser == null) {
                status = STATUS_NOT_FOUND;
                message = "无此用户";
            } else {
                user.setHead_photo(cacheUser.getHead_photo());
                int row = userDao.saveProfile(user);
                if (row > 0) {
                    User newUser = userDao.findUser(user);
                    UserSetting userSetting = userDao.findUserSetting(newUser);
                    newUser.setUserSetting(userSetting);
                    // 更新缓存中用户
                    trigger.updateUser(newUser);
                    response.putAttr("user", newUser);
                    status = STATUS_SUCCESS;
                } else {
                    status = STATUS_PARAM_ERROR;
                }
            }
        }
        return response.setStatus(status, message);
    }

    /**
     * 返回用户的账户设置
     *
     * @param user     为null返回当前登陆用户，设置值时当uid与loginUser相同或loginUser为管理员时才返回
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * userSetting - 用户设置
     */
    @Override
    public IResponse findUserSetting(User user, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        int flag = STATUS_SUCCESS;
        if (iRequest.isHasNotLoggedIn()) {
            flag = STATUS_NOT_LOGIN;
        } else if (user == null || !IdUtil.containValue(user.getUid())) {
            user = loginUser;
        }
        if (flag == STATUS_SUCCESS) {
            if (user.getUid().equals(loginUser.getUid()) || loginUser.getUserGroup().isManager()) {
                UserSetting userSetting = userDao.findUserSetting(user);
                if (userSetting != null) {
                    response.putAttr("userSetting", userSetting);
                    flag = STATUS_SUCCESS;
                } else {
                    flag = STATUS_NOT_FOUND;
                }
            } else {
                flag = STATUS_FORBIDDEN;
            }
        }
        response.setStatus(flag);
        return response;
    }

    /**
     * 更新用户的账户设置
     *
     * @param userSetting 不设置uid时默认为当前登陆用户，当uid与loginUser相同或loginUser为管理员时才返回
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * userSetting - 用户设置
     */
    @Override
    public IResponse updateUserSetting(UserSetting userSetting, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        int flag = STATUS_SUCCESS;
        if (iRequest.isHasNotLoggedIn()) {
            flag = STATUS_NOT_LOGIN;
        } else if (userSetting == null) {
            flag = STATUS_PARAM_ERROR;
        } else if (!IdUtil.containValue(userSetting.getUid())) {
            userSetting.setUid(loginUser.getUid());
        }
        if (flag != STATUS_SUCCESS) {
            return response.setStatus(flag);
        }
        User cacheUser = cache.getUser(userSetting.getUid(), Cache.READ);
        if (!userSetting.getUid().equals(loginUser.getUid()) && loginUser.getUserGroup().isGeneralUser()) {
            flag = STATUS_FORBIDDEN;
        } else if (cacheUser == null) {
            flag = STATUS_NOT_FOUND;
        } else {
            UserSetting dbUserSetting = userDao.findUserSetting(cacheUser);
            if (dbUserSetting != null) {
                if (userSetting.getPageBackground() == null) {
                    userSetting.setPageBackground(dbUserSetting.getPageBackground());
                }
                if (userSetting.getProfileViewLevel() == null) {
                    userSetting.setProfileViewLevel(dbUserSetting.getProfileViewLevel());
                }
                if (userSetting.getReceiveNotifyEmail() == null) {
                    userSetting.setReceiveNotifyEmail(dbUserSetting.getReceiveNotifyEmail());
                }
                flag = userDao.updateUserSetting(userSetting) > 0 ? STATUS_SUCCESS : STATUS_SERVER_ERROR;
            } else {
                flag = STATUS_SERVER_ERROR;
            }
        }
        response.setStatus(flag);
        if (flag == STATUS_SUCCESS) {
            UserSetting newUserSetting = userDao.findUserSetting(cacheUser);
            cacheUser.setUserSetting(newUserSetting);
            response.putAttr("userSetting", userSetting);
        }
        return response;
    }

    /**
     * 检查是否fansUser关注了hostUser
     *
     * @param hostUser
     * @param iRequest
     * @return IResponse:
     * type - 1：已关注，0：未关注
     */
    @Override
    public IResponse checkIsFollowing(User hostUser, IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        } else if (hostUser == null || !IdUtil.containValue(hostUser.getUid())) {
            return response.setStatus(STATUS_PARAM_ERROR);
        } else {
            Follow follow = new Follow(iRequest.getLoginUser().getUid(), hostUser.getUid());
            // userDao.checkFollow(follow);
            if (cache.containsFollow(follow) > 0) {
                return response.setStatus(STATUS_SUCCESS, "已关注").putAttr("type", 1);
            } else {
                return response.setStatus(STATUS_SUCCESS, "未关注").putAttr("type", 0);
            }
        }
    }

    /**
     * 关注  相互关注则成为好友
     *
     * @param hostUser 被关注的用户
     * @param iRequest
     * @return IResponse:
     * status - 200：关注成功，401：需要登录，404：无此用户，500: 失败
     * type - 0：重复插入，1: 关注成功，2：关注成功并成为好友
     */
    @Override
    public IResponse follow(User hostUser, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        } else if (hostUser == null || !IdUtil.containValue(hostUser.getUid())) {
            return response.setStatus(STATUS_PARAM_ERROR);
        }
        hostUser = cache.getUser(hostUser.getUid(), Cache.READ);
        if (hostUser == null) {
            return response.setStatus(STATUS_NOT_FOUND, "无此用户");
        }
        Follow follow = new Follow(loginUser.getUid(), hostUser.getUid());
        int index = userDao.saveFollow(follow);
        if (index == 0) {
            response.setStatus(STATUS_NOT_FOUND, "无此用户");
        } else if (index == 11) {
            response.setStatus(STATUS_SUCCESS, "重复关注").putAttr("type", 0);
        } else if (index == 1) {
            trigger.follow(follow);
            //发送通知
            notifyService.theNewFollower(hostUser, loginUser, false);
            response.setStatus(STATUS_SUCCESS, "关注成功").putAttr("type", 1);
        } else if (index == 2) {
            trigger.follow(follow);
            trigger.friend(new Friend(loginUser.getUid(), hostUser.getUid()));
            //发送通知
            notifyService.theNewFollower(hostUser, loginUser, true);
            response.setStatus(STATUS_SUCCESS, "关注成功并成为好友").putAttr("type", 2);
        } else {
            response.setStatus(STATUS_SERVER_ERROR, "插入错误或无此用户");
        }
        return response;
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
    @Override
    public IResponse unfollow(User hostUser, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        } else if (hostUser == null || !IdUtil.containValue(hostUser.getUid())) {
            return response.setStatus(STATUS_PARAM_ERROR);
        }
        Follow follow = new Follow(loginUser.getUid(), hostUser.getUid());
        int row = userDao.deleteFollow(follow);
        if (row == 0) {
            response.setStatus(STATUS_NOT_FOUND, "关注关系不存在~");
        } else if (row == 1) {
            trigger.removeFollow(follow);
            response.setStatus(STATUS_SUCCESS, "取消关注成功").putAttr("type", 1);
        } else if (row == 2) {
            trigger.removeFollow(follow);
            trigger.removeFriend(new Friend(loginUser.getUid(), hostUser.getUid()));
            response.setStatus(STATUS_SUCCESS, "取消关注成功并取消好友").putAttr("type", 2);
        } else {
            response.setStatus(STATUS_SERVER_ERROR);
        }
        return response;
    }

    /**
     * 查询关注列表
     *
     * @param user
     * @param iRequest
     * @return IResponse:
     * users - List<User>
     */
    @Override
    public IResponse findFollowingList(User user, IRequest iRequest) {
        IResponse response = new IResponse();
        if (user == null || !IdUtil.containValue(user.getUid())) {
            return response.setStatus(STATUS_PARAM_ERROR);
        } else {
            return response.putAttr("users", userDao.findFollowingList(user)).setStatus(STATUS_SUCCESS);
        }
    }

    /**
     * 查询粉丝列表
     *
     * @param user
     * @param iRequest
     * @return IResponse:
     * users - List<User>
     */
    @Override
    public IResponse findFollowerList(User user, IRequest iRequest) {
        IResponse response = new IResponse();
        if (user == null || !IdUtil.containValue(user.getUid())) {
            return response.setStatus(STATUS_PARAM_ERROR);
        } else {
            return response.putAttr("users", userDao.findFollowerList(user)).setStatus(STATUS_SUCCESS);
        }
    }

    /**
     * 查询好友列表
     *
     * @param iRequest
     * @return IResponse:
     * users - List<User>
     */
    @Override
    public IResponse findFriendList(IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        } else {
            return response.putAttr("users", userDao.findFriendList(iRequest.getLoginUser())).setStatus(STATUS_SUCCESS);
        }
    }

    /**
     * 检查是否loginUser收藏了此文章
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * type - 1：已收藏，0：未收藏
     */
    @Override
    public IResponse checkArticleIsCollected(Article article, IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (article == null || !IdUtil.containValue(article.getAid())) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else {
            if (userDao.checkCollection(new Collection(iRequest.getLoginUser().getUid(), article.getAid())) > 0) {
                response.setStatus(STATUS_SUCCESS, "已收藏").putAttr("type", 1);
            } else {
                response.setStatus(STATUS_SUCCESS, "未收藏").putAttr("type", 0);
            }
        }
        return response;
    }

    /**
     * 收藏文章
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，404: 无此文章或无此用户，500: 失败
     * type - 0: 重复插入, 1: 收藏成功
     */
    @Override
    public IResponse collectArticle(Article article, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        } else if (article == null) {
            return response.setStatus(STATUS_PARAM_ERROR);
        } else if (cache.getUser(loginUser.getUid(), Cache.READ) == null) {
            return response.setStatus(STATUS_NOT_FOUND, "无此用户");
        } else if (cache.getArticle(article.getAid(), Cache.READ) == null) {
            return response.setStatus(STATUS_NOT_FOUND, "无此文章");
        }
        Collection collection = new Collection(loginUser.getUid(), article.getAid());
        collection.setClet_time(new Date().getTime());
        int index = userDao.saveCollection(collection); // 插入
        if (index == 1) {
            // 文章收藏数加1
            trigger.addCollection(article, loginUser);
            // 发送通知
            notifyService.collectedByUser(loginUser, article);
            response.setStatus(STATUS_SUCCESS, "收藏成功~").putAttr("type", 1);
        } else if (index == 2) {
            response.setStatus(STATUS_SUCCESS, "重复收藏~").putAttr("type", 0);
        } else {
            response.setStatus(STATUS_SERVER_ERROR);
        }
        return response;
    }

    /**
     * 查找收藏文章列表
     *
     * @param iRequest
     * @return IResponse:
     * collections - 收藏文章列表
     */
    @Override
    public IResponse findCollectedArticleList(IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        } else {
            return response.putAttr("collections", userDao.findCollectionList(iRequest.getLoginUser())).setStatus(STATUS_SUCCESS);
        }
    }

    /**
     * 取消收藏文章
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * type - 0: 并没有收藏过该文章, 1: 取消收藏成功
     */
    @Override
    public IResponse uncollectArticle(Article article, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        }
        Collection collection = new Collection(loginUser.getUid(), article.getAid());
        int row = userDao.deleteCollection(collection);
        if (row == 0) {
            response.setStatus(STATUS_SUCCESS, "你并没有收藏过该文章~").putAttr("type", 0);
        } else if (row > 0) {
            // 文章收藏数减1
            trigger.removeCollection(article, loginUser);
            response.setStatus(STATUS_SUCCESS, "取消收藏成功~").putAttr("type", 1);
        } else {
            response.setStatus(convertRowToHttpCode(row));
        }
        return response;
    }

    /**
     * 更新头像
     *
     * @param imageFile       与headPhotoPath二选一
     * @param imageRawFile    头像的原图
     * @param head_photo_path 设置默认头像时传入链接，不需要传file了
     * @param iRequest attr:
     *                 {User} user - 用户id，管理员可以给别人修改头像
     * @return IResponse:
     * status - 200：成功，400: 图片为空，401：需要登录，403：无权限，404：无此用户，500: 失败
     * head_photo - 头像地址
     * head_photo_raw - 头像原图地址
     */
    @Override
    public IResponse saveHeadPhoto(MultipartFile imageFile, MultipartFile imageRawFile, String head_photo_path, IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if ((imageFile == null || imageFile.isEmpty()) && Utils.isEmpty(head_photo_path)) {
            response.setStatus(STATUS_PARAM_ERROR, "imageFile与headPhotoPath二选一");
        }
        if (response.isSuccess()) {
            User user = iRequest.getAttr("user");
            if (user != null) {
                if (IdUtil.containValue(user.getUid())) {
                    if (iRequest.getLoginUser().getUid().equals(user.getUid()) || iRequest.isManagerRequest()) {
                        user = cache.getUser(user.getUid(), Cache.READ);
                        if (user == null) {
                            response.setStatus(STATUS_NOT_FOUND, "该用户不存在");
                        }
                    } else {
                        response.setStatus(STATUS_FORBIDDEN, "你不能设置别人的头像");
                    }
                } else {
                    response.setStatus(STATUS_PARAM_ERROR, "uid不是合法值");
                }
            } else {
                user = iRequest.getLoginUser();
            }
            try {
                String headPhotoValue = null;
                String headPhotoRawValue = null;
                if (imageFile != null && !imageFile.isEmpty()) {
                    String savePath = Config.get(ConfigConstants.ARTICLE_UPLOAD_RELATIVEPATH) + "image/head/" + IdUtil.convertToShortPrimaryKey(user.getUid()) + "/";
                    String fileName = "head_photo_" + IdUtil.convertToShortPrimaryKey(user.getUid()) + "_" + IdUtil.convertDecimalIdTo62radix(System.currentTimeMillis()) + ".jpg";
                    String fileRawName = "head_photo_" + IdUtil.convertToShortPrimaryKey(user.getUid()) + "_" + IdUtil.convertDecimalIdTo62radix(System.currentTimeMillis()) + "_raw.jpg";
                    if (fileService.saveHeadPhotoFile(imageFile.getInputStream(), savePath, fileName)) {
                        fileService.saveHeadPhotoFile(imageRawFile.getInputStream(), savePath, fileRawName);
                        headPhotoValue = savePath + fileName;
                        headPhotoRawValue = savePath + fileRawName;
                        response.setStatus(STATUS_SUCCESS);
                    } else {
                        response.setStatus(STATUS_SERVER_ERROR, "头像文件保存失败");
                    }
                } else {
                    headPhotoValue = head_photo_path;
                    headPhotoRawValue = head_photo_path;
                }
                if (response.isSuccess()) {
                    User cacheUser = cache.getUser(user.getUid(), Cache.READ);
                    String beforeHeadPhoto = cacheUser.getHead_photo();
                    // 这里获取到cacheUser为用户session中对象，所以管理员依然可以修改用户session中的头像
                    cacheUser.setHead_photo(headPhotoValue);
                    response.setStatus(convertRowToHttpCode(userDao.saveProfile(cacheUser)));
                    if (response.isFail()) {
                        cacheUser.setHead_photo(beforeHeadPhoto);
                    }
                    response.putAttr("user", new User(cacheUser.getUid()));
                    response.putAttr("head_photo", headPhotoValue);
                    response.putAttr("head_photo_cdn_path", Config.get(ConfigConstants.SITE_CDN_ADDR) + headPhotoValue);
                    response.putAttr("head_photo_raw", headPhotoRawValue);
                    response.putAttr("head_photo_raw_cdn_path", Config.get(ConfigConstants.SITE_CDN_ADDR) + headPhotoRawValue);
                    response.putAttr("cdn_path_prefix", Config.get(ConfigConstants.SITE_CDN_ADDR));
                }
            } catch (IOException e) {
                e.printStackTrace();
                response.setStatus(STATUS_SERVER_ERROR, "头像保存失败");
            }
        }
        return response;
    }

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
    @Override
    public IResponse findUserArticleActionRecordList(ActionRecord<Article> queryActionRecord, IRequest iRequest) {
        if (queryActionRecord == null) {
            queryActionRecord = new ActionRecord<>();
        }
        IResponse response = reviseQueryActionRecord(queryActionRecord, iRequest);
        if (response.isSuccess()) {
            List<ActionRecord<Article>> articleActionRecordList = userDao.findArticleActionRecordList(queryActionRecord, iRequest.getLoginUser());
            response.putAttr("articleActionRecords", articleActionRecordList);
            response.putAttr("article_action_record_count", articleActionRecordList.size());
        }
        return response;
    }

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
    @Override
    public IResponse findUserVideoActionRecordList(ActionRecord<Video> queryActionRecord, IRequest iRequest) {
        if (queryActionRecord == null) {
            queryActionRecord = new ActionRecord();
        }
        IResponse response = reviseQueryActionRecord(queryActionRecord, iRequest);
        if (response.isSuccess()) {
            List<ActionRecord<Video>> videoActionRecordList = userDao.findVideoActionRecordList(queryActionRecord, iRequest.getLoginUser());
            response.putAttr("videoActionRecords", videoActionRecordList);
            response.putAttr("video_action_record_count", videoActionRecordList.size());
        }
        return response;
    }

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
    @Override
    public IResponse findUserPhotoActionRecordList(ActionRecord<Photo> queryActionRecord, IRequest iRequest) {
        if (queryActionRecord == null) {
            queryActionRecord = new ActionRecord();
        }
        IResponse response = reviseQueryActionRecord(queryActionRecord, iRequest);
        if (response.isSuccess()) {
            List<ActionRecord<Photo>> photoActionRecordList = userDao.findPhotoActionRecordList(queryActionRecord, iRequest.getLoginUser());
            response.putAttr("photoActionRecords", photoActionRecordList);
            response.putAttr("photo_action_record_count", photoActionRecordList.size());
        }
        return response;
    }

    /**
     * 查询用户对相册的动作记录
     *
     * @param queryActionRecord
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * albumActionRecords
     * album_action_record_count
     */
    @Override
    public IResponse findUserAlbumActionRecordList(ActionRecord<Album> queryActionRecord, IRequest iRequest) {
        if (queryActionRecord == null) {
            queryActionRecord = new ActionRecord();
        }
        IResponse response = reviseQueryActionRecord(queryActionRecord, iRequest);
        if (response.isSuccess()) {
            List<ActionRecord<Album>> albumActionRecordList = userDao.findAlbumActionRecordList(queryActionRecord, iRequest.getLoginUser());
            response.putAttr("albumActionRecords", albumActionRecordList);
            response.putAttr("album_action_record_count", albumActionRecordList.size());
        }
        return response;
    }

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
    @Override
    public IResponse findUserCommentActionRecordList(ActionRecord<Comment> queryActionRecord, IRequest iRequest) {
        if (queryActionRecord == null) {
            queryActionRecord = new ActionRecord();
        }
        IResponse response = reviseQueryActionRecord(queryActionRecord, iRequest);
        if (response.isSuccess()) {
            List<ActionRecord<Comment>> commentActionRecordList = userDao.findCommentActionRecordList(queryActionRecord, iRequest.getLoginUser());
            response.putAttr("commentActionRecords", commentActionRecordList);
            response.putAttr("comment_action_record_count", commentActionRecordList.size());
        }
        return response;
    }

    private IResponse reviseQueryActionRecord(ActionRecord queryActionRecord, IRequest iRequest) {
        IResponse response = new IResponse(STATUS_SUCCESS);
        if (iRequest.isHasNotLoggedIn()) {
            if (Utils.isNotEmpty(queryActionRecord.getIp()) && !iRequest.getAccessIp().equals(queryActionRecord.getIp())) {
                response.setStatus(STATUS_FORBIDDEN, "不可以查看别人的记录噢~");
            } else {
                queryActionRecord.setUser(new User(0L));
                queryActionRecord.setIp(iRequest.getAccessIp());
            }
        } else if (queryActionRecord.getUser() == null || !IdUtil.containValue(queryActionRecord.getUser().getUid())) {
            User queryUser = new User(iRequest.getLoginUser().getUid());
            if (Utils.isNotEmpty(queryActionRecord.getIp()) && iRequest.getLoginUser().getUserGroup().isManager()) {
                if (queryActionRecord.getUser() != null && queryActionRecord.getUser().getUid() != null && queryActionRecord.getUser().getUid().equals(0L)) {
                    queryUser = new User(0L);
                } else {
                    queryUser = null;
                }
            }
            queryActionRecord.setUser(queryUser);
        } else if (!queryActionRecord.getUser().getUid().equals(iRequest.getLoginUser().getUid()) && iRequest.getLoginUser().getUserGroup().isGeneralUser()) {
            response.setStatus(STATUS_FORBIDDEN, "不可以查看别人的记录噢~");
        }
        return response;
    }

}
