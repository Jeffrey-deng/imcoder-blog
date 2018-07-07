package site.imcoder.blog.service;

import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.entity.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

public interface IUserService {

	/**
	 * 注册用户
	 * @param user
	 * @return  flag - 200：成功，500: 失败
	 */
	public int register(User user);

	/**
	 * 根据ID或name email 密码 登陆用户
	 * @param user
	 * @param remember
	 * @return  flag - 200：成功，400: 无参数，401：凭证错误，403：账号冻结，404：无此用户
	 * 			user - 用户对象
	 */
	public Map<String, Object> login(User user, boolean remember);

	/**
	 * 清除自动登录令牌
	 * @param loginUser
	 * @return flag - 200：成功，401：需要登录，404：无此用户，500: 失败
	 */
	public int clearToken(User loginUser);

	/**
	 * 根据ID或name email查询用户
	 * @param user
	 * @param loginUser
	 * @return
	 */
	public User findUser(User user, User loginUser);

	/**
	 * 根据ID查询用户
	 * @param user
	 * @param loginUser
	 * @param synchronize 是否从缓存中查找
	 * @return
	 */
	public User findUser(User user, User loginUser, boolean synchronize);

	/**
	 * 查询的所有用户
	 * @param currentPage
	 * @param user
	 * @return
	 */
	public Map<String, Object> findUserList(int currentPage, User user);

	/**
	 * 删除用户
	 * @param user
	 * @param loginUser
	 * @return  flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
	 */
	public int deleteUser(User user, User loginUser);
	/**
	 * 更新个人资料
	 * @param user
	 * @param loginUser
	 * @return  flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
	 */
	public int saveProfile(User user, User loginUser);
	/**
	 * 更新账号信息
	 * @param user
	 * @param loginUser
	 * @return  flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
	 */
	public int updateAccount(User user, User loginUser);

	/**
	 * 检查是否fansUser关注了hostUser
	 * @param hostUser
	 * @param loginUser
	 * @return flag - 200：已关注，404：未关注
	 */
	public int checkFollow(User hostUser, User loginUser);

	/**
	 * 关注  相互关注则成为好友
	 * @param hostUser 被关注的用户
	 * @param loginUser
	 * @return flag - 200：关注成功，201：关注成功并成为好友，204：重复插入，401：需要登录，404：无此用户，500: 失败
	 */
	public int follow(User hostUser, User loginUser);

    /**
     * 取消关注
     *
     * @param hostUser
     * @param loginUser
     * @return flag - 200：取消成功，201：取消关注成功并取消好友，401：需要登录，404：无此记录，500: 失败
     */
    public int removeFollow(User hostUser, User loginUser);

	/**
	 * 查询关注列表
	 *
	 * @param user
	 * @param loginUser
	 * @return
	 */
	public List<User> findFollowList(User user, User loginUser);

	/**
	 * 查询粉丝列表
	 *
	 * @param user
	 * @param loginUser
	 * @return
	 */
	public List<User> findFansList(User user, User loginUser);

	/**
	 * 查询好友列表
	 * @param loginUser
	 * @return
	 */
	public List<User> findFriendList(User loginUser);

	/**
	 * 发送私信
	 * @param letter
	 * @param loginUser
	 * @return flag - 200：发送成功，401：需要登录，500: 失败
	 */
	public int sendLetter(Letter letter, User loginUser);

	/**
	 * 查询私信列表
	 *
	 * @param user
	 * @param read_status 0 未读 1全部
	 * @return
	 */
	public List<Letter> findLetterList(User user, int read_status);

	/**
	 * 查询系统消息列表
	 *
	 * @param user
	 * @param read_status 0 未读 1全部
	 * @return
	 */
	public List<SysMsg> findSysMsgList(User user, int read_status);

	/**
	 * 点击了文章
	 * @param user
	 * @param article
	 * @return
	 */
	public void hasClickArticle(User user, Article article);

	/**
	 * 检查是否loginUser收藏了此文章
	 * @param article
	 * @param user
	 * @return flag - 200：已收藏，404：未收藏
	 */
	public int checkCollection(Article article, User user);

	/**
	 * 收藏文章
	 *
	 * @param user
	 * @param article
	 * @return  flag - 200：成功，204: 重复插入，401：需要登录，404: 无此文章，500: 失败
	 */
	public int collectArticle(User user, Article article);

	/**
	 * 查找收藏文章列表
	 *
	 * @param user
	 * @return list
	 */
	public List<Collection> findCollectList(User user);

	/**
	 * 取消收藏文章
	 *
	 * @param user
	 * @param article
	 * @return flag - 200：取消成功，401：需要登录，404：无此记录，500: 失败
	 */
	public int unCollectArticle(User user, Article article);

	/**
	 * 更新头像
	 * @param file
	 * @param user
	 * @param fileName
	 * @param request
	 * @param map
	 * @return  flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
	 */
	public int saveHeadPhoto(MultipartFile file, User user, String fileName, HttpServletRequest request, Map map);

}
