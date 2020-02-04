package site.imcoder.blog.common.type;

/**
 * 用户组枚举类
 *
 * @author Jeffrey.Deng
 * @date 2017-04-22
 */
public enum UserGroupType {

    GUEST_USER(-4, "游客"), // 游客
    ANONYMOUS_USER(-2, "匿名用户"), // 匿名用户
    MANAGER(-1, "管理员"),    // 管理员
    NOVICE_USER(0, "会员"), // 初级用户
    SENIOR_USER(1, "高级会员"); // 高级用户

    public final int value;
    public final String name;

    private UserGroupType(int value, String name) {
        this.value = value;
        this.name = name;
    }

    /**
     * 根据Type的值，获取对应的type枚举对象
     *
     * @param value
     * @return
     */
    public static UserGroupType valueOf(int value) {
        for (UserGroupType type : values()) {
            if (type.value == value) {
                return type;
            }
        }
        return null;
    }
}
