package site.imcoder.blog.dao.impl;

import org.apache.ibatis.session.SqlSession;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import site.imcoder.blog.dao.CommonDao;
import site.imcoder.blog.dao.IMessageDao;
import site.imcoder.blog.entity.Comment;
import site.imcoder.blog.entity.Letter;
import site.imcoder.blog.entity.SysMsg;
import site.imcoder.blog.entity.User;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 消息类dao（私信、评论、系统消息）
 *
 * @author Jeffrey.Deng
 * @date 2016-10-27
 */
@Repository("messageDao")
public class MessageDaoImpl extends CommonDao implements IMessageDao {

    private static Logger logger = Logger.getLogger(MessageDaoImpl.class);

    /**     -----------   letter start    ---------------    */

    /**
     * 查询某一条私信，根据leid
     * chatUser为发送人的资料
     *
     * @param letter
     * @return
     */
    @Override
    public Letter findLetter(Letter letter) {
        try {
            return this.getSqlSession().selectOne("message.findLetter", letter);
        } catch (Exception e) {
            logger.error("findLetter fail", e);
            return null;
        }
    }

    /**
     * 查询私信列表
     *
     * @param user
     * @param read_status 0 未读  1全部
     * @return
     */
    @Override
    public List<Letter> findLetterList(User user, int read_status) {
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("user", user);
        map.put("read_status", read_status);
        return this.getSqlSession().selectList("message.findLetterList", map);
    }

    /**
     * 发送私信
     *
     * @param letter
     * @return
     */
    @Override
    public int saveLetter(Letter letter) {
        try {
            return this.getSqlSession().insert("message.saveLetter", letter);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveLetter fail", e);
            return -1;
        }
    }

    /**
     * 删除私信
     *
     * @param letter
     * @return
     */
    @Override
    public int deleteLetter(Letter letter) {
        try {
            return this.getSqlSession().insert("message.deleteLetter", letter);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deleteLetter fail", e);
            return -1;
        }
    }

    /**
     * 清除私信消息未读状态
     *
     * @param leIdList  私信id列表, 只能清除别人发送的，自己发送的不能清除, 既loginUser.uid为r_uid
     * @param loginUser
     * @return
     */
    @Override
    public int updateLetterStatus(List<Integer> leIdList, User loginUser) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("leIdList", leIdList);
            map.put("loginUser", loginUser);
            return this.getSqlSession().update("message.updateLetterListStatus", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateLetterListStatus fail", e);
            return -1;
        }
    }

    /**     -----------   letter end    ---------------    */

    /**     ----------   comment start    ----------------    */

    /**
     * 保存评论
     *
     * @param comment
     * @return
     */
    @Override
    public int saveComment(Comment comment) {
        try {
            return this.getSqlSession().insert("message.saveComment", comment);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveComment fail", e);
            return -1;
        }
    }

    /**
     * 查找文章评论
     *
     * @param comment - 传入mainId和mainType
     * @return
     */
    @Override
    public List<Comment> findCommentList(Comment comment) {
        try {
            return this.getSqlSession().selectList("message.findCommentList", comment);
        } catch (Exception e) {
            logger.error("findCommentList fail", e);
            return null;
        }
    }

    /**
     * 查找评论
     *
     * @param comment - 传入cid
     * @return
     */
    @Override
    public Comment findComment(Comment comment) {
        try {
            return this.getSqlSession().selectOne("message.findComment", comment);
        } catch (Exception e) {
            logger.error("findComment fail", e);
            return null;
        }
    }

    /**
     * 删除评论 有子节点 就改content为 ‘已删除’
     *
     * @param comment
     * @return 0：删除失败 1：填充为‘已删除’ 2：完全删除
     */
    @Override
    public int deleteComment(Comment comment) {
        try {
            SqlSession session = this.getSqlSession();
            int childCount = session.selectOne("message.selectCmtChildCount", comment);
            if (childCount > 0)
                return session.update("message.deleteComment_1", comment);
            else
                return session.delete("message.deleteComment_2", comment) == 1 ? 2 : 0;
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deleteComment fail", e);
            return -1;
        }
    }

    /**
     * 点赞评论
     *
     * @param comment
     * @param step - 步长，可为负数
     * @return
     */
    @Override
    public int updateCommentLikeCount(Comment comment, int step) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("comment", comment);
            map.put("step", step);
            SqlSession session = this.getSqlSession();
            return session.update("message.updateCommentLikeCount", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateCommentLikeCount fail", e);
            return -1;
        }
    }

    /**     ----------   comment end    ----------------    */

    /**     -----------   sys msg start   --------------    */

    /**
     * 保存系统消息
     *
     * @param sysMsg
     * @return
     */
    @Override
    public int saveSystemMessage(SysMsg sysMsg) {
        try {
            return this.getSqlSession().update("message.insertSystemMessage", sysMsg);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveSystemMessage fail", e);
            return -1;
        }
    }

    /**
     * 查询系统消息列表
     *
     * @param user
     * @param read_status 0 未读  1全部
     * @return
     */
    @Override
    public List<SysMsg> findSysMsgList(User user, int read_status) {
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("user", user);
        map.put("read_status", read_status);
        return this.getSqlSession().selectList("message.findSysMsgList", map);
    }

    /**
     * 清除系统消息未读状态
     *
     * @param smIdList
     * @param loginUser
     * @return
     */
    @Override
    public int updateSystemMessageStatus(List<Long> smIdList, User loginUser) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("smIdList", smIdList);
            map.put("loginUser", loginUser);
            return this.getSqlSession().update("message.updateSystemMessageListStatus", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateSystemMessageListStatus fail", e);
            return -1;
        }
    }

    /**
     * 删除系统消息
     *
     * @param smIdList
     * @param loginUser
     * @return
     */
    @Override
    public int deleteSystemMessage(List<Long> smIdList, User loginUser) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("smIdList", smIdList);
            map.put("loginUser", loginUser);
            return this.getSqlSession().update("message.deleteSystemMessageList", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deleteSystemMessageList fail", e);
            return -1;
        }
    }

    /**     -----------   sys msg end    -------------    */
}
