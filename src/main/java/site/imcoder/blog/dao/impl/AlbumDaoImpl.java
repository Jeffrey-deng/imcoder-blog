package site.imcoder.blog.dao.impl;

import org.apache.ibatis.session.SqlSession;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.TagWrapperType;
import site.imcoder.blog.dao.CommonDao;
import site.imcoder.blog.dao.IAlbumDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import java.util.*;

/**
 * Created by Jeffrey.Deng on 2018/1/5.
 * 相册持久化层实现类
 */
@Repository("albumDao")
public class AlbumDaoImpl extends CommonDao implements IAlbumDao {

    private static Logger logger = Logger.getLogger(AlbumDaoImpl.class);

    public final static String regex_filed_photo_tags = "tags"; // 支持正则表达式的字段

    public final static String regex_filed_album_name = "name";

    private final static String MOUNT_PREFIX = "mount@";

    /**
     * 保存相册
     *
     * @param album
     * @return
     */
    @Override
    public int saveAlbum(Album album) {
        try {
            return this.getSqlSession().insert("album.saveAlbum", album);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveAlbum fail", e);
            return -1;
        }
    }

    /**
     * 查找相册
     *
     * @param album
     * @return
     */
    @Override
    public Album findAlbumInfo(Album album) {
        return this.getSqlSession().selectOne("album.findAlbumInfo", album);
    }

    /**
     * 查找相册列表
     *
     * @param album
     * @param loginUser
     * @return
     */
    @Override
    public List<Album> findAlbumInfoList(Album album, User loginUser) {
        try {
            String name = null;
            if (album != null) {
                name = album.getName();
                if (album.getName() != null && album.getName().length() != 0) {
                    album.setName(encodeRegexField("a.name", name, false));
                }
            }
            Map<String, Object> map = new HashMap<>();
            map.put("album", album);
            map.put("loginUser", loginUser);
            map.put("feed_flow_allow_following_show", Config.getBoolean(ConfigConstants.FEED_FLOW_ALLOW_FOLLOWING_SHOW));
            map.put("feed_flow_allow_show_lowest_level", Config.getInt(ConfigConstants.FEED_FLOW_ALLOW_SHOW_LOWEST_LEVEL));
            List<Album> list = this.getSqlSession().selectList("album.findAlbumInfoList", map);
            if (album != null) {
                album.setName(name);
            }
            return list;
        } catch (Exception e) {
            logger.warn("findAlbumInfoList fail", e);
            return null;
        }
    }

    /**
     * 更新相册信息
     *
     * @param album
     * @return
     */
    @Override
    public int updateAlbum(Album album) {
        try {
            return this.getSqlSession().update("album.updateAlbum", album);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateAlbum fail", e);
            return -1;
        }
    }

    /**
     * 更新相册封面
     *
     * @param album
     * @return
     */
    public int updateCoverForAlbum(Album album) {
        try {
            SqlSession session = this.getSqlSession();
            return session.update("album.updateCoverForAlbum", album);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateCoverForAlbum fail", e);
            return -1;
        }
    }

    /**
     * 删除相册
     *
     * @param album
     * @return
     */
    @Override
    public int deleteAlbum(Album album) {
        try {
            SqlSession session = this.getSqlSession();
            // 注意顺序
            // 删除该相册的AlbumPhotoRelation表行
            session.delete("album.deleteAlbumPhotoRelationsByAlbum", album.getAlbum_id());
            // 删除该相册内，照片关联其他相册的AlbumPhotoRelation表行
            if (album.getPhotos() == null) {
                album.setPhotos(findPhotosFromAlbum(album));
            }
            if (album.getPhotos() != null) {
                List<AlbumPhotoRelation> aprs = findAlbumPhotoRelationList(null);
                if (aprs != null && aprs.size() > 0) {
                    Set<Long> set = new HashSet<>();
                    for (Photo photo : album.getPhotos()) {
                        for (AlbumPhotoRelation apr : aprs) {
                            if (apr.getPhoto_id().equals(photo.getPhoto_id())) {
                                set.add(apr.getPhoto_id());
                                break;
                            }
                        }
                    }
                    for (Long photo_id : set) {
                        session.delete("album.deleteAlbumPhotoRelationsByPhoto", photo_id);
                    }
                }
            }
            // 删除该相册内photo表行
            session.delete("album.deleteAlbumPhotos", album);
            return session.delete("album.deleteAlbum", album);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deleteAlbum fail", e);
            return -1;
        }
    }

    /**
     * 点击量加1
     *
     * @param album
     * @param step  - 步长，可为负数
     * @return
     */
    @Override
    public int updateAlbumClickCount(Album album, int step) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("album", album);
            map.put("step", step);
            return this.getSqlSession().update("album.updateAlbumClickCount", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.warn("updateAlbumClickCount fail", e);
            return -1;
        }
    }

    /**
     * 点赞量加1
     *
     * @param album
     * @param step  - 步长，可为负数
     * @return
     */
    @Override
    public int updateAlbumLikeCount(Album album, int step) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("album", album);
            map.put("step", step);
            return this.getSqlSession().update("album.updateAlbumLikeCount", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.warn("updateAlbumLikeCount fail", e);
            return -1;
        }
    }

    /**
     * 评论量加1
     *
     * @param album
     * @param step  - 步长，可为负数
     * @return
     */
    @Override
    public int updateAlbumCommentCount(Album album, int step) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("album", album);
            map.put("step", step);
            return this.getSqlSession().update("album.updateAlbumCommentCount", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.warn("updateAlbumCommentCount fail", e);
            return -1;
        }
    }

    /**
     * 插入照片
     *
     * @param photo
     * @return
     */
    @Override
    public int savePhoto(Photo photo) {
        try {
            return this.getSqlSession().insert("album.savePhoto", photo);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("savePhoto fail", e);
            return -1;
        }
    }

    /**
     * 删除照片
     *
     * @param photo
     * @return
     */
    @Override
    public int deletePhoto(Photo photo) {
        try {
            SqlSession session = this.getSqlSession();
            // 注意顺序
            session.update("album.clearCoverForAlbum", photo);
            session.delete("album.deleteAlbumPhotoRelationsByPhoto", photo.getPhoto_id());
            return session.delete("album.deletePhoto", photo);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deletePhoto fail", e);
            return -1;
        }
    }

    /**
     * 更新照片信息
     *
     * @param photo
     * @return
     */
    @Override
    public int updatePhoto(Photo photo) {
        try {
            return this.getSqlSession().update("album.updatePhoto", photo);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updatePhoto fail", e);
            return -1;
        }
    }

    /**
     * 批量替换照片标签
     *
     * @param base
     * @param queryPhoto  - 查询条件，必须包含uid，及有用条件
     * @param logic_conn  - 为 or 时，base值必须为user_photos
     * @param replacedTag - 被替换的标签
     * @param newTag      - 替换为的标签
     * @return
     */
    @Override
    public int batchReplacePhotoTag(String base, Photo queryPhoto, String logic_conn, String replacedTag, String newTag) {
        try {
            String tags = null;
            if (queryPhoto != null) {
                tags = queryPhoto.getTags();
                if (queryPhoto.getTags() != null && queryPhoto.getTags().length() != 0) {
                    queryPhoto.setTags(encodeRegexField("p.tags", tags));
                }
            }
            Map<String, Object> map = new HashMap<>();
            map.put("base", base);
            map.put("photo", queryPhoto);
            map.put("logic_conn", logic_conn);
            map.put("replacedTag", "#" + replacedTag + "#");
            if (Utils.isEmpty(newTag)) {
                map.put("newTag", "");
            } else {
                map.put("newTag", "#" + newTag + "#");
            }
            if ("album_detail".equals(base) && queryPhoto != null && IdUtil.containValue(queryPhoto.getAlbum_id())) {
                map.put("album_mount", "#" + MOUNT_PREFIX + IdUtil.convertToShortPrimaryKey(queryPhoto.getAlbum_id()) + "#");
            }
            int row = this.getSqlSession().update("album.batchReplacePhotoTag", map);
            if (queryPhoto != null) {
                queryPhoto.setTags(tags);
            }
            return row;
        } catch (Exception e) {
            logger.warn("batchReplacePhotoTag fail", e);
            return -1;
        }
    }

    /**
     * 为给定的照片数组批量替换标签
     *
     * @param user        照片的所有者必须指定
     * @param photoIds    - 需要修改的照片id集合
     * @param replacedTag - 被替换的标签
     * @param newTag      - 替换为的标签
     * @return
     */
    @Override
    public int batchReplacePhotoTag(User user, List<Long> photoIds, String replacedTag, String newTag) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("user", user);
            map.put("replacedTag", "#" + replacedTag + "#");
            if (Utils.isEmpty(newTag)) {
                map.put("newTag", "");
            } else {
                map.put("newTag", "#" + newTag + "#");
            }
            int row = 0;
            int i = 0;
            int batchSize = 50;
            List<Long> singlePhotoIds = new ArrayList<>();
            while (photoIds.size() - i >= batchSize) {
                singlePhotoIds.clear();
                for (int j = i, maxIndex = (i + batchSize); j < maxIndex; j++, i++) {
                    singlePhotoIds.add(photoIds.get(j));
                }
                map.put("photoIds", singlePhotoIds);
                int currRow = this.getSqlSession().update("album.batchReplacePhotoTagFromArray", map);
                if (currRow > 0) {
                    row += currRow;
                }
            }
            singlePhotoIds.clear();
            for (int j = i, maxIndex = photoIds.size(); j < maxIndex; j++) {
                singlePhotoIds.add(photoIds.get(j));
            }
            map.put("photoIds", singlePhotoIds);
            int currRow = this.getSqlSession().update("album.batchReplacePhotoTagFromArray", map);
            if (currRow > 0) {
                row += currRow;
            }
            return row;
        } catch (Exception e) {
            logger.warn("batchReplacePhotoTagFromArray fail", e);
            return -1;
        }
    }

    /**
     * 批量添加照片标签
     *
     * @param base
     * @param queryPhoto - 查询条件，必须包含uid，及有用条件
     * @param logic_conn - 为 or 时，base值必须为user_photos
     * @param addTag     - 添加的标签
     * @return
     */
    @Override
    public int batchSetPhotoTag(String base, Photo queryPhoto, String logic_conn, String addTag) {
        try {
            String tags = null;
            if (queryPhoto != null) {
                tags = queryPhoto.getTags();
                if (queryPhoto.getTags() != null && queryPhoto.getTags().length() != 0) {
                    queryPhoto.setTags(encodeRegexField("p.tags", tags));
                }
            }
            Map<String, Object> map = new HashMap<>();
            map.put("base", base);
            map.put("photo", queryPhoto);
            map.put("logic_conn", logic_conn);
            map.put("addTag", "#" + addTag + "#");
            if ("album_detail".equals(base) && queryPhoto != null && IdUtil.containValue(queryPhoto.getAlbum_id())) {
                map.put("album_mount", "#" + MOUNT_PREFIX + IdUtil.convertToShortPrimaryKey(queryPhoto.getAlbum_id()) + "#");
            }
            int row = this.getSqlSession().update("album.batchSetPhotoTag", map);
            if (queryPhoto != null) {
                queryPhoto.setTags(tags);
            }
            return row;
        } catch (Exception e) {
            logger.warn("batchSetPhotoTag fail", e);
            return -1;
        }
    }

    /**
     * 为给定的照片数组批量添加标签
     *
     * @param user     照片的所有者必须指定
     * @param photoIds - 需要修改的照片id集合
     * @param addTag   - 添加的标签
     * @return
     */
    @Override
    public int batchSetPhotoTag(User user, List<Long> photoIds, String addTag) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("user", user);
            map.put("addTag", "#" + addTag + "#");
            int row = 0;
            int i = 0;
            int batchSize = 50;
            List<Long> singlePhotoIds = new ArrayList<>();
            while (photoIds.size() - i >= batchSize) {
                singlePhotoIds.clear();
                for (int j = i, maxIndex = (i + batchSize); j < maxIndex; j++, i++) {
                    singlePhotoIds.add(photoIds.get(j));
                }
                map.put("photoIds", singlePhotoIds);
                int currRow = this.getSqlSession().update("album.batchSetPhotoTagFromArray", map);
                if (currRow > 0) {
                    row += currRow;
                }
            }
            singlePhotoIds.clear();
            for (int j = i, maxIndex = photoIds.size(); j < maxIndex; j++) {
                singlePhotoIds.add(photoIds.get(j));
            }
            map.put("photoIds", singlePhotoIds);
            int currRow = this.getSqlSession().update("album.batchSetPhotoTagFromArray", map);
            if (currRow > 0) {
                row += currRow;
            }
            return row;
        } catch (Exception e) {
            logger.warn("batchSetPhotoTagFromArray fail", e);
            return -1;
        }
    }

    /**
     * 查找照片信息
     *
     * @param photo
     * @return
     */
    @Override
    public Photo findPhotoInfo(Photo photo) {
        return this.getSqlSession().selectOne("album.findPhotoInfo", photo);
    }

    /**
     * 查找一个相册下的照片集合
     *
     * @param album
     * @return
     */
    public List<Photo> findPhotosFromAlbum(Album album) {
        return this.getSqlSession().selectList("album.findPhotosFromAlbum", album);
    }

    /**
     * 查找照片集合
     *
     * @param base
     * @param photo
     * @param logic_conn
     * @param start
     * @param size
     * @param loginUser
     * @return photos
     */
    public List<Photo> findPhotoList(String base, Photo photo, String logic_conn, int start, int size, User loginUser) {
        try {
            String tags = null;
            if (photo != null) {
                tags = photo.getTags();
                if (photo.getTags() != null && photo.getTags().length() != 0) {
                    photo.setTags(encodeRegexField("p.tags", tags));
                }
            }
            Map<String, Object> map = new HashMap<>();
            map.put("photo", photo);
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
            if ("album_detail".equals(base) && photo != null && IdUtil.containValue(photo.getAlbum_id())) {
                map.put("album_mount", "#" + MOUNT_PREFIX + IdUtil.convertToShortPrimaryKey(photo.getAlbum_id()) + "#");
            }
            map.put("feed_flow_allow_following_show", Config.getBoolean(ConfigConstants.FEED_FLOW_ALLOW_FOLLOWING_SHOW));
            map.put("feed_flow_allow_show_lowest_level", Config.getInt(ConfigConstants.FEED_FLOW_ALLOW_SHOW_LOWEST_LEVEL));
            List<Photo> list = this.getSqlSession().selectList("album.findPhotoList", map);
            if (photo != null) {
                photo.setTags(tags);
            }
            return list;
        } catch (Exception e) {
            logger.warn("findPhotoList fail", e);
            return null;
        }
    }

    /**
     * 点击量加1
     *
     * @param photo
     * @param step  - 步长，可为负数
     * @return
     */
    @Override
    public int updatePhotoClickCount(Photo photo, int step) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("photo", photo);
            map.put("step", step);
            return this.getSqlSession().update("album.updatePhotoClickCount", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.warn("updatePhotoClickCount fail", e);
            return -1;
        }
    }

    /**
     * 点赞量加1
     *
     * @param photo
     * @param step  - 步长，可为负数
     * @return
     */
    @Override
    public int updatePhotoLikeCount(Photo photo, int step) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("photo", photo);
            map.put("step", step);
            return this.getSqlSession().update("album.updatePhotoLikeCount", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.warn("updatePhotoLikeCount fail", e);
            return -1;
        }
    }

    /**
     * 评论量加1
     *
     * @param photo
     * @param step  - 步长，可为负数
     * @return
     */
    @Override
    public int updatePhotoCommentCount(Photo photo, int step) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("photo", photo);
            map.put("step", step);
            return this.getSqlSession().update("album.updatePhotoCommentCount", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.warn("updatePhotoCommentCount fail", e);
            return -1;
        }
    }

    /**
     * 查询出用户设置的特殊标签列表
     *
     * @param tagWrapper
     * @param loginUser
     * @return
     */
    @Override
    public List<PhotoTagWrapper> findPhotoTagWrapperList(PhotoTagWrapper tagWrapper, User loginUser) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("wrapper", tagWrapper);
            map.put("loginUser", loginUser);
            map.put("wrapper_type_mark", TagWrapperType.MARK.value);
            map.put("wrapper_type_search", TagWrapperType.SEARCH.value);
            return this.getSqlSession().selectList("album.findPhotoTagWrapperList", map);
        } catch (Exception e) {
            logger.warn("findPhotoTagWrapperList fail", e);
            return null;
        }
    }

    /**
     * 查询出用户设置的特殊标签
     *
     * @param tagWrapper
     * @return
     */
    @Override
    public PhotoTagWrapper findPhotoTagWrapper(PhotoTagWrapper tagWrapper) {
        try {
            return this.getSqlSession().selectOne("album.findPhotoTagWrapper", tagWrapper);
        } catch (Exception e) {
            logger.warn("findPhotoTagWrapper fail", e);
            return null;
        }
    }

    /**
     * 插入PhotoTagWrapper
     *
     * @param tagWrapper
     * @return
     */
    @Override
    public int savePhotoTagWrapper(PhotoTagWrapper tagWrapper) {
        try {
            return this.getSqlSession().insert("album.savePhotoTagWrapper", tagWrapper);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("savePhotoTagWrapper fail", e);
            return -1;
        }
    }

    /**
     * 更新PhotoTagWrapper
     *
     * @param tagWrapper
     * @return
     */
    @Override
    public int updatePhotoTagWrapper(PhotoTagWrapper tagWrapper) {
        try {
            return this.getSqlSession().update("album.updatePhotoTagWrapper", tagWrapper);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updatePhotoTagWrapper fail", e);
            return -1;
        }
    }

    /**
     * 移除PhotoTagWrapper
     *
     * @param tagWrapper
     * @return
     */
    @Override
    public int deletePhotoTagWrapper(PhotoTagWrapper tagWrapper) {
        try {
            return this.getSqlSession().delete("album.savePhotoTagWrapper", tagWrapper);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deletePhotoTagWrapper fail", e);
            return -1;
        }
    }

    /**
     * 更新photoTagWrapper的scope值为album.album_id的行的permission为album值
     *
     * @param album
     * @return
     */
    @Override
    public int updatePhotoTagWrapperPermissionInScope(Album album) {
        try {
            return this.getSqlSession().delete("album.updatePhotoTagWrapperPermissionInScope", album);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updatePhotoTagWrapperPermissionInScope fail", e);
            return -1;
        }
    }

    /**
     * 将topicTagWrapper.name匹配到的photos，修改photo.topic为TagWrapper.ptwid
     *
     * @param tagWrapper            - 需包含uid
     * @param syncTopicToPhotosMode - 同步模式，0：对于photo.topic已有值的不覆盖，1：覆盖
     * @return
     */
    public int updatePhotoTopicRelation(PhotoTagWrapper tagWrapper, int syncTopicToPhotosMode) {
        try {
            if (tagWrapper.getType().equals(TagWrapperType.SEARCH.value)) {
                return -1;
            }
            Map<String, Object> map = new HashMap<>();
            map.put("wrapper", tagWrapper);
            map.put("syncTopicToPhotosMode", syncTopicToPhotosMode);
            return this.getSqlSession().update("album.updatePhotoTopicRelation", map);
        } catch (Exception e) {
            logger.warn("updatePhotoTopicRelation fail", e);
            return -1;
        }
    }

    /**
     * 查询一个相册的AlbumPhotoRelation类列表
     *
     * @param album
     * @return
     */
    @Override
    public List<AlbumPhotoRelation> findAlbumPhotoRelationList(Album album) {
        try {
            return this.getSqlSession().selectList("album.findAlbumPhotoRelationList", album);
        } catch (Exception e) {
            logger.warn("findAlbumPhotoRelationList fail", e);
            return null;
        }
    }

    /**
     * 只查询一对相册与照片关联类
     *
     * @param albumPhotoRelation
     * @return
     */
    @Override
    public AlbumPhotoRelation findAlbumPhotoRelation(AlbumPhotoRelation albumPhotoRelation) {
        try {
            return this.getSqlSession().selectOne("album.findAlbumPhotoRelation", albumPhotoRelation);
        } catch (Exception e) {
            logger.warn("findAlbumPhotoRelationList fail", e);
            return null;
        }
    }

    /**
     * 保存相册与照片关联类
     *
     * @param albumPhotoRelation
     * @return
     */
    @Override
    public int saveAlbumPhotoRelation(AlbumPhotoRelation albumPhotoRelation) {
        try {
            return this.getSqlSession().update("album.saveAlbumPhotoRelation", albumPhotoRelation);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveAlbumPhotoRelation fail", e);
            return -1;
        }
    }

    /**
     * 更新相册与照片关联类
     *
     * @param albumPhotoRelation
     * @return
     */
    @Override
    public int updateAlbumPhotoRelation(AlbumPhotoRelation albumPhotoRelation) {
        try {
            return this.getSqlSession().update("album.updateAlbumPhotoRelation", albumPhotoRelation);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateAlbumPhotoRelation fail", e);
            return -1;
        }
    }

    /**
     * 删除相册与照片关联类
     *
     * @param albumPhotoRelation
     * @return
     */
    @Override
    public int deleteAlbumPhotoRelation(AlbumPhotoRelation albumPhotoRelation) {
        try {
            return this.getSqlSession().update("album.deleteAlbumPhotoRelation", albumPhotoRelation);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deleteAlbumPhotoRelation fail", e);
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
