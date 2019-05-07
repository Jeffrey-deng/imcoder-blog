package site.imcoder.blog.service.impl;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.Callable;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.dao.IAlbumDao;
import site.imcoder.blog.dao.IArticleDao;
import site.imcoder.blog.dao.ISiteDao;
import site.imcoder.blog.dao.IVideoDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.event.IEventTrigger;
import site.imcoder.blog.service.BaseService;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.service.IManagerService;
import site.imcoder.blog.service.INotifyService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;
import site.imcoder.blog.setting.ConfigManager;
import site.imcoder.blog.setting.GlobalConstants;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.io.File;
import java.sql.*;
import java.util.*;
import java.util.Date;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 后台管理
 *
 * @author Jeffrey.Deng
 * @date 2017-10-25
 */
@Service("managerService")
public class ManagerServiceImpl extends BaseService implements IManagerService {

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
                if (wsMessage.isManager()) {  // 仅管理员响应
                    Set<WebSocketSession> allPushSessions = notifyService.getAllPushSessions();
                    Map<Long, User> users = new HashMap<>();  // 返回WebSocket状态
                    List pages = new ArrayList();
                    for (WebSocketSession wss : allPushSessions) {
                        User u = null;
                        if (wss != null && wss.getAttributes() != null) {
                            u = (User) (wss.getAttributes().get(GlobalConstants.KEY_LOGIN_USER));
                        }
                        if (u != null && !users.containsKey(u.getUid())) {
                            users.put(u.getUid(), cache.cloneUser(u));
                        }
                        Object page_meta = wss.getAttributes().get("page_meta");
                        if (page_meta != null) {
                            pages.add(page_meta);
                        }
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
                if (wsMessage.isManager()) {
                    WsMessage pushMessage = new WsMessage();
                    if (wsMessage.getId() != 0) {
                        pushMessage.setId(wsMessage.getId());
                    }
                    pushMessage.setMapping("push_manager_notify");
                    pushMessage.setText(wsMessage.getText());
                    pushMessage.setMetadata(wsMessage.getMetadata());
                    pushMessage.setMetadata("currentManagerUid", wsMessage.getUser().getUid());
                    if (wsMessage.getMetadata("users") != null) {   // 推送给某些用户
                        List<String> userIds = (List<String>) wsMessage.getMetadata("users");
                        List<User> users = new ArrayList<>();
                        for (String userId : userIds) {
                            User u = new User(Long.parseLong(userId));
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
    public IResponse reloadCache(IRequest iRequest) {
        IResponse response = new IResponse(this, isAdmin(iRequest.getLoginUser()));
        if (response.isSuccess()) {
            try {
                cache.reload();
                response.setStatus(STATUS_SUCCESS, "已重新初始化缓存");
            } catch (Exception e) {
                e.printStackTrace();
                logger.error("重新初始化缓存失败", e);
                response.setStatus(STATUS_SERVER_ERROR, "重新初始化缓存失败: " + e.getClass().getName());
            }
        }
        return response;
    }

    /**
     * 重新读取配置文件
     */
    @Override
    public IResponse reloadConfig(IRequest iRequest) {
        IResponse response = new IResponse(this, isAdmin(iRequest.getLoginUser()));
        if (response.isSuccess()) {
            try {
                configManager.reloadConfig();
                response.setStatus(STATUS_SUCCESS, "已重新读取配置文件");
            } catch (Exception e) {
                e.printStackTrace();
                logger.error("重新读取配置文件错误", e);
                response.setStatus(STATUS_SERVER_ERROR, "重新读取配置文件错误: " + e.getClass().getName());
            }
        }
        return response;
    }

    /**
     * 更新配置
     */
    @Override
    public IResponse updateConfig(String key, String value, IRequest iRequest) {
        IResponse response = new IResponse(this, isAdmin(iRequest.getLoginUser()));
        if (response.isSuccess()) {
            try {
                if (key != null && value != null && !key.equals("") && !value.equals("")) {
                    boolean rs = configManager.updateConfig(key, value);
                    if (rs) {
                        response.setStatus(STATUS_SUCCESS, "已更新配置文件");
                    } else {
                        response.setStatus(STATUS_PARAM_ERROR, "提交配置参数不合适");
                    }
                } else {
                    response.setStatus(STATUS_PARAM_ERROR, "配置名和配置值不能为空~");
                }
            } catch (Exception e) {
                logger.error("更新配置文件错误", e);
                response.setStatus(STATUS_SERVER_ERROR, "更新配置文件错误: " + e.getClass().getName());
            }
        }
        return response;
    }

    /**
     * 取得所有配置
     *
     * @param iRequest
     * @return IResponse:
     * configMap
     */
    @Override
    public IResponse getAllConfig(IRequest iRequest) {
        IResponse response = new IResponse(this, isAdmin(iRequest.getLoginUser()));
        if (response.isSuccess()) {
            response.putAttr("configMap", Config.getAll());
        }
        return response;
    }

    /**
     * 更换用户组
     * 管理员不能将别人提升为管理员
     * 管理员不能将其他管理员降级为会员
     *
     * @param user     需要参数：user.uid, user.userGroup.gid
     * @param iRequest
     * @return IResponse:
     * status: 400: 参数错误，401：未登录， 403：无权修改， 404：用户不存在或提交的gid不存在， 500：服务器错误
     * userGroup: 新组信息
     */
    @Override
    public IResponse updateUserGroup(User user, IRequest iRequest) {
        IResponse response = new IResponse(this, isAdmin(iRequest.getLoginUser()));
        if (response.isFail()) {
            return response;
        }
        if (user == null || !IdUtil.containValue(user.getUid()) || user.getUserGroup() == null) {
            response.setStatus(STATUS_PARAM_ERROR, "需要参数：user.uid, user.userGroup.gid");
        } else {
            User cacheUser = cache.getUser(user.getUid(), Cache.WRITE);
            if (cacheUser == null) {
                response.setStatus(STATUS_NOT_FOUND, "用户" + user.getUid() + "不存在~");
            } else if (user.getUserGroup().isGeneralUser()) {
                if (cacheUser.getUserGroup().isManager()) { // 管理员不能将其他管理员降级为会员
                    response.setStatus(STATUS_FORBIDDEN, "管理员不能将其他管理员降级为会员");
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
                            response.putAttr("userGroup", newGroup);
                            response.setStatus(STATUS_SUCCESS, "已为用户" + user.getUid() + "更换用户组");
                        } else {
                            response.setStatus(STATUS_SERVER_ERROR);
                        }
                    } else {
                        // 输入的gid不存在
                        response.setStatus(STATUS_NOT_FOUND, "输入的gid不存在");
                    }
                }
            } else {  // 管理员不能将别人提升为管理员
                response.setStatus(STATUS_FORBIDDEN, "管理员不能将别人提升为管理员");
            }
        }
        return response;
    }

    /**
     * 查询所有的用户组信息
     *
     * @param iRequest
     * @return IResponse:
     * userGroups
     */
    @Override
    public IResponse findUserGroupList(IRequest iRequest) {
        IResponse response = new IResponse(this, isAdmin(iRequest.getLoginUser()));
        if (response.isSuccess()) {
            response.putAttr("userGroups", siteDao.findUserGroupList());
        }
        return response;
    }

    /**
     * SiteInfo
     *
     * @param iRequest
     * @return IResponse:
     * articleCount
     * userCount
     * articleViewCount
     */
    @Override
    public IResponse getSiteInfo(IRequest iRequest) {
        IResponse response = new IResponse(this, isAdmin(iRequest.getLoginUser()));
        if (response.isSuccess()) {
            response.putAttr("articleCount", cache.siteBuffer.get("article_count"));
            response.putAttr("userCount", cache.siteBuffer.get("user_count"));
            response.putAttr("totalAccessCount", cache.siteBuffer.get("total_access_count"));
            response.putAttr("articleAccessCount", cache.siteBuffer.get("article_access_count"));
            response.putAttr("todayAccessCount", cache.siteBuffer.get("today_access_count"));
        }
        return response;
    }

    /**
     * 获取用户列表
     *
     * @param iRequest
     * @return IResponse:
     * users
     */
    @Override
    public IResponse getUserList(IRequest iRequest) {
        IResponse response = new IResponse(this, isAdmin(iRequest.getLoginUser()));
        if (response.isSuccess()) {
            List<User> list = siteDao.loadUserTable();
            for (User user : list) {
                cache.fillUserStats(user, false);
            }
            response.putAttr("users", list);
        }
        return response;
    }

    /**
     * 获取文章列表
     *
     * @param iRequest
     * @return IResponse:
     * articles
     */
    @Override
    public IResponse getArticleInfoList(IRequest iRequest) {
        IResponse response = new IResponse(this, isAdmin(iRequest.getLoginUser()));
        if (response.isSuccess()) {
            List<Article> list = siteDao.findArticleBaseList();
            for (Article article : list) {
                cache.fillArticleStats(article);
            }
            response.putAttr("articles", list);
        }
        return response;
    }

    /**
     * 更新文章信息
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * article
     */
    @Override
    public IResponse updateArticleInfo(Article article, IRequest iRequest) {
        IResponse response = new IResponse(this, isAdmin(iRequest.getLoginUser()));
        if (response.isSuccess()) {
            int row = siteDao.updateArticleInfoByManager(article);
            if (row > 0) {
                Article article_new = articleDao.find(article.getAid());
                trigger.updateArticle(article_new, article_new.getAuthor());
                response.putAttr("article", article_new);
            }
            response.setStatus(convertRowToHttpCode(row));
        }
        return response;
    }

    /**
     * 升级服务
     *
     * @param version
     * @param iRequest
     * @return ResponseEntity：
     */
    @Override
    public IResponse upgradeService(String version, IRequest iRequest) {
        IResponse response = new IResponse(this, isAdmin(iRequest.getLoginUser()));
        if (response.isSuccess()) {
            if (!Config.getBoolean(ConfigConstants.SITE_ALLOW_RUN_UPGRADE)) {
                response.setStatus(STATUS_FORBIDDEN, "SITE_ALLOW_RUN_UPGRADE被设置为false，不允许执行升级~");
            } else {
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        long start = new Date().getTime();
                        //    int album = upgradeAlbumNewFileNameStyle();
                        //    if (album == STATUS_SUCCESS) {
                        //        int video = upgradeVideoNewFileNameStyle();
                        //        long end = new Date().getTime();
                        //        if (video == STATUS_SUCCESS) {
                        //            logger.info("upgrade file name old style to new style: successfully! completed in " + ((end - start) / 1000) + " seconds.");
                        //            return;
                        //        }
                        //    }
                        //    long end = new Date().getTime();
                        //    logger.error("upgrade file name old style to new style: fail! after run " + ((end - start) / 1000) + " seconds.");
                        int rs = upgradeNewPrimaryKeyStyle();
                        if (rs == STATUS_SUCCESS) {
                            long end = new Date().getTime();
                            logger.info("upgrade service \"upgrade primary key style\": successfully! completed in " + ((end - start) / 1000) + " seconds.");
                            return;
                        }
                        long end = new Date().getTime();
                        logger.error("upgrade service \"upgrade primary key style\": fail! after run " + ((end - start) / 1000) + " seconds.");
                    }
                }).start();
                response.setStatus(STATUS_SUCCESS, "已提交，请到日志查看结果~");
            }
        }
        return response;
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
            //    int cover_id = 0;
            //    try {
            //        JSONObject cover = new JSONObject(album.getCover());
            //        cover_id = (int) cover.get("photo_id");
            //    } catch (Exception e) {
            //
            //    } finally {
            //        String json = Config.get(ConfigConstants.ALBUM_DEFAULT_COVER);
            //        if (cover_id > 0) {
            //            Photo p = new Photo();
            //            p.setPhoto_id(cover_id);
            //            Photo photoInfo = albumDao.findPhotoInfo(p);
            //            json = "{\"path\": \"" + photoInfo.getPath() + "\", \"photo_id\": " + photoInfo.getPhoto_id() + ", \"width\": " + photoInfo.getWidth() + ", \"height\": " + photoInfo.getHeight() + "}";
            //        }
            //        album.setCover(json);
            //        albumDao.updateCoverForAlbum(album);
            //    }
        }
        return 200;
    }

    /**
     * 升级视频旧地址格式为新地址格式
     *
     * @return
     */
    private int upgradeVideoNewFileNameStyle() {
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


    public int upgradeNewPrimaryKeyStyle() {
        Properties jdbc_properties = ConfigManager.loadProperties(Utils.getClassPath() + "/server/jdbc.properties", "jdbc");
        Connection conn = null;
        try {
            Class.forName(jdbc_properties.getProperty("driver"));
            conn = DriverManager.getConnection(jdbc_properties.getProperty("url"), jdbc_properties.getProperty("username"), jdbc_properties.getProperty("password"));
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (SQLException e) {
            e.printStackTrace();
        }

        Statement statement = null;
        try {
            statement = conn.createStatement();
            // 更新文章
            List<Article> articleList = siteDao.findArticleBaseList();
            for (Article article : articleList) {
                long aid = article.getAid();
                long newAid = IdUtil.convertOldPrimaryKeyToNew(aid);
                long newUid = IdUtil.convertOldPrimaryKeyToNew(article.getAuthor().getUid());
                article.setAid(newAid);
                article.getAuthor().setUid(newUid);
                List<String> sqlList = new ArrayList<>();
                sqlList.add("update article set aid = " + newAid + ", uid = " + newUid + " where aid = " + aid);
                sqlList.add("update article_detail set aid = " + newAid + " where aid = " + aid);
                sqlList.add("update collection set aid = " + newAid + ", uid = " + newUid + " where aid = " + aid);
                int i = 0;
                try {
                    i = executeSQLUpdate(conn, statement, sqlList);
                } catch (SQLException e) {
                    logger.error("执行更新文章 -> aid: " + aid + "失败", e);
                    return 500;
                }
                logger.info("执行更新文章 -> aid: " + aid + "(新：" + newAid + "), 总共：" + sqlList.size() + ", 成功修改：" + i);
            }
            // 更新相册
            List<Album> albumList = siteDao.loadAlbumTable(null);
            for (Album album : albumList) {
                long album_id = album.getAlbum_id();
                long newAlbumId = IdUtil.convertOldPrimaryKeyToNew(album_id);
                long newUid = IdUtil.convertOldPrimaryKeyToNew(album.getUser().getUid());
                long newCoverId = (album.getCover() == null ? 0L : IdUtil.convertOldPrimaryKeyToNew(album.getCover().getPhoto_id()));
                album.setAlbum_id(newAlbumId);
                album.getUser().setUid(newUid);
                List<String> sqlList = new ArrayList<>();
                sqlList.add("update album set album_id = " + newAlbumId + ", uid = " + newUid + ", cover = " + newCoverId + " where album_id = " + album_id);
                List<AlbumPhotoRelation> aprList = albumDao.findAlbumPhotoRelationList(new Album(album_id));
                for (AlbumPhotoRelation apr : aprList) {
                    long newPhotoId = IdUtil.convertOldPrimaryKeyToNew(apr.getPhoto_id());
                    long sortPhotoId = apr.getSort() / 1000;
                    long sortLittle = apr.getSort() % 1000;
                    long newSort = IdUtil.convertOldPrimaryKeyToNew(sortPhotoId) + sortLittle;
                    // todo sort
                    sqlList.add("update album_photo_relation set photo_id = " + newPhotoId + ", album_id = " + newAlbumId + ", sort = " + newSort + " where aprid = " + apr.getAprid());
                }
                int i = 0;
                try {
                    i = executeSQLUpdate(conn, statement, sqlList);
                } catch (SQLException e) {
                    logger.error("执行更新相册 -> album_id: " + album_id + "失败", e);
                    return 500;
                }
                logger.info("执行更新相册 -> album_id: " + album_id + "(新：" + newAlbumId + "), 总共：" + sqlList.size() + ", 成功修改：" + i);
            }
            // 更新视频
            List<Video> videoList = siteDao.loadVideoTable(null);
            int vi = 0;
            for (Video video : videoList) {
                long video_id = video.getVideo_id();
                long newVideoId = IdUtil.convertOldPrimaryKeyToNew(video_id);
                long newUid = IdUtil.convertOldPrimaryKeyToNew(video.getUser().getUid());
                long newCoverId = IdUtil.convertOldPrimaryKeyToNew(video.getCover().getPhoto_id());
                List<String> videoSqlList = new ArrayList<>();
                video.setVideo_id(newVideoId);
                video.getUser().setUid(newUid);
                video.getCover().setPhoto_id(newCoverId);
                video.getCover().setUid(newUid);
                if (video.getSource_type() == 0) {
                    String dirPath = fileService.generateVideoSaveBlockPath(video);
                    String newPath = dirPath + fileService.generateVideoFilename(video, dirPath);
                    fileService.createDirs(dirPath);
                    if (fileService.existsFile(fileService.baseCloudDir(video.getPath())) && !fileService.move(fileService.baseCloudDir(video.getPath()), fileService.baseCloudDir(newPath), true)) {
                        return 500;
                    }
                    videoSqlList.add("update video set video_id = " + newVideoId + ", uid = " + newUid + ", cover_id = " + newCoverId + ", path = '" + newPath + "' where video_id = " + video_id);
                } else {
                    videoSqlList.add("update video set video_id = " + newVideoId + ", uid = " + newUid + ", cover_id = " + newCoverId + " where video_id = " + video_id);
                }
                try {
                    vi += executeSQLUpdate(conn, statement, videoSqlList);
                } catch (SQLException e) {
                    logger.error("执行更新视频 -> video_id: " + video_id + "失败", e);
                    return 500;
                }
            }
            logger.info("执行更新视频, 总共：" + videoList.size() + ", 成功修改：" + vi);
            // 更新照片
            List<Photo> photoList = siteDao.loadPhotoTable(null);
            int pi = 0;
            Pattern mount_pattern = Pattern.compile("^mount@(\\w+)$");
            for (Photo photo : photoList) {
                long photo_id = photo.getPhoto_id();
                long newAlbumId = IdUtil.convertOldPrimaryKeyToNew(photo.getAlbum_id());
                long newUid = IdUtil.convertOldPrimaryKeyToNew(photo.getUid());
                long newPhotoId = IdUtil.convertOldPrimaryKeyToNew(photo_id);
                long newTopicId = photo.getTopic() == null ? 0L : IdUtil.convertOldPrimaryKeyToNew(photo.getTopic().getPtwid());
                photo.setPhoto_id(newPhotoId);
                photo.setAlbum_id(newAlbumId);
                photo.setUid(newUid);
                String dirPath = fileService.generatePhotoSaveBlockPath(photo);
                String newPath = dirPath + fileService.generatePhotoFilename(photo, dirPath);
                fileService.createDirs(dirPath);
                if (fileService.existsFile(fileService.baseCloudDir(photo.getPath())) && !fileService.move(fileService.baseCloudDir(photo.getPath()), fileService.baseCloudDir(newPath), true)) {
                    return 500;
                }
                List<String> sqlList = new ArrayList<>();
                StringBuilder sb = new StringBuilder("");
                for (String tag : photo.getTags().split("#")) {
                    if (Utils.isNotEmpty(tag)) {
                        Matcher matcher = mount_pattern.matcher(tag);
                        if (matcher.find()) {
                            sb.append("#mount@").append(IdUtil.convertToShortPrimaryKey(IdUtil.convertOldPrimaryKeyToNew(Long.valueOf(matcher.group(1))))).append("#");
                        } else {
                            sb.append("#").append(tag).append("#");
                        }
                    }
                }
                sqlList.add("update photo set photo_id = " + newPhotoId + ", album_id = " + newAlbumId + ", uid = " + newUid + ", topic = " + newTopicId + ", path = '" + newPath + "', tags = '" + sb.toString() + "' where photo_id = " + photo_id);
                sqlList.add("update article_detail set detail = replace(detail, '" + photo.getPath() + "', '" + newPath + "')");
                sqlList.add("update article set summary = replace(summary, '" + photo.getPath() + "', '" + newPath + "')");
                try {
                    pi += executeSQLUpdate(conn, statement, sqlList);
                } catch (SQLException e) {
                    logger.error("执行更新照片 -> photo_id: " + photo_id + "失败", e);
                    return 500;
                }
            }
            logger.info("执行更新照片, 总共：" + (photoList.size() * 3) + ", 成功修改：" + pi);
            // 更新评论
            List<Comment> commentList = loadCommentList(conn, statement);
            List<String> commentSqlList = new ArrayList<>();
            for (Comment comment : commentList) {
                long newCid = IdUtil.convertOldPrimaryKeyToNew(comment.getCid());
                long newUid = IdUtil.convertOldPrimaryKeyToNew(comment.getUser().getUid());
                long newMainId = IdUtil.convertOldPrimaryKeyToNew(comment.getMainId());
                long newParentId = IdUtil.convertOldPrimaryKeyToNew(comment.getParentId());
                commentSqlList.add("update comment set cid = " + newCid + ", uid = " + newUid + ", main_id = " + newMainId + ", r_cid = " + newParentId + " where cid = " + comment.getCid());
            }
            int ci = 0;
            try {
                ci = executeSQLUpdate(conn, statement, commentSqlList);
            } catch (SQLException e) {
                logger.error("执行更新评论失败", e);
                return 500;
            }
            logger.info("执行更新评论, 总共：" + commentSqlList.size() + ", 成功修改：" + ci);
            // 更新标签
            List<PhotoTagWrapper> tagWrappers = loadTagWrapperList(conn, statement);
            List<String> tagSqlList = new ArrayList<>();
            for (PhotoTagWrapper tag : tagWrappers) {
                long newPtwid = IdUtil.convertOldPrimaryKeyToNew(tag.getPtwid());
                long newUid = IdUtil.convertOldPrimaryKeyToNew(tag.getUid());
                long newScope = IdUtil.convertOldPrimaryKeyToNew(tag.getScope());
                tagSqlList.add("update photo_tag_wrapper set ptwid = " + newPtwid + ", uid = " + newUid + ", scope = " + newScope + " where ptwid = " + tag.getPtwid());
            }
            int ti = 0;
            try {
                ti = executeSQLUpdate(conn, statement, tagSqlList);
            } catch (SQLException e) {
                logger.error("执行照片标签失败", e);
                return 500;
            }
            logger.info("执行更新照片标签, 总共：" + commentSqlList.size() + ", 成功修改：" + ti);
            // 更新用户
            List<User> userList = siteDao.loadUserTable();
            for (User user : userList) {
                Long uid = user.getUid();
                long newUid = IdUtil.convertOldPrimaryKeyToNew(uid);
                user.setUid(newUid);
                List<String> sqlList = new ArrayList<>();
                sqlList.add("update user set uid = " + newUid + " where uid = " + uid);
                sqlList.add("update user_auth set identifier = '" + newUid + "' where uid = " + uid + " and (identity_type = 0 or identity_type = 4)");
                sqlList.add("update user_auth set uid = " + newUid + " where uid = " + uid);
                sqlList.add("update user_setting set uid = " + newUid + " where uid = " + uid);
                sqlList.add("update user_status set uid = " + newUid + " where uid = " + uid);
                sqlList.add("update user_follow set uid = " + newUid + " where uid = " + uid);
                sqlList.add("update user_follow set fuid = " + newUid + " where fuid = " + uid);
                sqlList.add("update friends set uid = " + newUid + " where uid = " + uid);
                sqlList.add("update friends set fid = " + newUid + " where fid = " + uid);
                sqlList.add("update system_notice set uid = " + newUid + " where uid = " + uid);
                sqlList.add("update system_message set uid = " + newUid + " where uid = " + uid);
                sqlList.add("update letter set s_uid = " + newUid + " where s_uid = " + uid);
                sqlList.add("update letter set r_uid = " + newUid + " where r_uid = " + uid);
                int i = 0;
                try {
                    i = executeSQLUpdate(conn, statement, sqlList);
                } catch (SQLException e) {
                    logger.error("执行更新用户 -> uid: " + uid + ", nickname: " + user.getNickname() + "失败", e);
                    return 500;
                }
                logger.info("执行更新用户 -> uid: " + uid + "(新：" + newUid + "), 总共：" + sqlList.size() + ", 成功修改：" + i);
            }
        } catch (SQLException e) {
        } finally {
            if (statement != null) {
                try {
                    statement.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return 200;
    }

    private List<Comment> loadCommentList(Connection conn, Statement statement) {
        String query = "select cid, main_type, main_id, uid, r_cid from comment";
        List<Comment> commentList = null;
        ResultSet resultSet = null;
        try {
            resultSet = statement.executeQuery(query);
            commentList = new ArrayList<>();
            while (resultSet.next()) {
                Comment c = new Comment();
                c.setCid(resultSet.getLong("cid"));
                c.setMainType(resultSet.getInt("main_type"));
                c.setMainId(resultSet.getLong("main_id"));
                c.setUser(new User(resultSet.getLong("uid")));
                c.setParentId(resultSet.getLong("r_cid"));
                commentList.add(c);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            if (resultSet != null) {
                try {
                    resultSet.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return commentList;
    }

    private List<PhotoTagWrapper> loadTagWrapperList(Connection conn, Statement statement) {
        String query = "select ptwid, uid, scope  from photo_tag_wrapper";
        List<PhotoTagWrapper> tagWrapperList = null;
        ResultSet resultSet = null;
        try {
            resultSet = statement.executeQuery(query);
            tagWrapperList = new ArrayList<>();
            while (resultSet.next()) {
                PhotoTagWrapper tag = new PhotoTagWrapper();
                tag.setPtwid(resultSet.getLong("ptwid"));
                tag.setUid(resultSet.getLong("uid"));
                tag.setScope(resultSet.getLong("scope"));
                tagWrapperList.add(tag);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            if (resultSet != null) {
                try {
                    resultSet.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return tagWrapperList;
    }

    private int executeSQLUpdate(Connection conn, Statement statement, List<String> sqlList) throws SQLException {
        int success = 0;
        int i = 0;
        int batchSize = 15;
        try {
            while (sqlList.size() - i >= batchSize) {
                for (int j = i, maxIndex = (i + batchSize); j < maxIndex; j++, i++) {
                    statement.addBatch(sqlList.get(j));
                }
                int[] ints = statement.executeBatch();
                for (int anInt : ints) {
                    if (anInt > 0) {
                        success += anInt;
                    }
                }
            }
            for (int j = i; j < sqlList.size(); j++) {
                statement.addBatch(sqlList.get(j));
            }
            int[] ints = statement.executeBatch();
            for (int anInt : ints) {
                if (anInt > 0) {
                    success += anInt;
                }
            }
        } catch (SQLException e) {
            throw e;
        } finally {
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return success;
        }
    }

    @Override
    public String convertStatusCodeToWord(int status) {
        if (status == STATUS_FORBIDDEN) {
            return "你不是管理员，无权修改！";
        } else {
            return super.convertStatusCodeToWord(status);
        }
    }

}
