package site.imcoder.blog.common.type;

/**
 * 用户组枚举类
 *
 * @author Jeffrey.Deng
 * @date 2019-04-22
 */
public enum UserGroupType {

    MANAGER(-1),    // 管理员
    NOVICE_USER(0), // 初级用户
    SENIOR_USER(1); // 高级用户

    public final int value;

    private UserGroupType(int value) {
        this.value = value;
    }

    /**
     * 根据Type的值，获取对应的type枚举对象
     *
     * @param value
     * @return
     */
    public static UserGroupType valueOfName(int value) {
        for (UserGroupType type : values()) {
            if (type.value == value) {
                return type;
            }
        }
        return null;
    }
}
