package site.imcoder.blog.event.impl;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Component;
import site.imcoder.blog.Interceptor.annotation.AccessRecorder;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
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
     * @param accessRecord
     * @param accessRecorder
     */
    @Override
    public void accessArticle(AccessRecord<Article> accessRecord, AccessRecorder accessRecorder) {
        Article article = accessRecord.getBean();
        if (article != null) {
            switch (accessRecorder.action()) {
                case SAVE:
                    cache.updateArticleClickCount(article, 1);
                case LIKE:
                    if (accessRecorder.action() == AccessRecorder.Actions.LIKE) {

                    }
                    userDao.saveArticleAccessRecord(accessRecord);
                    break;
                case DELETE:
                    cache.updateArticleClickCount(article, -1);
                    break;
            }
        }
    }

    /**
     * 视频被浏览事件
     *
     * @param accessRecord
     * @param accessRecorder
     */
    @Override
    public void accessVideo(AccessRecord<Video> accessRecord, AccessRecorder accessRecorder) {
        Video video = accessRecord.getBean();
        if (video != null) {
            switch (accessRecorder.action()) {
                case SAVE:
                    videoDao.updateVideoClickCount(video, 1);
                case LIKE:
                    if (accessRecorder.action() == AccessRecorder.Actions.LIKE) {
                        if (accessRecord.getIs_like() > 0) {
                            videoDao.updateVideoLikeCount(video, 1);
                        } else {
                            videoDao.updateVideoLikeCount(video, -1);
                        }
                    }
                    userDao.saveVideoAccessRecord(accessRecord);
                    break;
                case DELETE:
                    videoDao.updateVideoClickCount(video, -1);
                    if (accessRecord.getIs_like() != null && accessRecord.getIs_like() > 0) {
                        videoDao.updateVideoLikeCount(video, -1);
                    }
                    break;
            }
        }
    }

    /**
     * 照片被浏览事件
     *
     * @param accessRecord
     * @param accessRecorder
     */
    @Override
    public void accessPhoto(AccessRecord<Photo> accessRecord, AccessRecorder accessRecorder) {
        Photo photo = accessRecord.getBean();
        if (photo != null) {
            switch (accessRecorder.action()) {
                case SAVE:
                    albumDao.updatePhotoClickCount(photo, 1);
                case LIKE:
                    if (accessRecorder.action() == AccessRecorder.Actions.LIKE) {
                        if (accessRecord.getIs_like() > 0) {
                            albumDao.updatePhotoLikeCount(photo, 1);
                        } else {
                            albumDao.updatePhotoLikeCount(photo, -1);
                        }
                    }
                    userDao.savePhotoAccessRecord(accessRecord);
                    break;
                case DELETE:
                    albumDao.updatePhotoClickCount(photo, -1);
                    if (accessRecord.getIs_like() != null && accessRecord.getIs_like() > 0) {
                        albumDao.updatePhotoLikeCount(photo, -1);
                    }
                    break;
            }
        }
    }

    /**
     * 相册被浏览事件
     *
     * @param accessRecord
     * @param accessRecorder
     */
    @Override
    public void accessAlbum(AccessRecord<Album> accessRecord, AccessRecorder accessRecorder) {

    }

    /**
     * 用户个人空间被浏览事件
     *
     * @param accessRecord
     * @param accessRecorder
     */
    @Override
    public void accessUserHome(AccessRecord<User> accessRecord, AccessRecorder accessRecorder) {

    }

    /**
     * 网站被浏览事件
     *
     * @param accessRecord
     * @param accessRecorder - 可能为null
     */
    @Override
    public void accessSite(AccessRecord accessRecord, AccessRecorder accessRecorder) {
        if (accessRecorder != null && accessRecorder.action() != AccessRecorder.Actions.SAVE) {
            return;
        }
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
     */
    @Override
    public void addComment(Comment comment) {
        if (comment != null) {
            Article article = new Article(comment.getMainId());
            cache.updateArticleCommentCount(article, 1);
        }
    }

    /**
     * 删除评论事件
     *
     * @param comment
     */
    @Override
    public void deleteComment(Comment comment) {
        if (comment != null) {
            Article article = new Article(comment.getMainId());
            cache.updateArticleCommentCount(article, -1);
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
