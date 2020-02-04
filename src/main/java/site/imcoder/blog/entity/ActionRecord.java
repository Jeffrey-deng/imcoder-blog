package site.imcoder.blog.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;

import java.io.Serializable;

/**
 * 动作记录
 *
 * @author Jeffrey.Deng
 * @date 2020-02-05
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ActionRecord<T extends Object> implements Serializable {

    private static final long serialVersionUID = 5200161996370993602L;

    /**
     * 动作的主键
     */
    private Long ar_id;

    /**
     * 动作的用户
     */
    private User user;

    /**
     * 动作ip，游客使用设置该值标记身份，注册用户此值为空
     */
    private String ip;

    /**
     * 动作的对象
     */
    private T creation;

    /**
     * 是否对creation赞过
     */
    private Boolean liked;

    /**
     * 赞的时间
     */
    @TimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Long like_at;

    /**
     * 是否对creation评论过
     */
    private Boolean commented;

    /**
     * 评论的时间
     */
    @TimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Long comment_at;

    /**
     * 是否对creation访问过
     */
    private Boolean accessed;

    /**
     * 访问的时间
     */
    @TimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Long access_at;

    /**
     * 访问详情
     */
    private AccessDetail accessDetail;

    public ActionRecord() {
    }

    public Long getAr_id() {
        return ar_id;
    }

    public void setAr_id(Long ar_id) {
        this.ar_id = ar_id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public T getCreation() {
        return creation;
    }

    public void setCreation(T creation) {
        this.creation = creation;
    }

    public Boolean getLiked() {
        return liked;
    }

    public void setLiked(Boolean liked) {
        this.liked = liked;
    }

    public Long getLike_at() {
        return like_at;
    }

    public void setLike_at(Long like_at) {
        this.like_at = like_at;
    }

    public Boolean getCommented() {
        return commented;
    }

    public void setCommented(Boolean commented) {
        this.commented = commented;
    }

    public Long getComment_at() {
        return comment_at;
    }

    public void setComment_at(Long comment_at) {
        this.comment_at = comment_at;
    }

    public Boolean getAccessed() {
        return accessed;
    }

    public void setAccessed(Boolean accessed) {
        this.accessed = accessed;
    }

    public Long getAccess_at() {
        return access_at;
    }

    public void setAccess_at(Long access_at) {
        this.access_at = access_at;
    }

    public AccessDetail getAccessDetail() {
        return accessDetail;
    }

    public void setAccessDetail(AccessDetail accessDetail) {
        this.accessDetail = accessDetail;
    }
}
