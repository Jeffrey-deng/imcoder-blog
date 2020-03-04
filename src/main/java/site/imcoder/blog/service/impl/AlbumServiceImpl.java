package site.imcoder.blog.service.impl;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang.StringEscapeUtils;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.TagWrapperType;
import site.imcoder.blog.common.type.UserGroupType;
import site.imcoder.blog.dao.IAlbumDao;
import site.imcoder.blog.dao.IUserDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.service.*;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 相册服务实现类
 *
 * @author dengchao
 * @date 2018/1/3.
 */
@Service("albumService")
public class AlbumServiceImpl extends BaseService implements IAlbumService {

    private static Logger logger = Logger.getLogger(AlbumServiceImpl.class);

    private static char COMMA = ',';

    private static char QUOTE = '\'';

    private static String MOUNT_PREFIX = "mount@";

    private static Comparator<Photo> ALBUM_PHOTO_COMPARATOR = new Comparator<Photo>() {
        @Override
        public int compare(Photo b, Photo n) {
            Long x = (IdUtil.containValue(b.getSort()) ? b.getSort() : b.getPhoto_id());
            Long y = (IdUtil.containValue(n.getSort()) ? n.getSort() : n.getPhoto_id());
            return x.compareTo(y);
        }
    };

    @Resource
    private IAlbumDao albumDao;

    @Resource
    private IUserDao userDao;

    @Resource(name = "fileService")
    private IFileService fileService;

    @Resource
    private IVideoService videoService;

    @Resource
    private IAuthService authService;

    @Resource
    private Cache cache;

    /**
     * 得到照片上传配置信息
     *
     * @param iRequest
     * @return IResponse:
     * <pre>
     * allowUploadLowestLevel
     * isAllowUpload
     * uploadArgs
     *   mode
     *   maxPhotoUploadSize
     *   maxVideoUploadSize
     * </pre>
     */
    @Override
    public IResponse getUploadConfigInfo(IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse uploadConfig = new IResponse();
        uploadConfig.putAttr("allowUploadLowestLevel", Config.getInt(ConfigConstants.CLOUD_ALLOW_UPLOAD_LOWEST_LEVEL));
        uploadConfig.putAttr("isAllowUpload", isAllowUpload(loginUser));
        // uploadArgs
        Map<String, Object> uploadArgs = new HashMap<>();
        uploadArgs.put("mode", Config.get(ConfigConstants.CLOUD_FILE_SYSTEM_MODE));
        uploadArgs.put("maxPhotoUploadSize", Integer.parseInt(Config.getChild(ConfigConstants.CLOUD_PHOTO_MAX_UPLOADSIZE, "@user_", loginUser.getUid() + "", ":")));
        uploadArgs.put("maxVideoUploadSize", Integer.parseInt(Config.getChild(ConfigConstants.CLOUD_VIDEO_MAX_UPLOADSIZE, "@user_", loginUser.getUid() + "", ":")));
        uploadConfig.putAttr("uploadArgs", uploadArgs);
        //
        uploadConfig.setStatus(STATUS_SUCCESS);
        return uploadConfig;
    }

    // 当前用户是否允许上传文件
    private boolean isAllowUpload(User loginUser) {
        if (loginUser == null) {
            return false;
        }
        // 云盘允许上传文件的用户组最低等级，值为对应用户组的Gid
        int lowestLevel = Config.getInt(ConfigConstants.CLOUD_ALLOW_UPLOAD_LOWEST_LEVEL);
        switch (UserGroupType.valueOf(lowestLevel)) {
            case NOVICE_USER:
                return true;
            case SENIOR_USER:
                int gid = loginUser.getUserGroup().getGid();
                return gid == UserGroupType.SENIOR_USER.value || gid == UserGroupType.MANAGER.value;
            case MANAGER:
                return loginUser.getUserGroup().isManager();
            default:
                return false;
        }
    }

    /**
     * 创建相册
     *
     * @param album
     * @param iRequest
     * @return map
     * status - 200：成功，400: 参数错误，401：需要登录，500：服务器错误
     * album - album对象
     */
    @Override
    public IResponse createAlbum(Album album, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        response.putAttr("album", album);
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (album == null) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else {
            album.setAlbum_id(IdUtil.generatePrimaryKey()); // 主键
            album.setUser(loginUser);
            album.setCover(generateDefaultCover());
            album.setCreate_time(new Date());
            album.setSize(0);
            album.setClick_count(0);
            album.setLike_count(0);
            album.setComment_count(0);
            fillAlbumNotRequiredValueIfNull(album);
            int index = albumDao.saveAlbum(album);
            if (index > 0) {
                // fileService.createAlbumFolder(fileService.generateAlbumPath(album));
                response.setStatus(STATUS_SUCCESS, "相册创建成功~");
            } else {
                response.setStatus(STATUS_SERVER_ERROR);
            }
        }
        return response;
    }

    /**
     * 只查找相册的信息
     *
     * @param album
     * @param iRequest
     * @return ResponseEntity
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到
     * album - album对象, 没有photos
     */
    @Override
    public IResponse findAlbumInfo(Album album, IRequest iRequest) {
        boolean loadActionRecord = iRequest.getAttr("loadActionRecord", true);
        IResponse response = new IResponse();
        if (album == null || !IdUtil.containValue(album.getAlbum_id())) {
            response.setStatus(STATUS_PARAM_ERROR, "参数错误，未指定album_id~");
            return response;
        }
        Album db_album = albumDao.findAlbumInfo(album);
        if (db_album == null) {
            response.setStatus(STATUS_NOT_FOUND, "无此相册~");
            return response;
        } else if (db_album.getCover() == null || !IdUtil.containValue(db_album.getCover().getPhoto_id())) {
            // 添加默认封面photo对象
            db_album.setCover(generateDefaultCover());
        }
        db_album.setPhotos(null);

        // 验证权限
        IResponse authResp = authService.validateUserPermissionUtil(db_album.getUser(), db_album.getPermission(), iRequest);
        if (authResp.isSuccess()) {
            response.putAttr("album", db_album).setStatus(STATUS_SUCCESS);
            if (loadActionRecord) {
                ActionRecord<Album> queryActionRecord = new ActionRecord<>();
                queryActionRecord.setCreation(db_album);
                queryActionRecord.setUser(iRequest.getLoginUser());
                queryActionRecord.setIp(iRequest.getAccessIp());
                ActionRecord<Album> albumActionRecord = userDao.findAlbumActionRecord(queryActionRecord);
                if (albumActionRecord != null) {
                    db_album.setAccessed(albumActionRecord.getAccessed());
                    db_album.setLiked(albumActionRecord.getLiked());
                    db_album.setCommented(albumActionRecord.getCommented());
                } else {
                    db_album.setAccessed(false);
                    db_album.setLiked(false);
                    db_album.setCommented(false);
                }
            }
        } else {
            response.putAttr("album", null).setStatus(authResp);
        }
        response.putAttr("cdn_path_prefix", Config.get(ConfigConstants.SITE_CLOUD_ADDR));
        return response;
    }

    /**
     * 查找出该相册的信息和图片列表
     *
     * @param album
     * @param iRequest
     * @return ResponseEntity
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册未找到
     * album - album对象 with photos
     * cloud_photo_preview_args -
     */
    @Override
    public IResponse findAlbumWithPhotos(Album album, IRequest iRequest) {
        boolean mount = iRequest.getAttr("mount", true);
        return findAlbumWithPhotos(album, mount, iRequest);
    }

    /**
     * 查找出该相册的信息和图片列表
     *
     * @param album
     * @param mount    是否加载挂载在此相册的照片
     * @param iRequest
     * @return ResponseEntity
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册未找到
     * album - album对象
     * cloud_photo_preview_args -
     */
    private IResponse findAlbumWithPhotos(Album album, boolean mount, IRequest iRequest) {
        IResponse response = findAlbumInfo(album, iRequest);
        if (response.isSuccess()) {
            Album db_album = response.getAttr("album");
            List<Photo> mountTagsPhotos = null;
            if (mount) {    // 开启手动挂载
                String mountTags = db_album.getMount();
                if (Utils.isNotBlank(mountTags)) { // 如果自动挂载
                    Pattern mountTagsPattern = Pattern.compile("^\\s*(tagWrapper:|tag:)?\\s*(.+)$");
                    Matcher mountTagsMatcher = mountTagsPattern.matcher(mountTags);
                    if (mountTagsMatcher.matches()) {   // 如果相册设置为自动挂载标签照片且设置正确的话，查找出对应的照片
                        boolean extend = false;
                        String mountTagsPrefix = mountTagsMatcher.group(1);
                        if (mountTagsPrefix == null || mountTagsPrefix.equalsIgnoreCase("tagWrapper:")) {
                            extend = true;
                        }
                        Photo mountTagsQueryPhoto = new Photo();
                        mountTagsQueryPhoto.setTags(mountTagsMatcher.group(2));
                        IResponse mountTagsPhotosResp = findPhotoList(null, mountTagsQueryPhoto, "and", -1, 0, extend, iRequest);
                        if (mountTagsPhotosResp.isSuccess()) {
                            mountTagsPhotos = mountTagsPhotosResp.getAttr("photos");
                            // 获取排序权重
                            List<AlbumPhotoRelation> aprList = albumDao.findAlbumPhotoRelationList(album);
                            Map<Long, AlbumPhotoRelation> aprMap = new HashMap<>();
                            if (aprList != null) {
                                for (AlbumPhotoRelation apr : aprList) {
                                    aprMap.put(apr.getPhoto_id(), apr);
                                }
                            }
                            for (Photo p : mountTagsPhotos) {
                                AlbumPhotoRelation apr = aprMap.get(p.getPhoto_id());
                                if (apr != null) {
                                    p.setSort(apr.getSort());
                                } else {
                                    p.setSort(p.getPhoto_id());
                                }
                            }
                        }
                    }
                }
            }
            Photo queryPhoto = new Photo();
            queryPhoto.setAlbum_id(db_album.getAlbum_id());
            IResponse photosResp = findPhotoList(mount ? "album_detail" : null, queryPhoto, "and", -1, 0, iRequest);
            if (photosResp.isSuccess()) {
                List<Photo> photos = photosResp.getAttr("photos");
                if (mountTagsPhotos != null) {  // 如果有挂载的标签照片，追加到数组
                    String shortAlbumId = IdUtil.convertToShortPrimaryKey(db_album.getAlbum_id());
                    mountTagsPhotos = mountTagsPhotos.stream().filter(mountPhoto -> {
                        for (Photo p : photos) { // 过滤重复的
                            if (p.getPhoto_id().equals(mountPhoto.getPhoto_id())) {
                                return false;
                            }
                        }
                        // 过滤手动取消挂载的
                        if (mountPhoto.getTags() != null &&
                                mountPhoto.getTags().indexOf("#not-mount@" + shortAlbumId + "#") != -1) {
                            return false;
                        } else {
                            return true;
                        }
                    }).collect(Collectors.toList());
                    photos.addAll(mountTagsPhotos);
                    Collections.sort(photos, (left, right) -> left.getSort().compareTo(right.getSort()));
                }
                db_album.setPhotos(photos);
                db_album.setSize(photos.size());
            } else {
                response.setStatus(photosResp);
            }
            //    List<Photo> photos = albumDao.findPhotosFromAlbum(db_album);
            //    if (photos == null) {
            //        photos = new ArrayList<>();
            //    }
            //    db_album.setPhotos(photos);
            //    if (mount) {
            //        Photo mountCondition = new Photo(); // 该相册挂载的查找条件
            //        mountCondition.setUid(db_album.getUser().getUid());
            //        mountCondition.setTags("<" + MOUNT_PREFIX + IdUtil.convertToShortPrimaryKey(db_album.getAlbum_id()) + ">");
            //        ResponseEntity mountPhotosResp = findPhotoList(mountCondition, "and", -1, 0, loginUser);
            //        photos.addAll(mountPhotosResp.getAttr("photos"));
            //        db_album.setSize(photos.size());
            //    } else {
            //        db_album.setSize(photos.size());
            //    }
            //    // 获取排序权重
            //    List<AlbumPhotoRelation> aprList = albumDao.findAlbumPhotoRelationList(album);
            //    Map<Long, AlbumPhotoRelation> aprMap = new HashMap<>();
            //    if (aprList != null) {
            //        for (AlbumPhotoRelation apr : aprList) {
            //            aprMap.put(apr.getPhoto_id(), apr);
            //        }
            //    }
            //    for (Photo p : photos) {
            //        AlbumPhotoRelation apr = aprMap.get(p.getPhoto_id());
            //        if (apr != null && IdUtil.containValue(apr.getAprid())) {
            //            p.setSort(apr.getSort());
            //        } else {
            //            p.setSort(p.getPhoto_id());
            //        }
            //    }
            //    if (mount || (aprList != null && aprList.size() > 0)) {
            //        Collections.sort(photos, ALBUM_PHOTO_COMPARATOR); // 重新排序
            //    }
            response.putAttr(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, Config.getChild(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, "@user_", db_album.getUser().getUid() + "", ":"));
        }
        return response;
    }

    /**
     * 查找相册列表
     *
     * @param album
     * @param iRequest
     * @return IResponse:
     * albums -
     * cloud_photo_preview_args -
     */
    @Override
    public IResponse findAlbumList(Album album, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse(STATUS_SUCCESS);
        List<Album> albumList = albumDao.findAlbumInfoList(album, loginUser);
        if (albumList != null && albumList.size() > 0) {
            // 添加默认封面photo对象
            Photo defaultCover = null;
            for (Album db_album : albumList) {
                if (db_album.getCover() == null || !IdUtil.containValue(db_album.getCover().getPhoto_id())) {
                    if (defaultCover == null) {
                        defaultCover = generateDefaultCover();
                    }
                    db_album.setCover(defaultCover);
                }
            }
        }
        if (albumList != null) {
            response.putAttr("albums", albumList);
            response.putAttr("cdn_path_prefix", Config.get(ConfigConstants.SITE_CLOUD_ADDR));
            String cloud_photo_preview_args = null;
            if (album != null && album.getUser() != null && IdUtil.containValue(album.getUser().getUid())) {
                cloud_photo_preview_args = Config.getChild(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, "@user_", album.getUser().getUid() + "", ":");
            } else {
                cloud_photo_preview_args = Config.getChildDefault(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, "@user_");
            }
            response.putAttr(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, cloud_photo_preview_args);
        } else {
            response.setStatus(IResponse.STATUS_PARAM_ERROR);
        }
        return response;
    }

    /**
     * 更新相册
     *
     * @param album
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到，500：服务器错误
     * album - 更新后的album
     */
    @Override
    public IResponse updateAlbum(Album album, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (album == null || !IdUtil.containValue(album.getAlbum_id())) {
            response.setStatus(STATUS_PARAM_ERROR, "参数错误，未指定album_id~");
        } else if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else {
            IResponse albumResp = findAlbumInfo(album, iRequest);
            response.setStatus(albumResp);
            if (response.isSuccess()) {
                Album db_album = albumResp.getAttr("album");
                if (db_album.getUser().getUid().equals(loginUser.getUid())) {
                    fillAlbumNotRequiredValueIfNull(album, db_album);
                    // 检查封面
                    if (IdUtil.containValue(album.getCover().getPhoto_id()) && !album.getCover().getPhoto_id().equals(db_album.getCover().getPhoto_id())) {
                        IResponse photoResp = findPhoto(album.getCover(), iRequest);
                        if (photoResp.isFail() || !((Photo) photoResp.getAttr("photo")).getUid().equals(loginUser.getUid())) {
                            response.setStatus(STATUS_PARAM_ERROR, "该封面不可用~");
                        }
                    }
                    if (response.isSuccess()) {
                        response.setStatus(convertRowToHttpCode(albumDao.updateAlbum(album)));
                        if (response.isSuccess()) {
                            Album newAlbumInfo = findAlbumInfo(album, iRequest).getAttr("album");
                            response.putAttr("album", newAlbumInfo);
                            if (!db_album.getPermission().equals(album.getPermission())) { // 更新跟随相册权限的PhotoTagWrapper
                                albumDao.updatePhotoTagWrapperPermissionInScope(newAlbumInfo);
                            }
                        }
                    }
                } else {
                    response.setStatus(STATUS_FORBIDDEN, "你不能操作别人的相册~");
                }
            }
        }
        return response;
    }

    /**
     * 点赞相册
     *
     * @param album    - 只需传album_id
     * @param undo     - 是否取消赞
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    @Override
    public IResponse likeAlbum(Album album, boolean undo, IRequest iRequest) {
        IResponse response = new IResponse();
        if (album == null || !IdUtil.containValue(album.getAlbum_id())) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else {
            IResponse albumResp = findAlbumInfo(album, iRequest);
            if (albumResp.isSuccess()) {
                Boolean saveLikeValue = null;
                Album db_album = albumResp.getAttr("album");
                if (!undo) {    // 赞
                    if (db_album.getLiked() != null && db_album.getLiked()) {
                        response.setMessage("你已经赞过该相册了~");
                    } else {
                        saveLikeValue = true;
                    }
                } else {    // 取消赞
                    if (db_album.getLiked() != null && db_album.getLiked()) {
                        saveLikeValue = false;
                    } else {
                        response.setMessage("你并没有赞过该相册~");
                    }
                }
                if (saveLikeValue != null) {
                    ActionRecord<Album> actionRecord = new ActionRecord<>();
                    actionRecord.setCreation(album);
                    if (iRequest.isHasLoggedIn()) {
                        actionRecord.setUser(iRequest.getLoginUser());
                    } else {
                        actionRecord.setIp(iRequest.getAccessIp());
                    }
                    actionRecord.setLiked(saveLikeValue);
                    response.setStatus(convertRowToHttpCode(userDao.saveAlbumActionRecord(actionRecord)));
                    if (response.isSuccess()) {
                        response.putAttr("type", 1);
                        if (saveLikeValue) {
                            db_album.setLike_count(db_album.getLike_count() + 1);
                        } else {
                            db_album.setLike_count(db_album.getLike_count() > 0 ? db_album.getLike_count() - 1 : 0);
                        }
                        albumDao.updateAlbumLikeCount(album, saveLikeValue ? 1 : -1);
                    }
                } else {
                    response.putAttr("type", 0);
                }
                response.putAttr("album", db_album);
            } else {
                response.setStatus(albumResp);
            }
        }
        return response;
    }

    /**
     * 删除相册
     *
     * @param album    相册ID，相册名
     * @param iRequest attr:
     *                 <p>{Boolean} deleteFromDisk - 是否从磁盘删除文件</p>
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到，500：服务器错误
     */
    @Override
    public IResponse deleteAlbum(Album album, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        boolean deleteFromDisk = iRequest.getAttr("deleteFromDisk", false);
        IResponse response = new IResponse();
        int flag = STATUS_SUCCESS;
        if (iRequest.isHasNotLoggedIn()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        }
        // set umount=false filte mount
        IResponse albumResp = findAlbumWithPhotos(album, false, iRequest);
        flag = albumResp.getStatus();
        int deletedCount = 0;
        if (flag == STATUS_SUCCESS) {
            Album db_album = albumResp.getAttr("album");
            Long uid = db_album.getUser().getUid();
            if (uid.equals(loginUser.getUid()) && db_album.getName().equals(album.getName())) {
                if (deleteFromDisk) {
                    for (Photo p : db_album.getPhotos()) {
                        // 回收相册文件夹
                        deletedCount += fileService.recycleTrash(fileService.baseCloudDir(null), p.getPath(), true) ? 1 : 0;
                    }
                }
                if (true || !deleteFromDisk) {
                    String shortAlbumId = IdUtil.convertToShortPrimaryKey(db_album.getAlbum_id());
                    String backupRelativePath = Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + IdUtil.convertToShortPrimaryKey(db_album.getUser().getUid()) + "/restore/albums/" + shortAlbumId + "/";
                    String backupFileName = "album_data_" + shortAlbumId + "_" + IdUtil.convertDecimalIdTo62radix(System.currentTimeMillis()) + ".sql";
                    String sqlBackupPath = fileService.baseTrashRecycleDir(backupRelativePath + backupFileName);
                    fileService.saveText(convertAlbumToInsertSQL(db_album), sqlBackupPath); // 备份SQL文件
                    logger.info("FileRecycle backup album(" + shortAlbumId + ") sql file in \"" + sqlBackupPath + "\"");
                    int index = albumDao.deleteAlbum(album);
                    flag = index > 0 ? STATUS_SUCCESS : STATUS_SERVER_ERROR;
                } else {
                    flag = STATUS_SERVER_ERROR;
                }
            } else {
                flag = STATUS_FORBIDDEN;
            }
        }
        response.setStatus(flag);
        if (response.isSuccess()) {
            response.putAttr("deleted_photo_count", deletedCount);
            response.putAttr("album_photo_count", ((Album) albumResp.getAttr("album")).getSize());
        }
        return response;
    }

    /**
     * 保存图片
     *
     * @param file
     * @param photo
     * @param iRequest
     * @return ResponseEntity
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册未找到, 500: 服务器错误
     * photo - photo对象
     */
    @Override
    public IResponse savePhoto(MultipartFile file, Photo photo, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        response.putAttr("photo", photo);
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (!isAllowUpload(loginUser)) {
            response.setStatus(STATUS_FORBIDDEN, "你的用户组不允许上传照片~");
        } else if (file == null || photo == null) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else {
            photo.setClick_count(0);
            photo.setLike_count(0);
            photo.setComment_count(0);
            fillPhotoNotRequiredValueIfNull(photo);
            if (photo.getOriginName() == null) {
                photo.setOriginName(file.getOriginalFilename());
            }
            IResponse albumResp = findAlbumInfo(new Album(photo.getAlbum_id()), iRequest);
            int albumRespFlag = albumResp.getStatus();
            if (albumRespFlag == STATUS_SUCCESS) {
                Album db_album = albumResp.getAttr("album");
                if (db_album.getUser().getUid().equals(loginUser.getUid())) {
                    photo.setPhoto_id(IdUtil.generatePrimaryKey()); // 主键
                    photo.setUid(loginUser.getUid());
                    photo.setUpload_time(new Date());
                    String relativePath = fileService.generatePhotoSaveBlockPath(photo);
                    String fileName = fileService.generatePhotoFilename(photo, relativePath);
                    boolean isSave = false;
                    try {
                        isSave = fileService.savePhotoFile(file.getInputStream(), photo, relativePath, fileName);
                    } catch (IOException e) {
                        e.printStackTrace();
                        isSave = false;
                    }
                    if (isSave) {
                        photo.setPath(relativePath + fileName);
                        int index = albumDao.savePhoto(photo);
                        if (index > 0) {
                            response.setStatus(STATUS_SUCCESS);
                        } else {
                            response.setStatus(STATUS_SERVER_ERROR);
                            String diskPath = fileService.baseCloudDir(photo.getPath());
                            fileService.delete(diskPath);
                        }
                    } else {
                        response.setStatus(STATUS_SERVER_ERROR);
                    }
                } else {
                    response.setStatus(STATUS_FORBIDDEN);
                }
            } else {
                response.setStatus(albumRespFlag);
            }
        }
        return response;
    }

    /**
     * 查找照片
     *
     * @param photo
     * @param iRequest attr:
     *                 <p>{Boolean} loadAlbum - 是否加载相册</p>
     *                 <p>{Boolean} loadUser - 是否加载所有者</p>
     *                 <p>{Boolean} loadTopic - 是否加载主题</p>
     *                 <p>{Boolean} loadVideo - 是否加载相关视频</p>
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到
     * photo - 照片
     */
    @Override
    public IResponse findPhoto(Photo photo, IRequest iRequest) {
        boolean loadAlbum = iRequest.getAttr("loadAlbum", false);
        boolean loadUser = iRequest.getAttr("loadUser", false);
        boolean loadTopic = iRequest.getAttr("loadTopic", false);
        boolean loadVideo = iRequest.getAttr("loadVideo", false);
        return findPhoto(photo, loadAlbum, loadUser, loadTopic, loadVideo, iRequest);
    }

    /**
     * 查找照片
     *
     * @param photo
     * @param loadAlbum 是否加载相册
     * @param loadUser  是否加载所有者
     * @param loadTopic 是否加载主题
     * @param loadVideo 是否加载相关视频
     * @param iRequest
     * @return status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到
     * photo - 照片
     * album - 所属相册
     * user - 所有者
     * topic - 主题
     * video - 相关视频
     */
    private IResponse findPhoto(Photo photo, boolean loadAlbum, boolean loadUser, boolean loadTopic, boolean loadVideo, IRequest iRequest) {
        boolean loadActionRecord = iRequest.getAttr("loadActionRecord", true);
        // 查找图片
        IResponse response = new IResponse();
        if (photo == null || !IdUtil.containValue(photo.getPhoto_id())) {
            response.setStatus(STATUS_PARAM_ERROR);
            return response;
        }
        photo = albumDao.findPhotoInfo(photo);
        if (photo == null) {
            return response.setStatus(STATUS_NOT_FOUND, "无此照片");
        }
        IResponse albumResp = findAlbumInfo(new Album(photo.getAlbum_id()), iRequest);
        if (albumResp.isSuccess()) {
            boolean isNotLoadOriginName = iRequest.isHasNotLoggedIn() || !iRequest.getLoginUser().getUid().equals(photo.getUid());
            if (isNotLoadOriginName) {
                photo.setOriginName(null);
            }
            if (loadActionRecord) {
                ActionRecord<Photo> queryActionRecord = new ActionRecord<>();
                queryActionRecord.setCreation(photo);
                queryActionRecord.setUser(iRequest.getLoginUser());
                queryActionRecord.setIp(iRequest.getAccessIp());
                ActionRecord<Photo> photoActionRecord = userDao.findPhotoActionRecord(queryActionRecord);
                if (photoActionRecord != null) {
                    photo.setAccessed(photoActionRecord.getAccessed());
                    photo.setLiked(photoActionRecord.getLiked());
                    photo.setCommented(photoActionRecord.getCommented());
                } else {
                    photo.setAccessed(false);
                    photo.setLiked(false);
                    photo.setCommented(false);
                }
            }
            response.putAttr("photo", photo).setStatus(STATUS_SUCCESS);
        } else {
            response.putAttr("photo", null).setStatus(albumResp);
        }
        response.putAttr("cdn_path_prefix", Config.get(ConfigConstants.SITE_CLOUD_ADDR));
        // 查找其他
        if (response.isSuccess()) {
            Photo db_photo = response.getAttr("photo");
            if (loadAlbum || loadUser) {
                Album album = albumResp.getAttr("album");
                if (loadAlbum) {
                    response.putAttr("album", album);
                }
                if (loadUser) {
                    response.putAttr("user", album.getUser());
                }
            }
            if (loadTopic) {
                response.putAttr("topic", db_photo.getTopic());
            }
            if (loadVideo && db_photo.getImage_type() != null && db_photo.getImage_type().indexOf("video") != -1) {
                Video videoQuery = new Video();
                videoQuery.setCover(db_photo);
                IResponse videoResp = videoService.findVideo(videoQuery, iRequest);
                if (videoResp.isSuccess()) {
                    response.putAttr("video", videoResp.getAttr("video"));
                } else {
                    response.setMessage(response.getMessage() + ", 视频加载失败：" + videoResp.getMessage());
                }
            }
        }
        return response;
    }

    /**
     * 删除照片
     *
     * @param photo
     * @param iRequest attr:
     *                 <p>{Boolean} deleteFromDisk - 是否从服务器磁盘删除此照片</p>
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到，500：服务器错误
     */
    @Override
    public IResponse deletePhoto(Photo photo, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        boolean deleteFromDisk = iRequest.getAttr("deleteFromDisk", false);
        IResponse response = new IResponse(STATUS_SUCCESS);
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else {
            IResponse photoResp = findPhoto(photo, iRequest);
            if (photoResp.isSuccess()) {
                Photo db_photo = photoResp.getAttr("photo");
                if (db_photo.getUid().equals(loginUser.getUid())) {
                    String backupSql = convertPhotoToInsertSQL(db_photo);
                    int left = albumDao.deletePhoto(db_photo);
                    int right = 0;
                    if (deleteFromDisk) {
                        // int right = fileService.deleteFileByUrl(db_photo.getPath(), "cloud", request);
                        right = fileService.recycleTrash(fileService.baseCloudDir(null), db_photo.getPath(), true) ? 1 : 0; //回收
                    }
                    Matcher matcher = Pattern.compile("^.*/([0-9A-Za-z]+)/(([^/]*)\\.\\w+)$").matcher(db_photo.getPath()); // 取得分块的文件夹
                    matcher.find();
                    String backupRelativePath = Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + IdUtil.convertToShortPrimaryKey(db_photo.getUid()) + "/restore/photos/" + matcher.group(1) + "/";
                    String backupFileName = matcher.group(2) + ".sql";
                    fileService.saveText(backupSql, fileService.baseTrashRecycleDir(backupRelativePath + backupFileName));
                    response.setStatus(left > 0 ? STATUS_SUCCESS : STATUS_SERVER_ERROR);
                    if (deleteFromDisk && right == 0) {
                        response.setMessage("照片数据库数据参数成功，但照片文件删除失败");
                    }
                    response.putAttr("isPhotoFileDeleted", right > 0 ? true : false);
                } else {
                    response.setStatus(STATUS_FORBIDDEN);
                }
            } else {
                response.setStatus(photoResp);
            }
        }
        return response;
    }

    /**
     * 更新照片
     *
     * @param photo
     * @param file     可选，有则更新
     * @param iRequest
     * @flag ResponseEntity:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到，500：服务器错误
     * photo - 更新后的photo
     */
    @Override
    public IResponse updatePhoto(Photo photo, MultipartFile file, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        int flag = STATUS_SUCCESS;
        if (iRequest.isHasNotLoggedIn()) {
            flag = STATUS_NOT_LOGIN;
            return response.setStatus(flag);
        } else if (photo == null) {
            flag = STATUS_PARAM_ERROR;
            return response.setStatus(flag);
        }
        IResponse photoResp = findPhoto(photo, iRequest);
        int photoRespFlag = photoResp.getStatus();
        if (photoRespFlag == STATUS_SUCCESS) {
            Photo db_photo = photoResp.getAttr("photo");
            if (db_photo.getUid().equals(loginUser.getUid())) {
                fillPhotoNotRequiredValueIfNull(photo, db_photo);
                String oldPath = db_photo.getPath();
                if (file != null && !file.isEmpty() && file.getContentType().indexOf("image") != -1) {
                    if (photo.getOriginName() == null) {
                        if (Utils.isNotEmpty(file.getOriginalFilename())) {
                            photo.setOriginName(file.getOriginalFilename());
                        } else if (db_photo.getOriginName() != null) {
                            photo.setOriginName(db_photo.getOriginName());
                        } else {
                            photo.setOriginName("");
                        }
                    }
                    Matcher matcher = Pattern.compile("^(.*/[^/]+/)[^/]+$").matcher(oldPath);
                    matcher.find();
                    String newPathDir = matcher.group(1); //文件夹
                    String newPathFileName = fileService.generatePhotoFilename(photo, newPathDir); // 新文件名
                    photo.setPath(null);
                    try {
                        if (fileService.savePhotoFile(file.getInputStream(), photo, newPathDir, newPathFileName)) { //保存新文件到磁盘
                            if (db_photo.getImage_type() != null && db_photo.getImage_type().indexOf("video") != -1) {
                                photo.setImage_type(db_photo.getImage_type()); // 视频：更新视频封面图片文件时，避免旧类型被覆盖
                            }
                            photo.setPath(newPathDir + newPathFileName);
                            flag = STATUS_SUCCESS;
                        } else {
                            flag = STATUS_SERVER_ERROR;
                        }
                    } catch (IOException e) {
                        e.printStackTrace();
                        flag = STATUS_SERVER_ERROR;
                    }
                } else {
                    photo.setWidth(db_photo.getWidth());
                    photo.setHeight(db_photo.getHeight());
                    if (photo.getImage_type() == null) { // 当外部传入类型时，不覆盖，以便支持视频
                        photo.setImage_type(db_photo.getImage_type());
                    }
                    photo.setSize(db_photo.getSize());
                    photo.setPath(oldPath);
                    photo.setOriginName(db_photo.getOriginName());
                    flag = STATUS_SUCCESS;
                }
                // 检查topic的PhotoTagWrapper权限
                if (photo.getTopic() != null && IdUtil.containValue(photo.getTopic().getPtwid()) && (db_photo.getTopic() == null
                        || !IdUtil.containValue(db_photo.getTopic().getPtwid())
                        || !db_photo.getTopic().getPtwid().equals(photo.getTopic().getPtwid()))) {
                    IResponse topicTagWrapperResp = findPhotoTagWrapper(new PhotoTagWrapper(photo.getTopic().getPtwid()), iRequest);
                    if (topicTagWrapperResp.isFail() ||
                            !((PhotoTagWrapper) topicTagWrapperResp.getAttr("tagWrapper")).getUid().equals(loginUser.getUid())) {
                        photo.getTopic().setPtwid(0L);
                    }
                }
                if (flag == STATUS_SUCCESS) {
                    int index = albumDao.updatePhoto(photo);
                    flag = index > 0 ? STATUS_SUCCESS : STATUS_SERVER_ERROR;
                    if (flag == STATUS_SUCCESS) {
                        if (!oldPath.equals(photo.getPath())) {
                            fileService.recycleTrash(fileService.baseCloudDir(null), oldPath, true); // 回收旧文件
                        }
                    } else if (photo.getPath() != null && !oldPath.equals(photo.getPath())) {
                        String diskPath = fileService.baseCloudDir(photo.getPath());
                        fileService.delete(diskPath);
                    }
                }
            } else {
                flag = STATUS_FORBIDDEN;
            }
        } else {
            flag = photoRespFlag;
        }
        response.setStatus(flag);
        if (flag == STATUS_SUCCESS) {
            response.putAttr("photo", findPhoto(photo, iRequest).getAttr("photo"));
        }
        return response;
    }

    /**
     * 批量替换照片标签
     *
     * @param queryPhoto  - 查询条件，必须包含uid，及有用条件
     * @param replacedTag - 被替换的标签
     * @param newTag      - 替换为的标签
     * @param iRequest    attr:
     *                    <p>base - 在哪个基础之下查找, 默认null</p>
     *                    <p>logic_conn - 逻辑连接符 "and" 或 "or", 默认and</p>
     *                    <p>extend - 查询的标签是否是扩展标签，tags参数值不支持正则匹配，只支持相等匹配, 默认false</p>
     * @return IResponse:
     * status - 200:成功，404：无影响的行
     * batchReplacePhotoTagAffectedRows - 影响的行
     */
    @Override
    public IResponse batchReplacePhotoTag(Photo queryPhoto, String replacedTag, String newTag, IRequest iRequest) {
        String base = iRequest.getAttr("base", null);
        String logic_conn = iRequest.getAttr("logic_conn", "and");
        boolean extend = iRequest.getAttr("extend", false);
        IResponse response = new IResponse(this);
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (Utils.isEmpty(replacedTag) || queryPhoto == null || queryPhoto.getUid() == null) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else if (!queryPhoto.getUid().equals(iRequest.getLoginUser().getUid())) {
            response.setStatus(STATUS_FORBIDDEN);
        } else {
            if (logic_conn.equals("or")) {
                base = "user_photos";
            }
            List<Long> photoIds = iRequest.getAttr("photoIds");
            if (photoIds != null && photoIds.size() == 0) {
                response.setStatus(STATUS_PARAM_ERROR, "photoIds数组为空");
            } else {
                replacedTag = replacedTag.replaceAll("(^(#|<))|((#|>)$)", "");
                if (Utils.isNotEmpty(replacedTag)) {
                    if (newTag == null) {
                        newTag = "";
                    } else {
                        newTag = newTag.replaceAll("(^(#|<))|((#|>)$)", "");
                    }
                    int row;
                    if (photoIds == null) {
                        row = albumDao.batchReplacePhotoTag(base, queryPhoto, logic_conn, replacedTag, newTag);
                    } else {
                        row = albumDao.batchReplacePhotoTag(new User(queryPhoto.getUid()), photoIds, replacedTag, newTag);
                    }
                    int status = convertRowToHttpCode(row);
                    if (status == STATUS_SUCCESS || status == STATUS_NOT_FOUND) {
                        response.putAttr("batchReplacePhotoTagAffectedRows", row);
                    }
                    response.setStatus(status);
                } else {
                    response.setStatus(STATUS_PARAM_ERROR, "请输入合格的标签");
                }
            }
        }
        return response;
    }

    /**
     * 批量添加照片标签
     *
     * @param queryPhoto - 查询条件，必须包含uid，及有用条件
     * @param addTag     - 添加的标签
     * @param iRequest   attr:
     *                   <p>base - 在哪个基础之下查找, 默认null</p>
     *                   <p>logic_conn - 逻辑连接符 "and" 或 "or", 默认and</p>
     *                   <p>extend - 查询的标签是否是扩展标签，tags参数值不支持正则匹配，只支持相等匹配, 默认false</p>
     * @return IResponse:
     * status - 200:成功，404：无影响的行
     * batchSetPhotoTagAffectedRows - 影响的行
     */
    @Override
    public IResponse batchSetPhotoTag(Photo queryPhoto, String addTag, IRequest iRequest) {
        String base = iRequest.getAttr("base", null);
        String logic_conn = iRequest.getAttr("logic_conn", "and");
        boolean extend = iRequest.getAttr("extend", false);
        IResponse response = new IResponse(this);
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (Utils.isEmpty(addTag) || queryPhoto == null || queryPhoto.getUid() == null) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else if (!queryPhoto.getUid().equals(iRequest.getLoginUser().getUid())) {
            response.setStatus(STATUS_FORBIDDEN);
        } else {
            if (logic_conn.equals("or")) {
                base = "user_photos";
            }
            List<Long> photoIds = iRequest.getAttr("photoIds");
            if (photoIds != null && photoIds.size() == 0) {
                response.setStatus(STATUS_PARAM_ERROR, "photoIds数组为空");
            } else {
                String[] tags = Utils.splitNotEmpty(addTag, "#");
                if (tags.length > 0) {
                    Integer row = null;
                    for (String tag : tags) {
                        int currRow;
                        if (photoIds == null) {
                            currRow = albumDao.batchSetPhotoTag(base, queryPhoto, logic_conn, tag);
                        } else {
                            currRow = albumDao.batchSetPhotoTag(iRequest.getLoginUser(), photoIds, tag);
                        }
                        if (row == null || currRow > row) {
                            row = currRow;
                        }
                    }
                    int status = convertRowToHttpCode(row);
                    if (status == STATUS_SUCCESS || status == STATUS_NOT_FOUND) {
                        response.putAttr("batchSetPhotoTagAffectedRows", row);
                    }
                    response.setStatus(status);
                } else {
                    response.setStatus(STATUS_PARAM_ERROR, "请输入要追加的标签");
                }
            }
        }
        return response;
    }

    /**
     * 查找照片集合
     *
     * @param photo
     * @param logic_conn 逻辑连接符 "and" 或 "or"
     * @param start      正数代表正序(photo_id从大到小)，从0开始；负数代表逆序(photo_id从小到大)，从-1开始；包含起始
     * @param size       返回数量，0代表不限制数量
     * @param iRequest   attr:
     *                   <p>{String} base - 在哪个基础之下查找, 默认null</p>
     *                   <p>{Boolean }extend - 查询的标签是否是扩展标签，tags参数值不支持正则匹配，只支持相等匹配, 默认false</p>
     * @return IResponse:
     * status - 200:成功，400：参数错误
     * photos -
     * cloud_photo_preview_args -
     */
    @Override
    public IResponse findPhotoList(Photo photo, String logic_conn, int start, int size, IRequest iRequest) {
        String base = iRequest.getAttr("base", null);
        boolean extend = iRequest.getAttr("extend", false);
        return findPhotoList(base, photo, logic_conn, start, size, extend, iRequest);
    }

    /**
     * 查找照片集合
     *
     * @param base       在哪个基础之下查找
     * @param photo
     * @param logic_conn 逻辑连接符 "and" 或 "or"
     * @param start      正数代表正序(photo_id从大到小)，从0开始；负数代表逆序(photo_id从小到大)，从-1开始；包含起始
     * @param size       返回数量，0代表不限制数量
     * @param iRequest
     * @return IResponse:
     * status - 200:成功，400：参数错误，404：没找到相册
     * photos -
     * cloud_photo_preview_args -
     */
    private IResponse findPhotoList(String base, Photo photo, String logic_conn, int start, int size, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (base != null) {
            if (base.startsWith("album_detail")) {
                base = "album_detail";
            } else if (base.startsWith("user_likes")) {
                base = "user_likes";
            } else if (base.startsWith("user_history")) {
                base = "user_history";
            }
        }
        List<Photo> photos = null;
        if (base != null && base.equals("album_detail") && photo != null && IdUtil.containValue(photo.getAlbum_id())) {
            Long album_id = photo.getAlbum_id();
            IResponse albumResp = findAlbumInfo(new Album(album_id), iRequest);
            if (albumResp.isSuccess()) {
                //    Album albumInfo = albumResp.getAttr("album");
                //    Long query_host_uid = albumInfo.getUser().getUid();
                //    Pattern belong_album_test_regex = Pattern.compile(".*#" + MOUNT_PREFIX + IdUtil.convertToShortPrimaryKey(album_id) + "#.*");
                //    photo.setAlbum_id(0L); // 去掉相册条件
                //    List<Photo> photoList = albumDao.findPhotoList(photo, logic_conn, (start == -1 ? -1 : 0), 0, loginUser);
                //    if (photoList != null) {
                //        List<Photo> newList = new ArrayList<>();
                //        for (Photo p : photoList) {
                //            if (p.getUid().equals(query_host_uid) && (p.getAlbum_id().equals(album_id) || (p.getTags() != null && belong_album_test_regex.matcher(p.getTags()).matches()))) {
                //                newList.add(p);
                //            }
                //        }
                //        photos = newList;
                //        response.setStatus(STATUS_SUCCESS);
                //    } else {
                //        photos = null;
                //        response.setStatus(STATUS_PARAM_ERROR);
                //    }
                //    photo.setAlbum_id(album_id);
                photos = albumDao.findPhotoList(base, photo, logic_conn, (start <= -1 ? -1 : 0), 0, loginUser);
            } else {
                photos = new ArrayList<>();
                response.setStatus(albumResp);
                response.setMessage("没找到相册" + album_id);
            }
        } else {
            photos = albumDao.findPhotoList(base, photo, logic_conn, start, size, loginUser);
            if (photos == null) {
                response.setStatus(STATUS_PARAM_ERROR);
            } else {
                response.setStatus(STATUS_SUCCESS);
            }
        }
        response.putAttr("photos", photos);
        response.putAttr("cdn_path_prefix", Config.get(ConfigConstants.SITE_CLOUD_ADDR));
        if (response.isSuccess()) {
            String cloud_photo_preview_args = null;
            if (photo != null && IdUtil.containValue(photo.getUid())) {
                cloud_photo_preview_args = Config.getChild(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, "@user_", photo.getUid() + "", ":");
            } else {
                cloud_photo_preview_args = Config.getChildDefault(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, "@user_");
            }
            response.putAttr(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, cloud_photo_preview_args);
        }
        return response;
    }

    /**
     * 查找照片集合
     *
     * @param base       在哪个基础之下查找
     * @param photo
     * @param logic_conn 逻辑连接符 "and" 或 "or"
     * @param start      正数代表正序(photo_id从大到小)，从0开始；负数代表逆序(photo_id从小到大)，从-1开始；包含起始
     * @param size       返回数量，0代表不限制数量
     * @param extend     查询的标签是否是扩展标签，tags参数值不支持正则匹配，只支持相等匹配
     * @param iRequest
     * @return IResponse:
     * status - 200:成功，400：参数错误
     * photos -
     * cloud_photo_preview_args -
     */
    private IResponse findPhotoList(String base, Photo photo, String logic_conn, int start, int size, boolean extend, IRequest iRequest) {
        if (extend && photo != null && photo.getTags() != null && photo.getTags().length() > 0 && !photo.getTags().equals("<>")) {
            User loginUser = iRequest.getLoginUser();
            String tags = photo.getTags();
            PhotoTagWrapper queryWrapper = new PhotoTagWrapper();
            queryWrapper.setUid(photo.getUid());
            queryWrapper.setName(tags.replaceAll("(^<)|(>$)", ""));
            queryWrapper.setType(TagWrapperType.SEARCH.value);
            List<PhotoTagWrapper> tagWrappers = albumDao.findPhotoTagWrapperList(queryWrapper, loginUser);
            if (tagWrappers != null && tagWrappers.size() > 0) {
                boolean isUseful = false;
                for (PhotoTagWrapper tagWrapper : tagWrappers) {
                    if (tagWrapper.getMatch_mode() != 0) {
                        isUseful = true;
                        break;
                    }
                }
                if (isUseful) {
                    IResponse response = new IResponse();
                    List<Photo> photos = null;
                    photo.setTags(null);
                    IResponse photosResp = findPhotoList(base, photo, logic_conn, (start <= -1 ? -1 : 0), 0, iRequest);
                    if (photosResp.isSuccess()) {
                        photos = getMatchesPhotosByTagWrappers(photosResp.getAttr("photos"), tagWrappers);
                    } else {
                        photos = null;
                    }
                    photo.setTags(tags);
                    response.setStatus(photosResp);
                    response.putAttr(photosResp.getAttr());
                    response.putAttr("photos", photos); // 覆盖
                    response.putAttr("extend", true);
                    return response;
                }
            }
        }
        return findPhotoList(base, photo, logic_conn, start, size, iRequest);
    }

    /**
     * 点赞照片
     *
     * @param photo    - 只需传photo_id
     * @param undo     - 是否取消赞
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    @Override
    public IResponse likePhoto(Photo photo, boolean undo, IRequest iRequest) {
        IResponse response = new IResponse();
        if (photo == null || !IdUtil.containValue(photo.getPhoto_id())) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else {
            IResponse photoResp = findPhoto(photo, iRequest);
            if (photoResp.isSuccess()) {
                Boolean saveLikeValue = null;
                Photo db_photo = photoResp.getAttr("photo");
                if (!undo) {    // 赞
                    if (db_photo.getLiked() != null && db_photo.getLiked()) {
                        response.setMessage("你已经赞过该照片了~");
                    } else {
                        saveLikeValue = true;
                    }
                } else {    // 取消赞
                    if (db_photo.getLiked() != null && db_photo.getLiked()) {
                        saveLikeValue = false;
                    } else {
                        response.setMessage("你并没有赞过该照片~");
                    }
                }
                if (saveLikeValue != null) {
                    ActionRecord<Photo> actionRecord = new ActionRecord<>();
                    actionRecord.setCreation(photo);
                    if (iRequest.isHasLoggedIn()) {
                        actionRecord.setUser(iRequest.getLoginUser());
                    } else {
                        actionRecord.setIp(iRequest.getAccessIp());
                    }
                    actionRecord.setLiked(saveLikeValue);
                    response.setStatus(convertRowToHttpCode(userDao.savePhotoActionRecord(actionRecord)));
                    if (response.isSuccess()) {
                        response.putAttr("type", 1);
                        if (saveLikeValue) {
                            db_photo.setLike_count(db_photo.getLike_count() + 1);
                        } else {
                            db_photo.setLike_count(db_photo.getLike_count() > 0 ? db_photo.getLike_count() - 1 : 0);
                        }
                        albumDao.updatePhotoLikeCount(photo, saveLikeValue ? 1 : -1);
                    }
                } else {
                    response.putAttr("type", 0);
                }
                response.putAttr("photo", db_photo);
            } else {
                response.setStatus(photoResp);
            }
        }
        return response;
    }

    private List<Photo> getMatchesPhotosByTagWrappers(List<Photo> photos, List<PhotoTagWrapper> tagWrappers) {
        List<Photo> newList = new ArrayList<>();
        // 当match_mode为匹配正则时，先编译好正则
        Pattern[] regexpPatternMap = new Pattern[tagWrappers.size()];
        // 当match_mode为同时包含多个tag时，先编译好正则数组，并构建变量数组记录标记
        Pattern[][] containsPatternsMap = new Pattern[tagWrappers.size()][];
        boolean[][] containsPatternsMatchesMap = new boolean[tagWrappers.size()][];
        for (int i = 0; i < tagWrappers.size(); i++) {
            PhotoTagWrapper tagWrapper = tagWrappers.get(i);
            if (tagWrapper.getMatch_mode() == 3) {
                regexpPatternMap[i] = Pattern.compile(tagWrapper.getPattern());
                containsPatternsMap[i] = null;
                containsPatternsMatchesMap[i] = null;
            } else if (tagWrapper.getMatch_mode() == 5) {
                String[] splits = tagWrapper.getPattern().split("\\s*&&\\s*|\\s+");
                Pattern[] containsPatterns = new Pattern[splits.length];
                for (int j = 0; j < splits.length; j++) {
                    containsPatterns[j] = Pattern.compile(splits[j]);
                }
                regexpPatternMap[i] = null;
                containsPatternsMap[i] = containsPatterns;
                containsPatternsMatchesMap[i] = new boolean[containsPatternsMap[i].length];
            } else {
                regexpPatternMap[i] = null;
                containsPatternsMap[i] = null;
                containsPatternsMatchesMap[i] = null;
            }
        }
        for (Photo photo : photos) {
            boolean isBelongTagWrapper = false;
            if (photo.getTags() != null && photo.getTags().length() != 0) {
                try {
                    String[] tags = Utils.splitNotEmpty(photo.getTags(), "#");
                    for (int i = 0; i < tagWrappers.size(); i++) {
                        PhotoTagWrapper wrapper = tagWrappers.get(i);
                        if (wrapper.getType() != TagWrapperType.SEARCH.value
                                || (wrapper.getCommon_value().equals(0) && !wrapper.getUid().equals(photo.getUid()))
                                || (wrapper.getScope() > 0 && !wrapper.getScope().equals(photo.getAlbum_id()))) {
                            continue;
                        }
                        String pattern = wrapper.getPattern();
                        // 当match_mode为匹配正则时，获取编译好的正则
                        Pattern regexpPattern = regexpPatternMap[i];
                        // 当match_mode为同时包含多个tag时，获取当前wrapper的编译好的正则数组、记录标记的数组
                        Pattern[] containsPatterns = containsPatternsMap[i];
                        boolean[] containsPatternsMatches = containsPatternsMatchesMap[i];
                        if (containsPatternsMatches != null) {
                            Arrays.fill(containsPatternsMatches, false);
                        }
                        for (String tag : tags) {
                            switch (wrapper.getMatch_mode()) { // 匹配类型
                                case 0: // 全等
                                    if (pattern.equalsIgnoreCase(tag)) {
                                        isBelongTagWrapper = true;
                                    }
                                    break;
                                case 1: // 前缀
                                    if (tag.indexOf(pattern) == 0) {
                                        isBelongTagWrapper = true;
                                    }
                                    break;
                                case 2: // 后缀
                                    if (tag.indexOf(pattern) + pattern.length() == tag.length()) {
                                        isBelongTagWrapper = true;
                                    }
                                    break;
                                case 3: // 正则
                                    if (regexpPattern.matcher(tag).matches()) {
                                        isBelongTagWrapper = true;
                                    }
                                    break;
                                case 4: // 包含
                                    if (tag.indexOf(pattern) != -1) {
                                        isBelongTagWrapper = true;
                                    }
                                    break;
                                case 5: // 同时包含多个tag, 支持正则，正则间以 && 或 空格 隔开
                                    for (int j = 0; j < containsPatterns.length; j++) {
                                        if (!containsPatternsMatches[j] && containsPatterns[j].matcher(tag).matches()) {
                                            containsPatternsMatches[j] = true;
                                        }
                                    }
                                    break;
                                default:
                                    continue;
                            }
                            if (wrapper.getMatch_mode() == 5) {
                                isBelongTagWrapper = true;
                                for (boolean containsPatternMatches : containsPatternsMatches) {
                                    if (!containsPatternMatches) {
                                        isBelongTagWrapper = false;
                                        break;
                                    }
                                }
                            }
                            if (isBelongTagWrapper) {
                                break;
                            }
                        }
                        if (isBelongTagWrapper) {
                            break;
                        }
                    }
                } catch (Exception e) {
                    logger.warn(e.toString());
                }
            }
            if (isBelongTagWrapper) {
                newList.add(photo);
            }
        }
        return newList;
    }

    /**
     * 查询出用户设置的特殊标签
     *
     * @param tagWrapper
     * @param iRequest
     * @return IResponse:
     * tagWrappers
     */
    @Override
    public IResponse findPhotoTagWrapperList(PhotoTagWrapper tagWrapper, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (tagWrapper == null) {
            tagWrapper = new PhotoTagWrapper();
        }
        if (tagWrapper != null && Utils.isNotEmpty(tagWrapper.getName())) {
            tagWrapper.setName(tagWrapper.getName().replaceAll("(^<)|(>$)", ""));
        }
        // 当没传uid时，且设置为要查所有的，则只准返回公共标签
        if (!IdUtil.containValue(tagWrapper.getUid()) && tagWrapper.getCommon_value() == null) {
            // 已登录，那就加上登录用户自己
            if (iRequest.isHasLoggedIn()) {
                tagWrapper.setUid(loginUser.getUid());
            } else {
                tagWrapper.setCommon_value(1);
            }
        }
        List<PhotoTagWrapper> list = albumDao.findPhotoTagWrapperList(tagWrapper, loginUser);
        if (list == null) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else {
            response.setStatus(STATUS_SUCCESS);
            response.putAttr("tagWrappers", list);
        }
        return response;
    }

    /**
     * 依据照片对象的tags查询出用户设置的特殊标签列表
     *
     * @param photo
     * @param iRequest
     * @return IResponse:
     * tagWrappers
     * topicTagWrappers
     */
    @Override
    public IResponse findPhotoTagWrapperList(Photo photo, IRequest iRequest) {
        IResponse response = new IResponse();
        IResponse photoResp = findPhoto(photo, iRequest);
        if (photoResp.isSuccess()) {
            Photo db_photo = photoResp.getAttr("photo");
            PhotoTagWrapper queryTagWrapper = new PhotoTagWrapper();
            queryTagWrapper.setUid(db_photo.getUid());
            IResponse tagWrapperResp = findPhotoTagWrapperList(queryTagWrapper, iRequest);
            List<PhotoTagWrapper> userTagWrappers = tagWrapperResp.getAttr("tagWrappers");  // 用户设置的tagWrappers
            // return tagWrappers
            List<PhotoTagWrapper> tagWrappers = new ArrayList<>();  // 返回的命中tagWrappers
            List<PhotoTagWrapper> topicTagWrappers = new ArrayList<>();
            if (Utils.isNotEmpty(db_photo.getTags())) {
                String[] tagsArr = Utils.splitNotEmpty(db_photo.getTags(), "#");
                // 当match_mode为匹配正则时，先编译好正则
                Pattern[] regexpPatternMap = new Pattern[userTagWrappers.size()];
                // 当match_mode为同时包含多个tag时，先编译好正则数组，并构建变量数组记录标记
                Pattern[][] containsPatternsMap = new Pattern[userTagWrappers.size()][];
                boolean[][] containsPatternsMatchesMap = new boolean[userTagWrappers.size()][];
                for (int i = 0; i < userTagWrappers.size(); i++) {
                    PhotoTagWrapper tagWrapper = userTagWrappers.get(i);
                    if (tagWrapper.getMatch_mode() == 3) {
                        regexpPatternMap[i] = Pattern.compile(tagWrapper.getPattern());
                        containsPatternsMap[i] = null;
                        containsPatternsMatchesMap[i] = null;
                    } else if (tagWrapper.getMatch_mode() == 5) {
                        String[] splits = tagWrapper.getPattern().split("(\\s*&&\\s*)|\\s+");
                        Pattern[] containsPatterns = new Pattern[splits.length];
                        for (int j = 0; j < splits.length; j++) {
                            containsPatterns[j] = Pattern.compile(splits[j]);
                        }
                        regexpPatternMap[i] = null;
                        containsPatternsMap[i] = containsPatterns;
                        containsPatternsMatchesMap[i] = new boolean[containsPatternsMap[i].length];
                    } else {
                        regexpPatternMap[i] = null;
                        containsPatternsMap[i] = null;
                        containsPatternsMatchesMap[i] = null;
                    }
                }
                for (int i = 0; i < userTagWrappers.size(); i++) {
                    try {
                        PhotoTagWrapper wrapper = userTagWrappers.get(i);
                        String pattern = wrapper.getPattern();
                        // 当match_mode为匹配正则时，获取编译好的正则
                        Pattern regexpPattern = regexpPatternMap[i];
                        // 当match_mode为同时包含多个tag时，获取当前wrapper的编译好的正则数组、记录标记的数组
                        Pattern[] containsPatterns = containsPatternsMap[i];
                        boolean[] containsPatternsMatches = containsPatternsMatchesMap[i];
                        if (containsPatternsMatches != null) {
                            Arrays.fill(containsPatternsMatches, false);
                        }
                        for (String tag : tagsArr) {
                            boolean isMatch = false;
                            if (wrapper.getType().equals(TagWrapperType.SEARCH.value)) {
                                switch (wrapper.getMatch_mode()) { // 匹配类型
                                    case 0: // 全等
                                        if (pattern.equalsIgnoreCase(tag)) {
                                            isMatch = true;
                                        }
                                        break;
                                    case 1: // 前缀
                                        if (tag.indexOf(pattern) == 0) {
                                            isMatch = true;
                                        }
                                        break;
                                    case 2: // 后缀
                                        if (tag.indexOf(pattern) + pattern.length() == tag.length()) {
                                            isMatch = true;
                                        }
                                        break;
                                    case 3: // 正则
                                        if (regexpPattern.matcher(tag).matches()) {
                                            isMatch = true;
                                        }
                                        break;
                                    case 4: // 包含
                                        if (tag.indexOf(pattern) != -1) {
                                            isMatch = true;
                                        }
                                        break;
                                    case 5: // 同时包含多个tag, 支持正则，正则间以 && 或 空格 隔开
                                        for (int j = 0; j < containsPatterns.length; j++) {
                                            if (!containsPatternsMatches[j] && containsPatterns[j].matcher(tag).matches()) {
                                                containsPatternsMatches[j] = true;
                                            }
                                        }
                                        break;
                                    default:
                                        isMatch = false;
                                }
                                if (wrapper.getMatch_mode() == 5) {
                                    isMatch = true;
                                    for (boolean containsPatternMatches : containsPatternsMatches) {
                                        if (!containsPatternMatches) {
                                            isMatch = false;
                                            break;
                                        }
                                    }
                                }
                            } else {
                                if (wrapper.getName().equals(tag)) {
                                    isMatch = true;
                                }
                            }
                            if (isMatch) {
                                tagWrappers.add(wrapper);
                                if (wrapper.getTopic() == 1) {
                                    topicTagWrappers.add(wrapper);
                                }
                                break;
                            }
                        }
                    } catch (Exception e) {
                        logger.warn(e.toString());
                    }
                }
            }
            response.putAttr("tagWrappers", tagWrappers).putAttr("topicTagWrappers", topicTagWrappers);
            response.setStatus(STATUS_SUCCESS);
        } else {
            response.setStatus(photoResp);
        }
        return response;
    }

    /**
     * 查找一个照片中的tags匹配的由用户设置的特殊配置标签
     *
     * @param tagWrapper 需要ptwid或name
     * @param iRequest
     * @return IResponse:
     * tagWrapper -
     */
    @Override
    public IResponse findPhotoTagWrapper(PhotoTagWrapper tagWrapper, IRequest iRequest) {
        IResponse response = new IResponse();
        if (tagWrapper != null && ((IdUtil.containValue(tagWrapper.getPtwid())) || (Utils.isNotEmpty(tagWrapper.getName()) && IdUtil.containValue(tagWrapper.getUid())))) {
            PhotoTagWrapper dbTagWrapper = albumDao.findPhotoTagWrapper(tagWrapper);
            if (dbTagWrapper == null) {
                return response.setStatus(STATUS_NOT_FOUND, "无此photoTagWrapper");
            }
            IResponse authResp = authService.validateUserPermissionUtil(new User(dbTagWrapper.getUid()), dbTagWrapper.getPermission(), iRequest);
            if (authResp.isSuccess()) {
                response.putAttr("tagWrapper", dbTagWrapper).setStatus(STATUS_SUCCESS);
            } else {
                response.setStatus(authResp);
            }
            return response;
        } else {
            return response.setStatus(STATUS_PARAM_ERROR, "需要 ptwid 或 name与uid ");
        }
    }

    /**
     * 保存PhotoTagWrapper
     *
     * @param tagWrapper
     * @param iRequest   attr:
     *                   <p>{Boolean} syncTopicToPhotos - true: 将topicTagWrapper.name匹配到的photos，修改photo.topic为TagWrapper.ptwid</p>
     *                   <p>{Integer} syncTopicToPhotosMode -  同步模式，0：对于photo.topic已有值的不覆盖，1：覆盖</p>
     * @return IResponse:
     * tagWrapper
     */
    @Override
    public IResponse savePhotoTagWrapper(PhotoTagWrapper tagWrapper, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (tagWrapper == null ||
                Utils.isEmpty(tagWrapper.getName()) ||
                (tagWrapper.getType() != null && tagWrapper.getType().equals(TagWrapperType.SEARCH.value) && Utils.isEmpty(tagWrapper.getPattern()))) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else {
            tagWrapper.setPtwid(null);
            if (!IdUtil.containValue(tagWrapper.getUid())) {
                tagWrapper.setUid(loginUser.getUid());
            }
            // 仅作为标识用途的tagWrapper不能重复
            if (tagWrapper.getType() == null || tagWrapper.getType().equals(TagWrapperType.MARK.value)) {
                if (tagWrapper.getTopic() != null && tagWrapper.getTopic() == 1 && !tagWrapper.getUid().equals(loginUser.getUid())) {
                    return response.setStatus(STATUS_FORBIDDEN, "你怎么能创建别人的主题呢");
                }
                tagWrapper.setType(TagWrapperType.MARK.value);
                tagWrapper.setCommon_value(0); // 作为标识用途的tagWrapper不能设置为公共标签
                tagWrapper.setMatch_mode(0);
                tagWrapper.setPattern(tagWrapper.getName());
                tagWrapper.setExtra(0);
                tagWrapper.setAction(0);
                tagWrapper.setWeight(0);
                IResponse queryResp = findPhotoTagWrapper(tagWrapper, iRequest);
                if (!queryResp.equalsStatus(STATUS_NOT_FOUND)) {
                    if (queryResp.isSuccess()) {
                        response.putAttr("tagWrapper", queryResp.getAttr("tagWrapper"));
                    }
                    return response.setStatus(STATUS_FORBIDDEN, "该PhotoTagWrapper已存在，不能重复创建");
                }
            } else if (!tagWrapper.getUid().equals(loginUser.getUid())) {
                return response.setStatus(STATUS_FORBIDDEN, "你在创建谁的呢？");
            } else if (tagWrapper.getType().equals(TagWrapperType.SEARCH.value)) {
                tagWrapper.setTopic(0);
            }
            tagWrapper.setPtwid(IdUtil.generatePrimaryKey()); // 主键
            if (tagWrapper.getType() == null) {
                tagWrapper.setType(TagWrapperType.MARK.value);
            }
            if (tagWrapper.getMatch_mode() == null) {
                tagWrapper.setMatch_mode(0);
            }
            if (tagWrapper.getPattern() == null) {
                tagWrapper.setPattern(tagWrapper.getName());
            }
            if (tagWrapper.getWeight() == null) {
                tagWrapper.setWeight(0);
            }
            if (tagWrapper.getAction() == null) {
                tagWrapper.setAction(0);
            }
            if (tagWrapper.getExtra() == null) {
                tagWrapper.setExtra(0);
            }
            if (tagWrapper.getScope() == null) {
                tagWrapper.setScope(0L);
            }
            if (tagWrapper.getPermission() == null) {
                tagWrapper.setPermission(0);
            }
            if (tagWrapper.getDescription() == null) {
                tagWrapper.setDescription("");
            }
            if (tagWrapper.getCommon_value() == null) {
                tagWrapper.setCommon_value(0);
            }
            if (tagWrapper.getTopic() == null) {
                tagWrapper.setTopic(0);
            }
            // 只有管理员才能配置公共标签
            if (tagWrapper.getCommon_value().equals(1) && !loginUser.getUserGroup().isManager()) {
                tagWrapper.setCommon_value(0);
            }
            int row = albumDao.savePhotoTagWrapper(tagWrapper);
            if (row > 0) {
                response.putAttr("tagWrapper", tagWrapper).setStatus(STATUS_SUCCESS);
            } else {
                response.setStatus(STATUS_PARAM_ERROR);
            }
        }
        // 如果开启syncTopicToPhotos， 将topicTagWrapper.name匹配到的photos，修改photo.topic为TagWrapper.ptwid
        syncTopicToPhotosIfNeed(null, tagWrapper, iRequest, response);
        return response;
    }

    /**
     * 更新PhotoTagWrapper
     *
     * @param tagWrapper
     * @param iRequest   attr:
     *                   <p>{Boolean} syncTopicToPhotos - true: 将topicTagWrapper.name匹配到的photos，修改photo.topic为TagWrapper.ptwid</p>
     *                   <p>{Integer} syncTopicToPhotosMode -  同步模式，0：对于photo.topic已有值的不覆盖，1：覆盖</p>
     * @return IResponse:
     * tagWrapper
     */
    @Override
    public IResponse updatePhotoTagWrapper(PhotoTagWrapper tagWrapper, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (tagWrapper == null || (!IdUtil.containValue(tagWrapper.getPtwid()) && Utils.isEmpty(tagWrapper.getName()))) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else {
            tagWrapper.setUid(loginUser.getUid());
            IResponse tagWrapperResp = findPhotoTagWrapper(tagWrapper, iRequest);
            if (tagWrapperResp.isFail()) {
                return response.setStatus(tagWrapperResp);
            }
            PhotoTagWrapper dbTagWrapper = tagWrapperResp.getAttr("tagWrapper");
            tagWrapper.setPtwid(dbTagWrapper.getPtwid());
            if (!dbTagWrapper.getUid().equals(loginUser.getUid())) {
                return response.setStatus(STATUS_FORBIDDEN);
            }
            if (tagWrapper.getType() == null) {
                tagWrapper.setType(dbTagWrapper.getType());
            }
            if (tagWrapper.getMatch_mode() == null) {
                tagWrapper.setMatch_mode(dbTagWrapper.getMatch_mode());
            }
            if (tagWrapper.getAction() == null) {
                tagWrapper.setAction(dbTagWrapper.getAction());
            }
            if (tagWrapper.getExtra() == null) {
                tagWrapper.setExtra(dbTagWrapper.getExtra());
            }
            if (tagWrapper.getScope() == null) {
                tagWrapper.setScope(dbTagWrapper.getScope());
            }
            if (tagWrapper.getWeight() == null) {
                tagWrapper.setWeight(dbTagWrapper.getWeight());
            }
            if (tagWrapper.getPermission() == null) {
                tagWrapper.setPermission(dbTagWrapper.getPermission());
            }
            if (tagWrapper.getDescription() == null) {
                tagWrapper.setDescription(dbTagWrapper.getDescription());
            }
            if (tagWrapper.getCommon_value() == null) {
                tagWrapper.setCommon_value(dbTagWrapper.getCommon_value());
            }
            if (tagWrapper.getTopic() == null) {
                tagWrapper.setTopic(dbTagWrapper.getTopic());
            }
            //
            if (tagWrapper.getType().equals(TagWrapperType.MARK.value)) {
                // 作为标识用途的tagWrapper不能设置为公共标签
                tagWrapper.setCommon_value(0);
                tagWrapper.setMatch_mode(0);
                tagWrapper.setPattern(tagWrapper.getName());
                tagWrapper.setExtra(0);
                tagWrapper.setAction(0);
                tagWrapper.setWeight(0);
            } else if (tagWrapper.getType().equals(TagWrapperType.SEARCH.value)) {
                tagWrapper.setTopic(0);
            }
            // 只有管理员才能配置公共标签
            if (tagWrapper.getCommon_value().equals(1) && !loginUser.getUserGroup().isManager()) {
                tagWrapper.setCommon_value(0);
            }
            int row = albumDao.updatePhotoTagWrapper(tagWrapper);
            if (row > 0) {
                response.putAttr("tagWrapper", tagWrapper).setStatus(STATUS_SUCCESS);
            } else {
                response.setStatus(STATUS_SERVER_ERROR);
            }
            if (response.isSuccess()) {
                syncTopicToPhotosIfNeed(dbTagWrapper, tagWrapper, iRequest, response);
            }
        }
        return response;
    }

    /**
     * 如果开启syncTopicToPhotos， 将topicTagWrapper.name匹配到的photos，修改photo.topic为TagWrapper.ptwid
     */
    private void syncTopicToPhotosIfNeed(PhotoTagWrapper beforeTagWrapper, PhotoTagWrapper tagWrapper, IRequest iRequest, IResponse response) {
        boolean syncTopicToPhotos = iRequest.getAttr("syncTopicToPhotos", false);
        if (syncTopicToPhotos) {
            int status;
            if (tagWrapper.getType().equals(TagWrapperType.MARK.value) && tagWrapper.getTopic() == 1) {
                int syncTopicToPhotosMode = iRequest.getAttr("syncTopicToPhotosMode", 0);
                // 如果开启同步且更新tagWrapper时修改了name且该tagWrapper为一个topic，则同步修改photo中的tags
                if (beforeTagWrapper != null && !beforeTagWrapper.getName().equals(tagWrapper.getName())) {
                    IRequest replaceTagIRequest = iRequest.copyIRequest();
                    Photo queryPhoto = new Photo();
                    queryPhoto.setUid(tagWrapper.getUid());
                    queryPhoto.setTags("<" + beforeTagWrapper.getName() + ">");
                    replaceTagIRequest.putAttr("base", "user_photos").putAttr("logic_conn", "and");
                    IResponse replaceTagResp = batchReplacePhotoTag(queryPhoto, beforeTagWrapper.getName(), tagWrapper.getName(), replaceTagIRequest);
                    response.putAttr("batchReplacePhotoTagResult", replaceTagResp.getStatus());
                    response.putAttr(replaceTagResp.getAttr());
                }
                int row = albumDao.updatePhotoTopicRelation(tagWrapper, syncTopicToPhotosMode);
                status = convertRowToHttpCode(row);
                if (status == STATUS_SUCCESS || status == STATUS_NOT_FOUND) {
                    response.putAttr("syncTopicToPhotosAffectedRows", row);
                }
            } else {
                status = STATUS_PARAM_ERROR;
            }
            response.putAttr("syncTopicToPhotosResult", status);
        }
    }

    /**
     * 删除PhotoTagWrapper
     *
     * @param tagWrapper
     * @param iRequest
     * @return IResponse:
     */
    @Override
    public IResponse deletePhotoTagWrapper(PhotoTagWrapper tagWrapper, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (tagWrapper == null || (!IdUtil.containValue(tagWrapper.getPtwid()) && Utils.isEmpty(tagWrapper.getName()))) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else {
            tagWrapper.setUid(loginUser.getUid());
            IResponse tagWrapperResp = findPhotoTagWrapper(tagWrapper, iRequest);
            if (tagWrapperResp.isFail()) {
                return response.setStatus(tagWrapperResp);
            }
            PhotoTagWrapper dbTagWrapper = tagWrapperResp.getAttr("tagWrapper");
            tagWrapper.setPtwid(dbTagWrapper.getPtwid());
            if (!dbTagWrapper.getUid().equals(loginUser.getUid())) {
                return response.setStatus(STATUS_FORBIDDEN);
            }
            int row = albumDao.deletePhotoTagWrapper(tagWrapper);
            if (row > 0) {
                response.setStatus(STATUS_SUCCESS);
            } else {
                response.setStatus(STATUS_SERVER_ERROR);
            }
        }
        return response;
    }

    /**
     * 保存相册与照片关联类
     *
     * @param apr
     * @param iRequest
     * @return IResponse:
     * apr -
     */
    @Override
    public IResponse saveAlbumPhotoRelation(AlbumPhotoRelation apr, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        }
        if (apr == null || !IdUtil.containValue(apr.getAlbum_id()) || !IdUtil.containValue(apr.getPhoto_id())) {
            return response.setStatus(STATUS_PARAM_ERROR);
        }
        int flag = STATUS_SUCCESS;
        IResponse albumResp = findAlbumInfo(new Album(apr.getAlbum_id()), iRequest);
        response.setStatus(albumResp);
        if (response.isSuccess()) {
            if (((Album) albumResp.getAttr("album")).getUser().getUid().equals(loginUser.getUid())) {
                IResponse photoResp = findPhoto(new Photo(apr.getPhoto_id()), iRequest);
                response.setStatus(photoResp);
                if (response.isSuccess()) {
                    if (((Photo) photoResp.getAttr("photo")).getUid().equals(loginUser.getUid())) {
                        // 更新排序权重
                        if (apr.getSort().equals(0L)) {
                            flag = albumDao.deleteAlbumPhotoRelation(apr) >= 0 ? STATUS_SUCCESS : STATUS_SERVER_ERROR;
                        } else {
                            AlbumPhotoRelation dbApr = albumDao.findAlbumPhotoRelation(apr);
                            if (dbApr == null) {
                                flag = albumDao.saveAlbumPhotoRelation(apr) > 0 ? STATUS_SUCCESS : STATUS_SERVER_ERROR;
                            } else {
                                apr.setAprid(dbApr.getAprid());
                                flag = albumDao.updateAlbumPhotoRelation(apr) > 0 ? STATUS_SUCCESS : STATUS_SERVER_ERROR;
                            }
                            response.putAttr("apr", apr);
                        }
                    } else {
                        flag = STATUS_FORBIDDEN;
                    }
                }
            } else {
                flag = STATUS_FORBIDDEN;
            }
        }
        response.setStatus(flag);
        return response;
    }

    /**
     * 删除相册与照片关联类
     *
     * @param albumPhotoRelation
     * @param iRequest
     * @return
     */
    @Override
    public IResponse deleteAlbumPhotoRelation(AlbumPhotoRelation albumPhotoRelation, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        return null;
    }

    /**
     * 查询相册的历史用户动作记录
     *
     * @param album
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * albumActionRecords
     * album_action_record_count
     */
    @Override
    public IResponse findAlbumActionRecordList(Album album, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (album == null) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else {
            IResponse albumResp = findAlbumInfo(album, iRequest);
            if (albumResp.isSuccess()) {
                Album db_album = albumResp.getAttr("album");
                if (db_album.getUser().getUid().equals(loginUser.getUid())) {
                    ActionRecord<Album> queryActionRecord = new ActionRecord<>();
                    queryActionRecord.setCreation(new Album(db_album.getAlbum_id()));
                    List<ActionRecord<Album>> albumActionRecordList = userDao.findAlbumActionRecordList(queryActionRecord, iRequest.getLoginUser());
                    response.putAttr("albumActionRecords", albumActionRecordList);
                    response.putAttr("album_action_record_count", albumActionRecordList.size());
                    response.putAttr(albumResp.getAttr());
                } else {
                    response.setStatus(STATUS_FORBIDDEN, "访问记录只能作者本人查看~");
                }
            } else {
                response.setStatus(albumResp);
            }
        }
        return response;
    }

    /**
     * 查询照片的历史用户动作记录
     *
     * @param photo
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * photoActionRecords
     * photo_action_record_count
     */
    @Override
    public IResponse findPhotoActionRecordList(Photo photo, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (photo == null) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else {
            IResponse photoResp = findPhoto(photo, iRequest);
            if (photoResp.isSuccess()) {
                Photo db_photo = photoResp.getAttr("photo");
                if (db_photo.getUid().equals(loginUser.getUid())) {
                    ActionRecord<Photo> queryActionRecord = new ActionRecord<>();
                    queryActionRecord.setCreation(new Photo(db_photo.getPhoto_id()));
                    List<ActionRecord<Photo>> photoActionRecordList = userDao.findPhotoActionRecordList(queryActionRecord, iRequest.getLoginUser());
                    response.putAttr("photoActionRecords", photoActionRecordList);
                    response.putAttr("photo_action_record_count", photoActionRecordList.size());
                    response.putAttr(photoResp.getAttr());
                } else {
                    response.setStatus(STATUS_FORBIDDEN, "访问记录只能作者本人查看~");
                }
            } else {
                response.setStatus(photoResp);
            }
        }
        return response;
    }

    // 生成默认封面photo对象
    private Photo generateDefaultCover() {
        Photo p = null;
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        String coverJson = Config.get(ConfigConstants.ALBUM_DEFAULT_COVER);
        try {
            p = objectMapper.readValue(coverJson, Photo.class);
        } catch (IOException e) {
            logger.error("相册默认封面配置错误： ", e);
            try {
                p = objectMapper.readValue("{\"path\":\"res/img/album_default.jpg\",\"width\": 800,\"height\": 800}", Photo.class);
            } catch (IOException e1) {
                e1.printStackTrace();
            }
        }
        if (p == null) {
            p = new Photo(0L);
        }
        p.setPhoto_id(0L);
        return p;
    }

    // 填充非必需填项的null值
    private void fillAlbumNotRequiredValueIfNull(Album album) {
        if (album == null) {
            return;
        }
        String EMPTY = "";
        if (album.getDescription() == null) {
            album.setDescription(EMPTY);
        }
        if (album.getMount() == null) {
            album.setMount(EMPTY);
        }
        if (album.getPermission() == null) {
            album.setPermission(0);
        }
        if (album.getShow_col() == null) {
            album.setShow_col(0);
        }
        if (album.getCover() == null) {
            album.setCover(new Photo());
        }
        if (album.getCover().getPhoto_id() == null) { // 因为cover_id可以设置为0，所以这里只需要判断null就行
            album.getCover().setPhoto_id(0L);
        }
    }

    private void fillAlbumNotRequiredValueIfNull(Album album, Album db_album) {
        if (album == null) {
            return;
        } else if (db_album == null) {
            fillAlbumNotRequiredValueIfNull(album);
        } else {
            if (album.getName() == null) {
                album.setName(db_album.getName());
            }
            if (album.getDescription() == null) {
                album.setDescription(db_album.getDescription());
            }
            if (album.getMount() == null) {
                album.setMount(db_album.getMount());
            }
            if (album.getPermission() == null) {
                album.setPermission(db_album.getPermission());
            }
            if (album.getShow_col() == null) {
                album.setShow_col(db_album.getShow_col());
            }
            if (album.getUser() == null) {
                album.setUser(db_album.getUser());
            }
            if (!IdUtil.containValue(album.getUser().getUid())) {
                album.getUser().setUid(db_album.getUser().getUid());
            }
            if (album.getCover() == null) {
                album.setCover(db_album.getCover());
            }
            if (album.getCover().getPhoto_id() == null) { // 因为cover_id可以设置为0，所以这里只需要判断null就行
                album.getCover().setPhoto_id(album.getCover().getPhoto_id());
            }
        }
    }

    // 填充非必需填项的null值为空字符串
    private void fillPhotoNotRequiredValueIfNull(Photo photo) {
        if (photo == null) {
            return;
        }
        String EMPTY = "";
        if (photo.getTags() == null) {
            photo.setTags(EMPTY);
        }
        if (photo.getDescription() == null) {
            photo.setDescription(EMPTY);
        }
        if (photo.getName() == null) {
            photo.setName(EMPTY);
        }
        if (photo.getRefer() == null) {
            photo.setRefer(EMPTY);
        }
        if (photo.getTopic() == null) {
            PhotoTagWrapper topic = new PhotoTagWrapper();
            topic.setPtwid(0L);
            photo.setTopic(topic);
        }
    }

    // 如果非必需填项的值为null, 则填充为db_photo的值
    private void fillPhotoNotRequiredValueIfNull(Photo photo, Photo db_photo) {
        if (photo == null) {
            return;
        } else if (db_photo == null) {
            fillPhotoNotRequiredValueIfNull(photo);
        } else {
            if (!IdUtil.containValue(photo.getAlbum_id())) {
                photo.setAlbum_id(db_photo.getAlbum_id());
            }
            if (!IdUtil.containValue(photo.getUid())) {
                photo.setUid(db_photo.getUid());
            }
            if (photo.getTags() == null) {
                photo.setTags(db_photo.getTags());
            }
            if (photo.getDescription() == null) {
                photo.setDescription(db_photo.getDescription());
            }
            if (photo.getName() == null) {
                photo.setName(db_photo.getName());
            }
            if (photo.getRefer() == null) {
                photo.setRefer(db_photo.getRefer());
            }
            if (photo.getTopic() == null) {
                if (db_photo.getTopic() == null) {
                    PhotoTagWrapper topic = new PhotoTagWrapper();
                    topic.setPtwid(0L);
                    photo.setTopic(topic);
                } else {
                    photo.setTopic(db_photo.getTopic());
                }
            }
        }
    }

    /**
     * 将相册对象转成sql，用于恢复删除的相册
     *
     * @param album
     * @return
     */
    private String convertAlbumToInsertSQL(Album album) {
        StringBuilder sb = new StringBuilder();
        // album sql
        sb.append("# album\r\n");
        sb.append("INSERT INTO `album` (`ALBUM_ID`, `UID`, `name`, `cover`, `description`, `create_time`, `permission`, `mount`, `size`, `show_col`) VALUES (");
        sb.append(album.getAlbum_id()).append(COMMA).append(album.getUser().getUid()).append(COMMA).append(escapeSql(album.getName())).append(COMMA);
        sb.append(album.getCover().getPhoto_id() == null ? 0 : album.getCover().getPhoto_id()).append(COMMA).append(escapeSql(album.getDescription())).append(COMMA);
        sb.append(album.getCreate_time().getTime()).append(COMMA).append(album.getPermission()).append(COMMA).append(escapeSql(album.getMount())).append(COMMA).append(album.getSize()).append(COMMA).append(album.getShow_col()).append(");\r\n");
        // photo sql
        sb.append("\r\n# photo list\r\n");
        List<Photo> photos = album.getPhotos();
        for (Photo photo : photos) {
            if (photo.getAlbum_id().equals(album.getAlbum_id())) {
                convertPhotoToInsertSQL(sb, photo);
            }
        }
        // album_photo_relation sql
        sb.append("\r\n# 排序权重\r\n");
        List<AlbumPhotoRelation> aprList = albumDao.findAlbumPhotoRelationList(null);
        if (aprList != null) {
            for (AlbumPhotoRelation apr : aprList) {
                if (apr.getAlbum_id().equals(album.getAlbum_id())) {
                    convertAprToInsertSQL(sb, apr);
                } else {
                    for (Photo photo : photos) {
                        if (photo.getPhoto_id().equals(apr.getPhoto_id())) {
                            convertAprToInsertSQL(sb, apr);
                            break;
                        }
                    }
                }
            }
        }
        return sb.toString();
    }

    private void convertPhotoToInsertSQL(StringBuilder sb, Photo photo) {
        sb.append("INSERT INTO `photo` (`PHOTO_ID`, `UID`, `ALBUM_ID`, `name`, `path`, `description`, `tags`, `upload_time`, `width`, `height`, `size`, `image_type`, `originName`, `refer`, `click_count`, `like_count`, `comment_count`) VALUES (");
        sb.append(photo.getPhoto_id()).append(COMMA).append(photo.getUid()).append(COMMA).append(photo.getAlbum_id()).append(COMMA).append(escapeSql(photo.getName())).append(COMMA);
        sb.append(escapeSql(photo.getPath())).append(COMMA).append(escapeSql(photo.getDescription())).append(COMMA).append(escapeSql(photo.getTags())).append(COMMA);
        sb.append(photo.getUpload_time().getTime()).append(COMMA).append(photo.getWidth()).append(COMMA).append(photo.getHeight()).append(COMMA).append(photo.getSize()).append(COMMA).append(escapeSql(photo.getImage_type())).append(COMMA);
        sb.append(escapeSql(photo.getOriginName())).append(COMMA).append(escapeSql(photo.getRefer())).append(COMMA).append(photo.getClick_count()).append(COMMA).append(photo.getLike_count()).append(COMMA).append(photo.getComment_count()).append(");\r\n");
    }

    private String convertPhotoToInsertSQL(Photo photo) {
        StringBuilder sb = new StringBuilder();
        // photo sql
        sb.append("# photo\r\n");
        convertPhotoToInsertSQL(sb, photo);
        // album_photo_relation sql
        sb.append("\r\n# 排序权重\r\n");
        Set<Long> albumIds = new HashSet<>();
        albumIds.add(photo.getAlbum_id());
        if (Utils.isNotEmpty(photo.getTags())) {
            Matcher matcher = Pattern.compile("#mount@(\\w+)#").matcher(photo.getTags());
            while (matcher.find()) {
                albumIds.add(Long.valueOf(matcher.group(1)));
            }
        }
        for (Long albumId : albumIds) {
            AlbumPhotoRelation apr = albumDao.findAlbumPhotoRelation(new AlbumPhotoRelation(albumId, photo.getPhoto_id(), 0L));
            if (apr != null && IdUtil.containValue(apr.getAprid())) {
                convertAprToInsertSQL(sb, apr);
            }
        }
        return sb.toString();
    }

    private void convertAprToInsertSQL(StringBuilder sb, AlbumPhotoRelation apr) {
        sb.append("insert into album_photo_relation (`aprid`, `album_id`, `photo_id`, `sort`) values (");
        sb.append(apr.getAprid()).append(COMMA).append(apr.getAlbum_id()).append(COMMA).append(apr.getPhoto_id()).append(COMMA).append(apr.getSort()).append(");\r\n");
    }

    private String escapeSql(String str) {
        if (str == null) {
            return "''";
        } else {
            return QUOTE + StringEscapeUtils.escapeSql(str) + QUOTE;
        }
    }

}
