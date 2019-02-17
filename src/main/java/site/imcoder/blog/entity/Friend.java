package site.imcoder.blog.entity;

import java.io.Serializable;

/**
 * description: FRIENDS 表映射
 *
 * @author dengchao
 * @date 2017-4-13
 */
public class Friend implements Serializable {

    private static final long serialVersionUID = 7676702524167413369L;

    /**
     * friend 表 主键
     */
    private int frid;

    /**
     * 用户id
     */
    private int uid;

    /**
     * 好友id
     */
    private int fid;

    public Friend() {
    }

    public Friend(int uid, int fid) {
        this.uid = uid;
        this.fid = fid;
    }

    public int getFrid() {
        return frid;
    }

    public void setFrid(int frid) {
        this.frid = frid;
    }

    public int getUid() {
        return uid;
    }

    public void setUid(int uid) {
        this.uid = uid;
    }

    public int getFid() {
        return fid;
    }

    public void setFid(int fid) {
        this.fid = fid;
    }

}
