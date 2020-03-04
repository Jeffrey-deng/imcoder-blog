package site.imcoder.blog.event;

import site.imcoder.blog.Interceptor.annotation.AccessRecord;
import site.imcoder.blog.entity.*;

/**
 * 事件触发接口
 * 用来统一处理统计类的日志收集
 *
 * @author dengchao
 * @date 2017-3-22
 */
public interface IEventTrigger {

    /**
     * 文章被浏览事件
     *
     * @param accessDetail
     * @param accessRecord
     */
    public void accessArticle(AccessDetail accessDetail, AccessRecord accessRecord);

    /**
     * 视频被浏览事件
     *
     * @param accessDetail
     * @param accessRecord
     */
    public void accessVideo(AccessDetail accessDetail, AccessRecord accessRecord);

    /**
     * 照片被浏览事件
     *
     * @param accessDetail
     * @param accessRecord
     */
    public void accessPhoto(AccessDetail accessDetail, AccessRecord accessRecord);

    /**
     * 相册被浏览事件
     *
     * @param accessRecord
     * @param accessRecorder
     */
    public void accessAlbum(AccessDetail accessRecord, AccessRecord accessRecorder);

    /**
     * 用户个人空间被浏览事件
     *
     * @param accessDetail
     * @param accessRecord
     */
    public void accessUserHome(AccessDetail accessDetail, AccessRecord accessRecord);

    /**
     * 网站被浏览事件
     *
     * @param accessDetail
     */
    public void accessSite(AccessDetail accessDetail);

    /**
     * 添加评论事件
     *
     * @param comment
     * @param creation
     */
    public void addComment(Comment comment, Object creation);

    /**
     * 删除评论事件
     *
     * @param comment
     * @param creation
     */
    public void deleteComment(Comment comment, Object creation);

    /**
     * /**
     * 关注事件
     *
     * @param follow 被关注的用户/粉丝
     */
    public void follow(Follow follow);

    /**
     * 取消关注事件
     *
     * @param follow
     */
    public void removeFollow(Follow follow);

    /**
     * 成为好友事件
     *
     * @param friend
     */
    public void friend(Friend friend);

    /**
     * 取消好友事件
     *
     * @param friend
     */
    public void removeFriend(Friend friend);

    /**
     * 新文章创建事件
     *
     * @param article
     * @param user
     */
    public void newArticle(Article article, User user);

    /**
     * 文章删除事件
     *
     * @param article
     * @param user
     */
    public void deleteArticle(Article article, User user);

    /**
     * 文章更新事件
     *
     * @param article
     * @param user
     */
    public void updateArticle(Article article, User user);

    /**
     * 新用户创建事件
     *
     * @param user
     */
    public void newUser(User user);

    /**
     * 文章更新事件
     *
     * @param user
     */
    public void updateUser(User user);

    /**
     * 用户删除事件
     *
     * @param user
     */
    public void deleteUser(User user);

    /**
     * 添加收藏事件
     *
     * @param article
     * @param user
     */
    public void addCollection(Article article, User user);

    /**
     * 删除收藏事件
     *  @param article
     * @param user
     */
    public void removeCollection(Article article, User user);

}
