package site.imcoder.blog.controller.api;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.Interceptor.annotation.AccessRecord;
import site.imcoder.blog.Interceptor.annotation.GZIP;
import site.imcoder.blog.Interceptor.annotation.LoginRequired;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFill;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFillFormatter;
import site.imcoder.blog.controller.propertyeditors.converter.EscapeEmojiPropertyFieldConverter;
import site.imcoder.blog.controller.resolver.annotation.BindNullIfEmpty;
import site.imcoder.blog.entity.AccessDetail;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.Subtitle;
import site.imcoder.blog.entity.Video;
import site.imcoder.blog.entity.rewrite.VideoSetting;
import site.imcoder.blog.service.IAlbumService;
import site.imcoder.blog.service.IVideoService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.GlobalConstants;

import javax.annotation.Resource;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Locale;

/**
 * 视频控制器
 *
 * @author Jeffrey.Deng
 */
@Controller
@RequestMapping("/video.api")
public class VideoApiController extends BaseController {

    @Resource
    private IAlbumService albumService;

    @Resource
    private IVideoService videoService;

    /**
     * 得到视频上传配置信息
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
    @RequestMapping(params = "method=getUploadConfigInfo")
    @ResponseBody
    public IResponse getUploadConfigInfo(IRequest iRequest) {
        return videoService.getUploadConfigInfo(iRequest);
    }

    /**
     * 上传视频
     *
     * @param videoFile
     * @param coverFile
     * @param video
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 封面未找到, 500: 服务器错误
     * video - video对象
     */
    @LoginRequired
    @RequestMapping(params = "method=upload")
    @ResponseBody
    public IResponse uploadVideo(@RequestParam(value = "videoFile", required = false) MultipartFile videoFile,
                                 @RequestParam(value = "coverFile", required = false) MultipartFile coverFile,
                                 Video video, IRequest iRequest) {
        IResponse photoResp = null;
        if (iRequest.isHasLoggedIn() && coverFile == null && video != null && video.getCover() != null && IdUtil.containValue(video.getCover().getPhoto_id())) { //如果指定了已有的图片
            photoResp = albumService.findPhoto(video.getCover(), iRequest);
            if (photoResp.isSuccess() && !((Photo) photoResp.getAttr("photo")).getUid().equals(iRequest.getLoginUser().getUid())) {
                photoResp.setStatus(STATUS_FORBIDDEN, "此封面你没有权限使用~");
            }
        } else if (video != null) {
            Photo cover = video.getCover(); // fix 嵌套时PropertiesEditor失效 bug
            if (cover != null) {
                EscapeEmojiPropertyFieldConverter escapeEmojiConverter = EscapeEmojiPropertyFieldConverter.getInstance();
                cover.setName(escapeEmojiConverter.convert(cover.getName(), null, null));
                cover.setDescription(escapeEmojiConverter.convert(cover.getDescription(), null, null));
                cover.setOriginName(escapeEmojiConverter.convert(cover.getOriginName(), null, null));
            }
            photoResp = albumService.savePhoto(coverFile, video.getCover(), iRequest);
        } else {
            photoResp = new IResponse(STATUS_PARAM_ERROR, "提交参数错误");
        }
        if (photoResp.isSuccess() || (video != null && video.getVoice_message() == 1)) {
            video.setCover(photoResp.getAttr("photo"));
            return videoService.saveVideo(videoFile, video, iRequest);
        } else {
            return photoResp;
        }
    }

    /**
     * 视频详情
     *
     * @param video_id
     * @param iRequest
     * @return ResponseEntity
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 视频ID未找到
     * video - video
     */
    @RequestMapping(params = "method=getVideo")
    @ResponseBody
    public IResponse getVideo(@RequestParam(defaultValue = "0") @PrimaryKeyConvert Long video_id,
                              @RequestParam(defaultValue = "0") @PrimaryKeyConvert Long cover_id,
                              IRequest iRequest) {
        Video video = new Video(video_id);
        if (cover_id > 0) {
            Photo cover = new Photo(cover_id);
            video.setCover(cover);
        }
        return videoService.findVideo(video, iRequest);
    }

    /**
     * 查找视频集合
     *
     * @param video
     * @param logic_conn
     * @param query_start 正数代表正序(video_id从大到小)，从0开始；负数代表逆序(video_id从小到大)，从-1开始；包含起始
     * @param query_size  返回数量；0代表不限制数量；不传入则设置默认500
     * @param base        数据查询的特殊基准
     * @param from        实际的执行js请求的页面
     * @param iRequest
     * @return IResponse:
     * status - 200:成功，400：参数错误
     * videos -
     * cloud_photo_preview_args -
     */
    @RequestMapping(params = "method=getVideoList")
    @ResponseBody
    @GZIP
    public IResponse getVideoList(
            @BindNullIfEmpty Video video,
            @RequestParam(defaultValue = "and") String logic_conn,
            @RequestParam(defaultValue = "0") int query_start,
            @RequestParam(defaultValue = "500") int query_size,
            String base,    // 数据查询的特殊基准
            String from,    // 实际的执行js请求的页面
            IRequest iRequest
    ) {
        iRequest.putAttr("base", base);
        iRequest.putAttr("from", from);
        IResponse videoListResp = videoService.findVideoList(video, logic_conn, query_start, query_size, iRequest);
        return videoListResp;
    }

    /**
     * 视频列表详情通过封面id数组
     *
     * @param covers
     * @param iRequest
     * @return IResponse:
     * videos
     */
    @RequestMapping(params = "method=getVideoListByCovers")
    @ResponseBody
    public IResponse getVideoListByCovers(@RequestParam("covers") ArrayList<String> covers, IRequest iRequest) {
        ArrayList<Long> ids = new ArrayList<>();
        for (String cover : covers) {
            ids.add(IdUtil.convertToLongPrimaryKey(cover));
        }
        return videoService.findVideoListByCoverArray(ids, iRequest);
    }

    /**
     * 更新视频
     *
     * @param videoFile
     * @param coverFile
     * @param video
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 封面未找到, 500: 服务器错误
     * video - video对象
     */
    @LoginRequired
    @RequestMapping(params = "method=update")
    @ResponseBody
    public IResponse updateVideo(@RequestParam(value = "videoFile", required = false) MultipartFile videoFile,
                                 @RequestParam(value = "coverFile", required = false) MultipartFile coverFile,
                                 Video video, IRequest iRequest) {
        IResponse photoResp;
        if (iRequest.isHasLoggedIn() && coverFile == null && video != null && video.getCover() != null && IdUtil.containValue(video.getCover().getPhoto_id())) { //如果指定了已有的图片
            photoResp = albumService.findPhoto(video.getCover(), iRequest);
            if (photoResp.isSuccess() && !((Photo) photoResp.getAttr("photo")).getUid().equals(iRequest.getLoginUser().getUid())) {
                photoResp.setStatus(STATUS_FORBIDDEN, "此封面你没有权限使用~");
            }
        } else if (video != null) {
            photoResp = albumService.savePhoto(coverFile, video.getCover(), iRequest);
        } else {
            photoResp = new IResponse(STATUS_PARAM_ERROR, "提交参数错误");
        }
        if (photoResp.isSuccess() || (video != null && video.getVoice_message() == 1)) {
            video.setCover(photoResp.getAttr("photo"));
            return videoService.updateVideo(videoFile, video, iRequest);
        } else {
            return photoResp;
        }
    }

    /**
     * 上传字幕
     *
     * @param file
     * @param subtitle
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 视频不存在, 500: 服务器错误
     * subtitle - subtitle
     */
    @LoginRequired
    @RequestMapping(params = "method=uploadSubtitle")
    @ResponseBody
    public IResponse uploadSubtitle(@RequestParam(value = "file") MultipartFile file,
                                    Subtitle subtitle, IRequest iRequest) {
        return videoService.saveSubtitle(file, subtitle, iRequest);
    }

    /**
     * 点赞视频
     *
     * @param video    - 只需传video_id
     * @param undo     - true: 取消赞，false: 赞
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    @RequestMapping(params = "method=likeVideo")
    @ResponseBody
    public IResponse likeVideo(Video video, @RequestParam(defaultValue = "false") boolean undo, IRequest iRequest) {
        return videoService.likeVideo(video, undo, iRequest);
    }

    /**
     * 下载视频
     * @param video     - 只需传video_id
     * @param signature - 签名
     * @param expires
     * @param age
     * @param model
     * @param iRequest
     * @param guest_identifier
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    @RequestMapping(params = "method=downloadVideo")
    public String downloadVideo(Video video,
                                String signature,
                                String expires,
                                String age,
                                Model model,
                                IRequest iRequest, @CookieValue(value = "guest_identifier", required = false) Long guest_identifier) {
        IResponse response = new IResponse(STATUS_FORBIDDEN, "签名错误");
        String redirectUrl = "";
        boolean hasSignature = Utils.isNotEmpty(signature) || Utils.isNotEmpty(expires) || Utils.isNotEmpty(age);
        boolean legalSignature = Utils.isNotEmpty(signature) && Utils.isNotEmpty(expires) && Utils.isNotEmpty(age);
        boolean shouldCheckSetting = true;
        Long uid = iRequest.isHasLoggedIn() ? iRequest.getLoginUser().getUid() : guest_identifier;
        Long video_id = video.getVideo_id();
        if (IdUtil.containValue(uid) && IdUtil.containValue(video_id)) {
            if (hasSignature) {
                if (legalSignature) {
                    long sl = IdUtil.convert62radixIdToDecimal(signature);
                    long el = IdUtil.convert62radixIdToDecimal(expires);
                    long al = IdUtil.convert62radixIdToDecimal(age);
                    long t, et, allowAge, ca, now;
                    now = System.currentTimeMillis();
                    t = Math.abs(uid + sl);
                    et = Math.abs(video_id + el);
                    ca = et - t;
                    allowAge = al - Math.abs(video_id - uid);
                    if (ca >= 0 && et >= now && (allowAge == ca + 1 || allowAge == ca) && allowAge <= 28800000) {
                        shouldCheckSetting = al % 2 == 0;
                        response.setStatus(STATUS_SUCCESS);
                    }
                }
            } else {
                shouldCheckSetting = true;
                response.setStatus(STATUS_SUCCESS);
            }
        } else {
            response.setStatus(STATUS_PARAM_ERROR);
        }
        if (response.isSuccess()) {
            IResponse videoResp = videoService.findVideo(video, iRequest);
            response.setStatus(videoResp);
            if (response.isSuccess()) {
                Video db_video = videoResp.getAttr("video");
                if (db_video.getSource_type() != 2) {
                    boolean is_special_man = videoResp.getAttr("is_special_man");
                    if (shouldCheckSetting && !hasSignature && !is_special_man) {
                        response.setStatus(STATUS_FORBIDDEN, "签名错误");
                    } else if (!shouldCheckSetting || (!db_video.getSetting().getDisable_download() || is_special_man)) {
                        Field pathField = null;
                        try {
                            pathField = Video.class.getDeclaredField("path");
                        } catch (NoSuchFieldException e) {
                            e.printStackTrace();
                        }
                        URLPrefixFill annotation = pathField.getAnnotation(URLPrefixFill.class);
                        URLPrefixFillFormatter fillFormatter = new URLPrefixFillFormatter(annotation);
                        db_video.setPath(fillFormatter.print(db_video.getPath(), Locale.getDefault()));
                        redirectUrl = db_video.getPath();
                    } else {
                        response.setStatus(STATUS_FORBIDDEN, "此视频被设置为禁止下载").putAttr("forbidden_type", "setting_disable_download");
                    }
                } else {
                    response.setStatus(STATUS_PARAM_ERROR, "此视频为引用类型，不支持下载");
                }
            }
        }
        if (response.isFail()) {
            model.addAttribute(KEY_ERROR_INFO, response.getMessage());
        }
        return getViewPage(response, "redirect:" + redirectUrl);
    }

    /**
     * 更新视频设置
     *
     * @param video        - 只需传video_id
     * @param videoSetting - 设置videoSetting属性
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     * video - video
     */
    @RequestMapping(params = "method=updateVideoSetting")
    @ResponseBody
    public IResponse updateVideoSetting(Video video, @BindNullIfEmpty VideoSetting videoSetting, IRequest iRequest) {
        video.setSetting(videoSetting);
        return videoService.updateVideoSetting(video, iRequest);
    }

    /**
     * 查询视频的用户动作记录
     *
     * @param video
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * videoActionRecords
     * video_action_record_count
     */
    @LoginRequired
    @RequestMapping(params = "method=getVideoActionRecords")
    @ResponseBody
    @GZIP
    public IResponse getVideoActionRecords(Video video, IRequest iRequest) {
        return videoService.findVideoActionRecordList(video, iRequest);
    }

    /**
     * 手动触发保存视频的一次访问记录，以处理自动记录不能处理的情况
     *
     * @param accessDetail
     * @param video_id
     * @param cover_id
     * @param iRequest
     * @return ResponseEntity
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 视频ID未找到
     * video - video
     */
    @AccessRecord(type = AccessRecord.Types.VIDEO, key = "video", recordRewriteKey = "recordRewriteKey")
    @RequestMapping(params = "method=triggerVideoAccess")
    @ResponseBody
    public IResponse triggerVideoAccess(
            AccessDetail accessDetail,
            @RequestParam(defaultValue = "0") @PrimaryKeyConvert Long video_id,
            @RequestParam(defaultValue = "0") @PrimaryKeyConvert Long cover_id,
            IRequest iRequest) {
        Video video = new Video(video_id);
        if (cover_id > 0) {
            Photo cover = new Photo(cover_id);
            video.setCover(cover);
        }
        IResponse videoResp = videoService.findVideo(video, iRequest);
        if (videoResp.isSuccess()) {
            videoResp.setMessage("访问记录提交成功~");
            if (accessDetail != null) {
                videoResp.putAttr("recordRewriteKey", accessDetail);
            }
        }
        return videoResp;
    }

}
