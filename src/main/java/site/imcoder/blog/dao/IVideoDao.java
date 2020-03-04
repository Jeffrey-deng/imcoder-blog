package site.imcoder.blog.dao;

import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.Subtitle;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.Video;

import java.util.List;

/**
 * Created by Jeffrey.Deng on 2018/7/15.
 */
public interface IVideoDao {

    /**
     * 插入视频
     *
     * @param video
     * @return
     */
    public int saveVideo(Video video);

    /**
     * 查找视频
     *
     * @param video 视频id，或者封面id
     * @return Video
     */
    public Video findVideo(Video video);

    /**
     * 查找视频集合
     *
     * @param base
     * @param video
     * @param logic_conn
     * @param start
     * @param size
     * @param loginUser
     * @return videos
     */
    public List<Video> findVideoList(String base, Video video, String logic_conn, int start, int size, User loginUser);

    /**
     * 查找视频通过封面photo_id集合
     *
     * @param covers 封面photo_id集合
     * @return Video
     */
    public List<Video> findVideoListByCoverArray(List<Long> covers, User loginUser);

    /**
     * 更新视频
     *
     * @param video
     * @return
     */
    public int updateVideo(Video video);

    /**
     * 点击量加1
     *
     * @param video
     * @param step  - 步长，可为负数
     * @return
     */
    public int updateVideoClickCount(Video video, int step);

    /**
     * 点赞量加1
     *
     * @param video
     * @param step  - 步长，可为负数
     * @return
     */
    public int updateVideoLikeCount(Video video, int step);

    /**
     * 评论量加1
     *
     * @param video
     * @param step  - 步长，可为负数
     * @return
     */
    public int updateVideoCommentCount(Video video, int step);

    /**
     * 更新封面图片的image_type
     *
     * @param cover
     * @return
     */
    public int updateCoverImageType(Photo cover);

    /**
     * 保存字幕对象
     *
     * @param subtitle
     * @return
     */
    public int saveSubtitle(Subtitle subtitle);

    /**
     * 查询字幕对象
     *
     * @param subtitle
     * @return
     */
    public Subtitle findSubtitle(Subtitle subtitle);

    /**
     * 更新字幕对象
     *
     * @param subtitle
     * @return
     */
    public int updateSubtitle(Subtitle subtitle);

    /**
     * 更新视频设置
     *
     * @param video
     * @return
     */
    public int updateVideoSetting(Video video);
}
