package site.imcoder.blog.service;

import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.entity.Album;
import site.imcoder.blog.entity.AlbumPhotoRelation;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.PhotoTagWrapper;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

/**
 * 相册服务实现类
 *
 * @author dengchao
 * @date 2018/1/3.
 */
public interface IAlbumService {

    /**
     * 得到照片上传配置信息
     *
     * @param iRequest
     * @return
     */
    public IResponse getUploadConfigInfo(IRequest iRequest);

    /**
     * 创建相册
     *
     * @param album
     * @param iRequest
     * @return map
     * status - 200：成功，400: 参数错误，401：需要登录，500：服务器错误
     * album - album对象
     */
    public IResponse createAlbum(Album album, IRequest iRequest);

    /**
     * 只查找相册的信息
     *
     * @param album
     * @param iRequest
     * @return ResponseEntity
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到
     * album - album对象, 没有photos
     */
    public IResponse findAlbumInfo(Album album, IRequest iRequest);

    /**
     * 查找出该相册的信息和图片列表
     *
     * @param album
     * @param iRequest attr:
     *                 mount - 是否加载挂载在此相册的照片
     * @return ResponseEntity
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册未找到
     * album - album对象 with photos
     * cloud_photo_preview_args -
     */
    public IResponse findAlbumWithPhotos(Album album, IRequest iRequest);

    /**
     * 查找相册列表
     *
     * @param album
     * @param iRequest
     * @return IResponse:
     * albums -
     * cloud_photo_preview_args -
     */
    public IResponse findAlbumList(Album album, IRequest iRequest);

    /**
     * 更新相册
     *
     * @param album
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到，500：服务器错误
     * album - 更新后的album
     */
    public IResponse updateAlbum(Album album, IRequest iRequest);

    /**
     * 删除相册
     *
     * @param album    相册ID，相册名
     * @param iRequest attr:
     *                 <p>{Boolean} deleteFromDisk - 是否从磁盘删除文件</p>
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到，500：服务器错误
     */
    public IResponse deleteAlbum(Album album, IRequest iRequest);

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
    public IResponse savePhoto(MultipartFile file, Photo photo, IRequest iRequest);

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
    public IResponse findPhoto(Photo photo, IRequest iRequest);

    /**
     * 删除照片
     *
     * @param photo
     * @param iRequest attr:
     *                 <p>{Boolean} deleteFromDisk - 是否从服务器磁盘删除此照片</p>
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到，500：服务器错误
     */
    public IResponse deletePhoto(Photo photo, IRequest iRequest);

    /**
     * 更新照片
     *
     * @param photo
     * @param file     可选，有则更新
     * @param iRequest
     * @flag ResponseEntity:
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到，500：服务器错误
     * photo - 更新后的photo
     */
    public IResponse updatePhoto(Photo photo, MultipartFile file, IRequest iRequest);

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
    public IResponse batchReplacePhotoTag(Photo queryPhoto, String replacedTag, String newTag, IRequest iRequest);

    /**
     * 批量替换照片标签
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
    public IResponse batchSetPhotoTag(Photo queryPhoto, String addTag, IRequest iRequest);

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
    public IResponse findPhotoList(Photo photo, String logic_conn, int start, int size, IRequest iRequest);

    /**
     * 点赞照片
     *
     * @param photo    - 只需传video_id
     * @param undo     - 是否取消赞
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    public IResponse likePhoto(Photo photo, boolean undo, IRequest iRequest);

    /**
     * 查询出用户设置的特殊标签
     *
     * @param tagWrapper
     * @param iRequest
     * @return IResponse:
     * tagWrappers
     */
    public IResponse findPhotoTagWrappers(PhotoTagWrapper tagWrapper, IRequest iRequest);

    /**
     * 依据照片对象的tags查询出用户设置的特殊标签
     *
     * @param photo
     * @param iRequest
     * @return IResponse:
     * tagWrappers
     * topicTagWrappers
     */
    public IResponse findPhotoTagWrappers(Photo photo, IRequest iRequest);

    /**
     * 查找一个照片中的tags匹配的由用户设置的特殊配置标签
     *
     * @param tagWrapper 需要ptwid或name
     * @param iRequest
     * @return IResponse:
     * tagWrapper -
     */
    public IResponse findPhotoTagWrapper(PhotoTagWrapper tagWrapper, IRequest iRequest);

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
    public IResponse savePhotoTagWrapper(PhotoTagWrapper tagWrapper, IRequest iRequest);

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
    public IResponse updatePhotoTagWrapper(PhotoTagWrapper tagWrapper, IRequest iRequest);

    /**
     * 删除PhotoTagWrapper
     *
     * @param tagWrapper
     * @param iRequest
     * @return IResponse:
     */
    public IResponse deletePhotoTagWrapper(PhotoTagWrapper tagWrapper, IRequest iRequest);

    /**
     * 保存相册与照片关联类
     *
     * @param apr
     * @param iRequest
     * @return IResponse:
     * apr -
     */
    public IResponse saveAlbumPhotoRelation(AlbumPhotoRelation apr, IRequest iRequest);

    /**
     * 删除相册与照片关联类
     *
     * @param albumPhotoRelation
     * @param iRequest
     * @return
     */
    public IResponse deleteAlbumPhotoRelation(AlbumPhotoRelation albumPhotoRelation, IRequest iRequest);

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
    public IResponse findPhotoActionRecordList(Photo photo, IRequest iRequest);

}
