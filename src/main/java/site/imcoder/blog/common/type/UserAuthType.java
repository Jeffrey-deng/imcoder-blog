package site.imcoder.blog.common.type;

import site.imcoder.blog.entity.UserAuth;

/**
 * @author Jeffrey.Deng
 * @date 2016-10-04
 */
public enum UserAuthType {

    //站内
    UID(0, 0),    // 用户id
    USERNAME(1, 0), // 用户名
    EMAIL(2, 0), // 邮箱
    PHONE(3, 0), // 手机
    TOKEN(4, 0), // 令牌
    // 第三方
    QQ(10, 1), // QQ
    WECHAT(11, 1), // 微信
    WEIBO(12, 1), // 微博
    GOOGLE(13, 1), // GOOGLE
    // 鉴权类（非登录）
    ARTICLE(20, 2), // 文章
    ALBUM(21, 2), // 相册
    VIDEO(22, 2); // 视频

    public final int value;
    public final int group;

    private UserAuthType(int value, int group) {
        this.value = value;
        this.group = group;
    }

    /**
     * 根据Type的值，获取对应的type枚举对象
     *
     * @param value
     * @return
     */
    public static UserAuthType valueOf(int value) {
        for (UserAuthType type : values()) {
            if (type.value == value) {
                return type;
            }
        }
        return null;
    }

    /**
     * 判断authType是否为站内凭证
     *
     * @param userAuth
     * @return
     */
    public static boolean typeOfInsideGroup(UserAuth userAuth) {
        return userAuth != null && userAuth.getGroup_type() != null && userAuth.getGroup_type() == UID.group;
    }

    /**
     * 判断authType是否为第三方凭证
     *
     * @param userAuth
     * @return
     */
    public static boolean typeOfThirdPartGroup(UserAuth userAuth) {
        return userAuth != null && userAuth.getGroup_type() != null && userAuth.getGroup_type() == QQ.group;
    }

    /**
     * 判断authType是否为鉴权类（非登录）凭证
     *
     * @param userAuth
     * @return
     */
    public static boolean typeOfAuthKeyGroup(UserAuth userAuth) {
        return userAuth != null && userAuth.getGroup_type() != null && userAuth.getGroup_type() == ARTICLE.group;
    }
}
