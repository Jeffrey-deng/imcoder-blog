package site.imcoder.blog.entity;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import site.imcoder.blog.controller.json.LongToDateStrJsonSerializer;

import java.io.Serializable;

/**
 * description: 系统消息实体
 *
 * @author dengchao
 * @date 2016-9-11
 */
public class SysMsg implements Serializable {

    private static final long serialVersionUID = -1479873806746563444L;

    private int smid;

    private int uid;

    private String content;

    private Long send_time;

    private int status;

    public SysMsg() {

    }

    public SysMsg(int uid, String content, Long send_time, int status) {
        this.uid = uid;
        this.content = content;
        this.send_time = send_time;
        this.status = status;
    }

    public int getSmid() {
        return smid;
    }

    public void setSmid(int smid) {
        this.smid = smid;
    }

    public int getUid() {
        return uid;
    }

    public void setUid(int uid) {
        this.uid = uid;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    @JsonSerialize(using = LongToDateStrJsonSerializer.class)
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
