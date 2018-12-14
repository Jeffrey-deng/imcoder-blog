package site.imcoder.blog.entity;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.io.Serializable;
import java.util.Date;

/**
 * Created by Jeffrey.Deng on 2018/1/5.
 * 照片实体类
 */
public class Photo implements Serializable {

    /**
     * 照片ID
     */
    private int photo_id;

    /**
     * 所属相册ID
     */
    private int album_id;

    /**
     * 用户ID
     */
    private int uid;

    /**
     * 照片名字
     */
    private String name;

    /**
     * 照片存储路径
     */
    private String path;

    /**
     * 照片描述
     */
    private String description;

    /**
     * 照片标签，已#隔开
     */
    private String tags;

    /**
     * 上传时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
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
     * 图片类型
     */
    private String image_type;

    /**
     * 是否为相册封面，0：不是，1：是
     */
    private int iscover;

    /**
     * 上传时的原始文件名
     */
    private String originName;

    public int getPhoto_id() {
        return photo_id;
    }

    public void setPhoto_id(int photo_id) {
        this.photo_id = photo_id;
    }

    public int getAlbum_id() {
        return album_id;
    }

    public void setAlbum_id(int album_id) {
        this.album_id = album_id;
    }

    public int getUid() {
        return uid;
    }

    public void setUid(int uid) {
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

    public String getImage_type() {
        return image_type;
    }

    public void setImage_type(String image_type) {
        this.image_type = image_type;
    }

    public int getIscover() {
        return iscover;
    }

    public void setIscover(int iscover) {
        this.iscover = iscover;
    }

    public String getOriginName() {
        return originName;
    }

    public void setOriginName(String originName) {
        this.originName = originName;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }
}
