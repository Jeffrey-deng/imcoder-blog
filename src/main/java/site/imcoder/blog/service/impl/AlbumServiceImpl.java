package site.imcoder.blog.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.dao.IAlbumDao;
import site.imcoder.blog.entity.Album;
import site.imcoder.blog.entity.Friend;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.IAlbumService;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import java.io.File;
import java.util.*;

/**
 * Created by Jeffrey.Deng on 2018/1/3.
 * 相册服务实现类
 */
@Service("albumService")
public class AlbumServiceImpl implements IAlbumService {

    @Resource
    private IAlbumDao albumDao;

    @Resource
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
                fileService.createAlbumFolder(Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + album.getUser().getUid() + "/album/" + album.getAlbum_id());
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
    public Map<String, Object> findAlbumWithPhotos(Album album, User loginUser) {
        Map<String, Object> map = this.findAlbumInfo(album, loginUser);
        int flag = (Integer) map.get("flag");
        if (flag == 200) {
            Album db_album = (Album) map.get("album");
            List<Photo> photos = albumDao.findPhotosFromAlbum(album);
            db_album.setPhotos(photos);
            if (photos != null) {
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
     * @param album
     * @param loginUser
     * @param deleteFromDisk
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到，500：服务器错误
     */
    @Override
    public int deleteAlbum(Album album, User loginUser, boolean deleteFromDisk) {
        if (loginUser == null) {
            return 401;
        }
        Map<String, Object> map = this.findAlbumInfo(album, loginUser);
        int flag = (Integer) map.get("flag");
        if (flag == 200) {
            Album db_album = (Album) map.get("album");
            if (db_album.getUser().getUid() == loginUser.getUid()) {
                // 此处硬盘上删除照片
                int index = albumDao.deleteAlbum(album);
                return index > 0 ? 200 : 500;
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
                    int uid = photo.getUid();
                    int albumId = photo.getAlbum_id();
                    String relativePath = Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + uid + "/album/" + albumId + "/";
                    String fileName = getMaxPhotoFilename(photo, Config.get(ConfigConstants.CLOUD_FILE_BASEPATH) + relativePath);
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
                            File tempFile = new File(diskPath);
                            if (tempFile.exists() && !tempFile.isDirectory()) {
                                fileService.delete(diskPath);
                            }
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
                int left = albumDao.deletePhoto(db_photo);
                if (deleteFromDisk) {
                    // int right = fileService.deleteFileByUrl(db_photo.getPath(), "cloud", request);
                    String diskPath = Config.get(ConfigConstants.CLOUD_FILE_BASEPATH) + db_photo.getPath();
                    int right = fileService.delete(diskPath);
                    left = left * right;
                }
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
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到，500：服务器错误
     */
    @Override
    public int updatePhoto(Photo photo, User loginUser) {
        if (loginUser == null) {
            return 401;
        }
        Map<String, Object> map = this.findPhoto(photo, loginUser);
        int flag = (Integer) map.get("flag");
        if (flag == 200) {
            Photo db_photo = (Photo) map.get("photo");
            if (db_photo.getUid() == loginUser.getUid()) {
                photo.setAlbum_id(db_photo.getAlbum_id());
                photo.setWidth(db_photo.getWidth());
                photo.setHeight(db_photo.getHeight());
                photo.setImage_type(db_photo.getImage_type());
                photo.setSize(db_photo.getSize());
                photo.setPath(db_photo.getPath());
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
    public List<Photo> findPhotoList(Photo photo, String logic_conn, int start, int size, User loginUser) {
        return albumDao.findPhotoList(photo, logic_conn, start, size, loginUser);
    }

    /**
     * 得到该照片在这个相册的文件名
     * 规则为 albumId_num ,
     *
     * @param photo
     * @param albumPath
     * @return
     */
    private String getMaxPhotoFilename(Photo photo, String albumPath) {
        int albumId = photo.getAlbum_id();
        String filename = albumId + "_";
        String suffix = "_" + photo.getUpload_time().getTime() + photo.getOriginName().substring(photo.getOriginName().lastIndexOf('.'));

        File dir = new File(albumPath);
        fileService.createDirs(albumPath);

        //列出该目录下所有文件和文件夹
        File[] files = dir.listFiles();

        if (files != null && files.length == 0) {
            filename = filename + "1" + suffix;
            return filename;
        }

        //按照文件文件名倒序排序
        Arrays.sort(files, new Comparator<File>() {
            @Override
            public int compare(File file1, File file2) {
                int num1 = Integer.valueOf(file1.getName().substring(file1.getName().indexOf('_') + 1, file1.getName().lastIndexOf('_')));
                int num2 = Integer.valueOf(file2.getName().substring(file2.getName().indexOf('_') + 1, file2.getName().lastIndexOf('_')));
                return num2 - num1;
            }
        });


        if (files != null && files.length > 0) {
            int num = Integer.valueOf(files[0].getName().substring(files[0].getName().indexOf('_') + 1, files[0].getName().lastIndexOf('_'))) + 1;
            filename = filename + num + suffix;
        }
        return filename;
    }

    // 更新相册封面
    private void updateCoverForAlbum(Photo photo) {
        Album album = new Album();
        album.setAlbum_id(photo.getAlbum_id());
        String json = "{\"path\": \"" + photo.getPath() + "\", \"photo_id\": " + photo.getPhoto_id() + ", \"width\": " + photo.getWidth() + ", \"height\": " + photo.getHeight() + "}";
        album.setCover(json);
        albumDao.updateCoverForAlbum(album);
    }

}
