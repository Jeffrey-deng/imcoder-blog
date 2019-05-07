package site.imcoder.blog.entity;

import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;
import site.imcoder.blog.controller.propertyeditors.annotation.EmojiConvert;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

/**
 * 相册实体类
 *
 * @author Jeffrey.Deng
 * @date 2018/1/5
 */
public class Album implements Serializable {

    private static final long serialVersionUID = 5400452065266800725L;

    /**
     * 相册ID
     */
    @PrimaryKeyConvert
    private Long album_id;

    /**
     * 用户
     */
    private User user;

    /**
     * 相册名称
     */
    @EmojiConvert //转义emoji表情
    private String name;

    /**
     * 相册说明
     */
    @EmojiConvert //转义emoji表情
    private String description;

    /**
     * 封面图片, photo对象
     */
    private Photo cover;

    /**
     * 创建时间
     */
    // @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    @TimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date create_time;

    /**
     * 查看权限 0：公开 ， 1：好友， 2：私有
     */
    private int permission;

    /**
     * <pre>
     * 挂载的标签名称
     * 可用前缀标识使用哪种搜索
     *  “tagWrapper:” - 使用 {@link PhotoTagWrapper#name}
     *  “tag:”- 使用 {@link Photo#tags} ，支持搜索语法
     *  不填前缀，优先搜索 {@link PhotoTagWrapper#name} ，无结果再使用 {@link Photo#tags} 搜索
     * </pre>
     */
    private String mount;

    /**
     * 照片数量
     */
    private int size;

    /**
     * 一行显示图片的数量
     */
    private int show_col;

    /**
     * 该相册下照片集合
     */
    private List<Photo> photos;

    public Album() {
    }

    public Album(Long album_id) {
        this.album_id = album_id;
    }

    public Album(Long album_id, String name) {
        this.album_id = album_id;
        this.name = name;
    }

    /**
     * 添加照片
     *
     * @param photo
     */
    public void addPhoto(Photo photo) {
        if (photos == null) {
            photos = new ArrayList<Photo>();
        }
        photos.add(photo);
    }

    /**
     * 移除照片
     *
     * @param photo
     */
    public void removePhoto(Photo photo) {
        if (photos == null) {
            return;
        }
        Iterator<Photo> iterator = photos.iterator();
        while (iterator.hasNext()) {
            Photo p = iterator.next();
            if (p.getPhoto_id().equals(photo.getPhoto_id())) {
                iterator.remove();
            }
        }
    }

    public List<Photo> getPhotos() {
        return photos;
    }

    public void setPhotos(List<Photo> photos) {
        this.photos = photos;
    }

    public Long getAlbum_id() {
        return album_id;
    }

    public void setAlbum_id(Long album_id) {
        this.album_id = album_id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public Photo getCover() {
        return cover;
    }

    public void setCover(Photo cover) {
        this.cover = cover;
    }

    public Date getCreate_time() {
        return create_time;
    }

    public void setCreate_time(Date create_time) {
        this.create_time = create_time;
    }

    public int getPermission() {
        return permission;
    }

    public void setPermission(int permission) {
        this.permission = permission;
    }

    public String getMount() {
        return mount;
    }

    public void setMount(String mount) {
        this.mount = mount;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public int getShow_col() {
        return show_col;
    }

    public void setShow_col(int column) {
        this.show_col = column;
    }
}
