package site.imcoder.blog.entity;

import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;

import java.io.Serializable;

/**
 * description: 系统消息实体
 *
 * @author dengchao
 * @date 2016-9-11
 */
public class SysMsg implements Serializable {

    private static final long serialVersionUID = -1479873806746563444L;

    private Long smid;

    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long uid;

    private String content;

    @TimeFormat(pattern = "yyyy-MM-dd | HH:mm:ss")
    private Long send_time;

    private int status;

    public SysMsg() {

    }

    public SysMsg(Long uid, String content, Long send_time, int status) {
        this.uid = uid;
        this.content = content;
        this.send_time = send_time;
        this.status = status;
    }

    public Long getSmid() {
        return smid;
    }

    public void setSmid(Long smid) {
        this.smid = smid;
    }

    public Long getUid() {
        return uid;
    }

    public void setUid(Long uid) {
        this.uid = uid;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getSend_time() {
        return send_time;
    }

    public void setSend_time(Long send_time) {
        this.send_time = send_time;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

}
