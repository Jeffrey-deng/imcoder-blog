package site.imcoder.blog.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;

import java.io.Serializable;
import java.util.Date;

/**
 * @author Jeffrey.Deng
 * @date 2016-10-04
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserStatus implements Serializable {

    private static final long serialVersionUID = 7121888562260870849L;

    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long uid;

    private Integer lock_status; // 锁定状态

    private String register_ip; // 注册ip

    @TimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date register_time; // 注册时间

    private String last_login_ip; //上次登陆IP

    @TimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date last_login_time;   // 上次登录时间

    public UserStatus() {

    }

    public UserStatus(Long uid, Integer lock_status, String register_ip, Date register_time) {
        this.uid = uid;
        this.lock_status = lock_status;
        this.register_ip = register_ip;
        this.register_time = register_time;
    }

    public Long getUid() {
        return uid;
    }

    public void setUid(Long uid) {
        this.uid = uid;
    }

    public Integer getLock_status() {
        return lock_status;
    }

    public void setLock_status(Integer lock_status) {
        this.lock_status = lock_status;
    }

    public String getRegister_ip() {
        return register_ip;
    }

    public void setRegister_ip(String register_ip) {
        this.register_ip = register_ip;
    }

    public Date getRegister_time() {
        return register_time;
    }

    public void setRegister_time(Date register_time) {
        this.register_time = register_time;
    }

    public String getLast_login_ip() {
        return last_login_ip;
    }

    public void setLast_login_ip(String last_login_ip) {
        this.last_login_ip = last_login_ip;
    }

    public Date getLast_login_time() {
        return last_login_time;
    }

    public void setLast_login_time(Date last_login_time) {
        this.last_login_time = last_login_time;
    }
}
