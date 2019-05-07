package site.imcoder.blog.entity;

import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFill;
import site.imcoder.blog.controller.formatter.urlprefix.impl.ImgTagURLPrefixFiller;
import site.imcoder.blog.controller.propertyeditors.annotation.EmojiConvert;

import java.io.Serializable;

/**
 * description: 私信表
 *
 * @author dengchao
 * @date 2016-9-11
 */
public class Letter implements Serializable {

    private static final long serialVersionUID = -6525783722879412058L;

    /**
     * 私信ID
     */
    private Long leid;

    /**
     * 私信发送者ID
     */
    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long s_uid;

    /**
     * 私信接收者ID
     */
    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long r_uid;

    /**
     * 该查询者聊天对象的资料(不必须是消息发送者)
     */
    private User chatUser;

    /**
     * 私信内容
     */
    @EmojiConvert //转义emoji表情
    @URLPrefixFill(using = ImgTagURLPrefixFiller.class, prefixConfigKey = URLPrefixFill.DEFAULT_CLOUD_PREFIX)
    private String content;

    /**
     * 私信时间
     */
    @TimeFormat(pattern = "yyyy-MM-dd | HH:mm:ss")
    private Long send_time;

    /**
     * 是否已经被阅读
     * 0：未读
     * 1：已读
     */
    private int status;

    public Long getLeid() {
        return leid;
    }

    public void setLeid(Long leid) {
        this.leid = leid;
    }

    public Long getS_uid() {
        return s_uid;
    }

    public void setS_uid(Long s_uid) {
        this.s_uid = s_uid;
    }

    public Long getR_uid() {
        return r_uid;
    }

    public void setR_uid(Long r_uid) {
        this.r_uid = r_uid;
    }

    public User getChatUser() {
        return chatUser;
    }

    public void setChatUser(User chatUser) {
        this.chatUser = chatUser;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getSend_time() {
        return send_time;
    }

    public void setSend_time(Long send_time) {
        this.send_time = send_time;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }
}
