package site.imcoder.blog.service.impl;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.Callable;
import site.imcoder.blog.dao.IAlbumDao;
import site.imcoder.blog.dao.IArticleDao;
import site.imcoder.blog.dao.ISiteDao;
import site.imcoder.blog.dao.IVideoDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.event.IEventTrigger;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.service.IManagerService;
import site.imcoder.blog.service.INotifyService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;
import site.imcoder.blog.setting.ConfigManager;
import site.imcoder.blog.setting.GlobalConstants;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.io.File;
import java.util.*;
import java.util.regex.Pattern;

/**
 * 后台管理
 *
 * @author Jeffrey.Deng
 * @date 2017-10-25
 */
@Service("managerService")
public class ManagerServiceImpl implements IManagerService {

    private static Logger logger = Logger.getLogger(ManagerServiceImpl.class);

    @Resource
    private Cache cache;

    @Resource
    private ISiteDao siteDao;

    @Resource
    private IArticleDao articleDao;

    @Resource
    private IAlbumDao albumDao;

    @Resource
    private IVideoDao videoDao;

    @Resource(name = "fileService")
    private IFileService fileService;

    @Resource
    private INotifyService notifyService;

    @Resource
    private IEventTrigger trigger;

    @Resource
    private ConfigManager configManager;

    @PostConstruct
    public void init() {
        // 注册返回WebSocket状态事件
        notifyService.onmessage("status", new Callable<WsMessage, WsMessage>() {
            @Override
            public WsMessage call(WsMessage wsMessage) throws Exception {
                User loginUser = wsMessage.getUser();
                if (loginUser != null && loginUser.getUserGroup().isManager()) {  // 仅管理员响应
                    Set<WebSocketSession> allPushSessions = notifyService.getAllPushSessions();
                    Map<Integer, User> users = new HashMap<>();  // 返回WebSocket状态
                    List pages = new ArrayList();
                    for (WebSocketSession wss : allPushSessions) {
                        User u = null;
                        if (wss != null && wss.getAttributes() != null) {
                            u = (User) (wss.getAttributes().get(GlobalConstants.LOGIN_USER_KEY));
                        }
                        if (u != null && !users.containsKey(u.getUid())) {
                            users.put(u.getUid(), cache.cloneUser(u));
                        }
                        pages.add(wss.getAttributes().get("page_info"));
                    }
                    users.remove(null);
                    WsMessage statusMessage = new WsMessage("status");
                    statusMessage.setMetadata("users", users.values());
                    statusMessage.setMetadata("pages", pages);
                    statusMessage.setMetadata("uv", users.size());
                    statusMessage.setMetadata("pv", allPushSessions.size());
                    return statusMessage;
                } else {
                    return null;
                }
            }
        });
        // 注册“管理推送消息”事件
        notifyService.onmessage("push_manager_notify", new Callable<WsMessage, WsMessage>() {
            @Override
            public WsMessage call(WsMessage wsMessage) throws Exception {
                if (isAdmin(wsMessage.getUser()) == 200) {
                    WsMessage pushMessage = new WsMessage();
                    if (wsMessage.getId() != 0) {
                        pushMessage.setId(wsMessage.getId());
                    }
                    pushMessage.setMapping("push_manager_notify");
                    pushMessage.setContent(wsMessage.getContent());
                    pushMessage.setMetadata(wsMessage.getMetadata());
                    if (wsMessage.getMetadata("users") != null) {   // 推送给某些用户
                        List<Integer> userIds = (List<Integer>) wsMessage.getMetadata("users");
                        List<User> users = new ArrayList<>();
                        for (Integer userId : userIds) {
                            User u = new User();
                            u.setUid(userId);
                            users.add(u);
                        }
                        notifyService.pushWsMessage(users, pushMessage);
                    } else {    // 推送给全部用户
                        notifyService.pushWsMessageToAll(pushMessage);
                    }
                }
                return null;
            }
        });
    }

    /**
     * 重新初始化缓存
     */
    @Override
    public int reloadCache(User loginUser) {
        int auth = isAdmin(loginUser);
        if (auth == 200) {
            int flag = 200;
            try {
                cache.reload();
            } catch (Exception e) {
                flag = 500;
                e.printStackTrace();
                logger.error("重新初始化缓存失败", e);
            }
            return flag;
        } else {
            return auth;
        }
    }

    /**
     * 重新读取配置文件
     */
    @Override
    public int reloadConfig(User loginUser) {
        int auth = isAdmin(loginUser);
        if (auth == 200) {
            int flag = 200;
            try {
                configManager.reloadConfig();
            } catch (Exception e) {
                flag = 500;
                e.printStackTrace();
                logger.error("重新读取配置文件错误", e);
            }
            return flag;
        } else {
            return auth;
        }
    }

    /**
     * 更新配置
     */
    @Override
    public int updateConfig(String key, String value, User loginUser) {
        int auth = isAdmin(loginUser);
        if (auth == 200) {
            int flag = 200;
            try {
                if (key != null && value != null && !key.equals("") && !value.equals("")) {
                    configManager.updateConfig(key, value);
                } else {
                    flag = 400;
                }
            } catch (Exception e) {
                flag = 500;
                e.printStackTrace();
                logger.error("重新读取配置文件错误", e);
            }
            return flag;
        } else {
            return auth;
        }
    }

    /**
     * 取得所有配置
     */
    public Map<String, Object> getAllConfig(User loginUser) {
        Map<String, Object> map = new HashMap<String, Object>();
        int auth = isAdmin(loginUser);
        map.put("flag", auth);
        if (auth == 200) {
            map.put("configMap", Config.getAll());
        }
        return map;
    }

    /**
     * 更换用户组
     * 管理员不能将别人提升为管理员
     * 管理员不能将其他管理员降级为会员
     *
     * @param user      需要参数：user.uid, user.userGroup.gid
     * @param loginUser
     * @return flag: 400: 参数错误，401：未登录， 403：无权修改， 404：用户不存在或提交的gid不存在， 500：服务器错误
     */
    @Override
    public int updateUserGroup(User user, User loginUser) {
        if (user == null || user.getUid() == 0 || user.getUserGroup() == null) {
            return 400;
        }
        int auth = isAdmin(loginUser);
        if (auth == 200) {
            User cacheUser = cache.getUser(user.getUid(), Cache.WRITE);
            if (cacheUser == null) {
                return 404;
            } else if (user.getUserGroup().isGeneralUser()) {
                if (cacheUser.getUserGroup().isManager()) { // 管理员不能将其他管理员降级为会员
                    return 403;
                } else {
                    List<UserGroup> userGroupList = siteDao.findUserGroupList();
                    UserGroup newGroup = null;
                    for (UserGroup group : userGroupList) {
                        if (group.getGid() == user.getUserGroup().getGid()) {
                            newGroup = group;
                        }
                    }
                    if (newGroup != null) {
                        int row = siteDao.updateUserGroup(user);
                        if (row > 0) {
                            cacheUser.getUserGroup().setGid(newGroup.getGid());
                            cacheUser.getUserGroup().setGroup_name(newGroup.getGroup_name());
                        }
                        return row > 0 ? 200 : 500;
                    } else {
                        // 输入的gid不存在
                        return 404;
                    }
                }
            } else {  // 管理员不能将别人提升为管理员
                return 403;
            }
        } else {
            return auth;
        }
    }

    /**
     * 查询所有的用户组信息
     *
     * @param loginUser
     * @return
     */
    @Override
    public Map<String, Object> findUserGroupList(User loginUser) {
        Map<String, Object> map = new HashMap<String, Object>();
        int auth = isAdmin(loginUser);
        map.put("flag", auth);
        if (auth == 200) {
            map.put("userGroups", siteDao.findUserGroupList());
        }
        return map;
    }

    @Override
    public Map<String, Object> getBlogInfo(User loginUser) {
        Map<String, Object> map = new HashMap<String, Object>();
        int auth = isAdmin(loginUser);
        map.put("flag", auth);
        if (auth == 200) {
            map.put("articleCount", (Integer) cache.siteBuffer.get("articleCount"));
            map.put("userCount", (Integer) cache.siteBuffer.get("userCount"));
            map.put("articleViewCount", (Integer) cache.siteBuffer.get("articleViewCount"));
        }
        return map;
    }

    @Override
    public Map<String, Object> getUserList(User loginUser) {
        Map<String, Object> map = new HashMap<>();
        int auth = isAdmin(loginUser);
        map.put("flag", auth);
        if (auth == 200) {
            List<User> list = siteDao.loadUserTable();
            for (User user : list) {
                cache.fillUserStats(user, false);
            }
            map.put("userList", list);
        }
        return map;
    }

    @Override
    public Map<String, Object> getArticleInfoList(User loginUser) {
        Map<String, Object> map = new HashMap<>();
        int auth = isAdmin(loginUser);
        map.put("flag", auth);
        if (auth == 200) {
            List<Article> list = siteDao.findArticleBaseList();
            for (Article article : list) {
                cache.fillArticleStats(article);
            }
            map.put("articleList", list);
        }
        return map;
    }

    @Override
    public int updateArticleInfo(Article article, User loginUser) {
        int auth = isAdmin(loginUser);
        if (auth == 200) {
            int row = siteDao.updateArticleInfoByManager(article);
            if (row > 0) {
                Article article_new = articleDao.find(article.getAid());
                trigger.updateArticle(article_new, article_new.getAuthor());
            }
            return convertRowToHttpCode(row);
        } else {
            return auth;
        }
    }

    /**
     * 升级旧地址格式为新地址格式
     *
     * @param loginUser
     * @return
     */
    @Override
    public int upgradeNewFileNameStyle(User loginUser) {
        int auth = isAdmin(loginUser);
        if (auth == 200) {
            if (!Config.getBoolean(ConfigConstants.SITE_ALLOW_RUN_UPGRADE)) {
                return 404;
            }
            new Thread(new Runnable() {
                @Override
                public void run() {
                    long start = new Date().getTime();
                    int album = upgradeAlbumNewFileNameStyle();
                    if (album == 200) {
                        int video = upgradeVideoNewFileNameStyle();
                        long end = new Date().getTime();
                        if (video == 200) {
                            logger.info("upgrade file name old style to new style: successfully! completed in " + ((end - start) / 1000) + " seconds.");
                            return;
                        }
                    }
                    long end = new Date().getTime();
                    logger.error("upgrade file name old style to new style: fail! after run " + ((end - start) / 1000) + " seconds.");
                }
            }).start();
            return 200;
        } else {
            return auth;
        }
    }

    /**
     * 升级相册旧地址格式为新地址格式
     *
     * @return
     */
    private int upgradeAlbumNewFileNameStyle() {
        String basePath = Config.get(ConfigConstants.CLOUD_FILE_BASEPATH);
        Pattern isAlreadyNew = Pattern.compile("^.*/album/\\d{5}/\\d{3}/\\d{5}_\\d{4}_.+$");
        List<Album> albumList = siteDao.loadAlbumTable(null);
        for (Album album : albumList) {
            List<Photo> photoList = siteDao.loadPhotoTable(album);
            for (Photo photo : photoList) {
                String oldPath = photo.getPath();
                if (isAlreadyNew.matcher(oldPath).matches()) { // 已经是新地址了
                    continue;
                }
                String photoFolder = fileService.generatePhotoFolderPath(album);
                String newPath = photoFolder + fileService.generateNextPhotoFilename(photo, photoFolder);
                if (fileService.move(basePath + oldPath, basePath + newPath, true)) {
                    photo.setPath(newPath);
                    if (albumDao.updatePhoto(photo) == -1) {
                        logger.error("upgradeAlbumNewFileNameStyle: update video photo fail, photo_id: " + photo.getPhoto_id() + ", path: \"" + photo.getPath() + "\"");
                        return 500;
                    }
                    if (siteDao.updateArticleFilePath(oldPath, newPath) < 0) {
                        return 500;
                    }
                } else {
                    logger.error("upgradeAlbumNewFileNameStyle: move image file \"" + oldPath + "\" to \"" + newPath + "\" fail");
                    return 500;
                }
            }
            if (album.getAlbum_id() <= 9999) {
                String rp = Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + album.getUser().getUid() + "/album/" + album.getAlbum_id() + "/";
                if (new File(basePath + rp).exists()) {
                    fileService.recycleTrash(basePath, rp, false);
                }
            }
            // 相册封面信息存储模式已修改，故不需要下列代码了
//            int cover_id = 0;
//            try {
//                JSONObject cover = new JSONObject(album.getCover());
//                cover_id = (int) cover.get("photo_id");
//            } catch (Exception e) {
//
//            } finally {
//                String json = Config.get(ConfigConstants.ALBUM_DEFAULT_COVER);
//                if (cover_id > 0) {
//                    Photo p = new Photo();
//                    p.setPhoto_id(cover_id);
//                    Photo photoInfo = albumDao.findPhotoInfo(p);
//                    json = "{\"path\": \"" + photoInfo.getPath() + "\", \"photo_id\": " + photoInfo.getPhoto_id() + ", \"width\": " + photoInfo.getWidth() + ", \"height\": " + photoInfo.getHeight() + "}";
//                }
//                album.setCover(json);
//                albumDao.updateCoverForAlbum(album);
//            }
        }
        return 200;
    }

    /**
     * 升级视频旧地址格式为新地址格式
     *
     * @return
     */
    public int upgradeVideoNewFileNameStyle() {
        String basePath = Config.get(ConfigConstants.CLOUD_FILE_BASEPATH);
        Pattern isAlreadyNew = Pattern.compile("^.*/video/\\d{5}/\\d{5}_\\d{4}_.+$");
        List<Video> videoList = siteDao.loadVideoTable(null);
        for (Video video : videoList) {
            if (video.getSource_type() == 0) {
                String oldPath = video.getPath();
                if (isAlreadyNew.matcher(oldPath).matches()) { // 已经是新地址了
                    continue;
                }
                String videoFolder = fileService.generateVideoFolderPath(video);
                String newPath = videoFolder + fileService.generateNextVideoName(video, videoFolder);
                if (fileService.move(basePath + oldPath, basePath + newPath, true)) {
                    video.setPath(newPath);
                    if (videoDao.updateVideo(video) == -1) {
                        logger.error("upgradeVideoNewFileNameStyle: update video path fail, video_id: " + video.getVideo_id() + ", path: \"" + video.getPath() + "\"");
                        return 500;
                    }
                } else {
                    logger.error("upgradeVideoNewFileNameStyle: move video file \"" + oldPath + "\" to \"" + newPath + "\" fail");
                    return 500;
                }
            }
        }
        for (Video video : videoList) {
            if (video.getCover().getAlbum_id() > 9999) {
                break;
            }
            String relative = Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + video.getUser().getUid() + "/video/" + video.getCover().getAlbum_id() + "/";
            File dir = new File(basePath + relative);
            if (dir.exists()) {
                fileService.recycleTrash(basePath, relative, false);
            }
        }
        return 200;
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

    /**
     * @return int
     * 403 ： 不是管理员
     * 401 ： 未登录
     * 200 ： 是管理员
     */
    private int isAdmin(User loginUser) {
        if (loginUser == null) {
            return 401;
        } else if (loginUser.getUserGroup().isManager()) {
            return 200;
        } else {
            return 403;
        }
    }
}
