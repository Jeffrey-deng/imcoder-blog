package site.imcoder.blog.dao.impl;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Repository;
import site.imcoder.blog.dao.CommonDao;
import site.imcoder.blog.dao.IVideoDao;
import site.imcoder.blog.entity.Video;

/**
 * Created by Jeffrey.Deng on 2018/7/15.
 */
@Repository("videoDao")
public class VideoDaoImpl extends CommonDao implements IVideoDao {

    private static Logger logger = Logger.getLogger(VideoDaoImpl.class);

    /**
     * 插入视频
     *
     * @param video
     * @return
     */
    @Override
    public int saveVideo(Video video) {
        return 0;
    }

    /**
     * 查找视频
     *
     * @param video 视频id
     * @return Video
     */
    @Override
    public Video findVideo(Video video) {
        //return this.getSqlSession().selectOne("video.");
        return null;
    }

}
