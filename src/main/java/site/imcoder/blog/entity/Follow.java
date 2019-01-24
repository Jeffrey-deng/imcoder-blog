package site.imcoder.blog.entity;

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
    private int fwid;

    /**
     * 用户id
     */
    private int uid;

    /**
     * 用户关注的id
     */
    private int fuid;

    public Follow() {
    }

    public Follow(int uid, int fuid) {
        this.uid = uid;
        this.fuid = fuid;
    }

    public int getFwid() {
        return fwid;
    }

    public void setFwid(int fwid) {
        this.fwid = fwid;
    }

    public int getUid() {
        return uid;
    }

    public void setUid(int uid) {
        this.uid = uid;
    }

    public int getFuid() {
        return fuid;
    }

    public void setFuid(int fuid) {
        this.fuid = fuid;
    }


}
