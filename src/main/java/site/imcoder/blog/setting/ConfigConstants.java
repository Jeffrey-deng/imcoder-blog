package site.imcoder.blog.setting;

/**
 * Created by Jeffrey.Deng on 2018/5/17.
 * 系统配置名称_常量
 */
public class ConfigConstants {

    /**
     * 配置文件路径，配置在web.xml下 init-param 标签，值为相对应用根目录路径
     */
    public static final String SERVER_CONFIG_LOCATION = "serverConfigLocation";

    /**
     * 博客网址
     */
    public static final String SITE_ADDR = "site_addr";

    /**
     * CDN地址，以"/"结尾
     */
    public static final String SITE_CDN_ADDR = "site_cdn_addr";

    /**
     * cloud地址，以"/"结尾
     */
    public static final String SITE_CLOUD_ADDR = "site_cloud_addr";

    /**
     * 上传文件存储相对路径 相对于其基础路径
     */
    public static final String ARTICLE_UPLOAD_RELATIVEPATH = "article_upload_relativepath";

    /**
     * 上传文件存储基础路径 相对于context父文件夹
     */
    public static final String ARTICLE_UPLOAD_BASEPATH = "article_upload_basepath";

    /**
     * 云盘文件存储相对路径 相对于其基础路径
     */
    public static final String CLOUD_FILE_RELATIVEPATH = "cloud_file_relativepath";

    /**
     * 云盘文件存储基础路径 相对于context父文件夹
     */
    public static final String CLOUD_FILE_BASEPATH = "cloud_file_basepath";

    /**
     * ”关于我“ 对应的文章号
     */
    public static final String SITE_ABOUT_ARTICLE_ID = "site_about_article_id";

    /**
     * 登录严格模式将校验IP
     */
    public static final String USER_LOGIN_STRICT = "user_login_strict";

    /**
     * 将Cache的缓存持久化的最大推迟次数（由于无人访问而设计的推迟持久化）
     */
    public static final String CACHEFLUSH_TIMER_DELAYTIMES = "cacheflush_timer_delaytimes";

    /**
     * cache多久进行一次持久化
     */
    public static final String CACHEFLUSH_TIMER_PERIOD = "cacheflush_timer_period";

    /**
     * flush第一次运行推迟的时间
     */
    public static final String CACHEFLUSH_TIMER_DELAY = "cacheflush_timer_delay";

    /**
     * 邮件推送线程池的线程数
     */
    public static final String EMAILPUSH_THREAD_NUM = "emailpush_thread_num";

    /**
     * 邮件服务器地址
     */
    public static final String EMAILPUSH_SMTP_ADDR = "emailpush_smtp_addr";

    /**
     * 邮件服务器端口
     */
    public static final String EMAILPUSH_SMTP_PORT = "emailpush_smtp_port";

    /**
     * 邮箱账号地址
     */
    public static final String EMAILPUSH_ACCOUNT_ADDR = "emailpush_account_addr";

    /**
     * 邮箱账号密码
     */
    public static final String EMAILPUSH_ACCOUNT_PASSWORD = "emailpush_account_password";

    /**
     * 邮箱账号昵称
     */
    public static final String EMAILPUSH_ACCOUNT_NICKNAME = "emailpush_account_nickname";

    /**
     * web.xml中配置log4j配置文件路径的参数名（param-name）
     */
    public static final String LOG_CONFIG_PATH_PARAM_NAME = "log_config_path_param_name";

    /**
     * 日志文件（普通）地址，如果没有配置，将会读取log4j配置文件取
     */
    public static final String LOG_FILE_INFO_PATH = "log_file_info_path";

    /**
     * 日志文件（警告）地址，如果没有配置，将会读取log4j配置文件取
     */
    public static final String LOG_FILE_WARN_PATH = "log_file_warn_path";

    /**
     * 日志文件（错误）地址，如果没有配置，将会读取log4j配置文件取
     */
    public static final String LOG_FILE_ERROR_PATH = "log_file_error_path";

    /**
     * 首页置顶文章的数目
     */
    public static final String ARTICLE_HOME_SIZE_TOP = "article_home_size_top";

    /**
     * 首页每个rank列表的文章数目
     */
    public static final String ARTICLE_HOME_SIZE_RANK = "article_home_size_rank";

    /**
     * 默认的相册封面，相对于SITE_CLOUD_ADDR
     */
    public static final String ALBUM_DEFAULT_COVER = "album_default_cover";

    /**
     * 文字转语音的百度 APP_ID
     */
    public static final String TOOL_SPEECH_TOKEN_APP_ID = "tool_speech_token_app_id";

    /**
     * 文字转语音的百度 API_KEY
     */
    public static final String TOOL_SPEECH_TOKEN_API_KEY = "tool_speech_token_api_key";

    /**
     * 文字转语音的百度 SECRET_KEY
     */
    public static final String TOOL_SPEECH_TOKEN_SECRET_KEY = "tool_speech_token_secret_key";

}
