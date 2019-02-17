package site.imcoder.blog.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.io.Serializable;

/**
 * Created by Jeffrey.Deng on 2018/2/17.
 */
public class UserSetting implements Serializable {

    private static final long serialVersionUID = 1336765578106043573L;

    private int uid;

    /**
     * 是否接收通知的邮件
     * 0: 接收
     * 1：拒绝
     */
    private Integer receiveNotifyEmail;

    /**
     * 隐私资料可视级别
     * 0：全部公开
     * 1：好友
     * 2：全部不可见
     */
    private Integer profileViewLevel;

    /**
     * 主页背景图
     */
    private String pageBackground;

    public UserSetting() {
    }

    public UserSetting(int uid) {
        assignmentDefault(uid);
    }

    public UserSetting(int uid, Integer receiveNotifyEmail, Integer profileViewLevel, String pageBackground) {
        this.uid = uid;
        this.receiveNotifyEmail = receiveNotifyEmail;
        this.profileViewLevel = profileViewLevel;
        this.pageBackground = pageBackground;
    }

    public static long getSerialVersionUID() {
        return serialVersionUID;
    }

    public int getUid() {
        return uid;
    }

    public void setUid(int uid) {
        this.uid = uid;
    }

    public Integer getReceiveNotifyEmail() {
        return receiveNotifyEmail;
    }

    public void setReceiveNotifyEmail(Integer receiveNotifyEmail) {
        this.receiveNotifyEmail = receiveNotifyEmail;
    }

    public Integer getProfileViewLevel() {
        return profileViewLevel;
    }

    public void setProfileViewLevel(Integer profileViewLevel) {
        this.profileViewLevel = profileViewLevel;
    }

    public String getPageBackground() {
        return pageBackground;
    }

    public void setPageBackground(String pageBackground) {
        this.pageBackground = pageBackground;
    }

    public boolean isEnableReceiveNotifyEmail() {
        return this.receiveNotifyEmail == null || this.receiveNotifyEmail == 0;
    }

    /**
     * 赋值默认配置
     *
     * @param uid
     */
    public void assignmentDefault(int uid) {
        this.uid = uid;
        this.receiveNotifyEmail = 0;
        this.profileViewLevel = 0;
        this.pageBackground = "";
    }

    @JsonIgnore
    public boolean isEmpty() {
        return receiveNotifyEmail == null || profileViewLevel == null || pageBackground == null;
    }

}
