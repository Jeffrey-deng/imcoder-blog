package site.imcoder.blog.service.impl;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.collections.map.HashedMap;
import org.apache.commons.lang.StringEscapeUtils;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.type.UserGroupType;
import site.imcoder.blog.dao.IAlbumDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.service.IAlbumService;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Created by Jeffrey.Deng on 2018/1/3.
 * 相册服务实现类
 */
@Service("albumService")
public class AlbumServiceImpl implements IAlbumService {

    private static Logger logger = Logger.getLogger(AlbumServiceImpl.class);

    private static char COMMA = ',';

    private static char QUOTE = '\'';

    private static String MOUNT_PREFIX = "mount@";

    private static Comparator<Photo> ALBUM_PHOTO_COMPARATOR = new Comparator<Photo>() {
        @Override
        public int compare(Photo b, Photo n) {
            int x = (b.getSort() == 0 ? b.getPhoto_id() * 1000 : b.getSort());
            int y = (n.getSort() == 0 ? n.getPhoto_id() * 1000 : n.getSort());
            return x - y;
        }
    };

    @Resource
    private IAlbumDao albumDao;

    @Resource(name = "fileService")
    private IFileService fileService;

    @Resource
    private Cache cache;

    /**
     * 得到照片上传配置信息
     *
     * @param loginUser
     * @return
     */
    @Override
    public Map<String, Object> getUploadConfigInfo(User loginUser) {
        Map<String, Object> uploadConfig = new HashedMap();
        uploadConfig.put("allowUploadLowestLevel", Config.getInt(ConfigConstants.CLOUD_ALLOW_UPLOAD_LOWEST_LEVEL));
        uploadConfig.put("isAllowUpload", isAllowUpload(loginUser));
        // uploadArgs
        Map<String, Object> uploadArgs = new HashedMap();
        uploadArgs.put("mode", Config.get(ConfigConstants.CLOUD_FILE_SYSTEM_MODE));
        uploadArgs.put("maxPhotoUploadSize", Config.getInt(ConfigConstants.CLOUD_PHOTO_MAX_UPLOADSIZE));
        uploadArgs.put("maxVideoUploadSize", Config.getInt(ConfigConstants.CLOUD_VIDEO_MAX_UPLOADSIZE));
        uploadConfig.put("uploadArgs", uploadArgs);
        //
        uploadConfig.put("flag", 200);
        return uploadConfig;
    }

    // 当前用户是否允许上传文件
    private boolean isAllowUpload(User loginUser) {
        if (loginUser == null) {
            return false;
        }
        // 云盘允许上传文件的用户组最低等级，值为对应用户组的Gid
        int lowestLevel = Config.getInt(ConfigConstants.CLOUD_ALLOW_UPLOAD_LOWEST_LEVEL);
        switch (UserGroupType.valueOfName(lowestLevel)) {
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
     * @param loginUser
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，500：服务器错误
     * album - album对象
     */
    @Override
    public Map<String, Object> createAlbum(Album album, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        map.put("album", album);
        if (loginUser == null) {
            map.put("flag", 401);
        } else if (album == null) {
            map.put("flag", 400);
        } else {
            album.setUser(loginUser);
            album.setCover(generateDefaultCover());
            album.setCreate_time(new Date());
            album.setSize(0);
            int index = albumDao.saveAlbum(album);
            if (index > 0) {
                fileService.createAlbumFolder(fileService.generateAlbumPath(album));
                map.put("flag", 200);
            } else {
                map.put("flag", 500);
            }
        }
        return map;
    }

    /**
     * 只查找相册的信息
     *
     * @param album
     * @param loginUser
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到
     * album - album对象, 没有photos
     */
    @Override
    public Map<String, Object> findAlbumInfo(Album album, User loginUser) {
        Map<String, Object> map = new HashMap<String, Object>();
        if (album == null) {
            map.put("flag", 400);
            return map;
        }
        Album db_album = albumDao.findAlbumInfo(album);
        map.put("album", db_album);
        map.put("flag", 200);
        if (db_album == null) {
            map.put("flag", 404);
            return map;
        } else if (db_album.getCover() == null || db_album.getCover().getPhoto_id() == 0) {
            // 添加默认封面photo对象
            db_album.setCover(generateDefaultCover());
        }
        db_album.setPhotos(null);

        //作者本人查看时直接返回
        if (loginUser != null && loginUser.getUid() == db_album.getUser().getUid()) {
            return map;
        }

        int permission = db_album.getPermission();

        //公开权限直接返回
        if (permission == 0) {
            return map;
        }
        // 权限为好友可见
        if (permission == 1 && loginUser != null) {
            Friend friend = new Friend();
            friend.setUid(db_album.getUser().getUid());
            friend.setFid(loginUser.getUid());
            if (cache.containsFriend(friend) > 0) {
                return map;
            }
        }
        map.put("album", null);
        map.put("flag", loginUser == null ? 401 : 403);
        return map;
    }

    /**
     * 查找出该相册的信息和图片列表
     *
     * @param album
     * @param loginUser
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册未找到
     * album - album对象 with photos
     */
    @Override
    public Map<String, Object> findAlbumWithPhotos(Album album, User loginUser) {
        return findAlbumWithPhotos(album, true, loginUser);
    }

    /**
     * 查找出该相册的信息和图片列表
     *
     * @param album
     * @param mount     是否加载挂载在此相册的照片
     * @param loginUser
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册未找到
     * album - album对象
     */
    @Override
    public Map<String, Object> findAlbumWithPhotos(Album album, boolean mount, User loginUser) {
        Map<String, Object> map = this.findAlbumInfo(album, loginUser);
        int flag = (Integer) map.get("flag");
        if (flag == 200) {
            Album db_album = (Album) map.get("album");
            List<Photo> photos = albumDao.findPhotosFromAlbum(album);
            if (photos == null) {
                photos = new ArrayList<>();
            }
            db_album.setPhotos(photos);
            if (mount) {
                Photo mountCondition = new Photo(); // 该相册挂载的查找条件
                mountCondition.setUid(db_album.getUser().getUid());
                mountCondition.setTags("<" + MOUNT_PREFIX + db_album.getAlbum_id() + ">");
                List<Photo> mountPhotos = findPhotoList(mountCondition, "and", 0, 0, loginUser);
                photos.addAll(mountPhotos);
                db_album.setSize(photos.size());
            } else {
                db_album.setSize(photos.size());
            }
            // 获取排序权重
            List<AlbumPhotoRelation> aprList = albumDao.findAlbumPhotoRelationList(album);
            Map<Integer, AlbumPhotoRelation> aprMap = new HashMap<>();
            if (aprList != null) {
                for (AlbumPhotoRelation apr : aprList) {
                    aprMap.put(apr.getPhoto_id(), apr);
                }
            }
            for (Photo p : photos) {
                AlbumPhotoRelation apr = aprMap.get(p.getPhoto_id());
                if (apr != null) {
                    p.setSort(apr.getSort());
                } else {
                    p.setSort(p.getPhoto_id() * 1000);
                }
            }
            if (mount || (aprList != null && aprList.size() > 0)) {
                Collections.sort(photos, ALBUM_PHOTO_COMPARATOR); // 重新排序
            }
        }
        return map;
    }

    /**
     * 查找相册列表
     *
     * @param album
     * @param loginUser
     * @return list
     */
    @Override
    public List<Album> findAlbumList(Album album, User loginUser) {
        List<Album> albumList = albumDao.findAlbumInfoList(album, loginUser);
        if (albumList != null && albumList.size() > 0) {
            // 添加默认封面photo对象
            Photo defaultCover = null;
            for (Album db_album : albumList) {
                if (db_album.getCover() == null || db_album.getCover().getPhoto_id() == 0) {
                    if (defaultCover == null) {
                        defaultCover = generateDefaultCover();
                    }
                    db_album.setCover(defaultCover);
                }
            }
        }
        return albumList;
    }

    /**
     * 更新相册
     *
     * @param album
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到，500：服务器错误
     * album - 更新后的album
     */
    @Override
    public Map<String, Object> updateAlbum(Album album, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        int flag = 200;
        if (album == null) {
            flag = 400;
            map.put("flag", flag);
            return map;
        } else if (loginUser == null) {
            flag = 401;
            map.put("flag", flag);
            return map;
        }
        Map<String, Object> albumQuery = this.findAlbumInfo(album, loginUser);
        int photoQueryFlag = (Integer) albumQuery.get("flag");
        if (photoQueryFlag == 200) {
            Album db_album = (Album) albumQuery.get("album");
            if (db_album.getUser().getUid() == loginUser.getUid()) {
                // 检查封面
                if (album.getCover() == null) {
                    album.setCover(db_album.getCover());
                } else if (album.getCover().getPhoto_id() > 0) {
                    Map<String, Object> photoQuery = this.findPhoto(album.getCover(), loginUser);
                    if ((int) photoQuery.get("flag") != 200 || ((Photo) photoQuery.get("photo")).getUid() != loginUser.getUid()) {
                        flag = 400;
                    }
                }
                if (flag == 200) {
                    int index = albumDao.updateAlbum(album);
                    flag = index > 0 ? 200 : 500;
                }
            } else {
                flag = 403;
            }
        } else {
            flag = photoQueryFlag;
        }
        map.put("flag", flag);
        if (flag == 200) {
            map.put("album", this.findAlbumInfo(album, loginUser).get("album"));
        }
        return map;
    }

    /**
     * 删除相册
     *
     * @param album          相册ID，相册名
     * @param loginUser
     * @param deleteFromDisk
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到，500：服务器错误
     */
    @Override
    public int deleteAlbum(Album album, User loginUser, boolean deleteFromDisk) {
        if (loginUser == null) {
            return 401;
        }
        // set umount=false filte mount
        Map<String, Object> map = this.findAlbumWithPhotos(album, false, loginUser);
        int flag = (Integer) map.get("flag");
        if (flag == 200) {
            Album db_album = (Album) map.get("album");
            int uid = db_album.getUser().getUid();
            if (uid == loginUser.getUid() && db_album.getName().equals(album.getName())) {
                String relativePath = fileService.generateAlbumPath(db_album);
                boolean rs = false;
                if (deleteFromDisk) {
                    // 回收相册文件夹
                    rs = fileService.recycleTrash(fileService.baseCloudDir(null), relativePath, false);
                }
                if (rs || !deleteFromDisk) {
                    String sqlBackupPath = fileService.baseTrashRecycleDir(relativePath + "album_data_" + db_album.getAlbum_id() + "_" + new Date().getTime() + ".sql");
                    fileService.saveText(convertAlbumToInsertSQL(db_album), sqlBackupPath); // 备份SQL文件
                    logger.info("FileRecycle backup album(" + db_album.getAlbum_id() + ") sql file in \"" + sqlBackupPath + "\"");
                    int index = albumDao.deleteAlbum(album);
                    return index > 0 ? 200 : 500;
                } else {
                    return 500;
                }
            } else {
                return 403;
            }
        } else {
            return flag;
        }
    }

    /**
     * 保存图片
     *
     * @param file
     * @param photo
     * @param loginUser
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册未找到, 500: 服务器错误
     * photo - photo对象
     */
    @Override
    public Map<String, Object> savePhoto(MultipartFile file, Photo photo, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        map.put("photo", photo);
        if (loginUser == null) {
            map.put("flag", 401);
        } else if (!isAllowUpload(loginUser)) {
            map.put("flag", 403);
        } else if (file == null || photo == null) {
            map.put("flag", 400);
        } else {
            fillPhotoNotRequiredValueIfNull(photo);
            if (photo.getOriginName() == null) {
                photo.setOriginName(file.getOriginalFilename());
            }
            Map<String, Object> albumQuery = this.findAlbumInfo(new Album(photo.getAlbum_id()), loginUser);
            int albumQueryFlag = (int) albumQuery.get("flag");
            if (albumQueryFlag == 200) {
                Album db_album = (Album) albumQuery.get("album");
                if (db_album.getUser().getUid() == loginUser.getUid()) {
                    photo.setUid(loginUser.getUid());
                    photo.setUpload_time(new Date());
                    String relativePath = fileService.generatePhotoFolderPath(db_album);
                    String fileName = fileService.generateNextPhotoFilename(photo, relativePath);
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
                            map.put("flag", 200);
                            // 更新相册封面
                            if (photo.getIscover() == 1) {
                                updateCoverForAlbum(photo);
                            }
                        } else {
                            map.put("flag", 500);
                            String diskPath = fileService.baseCloudDir(photo.getPath());
                            fileService.delete(diskPath);
                        }
                    } else {
                        map.put("flag", 500);
                    }
                } else {
                    map.put("flag", 403);
                }
            } else {
                map.put("flag", albumQueryFlag);
            }
        }
        return map;
    }

    /**
     * 查找照片
     *
     * @param photo
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到
     */
    @Override
    public Map<String, Object> findPhoto(Photo photo, User loginUser) {
        Map<String, Object> map = new HashMap<String, Object>();
        if (photo == null) {
            map.put("flag", 400);
            return map;
        }
        photo = albumDao.findPhotoInfo(photo);
        map.put("photo", photo);
        map.put("flag", 200);
        if (photo == null) {
            map.put("flag", 404);
            return map;
        }

        Album albumInfo = albumDao.findAlbumInfo(new Album(photo.getAlbum_id()));

        //作者本人查看时直接返回
        if (loginUser != null && loginUser.getUid() == albumInfo.getUser().getUid()) {
            return map;
        }

        int permission = albumInfo.getPermission();

        //公开权限直接返回
        if (permission == 0) {
            return map;
        }

        // 权限为好友可见
        if (permission == 1 && loginUser != null) {
            Friend friend = new Friend();
            friend.setUid(albumInfo.getUser().getUid());
            friend.setFid(loginUser.getUid());
            if (cache.containsFriend(friend) > 0) {
                return map;
            }
        }
        map.put("photo", null);
        map.put("flag", loginUser == null ? 401 : 403);
        return map;
    }

    /**
     * 删除照片
     *
     * @param photo
     * @param loginUser
     * @param deleteFromDisk 是否从服务器磁盘删除此照片
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到，500：服务器错误
     */
    @Override
    public int deletePhoto(Photo photo, User loginUser, boolean deleteFromDisk) {
        if (loginUser == null) {
            return 401;
        }
        Map<String, Object> map = this.findPhoto(photo, loginUser);
        int flag = (Integer) map.get("flag");
        if (flag == 200) {
            Photo db_photo = (Photo) map.get("photo");
            if (db_photo.getUid() == loginUser.getUid()) {
                String backupSql = convertPhotoToInsertSQL(db_photo);
                int left = albumDao.deletePhoto(db_photo);
                if (deleteFromDisk) {
                    // int right = fileService.deleteFileByUrl(db_photo.getPath(), "cloud", request);
                    int right = fileService.recycleTrash(fileService.baseCloudDir(null), db_photo.getPath(), true) ? 1 : 0; //回收
                    left = left * right;
                }
                Pattern pattern = Pattern.compile("^(.*/).+/(.*)\\.(.*)?$"); // 去掉分块的文件夹
                Matcher matcher = pattern.matcher(db_photo.getPath());
                matcher.find();
                fileService.saveText(backupSql, fileService.baseTrashRecycleDir(matcher.group(1) + matcher.group(2) + ".sql"));
                return left > 0 ? 200 : 500;
            } else {
                return 403;
            }
        } else {
            return flag;
        }
    }

    /**
     * 更新照片
     *
     * @param photo
     * @param file      可选，有则更新
     * @param loginUser
     * @flag = flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到，500：服务器错误
     * photo - 更新后的photo
     */
    @Override
    public Map<String, Object> updatePhoto(Photo photo, MultipartFile file, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        int flag = 200;
        if (loginUser == null) {
            flag = 401;
            map.put("flag", flag);
            return map;
        } else if (photo == null) {
            flag = 400;
            map.put("flag", flag);
            return map;
        }
        Map<String, Object> photoQuery = this.findPhoto(photo, loginUser);
        int photoQueryFlag = (int) photoQuery.get("flag");
        if (photoQueryFlag == 200) {
            Photo db_photo = (Photo) photoQuery.get("photo");
            if (db_photo.getUid() == loginUser.getUid()) {
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
                    Matcher matcher = Pattern.compile("^(.*/)(.*_)(\\d{10,})(\\..+)?$").matcher(oldPath);
                    matcher.find();
                    String newPathDir = matcher.group(1); //文件夹
                    String newPathExt = photo.getOriginName().lastIndexOf('.') != -1 ? photo.getOriginName().substring(photo.getOriginName().lastIndexOf('.')) : ".jpg";
                    String newPathFileName = matcher.group(2) + new Date().getTime() + newPathExt; // 新文件名
                    photo.setPath(null);
                    try {
                        if (fileService.savePhotoFile(file.getInputStream(), photo, newPathDir, newPathFileName)) { //保存新文件到磁盘
                            if (db_photo.getImage_type() != null && db_photo.getImage_type().indexOf("video") != -1) {
                                photo.setImage_type(db_photo.getImage_type()); // 视频：更新视频封面图片文件时，避免旧类型被覆盖
                            }
                            photo.setPath(newPathDir + newPathFileName);
                            flag = 200;
                        } else {
                            flag = 500;
                        }
                    } catch (IOException e) {
                        e.printStackTrace();
                        flag = 500;
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
                    flag = 200;
                }
                if (flag == 200) {
                    // 更新相册封面 需要先更新 album_cover 在更新photo
                    if (photo.getIscover() == 1) {
                        updateCoverForAlbum(photo);
                    }
                    int index = albumDao.updatePhoto(photo);
                    flag = index > 0 ? 200 : 500;
                    if (flag == 200) {
                        if (!oldPath.equals(photo.getPath())) {
                            fileService.recycleTrash(fileService.baseCloudDir(null), oldPath, true); // 回收旧文件
                        }
                    } else if (photo.getPath() != null && !oldPath.equals(photo.getPath())) {
                        String diskPath = fileService.baseCloudDir(photo.getPath());
                        fileService.delete(diskPath);
                    }
                }
            } else {
                flag = 403;
            }
        } else {
            flag = photoQueryFlag;
        }
        map.put("flag", flag);
        if (flag == 200) {
            map.put("photo", this.findPhoto(photo, loginUser).get("photo"));
        }
        return map;
    }

    /**
     * 查找照片集合
     *
     * @param photo
     * @param logic_conn
     * @param start
     * @param size
     * @param loginUser
     * @return photos
     */
    @Override
    public List<Photo> findPhotoList(Photo photo, String logic_conn, int start, int size, User loginUser) {
        return findPhotoList(null, photo, logic_conn, start, size, loginUser);
    }

    /**
     * 查找照片集合
     *
     * @param base       在哪个基础之下查找
     * @param photo
     * @param logic_conn
     * @param start
     * @param size
     * @param loginUser
     * @return photos
     */
    @Override
    public List<Photo> findPhotoList(String base, Photo photo, String logic_conn, int start, int size, User loginUser) {
        if (base != null && base.startsWith("album_detail") && photo != null && photo.getAlbum_id() > 0) {
            int album_id = photo.getAlbum_id();
            Map<String, Object> albumQuery = findAlbumInfo(new Album(album_id), loginUser);
            int flag = (int) albumQuery.get("flag");
            if (flag == 200) {
                Album albumInfo = (Album) albumQuery.get("album");
                int query_host_uid = albumInfo.getUser().getUid();
                Pattern belong_album_test_regex = Pattern.compile(".*\\b" + MOUNT_PREFIX + album_id + "\\b.*");
                photo.setAlbum_id(0); // 去掉相册条件
                List<Photo> photoList = albumDao.findPhotoList(photo, logic_conn, 0, 0, loginUser);
                if (photoList != null) {
                    List<Photo> newList = new ArrayList<>();
                    for (Photo p : photoList) {
                        if (p.getUid() == query_host_uid && (p.getAlbum_id() == album_id || (p.getTags() != null && belong_album_test_regex.matcher(p.getTags()).matches()))) {
                            newList.add(p);
                        }
                    }
                    photoList = null;
                    return newList;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        } else {
            return albumDao.findPhotoList(photo, logic_conn, start, size, loginUser);
        }
    }

    /**
     * 查找照片集合
     *
     * @param base       在哪个基础之下查找
     * @param photo
     * @param logic_conn
     * @param start
     * @param size
     * @param loginUser
     * @param extend     查询的标签是否是扩展标签，tags参数值不支持正则匹配，只支持相等匹配
     * @return photos
     */
    @Override
    public List<Photo> findPhotoList(String base, Photo photo, String logic_conn, int start, int size, User loginUser, boolean extend) {
        if (extend && photo != null && photo.getTags() != null && photo.getTags().length() > 0) {
            String tags = photo.getTags();
            PhotoTagWrapper queryWrapper = new PhotoTagWrapper();
            queryWrapper.setUid(photo.getUid());
            queryWrapper.setName(tags);
            List<PhotoTagWrapper> tagWrappers = albumDao.findPhotoTagWrappers(queryWrapper, loginUser);
            if (tagWrappers != null && tagWrappers.size() > 0) {
                photo.setTags(null);
                List<Photo> photos = findPhotoList(base, photo, logic_conn, 0, 0, loginUser);
                if (photos != null) {
                    List<Photo> newList = new ArrayList<>();
                    for (Photo p : photos) {
                        if (belongTagWrapper(p, tagWrappers)) {
                            newList.add(p);
                        }
                    }
                    photos = null;
                    return newList;
                } else {
                    return null;
                }
            }
        }
        return findPhotoList(base, photo, logic_conn, start, size, loginUser);
    }

    /**
     * 点击量加1
     *
     * @param photo
     * @return
     */
    @Override
    public int raisePhotoClickCount(Photo photo) {
        return albumDao.raisePhotoClickCount(photo);
    }

    private boolean belongTagWrapper(Photo photo, List<PhotoTagWrapper> tagWrappers) {
        if (photo.getTags() == null || photo.getTags().length() == 0) {
            return false;
        }
        try {
            String[] tags = photo.getTags().split("#");
            for (String tag : tags) {
                if (tag.length() > 0) {
                    for (PhotoTagWrapper wrapper : tagWrappers) {
                        if (wrapper.getUid() != photo.getUid()) {
                            continue;
                        }
                        String pattern = wrapper.getPattern();
                        switch (wrapper.getMatch_mode()) { // 匹配类型
                            case 0: // 全等
                                if (pattern.equalsIgnoreCase(tag)) {
                                    return true;
                                }
                                break;
                            case 1: // 前缀
                                if (tag.indexOf(pattern) == 0) {
                                    return true;
                                }
                                break;
                            case 2: // 后缀
                                if (tag.indexOf(pattern) + pattern.length() == tag.length()) {
                                    return true;
                                }
                                break;
                            case 3: // 正则
                                if (tag.matches(pattern)) {
                                    return true;
                                }
                                break;
                            case 4: // 包含
                                if (tag.indexOf(pattern) != -1) {
                                    return true;
                                }
                                break;
                            default:
                                continue;
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * 查询出用户设置的特殊标签
     *
     * @param tagWrapper
     * @param loginUser
     * @return
     */
    @Override
    public List<PhotoTagWrapper> findPhotoTagWrappers(PhotoTagWrapper tagWrapper, User loginUser) {
        return albumDao.findPhotoTagWrappers(tagWrapper, loginUser);
    }

    /**
     * 保存相册与照片关联类
     *
     * @param apr
     * @param loginUser
     * @return
     */
    @Override
    public int saveAlbumPhotoRelation(AlbumPhotoRelation apr, User loginUser) {
        if (loginUser == null) {
            return 401;
        }
        if (apr == null || apr.getAlbum_id() == 0 || apr.getPhoto_id() == 0) {
            return 400;
        }
        Map<String, Object> albumQuery = findAlbumInfo(new Album(apr.getAlbum_id()), loginUser);
        int albumFlag = (int) albumQuery.get("flag");
        if (albumFlag == 200) {
            if (((Album) albumQuery.get("album")).getUser().getUid() == loginUser.getUid()) {
                Map<String, Object> photoResult = findPhoto(new Photo(apr.getPhoto_id()), loginUser);
                int photoFlag = (int) photoResult.get("flag");
                if (photoFlag == 200) {
                    if (((Photo) photoResult.get("photo")).getUid() == loginUser.getUid()) {
                        // 更新排序权重
                        if (apr.getSort() == 0) {
                            return albumDao.deleteAlbumPhotoRelation(apr) >= 0 ? 200 : 500;
                        } else {
                            AlbumPhotoRelation dbApr = albumDao.findAlbumPhotoRelation(apr);
                            if (dbApr == null) {
                                return albumDao.saveAlbumPhotoRelation(apr) > 0 ? 200 : 500;
                            } else {
                                apr.setAprid(dbApr.getAprid());
                                return albumDao.updateAlbumPhotoRelation(apr) > 0 ? 200 : 500;
                            }
                        }
                    } else {
                        return 403;
                    }
                } else {
                    return photoFlag;
                }
            } else {
                return 403;
            }
        } else {
            return albumFlag;
        }
    }

    /**
     * 删除相册与照片关联类
     *
     * @param albumPhotoRelation
     * @param loginUser
     * @return
     */
    @Override
    public int deleteAlbumPhotoRelation(AlbumPhotoRelation albumPhotoRelation, User loginUser) {
        return 0;
    }

    // 生成默认封面photo对象
    private Photo generateDefaultCover() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        String coverJson = Config.get(ConfigConstants.ALBUM_DEFAULT_COVER);
        try {
            return objectMapper.readValue(coverJson, Photo.class);
        } catch (IOException e) {
            logger.error("相册默认封面配置错误： ", e);
            try {
                return objectMapper.readValue("{\"path\":\"res/img/album_default.jpg\",\"width\": 800,\"height\": 800}", Photo.class);
            } catch (IOException e1) {
                e1.printStackTrace();
            }
        }
        return new Photo(0);
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
    }

    // 如果非必需填项的值为null, 则填充为db_photo的值
    private void fillPhotoNotRequiredValueIfNull(Photo photo, Photo db_photo) {
        if (photo == null) {
            return;
        } else if (db_photo == null) {
            fillPhotoNotRequiredValueIfNull(photo);
        } else {
            if (photo.getAlbum_id() == 0) {
                photo.setAlbum_id(db_photo.getAlbum_id());
            }
            if (photo.getUid() == 0) {
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
        }
    }

    // 更新相册封面
    private void updateCoverForAlbum(Photo photo) {
        Album album = new Album(photo.getAlbum_id());
        // String json = "{\"path\": \"" + photo.getPath() + "\", \"photo_id\": " + photo.getPhoto_id() + ", \"width\": " + photo.getWidth() + ", \"height\": " + photo.getHeight() + "}";
        album.setCover(photo);
        albumDao.updateCoverForAlbum(album);
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
        sb.append("INSERT INTO `album` (`ALBUM_ID`, `UID`, `name`, `cover`, `description`, `create_time`, `permission`, `size`, `show_col`) VALUES (");
        sb.append(album.getAlbum_id()).append(COMMA).append(album.getUser().getUid()).append(COMMA).append(escapeSql(album.getName())).append(COMMA);
        sb.append(album.getCover().getPhoto_id()).append(COMMA).append(escapeSql(album.getDescription())).append(COMMA);
        sb.append(album.getCreate_time().getTime()).append(COMMA).append(album.getPermission()).append(COMMA).append(album.getSize()).append(COMMA).append(album.getShow_col()).append(");\r\n");
        // photo sql
        sb.append("\r\n# photo list\r\n");
        List<Photo> photos = album.getPhotos();
        for (Photo photo : photos) {
            if (photo.getAlbum_id() == album.getAlbum_id()) {
                convertPhotoToInsertSQL(sb, photo);
            }
        }
        // album_photo_relation sql
        sb.append("\r\n# 排序权重\r\n");
        List<AlbumPhotoRelation> aprList = albumDao.findAlbumPhotoRelationList(null);
        if (aprList != null) {
            for (AlbumPhotoRelation apr : aprList) {
                if (apr.getAlbum_id() == album.getAlbum_id()) {
                    convertAprToInsertSQL(sb, apr);
                } else {
                    for (Photo photo : photos) {
                        if (photo.getPhoto_id() == apr.getPhoto_id()) {
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
        sb.append("INSERT INTO `photo` (`PHOTO_ID`, `UID`, `ALBUM_ID`, `name`, `path`, `description`, `tags`, `upload_time`, `width`, `height`, `size`, `image_type`, `iscover`, `originName`, `refer`) VALUES (");
        sb.append(photo.getPhoto_id()).append(COMMA).append(photo.getUid()).append(COMMA).append(photo.getAlbum_id()).append(COMMA).append(escapeSql(photo.getName())).append(COMMA);
        sb.append(escapeSql(photo.getPath())).append(COMMA).append(escapeSql(photo.getDescription())).append(COMMA).append(escapeSql(photo.getTags())).append(COMMA);
        sb.append(photo.getUpload_time().getTime()).append(COMMA).append(photo.getWidth()).append(COMMA).append(photo.getHeight()).append(COMMA).append(photo.getSize()).append(COMMA).append(escapeSql(photo.getImage_type())).append(COMMA);
        sb.append(photo.getIscover()).append(COMMA).append(escapeSql(photo.getOriginName())).append(COMMA).append(escapeSql(photo.getRefer())).append(");\r\n");
    }

    private String convertPhotoToInsertSQL(Photo photo) {
        StringBuilder sb = new StringBuilder();
        // photo sql
        sb.append("# photo\r\n");
        convertPhotoToInsertSQL(sb, photo);
        // album_photo_relation sql
        sb.append("\r\n# 排序权重\r\n");
        Set<Integer> albumIds = new HashSet<>();
        albumIds.add(photo.getAlbum_id());
        if (Utils.isNotEmpty(photo.getTags())) {
            Matcher matcher = Pattern.compile("#mount@(\\d+)\\b").matcher(photo.getTags());
            while (matcher.find()) {
                albumIds.add(Integer.valueOf(matcher.group(1)));
            }
        }
        for (int albumId : albumIds) {
            AlbumPhotoRelation apr = albumDao.findAlbumPhotoRelation(new AlbumPhotoRelation(albumId, photo.getPhoto_id(), 0));
            if (apr != null && apr.getAprid() > 0) {
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
