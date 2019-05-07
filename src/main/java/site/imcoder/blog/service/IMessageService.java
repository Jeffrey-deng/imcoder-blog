package site.imcoder.blog.service;

import site.imcoder.blog.entity.Comment;
import site.imcoder.blog.entity.Letter;
import site.imcoder.blog.entity.SysMsg;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import java.util.List;

/**
 * @author Jeffrey.Deng
 * @date 2016-10-27
 */
public interface IMessageService {

    /**
     * 发送私信
     *
     * @param letter
     * @param iRequest
     * @return IResponse:
     * status - 200：发送成功，401：需要登录，500: 失败
     * letter: 私信对象
     */
    public IResponse sendLetter(Letter letter, IRequest iRequest);

    /**
     * 删除私信
     *
     * @param letter
     * @param iRequest
     * @return IResponse:
     * status - 200：删除成功，401：需要登录，404: 无此私信，500: 失败
     */
    public IResponse deleteLetter(Letter letter, IRequest iRequest);

    /**
     * 清除私信消息未读状态
     *
     * @param leIdList 私信id列表, 只能清除别人发送的，自己发送的不能清除, 既loginUser.uid为r_uid
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，404：这些私信本来就已读或不存在，500: 失败
     */
    public IResponse updateLetterListStatus(List<Integer> leIdList, IRequest iRequest);

    /**
     * 查询私信列表
     *
     * @param read_status 0 未读 1全部
     * @param iRequest
     * @return IResponse:
     * letters - 私信列表
     */
    public IResponse findLetterList(int read_status, IRequest iRequest);

    /**
     * 得到评论列表
     *
     * @param comment  - 传入mainId和mainType
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，500: 失败
     * comments - 评论列表
     */
    public IResponse findCommentList(Comment comment, IRequest iRequest);

    /**
     * 添加评论
     *
     * @param comment
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，500: 失败
     * comment 对象
     */
    public IResponse addComment(Comment comment, IRequest iRequest);

    /**
     * 删除评论
     *
     * @param comment
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     * type - 1: 因为存在被引用故填充为‘已删除’, 2: 完全删除~
     */
    public IResponse deleteComment(Comment comment, IRequest iRequest);

    /**
     * 手动发送系统消息, 只能由后台服务发，前台不能发
     *
     * @param sysMsg
     * @return IResponse:
     * status - 200：成功，400: 参数错误，500: 失败
     */
    public IResponse sendSystemMessage(SysMsg sysMsg);

    /**
     * 查询系统消息列表
     *
     * @param read_status 0 未读 1全部
     * @param iRequest
     * @return IResponse:
     * sysMsgs - 统消息列表
     */
    public IResponse findSysMsgList(int read_status, IRequest iRequest);

    /**
     * 清除系统消息未读状态
     *
     * @param smIdList
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，404：这些系统消息本来就已读或不存在，500: 失败
     */
    public IResponse updateSystemMessageListStatus(List<Long> smIdList, IRequest iRequest);

    /**
     * 删除系统消息
     *
     * @param smIdList
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，404：这些系统消息不存在~，500: 失败
     */
    public IResponse deleteSystemMessageList(List<Long> smIdList, IRequest iRequest);

    /**
     * 点赞评论
     *
     * @param comment  - 只需传cid
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    public IResponse likeComment(Comment comment, IRequest iRequest);

}
