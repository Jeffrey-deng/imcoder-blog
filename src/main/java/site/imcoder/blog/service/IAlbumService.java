package site.imcoder.blog.service;

import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.entity.*;

import java.util.List;
import java.util.Map;

/**
 * Created by Jeffrey.Deng on 2018/1/3.
 * 相册服务接口
 */
public interface IAlbumService {

    /**
     * 得到照片上传配置信息
     *
     * @param loginUser
     * @return
     */
    public Map<String, Object> getUploadConfigInfo(User loginUser);

    /**
     * 创建相册
     *
     * @param album
     * @param loginUser
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，500：服务器错误
     * album - album对象
     */
    public Map<String, Object> createAlbum(Album album, User loginUser);

    /**
     * 只查找相册的信息
     *
     * @param album
     * @param loginUser
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到
     * album - album对象, 没有photos
     */
    public Map<String, Object> findAlbumInfo(Album album, User loginUser);

    /**
     * 查找出该相册的信息和图片列表
     *
     * @param album
     * @param loginUser
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册未找到
     * album - album对象
     */
    public Map<String, Object> findAlbumWithPhotos(Album album, User loginUser);

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
    public Map<String, Object> findAlbumWithPhotos(Album album, boolean mount, User loginUser);

    /**
     * 查找相册列表
     *
     * @param album
     * @param loginUser
     * @return list
     */
    public List<Album> findAlbumList(Album album, User loginUser);

    /**
     * 更新相册
     *
     * @param album
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到，500：服务器错误
     * album - 更新后的album
     */
    public Map<String, Object> updateAlbum(Album album, User loginUser);

    /**
     * 删除相册
     *
     * @param album
     * @param loginUser
     * @param deleteFromDisk
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到，500：服务器错误
     */
    public int deleteAlbum(Album album, User loginUser, boolean deleteFromDisk);

    /**
     * 保存图片
     *
     * @param file
     * @param photo
     * @param loginUser
     * @return map
     * flag - 200：成功，401：需要登录，403：没有权限，404: 相册未找到, 500: 服务器错误
     * photo - photo对象
     */
    public Map<String, Object> savePhoto(MultipartFile file, Photo photo, User loginUser);

    /**
     * 查找照片
     *
     * @param photo
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，403：没有权限，404: 照片未找到
     */
    public Map<String, Object> findPhoto(Photo photo, User loginUser);

    /**
     * 更新照片
     *
     * @param photo
     * @param file      可选，有则更新
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，403：没有权限，404: 照片未找到，500：服务器错误
     * photo - 更新后的photo
     */
    public Map<String, Object> updatePhoto(Photo photo, MultipartFile file, User loginUser);

    /**
     * 删除照片
     *
     * @param photo
     * @param loginUser
     * @param deleteFromDisk 是否从服务器磁盘删除此照片
     * @return flag - 200：成功，401：需要登录，403：没有权限，404: 照片未找到，500：服务器错误
     */
    public int deletePhoto(Photo photo, User loginUser, boolean deleteFromDisk);

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
    public List<Photo> findPhotoList(Photo photo, String logic_conn, int start, int size, User loginUser);

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
    public List<Photo> findPhotoList(String base, Photo photo, String logic_conn, int start, int size, User loginUser);

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
    public List<Photo> findPhotoList(String base, Photo photo, String logic_conn, int start, int size, User loginUser, boolean extend);

    /**
     * 点击量加1
     *
     * @param photo
     * @return
     */
    public int raisePhotoClickCount(Photo photo);

    /**
     * 查询出用户设置的特殊标签
     *
     * @param tagWrapper
     * @param loginUser
     * @return
     */
    public List<PhotoTagWrapper> findPhotoTagWrappers(PhotoTagWrapper tagWrapper, User loginUser);


    /**
     * 保存相册与照片关联类
     *
     * @param apr
     * @return
     */
    public int saveAlbumPhotoRelation(AlbumPhotoRelation apr, User loginUser);

    /**
     * 删除相册与照片关联类
     *
     * @param apr
     * @return
     */
    public int deleteAlbumPhotoRelation(AlbumPhotoRelation apr, User loginUser);

}
