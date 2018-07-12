package site.imcoder.blog.entity;

/**
 * @author Jeffrey.Deng
 */
public class Video {

    /**
     * 视频ID
     */
    private int video_id;

    /**
     * 视频名称
     */
    private String name;

    /**
     * 视频说明
     */
    private String description;

    /**
     * 上传用户
     */
    private User user;

    /**
     * 视频路径
     */
    private String path;

    /**
     * 视频封面
     */
    private Photo cover;

    /**
     * 视频大小
     */
    private int size;

    /**
     * 视频宽
     */
    private int width;

    /**
     * 视频高
     */
    private int height;

    /**
     * 查看权限 0：公开 ， 1：好友， 2：私有
     */
    private int permission;

    /**
     * 视频类型
     */
    private String video_type;

    /**
     * 上传时的原始文件名
     */
    private String originName;

    public int getVideo_id() {
        return video_id;
    }

    public void setVideo_id(int video_id) {
        this.video_id = video_id;
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Photo getCover() {
        return cover;
    }

    public void setCover(Photo cover) {
        this.cover = cover;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
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

    public int getPermission() {
        return permission;
    }

    public void setPermission(int permission) {
        this.permission = permission;
    }

    public String getVideo_type() {
        return video_type;
    }

    public void setVideo_type(String video_type) {
        this.video_type = video_type;
    }

    public String getOriginName() {
        return originName;
    }

    public void setOriginName(String originName) {
        this.originName = originName;
    }
}
