package site.imcoder.blog.entity;

import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFill;
import site.imcoder.blog.controller.formatter.urlprefix.impl.VideoURLPrefixFiller;
import site.imcoder.blog.controller.propertyeditors.annotation.EmojiConvert;
import site.imcoder.blog.entity.rewrite.VideoSetting;

import java.io.Serializable;
import java.util.Date;
import java.util.List;

/**
 * @author Jeffrey.Deng
 */
public class Video implements Serializable {

    private static final long serialVersionUID = -440348456487975266L;

    /**
     * 视频ID
     */
    @PrimaryKeyConvert
    private Long video_id;

    /**
     * 上传用户
     */
    private User user;

    /**
     * 视频封面
     */
    private Photo cover;

    /**
     * 视频名称
     */
    @EmojiConvert //转义emoji表情
    private String name;

    /**
     * 视频说明
     */
    @EmojiConvert //转义emoji表情
    private String description;

    /**
     * 标签
     */
    private String tags;

    /**
     * 是否 Live Photo ，0/1
     */
    private Integer live_photo;

    /**
     * 视频源的类型：
     * 0：本地源
     * 1：引用链接
     * 2：引用代码块（frame等）
     */
    private Integer source_type;

    /**
     * 视频路径
     */
    @URLPrefixFill(using = VideoURLPrefixFiller.class, prefixConfigKey = URLPrefixFill.DEFAULT_CLOUD_PREFIX)
    private String path;

    /**
     * 视频引用代码块
     */
    private String code;

    /**
     * 视频宽
     */
    private int width;

    /**
     * 视频高
     */
    private int height;

    /**
     * 视频大小，单位MiB
     */
    private float size;

    /**
     * 视频类型
     */
    private String video_type;

    /**
     * 上传时间
     */
    @TimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date upload_time;

    /**
     * 上传时的原始文件名
     */
    @EmojiConvert //转义emoji表情
    private String originName;

    /**
     * 来源相关页面
     */
    private String refer;

    /**
     * 字幕集合
     */
    private List<Subtitle> subtitles;

    /**
     * 点击量
     */
    private int click_count;

    /**
     * 点赞量
     */
    private int like_count;

    /**
     * 评论量
     */
    private int comment_count;

    /**
     * 查看权限 0：公开 ， 1：好友， 2：私有
     */
    private int permission;

    /**
     * 登录用户是否访问过该视频
     */
    private Boolean accessed;

    /**
     * 登录用户是否赞过该频
     */
    private Boolean liked;

    /**
     * 登录用户是否评论过该频
     */
    private Boolean commented;

    /**
     * 视频的一些追加设置
     */
    private VideoSetting setting;

    public Video() {

    }

    public Video(Long video_id) {
        this.video_id = video_id;
    }

    public Long getVideo_id() {
        return video_id;
    }

    public void setVideo_id(Long video_id) {
        this.video_id = video_id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Photo getCover() {
        return cover;
    }

    public void setCover(Photo cover) {
        this.cover = cover;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public Integer getLive_photo() {
        return live_photo;
    }

    public void setLive_photo(Integer live_photo) {
        this.live_photo = live_photo;
    }

    public Integer getSource_type() {
        return source_type;
    }

    public void setSource_type(Integer source_type) {
        this.source_type = source_type;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public int getWidth() {
        return width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public float getSize() {
        return size;
    }

    public void setSize(float size) {
        this.size = size;
    }

    public String getVideo_type() {
        return video_type;
    }

    public void setVideo_type(String video_type) {
        this.video_type = video_type;
    }

    public Date getUpload_time() {
        return upload_time;
    }

    public void setUpload_time(Date upload_time) {
        this.upload_time = upload_time;
    }

    public String getOriginName() {
        return originName;
    }

    public void setOriginName(String originName) {
        this.originName = originName;
    }

    public String getRefer() {
        return refer;
    }

    public void setRefer(String refer) {
        this.refer = refer;
    }

    public List<Subtitle> getSubtitles() {
        return subtitles;
    }

    public void setSubtitles(List<Subtitle> subtitles) {
        this.subtitles = subtitles;
    }

    public int getClick_count() {
        return click_count;
    }

    public void setClick_count(int click_count) {
        this.click_count = click_count;
    }

    public int getLike_count() {
        return like_count;
    }

    public void setLike_count(int like_count) {
        this.like_count = like_count;
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

    public Boolean getAccessed() {
        return accessed;
    }

    public void setAccessed(Boolean accessed) {
        this.accessed = accessed;
    }

    public Boolean getLiked() {
        return liked;
    }

    public void setLiked(Boolean liked) {
        this.liked = liked;
    }

    public Boolean getCommented() {
        return commented;
    }

    public void setCommented(Boolean commented) {
        this.commented = commented;
    }

    public VideoSetting getSetting() {
        return setting;
    }

    public void setSetting(VideoSetting setting) {
        this.setting = setting;
    }
}
