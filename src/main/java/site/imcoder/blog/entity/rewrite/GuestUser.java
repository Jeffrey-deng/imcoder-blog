package site.imcoder.blog.entity.rewrite;

import com.fasterxml.jackson.annotation.JsonIgnore;
import site.imcoder.blog.common.type.UserGroupType;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.UserGroup;

import java.io.Serializable;

/**
 * 游客（访客），既未登录的身份
 * 用标识未登录，但仍可使用 {@link site.imcoder.blog.entity.User} 对象
 *
 * @author Jeffrey.Deng
 * @date 2018-02-06
 */
public class GuestUser extends User implements Serializable {

    private static final long serialVersionUID = 5474047908684890718L;

    public GuestUser() {
        super();
        setUserGroup(new UserGroup(UserGroupType.GUEST_USER.value, UserGroupType.GUEST_USER.name));
    }

    public GuestUser(Long uid) {
        super();
        setUserGroup(new UserGroup(UserGroupType.GUEST_USER.value, UserGroupType.GUEST_USER.name));
    }

    public GuestUser(Long uid, String nickname) {
        super(uid, nickname);
        setUserGroup(new UserGroup(UserGroupType.GUEST_USER.value, UserGroupType.GUEST_USER.name));
    }

    /**
     * 是否登录
     *
     * @return
     */
    @JsonIgnore
    @Override
    public boolean isHasLoggedIn() {
        return false;
    }

}
