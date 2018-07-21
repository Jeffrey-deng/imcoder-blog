package site.imcoder.blog.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.PageUtil;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.dao.IUserDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.event.IEventTrigger;
import site.imcoder.blog.service.IEmailService;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.service.ISiteService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 业务实现类
 *
 * @author dengchao
 */
@Service("userService")
public class UserServiceImpl implements IUserService {

    //依赖注入DAO
    @Resource
    private IUserDao userDao;

    @Resource
    private Cache cache;

    @Resource
    private IEmailService emailService;

    @Resource
    private IFileService fileService;

    @Resource
    private ISiteService siteService;

    @Resource
    private IEventTrigger trigger;

    /**
     * 注册用户
     *
     * @param user
     * @return flag - 200：成功，500: 失败
     */
    public int register(User user) {
        user.setUserGroup(new UserGroup(0));
        user.setRegister_time(new Date());
        user.setHead_photo("img/default_man.jpg");
        user.setLock_status(0);
        user.setArticleCount(0);
        user.setFollowCount(0);
        user.setFansCount(0);
        if (user.getNickname() == null || user.getNickname().equals("")) {
            user.setNickname("用户xx");
        }
        if (user.getSex() == null || user.getSex().equals("")) {
            user.setSex("未知");
        } else if (user.getSex().equals("女")) {
            user.setHead_photo("img/default_miss.jpg");
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
        //md5 加密
        user.setPassword(Utils.MD("MD5", user.getPassword()));

        int row = userDao.saveUser(user);
        if (row > 0) {
            trigger.newUser(user);
            //欢迎邮件
            emailService.welcomeMail(user);
            List<User> managers = cache.getManagers();
            if (managers.size() > 0) {
                emailService.notifyManagerNewUserMail(managers, user);
            }
        }
        return row > 0 ? 200 : 500;
    }


    /**
     * 根据ID或name email 密码 登陆用户
     *
     * @param user
     * @param remember
     * @return flag - 200：成功，400: 无参数，401：凭证错误，403：账号冻结，404：无此用户
     * user - 用户对象
     */
    public Map<String, Object> login(User user, boolean remember) {
        Map<String, Object> map = new HashMap<>();
        if (user == null || "".equals(user.getPassword()) || "".equals(user.getToken())) {
            map.put("flag", 400);
            return map;
        }
        User dbUser = userDao.findUser(user);
        map.put("flag", 401);
        if (dbUser == null) {
            map.put("flag", 404);
        } else if (dbUser.getLock_status() == 1) {
            map.put("flag", 403);
            // 如果是令牌登录，则判断令牌
        } else if (user.getPassword() == null && user.getToken() != null && dbUser.getToken() != null) {
            if ("false".equals(Config.get(ConfigConstants.USER_LOGIN_STRICT)) || user.getLoginIP().equals(dbUser.getLoginIP())) {
                String encryptedToken = Utils.MD("MD5", dbUser.getUid() + user.getToken());
                if (encryptedToken.equals(dbUser.getToken())) {
                    User cacheUser = cache.getUser(dbUser.getUid(), Cache.READ);
                    map.put("user", cacheUser);
                    map.put("flag", 200);
                    cache.putTokenEntry(encryptedToken, user.getToken()); // 在服务器重启时重新注入映射关系到缓存
                }
            }
            //如果是密码登录，判断（用户存在且密码相等）
        } else if (user.getPassword() != null && dbUser.getPassword().equals(Utils.MD("MD5", user.getPassword()))) {
            User cacheUser = cache.getUser(dbUser.getUid(), Cache.READ);
            cacheUser.setLoginIP(user.getLoginIP());
            if (remember) {
                String beforeUseToken = cache.getTokenEntry(dbUser.getToken()); //获取上次用户的token
                if ("false".equals(Config.get(ConfigConstants.USER_LOGIN_STRICT)) && beforeUseToken != null && dbUser.getToken() != null && dbUser.getToken().length() > 0) {
                    cacheUser.setToken(dbUser.getToken()); //非严格模式下，如果之前有了token，则复用，让多个终端保持自动登陆
                    map.put("token", beforeUseToken);
                } else {
                    String encryptedToken = Utils.MD("MD5", dbUser.getUid() + user.getToken()); // 加密token
                    cacheUser.setToken(encryptedToken); //上面条件不成立则产生新的token
                    cache.putTokenEntry(encryptedToken, user.getToken()); //缓存下加密的token与未加密的token的映射关系
                    map.put("token", user.getToken());
                }
                userDao.updateTokenAndIp(cacheUser);
            } else if (!user.getLoginIP().equals(dbUser.getLoginIP())) {
                if ("true".equals(Config.get(ConfigConstants.USER_LOGIN_STRICT))) {
                    cacheUser.setToken(""); //当是严格模式且登录IP不同时，清除token
                }
                userDao.updateTokenAndIp(cacheUser);
            }
            map.put("user", cacheUser);
            map.put("flag", 200);
        }
        return map;
    }

    /**
     * 清除自动登录令牌
     *
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，404：无此用户，500: 失败
     */
    public int clearToken(User loginUser) {
        if (loginUser == null) {
            return 401;
        }
        cache.removeTokenEntry(loginUser.getToken());
        loginUser.setToken("");
        loginUser.setLoginIP(null);
        return convertRowToHttpCode(userDao.updateTokenAndIp(loginUser));
    }

    /**
     * 根据ID或name email查询用户
     *
     * @param user
     * @param loginUser
     * @return
     */
    public User findUser(User user, User loginUser) {
        User hostUser = userDao.findUser(user);
        if (hostUser != null) {
            if (cache.getUser(hostUser.getUid(), Cache.READ) == null) {
                trigger.newUser(hostUser);
            }
            cache.fillUserStats(hostUser);
            hostUser.setPassword(null);
            hostUser.setToken(null);
            //loginUser-->判断主人各项资料访客的查看权限
            if (loginUser == null || (user.getUid() != loginUser.getUid() && loginUser.getUserGroup().getGid() == 0)) {
                hostUser.setLoginIP(null);
                hostUser.setUsername(null);
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
     * @param synchronize 是否从缓存中查找
     * @return
     */
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
    public int deleteUser(User user, User loginUser) {
        if (loginUser == null) {
            return 401;
        }
        if (loginUser.getUserGroup().getGid() != 1) {
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
    public int saveProfile(User user, User loginUser) {
        if (loginUser == null) {
            return 401;
        }
        if (user.getUid() != loginUser.getUid() && loginUser.getUserGroup().getGid() == 0) {
            return 403;
        }
        if (user.getHead_photo().equals("img/default_miss.jpg") || user.getHead_photo().equals("img/default_man.jpg")) {
            if (user.getSex().equals("女")) {
                user.setHead_photo("img/default_miss.jpg");
            } else {
                user.setHead_photo("img/default_man.jpg");
            }
        }
        int row = userDao.saveProfile(user);
        if (row > 0) {
            User newUser = userDao.findUser(user);
            newUser.setPassword("");
            //更新缓存中用户
            trigger.updateUser(newUser);
        }
        return convertRowToHttpCode(row);
    }

    /**
     * 更新账号信息
     *
     * @param user
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     */
    public int updateAccount(User user, User loginUser) {
        if (loginUser == null) {
            return 401;
        }
        if (user.getUid() != loginUser.getUid() && loginUser.getUserGroup().getGid() == 0) {
            return 403;
        }
        if (user.getPassword() != null && !user.getPassword().equals("")) {
            //md5 加密
            user.setPassword(Utils.MD("MD5", user.getPassword()));
        }
        int row = userDao.updateAccount(user);
        if (row > 0) {
            User newUser = userDao.findUser(user);
            newUser.setPassword(null);
            //清除token，使所有终端自动登录失效
            clearToken(newUser);
            //更新缓存中用户
            trigger.updateUser(newUser);
        }
        return convertRowToHttpCode(row);
    }

    /**
     * 检查是否fansUser关注了hostUser
     *
     * @param hostUser
     * @param loginUser
     * @return flag - 200：已关注，404：未关注
     */
    public int checkFollow(User hostUser, User loginUser) {
        Follow follow = new Follow(loginUser.getUid(), hostUser.getUid());
        //userDao.checkFollow(follow)
        return cache.containsFollow(follow) > 0 ? 200 : 404;
    }

    /**
     * 关注  相互关注则成为好友
     *
     * @param hostUser  被关注的用户
     * @param loginUser
     * @return flag - 200：关注成功，201：关注成功并成为好友，204：重复插入，401：需要登录，404：无此用户，500: 失败
     */
    public int follow(User hostUser, User loginUser) {
        if (loginUser == null) {
            return 401;
        }
        Follow follow = new Follow(loginUser.getUid(), hostUser.getUid());
        int index = userDao.saveFollow(follow);
        loginUser = cache.getUser(loginUser.getUid(), Cache.READ);
        hostUser = cache.getUser(hostUser.getUid(), Cache.READ);
        if (index == 0) {
            return 404;
        } else if (index == 11) {
            return 204;
        } else if (index == 1) {
            trigger.follow(follow);
            //系统通知
            String message = hostUser.getNickname() + "你好，有新的用户关注了你：<a style=\"color:#18a689;\" href=\"user.do?method=home&uid=" + loginUser.getUid() + "\" target=\"_balnk\" >" + loginUser.getNickname() + "</a>";
            SysMsg sysMsg = new SysMsg(hostUser.getUid(), message, new Date().getTime(), 0);
            siteService.sendSystemMessage(sysMsg);
            //新关注者邮件通知
            emailService.theNewFollowerMail(cache.getUser(hostUser.getUid(), Cache.READ), loginUser);
            return 200;
        } else if (index == 2) {
            trigger.follow(follow);
            trigger.friend(new Friend(loginUser.getUid(), hostUser.getUid()));
            //系统通知
            String message = hostUser.getNickname() + "你好，有新的用户关注了你：<a style=\"color:#18a689;\" href=\"user.do?method=home&uid=" + loginUser.getUid() + "\" target=\"_balnk\" >" + loginUser.getNickname() + "</a>，由于相互关注你们成为了好友。";
            SysMsg sysMsg = new SysMsg(hostUser.getUid(), message, new Date().getTime(), 0);
            siteService.sendSystemMessage(sysMsg);
            //新关注者邮件通知
            emailService.theNewFollowerMail(cache.getUser(hostUser.getUid(), Cache.READ), loginUser);
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
    public int removeFollow(User hostUser, User loginUser) {
        if (loginUser == null) {
            return 401;
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
    public List<User> findFollowList(User user, User loginUser) {
        return userDao.findFollowList(user);
    }

    /**
     * 查询粉丝列表
     *
     * @param user
     * @param loginUser
     * @return
     */
    public List<User> findFansList(User user, User loginUser) {
        return userDao.findFansList(user);
    }

    /**
     * 查询好友列表
     *
     * @param loginUser
     * @return
     */
    public List<User> findFriendList(User loginUser) {
        return userDao.findFriendList(loginUser);
    }

    /**
     * 发送私信
     *
     * @param letter
     * @param loginUser
     * @return flag - 200：发送成功，401：需要登录，500: 失败
     */
    public int sendLetter(Letter letter, User loginUser) {
        if (loginUser == null) {
            return 401;
        } else {
            letter.setS_uid(loginUser.getUid());
        }
        User sendUser = cache.getUser(letter.getS_uid(), Cache.READ);
        User user = cache.getUser(letter.getR_uid(), Cache.READ);
        int row = userDao.saveLetter(letter);
        if (row > 0) {
            //收到私信邮件通知
            emailService.receivedLetterMail(user, sendUser);
        }
        return row > 0 ? 200 : 500;
    }

    /**
     * 查询私信列表
     *
     * @param user
     * @param read_status 0 未读 1全部
     * @return
     */
    public List<Letter> findLetterList(User user, int read_status) {
        return userDao.findLetterList(user, read_status);
    }

    /**
     * 查询系统消息列表
     *
     * @param user
     * @param read_status 0 未读 1全部
     * @return
     */
    public List<SysMsg> findSysMsgList(User user, int read_status) {
        return userDao.findSysMsgList(user, read_status);
    }

    /**
     * 点击了文章
     *
     * @param user
     * @param article
     * @return
     */
    public void hasClickArticle(User user, Article article) {
        //trigger event
        trigger.clickArticle(user, article);
        //articleDao.raiseClickCnt(article)
    }

    /**
     * 检查是否loginUser收藏了此文章
     *
     * @param article
     * @param user
     * @return flag - 200：已收藏，404：未收藏
     */
    public int checkCollection(Article article, User user) {
        return userDao.checkCollection(new Collection(user.getUid(), article.getAid())) > 0 ? 200 : 404;
    }

    /**
     * 收藏文章
     *
     * @param user
     * @param article
     * @return flag - 200：成功，204: 重复插入，401：需要登录，404: 无此文章，500: 失败
     */
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

            //系统通知
            Article article_cache = cache.getArticle(article.getAid(), Cache.READ);
            String message = article_cache.getAuthor().getNickname() + "你好，有以下用户收藏了你的文章（" + article_cache.getTitle() + "）：<a style=\"color:#18a689;\" href=\"user.do?method=home&uid=" + user.getUid() + "\" target=\"_balnk\" >" + user.getNickname() + "</a>";
            SysMsg sysMsg = new SysMsg(article_cache.getAuthor().getUid(), message, new Date().getTime(), 0);
            siteService.sendSystemMessage(sysMsg);
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
     * @param file
     * @param user
     * @param fileName
     * @param request
     * @param map
     * @return flag - 200：成功，400: 图片为空，401：需要登录，403：无权限，404：无此用户，500: 失败
     */
    @Override
    public int saveHeadPhoto(MultipartFile file, User user, String fileName, HttpServletRequest request, Map map) {
        if (user == null) {
            return 401;
        }
        if (file == null) {
            return 400;
        }
        String savePath = Utils.getContextFatherPath() + "cloud/" + "user/" + user.getUid() + "/head";
        if (fileService.saveHeadPhotoFile(file, savePath, fileName)) {
            map.put("path", "user/" + user.getUid() + "/head/" + fileName);
            User updateUser = cache.getUser(user.getUid(), Cache.WRITE);
            updateUser.setHead_photo((String) map.get("head_photo"));
            return saveProfile(updateUser, user);
        } else {
            return 500;
        }
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
