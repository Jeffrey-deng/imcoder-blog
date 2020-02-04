package site.imcoder.blog.event.impl;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Component;
import site.imcoder.blog.Interceptor.annotation.AccessRecord;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.CommentType;
import site.imcoder.blog.dao.IAlbumDao;
import site.imcoder.blog.dao.IUserDao;
import site.imcoder.blog.dao.IVideoDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.event.IEventTrigger;

import javax.annotation.Resource;
import java.util.Date;

/**
 * 事件触发接口
 * 用来统一处理统计类的日志收集
 *
 * @author dengchao
 * @date 2017-3-22
 */
@Component("trigger")
public class EventTriggerImpl implements IEventTrigger {

    private static Logger logger = Logger.getLogger(EventTriggerImpl.class);

    @Resource
    Cache cache;

    @Resource
    private IUserDao userDao;

    @Resource
    private IAlbumDao albumDao;

    @Resource
    private IVideoDao videoDao;

    /**
     * 文章被浏览事件
     *
     * @param accessDetail
     * @param accessRecord
     */
    @Override
    public void accessArticle(AccessDetail accessDetail, AccessRecord accessRecord) {
        Long aid = accessDetail.getCreation_id();
        if (IdUtil.containValue(aid)) {
            Article article = new Article(aid);
            switch (accessRecord.action()) {
                case SAVE:
                    if (userDao.saveArticleAccessDetail(accessDetail) > 0) {
                        cache.updateArticleClickCount(article, 1);
                    }
                    break;
                case DELETE:
                    if (userDao.deleteArticleAccessDetail(accessDetail) > 0) {
                        cache.updateArticleClickCount(article, -1);
                    }
                    break;
            }
        }
    }

    /**
     * 视频被浏览事件
     *
     * @param accessDetail
     * @param accessRecord
     */
    @Override
    public void accessVideo(AccessDetail accessDetail, AccessRecord accessRecord) {
        Long video_id = accessDetail.getCreation_id();
        if (video_id != null) {
            Video video = new Video(video_id);
            switch (accessRecord.action()) {
                case SAVE:
                    if (userDao.saveVideoAccessDetail(accessDetail) > 0) {
                        videoDao.updateVideoClickCount(video, 1);
                    }
                    break;
                case DELETE:
                    if (userDao.deleteVideoAccessDetail(accessDetail) > 0) {
                        videoDao.updateVideoClickCount(video, -1);
                    }
                    break;
            }
        }
    }

    /**
     * 照片被浏览事件
     *
     * @param accessDetail
     * @param accessRecord
     */
    @Override
    public void accessPhoto(AccessDetail accessDetail, AccessRecord accessRecord) {
        Long photo_id = accessDetail.getCreation_id();
        if (photo_id != null) {
            Photo photo = new Photo(photo_id);
            switch (accessRecord.action()) {
                case SAVE:
                    if (userDao.savePhotoAccessDetail(accessDetail) > 0) {
                        albumDao.updatePhotoClickCount(photo, 1);
                    }
                    break;
                case DELETE:
                    if (userDao.deletePhotoAccessDetail(accessDetail) > 0) {
                        albumDao.updatePhotoClickCount(photo, -1);
                    }
                    break;
            }
        }
    }

    /**
     * 相册被浏览事件
     *
     * @param accessDetail
     * @param accessRecord
     */
    @Override
    public void accessAlbum(AccessDetail accessDetail, AccessRecord accessRecord) {

    }

    /**
     * 用户个人空间被浏览事件
     *
     * @param accessDetail
     * @param accessRecord
     */
    @Override
    public void accessUserHome(AccessDetail accessDetail, AccessRecord accessRecord) {

    }

    /**
     * 网站被浏览事件
     *
     * @param accessDetail
     */
    @Override
    public void accessSite(AccessDetail accessDetail) {
        int today_access_count = (int) cache.siteBuffer.get("today_access_count");
        String today_date_mark = Utils.formatDate(new Date(), "yyyy-MM-dd");
        String yesterday_date_mark = (String) cache.siteBuffer.get("today_date_mark");
        if (today_date_mark.equals(yesterday_date_mark)) {
            cache.siteBuffer.put("today_access_count", today_access_count + 1);
        } else {
            logger.info("Site today_access_count in [" + yesterday_date_mark + "] is [" + today_access_count + "]");
            cache.siteBuffer.put("today_date_mark", today_date_mark);
            cache.siteBuffer.put("today_access_count", 1);
        }
        cache.siteBuffer.put("total_access_count", (int) cache.siteBuffer.get("total_access_count") + 1);
    }

    /**
     * 添加评论事件
     *
     * @param comment
     * @param creation
     */
    @Override
    public void addComment(Comment comment, Object creation) {
        if (comment != null) {
            CommentType commentType = CommentType.valueOf(comment.getMainType());
            switch (commentType) {
                case ARTICLE:   // 文章
                    Article article = creation != null ? (Article) creation : new Article(comment.getMainId());
                    if (!comment.typeOfAnonymous() && (article.getCommented() == null || !article.getCommented())) {
                        ActionRecord<Article> actionRecord = new ActionRecord<>();
                        actionRecord.setCreation(article);
                        actionRecord.setUser(comment.getUser());
                        actionRecord.setCommented(true);
                        userDao.saveArticleActionRecord(actionRecord);
                    }
                    cache.updateArticleCommentCount(article, 1);
                    break;
                case PHOTO: // 照片
                    Photo photo = creation != null ? (Photo) creation : new Photo(comment.getMainId());
                    if (!comment.typeOfAnonymous() && (photo.getCommented() == null || !photo.getCommented())) {
                        ActionRecord<Photo> actionRecord = new ActionRecord<>();
                        actionRecord.setCreation(photo);
                        actionRecord.setUser(comment.getUser());
                        actionRecord.setCommented(true);
                        userDao.savePhotoActionRecord(actionRecord);
                    }
                    albumDao.updatePhotoCommentCount(photo, 1);
                    break;
                case VIDEO: // 视频
                    Video video = creation != null ? (Video) creation : new Video(comment.getMainId());
                    if (!comment.typeOfAnonymous() && (video.getCommented() == null || !video.getCommented())) {
                        ActionRecord<Video> actionRecord = new ActionRecord<>();
                        actionRecord.setCreation(video);
                        actionRecord.setUser(comment.getUser());
                        actionRecord.setCommented(true);
                        userDao.saveVideoActionRecord(actionRecord);
                    }
                    videoDao.updateVideoCommentCount(video, 1);
                    break;
                case PHOTO_TOPIC: // 照片合集
                    break;
            }
        }
    }

    /**
     * 删除评论事件
     *
     * @param comment
     * @param creation
     */
    @Override
    public void deleteComment(Comment comment, Object creation) {
        if (comment != null) {
            CommentType commentType = CommentType.valueOf(comment.getMainType());
            switch (commentType) {
                case ARTICLE:   // 文章
                    Article article = creation != null ? (Article) creation : new Article(comment.getMainId());
                    cache.updateArticleCommentCount(article, -1);
                    break;
                case PHOTO: // 照片
                    Photo photo = creation != null ? (Photo) creation : new Photo(comment.getMainId());
                    albumDao.updatePhotoCommentCount(photo, -1);
                    break;
                case VIDEO: // 视频
                    Video video = creation != null ? (Video) creation : new Video(comment.getMainId());
                    videoDao.updateVideoCommentCount(video, -1);
                    break;
                case PHOTO_TOPIC: // 照片合集
                    break;
            }
        }
    }

    /**
     * 关注事件
     *
     * @param follow
     */
    @Override
    public void follow(Follow follow) {
        if (follow != null && IdUtil.containValue(follow.getFollowerUid()) && IdUtil.containValue(follow.getFollowingUid())) {
            cache.putFollow(follow);
        }
    }


    /**
     * 取消关注事件
     *
     * @param follow
     */
    public void removeFollow(Follow follow) {
        if (follow != null && IdUtil.containValue(follow.getFollowerUid()) && IdUtil.containValue(follow.getFollowingUid())) {
            cache.removeFollow(follow);
        }

    }

    /**
     * 成为好友事件
     *
     * @param friend
     */
    public void friend(Friend friend) {
        if (friend != null && IdUtil.containValue(friend.getUid()) && IdUtil.containValue(friend.getFid())) {
            cache.putFriend(friend);
        }
    }

    /**
     * 取消好友事件
     *
     * @param friend
     */
    public void removeFriend(Friend friend) {
        if (friend != null && IdUtil.containValue(friend.getUid()) && IdUtil.containValue(friend.getFid())) {
            cache.removeFriend(friend);
        }
    }

    /**
     * 新文章创建事件
     *
     * @param article
     * @param user
     */
    @Override
    public void newArticle(Article article, User user) {
        if (article != null && user != null) {
            article.setDetail("");
            User author = article.getAuthor();
            User simpleAuthor = new User(author.getUid(), author.getNickname());
            simpleAuthor.setHead_photo(author.getHead_photo());
            simpleAuthor.setSex(author.getSex());
            simpleAuthor.setUserGroup(author.getUserGroup());
            article.setAuthor(simpleAuthor);
            cache.putArticle(article, user);
        }
    }

    /**
     * 文章删除事件
     *
     * @param article
     * @param user
     */
    @Override
    public void deleteArticle(Article article, User user) {
        if (article != null && user != null) {
            cache.removeArticle(article, user);
        }
    }

    /**
     * 文章更新事件
     *
     * @param article
     * @param user
     */
    public void updateArticle(Article article, User user) {
        if (article != null && article.getAuthor() != null) {
            article.setDetail("");
            User author = article.getAuthor();
            User simpleAuthor = new User(author.getUid(), author.getNickname());
            simpleAuthor.setHead_photo(author.getHead_photo());
            simpleAuthor.setSex(author.getSex());
            simpleAuthor.setUserGroup(author.getUserGroup());
            article.setAuthor(simpleAuthor);
            cache.updateArticle(article, user);
        }
    }

    /**
     * 新用户创建事件
     *
     * @param user
     */
    @Override
    public void newUser(User user) {
        if (user != null) {
            cache.putUser(user);
        }
    }

    /**
     * 用户更新事件
     *
     * @param user
     */
    public void updateUser(User user) {
        if (user != null) {
            cache.updateUser(user);
        }
    }

    /**
     * 用户删除事件
     *
     * @param user
     */
    @Override
    public void deleteUser(User user) {
        if (user != null) {
            cache.removeUser(user);
        }
    }

    /**
     * 添加收藏事件
     *
     * @param article
     * @param user
     */
    @Override
    public void addCollection(Article article, User user) {
        if (article != null) {
            cache.updateArticleCollectCount(article, 1);
        }
    }

    /**
     * 删除收藏事件
     *
     * @param article
     * @param user
     */
    @Override
    public void deleteCollection(Article article, User user) {
        if (article != null) {
            cache.updateArticleCollectCount(article, -1);
        }
    }

}
