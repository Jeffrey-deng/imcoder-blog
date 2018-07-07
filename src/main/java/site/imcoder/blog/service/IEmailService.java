package site.imcoder.blog.service;

import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.Comment;
import site.imcoder.blog.entity.User;

import java.util.List;

public interface IEmailService {

	/**
	 * 类实例化配置参数
	 */
	public void init();

	/**
	 * 停止邮件服务
	 */
	public void stop();

	/**
	 * 验证码邮件
	 * @param user
	 * @return validateCode 验证码
	 */
	public String validateCodeMail(User user);

	/**
	 * 新用户欢迎邮件
	 * @param newUser
	 */
	public void welcomeMail(User newUser);

	/**
	 * 通知管理员新用户
	 * @param managers
	 * @param newUser
	 */
	public void notifyManagerNewUserMail(List<User> managers, User newUser);

	/**
	 * 收到私信提醒邮件
	 * @param user	接收者
	 * @param sendUser 发送者
	 */
	public void receivedLetterMail(User user, User sendUser);

	/**
	 * 收到评论提醒邮件
	 * @param comment
	 */
	public void receivedCommentMail(Comment comment);

	/**
	 * 新的关注者提醒邮件
	 * @param user
	 * @param fan
	 */
	public void theNewFollowerMail(User user, User fan);

	/**
	 * 新文章发布，推送给关注者邮件
	 * @param article
	 */
	public void postNewArticleToFollowerMail(Article article);
}
