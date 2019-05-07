package site.imcoder.blog.common.type;

/**
 * 权限枚举
 * 不公开（NOT_PUBLIC）意思是 不会在搜索结果、广场、用户主页中出现
 *
 * @author Jeffrey.Deng
 * @date 2016-10-27
 */
public enum PermissionType {

    PUBLIC(0),    // 游客可见
    NOT_PUBLIC(1), // 游客可见，但不公开
    LOGIN_ONLY(2),  // 登陆可见（注册用户可见）
    LOGIN_ONLY_NOT_PUBLIC(3),   // 登陆可见（注册用户可见），但不公开
    FOLLOWER_ONLY(4), // 粉丝可见
    FOLLOWER_ONLY_NOT_PUBLIC(5),// 粉丝可见，但不公开
    FOLLOWING_ONLY(6),// 关注的用户可见
    FOLLOWING_ONLY_NOT_PUBLIC(7),// 关注的用户可见，但不公开
    FRIEND_ONLY(8), // 好友可见
    FRIEND_ONLY_NOT_PUBLIC(9), // 好友可见，但不公开
    PRIVATE(10); // 私有

    public final int value;

    private PermissionType(int value) {
        this.value = value;
    }

    /**
     * 根据Type的值，获取对应的type枚举对象
     *
     * @param value
     * @return
     */
    public static PermissionType valueOfName(int value) {
        for (PermissionType type : values()) {
            if (type.value == value) {
                return type;
            }
        }
        return null;
    }

}
