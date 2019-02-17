package site.imcoder.blog.service;

import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.Video;

import java.util.List;
import java.util.Map;

/**
 * 视频服务接口
 *
 * @author Jeffrey.Deng
 */
public interface IVideoService {

    /**
     * 得到上传配置信息
     *
     * @param loginUser
     * @return
     */
    public Map<String, Object> getUploadConfigInfo(User loginUser);

    /**
     * 保存上传的视频
     *
     * @param videoFile
     * @param video
     * @param loginUser
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 封面未找到, 500: 服务器错误
     * photo - photo对象
     */
    public Map<String, Object> saveVideo(MultipartFile videoFile, Video video, User loginUser);

    /**
     * 返回视频
     *
     * @param video     视频id，或者封面id
     * @param loginUser
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 视频ID未找到
     * video - video
     */
    public Map<String, Object> findVideo(Video video, User loginUser);

    /**
     * 通过封面列表返回视频列表
     *
     * @param covers
     * @param loginUser
     * @return videoList
     */
    public List<Video> findVideoListByCoverArray(List<Integer> covers, User loginUser);

    /**
     * 保存上传的视频
     *
     * @param videoFile
     * @param video
     * @param loginUser
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 封面未找到, 500: 服务器错误
     * photo - photo对象
     */
    public Map<String, Object> updateVideo(MultipartFile videoFile, Video video, User loginUser);

    /**
     * 点击量加1
     *
     * @param video
     * @return
     */
    public int raiseVideoClickCount(Video video);

}
