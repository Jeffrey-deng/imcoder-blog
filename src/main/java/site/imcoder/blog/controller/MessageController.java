package site.imcoder.blog.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import site.imcoder.blog.Interceptor.GZIP;
import site.imcoder.blog.Interceptor.LoginRequired;
import site.imcoder.blog.entity.Comment;
import site.imcoder.blog.entity.Letter;
import site.imcoder.blog.entity.SysMsg;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.IMessageService;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * description: 消息控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("**/message.do")
public class MessageController extends BaseController {

    @Resource
    private IMessageService messageService;

    /**     -----------   letter start    ---------------    */

    /**
     * 发送私信
     *
     * @param letter
     * @param session
     * @return flag - 200：发送成功，401：需要登录，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=sendLetter")
    @ResponseBody
    public Map<String, Object> sendLetter(Letter letter, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = messageService.sendLetter(letter, loginUser);
        convertStatusCodeToWord(map);
        return map;
    }

    /**
     * 查询私信列表
     *
     * @param read_status 0 未读 ，1全部
     * @param session
     * @return
     */
    @LoginRequired(content = "")
    @RequestMapping(params = "method=listLetter")
    @ResponseBody
    public List<Letter> listLetter(int read_status, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (loginUser != null) {
            return messageService.findLetterList(loginUser, read_status);
        } else {
            return null;
        }
    }

    /**
     * 删除私信
     *
     * @param letter
     * @param session
     * @return flag - 200：发送成功，401：需要登录，404: 无此私信，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=deleteLetter")
    @ResponseBody
    public Map<String, Object> deleteLetter(Letter letter, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = messageService.deleteLetter(letter, loginUser);
        map.put(KEY_STATUS, flag);
        convertStatusCodeToWord(map);
        return map;
    }

    /**
     * 清除私信消息未读状态
     *
     * @param leids   数组
     * @param session
     */
    @LoginRequired
    @RequestMapping(params = "method=clearLetterListStatus")
    @ResponseBody
    public Map<String, Object> clearLetterListStatus(@RequestParam("leids") ArrayList<Integer> leids, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        if (leids != null) {
            User loginUser = (User) session.getAttribute("loginUser");
            int flag = messageService.updateLetterListStatus(leids, loginUser);
            map.put(KEY_STATUS, flag);
            convertStatusCodeToWord(map);
        } else {
            map.put(KEY_STATUS, 400);
            map.put(KEY_STATUS_FRIENDLY, "参数错误");
        }
        return map;
    }

    /**     -----------   letter end    ---------------    */

    /**     ----------   comment start    ----------------    */

    /**
     * 添加评论
     *
     * @param comment
     * @param session
     * @return
     */
    @LoginRequired
    @RequestMapping(params = "method=addComment")
    @ResponseBody
    public Map<String, Object> addComment(Comment comment, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = messageService.addComment(comment, loginUser);
        int flag = (int) map.get(KEY_STATUS);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "评论添加成功");
        } else if (flag == 404) {
            if (comment != null && comment.getParentId() > 0) {
                map.put(KEY_STATUS_FRIENDLY, "文章或回复的评论不存在");
            } else {
                map.put(KEY_STATUS_FRIENDLY, "文章不存在");
            }
        }
        convertStatusCodeToWord(map);
        return map;
    }

    /**
     * 请求评论列表
     *
     * @param comment
     * @param session
     * @return
     */
    @RequestMapping(params = "method=listComment")
    @ResponseBody
    public Map<String, Object> listComment(Comment comment, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = messageService.findCommentList(comment, loginUser);
        convertStatusCodeToWord(map);
        return map;
    }

    /**
     * 删除评论
     *
     * @param comment
     * @param session
     * @return flag - 200：成功，201：填充为‘已删除’，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=deleteComment")
    @ResponseBody
    public Map<String, Object> deleteComment(Comment comment, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = messageService.deleteComment(comment, loginUser);
        map.put(KEY_STATUS, flag);
        convertStatusCodeToWord(map);
        return map;
    }

    /**     ----------   comment end    ----------------    */

    /**     -----------   sys msg start   --------------    */

    /**
     * 查询系统消息列表
     *
     * @param read_status 0 未读 ，1全部
     * @param session
     * @return
     */
    @LoginRequired(content = "")
    @RequestMapping(params = "method=listSysMsg")
    @ResponseBody
    @GZIP
    public List<SysMsg> listSysMsg(int read_status, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (loginUser != null) {
            return messageService.findSysMsgList(loginUser, read_status);
        } else {
            return null;
        }
    }

    /**
     * 清除系统消息未读状态
     *
     * @param smids   数组
     * @param session
     */
    @LoginRequired
    @RequestMapping(params = "method=clearSysMsgListStatus")
    @ResponseBody
    public Map<String, Object> clearSystemMessageListStatus(@RequestParam("smids") ArrayList<Integer> smids, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        if (smids != null) {
            User loginUser = (User) session.getAttribute("loginUser");
            int flag = messageService.updateSystemMessageListStatus(smids, loginUser);
            map.put(KEY_STATUS, flag);
            convertStatusCodeToWord(map);
        } else {
            map.put(KEY_STATUS, 400);
            map.put(KEY_STATUS_FRIENDLY, "参数错误");
        }
        return map;
    }

    /**
     * 批量删除系统消息
     *
     * @param smids   数组
     * @param session
     */
    @LoginRequired
    @RequestMapping(params = "method=deleteSysMsgList")
    @ResponseBody
    public Map<String, Object> deleteSystemMessageList(@RequestParam("smids") ArrayList<Integer> smids, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        if (smids != null) {
            User loginUser = (User) session.getAttribute("loginUser");
            int flag = messageService.deleteSystemMessageList(smids, loginUser);
            map.put(KEY_STATUS, flag);
            convertStatusCodeToWord(map);
        } else {
            map.put(KEY_STATUS, 400);
            map.put(KEY_STATUS_FRIENDLY, "参数错误");
        }
        return map;
    }

    /**     -----------   sys msg end    -------------    */

    /**
     * 查询所有未读消息
     *
     * @param session
     * @return
     */
    @LoginRequired(content = "")
    @RequestMapping(params = "method=listUnreadMsg")
    @ResponseBody
    public Map<String, Object> listUnreadMsg(HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = new HashMap<String, Object>();
        if (loginUser != null) {
            map.put("letters", messageService.findLetterList(loginUser, 0));
            map.put("sysMsgs", messageService.findSysMsgList(loginUser, 0));
            return map;
        } else {
            return null;
        }
    }
}
