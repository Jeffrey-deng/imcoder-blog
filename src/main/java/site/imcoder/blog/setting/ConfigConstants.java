package site.imcoder.blog.setting;

/**
 * @author Jeffrey.Deng
 *         系统配置名称_常量
 */
public class ConfigConstants {

    /**
     * 空值标志
     */
    public static final String EMPTY = "empty";

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
     * 文件系统模式（local、remote、sync）
     */
    public static final String CLOUD_FILE_SYSTEM_MODE = "cloud_file_system_mode";

    /**
     * oss配置文件地址
     */
    public static final String REMOTE_OSS_CONFIG_LOCATION = "remote_oss_config_location";

    /**
     * 上传文件存储基础路径 相对于context父文件夹
     */
    public static final String ARTICLE_UPLOAD_BASEPATH = "article_upload_basepath";

    /**
     * 上传文件存储相对路径 相对于其基础路径
     */
    public static final String ARTICLE_UPLOAD_RELATIVEPATH = "article_upload_relativepath";

    /**
     * 云盘文件存储基础路径 相对于context父文件夹
     */
    public static final String CLOUD_FILE_BASEPATH = "cloud_file_basepath";

    /**
     * 云盘文件存储相对路径 相对于其基础路径
     */
    public static final String CLOUD_FILE_RELATIVEPATH = "cloud_file_relativepath";

    /**
     * 垃圾回收路径
     */
    public static final String TRASH_RECYCLE_BASEPATH = "trash_recycle_basepath";

    /**
     * 允许发表文章的用户组最低等级，值为对应用户组的Gid
     */
    public static final String ARTICLE_ALLOW_CREATE_LOWEST_LEVEL = "article_allow_create_lowest_level";

    /**
     * 云盘允许上传文件的用户组最低等级，值为对应用户组的Gid
     */
    public static final String CLOUD_ALLOW_UPLOAD_LOWEST_LEVEL = "cloud_allow_upload_lowest_level";

    /**
     * 照片最大上传大小，单位字节，-1代表无限制
     */
    public static final String CLOUD_PHOTO_MAX_UPLOADSIZE = "cloud_photo_max_uploadsize";

    /**
     * 视频最大上传大小，单位字节，-1代表无限制
     */
    public static final String CLOUD_VIDEO_MAX_UPLOADSIZE = "cloud_video_max_uploadsize";

    /**
     * 文件最大上传大小，单位字节，-1代表无限制
     */
    public static final String CLOUD_FILE_MAX_UPLOADSIZE = "cloud_file_max_uploadsize";

    /**
     * 浏览器端的配置
     * <pre>
     *  JSON格式： {"version": 1.0, "force": true, ...}
     *  version: 为改配置的版本号，必填，修改配置后，设置 <b>新的版本号</b> 才会生效
     *  force：强力升级，该方式为先删除客户端配置，再写入，可不填，不填为false
     *  </pre>
     * <p>
     * 修改完成后，修改 {@link #SITE_CDN_ADDR_ARGS } 为新值，客户端才会加载
     */
    public static final String SITE_CLIENT_CONFIG = "site_client_config";

    /**
     * 静态文件地址后缀(仅限js、css)
     * {time} 可取时间戳
     * {date} 可取yyMMdd
     */
    public static final String SITE_CDN_ADDR_ARGS = "site_cdn_addr_args";

    /**
     * 图片文件预览参数，支持子集：@user_{uid}:{args} ，{col}可取到运行时显示的列数
     */
    public static final String CLOUD_PHOTO_PREVIEW_ARGS = "cloud_photo_preview_args";

    /**
     * 项目context目录
     */
    public static final String SITE_CONTEXT_REAL_PATH = "site_context_real_path";

    /**
     * 项目context父目录
     */
    public static final String SITE_CONTEXT_FATHER_REAL_PATH = "site_context_father_real_path";

    /**
     * ”关于我“ 对应的文章号
     */
    public static final String SITE_ABOUT_ARTICLE_ID = "site_about_article_id";

    /**
     * “帮助”对应的文章号，支持子集：@{module}:{aid}
     */
    public static final String SITE_HELP_ARTICLE_ID = "site_help_article_id";

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
     * 消息推送线程池的线程数
     */
    public static final String NOTIFYSERVICE_THREAD_NUM = "notifyservice_thread_num";

    /**
     * 邮件推送服务配置文件地址
     */
    public static final String EMAILPUSH_CONFIG_LOCATION = "emailpush_config_location";

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
     * 默认的男生用户头像，列表，至少一个，设置时为json数组字符串，数组类型为头像地址字符串
     */
    public static final String USER_DEFAULT_MAN_HEADPHOTOS = "user_default_man_headphotos";

    /**
     * 默认的女生用户头像，列表，至少一个，设置时为json数组字符串，数组类型为头像地址字符串
     */
    public static final String USER_DEFAULT_MISS_HEADPHOTOS = "user_default_miss_headphotos";

    /**
     * 工具服务配置文件地址
     */
    public static final String TOOLSERVICE_CONFIG_LOCATION = "toolservice_config_location";

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

    /**
     * 是否允许运行系统升级，true or false
     */
    public static final String SITE_ALLOW_RUN_UPGRADE = "site_allow_run_upgrade";

    /**
     * 用户在线时是否运行离线通知，true: 同时运行，false: 当用户在线时，不执行其他方式通知，true or false
     */
    public static final String RUN_OFFLINE_NOTIFY_WHEN_ONLINE = "run_offline_notify_when_online";
}
