package site.imcoder.blog.entity;

import site.imcoder.blog.common.type.CommentType;
import site.imcoder.blog.controller.formatter.general.GeneralConvert;
import site.imcoder.blog.controller.formatter.general.impl.EscapeEmojiConverter;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFill;
import site.imcoder.blog.controller.formatter.urlprefix.impl.ImgTagURLPrefixFiller;
import site.imcoder.blog.controller.propertyeditors.annotation.EmojiConvert;

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
    private Long cid;

    /**
     * 评论对象主体类型（文章?照片?视频?）
     * 参考 {@link CommentType}
     */
    private int mainType;

    /**
     * 评论对象主体ID（文章id?照片id?视频id?）
     */
    @PrimaryKeyConvert
    private Long mainId;

    /**
     * 该评论所有者
     */
    private User user;

    /**
     * 该评论回复的评论id
     * 如果为0，则是回复文章
     */
    private Long parentId;

    /**
     * 评论内容
     */
    @EmojiConvert //转义emoji表情
    @URLPrefixFill(using = ImgTagURLPrefixFiller.class, prefixConfigKey = URLPrefixFill.DEFAULT_CLOUD_PREFIX)
    private String content;

    /**
     * 该评论回复的评论的用户id
     * 无须从数据查出，仅用来保存在客户端上传评论时携带uid
     * 直接回复主体为作者id,回复评论为用户id
     */
    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long replyUid;

    /**
     * 发送时间
     */
    @TimeFormat(pattern = "yyyy-MM-dd | HH:mm:ss")
    private Long send_time;

    /**
     * 是否匿名评论，0：不匿名，1：匿名
     */
    private int anonymous;

    /**
     * 点赞的次数
     */
    private int like_count;

    /**
     * 登录用户是否赞过该评论
     */
    private Boolean liked;

    public Comment() {
    }

    public Comment(Long cid, int mainType) {
        this.cid = cid;
        this.mainType = mainType;
    }

    public Comment(Long cid) {
        this.cid = cid;
        this.mainType = CommentType.ARTICLE.value;
    }

    public Long getCid() {
        return cid;
    }

    public void setCid(Long cid) {
        this.cid = cid;
    }

    public int getMainType() {
        return mainType;
    }

    public void setMainType(int mainType) {
        this.mainType = mainType;
    }

    public Long getMainId() {
        return mainId;
    }

    public void setMainId(Long mainId) {
        this.mainId = mainId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public Long getReplyUid() {
        return replyUid;
    }

    public void setReplyUid(Long replyUid) {
        this.replyUid = replyUid;
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

    public int getLike_count() {
        return like_count;
    }

    public void setLike_count(int like_count) {
        this.like_count = like_count;
    }

    public Boolean getLiked() {
        return liked;
    }

    public void setLiked(Boolean liked) {
        this.liked = liked;
    }
}
