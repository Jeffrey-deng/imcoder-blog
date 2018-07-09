package site.imcoder.blog.setting;

import site.imcoder.blog.common.mail.EmailUtil;

import java.util.*;


/**
 * 服务器的参数配置
 * 有其初始值
 * 其值可在xml中配置，并调用ConfigManager的loadConfig方法赋值,重新读取调用reloadConfig()
 * @author dengchao
 * @date 2017-3-22
 */
public class Config {

    /**
     * 属性Map
     */
	private static Map<String, String> prop = new HashMap<>();

    /**
     * 设置配置项，仅子类和本包可调用，
     * 正确调用方法为： ConfigManager.updateConfig(key, value);
     * @param key
     * @param value
     */
    protected static void set(String key, String value) {
        prop.put(key, value);
    }

    /**
     * 获取配置项
     * @return
     */
    public static Map<String, String> getAll() {
        Set<Map.Entry<String, String>> set = prop.entrySet();
        Map.Entry<String, String>[] entries = (Map.Entry<String, String>[]) set.toArray(new Map.Entry[set.size()]);
        Arrays.sort(entries, new Comparator<Map.Entry<String, String>>() {
            public int compare(Map.Entry<String, String> entry1, Map.Entry<String, String> entry2) {
                return entry1.getKey().compareTo(entry2.getKey());
            }
        });
        Map<String, String> map = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : entries) {
            if (ConfigConstants.EMAILPUSH_ACCOUNT_PASSWORD.equals(entry.getKey())) {
                map.put(entry.getKey(), null);
            } else {
                map.put(entry.getKey(), entry.getValue());
            }
        }
        return map;
    }

    /**
     * 获取配置项
     * @param key
     * @return
     */
    public static String get(String key) {
        return prop.get(key);
    }

    /**
     * 获取整数类型的配置项
     * @param key
     * @return value
     */
    public static Integer getInt(String key) {
        String value = get(key);
        try {
            return Integer.valueOf(value);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;
    }

    /**
     * 获取布尔类型的配置项
     * @param key
     * @return value
     */
    public static Boolean getBoolean(String key) {
        String value = get(key);
        try {
            return Boolean.valueOf(value);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * 获取Long类型的配置项
     * @param key
     * @return
     */
    public static Long getLong(String key) {
        String value = get(key);
        try {
            return Long.valueOf(value);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0L;
    }

    public static void setDefault() {
        //博客网址
        set(ConfigConstants.SITE_ADDR, "http://localhost:8080/blog/");

        //CDN地址，以"/"结尾
        set(ConfigConstants.SITE_CDN_ADDR, "http://localhost:8080/blog/static/");

        //cloud地址，以"/"结尾
        set(ConfigConstants.SITE_CLOUD_ADDR, "http://localhost:8080/blog/cloud/");

        //上传文件存储相对路径 相对于其基础路径
        set(ConfigConstants.ARTICLE_UPLOAD_RELATIVEPATH, "upload/");

        //上传文件存储基础路径 相对于context父文件夹
        set(ConfigConstants.ARTICLE_UPLOAD_BASEPATH, "blog/static/");

        //云盘文件存储相对路径 相对于其基础路径
        set(ConfigConstants.CLOUD_FILE_RELATIVEPATH, "user/");

        //云盘文件存储基础路径 相对于context父文件夹
        set(ConfigConstants.CLOUD_FILE_BASEPATH, "blog/cloud/");

        //”关于我“ 对应的文章号
        set(ConfigConstants.SITE_ABOUT_ARTICLE_ID, "0");

        //登录严格模式将校验IP
        set(ConfigConstants.USER_LOGIN_STRICT, "false");

        //将Cache的缓存持久化的最大推迟次数（由于无人访问而设计的推迟持久化）
        set(ConfigConstants.CACHEFLUSH_TIMER_DELAYTIMES, "20");

        //cache多久进行一次持久化
        set(ConfigConstants.CACHEFLUSH_TIMER_PERIOD, String.valueOf(5*60*1000L));

        //flush第一次运行推迟的时间
        set(ConfigConstants.CACHEFLUSH_TIMER_DELAY, String.valueOf(5*60*1000L));

        //邮件推送线程池的线程数
        set(ConfigConstants.EMAILPUSH_THREAD_NUM, "4");

        //邮件服务器地址
        set(ConfigConstants.EMAILPUSH_SMTP_ADDR, "smtpdm.aliyun.com");

        //邮件服务器端口
        set(ConfigConstants.EMAILPUSH_SMTP_PORT, "465");

        //邮箱账号地址
        set(ConfigConstants.EMAILPUSH_ACCOUNT_ADDR, "");

        //邮箱账号密码
        set(ConfigConstants.EMAILPUSH_ACCOUNT_PASSWORD, "");

        //邮箱账号昵称
        set(ConfigConstants.EMAILPUSH_ACCOUNT_NICKNAME, "Blog Service");

        //首页置顶文章的数目
        set(ConfigConstants.ARTICLE_HOME_SIZE_TOP, "5");

        //首页rank列表的数目
        set(ConfigConstants.ARTICLE_HOME_SIZE_RANK, "7");

        //默认的相册封面，相对于SITE_CLOUD_ADDR
        set(ConfigConstants.ALBUM_DEFAULT_COVER, "res/img/album_default.jpg");

        //文字转语音的百度 token
        set(ConfigConstants.TOOL_SPEECH_TOKEN_APP_ID, "");

        set(ConfigConstants.TOOL_SPEECH_TOKEN_API_KEY, "");

        set(ConfigConstants.TOOL_SPEECH_TOKEN_SECRET_KEY, "");

        EmailUtil.updateAccountInfo();
    }
}
