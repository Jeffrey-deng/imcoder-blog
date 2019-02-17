package site.imcoder.blog.service.impl;

import org.springframework.stereotype.Service;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.type.UserAuthType;
import site.imcoder.blog.dao.IAuthDao;
import site.imcoder.blog.dao.IUserDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.service.IAuthService;
import site.imcoder.blog.service.INotifyService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import java.util.*;

/**
 * 凭证鉴权业务类
 *
 * @author Jeffrey.Deng
 * @date 2016-10-04
 */
@Service("authService")
public class AuthServiceImpl implements IAuthService {

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
     * @return
     */
    @Override
    public int hasUserAuth(UserAuth userAuth) {
        if (userAuth == null || userAuth.getIdentity_type() == null || Utils.isEmpty(userAuth.getIdentifier())) {
            return 400;
        } else {
            return authDao.findUserAuth(userAuth) != null ? 200 : 404;
        }
    }

    /**
     * 根据凭证名查询用户公开信息
     *
     * @param userAuth
     * @return flag - 200：成功，400: 参数错误，404：无此用户
     * user - 用户信息
     */
    @Override
    public Map<String, Object> findUserByUserAuth(UserAuth userAuth) {
        Map<String, Object> map = new HashMap<>();
        int flag = 200;
        if (userAuth == null || Utils.isBlank(userAuth.getIdentifier())) {
            flag = 400;
            map.put("flag", flag);
            return map;
        } else if (userAuth.getIdentity_type() == null) {
            if (userAuth.getIdentifier().matches("^\\d+$")) {
                userAuth.setIdentity_type(UserAuthType.UID.value);
            } else if (userAuth.getIdentifier().indexOf("@") != -1) {
                userAuth.setIdentity_type(UserAuthType.EMAIL.value);
            } else if (userAuth.getIdentifier().matches("^[a-zA-Z\\d][\\w\\.-]{0,20}$")) {
                userAuth.setIdentity_type(UserAuthType.USERNAME.value);
            } else {
                flag = 400;
                map.put("flag", flag);
                return map;
            }
        }
        UserAuth dbUserAuth = authDao.findUserAuth(userAuth);
        if (dbUserAuth == null) {
            flag = 404;
        } else {
            flag = 200;
            map.put("user", cache.cloneSafetyUser(new User(dbUserAuth.getUid())));
        }
        map.put("flag", flag);
        return map;
    }

    /**
     * 根据ID或name email 密码 登陆用户
     *
     * @param userAuth
     * @param remember
     * @return flag - 200：成功，400: 无参数，401：凭证错误，403：账号冻结，404：无此用户
     * user - 用户对象
     */
    @Override
    public Map<String, Object> login(UserAuth userAuth, boolean remember) {
        Map<String, Object> map = new HashMap<>();
        int flag = 200;
        if (userAuth == null || Utils.isBlank(userAuth.getIdentifier()) || Utils.isBlank(userAuth.getCredential()) || Utils.isEmpty(userAuth.getLogin_ip())) {
            flag = 400;
            map.put("flag", flag);
            return map;
        } else if (userAuth.getIdentity_type() == null) {
            if (userAuth.getIdentifier().matches("^\\d+$")) {
                userAuth.setIdentity_type(UserAuthType.UID.value);
            } else if (userAuth.getIdentifier().indexOf("@") != -1) {
                userAuth.setIdentity_type(UserAuthType.EMAIL.value);
            } else if (userAuth.getIdentifier().matches("^[a-zA-Z\\d][\\w\\.-]{0,20}$")) {
                userAuth.setIdentity_type(UserAuthType.USERNAME.value);
            } else {
                flag = 400;
                map.put("flag", flag);
                return map;
            }
        }
        String login_ip = userAuth.getLogin_ip();
        UserAuth dbUserAuth = authDao.findUserAuth(userAuth);
        if (dbUserAuth == null) {
            flag = 404;
        } else {
            User dbUser = userDao.findUser(new User(dbUserAuth.getUid()));
            if (dbUser.getUserStatus().getLock_status() == 1) {
                flag = 403;
            } else {
                UserAuth userAuthToken = null;
                UserAuthType userAuthType = UserAuthType.valueOfName(userAuth.getIdentity_type());
                switch (userAuthType) {
                    case UID:
                    case USERNAME:
                    case EMAIL: //如果是密码登录，判断（用户存在且密码相等）
                        userAuthToken = authDao.findUserAuth(new UserAuth(dbUser.getUid(), UserAuthType.TOKEN, String.valueOf(dbUser.getUid()), null));
                        if (dbUserAuth.getIdentifier().equals(userAuth.getIdentifier()) && dbUserAuth.getCredential().equals(Utils.MD("MD5", userAuth.getCredential()))) {
                            if (remember) {
                                String returnToken = null;
                                String encryptedToken = null;
                                //获取上次用户的token
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
                                    String newToken = Utils.generateUUID();
                                    encryptedToken = Utils.MD("MD5", dbUser.getUid() + newToken); // 加密token
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
                                map.put("token", returnToken);
                            } else if ("true".equals(Config.get(ConfigConstants.USER_LOGIN_STRICT)) && userAuthToken != null && !login_ip.equals(userAuthToken.getLogin_ip())) {
                                // 当是严格模式且登录IP不同时，清除token
                                userAuthToken.setCredential("");
                                authDao.updateUserAuth(userAuthToken);
                            }
                            flag = 200;
                        } else {
                            flag = 401;
                        }
                        break;
                    case TOKEN: // 如果是令牌登录，则判断令牌
                        userAuthToken = dbUserAuth;
                        flag = 401;
                        if (userAuthToken != null && ("false".equals(Config.get(ConfigConstants.USER_LOGIN_STRICT)) || login_ip.equals(userAuthToken.getLogin_ip()))) {
                            String encryptedToken = Utils.MD("MD5", dbUser.getUid() + userAuth.getCredential());
                            if (encryptedToken.equals(userAuthToken.getCredential())) {
                                userAuthToken.setLogin_ip(login_ip);
                                authDao.updateUserAuth(userAuthToken);
                                cache.putTokenEntry(encryptedToken, userAuth.getCredential()); // 在服务器重启时重新注入映射关系到缓存
                                flag = 200;
                            }
                        }
                        break;
                    default:
                        flag = 400;
                }
                if (flag == 200) {
                    User cacheUser = cache.getUser(dbUser.getUid(), Cache.READ);
                    UserStatus userStatus = cacheUser.getUserStatus();
                    userStatus.setLast_login_ip(login_ip);
                    userStatus.setLast_login_time(new Date());
                    userDao.updateUserStatus(userStatus);
                    map.put("user", cacheUser);
                    new Thread(new Runnable() {
                        @Override
                        public void run() {
                            WsMessage pushMessage = new WsMessage();    // 推送消息
                            pushMessage.setMapping("user_has_login");
                            pushMessage.setContent("用户<" + dbUser.getNickname() + ">登录~, ip: " + login_ip + "");
                            pushMessage.setMetadata("user", cache.cloneUser(dbUser));
                            notifyService.pushWsMessage(cache.getManagers(), pushMessage);
                        }
                    }).start();
                }
            }
        }
        map.put("flag", flag);
        return map;
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
     * 用户获取自己凭证列表的凭证名
     *
     * @param loginUser
     * @return
     */
    public List<UserAuth> findUserAuthList(User loginUser) {
        List<UserAuth> userAuthList = authDao.findUserAuthList(loginUser);
        for (UserAuth userAuth : userAuthList) {
            userAuth.setCredential(null);
        }
        return userAuthList;
    }

    /**
     * 更新账号信息
     *
     * @param userAuthList
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * user - 用户对象
     */
    @Override
    public Map<String, Object> updateAccount(List<UserAuth> userAuthList, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        int flag = 200;
        if (loginUser == null || loginUser.getUid() == 0) {
            flag = 401;
        } else if (userAuthList == null || userAuthList.isEmpty()) {
            flag = 400;
        } else {
            userAuthList = reviseUserAuthList(userAuthList, loginUser);
            if (userAuthList == null) {
                flag = 400;
            } else {
                flag = convertRowToHttpCode(authDao.updateUserAuthList(userAuthList));
                if (flag == 200) {
                    User cacheUser = cache.getUser(loginUser.getUid(), Cache.READ);
                    UserAuth emailUserAuth = getUserAuthFromList(userAuthList, UserAuthType.EMAIL);
                    if (emailUserAuth != null && Utils.isNotEmpty(emailUserAuth.getIdentifier())) {
                        cacheUser.setEmail(emailUserAuth.getIdentifier());
                        userDao.saveProfile(cacheUser);
                    }
                    UserSetting userSetting = userDao.findUserSetting(cacheUser);
                    cacheUser.setUserSetting(userSetting);
                    //清除token，使所有终端自动登录失效
                    clearAutoLoginToken(cacheUser);
                    map.put("user", cacheUser);
                }
            }
        }
        map.put("flag", flag);
        return map;
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
            uidUserAuth.setGroup_type(UserAuthType.EMAIL.UID.group);
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
            }
            if (emailUserAuth == null) {
                emailUserAuth = new UserAuth(loginUser.getUid(), UserAuthType.EMAIL, null, password);
                userAuthList.add(emailUserAuth);
            }
            String encryptedPassword = Utils.MD("MD5", password);
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
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，404：无此用户，500: 失败
     */
    @Override
    public int clearAutoLoginToken(User loginUser) {
        if (loginUser == null || loginUser.getUid() == 0) {
            return 401;
        }
        User cacheUser = cache.getUser(loginUser.getUid(), Cache.READ);
        if (cacheUser != null) {
            UserAuth queryArgs = new UserAuth();
            queryArgs.setUid(cacheUser.getUid());
            queryArgs.setIdentity_type(UserAuthType.TOKEN.value);
            queryArgs.setIdentifier(String.valueOf(cacheUser.getUid()));
            UserAuth userAuthToken = authDao.findUserAuth(queryArgs);
            if (userAuthToken != null) {
                cache.removeTokenEntry(userAuthToken.getCredential());
                userAuthToken.setCredential("");
                return convertRowToHttpCode(authDao.updateUserAuth(userAuthToken));
            } else {
                return 404;
            }
        } else {
            return 404;
        }
    }

    /**
     * 重设站内账号密码
     *
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * password - 新密码
     */
    @Override
    public Map<String, Object> resetPasswordInside(User loginUser) {
        return null;
    }

    private int convertRowToHttpCode(int row) {
        int httpCode = 200;
        if (row == 0) {
            httpCode = 404;
        } else if (row == -1) {
            httpCode = 500;
        }
        return httpCode;
    }

}
