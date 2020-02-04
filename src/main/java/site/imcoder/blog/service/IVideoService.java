package site.imcoder.blog.service;

import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.entity.Subtitle;
import site.imcoder.blog.entity.Video;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import java.util.List;

/**
 * 视频服务接口
 *
 * @author Jeffrey.Deng
 */
public interface IVideoService {

    /**
     * 得到上传配置信息
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
    public IResponse getUploadConfigInfo(IRequest iRequest);

    /**
     * 保存上传的视频
     *
     * @param videoFile
     * @param video
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 封面未找到, 500: 服务器错误
     * video - video对象
     */
    public IResponse saveVideo(MultipartFile videoFile, Video video, IRequest iRequest);

    /**
     * 返回视频
     *
     * @param video    视频id，或者封面id
     * @param iRequest
     * @return ResponseEntity
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 视频ID未找到
     * video - video
     */
    public IResponse findVideo(Video video, IRequest iRequest);

    /**
     * 查找视频集合
     *
     * @param video
     * @param logic_conn 逻辑连接符 "and" 或 "or"
     * @param start      正数代表正序(video_id从大到小)，从0开始；负数代表逆序(video_id从小到大)，从-1开始；包含起始
     * @param size       返回数量，0代表不限制数量
     * @param iRequest   attr:
     *                   <p>{String} base - 在哪个基础之下查找</p>
     * @return IResponse:
     * status - 200:成功，400：参数错误
     * videos -
     * cloud_photo_preview_args -
     */
    public IResponse findVideoList(Video video, String logic_conn, int start, int size, IRequest iRequest);

    /**
     * 通过封面列表返回视频列表
     *
     * @param covers
     * @param iRequest
     * @return IResponse:
     * videos
     */
    public IResponse findVideoListByCoverArray(List<Long> covers, IRequest iRequest);

    /**
     * 保存上传的视频
     *
     * @param videoFile
     * @param video
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 封面未找到, 500: 服务器错误
     * video - video对象
     */
    public IResponse updateVideo(MultipartFile videoFile, Video video, IRequest iRequest);

    /**
     * 点赞视频
     *
     * @param video    - 只需传video_id
     * @param undo     - 是否取消赞
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    public IResponse likeVideo(Video video, boolean undo, IRequest iRequest);

    /**
     * 查询视频的历史用户动作记录
     *
     * @param video
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * videoActionRecords
     * video_action_record_count
     */
    public IResponse findVideoActionRecordList(Video video, IRequest iRequest);

    /**
     * 保存字幕对象
     *
     * @param file
     * @param subtitle
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * subtitle - subtitle
     */
    public IResponse saveSubtitle(MultipartFile file, Subtitle subtitle, IRequest iRequest);

}
