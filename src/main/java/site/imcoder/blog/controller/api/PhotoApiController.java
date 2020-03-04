package site.imcoder.blog.controller.api;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.Interceptor.annotation.AccessRecord;
import site.imcoder.blog.Interceptor.annotation.GZIP;
import site.imcoder.blog.Interceptor.annotation.LoginRequired;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.PermissionType;
import site.imcoder.blog.common.type.TagWrapperType;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFill;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFillFormatter;
import site.imcoder.blog.controller.resolver.annotation.BindNullIfEmpty;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.service.IAlbumService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import javax.annotation.Resource;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Locale;

/**
 * description: 相册控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/photo.api")
public class PhotoApiController extends BaseController {

    @Resource
    private IAlbumService albumService;

    @Resource
    private IUserService userService;

    /**
     * 得到照片上传配置信息
     *
     * @param iRequest
     * @return
     */
    @RequestMapping(params = "method=getUploadConfigInfo")
    @ResponseBody
    public IResponse getUploadConfigInfo(IRequest iRequest) {
        return albumService.getUploadConfigInfo(iRequest);
    }

    /**
     * 创建新相册
     *
     * @param album
     * @param iRequest
     * @return map
     * status - 200：成功，400: 参数错误，401：需要登录，500：服务器错误
     * album - album对象
     */
    @LoginRequired
    @RequestMapping(params = "method=createAlbum")
    @ResponseBody
    public IResponse createAlbum(Album album, IRequest iRequest) {
        return albumService.createAlbum(album, iRequest);
    }

    /**
     * 打开相册详情
     *
     * @param id       相册ID
     * @param photos   是否加载照片列表
     * @param mount    是否加载挂载到本相册的照片
     * @param iRequest
     * @return status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册未找到
     * album - album对象
     * cloud_photo_preview_args -
     */
    @RequestMapping(params = "method=getAlbum")
    @ResponseBody
    @GZIP
    public IResponse getAlbum(
            @RequestParam(defaultValue = "0") @PrimaryKeyConvert Long id,
            @RequestParam(defaultValue = "true") boolean photos,
            @RequestParam(defaultValue = "false") boolean mount,
            IRequest iRequest) {
        Album album = new Album(id);
        iRequest.putAttr("mount", mount);
        IResponse response = null;
        if (photos) {
            response = albumService.findAlbumWithPhotos(album, iRequest);
        } else {
            response = albumService.findAlbumInfo(album, iRequest);
        }
        return response;
    }

    /**
     * 打开相册列表
     *
     * @param album
     * @param iRequest
     * @return IResponse:
     * albums -
     * cloud_photo_preview_args -
     */
    @RequestMapping(params = "method=getAlbumList")
    @ResponseBody
    public IResponse getAlbumList(@BindNullIfEmpty Album album, IRequest iRequest) {
        return albumService.findAlbumList(album, iRequest);
    }

    /**
     * 相册信息更新
     *
     * @param album
     * @param iRequest
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到，500：服务器错误
     */
    @LoginRequired
    @RequestMapping(params = "method=updateAlbum")
    @ResponseBody
    public IResponse updateAlbum(Album album, IRequest iRequest) {
        return albumService.updateAlbum(album, iRequest);
    }

    /**
     * 点赞相册
     *
     * @param album    - 只需传album_id
     * @param undo     - true: 取消赞，false: 赞
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    @RequestMapping(params = "method=likeAlbum")
    @ResponseBody
    public IResponse likeAlbum(Album album, @RequestParam(defaultValue = "false") boolean undo, IRequest iRequest) {
        return albumService.likeAlbum(album, undo, iRequest);
    }

    /**
     * 删除相册
     *
     * @param album
     * @param deleteFromDisk - 是否从磁盘删除文件
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到，500：服务器错误
     */
    @LoginRequired
    @RequestMapping(params = "method=deleteAlbum")
    @ResponseBody
    public IResponse deleteAlbum(Album album, Boolean deleteFromDisk, IRequest iRequest) {
        iRequest.putAttr("deleteFromDisk", deleteFromDisk);
        return albumService.deleteAlbum(album, iRequest);
    }

    /**
     * 上传照片
     *
     * @param file
     * @param photo
     * @param iRequest
     * @return ResponseEntity
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册未找到, 500: 服务器错误
     * photo - photo对象
     */
    @LoginRequired
    @RequestMapping(params = "method=upload")
    @ResponseBody
    public IResponse uploadPhoto(@RequestParam(value = "file") MultipartFile file, Photo photo, IRequest iRequest) {
        return albumService.savePhoto(file, photo, iRequest);
    }

    /**
     * 照片详情
     *
     * @param id
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
    @RequestMapping(params = "method=getPhoto")
    @ResponseBody
    public IResponse getPhoto(
            @RequestParam(defaultValue = "0") @PrimaryKeyConvert Long id,
            @RequestParam(defaultValue = "false") boolean loadAlbum,
            @RequestParam(defaultValue = "false") boolean loadUser,
            @RequestParam(defaultValue = "false") boolean loadTopic,
            @RequestParam(defaultValue = "false") boolean loadVideo,
            IRequest iRequest) {
        iRequest.putAttr("loadAlbum", loadAlbum);
        iRequest.putAttr("loadUser", loadUser);
        iRequest.putAttr("loadTopic", loadTopic);
        iRequest.putAttr("loadVideo", loadVideo);
        return albumService.findPhoto(new Photo(id), iRequest);
    }

    /**
     * 查找照片集合
     *
     * @param photo
     * @param logic_conn  逻辑连接符 "and" 或 "or"
     * @param query_start 正数代表正序(photo_id从大到小)，从0开始；负数代表逆序(photo_id从小到大)，从-1开始；包含起始
     * @param query_size  返回数量；0代表不限制数量；不传入则设置默认500
     * @param base        数据查询的特殊基准
     * @param from        实际的执行js请求的页面
     * @param extend      查询的标签是否将其展开查询
     * @param iRequest
     * @return IResponse:
     * status - 200:成功，400：参数错误
     * photos -
     * cloud_photo_preview_args -
     */
    @RequestMapping(params = "method=getPhotoList")
    @ResponseBody
    @GZIP
    public IResponse getPhotoList(
            @BindNullIfEmpty Photo photo,
            @RequestParam(defaultValue = "and") String logic_conn,
            @RequestParam(defaultValue = "0") int query_start,
            @RequestParam(defaultValue = "500") int query_size,
            String base,    // 数据查询的特殊基准
            String from,    // 实际的执行js请求的页面
            @RequestParam(defaultValue = "false") boolean extend,
            IRequest iRequest
    ) {
        iRequest.putAttr("base", base);
        iRequest.putAttr("extend", extend);
        iRequest.putAttr("from", from);
        IResponse photoListResp = albumService.findPhotoList(photo, logic_conn, query_start, query_size, iRequest);
        if (photoListResp.isSuccess() && extend && from != null && from.equals("album_tags_square")) {
            // 来自标签广场的请求且extend=true的话，返回用户的标签设置
            PhotoTagWrapper queryTagWrapper = new PhotoTagWrapper();
            queryTagWrapper.setType(TagWrapperType.SEARCH.value);
            if (photo != null && IdUtil.containValue(photo.getUid())) {
                queryTagWrapper.setUid(photo.getUid());
            }
            photoListResp.putAttr("tagWrappers", albumService.findPhotoTagWrapperList(queryTagWrapper, iRequest).getAttr("tagWrappers"));
        }
        return photoListResp;
    }

    /**
     * 照片更新
     *
     * @param photo
     * @param iRequest
     * @flag ResponseEntity:
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到，500：服务器错误
     * photo - 更新后的photo
     */
    @LoginRequired
    @RequestMapping(params = "method=update")
    @ResponseBody
    public IResponse updatePhoto(Photo photo, @RequestParam(value = "file", required = false) MultipartFile file, IRequest iRequest) {
        return albumService.updatePhoto(photo, file, iRequest);
    }

    /**
     * 批量替换照片标签
     *
     * @param photo
     * @param logic_conn  逻辑连接符 "and" 或 "or"
     * @param base        数据查询的特殊基准
     * @param from        实际的执行js请求的页面
     * @param extend      查询的标签是否将其展开查询
     * @param replacedTag 被替换的标签
     * @param newTag      替换为的标签
     * @param iRequest
     * @return IResponse:
     * status - 200:成功，400：参数错误
     * photos -
     * cloud_photo_preview_args -
     */
    @LoginRequired
    @RequestMapping(params = "method=batchReplacePhotoTag")
    @ResponseBody
    public IResponse batchReplacePhotoTag(
            @BindNullIfEmpty Photo photo,
            @RequestParam(defaultValue = "and") String logic_conn,
            String base,    // 数据查询的特殊基准
            String from,    // 实际的执行js请求的页面
            @RequestParam(defaultValue = "false") boolean extend,
            @RequestParam(value = "photoIds", required = false) ArrayList<String> photoShortIds,
            String replacedTag,
            String newTag,
            IRequest iRequest
    ) {
        iRequest.putAttr("base", base);
        iRequest.putAttr("logic_conn", logic_conn);
        iRequest.putAttr("extend", extend);
        iRequest.putAttr("from", from);
        ArrayList<Long> photoIds = null;
        if (photoShortIds != null) {
            photoIds = new ArrayList<>();
            for (String photoShortId : photoShortIds) {
                photoIds.add(IdUtil.convertToLongPrimaryKey(photoShortId));
            }
        }
        iRequest.putAttr("photoIds", photoIds);
        IResponse replaceResp = albumService.batchReplacePhotoTag(photo, replacedTag, newTag, iRequest);
        return replaceResp;
    }

    /**
     * 批量添加照片标签
     *
     * @param photo
     * @param logic_conn 逻辑连接符 "and" 或 "or"
     * @param base       数据查询的特殊基准
     * @param from       实际的执行js请求的页面
     * @param extend     查询的标签是否将其展开查询
     * @param addTag     添加的标签
     * @param iRequest
     * @return IResponse:
     * status - 200:成功，400：参数错误
     * photos -
     * cloud_photo_preview_args -
     */
    @LoginRequired
    @RequestMapping(params = "method=batchSetPhotoTag")
    @ResponseBody
    public IResponse batchSetPhotoTag(
            @BindNullIfEmpty Photo photo,
            @RequestParam(defaultValue = "and") String logic_conn,
            String base,    // 数据查询的特殊基准
            String from,    // 实际的执行js请求的页面
            @RequestParam(defaultValue = "false") boolean extend,
            @RequestParam(value = "photoIds", required = false) ArrayList<String> photoShortIds,
            String addTag,
            IRequest iRequest
    ) {
        iRequest.putAttr("base", base);
        iRequest.putAttr("logic_conn", logic_conn);
        iRequest.putAttr("extend", extend);
        iRequest.putAttr("from", from);
        ArrayList<Long> photoIds = null;
        if (photoShortIds != null) {
            photoIds = new ArrayList<>();
            for (String photoShortId : photoShortIds) {
                photoIds.add(IdUtil.convertToLongPrimaryKey(photoShortId));
            }
        }
        iRequest.putAttr("photoIds", photoIds);
        IResponse replaceResp = albumService.batchSetPhotoTag(photo, addTag, iRequest);
        return replaceResp;
    }


    /**
     * 照片删除
     *
     * @param photo
     * @param deleteFromDisk - 是否从服务器磁盘删除此照片
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到，500：服务器错误
     */
    @LoginRequired
    @RequestMapping(params = "method=delete")
    @ResponseBody
    public IResponse deletePhoto(Photo photo, @RequestParam(defaultValue = "true") boolean deleteFromDisk, IRequest iRequest) {
        iRequest.putAttr("deleteFromDisk", deleteFromDisk);
        return albumService.deletePhoto(photo, iRequest);
    }

    /**
     * 点赞照片
     *
     * @param photo    - 只需传photo_id
     * @param undo     - true: 取消赞，false: 赞
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    @RequestMapping(params = "method=likePhoto")
    @ResponseBody
    public IResponse likePhoto(Photo photo, @RequestParam(defaultValue = "false") boolean undo, IRequest iRequest) {
        return albumService.likePhoto(photo, undo, iRequest);
    }

    /**
     * 下载照片
     *
     * @param photo    - 只需传photo_id
     * @param model
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    @RequestMapping(params = "method=downloadPhoto")
    public String downloadPhoto(Photo photo, Model model, IRequest iRequest) {
        IResponse photoResp = albumService.findPhoto(photo, iRequest);
        String redirectUrl = "";
        if (photoResp.isSuccess()) {
            Photo db_photo = photoResp.getAttr("photo");
            Field pathField = null;
            try {
                pathField = Photo.class.getDeclaredField("path");
            } catch (NoSuchFieldException e) {
                e.printStackTrace();
            }
            URLPrefixFill annotation = pathField.getAnnotation(URLPrefixFill.class);
            URLPrefixFillFormatter fillFormatter = new URLPrefixFillFormatter(annotation);
            db_photo.setPath(fillFormatter.print(db_photo.getPath(), Locale.getDefault()));
            redirectUrl = db_photo.getPath();
        }
        return getViewPage(photoResp, "redirect:" + redirectUrl);
    }

    /**
     * 查找用户特殊配置标签
     *
     * @param tagWrapper
     * @param iRequest
     * @return IResponse:
     * tagWrappers
     */
    @RequestMapping(params = "method=getTagWrapperList")
    @ResponseBody
    public IResponse getTagWrapperList(PhotoTagWrapper tagWrapper, IRequest iRequest) {
        return albumService.findPhotoTagWrapperList(tagWrapper, iRequest);
    }

    /**
     * 查找一个照片中的tags匹配的由用户设置的特殊配置标签
     *
     * @param photo
     * @param iRequest
     * @return IResponse:
     * tagWrappers
     * topicTagWrappers
     */
    @RequestMapping(params = "method=getTagWrapperListByPhoto")
    @ResponseBody
    public IResponse getTagWrapperListByPhoto(Photo photo, IRequest iRequest) {
        return albumService.findPhotoTagWrapperList(photo, iRequest);
    }

    /**
     * 查询PhotoTagWrapper
     *
     * @param tagWrapper
     * @param iRequest
     * @return IResponse:
     * tagWrapper
     */
    @RequestMapping(params = "method=getTagWrapper")
    @ResponseBody
    public IResponse getTagWrapper(PhotoTagWrapper tagWrapper, IRequest iRequest) {
        return albumService.findPhotoTagWrapper(tagWrapper, iRequest);
    }

    /**
     * 保存PhotoTagWrapper
     *
     * @param tagWrapper
     * @param iRequest
     * @return IResponse:
     * tagWrapper
     */
    @RequestMapping(params = "method=saveTagWrapper")
    @ResponseBody
    public IResponse saveTagWrapper(PhotoTagWrapper tagWrapper,
                                    @RequestParam(defaultValue = "false") boolean syncTopicToPhotos, // true: 将topicTagWrapper.name匹配到的photos，修改photo.topic为TagWrapper.ptwid
                                    @RequestParam(defaultValue = "0") Integer syncTopicToPhotosMode, // 同步模式，0：对于photo.topic已有值的不覆盖，1：覆盖
                                    IRequest iRequest) {
        iRequest.putAttr("syncTopicToPhotos", syncTopicToPhotos);
        iRequest.putAttr("syncTopicToPhotosMode", syncTopicToPhotosMode);
        return albumService.savePhotoTagWrapper(tagWrapper, iRequest);
    }

    /**
     * 更新PhotoTagWrapper
     *
     * @param tagWrapper
     * @param iRequest
     * @return IResponse:
     * tagWrapper
     */
    @LoginRequired
    @RequestMapping(params = "method=updateTagWrapper")
    @ResponseBody
    public IResponse updateTagWrapper(PhotoTagWrapper tagWrapper,
                                      @RequestParam(defaultValue = "false") boolean syncTopicToPhotos, // true: 将topicTagWrapper.name匹配到的photos，修改photo.topic为TagWrapper.ptwid
                                      @RequestParam(defaultValue = "0") Integer syncTopicToPhotosMode, // 同步模式，0：对于photo.topic已有值的不覆盖，1：覆盖
                                      IRequest iRequest) {
        iRequest.putAttr("syncTopicToPhotos", syncTopicToPhotos);
        iRequest.putAttr("syncTopicToPhotosMode", syncTopicToPhotosMode);
        return albumService.updatePhotoTagWrapper(tagWrapper, iRequest);
    }

    /**
     * 删除PhotoTagWrapper
     *
     * @param tagWrapper
     * @param iRequest
     * @return IResponse:
     */
    @LoginRequired
    @RequestMapping(params = "method=deleteTagWrapper")
    @ResponseBody
    public IResponse deleteTagWrapper(PhotoTagWrapper tagWrapper, IRequest iRequest) {
        return albumService.deletePhotoTagWrapper(tagWrapper, iRequest);
    }

    /**
     * 得到Topic PhotoTagWrapper，不存在便创建
     *
     * @param topic    - 查询时需要ptwid或name, 创建时需要name和scope，推荐三个一起来
     * @param iRequest
     * @return IResponse:
     * tagWrapper
     */
    @LoginRequired
    @RequestMapping(params = "method=getOrCreateTopic")
    @ResponseBody
    public IResponse getOrCreateTopic(PhotoTagWrapper topic, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        if (iRequest.isHasNotLoggedIn()) {
            return new IResponse(STATUS_NOT_LOGIN);
        } else if (topic == null || (!IdUtil.containValue(topic.getPtwid()) && Utils.isEmpty(topic.getName()))) {
            return new IResponse(STATUS_PARAM_ERROR);
        }
        topic.setUid(loginUser.getUid());
        topic.setTopic(null);
        topic.setType(TagWrapperType.MARK.value);
        IResponse queryResp = albumService.findPhotoTagWrapper(topic, iRequest);
        PhotoTagWrapper dbTagWrapper = queryResp.getAttr("tagWrapper");
        if (queryResp.isSuccess() && dbTagWrapper.getUid().equals(loginUser.getUid())) {
            boolean needUpdate = false;
            if (dbTagWrapper.getTopic() == 0) {
                dbTagWrapper.setTopic(1);
                needUpdate = true;
            }
            if (topic.getScope() != null && topic.getScope() > 0 && !topic.getScope().equals(dbTagWrapper.getScope())) {
                IResponse albumResp = albumService.findAlbumInfo(new Album(topic.getScope()), iRequest);
                if (albumResp.isSuccess()) {
                    Album album = albumResp.getAttr("album");
                    if (album.getUser().getUid().equals(loginUser.getUid())) {
                        if (!dbTagWrapper.getScope().equals(topic.getScope()) || !dbTagWrapper.getPermission().equals(album.getPermission())) {
                            dbTagWrapper.setScope(topic.getScope());
                            dbTagWrapper.setPermission(album.getPermission());
                            needUpdate = true;
                        }
                    } else {
                        return new IResponse(STATUS_FORBIDDEN).setMessage("该相册不属于你~");
                    }
                } else {
                    return albumResp;
                }
            } else if (topic.getScope() != null && topic.getScope().equals(0L)) {
                if (!dbTagWrapper.getScope().equals(0L)) {
                    dbTagWrapper.setScope(0L);
                    needUpdate = true;
                }
                if (topic.getPermission() != null && !topic.getPermission().equals(dbTagWrapper.getPermission())) {
                    dbTagWrapper.setPermission(topic.getPermission());
                    needUpdate = true;
                }
            }
            if (needUpdate) {
                albumService.updatePhotoTagWrapper(dbTagWrapper, iRequest);
            }
            return queryResp;
        } else if (Utils.isNotEmpty(topic.getName())) {
            topic.setUid(loginUser.getUid());
            topic.setType(TagWrapperType.MARK.value);
            topic.setTopic(1);
            topic.setMatch_mode(0);
            topic.setPattern(topic.getName());
            topic.setAction(0);
            topic.setExtra(0);
            topic.setWeight(0);
            if (topic.getDescription() == null) {
                topic.setDescription("");
            }
            if (topic.getScope() != null && topic.getScope() > 0) {
                IResponse albumResp = albumService.findAlbumInfo(new Album(topic.getScope()), iRequest);
                if (albumResp.isSuccess()) {
                    Album album = albumResp.getAttr("album");
                    if (album.getUser().getUid().equals(loginUser.getUid())) {
                        topic.setPermission(album.getPermission());
                        return albumService.savePhotoTagWrapper(topic, iRequest);
                    } else {
                        return new IResponse(STATUS_FORBIDDEN).setMessage("该相册不属于你~");
                    }
                } else {
                    return albumResp;
                }
            } else {
                if (topic.getScope() == null) {
                    topic.setScope(0L);
                }
                if (topic.getPermission() == null) {
                    topic.setPermission(PermissionType.NOT_PUBLIC.value);
                }
                return albumService.savePhotoTagWrapper(topic, iRequest);
            }
        } else {
            return new IResponse(STATUS_PARAM_ERROR);
        }
    }

    /**
     * 保存照片在相册内的排序
     *
     * @param apr
     * @param iRequest
     * @return IResponse:
     * apr -
     */
    @LoginRequired
    @RequestMapping(params = "method=saveAlbumPhotoRelation")
    @ResponseBody
    public IResponse saveAlbumPhotoRelation(AlbumPhotoRelation apr, IRequest iRequest) {
        return albumService.saveAlbumPhotoRelation(apr, iRequest);
    }

    /**
     * 查询照片的用户动作记录
     *
     * @param photo
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * photoActionRecords
     * photo_action_record_count
     */
    @LoginRequired
    @RequestMapping(params = "method=getPhotoActionRecords")
    @ResponseBody
    @GZIP
    public IResponse getPhotoActionRecords(Photo photo, IRequest iRequest) {
        return albumService.findPhotoActionRecordList(photo, iRequest);
    }

    /**
     * 查询相册的用户动作记录
     *
     * @param album
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * albumActionRecords
     * album_action_record_count
     */
    @LoginRequired
    @RequestMapping(params = "method=getAlbumActionRecords")
    @ResponseBody
    @GZIP
    public IResponse getAlbumActionRecords(Album album, IRequest iRequest) {
        return albumService.findAlbumActionRecordList(album, iRequest);
    }

    /**
     * 手动触发保存图片的一次访问记录，以处理自动记录不能处理的情况
     *
     * @param accessDetail
     * @param photo_id
     * @param iRequest
     * @return ResponseEntity
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 视频ID未找到
     * video - video
     */
    @AccessRecord(type = AccessRecord.Types.PHOTO, key = "photo")
    @RequestMapping(params = "method=triggerPhotoAccess")
    @ResponseBody
    public IResponse triggerPhotoAccess(
            AccessDetail accessDetail,
            @RequestParam(defaultValue = "0") @PrimaryKeyConvert Long photo_id,
            IRequest iRequest) {
        IResponse photoResp = albumService.findPhoto(new Photo(photo_id), iRequest);
        if (photoResp.isSuccess()) {
            photoResp.setMessage("访问记录提交成功~");
            if (accessDetail != null) {
                photoResp.putAttr(AccessRecord.DEFAULT_RECORD_REWRITE_KEY, accessDetail);
            }
        }
        return photoResp;
    }

}
