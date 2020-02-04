package site.imcoder.blog.dao.impl;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.dao.CommonDao;
import site.imcoder.blog.dao.IVideoDao;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.Subtitle;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.Video;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by Jeffrey.Deng on 2018/7/15.
 */
@Repository("videoDao")
public class VideoDaoImpl extends CommonDao implements IVideoDao {

    private static Logger logger = Logger.getLogger(VideoDaoImpl.class);

    private final static String MOUNT_PREFIX = "mount@";

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
     * 查找视频集合
     *
     * @param base
     * @param video
     * @param logic_conn
     * @param start
     * @param size
     * @param loginUser
     * @return photos
     */
    @Override
    public List<Video> findVideoList(String base, Video video, String logic_conn, int start, int size, User loginUser) {
        try {
            String tags = null;
            String name = null;
            if (video != null) {
                tags = video.getTags();
                name = video.getName();
                if (video.getTags() != null && video.getTags().length() != 0) {
                    video.setTags(encodeRegexField("v.tags", tags));
                }
                if (video.getName() != null && video.getName().length() != 0) {
                    video.setName(encodeRegexField("v.name", name, false));
                }
            }
            Map<String, Object> map = new HashMap<>();
            map.put("video", video);
            map.put("logic_conn", logic_conn);
            if (start >= 0) {
                map.put("start", start);
                map.put("order_type", "desc");
            } else {
                map.put("start", start * -1 - 1);
                map.put("order_type", "asc");
            }
            map.put("size", size);
            map.put("loginUser", loginUser);
            map.put("base", base);
            if ("album_detail".equals(base) && video != null && video.getCover() != null && IdUtil.containValue(video.getCover().getAlbum_id())) {
                map.put("album_mount", "#" + MOUNT_PREFIX + IdUtil.convertToShortPrimaryKey(video.getCover().getAlbum_id()) + "#");
            }
            map.put("feed_flow_allow_following_show", Config.getBoolean(ConfigConstants.FEED_FLOW_ALLOW_FOLLOWING_SHOW));
            map.put("feed_flow_allow_show_lowest_level", Config.getInt(ConfigConstants.FEED_FLOW_ALLOW_SHOW_LOWEST_LEVEL));
            List<Video> list = this.getSqlSession().selectList("video.findVideoList", map);
            if (video != null) {
                video.setTags(tags);
                video.setName(name);
            }
            return list;
        } catch (Exception e) {
            logger.warn("findVideoList fail", e);
            return null;
        }
    }

    /**
     * 查找视频
     *
     * @param covers 封面id集合
     * @return Video
     */
    @Override
    public List<Video> findVideoListByCoverArray(List<Long> covers, User loginUser) {
        HashMap<String, Object> map = new HashMap<>();
        map.put("loginUser", loginUser);
        map.put("coverList", covers);
        return this.getSqlSession().selectList("video.findVideoListByCoverIdArray", map);
    }

    /**
     * 更新视频
     *
     * @param video
     * @return
     */
    @Override
    public int updateVideo(Video video) {
        try {
            return this.getSqlSession().insert("video.updateVideo", video);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateVideo fail", e);
            return -1;
        }
    }

    /**
     * 点击量加1
     *
     * @param video
     * @param step  - 步长，可为负数
     * @return
     */
    @Override
    public int updateVideoClickCount(Video video, int step) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("video", video);
            map.put("step", step);
            return this.getSqlSession().update("video.updateVideoClickCount", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.warn("updateVideoClickCount fail", e);
            return -1;
        }
    }

    /**
     * 点赞量加1
     *
     * @param video
     * @param step  - 步长，可为负数
     * @return
     */
    @Override
    public int updateVideoLikeCount(Video video, int step) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("video", video);
            map.put("step", step);
            return this.getSqlSession().update("video.updateVideoLikeCount", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.warn("updateVideoLikeCount fail", e);
            return -1;
        }
    }

    /**
     * 评论量加1
     *
     * @param video
     * @param step  - 步长，可为负数
     * @return
     */
    @Override
    public int updateVideoCommentCount(Video video, int step) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("video", video);
            map.put("step", step);
            return this.getSqlSession().update("video.updateVideoCommentCount", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.warn("updateVideoCommentCount fail", e);
            return -1;
        }
    }

    /**
     * 更新封面图片的image_type
     *
     * @param cover
     * @return
     */
    @Override
    public int updateCoverImageType(Photo cover) {
        try {
            return this.getSqlSession().update("video.updateCoverImageType", cover);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.warn("updateCoverImageType fail", e);
            return -1;
        }
    }

    /**
     * 保存字幕对象
     *
     * @param subtitle
     * @return
     */
    @Override
    public int saveSubtitle(Subtitle subtitle) {
        try {
            return this.getSqlSession().insert("video.saveSubtitle", subtitle);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.warn("saveSubtitle fail", e);
            return -1;
        }
    }

    /**
     * 查询字幕对象
     *
     * @param subtitle
     * @return
     */
    @Override
    public Subtitle findSubtitle(Subtitle subtitle) {
        try {
            return this.getSqlSession().selectOne("video.findSubtitle", subtitle);
        } catch (Exception e) {
            logger.warn("findSubtitle fail", e);
            return null;
        }
    }

    /**
     * 更新字幕对象
     *
     * @param subtitle
     * @return
     */
    @Override
    public int updateSubtitle(Subtitle subtitle) {
        try {
            return this.getSqlSession().update("video.updateSubtitle", subtitle);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.warn("updateSubtitle fail", e);
            return -1;
        }
    }

    /**
     * 校正处理结果，可通过继承再调整结果值
     *
     * @param field
     * @param value
     * @return
     */
    @Override
    protected String reviseEncodeResult(String field, String value) {
        if (value != null && field != null && field.indexOf("tags") != -1) {
            return value.replace(regexp_word_boundary_left, "#").replace(regexp_word_boundary_right, "#");
        } else {
            return value;
        }
    }

}
