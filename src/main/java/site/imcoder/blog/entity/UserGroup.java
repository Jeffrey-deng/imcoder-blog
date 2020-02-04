package site.imcoder.blog.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import site.imcoder.blog.common.type.UserGroupType;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;

import java.io.Serializable;

public class UserGroup implements Serializable {

    private static final long serialVersionUID = 3920289753006374715L;

    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long uid;

    private int gid;

    private String group_name;

    public UserGroup() {
    }

    public UserGroup(int gid) {
        this();
        this.gid = gid;
    }

    public UserGroup(int gid, String group_name) {
        this();
        this.gid = gid;
        this.group_name = group_name;
    }

    public Long getUid() {
        return uid;
    }

    public void setUid(Long uid) {
        this.uid = uid;
    }

    public int getGid() {
        return gid;
    }

    public void setGid(int gid) {
        this.gid = gid;
    }

    public String getGroup_name() {
        if (group_name == null) {
            UserGroupType userGroupType = UserGroupType.valueOf(gid);
            if (userGroupType != null) {
                return userGroupType.name;
            }
        }
        return group_name;
    }

    public void setGroup_name(String group_name) {
        this.group_name = group_name;
    }

    /**
     * 是否为管理员
     *
     * @return
     */
    @JsonIgnore
    public boolean isManager() {
        return gid == UserGroupType.MANAGER.value;
    }

    /**
     * 是否为普通用户（是否不是管理员）
     *
     * @return
     */
    @JsonIgnore
    public boolean isGeneralUser() {
        return !isManager();
    }

    /**
     * 是否为游客
     *
     * @return
     */
    @JsonIgnore
    public boolean isGuestUser() {
        return gid == UserGroupType.GUEST_USER.value;
    }

}
