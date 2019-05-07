package site.imcoder.blog.entity;

import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;

import java.io.Serializable;

/**
 * description: USER_FOLLOW 表映射
 *
 * @author dengchao
 * @date 2017-4-13
 */
public class Follow implements Serializable {

    private static final long serialVersionUID = -4177029507883563139L;

    /**
     * user_follow 表 主键
     */
    private Long fwid;

    /**
     * 用户id
     */
    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long followerUid;

    /**
     * 用户关注的id
     */
    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long followingUid;

    public Follow() {
    }

    public Follow(Long followerUid, Long followingUid) {
        this.followerUid = followerUid;
        this.followingUid = followingUid;
    }

    public Long getFwid() {
        return fwid;
    }

    public void setFwid(Long fwid) {
        this.fwid = fwid;
    }

    public Long getFollowerUid() {
        return followerUid;
    }

    public void setFollowerUid(Long followerUid) {
        this.followerUid = followerUid;
    }

    public Long getFollowingUid() {
        return followingUid;
    }

    public void setFollowingUid(Long followingUid) {
        this.followingUid = followingUid;
    }
}
