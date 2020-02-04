package site.imcoder.blog.controller.api;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import site.imcoder.blog.Interceptor.annotation.GZIP;
import site.imcoder.blog.Interceptor.annotation.LoginRequired;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.entity.Comment;
import site.imcoder.blog.entity.Letter;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.rewrite.CommentActionRecord;
import site.imcoder.blog.service.IMessageService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;
import java.util.ArrayList;

/**
 * description: 消息控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/message.api")
public class MessageApiController extends BaseController {

    @Resource
    private IMessageService messageService;

    /**     -----------   letter start    ---------------    */

    /**
     * 发送私信
     *
     * @param letter
     * @param iRequest
     * @return IResponse:
     * status - 200：发送成功，401：需要登录，500: 失败
     * letter: 私信对象
     */
    @LoginRequired
    @RequestMapping(params = "method=sendLetter")
    @ResponseBody
    public IResponse sendLetter(Letter letter, IRequest iRequest) {
        return messageService.sendLetter(letter, iRequest);
    }

    /**
     * 查询私信列表
     *
     * @param read_status 0 未读 ，1全部
     * @param iRequest
     * @return IResponse:
     * letters - 私信列表
     */
    @LoginRequired
    @RequestMapping(params = "method=getLetterList")
    @ResponseBody
    public IResponse getLetterList(int read_status, IRequest iRequest) {
        return messageService.findLetterList(read_status, iRequest);
    }

    /**
     * 删除私信
     *
     * @param letter
     * @param iRequest
     * @return IResponse:
     * status - 200：删除成功，401：需要登录，404: 无此私信，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=deleteLetter")
    @ResponseBody
    public IResponse deleteLetter(Letter letter, IRequest iRequest) {
        return messageService.deleteLetter(letter, iRequest);
    }

    /**
     * 清除私信消息未读状态
     *
     * @param leids    数组
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，404：这些私信本来就已读或不存在，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=clearLetterListStatus")
    @ResponseBody
    public IResponse clearLetterListStatus(@RequestParam("leids") ArrayList<Integer> leids, IRequest iRequest) {
        return messageService.updateLetterListStatus(leids, iRequest);
    }

    /**     -----------   letter end    ---------------    */

    /**     ----------   comment start    ----------------    */

    /**
     * 添加评论
     *
     * @param comment
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，500: 失败
     * comment 对象
     */
    @LoginRequired
    @RequestMapping(params = "method=addComment")
    @ResponseBody
    public IResponse addComment(Comment comment, IRequest iRequest) {
        return messageService.addComment(comment, iRequest);
    }

    /**
     * 请求评论列表
     *
     * @param comment
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，500: 失败
     * comments - 评论列表
     */
    @RequestMapping(params = "method=getCommentList")
    @ResponseBody
    public IResponse getCommentList(Comment comment, IRequest iRequest, HttpSession session) {
        // todo：以后再优化
        if (!iRequest.isHasLoggedIn()) {
            iRequest.setLoginUser((User) session.getAttribute(KEY_GUEST_USER));
        }
        return messageService.findCommentList(comment, iRequest);
    }

    /**
     * 删除评论
     *
     * @param comment
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     * type - 1: 因为存在被引用故填充为‘已删除’, 2: 完全删除~
     */
    @LoginRequired
    @RequestMapping(params = "method=deleteComment")
    @ResponseBody
    public IResponse deleteComment(Comment comment, IRequest iRequest) {
        return messageService.deleteComment(comment, iRequest);
    }

    /**
     * 点赞评论
     *
     * @param comment  - 只需传cid
     * @param undo     - true: 取消赞，false: 赞
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    @RequestMapping(params = "method=likeComment")
    @ResponseBody
    public IResponse likeComment(Comment comment, @RequestParam(defaultValue = "false") boolean undo, IRequest iRequest) {
        return messageService.likeComment(comment, undo, iRequest);
    }

    /**
     * 查询评论的用户动作记录
     *
     * @param comment
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * commentActionRecords
     * comment_action_record_count
     */
    @RequestMapping(params = "method=getCommentActionRecordList")
    @ResponseBody
    @GZIP
    public IResponse getCommentActionRecordList(Comment comment, IRequest iRequest) {
        return messageService.findCommentActionRecordList(comment, iRequest);
    }

    /**     ----------   comment end    ----------------    */

    /**     -----------   sys msg start   --------------    */

    /**
     * 查询系统消息列表
     *
     * @param read_status 0 未读 ，1全部
     * @param iRequest
     * @return IResponse:
     * sysMsgs - 统消息列表
     */
    @LoginRequired
    @RequestMapping(params = "method=getSysMsgList")
    @ResponseBody
    @GZIP
    public IResponse getSysMsgList(int read_status, IRequest iRequest) {
        return messageService.findSysMsgList(read_status, iRequest);
    }

    /**
     * 批量清除系统消息未读状态
     *
     * @param smids 数组
     * @return IResponse:
     * status - 200：成功，404：这些系统消息本来就已读或不存在，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=clearSysMsgListStatus")
    @ResponseBody
    public IResponse clearSystemMessageListStatus(@RequestParam("smids") ArrayList<Long> smids, IRequest iRequest) {
        return messageService.updateSystemMessageListStatus(smids, iRequest);
    }

    /**
     * 批量删除系统消息
     *
     * @param smids 数组
     * @return IResponse:
     * status - 200：成功，404：这些系统消息不存在~，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=deleteSysMsgList")
    @ResponseBody
    public IResponse deleteSystemMessageList(@RequestParam("smids") ArrayList<Long> smids, IRequest iRequest) {
        return messageService.deleteSystemMessageList(smids, iRequest);
    }

    /**     -----------   sys msg end    -------------    */

    /**
     * 查询所有未读消息
     *
     * @param iRequest
     * @return IResponse:
     * letters -
     * sysMsgs -
     */
    @LoginRequired
    @RequestMapping(params = "method=getUnreadMsgList")
    @ResponseBody
    public IResponse getUnreadMsgList(IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasLoggedIn()) {
            response.putAttr("letters", messageService.findLetterList(0, iRequest).getAttr("letters"));
            response.putAttr("sysMsgs", messageService.findSysMsgList(0, iRequest).getAttr("sysMsgs"));
            return response.setStatus(STATUS_SUCCESS);
        } else {
            return response.setStatus(STATUS_NOT_LOGIN);
        }
    }
}
