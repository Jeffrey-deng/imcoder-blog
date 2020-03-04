package site.imcoder.blog.service.impl;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.PermissionType;
import site.imcoder.blog.common.type.UserAuthType;
import site.imcoder.blog.dao.IAuthDao;
import site.imcoder.blog.dao.IUserDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.service.BaseService;
import site.imcoder.blog.service.IAuthService;
import site.imcoder.blog.service.INotifyService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import java.util.Date;
import java.util.HashSet;
import java.util.List;

/**
 * 凭证鉴权业务类
 *
 * @author Jeffrey.Deng
 * @date 2016-10-04
 */
@Service("authService")
public class AuthServiceImpl extends BaseService implements IAuthService {

    private static Logger logger = Logger.getLogger(AuthServiceImpl.class);

    //依赖注入DAO
    @Resource
    private IUserDao userDao;

    @Resource
    private IAuthDao authDao;

    @Resource
    private Cache cache;

    @Resource
    private INotifyService notifyService;

    /**
     * 判断账号凭证是否重复（存在）在用户修改用户名或注册时等时需要
     *
     * @param userAuth
     * @return ResponseEntity
     * type - 1: 该凭证已存在，0：此凭证可用
     */
    @Override
    public IResponse hasUserAuth(UserAuth userAuth, IRequest iRequest) {
        IResponse response = new IResponse();
        if (userAuth == null || userAuth.getIdentity_type() == null || Utils.isEmpty(userAuth.getIdentifier())) {
            return response.setStatus(STATUS_PARAM_ERROR, "请输入identity_type与identifier~");
        } else {
            if (authDao.findUserAuth(userAuth) != null) {
                return response.setStatus(STATUS_SUCCESS, "该凭证已存在").putAttr("type", 1);
            } else {
                return response.setStatus(STATUS_SUCCESS, "此凭证可用").putAttr("type", 0);
            }
        }
    }

    /**
     * 根据凭证名查询用户公开信息
     *
     * @param userAuth
     * @return IResponse:
     * status - 200：成功，400: 参数错误，404：无此用户
     * user - 用户信息
     */
    @Override
    public IResponse findUserByUserAuth(UserAuth userAuth, IRequest iRequest) {
        IResponse response = new IResponse();
        String identifier = userAuth.getIdentifier();
        if (userAuth == null || Utils.isBlank(identifier)) {
            return response.setStatus(STATUS_PARAM_ERROR);
        } else if (userAuth.getIdentity_type() == null) {
            if (identifier.matches("^[0-9]+$")) {
                userAuth.setIdentity_type(UserAuthType.UID.value);
            } else if (identifier.contains("@")) {
                userAuth.setIdentity_type(UserAuthType.EMAIL.value);
            } else if (identifier.matches("^[a-zA-Z0-9][\\w\\.-]{0,20}$")) {
                userAuth.setIdentity_type(UserAuthType.USERNAME.value);
            } else {
                return response.setStatus(STATUS_PARAM_ERROR, "请指定identity_type~");
            }
        }
        UserAuth dbUserAuth = authDao.findUserAuth(userAuth);
        if (dbUserAuth == null) {
            response.setStatus(STATUS_NOT_FOUND, "无此用户");
        } else {
            response.setStatus(STATUS_SUCCESS);
            response.putAttr("user", cache.cloneSafetyUser(new User(dbUserAuth.getUid())));
        }
        return response;
    }

    /**
     * 根据ID或name email 密码 登陆用户
     *
     * @param userAuth
     * @param iRequest attr:
     *                 <p>{Boolean} remember - 是否记住密码</p>
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：凭证错误，403：账号冻结，404：无此用户
     * user - 用户对象
     */
    @Override
    public IResponse login(UserAuth userAuth, IRequest iRequest) {
        boolean remember = iRequest.getAttr("remember", false);
        IResponse response = new IResponse();
        if (userAuth == null || Utils.isBlank(userAuth.getIdentifier()) || Utils.isBlank(userAuth.getCredential()) || Utils.isEmpty(userAuth.getLogin_ip())) {
            return response.setStatus(STATUS_PARAM_ERROR);
        } else if (userAuth.getIdentity_type() == null) {
            if (userAuth.getIdentifier().matches("^[0-9]+$")) {
                userAuth.setIdentity_type(UserAuthType.UID.value);
            } else if (userAuth.getIdentifier().contains("@")) {
                userAuth.setIdentity_type(UserAuthType.EMAIL.value);
            } else if (userAuth.getIdentifier().matches("^[a-zA-Z0-9][\\w\\.-]{0,20}$")) {
                userAuth.setIdentity_type(UserAuthType.USERNAME.value);
            } else {
                return response.setStatus(STATUS_PARAM_ERROR, "请指定identity_type~");
            }
        }
        String login_ip = userAuth.getLogin_ip();
        UserAuth dbUserAuth = authDao.findUserAuth(userAuth);
        if (dbUserAuth == null) {
            response.setStatus(STATUS_NOT_FOUND, "未找到此用户~");
        } else {
            User dbUser = userDao.findUser(new User(dbUserAuth.getUid()));
            if (dbUser.getUserStatus().getLock_status() == 1) {
                response.setStatus(STATUS_FORBIDDEN, "该账号已被冻结~");
            } else {
                UserAuth userAuthToken = null;
                UserAuthType userAuthType = UserAuthType.valueOf(userAuth.getIdentity_type());
                if (userAuthType == null) {
                    return response.setStatus(STATUS_PARAM_ERROR, "identity_type输入错误");
                }
                switch (userAuthType) {
                    case UID:
                    case USERNAME:
                    case EMAIL: // 如果是密码登录，判断（用户存在且密码相等）
                        userAuthToken = authDao.findUserAuth(new UserAuth(dbUser.getUid(), UserAuthType.TOKEN, String.valueOf(dbUser.getUid()), null));
                        if (dbUserAuth.getIdentifier().equalsIgnoreCase(userAuth.getIdentifier()) && dbUserAuth.getCredential().equals(Utils.MD("MD5", userAuth.getCredential(), true))) {
                            if (remember) {
                                String returnToken = null;
                                String encryptedToken = null;
                                // 获取上次用户的token
                                String beforeUseToken = null;
                                if (userAuthToken != null && Utils.isNotEmpty(userAuthToken.getCredential())) {
                                    encryptedToken = userAuthToken.getCredential();
                                    beforeUseToken = cache.getTokenEntry(encryptedToken);
                                }
                                if ("false".equals(Config.get(ConfigConstants.USER_LOGIN_STRICT)) && beforeUseToken != null) {
                                    // 非严格模式下，如果之前有了token，则复用，让多个终端保持自动登陆
                                    returnToken = beforeUseToken;
                                } else {
                                    // 上面条件不成立则产生新的token
                                    String newToken = IdUtil.generateUUID();
                                    encryptedToken = Utils.MD("MD5", dbUser.getUid() + newToken, true); // 加密token
                                    cache.putTokenEntry(encryptedToken, newToken); // 缓存下加密的token与未加密的token的映射关系
                                    returnToken = newToken;
                                }
                                if (userAuthToken != null) {
                                    userAuthToken.setCredential(encryptedToken);
                                    userAuthToken.setLogin_ip(login_ip);
                                    authDao.updateUserAuth(userAuthToken);
                                } else {
                                    UserAuth newTokenAuth = new UserAuth(dbUser.getUid(), UserAuthType.TOKEN, String.valueOf(dbUser.getUid()), encryptedToken, 1, login_ip);
                                    authDao.saveUserAuth(newTokenAuth);
                                }
                                response.putAttr("token", returnToken);
                            } else if ("true".equals(Config.get(ConfigConstants.USER_LOGIN_STRICT)) && userAuthToken != null && !login_ip.equals(userAuthToken.getLogin_ip())) {
                                // 当是严格模式且登录IP不同时，清除token
                                userAuthToken.setCredential("");
                                authDao.updateUserAuth(userAuthToken);
                            }
                            response.setStatus(STATUS_SUCCESS);
                        } else {
                            response.setStatus(STATUS_NOT_LOGIN, "凭证错误");
                        }
                        break;
                    case TOKEN: // 如果是令牌登录，则判断令牌
                        userAuthToken = dbUserAuth;
                        response.setStatus(STATUS_NOT_LOGIN);
                        if (userAuthToken != null && ("false".equals(Config.get(ConfigConstants.USER_LOGIN_STRICT)) || login_ip.equals(userAuthToken.getLogin_ip()))) {
                            String encryptedToken = Utils.MD("MD5", dbUser.getUid() + userAuth.getCredential(), true);
                            if (encryptedToken.equals(userAuthToken.getCredential())) {
                                userAuthToken.setLogin_ip(login_ip);
                                authDao.updateUserAuth(userAuthToken);
                                cache.putTokenEntry(encryptedToken, userAuth.getCredential()); // 在服务器重启时重新注入映射关系到缓存
                                response.setStatus(STATUS_SUCCESS);
                            }
                        }
                        break;
                    default:
                        return response.setStatus(STATUS_PARAM_ERROR, "此identity_type暂时不支持~");
                }
                if (response.isSuccess()) {
                    User cacheUser = cache.getUser(dbUser.getUid(), Cache.READ);
                    UserStatus userStatus = cacheUser.getUserStatus();
                    userStatus.setLast_login_ip(login_ip);
                    userStatus.setLast_login_time(new Date());
                    userDao.updateUserStatus(userStatus);
                    response.putAttr("user", cacheUser);
                    notifyService.executeByAsync(new Runnable() {
                        @Override
                        public void run() {
                            WsMessage pushMessage = new WsMessage();    // 推送消息
                            pushMessage.setMapping("user_has_login");
                            pushMessage.setText("用户<" + dbUser.getNickname() + ">登录~, ip: " + login_ip + "");
                            pushMessage.setMetadata("user", cache.cloneUser(dbUser));
                            notifyService.pushWsMessage(cache.getManagers(), pushMessage);
                        }
                    });
                }
            }
        }
        return response;
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
     * 用户获取自己凭证列表的凭证列表
     *
     * @param iRequest
     * @return IResponse:
     * userAuths - 凭证列表
     */
    @Override
    public IResponse findUserAuthList(IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_FOUND, "请先登录");
        } else {
            List<UserAuth> userAuthList = authDao.findUserAuthList(iRequest.getLoginUser());
            for (UserAuth userAuth : userAuthList) {
                userAuth.setCredential(null);
            }
            response.putAttr("userAuths", userAuthList).setStatus(STATUS_SUCCESS);
        }
        return response;
    }

    /**
     * 更新账号信息
     *
     * @param userAuthList
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * user - 用户对象
     */
    @Override
    public IResponse updateAccount(List<UserAuth> userAuthList, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (userAuthList == null || userAuthList.isEmpty()) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else {
            userAuthList = reviseUserAuthList(userAuthList, loginUser);
            if (userAuthList == null) {
                response.setStatus(STATUS_PARAM_ERROR);
            } else {
                response.setStatus(convertRowToHttpCode(authDao.updateUserAuthList(userAuthList)));
                if (response.isSuccess()) {
                    User cacheUser = cache.getUser(loginUser.getUid(), Cache.READ);
                    UserAuth emailUserAuth = getUserAuthFromList(userAuthList, UserAuthType.EMAIL);
                    if (emailUserAuth != null && Utils.isNotEmpty(emailUserAuth.getIdentifier())) {
                        cacheUser.setEmail(emailUserAuth.getIdentifier());
                        userDao.saveProfile(cacheUser);
                    }
                    UserSetting userSetting = userDao.findUserSetting(cacheUser);
                    cacheUser.setUserSetting(userSetting);
                    // 清除token，使所有终端自动登录失效
                    clearAutoLoginToken(iRequest);
                    response.putAttr("user", cacheUser);
                }
            }
        }
        return response;
    }

    // 校正检查账号凭证
    private List<UserAuth> reviseUserAuthList(List<UserAuth> userAuthList, User loginUser) {
        if (userAuthList == null || userAuthList.isEmpty()) {
            return null;
        }
        for (UserAuth userAuth : userAuthList) {
            userAuth.setUid(loginUser.getUid());
            if (userAuth.getIdentity_type() == null) {
                return null;
            }
            userAuth.setLogin_ip(null);
            userAuth.setVerified(null);
        }
        UserAuth uidUserAuth = getUserAuthFromList(userAuthList, UserAuthType.UID);
        UserAuth userNameUserAuth = getUserAuthFromList(userAuthList, UserAuthType.USERNAME);
        UserAuth emailUserAuth = getUserAuthFromList(userAuthList, UserAuthType.EMAIL);
        if (uidUserAuth != null) {
            uidUserAuth.setGroup_type(UserAuthType.UID.group);
            uidUserAuth.setIdentifier(null);
        }
        if (userNameUserAuth != null) {
            userNameUserAuth.setGroup_type(UserAuthType.USERNAME.group);
        }
        if (emailUserAuth != null) {
            userNameUserAuth.setGroup_type(UserAuthType.EMAIL.group);
        }
        HashSet<String> uniqueSet = new HashSet<>();
        String password = null;
        for (UserAuth userAuth : userAuthList) {
            if (userAuth.typeOfInsideGroup()) {
                if ("".equals(userAuth.getIdentifier())) {
                    userAuth.setIdentifier(null);
                }
                if ("".equals(userAuth.getCredential())) {
                    userAuth.setCredential(null);
                }
                if (userAuth.getCredential() != null) {
                    password = userAuth.getCredential();
                    uniqueSet.add(password);
                }
            }
        }
        if (uniqueSet.size() > 1) {
            return null;
        } else if (uniqueSet.size() == 1) {
            if (uidUserAuth == null) {
                uidUserAuth = new UserAuth(loginUser.getUid(), UserAuthType.UID, null, password);
                userAuthList.add(uidUserAuth);
            }
            if (userNameUserAuth == null) {
                userNameUserAuth = new UserAuth(loginUser.getUid(), UserAuthType.USERNAME, null, password);
                userAuthList.add(userNameUserAuth);
            } else if (userNameUserAuth.getIdentifier() != null) {
                String username = userNameUserAuth.getIdentifier();
                if (username.matches("^[0-9]+$") || username.contains("@") || !username.matches("^[a-zA-Z0-9][\\w\\.-]{0,20}$")) {
                    return null;
                }
            }
            if (emailUserAuth == null) {
                emailUserAuth = new UserAuth(loginUser.getUid(), UserAuthType.EMAIL, null, password);
                userAuthList.add(emailUserAuth);
            } else if (emailUserAuth.getIdentifier() != null) {
                String email = emailUserAuth.getIdentifier();
                if (!email.contains("@")) {
                    return null;
                }
            }
            String encryptedPassword = Utils.MD("MD5", password, true);
            for (UserAuth userAuth : userAuthList) {
                if (userAuth.typeOfInsideGroup()) {
                    userAuth.setCredential(encryptedPassword);  // 加密
                }
            }
        }
        for (UserAuth userAuth : userAuthList) {
            if (!(userAuth.getUaid() != null || (userAuth.getUid() != null && userAuth.getIdentity_type() != null))) {
                return null;
            }
        }
        return userAuthList;
    }

    /**
     * 清除自动登录令牌
     *
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，404：无此用户或无token，500: 失败
     */
    @Override
    public IResponse clearAutoLoginToken(IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        }
        User cacheUser = cache.getUser(iRequest.getLoginUser().getUid(), Cache.READ);
        if (cacheUser != null) {
            UserAuth queryArgs = new UserAuth();
            queryArgs.setUid(cacheUser.getUid());
            queryArgs.setIdentity_type(UserAuthType.TOKEN.value);
            queryArgs.setIdentifier(String.valueOf(cacheUser.getUid()));
            UserAuth userAuthToken = authDao.findUserAuth(queryArgs);
            if (userAuthToken != null) {
                cache.removeTokenEntry(userAuthToken.getCredential());
                userAuthToken.setCredential("");
                return response.setStatus(convertRowToHttpCode(authDao.updateUserAuth(userAuthToken)));
            } else {
                return response.setStatus(STATUS_NOT_FOUND, "该用户并没有记住密码，无需清除~");
            }
        } else {
            return response.setStatus(STATUS_NOT_FOUND, "无此用户");
        }
    }

    /**
     * 重设站内账号密码
     *
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * password - 新密码
     */
    @Override
    public IResponse resetPasswordInside(IRequest iRequest) {
        return null;
    }

    /**
     * 发送验证码
     *
     * @param iRequest attr:
     *                 {UserAuth} userAuth - 当用户没有登录既忘记密码时，传入一个凭证名称，如果能找到用户就给该用户发送验证邮件
     * @return IResponse:
     * validateCode 验证码
     */
    @Override
    public IResponse sendValidateCode(IRequest iRequest) {
        IResponse response = new IResponse();
        User emailUser = iRequest.getLoginUser();
        UserAuth userAuth = iRequest.getAttr("userAuth");
        if (userAuth != null && Utils.isNotBlank(userAuth.getIdentifier())) {
            IResponse userQueryResp = findUserByUserAuth(userAuth, iRequest);
            if (userQueryResp.isSuccess()) {
                emailUser = userQueryResp.getAttr("user");
            } else {
                return response.setStatus(STATUS_NOT_FOUND, "没有找到该凭证的用户");
            }
        }
        if (emailUser == null) {
            return response.setStatus(STATUS_NOT_LOGIN, "你没有登录");
        } else {
            emailUser = cache.getUser(emailUser.getUid(), Cache.READ);
        }
        Boolean enable = Config.getBoolean(ConfigConstants.EMAILPUSH_ENABLE);
        if (enable) {
            String code = notifyService.sendValidateCode(emailUser);
            if (code != null) {
                response.putAttr("validateCode", code).setStatus(STATUS_SUCCESS, "邮件发送成功~");
            } else {
                response.setStatus(STATUS_SERVER_ERROR, "邮件发送失败~");
            }
        } else {
            response.setStatus(STATUS_SERVER_ERROR, "邮件推送服务被设置为关闭~");
            logger.warn("邮件推送服务被设置为关闭，故此邮件未被发送：" + emailUser.getEmail());
        }
        return response;
    }

    /**
     * 验证用户loginUser对于用户author的这个permission值有没有权限
     *
     * @param author
     * @param permission
     * @param iRequest
     * @return
     */
    @Override
    public IResponse validateUserPermissionUtil(User author, int permission, IRequest iRequest) {
        IResponse response = new IResponse();
        if (author == null) {
            return response.setStatus(STATUS_PARAM_ERROR);
        }
        PermissionType permissionType = PermissionType.valueOf(permission);
        // 公开权限直接返回
        if (permissionType == PermissionType.PUBLIC || permissionType == PermissionType.NOT_PUBLIC) {
            return response.setStatus(STATUS_SUCCESS);
        }
        if (iRequest.isHasLoggedIn()) {
            User loginUser = iRequest.getLoginUser();
            // 作者本人查看时直接返回
            if (loginUser.getUid().equals(author.getUid())) {
                response.setStatus(STATUS_SUCCESS);
            } else {
                switch (permissionType) {
                    case LOGIN_ONLY:    // 权限为登录可见
                    case LOGIN_ONLY_NOT_PUBLIC:
                        response.setStatus(STATUS_SUCCESS);
                        break;
                    case FOLLOWER_ONLY:  // 权限为粉丝可见
                    case FOLLOWER_ONLY_NOT_PUBLIC:
                        int following_row = cache.containsFollow(new Follow(loginUser.getUid(), author.getUid()));
                        response.setStatus(following_row > 0 ? STATUS_SUCCESS : STATUS_FORBIDDEN);
                        break;
                    case FOLLOWING_ONLY:  // 权限为关注的用户可见
                    case FOLLOWING_ONLY_NOT_PUBLIC:
                        int follower_row = cache.containsFollow(new Follow(author.getUid(), loginUser.getUid()));
                        response.setStatus(follower_row > 0 ? STATUS_SUCCESS : STATUS_FORBIDDEN);
                        break;
                    case FRIEND_ONLY:  // 权限为好友可见
                    case FRIEND_ONLY_NOT_PUBLIC:
                        int friend_row = cache.containsFriend(new Friend(author.getUid(), loginUser.getUid()));
                        response.setStatus(friend_row > 0 ? STATUS_SUCCESS : STATUS_FORBIDDEN);
                        break;
                    case PRIVATE:   // 权限为私有
                        response.setStatus(STATUS_FORBIDDEN);
                        break;
                    default:
                        response.setStatus(STATUS_SERVER_ERROR);
                        break;
                }
            }
        } else {
            response.setStatus(STATUS_NOT_LOGIN);
        }
        return response;
    }

}
