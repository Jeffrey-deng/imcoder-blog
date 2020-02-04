package site.imcoder.blog.setting;

/**
 * @author Jeffrey.Deng
 * @date 2018-01-24
 */
public interface GlobalConstants {

    public static final String KEY_LOGIN_USER = "loginUser";

    public static final String KEY_GUEST_USER = "guestUser";

    public static final int STATUS_SUCCESS = 200;

    public static final int STATUS_PARAM_ERROR = 400;

    public static final int STATUS_NOT_LOGIN = 401;

    public static final int STATUS_FORBIDDEN = 403;

    public static final int STATUS_NOT_FOUND = 404;

    public static final int STATUS_SERVER_ERROR = 500;

    public static final String FRIENDLY_SUCCESS = "成功";

    public static final String FRIENDLY_PARAM_ERROR = "参数错误";

    public static final String FRIENDLY_NOT_LOGIN = "需要登录";

    public static final String FRIENDLY_FORBIDDEN = "没有权限";

    public static final String FRIENDLY_NOT_FOUND = "无此记录";

    public static final String FRIENDLY_SERVER_ERROR = "服务器错误";

    public static final String RESPONSE_BODY_RETURN_VALUE = "responseBodyReturnValue";


}
