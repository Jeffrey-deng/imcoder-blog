package com.blog.dao;

import com.blog.common.PageUtil;
import com.blog.entity.Collection;
import com.blog.entity.Letter;
import com.blog.entity.SysMsg;
import com.blog.entity.User;
import com.blog.entity.temp.Follow;
import com.blog.entity.temp.Friend;

import java.util.List;
import java.util.Map;

/**
 * 数据处理层接口
 * @author dengchao
 *
 */
public interface IUserDao {

	/**
	 * 查询所有用户
	 * @return
	 */
	public List<User> findUserList(PageUtil pageUtil, User user);

	/**
	 * description:保存用户
	 * @param user
	 * @return 成功则返回 用户id在对象user里
	 */
	public int saveUser(User user);

	/**
	 * 更新加密后的令牌和登录IP
	 * @param user
	 * @return
	 */
	public int updateTokenAndIp(User user);

	/**
	 * 更新个人资料
	 * @param user
	 * @return
	 */
	public int saveProfile(User user);

	/**
	 * 更新账号信息
	 * @param user
	 * @return
	 */
	public int updateAccount(User user);

	/**
	 * 查询用户BY ID和用户名
	 * @param user
	 * @return
	 */
	public User findUser(User user);

	/**
	 * 删除用户
	 * @param user
	 */
	public int deleteUser(User user);

	/**
	 * 根据用户的信息查询总行数
	 */
	public int findUserListCount(User user);

	/**
	 * 得到用户统计信息 例：关注数，粉丝数，文章数
	 * @param user
	 * @return
	 */
	public Map<String, Object> countUserInfo(User user);


	/**
	 * 检查是否为好友
	 * @param friend
	 * @return 不是返回0 是返回2
	 */
	public int checkFriendRalationship(Friend friend);

	/**
	 * 查询用户好友 List
	 * @param user
	 * @return
	 */
	public List<User> findFriendList(User user);



	/**
	 * 检查是否fansUser关注了hostUser
	 * @param follow
	 * @return 不是返回0 是返回1
	 */
	public int checkFollow(Follow follow);

	/**
	 * 关注  相互关注则成为好友
	 * @param follow
	 * @return 0:插入失败 1关注成功 2成功并成为好友 11重复插入
	 */
	public int saveFollow(Follow follow);
	/**
	 * 查询关注列表
	 * @param user
	 * @return
	 */
	public List<User> findFollowList(User user);

	/**
	 * 查询粉丝列表
	 * @param user
	 * @return
	 */
	public List<User> findFansList(User user);

	/**
	 * 删除关注行 如果是好友则随便删除好友行
	 * @param follow
	 * @return 0:失败 1:成功 2:并删除好友
	 */
	public int deleteFollow(Follow follow);


	/**
	 * 查询私信列表
	 * @param user
	 * @param read_status 0 未读  1全部
	 * @return
	 */
	public List<Letter> findLetterList(User user, int read_status);

	/**
	 * 查询系统消息列表
	 * @param user
	 * @param read_status 0 未读  1全部
	 * @return
	 */
	public List<SysMsg> findSysMsgList(User user, int read_status);

	/**
	 * 发送私信
	 * @param letter
	 * @return
	 */
	public int saveLetter(Letter letter);

	/**
	 * 检查是否loginUser收藏了此文章
	 * @param clet
	 * @return 不是返回0 是返回1
	 */
	public int checkCollection(Collection clet);

	/**
	 * 插入用户收藏表行
	 * @param clet
	 * @return 0 插入失败 1 插入成功 2 已经插入，无须再插入
	 */
	public int saveCollection(Collection clet);

	/**
	 *  删除用户收藏表行
	 */
	public int deleteCollection(Collection clet);

	/**
	 * 查找收藏文章列表
	 * @param user
	 * @return
	 */
	public List<Collection> findCollectList(User user);

}
