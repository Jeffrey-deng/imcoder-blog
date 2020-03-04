package site.imcoder.blog.dao.impl;

import org.apache.ibatis.session.SqlSession;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import site.imcoder.blog.common.PageUtil;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.UserAuthType;
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
    @Override
    public List<User> findUserList(PageUtil pageUtil, User user) {
        return this.getSqlSession().selectList("user.findUserList", null);
    }

    /**
     * description:保存用户
     *
     * @param user
     * @return 成功则返回 用户id在对象user里
     */
    @Override
    public int saveUser(User user) {
        try {
            SqlSession sqlSession = this.getSqlSession();
            int i = sqlSession.insert("user.saveUser", user);
            if (i > 0) {
                for (UserAuth userAuth : user.getUserAuths()) {
                    if (userAuth.getIdentity_type() == UserAuthType.UID.value) {
                        userAuth.setIdentifier(String.valueOf(user.getUid()));
                    }
                    if (userAuth.typeOfLegalAuth()) {
                        userAuth.setUid(user.getUid());
                        sqlSession.insert("auth.insertUserAuth", userAuth);
                    }
                }
                user.getUserStatus().setUid(user.getUid());
                sqlSession.insert("user.insertUserStatus", user.getUserStatus());
                return 1;
            } else {
                return -1;
            }
        } catch (Exception e) {
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
    @Override
    public int saveProfile(User user) {
        try {
            return this.getSqlSession().update("user.updateUserProfile", user);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveProfile fail", e);
            return -1;
        }
    }

    /**
     * 更新账号状态信息
     *
     * @param userStatus
     * @return
     */
    @Override
    public int updateUserStatus(UserStatus userStatus) {
        try {
            return this.getSqlSession().insert("user.updateUserStatus", userStatus);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateUserStatus fail", e);
            return -1;
        }
    }

    /**
     * 查询用户BY ID和用户名
     *
     * @param user
     * @return
     */
    @Override
    public User findUser(User user) {
        return this.getSqlSession().selectOne("user.findUser", user);
    }

    /**
     * 删除用户
     *
     * @param user
     */
    @Override
    public int deleteUser(User user) {
        return this.getSqlSession().delete("user.deleteUser", user);
    }

    /**
     * 根据用户的信息查询总行数
     */
    @Override
    public int findUserListCount(User user) {
        return this.getSqlSession().selectOne("user.findUserListCount", user);
    }

    /**
     * 得到用户统计信息 例：关注数，粉丝数，文章数
     *
     * @param user
     * @return
     */
    @Override
    public Map<String, Object> countUserInfo(User user) {
        return null;
    }

    /**
     * 返回用户的账户设置
     *
     * @param user
     * @return
     */
    @Override
    public UserSetting findUserSetting(User user) {
        try {
            SqlSession sqlSession = this.getSqlSession();
            UserSetting userSetting = sqlSession.selectOne("user.findUserSetting", user);
            if (userSetting == null && user != null && IdUtil.containValue(user.getUid())) {
                userSetting = new UserSetting(user.getUid());
                sqlSession.insert("user.insertUserSetting", userSetting);
            }
            return userSetting;
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("findUserSetting fail", e);
            return null;
        }
    }

    /**
     * 更新用户配置
     *
     * @param userSetting
     * @return
     */
    @Override
    public int updateUserSetting(UserSetting userSetting) {
        try {
            if (userSetting != null && IdUtil.containValue(userSetting.getUid())) {
                SqlSession sqlSession = this.getSqlSession();
                UserSetting saveUserSetting = sqlSession.selectOne("user.findUserSetting", new User(userSetting.getUid()));
                if (saveUserSetting == null) {
                    sqlSession.insert("user.insertUserSetting", new UserSetting(userSetting.getUid()));
                }
                return sqlSession.update("user.updateUserSetting", userSetting);
            } else {
                return 0;
            }
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateUserSetting fail", e);
            return -1;
        }
    }


    /**
     * 检查是否为好友
     *
     * @param friend
     * @return 不是返回0 是返回2
     */
    @Override
    public int checkFriendRelationship(Friend friend) {
        return this.getSqlSession().selectOne("user.checkFriendRelationship", friend);
    }

    /**
     * 查询用户好友 List
     *
     * @param user
     * @return
     */
    @Override
    public List<User> findFriendList(User user) {
        return this.getSqlSession().selectList("user.findFriendList", user);
    }


    /**
     * 检查是否fansUser关注了hostUser
     *
     * @param follow
     * @return 不是返回0 是返回1
     */
    @Override
    public int checkFollow(Follow follow) {
        return this.getSqlSession().selectOne("user.checkFollow", follow);
    }

    /**
     * 关注  相互关注则成为好友
     *
     * @param follow
     * @return 0:插入失败 1关注成功 2成功并成为好友 11重复插入
     */
    @Override
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
                    Friend friend1 = new Friend(follow.getFollowerUid(), follow.getFollowingUid());
                    //是否已经是好友
                    int fr_row = session.selectOne("user.checkFriendRelationship", friend1);
                    if (fr_row != 2) {
                        //插入两条记录
                        int f1 = session.insert("user.beFriend", friend1);
                        Friend friend2 = new Friend(follow.getFollowingUid(), follow.getFollowerUid());
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
    @Override
    public List<User> findFollowingList(User user) {
        return this.getSqlSession().selectList("user.findFollowingList", user);
    }

    /**
     * 查询粉丝列表
     *
     * @param user
     * @return
     */
    @Override
    public List<User> findFollowerList(User user) {
        return this.getSqlSession().selectList("user.findFollowerList", user);
    }

    /**
     * 删除关注行 如果是好友则随便删除好友行
     *
     * @param follow
     * @return 0:失败 1:成功 2:并删除好友
     */
    @Override
    public int deleteFollow(Follow follow) {
        try {
            SqlSession session = this.getSqlSession();
            int a = session.delete("user.deleteFollow", follow);
            Friend friend = new Friend(follow.getFollowerUid(), follow.getFollowingUid());
            int friendCount = session.selectOne("user.checkFriendRelationship", friend);
            if (friendCount == 2) {
                int b = session.delete("user.deleteFriend", friend);
                return b * a > 0 ? 2 : 0;
            }
            return a;
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deleteFollow fail", e);
            return -1;
        }
    }

    /**
     * 检查是否loginUser收藏了此文章
     *
     * @param clet
     * @return 不是返回0 是返回1
     */
    @Override
    public int checkCollection(Collection clet) {
        return this.getSqlSession().selectOne("user.checkCollection", clet);
    }

    /**
     * 插入用户收藏表行
     *
     * @param clet
     * @return 0 插入失败 1 插入成功 2 已经插入，无须再插入
     */
    @Override
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
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveCollection fail", e);
            return -1;
        }
    }

    /**
     * 删除用户收藏表行
     */
    @Override
    public int deleteCollection(Collection clet) {
        try {
            return this.getSqlSession().delete("user.deleteCollection", clet);
        } catch (Exception e) {
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
    @Override
    public List<Collection> findCollectionList(User user) {
        return this.getSqlSession().selectList("user.findCollectionList", user);
    }

    /**
     * 保存文章的动作记录
     *
     * @param actionRecord
     * @return
     */
    @Override
    public int saveArticleActionRecord(ActionRecord<Article> actionRecord) {
        try {
            return saveActionRecord(actionRecord, actionRecord.getCreation() != null ? actionRecord.getCreation().getAid() : null,
                    "user.findSimpleArticleActionRecord", "user.updateArticleActionRecord", "user.saveArticleActionRecord");
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveArticleActionRecord fail", e);
            return -1;
        }
    }

    /**
     * 查询文章的动作记录
     *
     * @param actionRecord
     * @return
     */
    @Override
    public ActionRecord<Article> findArticleActionRecord(ActionRecord<Article> actionRecord) {
        return this.getSqlSession().selectOne("user.findArticleActionRecord", actionRecord);
    }

    /**
     * 查询文章的动作记录列表
     *
     * @param actionRecord
     * @param loginUser
     * @return
     */
    @Override
    public List<ActionRecord<Article>> findArticleActionRecordList(ActionRecord<Article> actionRecord, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        map.put("condition", actionRecord);
        map.put("loginUser", loginUser);
        return this.getSqlSession().selectList("user.findArticleActionRecordList", map);
    }

    /**
     * 保存文章的访问记录详情
     *
     * @param accessDetail
     * @return
     */
    @Override
    public int saveArticleAccessDetail(AccessDetail accessDetail) {
        try {
            return saveAccessDetail(accessDetail,
                    new Article(accessDetail.getCreation_id()),
                    "user.findSimpleArticleActionRecord",
                    "user.saveArticleActionRecord",
                    "user.findSimpleArticleAccessDetail",
                    "user.updateArticleAccessDetail",
                    "user.saveArticleAccessDetail");
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveArticleAccessDetail fail", e);
            return -1;
        }
    }

    /**
     * 删除文章的访问记录详情
     *
     * @param accessDetail
     * @return
     */
    @Override
    public int deleteArticleAccessDetail(AccessDetail accessDetail) {
        try {
            return deleteAccessDetail(accessDetail, new Article(accessDetail.getCreation_id()),
                    "user.findSimpleArticleActionRecord", "user.deletePhotoAccessDetail");
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deleteArticleAccessDetail fail", e);
            return -1;
        }
    }

    /**
     * 保存视频的动作记录
     *
     * @param actionRecord
     * @return
     */
    @Override
    public int saveVideoActionRecord(ActionRecord<Video> actionRecord) {
        try {
            return saveActionRecord(actionRecord, actionRecord.getCreation() != null ? actionRecord.getCreation().getVideo_id() : null,
                    "user.findSimpleVideoActionRecord", "user.updateVideoActionRecord", "user.saveVideoActionRecord");
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveVideoActionRecord fail", e);
            return -1;
        }
    }

    /**
     * 查询视频的动作记录
     *
     * @param actionRecord
     * @return
     */
    @Override
    public ActionRecord<Video> findVideoActionRecord(ActionRecord<Video> actionRecord) {
        return this.getSqlSession().selectOne("user.findVideoActionRecord", actionRecord);
    }

    /**
     * 查询视频的动作记录列表
     *
     * @param actionRecord
     * @param loginUser
     * @return
     */
    @Override
    public List<ActionRecord<Video>> findVideoActionRecordList(ActionRecord<Video> actionRecord, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        map.put("condition", actionRecord);
        map.put("loginUser", loginUser);
        return this.getSqlSession().selectList("user.findVideoActionRecordList", map);
    }

    /**
     * 保存视频的访问记录详情
     *
     * @param accessDetail
     * @return
     */
    @Override
    public int saveVideoAccessDetail(AccessDetail accessDetail) {
        try {
            return saveAccessDetail(accessDetail,
                    new Video(accessDetail.getCreation_id()),
                    "user.findSimpleVideoActionRecord",
                    "user.saveVideoActionRecord",
                    "user.findSimpleVideoAccessDetail",
                    "user.updateVideoAccessDetail",
                    "user.saveVideoAccessDetail");
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveVideoAccessDetail fail", e);
            return -1;
        }
    }

    /**
     * 删除视频的访问记录详情
     *
     * @param accessDetail
     * @return
     */
    @Override
    public int deleteVideoAccessDetail(AccessDetail accessDetail) {
        try {
            return deleteAccessDetail(accessDetail, new Video(accessDetail.getCreation_id()),
                    "user.findSimpleVideoActionRecord", "user.deleteVideoAccessDetail");
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deleteVideoAccessDetail fail", e);
            return -1;
        }
    }

    /**
     * 保存照片的动作记录
     *
     * @param actionRecord
     * @return
     */
    @Override
    public int savePhotoActionRecord(ActionRecord<Photo> actionRecord) {
        try {
            return saveActionRecord(actionRecord, actionRecord.getCreation() != null ? actionRecord.getCreation().getPhoto_id() : null,
                    "user.findSimplePhotoActionRecord",
                    "user.updatePhotoActionRecord",
                    "user.savePhotoActionRecord");
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("savePhotoActionRecord fail", e);
            return -1;
        }
    }

    /**
     * 查询照片的动作记录
     *
     * @param actionRecord
     * @return
     */
    @Override
    public ActionRecord<Photo> findPhotoActionRecord(ActionRecord<Photo> actionRecord) {
        return this.getSqlSession().selectOne("user.findPhotoActionRecord", actionRecord);
    }

    /**
     * 查询照片的动作记录列表
     *
     * @param actionRecord
     * @param loginUser
     * @return
     */
    @Override
    public List<ActionRecord<Photo>> findPhotoActionRecordList(ActionRecord<Photo> actionRecord, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        map.put("condition", actionRecord);
        map.put("loginUser", loginUser);
        return this.getSqlSession().selectList("user.findPhotoActionRecordList", map);
    }

    /**
     * 保存照片的访问记录详情
     *
     * @param accessDetail
     * @return
     */
    @Override
    public int savePhotoAccessDetail(AccessDetail accessDetail) {
        try {
            return saveAccessDetail(accessDetail,
                    new Photo(accessDetail.getCreation_id()),
                    "user.findSimplePhotoActionRecord",
                    "user.savePhotoActionRecord",
                    "user.findSimplePhotoAccessDetail",
                    "user.updatePhotoAccessDetail",
                    "user.savePhotoAccessDetail");
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("savePhotoAccessDetail fail", e);
            return -1;
        }
    }

    /**
     * 删除照片的访问记录详情
     *
     * @param accessDetail
     * @return
     */
    @Override
    public int deletePhotoAccessDetail(AccessDetail accessDetail) {
        try {
            return deleteAccessDetail(accessDetail, new Photo(accessDetail.getCreation_id()),
                    "user.findSimplePhotoActionRecord", "user.deletePhotoAccessDetail");
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deletePhotoAccessDetail fail", e);
            return -1;
        }
    }

    /**
     * 保存相册的动作记录
     *
     * @param actionRecord
     * @return
     */
    @Override
    public int saveAlbumActionRecord(ActionRecord<Album> actionRecord) {
        try {
            return saveActionRecord(actionRecord, actionRecord.getCreation() != null ? actionRecord.getCreation().getAlbum_id() : null,
                    "user.findSimpleAlbumActionRecord",
                    "user.updateAlbumActionRecord",
                    "user.saveAlbumActionRecord");
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveAlbumActionRecord fail", e);
            return -1;
        }
    }

    /**
     * 查询相册的动作记录
     *
     * @param actionRecord
     * @return
     */
    @Override
    public ActionRecord<Album> findAlbumActionRecord(ActionRecord<Album> actionRecord) {
        return this.getSqlSession().selectOne("user.findAlbumActionRecord", actionRecord);
    }

    /**
     * 查询相册的动作记录列表
     *
     * @param actionRecord
     * @param loginUser
     * @return
     */
    @Override
    public List<ActionRecord<Album>> findAlbumActionRecordList(ActionRecord<Album> actionRecord, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        map.put("condition", actionRecord);
        map.put("loginUser", loginUser);
        return this.getSqlSession().selectList("user.findAlbumActionRecordList", map);
    }

    /**
     * 保存相册的访问记录详情
     *
     * @param accessDetail
     * @return
     */
    @Override
    public int saveAlbumAccessDetail(AccessDetail accessDetail) {
        try {
            return saveAccessDetail(accessDetail,
                    new Album(accessDetail.getCreation_id()),
                    "user.findSimpleAlbumActionRecord",
                    "user.saveAlbumActionRecord",
                    "user.findSimpleAlbumAccessDetail",
                    "user.updateAlbumAccessDetail",
                    "user.saveAlbumAccessDetail");
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveAlbumAccessDetail fail", e);
            return -1;
        }
    }

    /**
     * 删除相册的访问记录详情
     *
     * @param accessDetail
     * @return
     */
    @Override
    public int deleteAlbumAccessDetail(AccessDetail accessDetail) {
        try {
            return deleteAccessDetail(accessDetail, new Album(accessDetail.getCreation_id()),
                    "user.findSimpleAlbumActionRecord", "user.deleteAlbumAccessDetail");
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deleteAlbumAccessDetail fail", e);
            return -1;
        }
    }

    /**
     * 保存评论的动作记录
     *
     * @param actionRecord
     * @return
     */
    @Override
    public int saveCommentActionRecord(ActionRecord<Comment> actionRecord) {
        try {
            return saveActionRecord(actionRecord, actionRecord.getCreation() != null ? actionRecord.getCreation().getCid() : null,
                    "user.findSimpleCommentActionRecord", "user.updateCommentActionRecord", "user.saveCommentActionRecord");
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveCommentActionRecord fail", e);
            return -1;
        }
    }

    /**
     * 查询评论的动作记录
     *
     * @param actionRecord
     * @return
     */
    @Override
    public ActionRecord<Comment> findCommentActionRecord(ActionRecord<Comment> actionRecord) {
        return this.getSqlSession().selectOne("user.findCommentActionRecord", actionRecord);
    }

    /**
     * 查询评论的动作记录列表
     *
     * @param actionRecord
     * @param loginUser
     * @return
     */
    @Override
    public List<ActionRecord<Comment>> findCommentActionRecordList(ActionRecord<Comment> actionRecord, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        map.put("condition", actionRecord);
        map.put("loginUser", loginUser);
        return this.getSqlSession().selectList("user.findCommentActionRecordList", map);
    }

    private int saveActionRecord(ActionRecord actionRecord, Long creation_id,
                                 String findSimpleActionRecordKey, String updateActionRecordKey, String saveActionRecordKey) {
        SqlSession session = this.getSqlSession();
        ActionRecord lastActionRecord;
        if (IdUtil.containValue(actionRecord.getAr_id())) {
            lastActionRecord = actionRecord;
        } else if (IdUtil.containValue(creation_id) &&
                ((actionRecord.getUser() != null && IdUtil.containValue(actionRecord.getUser().getUid())) || Utils.isNotEmpty(actionRecord.getIp()))) {
            if (actionRecord.getUser() == null) {
                actionRecord.setUser(new User(0L));
            } else if (actionRecord.getUser().getUid() == null) {
                actionRecord.getUser().setUid(0L);
            }
            if (actionRecord.getUser().getUid() > 0) {
                actionRecord.setIp("");
            }
            lastActionRecord = session.selectOne(findSimpleActionRecordKey, actionRecord);
        } else {
            return 0;
        }
        if (actionRecord.getLiked() != null) {
            if (actionRecord.getLiked()) {
                actionRecord.setLike_at(System.currentTimeMillis());
            } else {
                actionRecord.setLike_at(0L);
            }
        }
        if (actionRecord.getCommented() != null) {
            if (actionRecord.getCommented()) {
                actionRecord.setComment_at(System.currentTimeMillis());
            } else {
                actionRecord.setComment_at(0L);
            }
        }
        if (lastActionRecord == null) {
            if (actionRecord.getLiked() == null) {
                actionRecord.setLiked(false);
                actionRecord.setLike_at(0L);
            }
            if (actionRecord.getCommented() == null) {
                actionRecord.setCommented(false);
                actionRecord.setComment_at(0L);
            }
            return session.insert(saveActionRecordKey, actionRecord);
        } else {
            actionRecord.setAr_id(lastActionRecord.getAr_id());
            return session.update(updateActionRecordKey, actionRecord);
        }
    }

    private int saveAccessDetail(AccessDetail accessDetail, Object queryCreation,
                                 String findSimpleActionRecordKey, String saveActionRecordKey,
                                 String findSimpleAccessDetailKey, String updateAccessDetailKey, String saveAccessDetailKey) {
        SqlSession session = this.getSqlSession();
        ActionRecord actionRecord = new ActionRecord();
        actionRecord.setUser(new User(accessDetail.getUid()));
        actionRecord.setCreation(queryCreation);
        actionRecord.setIp(accessDetail.getLast_access_ip());
        // 获取 动作id
        ActionRecord lastActionRecord = session.selectOne(findSimpleActionRecordKey, actionRecord);
        if (lastActionRecord == null) {
            lastActionRecord = actionRecord;
            if (lastActionRecord.getUser().getUid() > 0) {
                lastActionRecord.setIp("");
            }
            lastActionRecord.setLiked(false);
            lastActionRecord.setLike_at(0L);
            lastActionRecord.setCommented(false);
            lastActionRecord.setComment_at(0L);
            session.insert(saveActionRecordKey, lastActionRecord);
        }
        accessDetail.setAr_id(lastActionRecord.getAr_id());
        // 获取之前保存的 访问详情
        AccessDetail lastAccessDetail = session.selectOne(findSimpleAccessDetailKey, accessDetail);
        Integer row = null;
        if (lastAccessDetail != null) {
            accessDetail.setFirst_access_path(lastAccessDetail.getFirst_access_path());
            accessDetail.setFirst_access_referer(lastAccessDetail.getFirst_access_referer());
            accessDetail.setFirst_access_time(lastAccessDetail.getFirst_access_time());
            boolean isUpgradeDeep = accessDetail.getDeep() != null && accessDetail.getDeep() > lastAccessDetail.getDeep();
            // 如果两次访问发生升级，但间隔过短，则不重复计数
            if (isUpgradeDeep && accessDetail.getLast_access_time() - lastAccessDetail.getLast_access_time() < 300000) {
                accessDetail.setAccess_times(lastAccessDetail.getAccess_times());
                row = 0;
            } else {
                accessDetail.setAccess_times(lastAccessDetail.getAccess_times() + 1);
            }
            accessDetail.setDeep(isUpgradeDeep ? accessDetail.getDeep() : lastAccessDetail.getDeep());
            int updateRow = session.update(updateAccessDetailKey, accessDetail);
            if (row != null && row == 0) {
                return row;
            } else {
                return updateRow;
            }
        } else {
            accessDetail.setFirst_access_time(accessDetail.getLast_access_time());
            accessDetail.setAccess_times(1);
            row = session.insert(saveAccessDetailKey, accessDetail);
        }
        return row;
    }

    private int deleteAccessDetail(AccessDetail accessDetail, Object queryCreation,
                                   String findSimpleActionRecordKey,
                                   String deleteAccessDetailKey) {
        SqlSession session = this.getSqlSession();
        ActionRecord actionRecord = new ActionRecord();
        actionRecord.setUser(new User(accessDetail.getUid()));
        actionRecord.setCreation(queryCreation);
        actionRecord.setIp(accessDetail.getLast_access_ip());
        // 获取 动作id
        ActionRecord lastActionRecord = session.selectOne(findSimpleActionRecordKey, actionRecord);
        if (lastActionRecord == null) {
            return 0;
        } else {
            accessDetail.setAr_id(lastActionRecord.getAr_id());
            int row = session.delete(deleteAccessDetailKey, accessDetail);
            if (row == 0) {
                accessDetail.setAr_id(0L);
            }
            return row;
        }
    }

}