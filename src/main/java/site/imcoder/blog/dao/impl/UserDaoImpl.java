package site.imcoder.blog.dao.impl;

import org.apache.ibatis.session.SqlSession;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import site.imcoder.blog.common.PageUtil;
import site.imcoder.blog.dao.CommonDao;
import site.imcoder.blog.dao.IUserDao;
import site.imcoder.blog.entity.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据处理实现类
 *
 * @author wenber
 */
@Repository("userDao")
public class UserDaoImpl extends CommonDao implements IUserDao {

    private static Logger logger = Logger.getLogger(UserDaoImpl.class);

    /**
     * 查询所有用户
     *
     * @return
     */
    public List<User> findUserList(PageUtil pageUtil, User user) {
        return this.getSqlSession().selectList("user.findUserList", null);
    }

    /**
     * description:保存用户
     *
     * @param user
     * @return 成功则返回 用户id在对象user里
     */
    public int saveUser(User user) {
        try {
            return this.getSqlSession().insert("user.saveUser", user);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveUser fail", e);
            return -1;
        }
    }

    /**
     * 更新个人资料
     *
     * @param user
     * @return
     */
    public int saveProfile(User user) {
        try {
            return this.getSqlSession().update("user.saveprofile", user);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveProfile fail", e);
            return -1;
        }
    }

    /**
     * 更新加密后的令牌和登录IP
     *
     * @param user
     * @return
     */
    public int updateTokenAndIp(User user) {
        try {
            return this.getSqlSession().update("user.updateTokenAndIp", user);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateTokenAndIp fail", e);
            return -1;
        }
    }

    /**
     * 更新账号信息
     *
     * @param user
     * @return
     */
    @Override
    public int updateAccount(User user) {
        try {
            return this.getSqlSession().update("user.updateAccount", user);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateAccount fail", e);
            return -1;
        }
    }

    /**
     * 查询用户BY ID和用户名
     *
     * @param user
     * @return
     */
    public User findUser(User user) {
        return this.getSqlSession().selectOne("user.findUser", user);
    }

    /**
     * 删除用户
     *
     * @param user
     */
    public int deleteUser(User user) {
        return this.getSqlSession().delete("user.deleteUser", user);
    }

    /**
     * 根据用户的信息查询总行数
     */
    public int findUserListCount(User user) {
        return this.getSqlSession().selectOne("user.findUserListCount", user);
    }

    /**
     * 得到用户统计信息 例：关注数，粉丝数，文章数
     *
     * @param user
     * @return
     */
    public Map<String, Object> countUserInfo(User user) {
        return null;
    }


    /**
     * 检查是否为好友
     *
     * @param friend
     * @return 不是返回0 是返回2
     */
    public int checkFriendRelationship(Friend friend) {
        return this.getSqlSession().selectOne("user.checkFriendRelationship", friend);
    }

    /**
     * 查询用户好友 List
     *
     * @param user
     * @return
     */
    public List<User> findFriendList(User user) {
        return this.getSqlSession().selectList("user.findFriendList", user);
    }


    /**
     * 检查是否fansUser关注了hostUser
     *
     * @param follow
     * @return 不是返回0 是返回1
     */
    public int checkFollow(Follow follow) {
        return this.getSqlSession().selectOne("user.checkFollow", follow);
    }

    /**
     * 关注  相互关注则成为好友
     *
     * @param follow
     * @return 0:插入失败 1关注成功 2成功并成为好友 11重复插入
     */
    public int saveFollow(Follow follow) {
        try {
            SqlSession session = this.getSqlSession();
            Map<String, Object> map = new HashMap<String, Object>();
            map.put("count", 0);
            map.put("follow", follow);
            //如果已关注则不插入 由count判断
            int fid = session.insert("user.saveFollow", map);
            if (fid > 0 || (Integer) map.get("count") > 0) {
                //检查是否可以成为好友
                int fw_row = session.selectOne("user.checkMutualFollow", follow);
                if (fw_row == 2) {
                    Friend friend1 = new Friend(follow.getUid(), follow.getFuid());
                    //是否已经是好友
                    int fr_row = session.selectOne("user.checkFriendRelationship", friend1);
                    if (fr_row != 2) {
                        //插入两条记录
                        int f1 = session.insert("user.beFriend", friend1);
                        Friend friend2 = new Friend(follow.getFuid(), follow.getUid());
                        int f2 = session.insert("user.beFriend", friend2);
                        if (f1 * f2 > 0) {
                            return 2;
                        }
                    } else if (fr_row == 2) {
                        return 11;
                    }
                }
                if ((Integer) map.get("count") > 0) {
                    return 11;
                } else {
                    return 1;
                }
            } else {
                return 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveFollow fail", e);
            return -1;
        }
    }

    /**
     * 查询关注列表
     *
     * @param user
     * @return
     */
    public List<User> findFollowList(User user) {
        return this.getSqlSession().selectList("user.findFollowList", user);
    }

    /**
     * 查询粉丝列表
     *
     * @param user
     * @return
     */
    public List<User> findFansList(User user) {
        return this.getSqlSession().selectList("user.findFansList", user);
    }

    /**
     * 删除关注行 如果是好友则随便删除好友行
     *
     * @param follow
     * @return 0:失败 1:成功 2:并删除好友
     */
    public int deleteFollow(Follow follow) {
        try {
            SqlSession session = this.getSqlSession();
            int a = session.delete("user.deleteFollow", follow);
            Friend friend = new Friend(follow.getUid(), follow.getFuid());
            int friendCount = session.selectOne("user.checkFriendRelationship", friend);
            if (friendCount == 2) {
                int b = session.delete("user.deleteFriend", friend);
                return b * a > 0 ? 2 : 0;
            }
            return a;
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deleteFollow fail", e);
            return -1;
        }
    }


    /**
     * 查询私信列表
     *
     * @param user
     * @param read_status 0 未读  1全部
     * @return
     */
    public List<Letter> findLetterList(User user, int read_status) {
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("user", user);
        map.put("read_status", read_status);
        return this.getSqlSession().selectList("msg.findLetterList", map);
    }

    /**
     * 查询系统消息列表
     *
     * @param user
     * @param read_status 0 未读  1全部
     * @return
     */
    public List<SysMsg> findSysMsgList(User user, int read_status) {
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("user", user);
        map.put("read_status", read_status);
        return this.getSqlSession().selectList("msg.findSysMsgList", map);
    }

    /**
     * 发送私信
     *
     * @param letter
     * @return
     */
    public int saveLetter(Letter letter) {
        try {
            return this.getSqlSession().insert("msg.saveLetter", letter);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveLetter fail", e);
            return -1;
        }
    }

    /**
     * 检查是否loginUser收藏了此文章
     *
     * @param clet
     * @return 不是返回0 是返回1
     */
    public int checkCollection(Collection clet) {
        return this.getSqlSession().selectOne("user.checkCollection", clet);
    }

    /**
     * 插入用户收藏表行
     *
     * @param clet
     * @return 0 插入失败 1 插入成功 2 已经插入，无须再插入
     */
    public int saveCollection(Collection clet) {
        try {
            SqlSession session = this.getSqlSession();
            int row = session.selectOne("user.checkCollection", clet);
            if (row > 0) {
                return 2;
            } else {
                return session.insert("user.saveCollection", clet);
            }
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveCollection fail", e);
            return -1;
        }
    }

    /**
     * 删除用户收藏表行
     */
    public int deleteCollection(Collection clet) {
        try {
            return this.getSqlSession().delete("user.deleteCollection", clet);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deleteCollection fail", e);
            return -1;
        }
    }

    /**
     * 查找收藏文章列表
     *
     * @param user
     * @return
     */
    public List<Collection> findCollectList(User user) {
        return this.getSqlSession().selectList("user.findCollectList", user);
    }
}