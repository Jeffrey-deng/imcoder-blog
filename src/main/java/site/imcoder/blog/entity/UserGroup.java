package site.imcoder.blog.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import site.imcoder.blog.common.type.UserGroupType;

import java.io.Serializable;

public class UserGroup implements Serializable {

    private static final long serialVersionUID = 3920289753006374715L;

    private int gid;

    private String group_name;

    public UserGroup() {
    }

    public UserGroup(int gid) {
        super();
        this.gid = gid;
    }

    public int getGid() {
        return gid;
    }

    public void setGid(int gid) {
        this.gid = gid;
    }

    public String getGroup_name() {
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
        return this.gid == UserGroupType.MANAGER.value;
    }

    /**
     * 是否为普通用户（是否不是管理员）
     *
     * @return
     */
    @JsonIgnore
    public boolean isGeneralUser() {
        return !(this.gid == UserGroupType.MANAGER.value);
    }

}
