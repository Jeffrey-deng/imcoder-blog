package site.imcoder.blog.dao.impl;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import site.imcoder.blog.dao.CommonDao;
import site.imcoder.blog.dao.IVideoDao;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.Video;

import java.util.HashMap;
import java.util.List;

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
        try {
            return this.getSqlSession().insert("video.saveVideo", video);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveVideo fail", e);
            return -1;
        }
    }

    /**
     * 查找视频
     *
     * @param video 视频id，或者封面id
     * @return Video
     */
    @Override
    public Video findVideo(Video video) {
        return this.getSqlSession().selectOne("video.findVideoById", video);
    }

    /**
     * 查找视频
     *
     * @param covers 封面id集合
     * @return Video
     */
    @Override
    public List<Video> findVideoListByCoverArray(List<Integer> covers, User loginUser) {
        HashMap<String, Object> map = new HashMap<>();
        map.put("loginUser", loginUser);
        map.put("coverList", covers);
        return this.getSqlSession().selectList("video.findVideoListByCoverIdArray", map);
    }

}
