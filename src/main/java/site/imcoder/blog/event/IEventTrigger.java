package site.imcoder.blog.event;

import site.imcoder.blog.entity.*;

/**
 * 事件触发接口
 * 用来统一处理统计类的日志收集
 * @author dengchao
 * @date 2017-3-22
 */
public interface IEventTrigger {

	/**
	 * 文章被浏览事件
	 * @param user 访客
	 * @param article 文章
	 */
	public void clickArticle(User user, Article article);

	/**
	 * 用户个人空间被浏览事件
	 * @param user
	 */
	public void clickUserHome(User user);

	/**
	 * 网站被浏览事件
	 * @param user
	 */
	public void clickSite(User user);

	/**
	 * 添加评论事件
	 * @param comment
	 */
	public void addComment(Comment comment);

	/**
	 * 删除评论事件
	 * @param comment
	 */
	public void deleteComment(Comment comment);

	/**

	/**
	 * 关注事件
	 * @param follow 被关注的用户/粉丝
	 */
	public void follow(Follow follow);

	/**
	 * 取消关注事件
	 * @param follow
	 */
	public void unFollow(Follow follow);

	/**
	 * 成为好友事件
	 * @param friend
	 */
	public void friend(Friend friend);

	/**
	 * 取消好友事件
	 * @param friend
	 */
	public void unFriend(Friend friend);

	/**
	 * 新文章创建事件
	 * @param article
	 * @param user
	 */
	public void newArticle(Article article, User user);

	/**
	 * 文章删除事件
	 * @param article
	 * @param user
	 */
	public void deleteArticle(Article article, User user);

	/**
	 * 文章更新事件
	 * @param article
	 * @param user
	 */
	public void updateArticle(Article article, User user);

	/**
	 * 新用户创建事件
	 * @param user
	 */
	public void newUser(User user);

	/**
	 * 文章更新事件
	 * @param user
	 */
	public void updateUser(User user);

	/**
	 * 用户删除事件
	 * @param user
	 */
	public void deleteUser(User user);

	/**
	 * 添加收藏事件
	 * @param article
	 * @param user
	 */
	public void addCollection(Article article, User user);

	/**
	 * 删除收藏事件
	 * @param article
	 * @param user
	 */
	public void deleteCollection(Article article, User user);

}
