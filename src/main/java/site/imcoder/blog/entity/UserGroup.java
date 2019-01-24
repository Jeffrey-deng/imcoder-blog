package site.imcoder.blog.entity;

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


}
