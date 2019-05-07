package site.imcoder.blog.entity;

import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;

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
    private Long frid;

    /**
     * 用户id
     */
    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long uid;

    /**
     * 好友id
     */
    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long fid;

    public Friend() {
    }

    public Friend(Long uid, Long fid) {
        this.uid = uid;
        this.fid = fid;
    }

    public Long getFrid() {
        return frid;
    }

    public void setFrid(Long frid) {
        this.frid = frid;
    }

    public Long getUid() {
        return uid;
    }

    public void setUid(Long uid) {
        this.uid = uid;
    }

    public Long getFid() {
        return fid;
    }

    public void setFid(Long fid) {
        this.fid = fid;
    }
}
