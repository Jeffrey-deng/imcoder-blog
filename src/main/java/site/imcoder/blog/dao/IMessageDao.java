package site.imcoder.blog.dao;

import site.imcoder.blog.entity.Comment;
import site.imcoder.blog.entity.Letter;
import site.imcoder.blog.entity.SysMsg;
import site.imcoder.blog.entity.User;

import java.util.List;

/**
 * 消息类dao（私信、评论、系统消息）
 *
 * @author Jeffrey.Deng
 * @date 2016-10-27
 */
public interface IMessageDao {

    /**
     * 查询某一条私信，根据leid
     * chatUser为发送人的资料
     *
     * @param letter
     * @return
     */
    public Letter findLetter(Letter letter);

    /**
     * 查询私信列表
     *
     * @param user
     * @param read_status 0 未读  1全部
     * @return
     */
    public List<Letter> findLetterList(User user, int read_status);

    /**
     * 发送私信
     *
     * @param letter
     * @return
     */
    public int saveLetter(Letter letter);

    /**
     * 删除私信
     *
     * @param letter
     * @return
     */
    public int deleteLetter(Letter letter);

    /**
     * 清除私信未读状态
     *
     * @param leIdList 私信id列表, 只能清除别人发送的，自己发送的不能清除, 既loginUser.uid为r_uid
     * @return flag - 200：成功，404：未影响到行，500: 失败
     */
    public int updateLetterStatus(List<Integer> leIdList, User loginUser);

    /**
     * 保存评论
     *
     * @param comment
     * @return
     */
    public int saveComment(Comment comment);

    /**
     * 查找文章评论
     *
     * @param comment - 传入mainId和mainType
     * @return
     */
    public List<Comment> findCommentList(Comment comment);

    /**
     * 查找评论
     *
     * @param comment - 传入cid
     * @return
     */
    public Comment findComment(Comment comment);

    /**
     * 删除评论 有子节点 就改content为 ‘已删除’
     *
     * @param comment
     * @return 0：删除失败 1：填充为‘已删除’ 2：完全删除
     */
    public int deleteComment(Comment comment);

    /**
     * 保存系统消息
     *
     * @param sysMsg
     * @return
     */
    public int saveSystemMessage(SysMsg sysMsg);

    /**
     * 查询系统消息列表
     *
     * @param user
     * @param read_status 0 未读  1全部
     * @return
     */
    public List<SysMsg> findSysMsgList(User user, int read_status);

    /**
     * 清除系统消息未读状态
     *
     * @param smIdList
     * @return
     */
    public int updateSystemMessageStatus(List<Integer> smIdList, User loginUser);

    /**
     * 删除系统消息
     *
     * @param smIdList
     * @return flag - 200：成功，404：未影响到行，500: 失败
     */
    public int deleteSystemMessage(List<Integer> smIdList, User loginUser);
}
