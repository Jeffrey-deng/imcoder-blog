package site.imcoder.blog.setting;

import org.apache.log4j.Logger;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import site.imcoder.blog.common.AudioUtil;
import site.imcoder.blog.common.Utils;

import javax.servlet.ServletContext;
import java.io.*;
import java.util.Enumeration;
import java.util.List;
import java.util.Map;
import java.util.Properties;

/**
 * 配置管理类
 *
 * @author Jeffrey.Deng
 */
@Component("configManager")
public class ConfigManager {

    private static Logger logger = Logger.getLogger(ConfigManager.class);

    private ServletContext servletContext;

    /**
     * 邮件推送服务标识前缀
     */
    private String emailPushPrefix = ConfigConstants.EMAILPUSH_SMTP_ADDR.substring(0, ConfigConstants.EMAILPUSH_SMTP_ADDR.indexOf('_'));

    /**
     * 文字转语音服务标识前缀
     */
    private String toolSpeechPrefix = ConfigConstants.TOOL_SPEECH_TOKEN_APP_ID.substring(0, ConfigConstants.TOOL_SPEECH_TOKEN_APP_ID.indexOf('_', ConfigConstants.TOOL_SPEECH_TOKEN_APP_ID.indexOf('_') + 1));

    @Autowired
    public ConfigManager(ServletContext servletContext) {
        this.servletContext = servletContext;
        initServerConfig();
    }

    private void initServerConfig() {
        String serverConfigLocation = servletContext.getInitParameter(ConfigConstants.SERVER_CONFIG_LOCATION);
        if (serverConfigLocation != null) {
            // 保存 Server config file path config
            initAssignment(ConfigConstants.SERVER_CONFIG_LOCATION, serverConfigLocation);
            // 加载配置
            loadConfig();
        } else {
            logger.warn("  Error : Server XML Config file location don't set, it should config a init-param tag with name " + ConfigConstants.SERVER_CONFIG_LOCATION + " in web.xml");
        }
    }

    private void initLogFilePath() {
        String default_info_path = Config.get(ConfigConstants.LOG_FILE_INFO_PATH);
        String default_warn_path = Config.get(ConfigConstants.LOG_FILE_WARN_PATH);
        String default_error_path = Config.get(ConfigConstants.LOG_FILE_ERROR_PATH);
        if (default_info_path == null || default_warn_path == null || default_error_path == null) {
            String path = servletContext.getInitParameter(Config.get(ConfigConstants.LOG_CONFIG_PATH_PARAM_NAME));
            String filePath = this.convertClassPathAndGetRealPath(path);
            if (filePath != null) {
                Properties properties = new Properties();
                BufferedReader bufferedReader = null;
                try {
                    bufferedReader = new BufferedReader(new FileReader(filePath));
                    properties.load(bufferedReader);
                    Enumeration<String> enumeration = (Enumeration<String>) properties.propertyNames();
                    while (enumeration.hasMoreElements()) {
                        String name = enumeration.nextElement();
                        if (default_info_path == null && name.endsWith("All.File")) {
                            initAssignment(ConfigConstants.LOG_FILE_INFO_PATH, properties.getProperty(name).trim());
                        } else if (default_warn_path == null && name.endsWith("Warn.File")) {
                            initAssignment(ConfigConstants.LOG_FILE_WARN_PATH, properties.getProperty(name).trim());
                        } else if (default_error_path == null && name.endsWith("Error.File")) {
                            initAssignment(ConfigConstants.LOG_FILE_ERROR_PATH, properties.getProperty(name).trim());
                        }
                    }
                } catch (FileNotFoundException e) {
                    e.printStackTrace();
                    logger.error("日志文件流读取出错, 文件未找到: " + filePath, e);
                } catch (IOException e) {
                    e.printStackTrace();
                    logger.error("日志文件流读取出错", e);
                } finally {
                    if (bufferedReader != null) {
                        try {
                            bufferedReader.close();
                        } catch (IOException e) {
                            e.printStackTrace();
                            logger.error("日志文件流关闭出错", e);
                        }
                    }
                }
            }
        }
    }

    /**
     * 读取配置值，完成初始化
     */
    private void loadConfig() {
        setDefault();
        loadConfigFromXML(Config.get(ConfigConstants.SERVER_CONFIG_LOCATION), "init");
        initLogFilePath();
        AudioUtil.updateTokenInfo();
        for (Map.Entry<String, String> entry : Config.getAll().entrySet()) {
            // 输出日志
            logger.info("设置 \"" + entry.getKey() + "\" : " + getPublicValue(entry.getKey(), entry.getValue()));
        }
    }

    /**
     * 重新读取配置，无改变不操作
     */
    public void reloadConfig() {
        loadConfigFromXML(Config.get(ConfigConstants.SERVER_CONFIG_LOCATION), "update");
    }

    /**
     * 更新配置项，无改变不操作
     *
     * @param key
     * @param value
     */
    public void updateConfig(String key, String value) {
        if (key != null && value != null && !key.equals("") && !value.equals("")) {
            updateAssignment(key, value);
        }
    }

    /**
     * 从XML中加载配置文件
     *
     * @param configPath
     */
    public void loadConfigFromXML(String configPath, String type) {
        logger.info("Configuration:解析xml配置文件");
        String path = convertClassPathAndGetRealPath(configPath);

        File f = new File(path);
        if (!f.exists()) {
            logger.warn("  Error : Server XML Config file doesn't exist! the path: " + path);
            return;
        }
        logger.info("发现 Server XML Config file ：" + path);

        SAXReader reader = new SAXReader();
        Document doc = null;
        try {
            doc = reader.read(f);
        } catch (DocumentException e) {
            e.printStackTrace();
        }
        List<Element> kvList = (List<Element>) doc.selectNodes("/Server/property");
        for (int i = 0; i < kvList.size(); i++) {
            Element kv = kvList.get(i);
            String key = kv.elementTextTrim("param");
            String value = kv.elementTextTrim("value");
            if (key != null && value != null && !key.equals("") && !value.equals("")) {
                if ("init".equalsIgnoreCase(type)) {
                    initAssignment(key.toLowerCase(), value);
                } else if ("update".equalsIgnoreCase(type)) {
                    updateAssignment(key.toLowerCase(), value);
                }
            }
        }
    }

    private void initAssignment(String key, String value) {
        if (key.equals(ConfigConstants.ARTICLE_UPLOAD_BASEPATH) || key.equals(ConfigConstants.CLOUD_FILE_BASEPATH) || key.equals(ConfigConstants.TRASH_RECYCLE_BASEPATH)) {
            value = getRealFromConfigBasePath(value);
        }
        Config.set(key, value);
    }

    private void updateAssignment(String key, String value) {
        if (key.equals(ConfigConstants.ARTICLE_UPLOAD_BASEPATH) || key.equals(ConfigConstants.CLOUD_FILE_BASEPATH) || key.equals(ConfigConstants.TRASH_RECYCLE_BASEPATH)) {
            value = getRealFromConfigBasePath(value);
        }
        String preValue = Config.get(key);
        if (value.equals(preValue)) {
            logger.info("更新配置 \"" + key + "\" : " + getPublicValue(key, value) + ", 但是因为值与原始值相同，所以未操作！");
        } else {
            if (preValue == null) {
                logger.warn("更新配置 \"" + key + "\" : " + getPublicValue(key, value) + ", 但该key不属于默认配置项！");
            } else {
                logger.info("更新配置 \"" + key + "\" : " + getPublicValue(key, value));
            }
            Config.set(key, value);
            if (key.equals(ConfigConstants.NOTIFYSERVICE_THREAD_NUM)) {

            } else if (key.indexOf("_") != -1 && key.startsWith(emailPushPrefix)) {

            } else if (key.indexOf("_") != -1 && key.startsWith(toolSpeechPrefix)) {
                AudioUtil.updateTokenInfo();
            }
        }
    }

    /**
     * 获取本项目下文件的一些实际路径
     *
     * @param path
     * @return
     */
    private String convertClassPathAndGetRealPath(String path) {
        if (path == null) {
            return null;
        }
        path = path.trim();
        String filePath = null;
        if (path.startsWith("/")) {
            filePath = Utils.getContextRealPath() + path.substring(1);
        } else if (path.startsWith("classpath*:")) {
            filePath = path.replace("classpath*:", Utils.getClassPath());
        } else if (path.startsWith("classpath:")) {
            filePath = path.replace("classpath:", Utils.getClassPath());
        } else {
            filePath = Utils.getContextRealPath() + path;
        }
        return filePath;
    }

    /**
     * 获得配置中项目父路径下文件相对路径的绝对路径
     *
     * @param basePath
     * @return
     */
    private String getRealFromConfigBasePath(String basePath) {
        if (Utils.isAbsolutePath(basePath)) {
            return basePath;
        } else {
            return Utils.getContextFatherPath() + basePath;
        }
    }

    /**
     * 隐藏 password
     *
     * @param value
     * @return
     */
    private String getPublicValue(String key, String value) {
        if (key != null && (key.equals(ConfigConstants.EMAILPUSH_ACCOUNT_PASSWORD) || key.startsWith(toolSpeechPrefix))) {
            return "******";
        } else {
            return value;
        }
    }

    public void setDefault() {
        //博客网址
        Config.set(ConfigConstants.SITE_ADDR, "http://localhost:8080/blog/");

        //CDN地址，以"/"结尾
        Config.set(ConfigConstants.SITE_CDN_ADDR, "http://localhost:8080/blog/static/");

        //cloud地址，以"/"结尾
        Config.set(ConfigConstants.SITE_CLOUD_ADDR, "http://localhost:8080/blog/cloud/");

        //上传文件存储相对路径 相对于其基础路径
        Config.set(ConfigConstants.ARTICLE_UPLOAD_RELATIVEPATH, "upload/");

        //上传文件存储基础路径 相对于context父文件夹
        Config.set(ConfigConstants.ARTICLE_UPLOAD_BASEPATH, getRealFromConfigBasePath("blog/static/"));

        //云盘文件存储相对路径 相对于其基础路径
        Config.set(ConfigConstants.CLOUD_FILE_RELATIVEPATH, "user/");

        //云盘文件存储基础路径 相对于context父文件夹
        Config.set(ConfigConstants.CLOUD_FILE_BASEPATH, getRealFromConfigBasePath("blog/cloud/"));

        //垃圾回收路径
        Config.set(ConfigConstants.TRASH_RECYCLE_BASEPATH, getRealFromConfigBasePath("blog/cloud/.trash/"));

        //“关于我”对应的文章号
        Config.set(ConfigConstants.SITE_ABOUT_ARTICLE_ID, "0");

        //登录严格模式将校验IP
        Config.set(ConfigConstants.USER_LOGIN_STRICT, "false");

        //将Cache的缓存持久化的最大推迟次数（由于无人访问而设计的推迟持久化）
        Config.set(ConfigConstants.CACHEFLUSH_TIMER_DELAYTIMES, "20");

        //cache多久进行一次持久化
        Config.set(ConfigConstants.CACHEFLUSH_TIMER_PERIOD, String.valueOf(5 * 60 * 1000L));

        //flush第一次运行推迟的时间
        Config.set(ConfigConstants.CACHEFLUSH_TIMER_DELAY, String.valueOf(5 * 60 * 1000L));

        //邮件推送线程池的线程数
        Config.set(ConfigConstants.NOTIFYSERVICE_THREAD_NUM, "4");

        //邮件服务器地址
        Config.set(ConfigConstants.EMAILPUSH_SMTP_ADDR, "smtpdm.aliyun.com");

        //邮件服务器端口
        Config.set(ConfigConstants.EMAILPUSH_SMTP_PORT, "465");

        //邮箱账号地址
        Config.set(ConfigConstants.EMAILPUSH_ACCOUNT_ADDR, "");

        //邮箱账号密码
        Config.set(ConfigConstants.EMAILPUSH_ACCOUNT_PASSWORD, "");

        //邮箱账号昵称
        Config.set(ConfigConstants.EMAILPUSH_ACCOUNT_NICKNAME, "Blog Service");

        //首页置顶文章的数目
        Config.set(ConfigConstants.ARTICLE_HOME_SIZE_TOP, "5");

        //首页rank列表的数目
        Config.set(ConfigConstants.ARTICLE_HOME_SIZE_RANK, "7");

        //默认的相册封面，相对于SITE_CLOUD_ADDR
        Config.set(ConfigConstants.ALBUM_DEFAULT_COVER, "{\"path\":\"res/img/album_default.jpg\",\"width\": 800,\"height\": 800}");

        //文字转语音的百度 token
        Config.set(ConfigConstants.TOOL_SPEECH_TOKEN_APP_ID, "");

        Config.set(ConfigConstants.TOOL_SPEECH_TOKEN_API_KEY, "");

        Config.set(ConfigConstants.TOOL_SPEECH_TOKEN_SECRET_KEY, "");

        AudioUtil.updateTokenInfo();
    }

}
