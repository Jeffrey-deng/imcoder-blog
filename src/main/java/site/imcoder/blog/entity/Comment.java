package site.imcoder.blog.entity;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import site.imcoder.blog.common.type.CommentType;
import site.imcoder.blog.controller.json.EscapeEmojiJsonDeserializer;
import site.imcoder.blog.controller.json.LongToDateStrJsonSerializer;
import site.imcoder.blog.controller.propertyeditors.EmojiConvert;

import java.io.Serializable;

/**
 * description: 评论
 *
 * @author dengchao
 * @date 2016-9-9
 */
public class Comment implements Serializable {

    private static final long serialVersionUID = 2963202692398506374L;

    /**
     * 评论ID
     */
    private int cid;

    /**
     * 评论对象主体类型（文章?照片?视频?）
     * 参考 {@link CommentType}
     */
    private int mainType;

    /**
     * 评论对象主体ID（文章id?照片id?视频id?）
     */
    private int mainId;

    /**
     * 该评论所有者
     */
    private User user;

    /**
     * 该评论回复的评论id
     * 如果为0，则是回复文章
     */
    private int parentId;

    /**
     * 该评论回复的评论的用户id
     * 无须从数据查出，仅用来保存在客户端上传评论时携带uid
     * 直接回复主体为作者id,回复评论为用户id
     */
    private int replyUid;

    /**
     * 评论内容
     */
    @JsonDeserialize(using = EscapeEmojiJsonDeserializer.class) // 转义emoji表情
    @EmojiConvert
    private String content;

    /**
     * 发送时间
     */
    private Long send_time;

    /**
     * 是否匿名评论，0：不匿名，1：匿名
     */
    private int anonymous;

    public Comment() {
    }

    public Comment(int cid, int mainType) {
        this.cid = cid;
        this.mainType = mainType;
    }

    public Comment(int cid) {
        this.cid = cid;
        this.mainType = CommentType.ARTICLE.value;
    }

    public int getCid() {
        return cid;
    }

    public void setCid(int cid) {
        this.cid = cid;
    }

    public int getMainType() {
        return mainType;
    }

    public void setMainType(int mainType) {
        this.mainType = mainType;
    }

    public int getMainId() {
        return mainId;
    }

    public void setMainId(int mainId) {
        this.mainId = mainId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    //格式化时间
    @JsonSerialize(using = LongToDateStrJsonSerializer.class)
    public Long getSend_time() {
        return send_time;
    }

    public void setSend_time(Long send_time) {
        this.send_time = send_time;
    }

    public static long getSerialversionuid() {
        return serialVersionUID;
    }

    public int getParentId() {
        return parentId;
    }

    public void setParentId(int parentId) {
        this.parentId = parentId;
    }

    public int getReplyUid() {
        return replyUid;
    }

    public void setReplyUid(int replyUid) {
        this.replyUid = replyUid;
    }

    public int getAnonymous() {
        return anonymous;
    }

    public void setAnonymous(int anonymous) {
        this.anonymous = anonymous;
    }

    /**
     * 该条评论是否是匿名的
     *
     * @return
     */
    public boolean typeOfAnonymous() {
        return this.anonymous != 0;
    }

    @Override
    public String toString() {
        return "Comment{" +
                "cid=" + cid +
                ", mainType=" + mainType +
                ", mainId=" + mainId +
                ", user=" + user +
                ", parentId=" + parentId +
                ", replyUid=" + replyUid +
                ", content='" + content + '\'' +
                ", send_time=" + send_time +
                ", anonymous=" + anonymous +
                '}';
    }
}
