package site.imcoder.blog.entity;

import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFill;
import site.imcoder.blog.controller.formatter.urlprefix.impl.ImgTagURLPrefixFiller;
import site.imcoder.blog.controller.propertyeditors.annotation.EmojiConvert;

import java.io.Serializable;
import java.util.Date;

/**
 * description: 文章类
 *
 * @author dengchao
 * @date 2016-9-1
 */
public class Article implements Serializable {

    private static final long serialVersionUID = -744480313377931423L;

    /**
     * 文章id
     */
    @PrimaryKeyConvert
    private Long aid;

    /**
     * 文章标题
     */
    @EmojiConvert //转义emoji表情
    private String title;

    /**
     * 作者信息
     */
    private User author;

    /**
     * 文章类型
     */
    private Category category;

    /**
     * 标签
     */
    private String tags;

    /**
     * 摘要
     */
    @EmojiConvert //转义emoji表情
    @URLPrefixFill(using = ImgTagURLPrefixFiller.class, prefixConfigKey = URLPrefixFill.DEFAULT_CDN_PREFIX)
    private String summary;

    /**
     * 发布时间
     */
    @TimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date create_time;

    /**
     * 更新时间
     */
    @TimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date update_time;

    /**
     * 点击量
     */
    private int click_count;

    /**
     * 收藏数
     */
    private int collect_count;

    /**
     * 评论数
     */
    private int comment_count;

    /**
     * 文章的查看权限，{@link site.imcoder.blog.common.type.PermissionType}
     */
    private int permission;

    /**
     * 是否置顶:0为否，1为是
     */
    private int top;

    /**
     * 是否博主推荐:0为否，1为是
     */
    private int recommend;

    /**
     * 文章详情
     */
    @EmojiConvert //转义emoji表情
    @URLPrefixFill(using = ImgTagURLPrefixFiller.class, prefixConfigKey = URLPrefixFill.DEFAULT_CDN_PREFIX)
    private String detail;

    /**
     * 登录用户是否访问过该文章
     */
    private Boolean accessed;

    /**
     * 登录用户是否收藏过该文章
     */
    private Boolean collected;

    /**
     * 登录用户是否评论过该文章
     */
    private Boolean commented;

    public Article() {
    }

    public Article(Long aid) {
        this.aid = aid;
    }

    public Long getAid() {
        return aid;
    }

    public void setAid(Long aid) {
        this.aid = aid;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public User getAuthor() {
        return author;
    }

    public void setAuthor(User author) {
        this.author = author;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public Date getCreate_time() {
        return create_time;
    }

    public void setCreate_time(Date create_time) {
        this.create_time = create_time;
    }

    public Date getUpdate_time() {
        return update_time;
    }

    public void setUpdate_time(Date update_time) {
        this.update_time = update_time;
    }

    public int getClick_count() {
        return click_count;
    }

    public void setClick_count(int click_count) {
        this.click_count = click_count;
    }

    public int getCollect_count() {
        return collect_count;
    }

    public void setCollect_count(int collect_count) {
        this.collect_count = collect_count;
    }

    public int getComment_count() {
        return comment_count;
    }

    public void setComment_count(int comment_count) {
        this.comment_count = comment_count;
    }

    public int getPermission() {
        return permission;
    }

    public void setPermission(int permission) {
        this.permission = permission;
    }

    public int getTop() {
        return top;
    }

    public void setTop(int top) {
        this.top = top;
    }

    public int getRecommend() {
        return recommend;
    }

    public void setRecommend(int recommend) {
        this.recommend = recommend;
    }

    public String getDetail() {
        return detail;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }

    public Boolean getAccessed() {
        return accessed;
    }

    public void setAccessed(Boolean accessed) {
        this.accessed = accessed;
    }

    public Boolean getCollected() {
        return collected;
    }

    public void setCollected(Boolean collected) {
        this.collected = collected;
    }

    public Boolean getCommented() {
        return commented;
    }

    public void setCommented(Boolean commented) {
        this.commented = commented;
    }
}
