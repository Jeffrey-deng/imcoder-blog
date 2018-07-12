package site.imcoder.blog.dao;

import site.imcoder.blog.entity.Video;

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
     * @param video 视频id
     * @return Video
     */
    public Video findVideo(Video video);

}
