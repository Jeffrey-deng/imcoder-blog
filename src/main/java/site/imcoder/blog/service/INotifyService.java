package site.imcoder.blog.service;

import site.imcoder.blog.common.Callable;
import site.imcoder.blog.entity.*;

import java.util.List;

public interface INotifyService {

    /**
     * 类实例化配置参数
     */
    public void init();

    /**
     * 停止通知服务
     */
    public void stop();

    /**
     * 发送验证码
     *
     * @param user
     * @return validateCode 验证码
     */
    public String validateCode(User user);

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
     */
    public void receivedComment(Comment comment);

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
     * 手动发送系统消息
     *
     * @param sysMsg
     * @return flag - 200：成功，500: 失败
     */
    public int sendSystemMessage(SysMsg sysMsg);

    /**
     * 清除系统消息未读状态
     *
     * @param smIdList
     * @return flag - 200：成功，404：未影响到行，500: 失败
     */
    public int updateSystemMessageStatus(List<Integer> smIdList);

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
}
