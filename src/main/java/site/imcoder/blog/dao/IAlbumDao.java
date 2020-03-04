package site.imcoder.blog.dao;

import site.imcoder.blog.entity.*;

import java.util.List;

/**
 * Created by Jeffrey.Deng on 2018/1/5.
 * 相册持久化层
 */
public interface IAlbumDao {

    /**
     * 保存相册
     *
     * @param album
     * @return
     */
    public int saveAlbum(Album album);

    /**
     * 查找相册
     *
     * @param album
     * @return
     */
    public Album findAlbumInfo(Album album);

    /**
     * 查找相册列表
     *
     * @param album
     * @param loginUser
     * @return
     */
    public List<Album> findAlbumInfoList(Album album, User loginUser);

    /**
     * 更新相册信息
     *
     * @param album
     * @return
     */
    public int updateAlbum(Album album);

    /**
     * 更新相册封面
     *
     * @param album
     * @return
     */
    public int updateCoverForAlbum(Album album);

    /**
     * 删除相册
     *
     * @param album
     * @return
     */
    public int deleteAlbum(Album album);

    /**
     * 点击量加1
     *
     * @param album
     * @param step  - 步长，可为负数
     * @return
     */
    public int updateAlbumClickCount(Album album, int step);


    /**
     * 点赞量加1
     *
     * @param album
     * @param step  - 步长，可为负数
     * @return
     */
    public int updateAlbumLikeCount(Album album, int step);

    /**
     * 评论量加1
     *
     * @param album
     * @param step  - 步长，可为负数
     * @return
     */
    public int updateAlbumCommentCount(Album album, int step);


    /**
     * 插入照片
     *
     * @param photo
     * @return
     */
    public int savePhoto(Photo photo);

    /**
     * 删除照片
     *
     * @param photo
     * @return
     */
    public int deletePhoto(Photo photo);

    /**
     * 更新照片信息
     *
     * @param photo
     * @return
     */
    public int updatePhoto(Photo photo);

    /**
     * 批量替换照片标签
     *
     * @param base
     * @param queryPhoto  - 查询条件，必须包含uid，及有用条件
     * @param logic_conn  - 为 or 时，base值必须为user_photos
     * @param replacedTag - 被替换的标签
     * @param newTag      - 替换为的标签
     * @return
     */
    public int batchReplacePhotoTag(String base, Photo queryPhoto, String logic_conn, String replacedTag, String newTag);

    /**
     * 为给定的照片数组批量替换标签
     *
     * @param user        照片的所有者必须指定
     * @param photoIds    - 需要修改的照片id集合
     * @param replacedTag - 被替换的标签
     * @param newTag      - 替换为的标签
     * @return
     */
    public int batchReplacePhotoTag(User user, List<Long> photoIds, String replacedTag, String newTag);

    /**
     * 批量添加照片标签
     *
     * @param base
     * @param queryPhoto - 查询条件，必须包含uid，及有用条件
     * @param logic_conn - 为 or 时，base值必须为user_photos
     * @param addTag     - 添加的标签
     * @return
     */
    public int batchSetPhotoTag(String base, Photo queryPhoto, String logic_conn, String addTag);

    /**
     * 为给定的照片数组批量添加标签
     *
     * @param user     照片的所有者必须指定
     * @param photoIds - 需要修改的照片id集合
     * @param addTag   - 添加的标签
     * @return
     */
    public int batchSetPhotoTag(User user, List<Long> photoIds, String addTag);

    /**
     * 查找照片信息
     *
     * @param photo
     * @return
     */
    public Photo findPhotoInfo(Photo photo);

    /**
     * 查找一个相册下的照片集合
     *
     * @param album
     * @return
     */
    public List<Photo> findPhotosFromAlbum(Album album);

    /**
     * 查找照片集合
     *
     * @param base
     * @param photo
     * @param logic_conn
     * @param start
     * @param size
     * @param loginUser
     * @return photos
     */
    public List<Photo> findPhotoList(String base, Photo photo, String logic_conn, int start, int size, User loginUser);

    /**
     * 点击量加1
     *
     * @param photo
     * @param step  - 步长，可为负数
     * @return
     */
    public int updatePhotoClickCount(Photo photo, int step);


    /**
     * 点赞量加1
     *
     * @param photo
     * @param step  - 步长，可为负数
     * @return
     */
    public int updatePhotoLikeCount(Photo photo, int step);

    /**
     * 评论量加1
     *
     * @param photo
     * @param step  - 步长，可为负数
     * @return
     */
    public int updatePhotoCommentCount(Photo photo, int step);

    /**
     * 查询出用户设置的特殊标签列表
     *
     * @param tagWrapper
     * @param loginUser
     * @return
     */
    public List<PhotoTagWrapper> findPhotoTagWrapperList(PhotoTagWrapper tagWrapper, User loginUser);

    /**
     * 查询出用户设置的特殊标签
     *
     * @param tagWrapper
     * @return
     */
    public PhotoTagWrapper findPhotoTagWrapper(PhotoTagWrapper tagWrapper);

    /**
     * 插入PhotoTagWrapper
     *
     * @param tagWrapper
     * @return
     */
    public int savePhotoTagWrapper(PhotoTagWrapper tagWrapper);

    /**
     * 更新PhotoTagWrapper
     *
     * @param tagWrapper
     * @return
     */
    public int updatePhotoTagWrapper(PhotoTagWrapper tagWrapper);

    /**
     * 移除PhotoTagWrapper
     *
     * @param tagWrapper
     * @return
     */
    public int deletePhotoTagWrapper(PhotoTagWrapper tagWrapper);

    /**
     * 更新photoTagWrapper的scope值为album.album_id的行的permission为album值
     *
     * @param album
     * @return
     */
    public int updatePhotoTagWrapperPermissionInScope(Album album);

    /**
     * 将topicTagWrapper.name匹配到的photos，修改photo.topic为TagWrapper.ptwid
     *
     * @param tagWrapper            - 需包含uid
     * @param syncTopicToPhotosMode - 同步模式，0：对于photo.topic已有值的不覆盖，1：覆盖
     * @return
     */
    public int updatePhotoTopicRelation(PhotoTagWrapper tagWrapper, int syncTopicToPhotosMode);

    /**
     * 查询一个相册的AlbumPhotoRelation类列表
     *
     * @param album
     * @return
     */
    public List<AlbumPhotoRelation> findAlbumPhotoRelationList(Album album);

    /**
     * 只查询一对相册与照片关联类
     *
     * @param albumPhotoRelation
     * @return
     */
    public AlbumPhotoRelation findAlbumPhotoRelation(AlbumPhotoRelation albumPhotoRelation);

    /**
     * 保存相册与照片关联类
     *
     * @param albumPhotoRelation
     * @return
     */
    public int saveAlbumPhotoRelation(AlbumPhotoRelation albumPhotoRelation);

    /**
     * 更新相册与照片关联类
     *
     * @param albumPhotoRelation
     * @return
     */
    public int updateAlbumPhotoRelation(AlbumPhotoRelation albumPhotoRelation);

    /**
     * 删除相册与照片关联类
     *
     * @param albumPhotoRelation
     * @return
     */
    public int deleteAlbumPhotoRelation(AlbumPhotoRelation albumPhotoRelation);

}
