package site.imcoder.blog.service;

import site.imcoder.blog.entity.Comment;
import site.imcoder.blog.entity.Letter;
import site.imcoder.blog.entity.SysMsg;
import site.imcoder.blog.entity.User;

import java.util.List;
import java.util.Map;

/**
 * @author Jeffrey.Deng
 * @date 2016-10-27
 */
public interface IMessageService {

    /**
     * 发送私信
     *
     * @param letter
     * @param loginUser
     * @return flag - 200：发送成功，401：需要登录，500: 失败
     * letter: 私信对象
     */
    public Map<String, Object> sendLetter(Letter letter, User loginUser);

    /**
     * 查询私信列表
     *
     * @param loginUser
     * @param read_status 0 未读 1全部
     * @return
     */
    public List<Letter> findLetterList(User loginUser, int read_status);

    /**
     * 删除私信
     *
     * @param letter
     * @param loginUser
     * @return flag - 200：发送成功，401：需要登录，404: 无此私信，500: 失败
     */
    public int deleteLetter(Letter letter, User loginUser);

    /**
     * 清除私信消息未读状态
     *
     * @param leIdList 私信id列表, 只能清除别人发送的，自己发送的不能清除, 既loginUser.uid为r_uid
     * @return flag - 200：成功，404：未影响到行，500: 失败
     */
    public int updateLetterListStatus(List<Integer> leIdList, User loginUser);

    /**
     * 得到评论列表
     *
     * @param comment   - 传入mainId和mainType
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，500: 失败
     * comments - 评论列表
     */
    public Map<String, Object> findCommentList(Comment comment, User loginUser);

    /**
     * 添加评论
     *
     * @param comment
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，500: 失败
     * comment 对象
     */
    public Map<String, Object> addComment(Comment comment, User loginUser);

    /**
     * 删除评论
     *
     * @param comment
     * @param loginUser
     * @return flag - 200：成功，201：填充为‘已删除’，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    public int deleteComment(Comment comment, User loginUser);

    /**
     * 手动发送系统消息, 只能由后台服务发，前台不能发
     *
     * @param sysMsg
     * @return flag - 200：成功，500: 失败
     */
    public int sendSystemMessage(SysMsg sysMsg);

    /**
     * 查询系统消息列表
     *
     * @param loginUser
     * @param read_status 0 未读 1全部
     * @return
     */
    public List<SysMsg> findSysMsgList(User loginUser, int read_status);

    /**
     * 清除系统消息未读状态
     *
     * @param smIdList
     * @return flag - 200：成功，404：未影响到行，500: 失败
     */
    public int updateSystemMessageListStatus(List<Integer> smIdList, User loginUser);

    /**
     * 删除系统消息
     *
     * @param smIdList
     * @return flag - 200：成功，404：未影响到行，500: 失败
     */
    public int deleteSystemMessageList(List<Integer> smIdList, User loginUser);

}
