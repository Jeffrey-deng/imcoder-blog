package site.imcoder.blog.service.impl;

import org.apache.commons.lang.StringEscapeUtils;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.dao.IAlbumDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.service.IAlbumService;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
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
            return b.getPhoto_id() - n.getPhoto_id();
        }
    };

    @Resource
    private IAlbumDao albumDao;

    @Resource(name = "localFileService")
    private IFileService fileService;

    @Resource
    private Cache cache;

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
            album.setCover(Config.get(ConfigConstants.ALBUM_DEFAULT_COVER));
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
        }

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
                mountCondition.setTags(MOUNT_PREFIX + db_album.getAlbum_id());
                List<Photo> mountPhotos = findPhotoList(mountCondition, "and", 0, 0, loginUser);
                photos.addAll(mountPhotos);
                Collections.sort(photos, ALBUM_PHOTO_COMPARATOR); // 重新排序
                db_album.setSize(photos.size());
            } else {
                db_album.setSize(photos.size());
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
        return albumDao.findAlbumInfoList(album, loginUser);
    }

    /**
     * 更新相册
     *
     * @param album
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到，500：服务器错误
     */
    @Override
    public int updateAlbum(Album album, User loginUser) {
        if (loginUser == null) {
            return 401;
        }
        Map<String, Object> map = this.findAlbumInfo(album, loginUser);
        int flag = (Integer) map.get("flag");
        if (flag == 200) {
            Album db_album = (Album) map.get("album");
            if (db_album.getUser().getUid() == loginUser.getUid()) {
                int index = albumDao.updateAlbum(album);
                return index > 0 ? 200 : 500;
            } else {
                return 403;
            }
        } else {
            return flag;
        }
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
        Map<String, Object> map = this.findAlbumWithPhotos(album, loginUser);
        int flag = (Integer) map.get("flag");
        if (flag == 200) {
            Album db_album = (Album) map.get("album");
            int uid = db_album.getUser().getUid();
            if (uid == loginUser.getUid() && db_album.getName().equals(album.getName())) {
                String relativePath = fileService.generateAlbumPath(db_album);
                boolean rs = false;
                if (deleteFromDisk) {
                    // 回收相册文件夹
                    rs = fileService.recycleTrash(Config.get(ConfigConstants.CLOUD_FILE_BASEPATH), relativePath, false);
                }
                if (rs || !deleteFromDisk) {
                    String sqlBackupPath = Config.get(ConfigConstants.TRASH_RECYCLE_BASEPATH) + relativePath + "album_data_" + db_album.getAlbum_id() + "_" + new Date().getTime() + ".sql";
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
        } else if (file == null || photo == null) {
            map.put("flag", 400);
        } else {
            Album album = new Album();
            album.setAlbum_id(photo.getAlbum_id());
            Map<String, Object> albumFindMap = this.findAlbumInfo(album, loginUser);
            int albumFindFlag = (int) albumFindMap.get("flag");
            if (albumFindFlag == 200) {
                Album albumFindAlbum = (Album) albumFindMap.get("album");
                if (albumFindAlbum.getUser().getUid() == loginUser.getUid()) {
                    photo.setUid(loginUser.getUid());
                    photo.setUpload_time(new Date());
                    String relativePath = fileService.generatePhotoFolderPath(albumFindAlbum);
                    String fileName = fileService.generateNextPhotoFilename(photo, Config.get(ConfigConstants.CLOUD_FILE_BASEPATH) + relativePath);
                    boolean isSave = fileService.savePhotoFile(file, photo, relativePath, fileName);
                    if (isSave) {
                        photo.setPath(relativePath + fileName);
                        // 更新相册封面
                        if (photo.getIscover() == 1) {
                            updateCoverForAlbum(photo);
                        }
                        int index = albumDao.savePhoto(photo);
                        if (index > 0) {
                            map.put("flag", 200);
                        } else {
                            map.put("flag", 500);
                            String diskPath = Config.get(ConfigConstants.CLOUD_FILE_BASEPATH) + photo.getPath();
                            fileService.delete(diskPath);
                        }
                    } else {
                        map.put("flag", 500);
                    }
                } else {
                    map.put("flag", 403);
                }
            } else {
                map.put("flag", albumFindFlag);
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

        Album album = new Album();
        album.setAlbum_id(photo.getAlbum_id());
        Album albumInfo = albumDao.findAlbumInfo(album);

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
                    int right = fileService.recycleTrash(Config.get(ConfigConstants.CLOUD_FILE_BASEPATH), db_photo.getPath(), true) ? 1 : 0; //回收
                    left = left * right;
                }
                Pattern pattern = Pattern.compile("^(.*/).+/(.*)\\.(.*)?$");
                Matcher matcher = pattern.matcher(db_photo.getPath());
                matcher.find();
                fileService.saveText(backupSql, Config.get(ConfigConstants.TRASH_RECYCLE_BASEPATH) + matcher.group(1) + matcher.group(2) + ".sql");
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
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到，500：服务器错误
     */
    @Override
    public int updatePhoto(Photo photo, MultipartFile file, User loginUser) {
        if (loginUser == null) {
            return 401;
        }
        Map<String, Object> map = this.findPhoto(photo, loginUser);
        int flag = (Integer) map.get("flag");
        if (flag == 200) {
            Photo db_photo = (Photo) map.get("photo");
            if (db_photo.getUid() == loginUser.getUid()) {
                photo.setAlbum_id(db_photo.getAlbum_id());
                String oldPath = db_photo.getPath();
                if (file != null && !file.isEmpty() && file.getContentType().indexOf("image") != -1) {
                    if (photo.getOriginName() == null) {
                        if (db_photo.getOriginName() != null) {
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
                    if (fileService.savePhotoFile(file, photo, newPathDir, newPathFileName)) { //保存新文件到磁盘
                        if (db_photo.getImage_type() != null && db_photo.getImage_type().indexOf("video") != -1) {
                            photo.setImage_type(db_photo.getImage_type()); // 视频：更新视频封面图片文件时，避免旧类型被覆盖
                        }
                        photo.setPath(newPathDir + newPathFileName);
                        fileService.recycleTrash(Config.get(ConfigConstants.CLOUD_FILE_BASEPATH), oldPath, true); // 回收旧文件
                    } else {
                        return 500;
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
                }
                // 更新相册封面 需要先更新 album_cover 在更新photo
                if (photo.getIscover() == 1) {
                    updateCoverForAlbum(photo);
                }
                int index = albumDao.updatePhoto(photo);
                return index > 0 ? 200 : 500;
            } else {
                return 403;
            }
        } else {
            return flag;
        }
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
            Album album = new Album();
            album.setAlbum_id(album_id);
            Map<String, Object> albumInfo = findAlbumInfo(album, loginUser);
            int flag = (int) albumInfo.get("flag");
            if (flag == 200) {
                Album lcd = (Album) albumInfo.get("album");
                int lcd_uid = lcd.getUser().getUid();
                String lcf_tags = MOUNT_PREFIX + album_id;
                photo.setAlbum_id(0); // 去掉相册条件
                List<Photo> photoList = albumDao.findPhotoList(photo, logic_conn, 0, 0, loginUser);
                if (photoList != null) {
                    List<Photo> newList = new ArrayList<>();
                    for (Photo p : photoList) {
                        if (p.getUid() == lcd_uid && (p.getAlbum_id() == album_id || (p.getTags() != null && p.getTags().indexOf(lcf_tags) != -1))) {
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

    // 更新相册封面
    private void updateCoverForAlbum(Photo photo) {
        Album album = new Album();
        album.setAlbum_id(photo.getAlbum_id());
        String json = "{\"path\": \"" + photo.getPath() + "\", \"photo_id\": " + photo.getPhoto_id() + ", \"width\": " + photo.getWidth() + ", \"height\": " + photo.getHeight() + "}";
        album.setCover(json);
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
        sb.append("INSERT INTO `album` (`ALBUM_ID`, `UID`, `name`, `cover`, `description`, `create_time`, `permission`, `size`, `show_col`) VALUES (");
        sb.append(album.getAlbum_id()).append(COMMA).append(album.getUser().getUid()).append(COMMA).append(escapeSql(album.getName())).append(COMMA);
        sb.append(escapeSql(album.getCover())).append(COMMA).append(escapeSql(album.getDescription())).append(COMMA);
        sb.append(album.getCreate_time().getTime()).append(COMMA).append(album.getPermission()).append(COMMA).append(album.getSize()).append(COMMA).append(album.getShow_col()).append(");\r\n");
        sb.append("\r\n");
        List<Photo> photos = album.getPhotos();
        for (Photo photo : photos) {
            convertPhotoToInsertSQL(sb, photo);
        }
        return sb.toString();
    }

    private void convertPhotoToInsertSQL(StringBuilder sb, Photo photo) {
        sb.append("INSERT INTO `photo` (`PHOTO_ID`, `UID`, `ALBUM_ID`, `name`, `path`, `description`, `tags`, `upload_time`, `width`, `height`, `size`, `image_type`, `iscover`, `originName`) VALUES (");
        sb.append(photo.getPhoto_id()).append(COMMA).append(photo.getUid()).append(COMMA).append(photo.getAlbum_id()).append(COMMA).append(escapeSql(photo.getName())).append(COMMA);
        sb.append(escapeSql(photo.getPath())).append(COMMA).append(escapeSql(photo.getDescription())).append(COMMA).append(escapeSql(photo.getTags())).append(COMMA);
        sb.append(photo.getUpload_time().getTime()).append(COMMA).append(photo.getWidth()).append(COMMA).append(photo.getHeight()).append(COMMA).append(photo.getSize()).append(COMMA).append(escapeSql(photo.getImage_type())).append(COMMA);
        sb.append(photo.getIscover()).append(COMMA).append(escapeSql(photo.getOriginName())).append(");\r\n");
    }

    private String convertPhotoToInsertSQL(Photo photo) {
        StringBuilder sb = new StringBuilder();
        convertPhotoToInsertSQL(sb, photo);
        return sb.toString();
    }

    private String escapeSql(String str) {
        if (str == null) {
            return "''";
        } else {
            return QUOTE + StringEscapeUtils.escapeSql(str) + QUOTE;
        }
    }

}
