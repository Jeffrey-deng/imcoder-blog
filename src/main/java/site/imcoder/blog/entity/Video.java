package site.imcoder.blog.entity;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.io.Serializable;
import java.util.Date;

/**
 * @author Jeffrey.Deng
 */
public class Video implements Serializable {

    private static final long serialVersionUID = -440348456487975266L;

    /**
     * 视频ID
     */
    private int video_id;

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
    private String name;

    /**
     * 视频说明
     */
    private String description;

    /**
     * 标签
     */
    private String tags;

    /**
     * 视频源的类型：
     * 0：本地源
     * 1：引用链接
     * 2：引用代码块（frame等）
     */
    private int source_type;

    /**
     * 视频路径
     */
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
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date upload_time;

    /**
     * 上传时的原始文件名
     */
    private String originName;

    /**
     * 查看权限 0：公开 ， 1：好友， 2：私有
     */
    private int permission;

    public int getVideo_id() {
        return video_id;
    }

    public void setVideo_id(int video_id) {
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

    public int getSource_type() {
        return source_type;
    }

    public void setSource_type(int source_type) {
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

    public int getPermission() {
        return permission;
    }

    public void setPermission(int permission) {
        this.permission = permission;
    }
}
