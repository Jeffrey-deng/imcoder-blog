package site.imcoder.blog.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFill;
import site.imcoder.blog.controller.propertyeditors.annotation.EmojiConvert;

import java.io.Serializable;
import java.util.Date;

/**
 * 照片实体类
 *
 * @author Jeffrey.Deng
 * @date 2018/1/5
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Photo implements Serializable {

    private static final long serialVersionUID = -4593648958985805003L;

    /**
     * 照片ID
     */
    @PrimaryKeyConvert
    private Long photo_id;

    /**
     * 所属相册ID
     */
    @PrimaryKeyConvert
    private Long album_id;

    /**
     * 照片合集
     */
    private PhotoTagWrapper topic;

    /**
     * 用户ID
     */
    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long uid;

    /**
     * 照片名字
     */
    @EmojiConvert //转义emoji表情
    private String name;

    /**
     * 照片存储路径，相对路径
     */
    @URLPrefixFill(prefixConfigKey = URLPrefixFill.DEFAULT_CLOUD_PREFIX)
    private String path;

    /**
     * 照片描述
     */
    @EmojiConvert //转义emoji表情
    private String description;

    /**
     * 照片标签，以#隔开
     */
    private String tags;

    /**
     * 上传时间
     */
    @TimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date upload_time;

    /**
     * 宽度，单位px
     */
    private int width;

    /**
     * 高度，单位px
     */
    private int height;

    /**
     * 文件大小，单位KB
     */
    private int size;

    /**
     * 16进制编码md5值
     */
    private String md5;

    /**
     * 图片类型
     */
    private String image_type;

    /**
     * 上传时的原始文件名
     */
    @EmojiConvert //转义emoji表情
    private String originName;

    /**
     * 照片的相关链接
     */
    private String refer;

    /**
     * 排序权重
     */
    private Long sort;

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
     * 登录用户是否访问过该照片
     */
    private Boolean accessed;

    /**
     * 登录用户是否赞过该照片
     */
    private Boolean liked;

    /**
     * 登录用户是否评论过该照片
     */
    private Boolean commented;

    public Photo() {
    }

    public Photo(Long photo_id) {
        this.photo_id = photo_id;
    }

    public Long getPhoto_id() {
        return photo_id;
    }

    public void setPhoto_id(Long photo_id) {
        this.photo_id = photo_id;
    }

    public Long getAlbum_id() {
        return album_id;
    }

    public void setAlbum_id(Long album_id) {
        this.album_id = album_id;
    }

    public PhotoTagWrapper getTopic() {
        return topic;
    }

    public void setTopic(PhotoTagWrapper topic) {
        this.topic = topic;
    }

    public Long getUid() {
        return uid;
    }

    public void setUid(Long uid) {
        this.uid = uid;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
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

    public Date getUpload_time() {
        return upload_time;
    }

    public void setUpload_time(Date upload_time) {
        this.upload_time = upload_time;
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

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public String getMd5() {
        return md5;
    }

    public void setMd5(String md5) {
        this.md5 = md5;
    }

    public String getImage_type() {
        return image_type;
    }

    public void setImage_type(String image_type) {
        this.image_type = image_type;
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

    public Long getSort() {
        return sort;
    }

    public void setSort(Long sort) {
        this.sort = sort;
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
}
