package site.imcoder.blog.service.impl;

import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.PageUtil;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.type.UserAuthType;
import site.imcoder.blog.common.type.UserGroupType;
import site.imcoder.blog.dao.IUserDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.entity.Collection;
import site.imcoder.blog.event.IEventTrigger;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.service.INotifyService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import java.io.IOException;
import java.util.*;

/**
 * 业务实现类
 *
 * @author dengchao
 */
@Service("userService")
@DependsOn({"configManager"})
public class UserServiceImpl implements IUserService {

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

    public UserServiceImpl() {
        userDefaultManHeadPhotos = Config.getList(ConfigConstants.USER_DEFAULT_MAN_HEADPHOTOS, String.class);
        userDefaultMissHeadPhotos = Config.getList(ConfigConstants.USER_DEFAULT_MISS_HEADPHOTOS, String.class);
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
     * @return flag - 200：成功，500: 失败
     */
    @Override
    public int register(User user) {
        if (user == null) {
            return 400;
        } else if (user.getUserAuths() == null || user.getUserAuths().isEmpty()) {
            return 400;
        }
        user.setUserGroup(new UserGroup(UserGroupType.NOVICE_USER.value));
        user.setHead_photo(getRandomUserHeadPhoto(userDefaultManHeadPhotos));

        UserStatus userStatus = user.getUserStatus();
        if (userStatus == null) {
            userStatus = new UserStatus();
            user.setUserStatus(userStatus);
        }
        if (userStatus.getRegister_ip() == null) {
            userStatus.setRegister_ip("");
        }
        userStatus.setRegister_time(new Date());
        userStatus.setLock_status(0);
        userStatus.setArticleCount(0);
        userStatus.setFollowCount(0);
        userStatus.setFansCount(0);

        // 校正检查账号凭证
        List<UserAuth> userAuths = reviseUserAuthList(user.getUserAuths());
        if (userAuths == null) {
            return 400;
        } else {
            user.setUserAuths(userAuths);
            user.setEmail(getUserAuthFromList(userAuths, UserAuthType.EMAIL).getIdentifier());
        }

        if (user.getNickname() == null || user.getNickname().equals("")) {
            user.setNickname("用户-" + Utils.getValidateCode());
        }
        if (user.getSex() == null || user.getSex().equals("")) {
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
        }
        return row > 0 ? 200 : 500;
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
                String encryptedPassword = Utils.MD("MD5", userNameUserAuth.getCredential());
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
     * @param user
     * @param loginUser
     * @return
     */
    @Override
    public User findUser(User user, User loginUser) {
        User hostUser = userDao.findUser(user);
        if (hostUser != null) {
            if (cache.getUser(hostUser.getUid(), Cache.READ) == null) {
                UserSetting userSetting = userDao.findUserSetting(user);
                user.setUserSetting(userSetting);
                trigger.newUser(hostUser);
            }
            boolean enableSecurity = (loginUser == null || (loginUser.getUserGroup().isGeneralUser() && user.getUid() != loginUser.getUid()));
            cache.fillUserStats(hostUser, enableSecurity);
            hostUser.setUserAuths(null);
            //loginUser-->判断主人各项资料访客的查看权限
            if (enableSecurity) {
                UserStatus userStatus = hostUser.getUserStatus();
                userStatus.setLast_login_ip(null);
                userStatus.setLast_login_time(null);
                userStatus.setRegister_ip(null);
                userStatus.setRegister_time(null);
                hostUser.setEmail(null);
            }
        }
        return hostUser;
    }

    /**
     * 根据ID查询用户
     *
     * @param user
     * @param loginUser
     * @param synchronize 是否从缓存中查找，谨慎使用，安全性严重危险
     * @return
     */
    @Override
    public User findUser(User user, User loginUser, boolean synchronize) {
        if (synchronize) {
            return cache.getUser(user.getUid(), Cache.READ);
        } else {
            return findUser(user, loginUser);
        }
    }

    /**
     * 查询的所有用户
     *
     * @param currentPage
     * @param user
     * @return
     */
    @Override
    public Map<String, Object> findUserList(int currentPage, User user) {
        //根据条件查询总行数
        int rowCount = userDao.findUserListCount(user);
        if (rowCount != 0) {
            PageUtil pageUtil = new PageUtil(rowCount, currentPage);
            //将数据组装传到界面
            Map<String, Object> map = new HashMap<String, Object>();
            //显示===================================//将分页给dao层使用
            map.put("userList", userDao.findUserList(pageUtil, user));
            //分页
            map.put("pageUtil", pageUtil);
            return map;
        }
        return null;
    }

    /**
     * 删除用户
     *
     * @param user
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     */
    @Override
    public int deleteUser(User user, User loginUser) {
        if (true) {
            return 403;
        }
        if (loginUser == null) {
            return 401;
        }
        if (loginUser.getUserGroup().isGeneralUser()) {
            return 403;
        }
        return convertRowToHttpCode(userDao.deleteUser(user));
    }

    /**
     * 更新个人资料
     *
     * @param user
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     */
    @Override
    public int saveProfile(User user, User loginUser) {
        if (loginUser == null) {
            return 401;
        } else if (user == null || user.getUid() == 0) {
            return 400;
        } else if (user.getUid() != loginUser.getUid() && loginUser.getUserGroup().isGeneralUser()) {
            return 403;
        }
        User cacheUser = cache.getUser(user.getUid(), Cache.READ);
        if (cacheUser == null) {
            return 404;
        } else {
            user.setHead_photo(cacheUser.getHead_photo());
        }
        int row = userDao.saveProfile(user);
        if (row > 0) {
            User newUser = userDao.findUser(user);
            UserSetting userSetting = userDao.findUserSetting(newUser);
            newUser.setUserSetting(userSetting);
            //更新缓存中用户
            trigger.updateUser(newUser);
        }
        return convertRowToHttpCode(row);
    }

    /**
     * 返回用户的账户设置
     *
     * @param user      为null返回当前登陆用户，设置值时当uid与loginUser相同或loginUser为管理员时才返回
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * userSetting - 用户设置
     */
    @Override
    public Map<String, Object> getUserSetting(User user, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        int flag = 200;
        if (loginUser == null || loginUser.getUid() == 0) {
            flag = 401;
        } else if (user == null || user.getUid() == 0) {
            user = loginUser;
        }
        if (flag == 200) {
            if (user.getUid() == loginUser.getUid() || loginUser.getUserGroup().isManager()) {
                UserSetting userSetting = userDao.findUserSetting(user);
                if (userSetting != null) {
                    map.put("userSetting", userSetting);
                } else {
                    flag = 500;
                }
            } else {
                flag = 403;
            }
        }
        map.put("flag", flag);
        return map;
    }

    /**
     * 更新用户的账户设置
     *
     * @param userSetting 不设置uid时默认为当前登陆用户，当uid与loginUser相同或loginUser为管理员时才返回
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * userSetting - 用户设置
     */
    @Override
    public Map<String, Object> updateUserSetting(UserSetting userSetting, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        int flag = 200;
        if (loginUser == null) {
            flag = 401;
        } else if (userSetting == null) {
            flag = 400;
        } else if (userSetting.getUid() == 0) {
            userSetting.setUid(loginUser.getUid());
        }
        if (userSetting.getUid() != loginUser.getUid() && loginUser.getUserGroup().isGeneralUser()) {
            flag = 403;
        }
        User cacheUser = null;
        if (flag == 200) {
            cacheUser = cache.getUser(userSetting.getUid(), Cache.READ);
            if (cacheUser == null) {
                flag = 404;
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
                    flag = userDao.updateUserSetting(userSetting) > 0 ? 200 : 500;
                } else {
                    flag = 500;
                }
            }

        }
        map.put("flag", flag);
        if (flag == 200) {
            UserSetting newUserSetting = userDao.findUserSetting(cacheUser);
            cacheUser.setUserSetting(newUserSetting);
            map.put("userSetting", userSetting);
        }
        return map;
    }

    /**
     * 检查是否fansUser关注了hostUser
     *
     * @param hostUser
     * @param loginUser
     * @return flag - 200：已关注，404：未关注
     */
    @Override
    public int checkFollow(User hostUser, User loginUser) {
        if (loginUser == null || loginUser.getUid() == 0) {
            return 401;
        } else if (hostUser == null || hostUser.getUid() == 0) {
            return 400;
        } else {
            Follow follow = new Follow(loginUser.getUid(), hostUser.getUid());
            //userDao.checkFollow(follow)
            return cache.containsFollow(follow) > 0 ? 200 : 404;
        }
    }

    /**
     * 关注  相互关注则成为好友
     *
     * @param hostUser  被关注的用户
     * @param loginUser
     * @return flag - 200：关注成功，201：关注成功并成为好友，204：重复插入，401：需要登录，404：无此用户，500: 失败
     */
    @Override
    public int follow(User hostUser, User loginUser) {
        if (loginUser == null || loginUser.getUid() == 0) {
            return 401;
        } else if (hostUser == null || hostUser.getUid() == 0) {
            return 400;
        }
        hostUser = cache.getUser(hostUser.getUid(), Cache.READ);
        if (hostUser == null) {
            return 404;
        }
        Follow follow = new Follow(loginUser.getUid(), hostUser.getUid());
        int index = userDao.saveFollow(follow);
        if (index == 0) {
            return 404;
        } else if (index == 11) {
            return 204;
        } else if (index == 1) {
            trigger.follow(follow);
            //发送通知
            notifyService.theNewFollower(hostUser, loginUser, false);
            return 200;
        } else if (index == 2) {
            trigger.follow(follow);
            trigger.friend(new Friend(loginUser.getUid(), hostUser.getUid()));
            //发送通知
            notifyService.theNewFollower(hostUser, loginUser, true);
            return 201;
        } else {
            return 500;
        }
    }

    /**
     * 取消关注
     *
     * @param hostUser
     * @param loginUser
     * @return flag - 200：取消成功，201：取消成功并取消好友，401：需要登录，404：无此记录，500: 失败
     */
    @Override
    public int removeFollow(User hostUser, User loginUser) {
        if (loginUser == null || loginUser.getUid() == 0) {
            return 401;
        } else if (hostUser == null || hostUser.getUid() == 0) {
            return 400;
        }
        Follow follow = new Follow(loginUser.getUid(), hostUser.getUid());
        int row = userDao.deleteFollow(follow);
        if (row == 0) {
            return 404;
        } else if (row == 1) {
            trigger.unFollow(follow);
            return 200;
        } else if (row == 2) {
            trigger.unFollow(follow);
            trigger.unFriend(new Friend(loginUser.getUid(), hostUser.getUid()));
            return 201;
        } else {
            return 500;
        }
    }

    /**
     * 查询关注列表
     *
     * @param user
     * @param loginUser
     * @return
     */
    @Override
    public List<User> findFollowList(User user, User loginUser) {
        if (user == null || user.getUid() == 0) {
            return null;
        } else {
            return userDao.findFollowList(user);
        }
    }

    /**
     * 查询粉丝列表
     *
     * @param user
     * @param loginUser
     * @return
     */
    @Override
    public List<User> findFansList(User user, User loginUser) {
        if (user == null || user.getUid() == 0) {
            return null;
        } else {
            return userDao.findFansList(user);
        }
    }

    /**
     * 查询好友列表
     *
     * @param loginUser
     * @return
     */
    @Override
    public List<User> findFriendList(User loginUser) {
        if (loginUser == null || loginUser.getUid() == 0) {
            return null;
        } else {
            return userDao.findFriendList(loginUser);
        }
    }

    /**
     * 点击了文章
     *
     * @param user
     * @param article
     * @return
     */
    @Override
    public void hasClickArticle(User user, Article article) {
        //trigger event
        trigger.clickArticle(user, article);
        //articleDao.raiseClickCnt(article)
    }

    /**
     * 检查是否loginUser收藏了此文章
     *
     * @param article
     * @param loginUser
     * @return flag - 200：已收藏，404：未收藏
     */
    @Override
    public int checkCollection(Article article, User loginUser) {
        if (loginUser == null || loginUser.getUid() == 0) {
            return 401;
        } else if (article == null || article.getAid() == 0) {
            return 400;
        } else {
            return userDao.checkCollection(new Collection(loginUser.getUid(), article.getAid())) > 0 ? 200 : 404;
        }
    }

    /**
     * 收藏文章
     *
     * @param user
     * @param article
     * @return flag - 200：成功，204: 重复插入，401：需要登录，404: 无此文章，500: 失败
     */
    @Override
    public int collectArticle(User user, Article article) {
        if (user == null) {
            return 401;
        }
        Collection clet = new Collection(user.getUid(), article.getAid());
        clet.setClet_time(new Date().getTime());

        //user-->插入用户收藏表行
        int index = userDao.saveCollection(clet);
        if (index == 1) {
            //文章收藏数加1
            trigger.addCollection(article, user);
            //发送通知
            notifyService.collectedByUser(user, article);
        } else if (index == 2) {
            return 204;
        }
        return convertRowToHttpCode(index);
    }

    /**
     * 查找收藏文章列表
     *
     * @param user
     * @return list
     */
    @Override
    public List<Collection> findCollectList(User user) {
        return userDao.findCollectList(user);
    }

    /**
     * 取消收藏文章
     *
     * @param user
     * @param article
     * @return flag - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    @Override
    public int unCollectArticle(User user, Article article) {
        if (user == null) {
            return 401;
        }
        Collection clet = new Collection(user.getUid(), article.getAid());
        //user-->删除用户收藏表行
        int index = userDao.deleteCollection(clet);
        if (index > 0) {
            //文章收藏数减1
            trigger.deleteCollection(article, user);
        }
        return convertRowToHttpCode(index);
    }

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
    @Override
    public Map<String, Object> saveHeadPhoto(MultipartFile imageFile, MultipartFile imageRawFile, String head_photo_path, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        int flag = 200;
        if (loginUser == null) {
            flag = 401;
        } else if ((imageFile == null || imageFile.isEmpty()) && Utils.isEmpty(head_photo_path)) {
            flag = 400;
        }
        if (flag == 200) {
            try {
                String headPhotoValue = null;
                String headPhotoRawValue = null;
                if (imageFile != null && !imageFile.isEmpty()) {
                    String savePath = Config.get(ConfigConstants.ARTICLE_UPLOAD_RELATIVEPATH) + "image/head/" + loginUser.getUid() + "/";
                    String fileName = "head_photo_" + loginUser.getUid() + "_" + System.currentTimeMillis() + ".jpg";
                    String fileRawName = "head_photo_" + loginUser.getUid() + "_" + System.currentTimeMillis() + "_raw.jpg";
                    if (fileService.saveHeadPhotoFile(imageFile.getInputStream(), savePath, fileName)) {
                        fileService.saveHeadPhotoFile(imageRawFile.getInputStream(), savePath, fileRawName);
                        headPhotoValue = savePath + fileName;
                        headPhotoRawValue = savePath + fileRawName;
                    } else {
                        flag = 500;
                    }
                } else {
                    headPhotoValue = head_photo_path;
                    headPhotoRawValue = head_photo_path;
                }
                if (flag == 200) {
                    User cacheUser = cache.getUser(loginUser.getUid(), Cache.READ);
                    cacheUser.setHead_photo(headPhotoValue);
                    flag = saveProfile(cache.cloneUser(cacheUser), loginUser);
                    map.put("head_photo", headPhotoValue);
                    map.put("head_photo_raw", headPhotoRawValue);
                }
            } catch (IOException e) {
                e.printStackTrace();
                flag = 500;
            }
        }
        map.put("flag", flag);
        return map;
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
