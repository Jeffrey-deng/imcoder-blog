package site.imcoder.blog.service;

import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.Comment;
import site.imcoder.blog.entity.SysMsg;
import site.imcoder.blog.entity.User;

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
     * @param user     接收者
     * @param sendUser 发送者
     */
    public void receivedLetter(User user, User sendUser);

    /**
     * 收到评论提醒通知
     *
     * @param comment
     */
    public void receivedComment(Comment comment);

    /**
     * 新的关注者提醒
     *  @param user
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
}
