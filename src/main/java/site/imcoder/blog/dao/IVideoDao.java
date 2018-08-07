package site.imcoder.blog.dao;

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
     * 查找视频
     *
     * @param covers 封面id集合
     * @return Video
     */
    public List<Video> findVideoListByCoverArray(List<Integer> covers, User loginUser);

}
