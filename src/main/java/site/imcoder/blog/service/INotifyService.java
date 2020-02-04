package site.imcoder.blog.service;

import site.imcoder.blog.common.Callable;
import site.imcoder.blog.entity.*;

import java.util.List;
import java.util.Set;

/**
 * 消息服务接口
 */
public interface INotifyService {

    /**
     * 异步运行
     *
     * @param command
     */
    public void executeByAsync(Runnable command);

    /**
     * 发送验证码
     *
     * @param user
     * @return validateCode 验证码
     */
    public String sendValidateCode(User user);

    /**
     * 新用户欢迎通知
     *
     * @param newUser
     */
    public void welcomeNewUser(User newUser);

    /**
     * 通知管理员新用户
     *
     * @param managers
     * @param newUser
     */
    public void notifyManagerNewUser(List<User> managers, User newUser);

    /**
     * 收到私信提醒通知
     *
     * @param letter 私信
     */
    public void receivedLetter(Letter letter);

    /**
     * 收到评论提醒通知
     *
     * @param comment
     * @param replyUid 父类评论的用户id(parentId为0时设置主体对象的作者id)
     * @param creation 评论主体的对象（article?photo?video?）
     */
    public void receivedComment(Comment comment, Long replyUid, Object creation);

    /**
     * 新的关注者提醒
     *
     * @param user
     * @param fan
     * @param isFriend
     */
    public void theNewFollower(User user, User fan, boolean isFriend);

    /**
     * 新文章发布，推送给关注者通知
     *
     * @param article
     */
    public void postNewArticleToFollower(Article article);

    /**
     * 被用户收藏
     *
     * @param article
     */
    public void collectedByUser(User user, Article article);

    /**
     * 手动发送邮件
     *
     * @param toMail
     * @param subject
     * @param content
     * @return
     */
    public boolean sendEmail(String toMail, String subject, String content);

    /**
     * 向一位已登录的用户推送消息
     *
     * @param user
     * @param wsMessage
     * @return boolean 是否发送成功，既该用户是否登录
     */
    public boolean pushWsMessage(User user, WsMessage wsMessage);

    /**
     * 向一批已登录的用户推送消息
     *
     * @param users
     * @param wsMessage
     */
    public void pushWsMessage(List<User> users, WsMessage wsMessage);

    /**
     * 向所有已登录的用户推送消息
     *
     * @param wsMessage
     */
    public void pushWsMessageToAll(WsMessage wsMessage);

    /**
     * 注册在接收到用户的消息后触发的回调方法，全局回调（任何消息都响应）
     * 回到方法中，入参为接收到的消息，回参为返回的消息
     *
     * @param callback
     */
    public void onmessage(Callable<WsMessage, WsMessage> callback);

    /**
     * 注册在接收到用户的消息后触发的回调方法，只响应mapping对应的回调方法
     * 回到方法中，入参为接收到的消息，回参为返回的消息
     *
     * @param mapping  mapping名，收到消息时，对应的mapping将响应
     * @param callback
     */
    public void onmessage(String mapping, Callable<WsMessage, WsMessage> callback);

    /**
     * 得到用户所有实时通信session
     *
     * @param <T>
     * @return
     */
    public <T> Set<T> getAllPushSessions();

    /**
     * 得到用户所有实时通信session
     *
     * @param user
     * @param <T>
     * @return
     */
    public <T> List<T> getUserAllPushSessions(User user);
}
