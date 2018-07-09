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
import site.imcoder.blog.common.mail.EmailUtil;

import javax.servlet.ServletContext;
import java.io.*;
import java.util.Enumeration;
import java.util.List;
import java.util.Map;
import java.util.Properties;

/**
 * Created by Jeffrey.Deng on 2018/5/17.
 */
@Component("configManager")
public class ConfigManager {

    private static Logger logger = Logger.getLogger(ConfigManager.class);

    private ServletContext servletContext;

    /**
     * 配置文件路径
     */
    private String serverConfigLocation = null;

    /**
     * 日志配置文件路径
     */
    private String log4jConfigPath = null;

    /**
     * 邮件推送服务标识前缀
     */
    private String emailPushPrefix = ConfigConstants.EMAILPUSH_SMTP_ADDR.substring(0, ConfigConstants.EMAILPUSH_SMTP_ADDR.indexOf('_'));

    /**
     * 邮件推送服务标识前缀
     */
    private String toolSpeechPrefix = ConfigConstants.TOOL_SPEECH_TOKEN_APP_ID.substring(0, ConfigConstants.TOOL_SPEECH_TOKEN_APP_ID.indexOf('_', ConfigConstants.TOOL_SPEECH_TOKEN_APP_ID.indexOf('_') + 1));

    @Autowired
    public ConfigManager (ServletContext servletContext) {
        this.servletContext = servletContext;
        initServerConfig(servletContext);
    }

    private void initServerConfig(ServletContext servletContext) {
        String serverConfigLocation = servletContext.getInitParameter(ConfigConstants.SERVER_CONFIG_LOCATION);
        if (serverConfigLocation != null) {
            this.serverConfigLocation = serverConfigLocation;
            initAssignment(ConfigConstants.SERVER_CONFIG_LOCATION, serverConfigLocation);
            loadConfig();
        } else {
            logger.warn("  Error : Server XML Config file location don't set, it should config a init-param tag with name " + ConfigConstants.SERVER_CONFIG_LOCATION + " in web.xml" );
        }
    }

    private void initLogFilePath(ServletContext servletContext) {
        String default_info_path = Config.get(ConfigConstants.LOG_FILE_INFO_PATH);
        String default_warn_path = Config.get(ConfigConstants.LOG_FILE_WARN_PATH);
        String default_error_path = Config.get(ConfigConstants.LOG_FILE_ERROR_PATH);
        if (default_info_path == null || default_warn_path == null || default_error_path == null) {
            String path = servletContext.getInitParameter(Config.get(ConfigConstants.LOG_CONFIG_PATH_PARAM_NAME));
            String filePath = this.convertClassPathAndGetRealPath(path);
            if (filePath != null) {
                this.log4jConfigPath = filePath;
                Properties properties = new Properties();
                BufferedReader bufferedReader = null;
                try {
                    bufferedReader = new BufferedReader(new FileReader(filePath));
                    properties.load(bufferedReader);
                    Enumeration<String> enumeration = (Enumeration<String>)properties.propertyNames();
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
        Config.setDefault();
        loadConfigFromXML(Config.get(ConfigConstants.SERVER_CONFIG_LOCATION), "init");
        initLogFilePath(servletContext);
        EmailUtil.updateAccountInfo();
        AudioUtil.updateTokenInfo();
        for (Map.Entry<String, String> entry : Config.getAll().entrySet()) {
            // 输出日志
            logger.info("设置 \"" + entry.getKey() + "\" : " + (entry.getKey().equals(ConfigConstants.EMAILPUSH_ACCOUNT_PASSWORD) ? "******" : entry.getValue()));
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
     * @param configPath
     */
    public void loadConfigFromXML(String configPath, String type) {
        logger.info("Configuration:解析xml配置文件");
        String path = convertClassPathAndGetRealPath(configPath);

        File f = new File(path);
        if (!f.exists()) {
            logger.warn("  Error : Server XML Config file doesn't exist! the path: " + path);
            return ;
        }
        logger.info("发现 Server XML Config file ：" + path);

        SAXReader reader = new SAXReader();
        Document doc = null;
        try {
            doc = reader.read(f);
        } catch (DocumentException e) {
            e.printStackTrace();
        }
        List<Element> kvList = (List<Element>)doc.selectNodes("/Server/property");
        for (int i = 0; i < kvList.size(); i++) {
            Element kv =  kvList.get(i);
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
        Config.set(key, value);
    }

    private void updateAssignment(String key, String value) {
        String preValue = Config.get(key);
        if (value.equals(preValue)) {
            logger.info("更新配置 \"" + key + "\" : " + (key.equals(ConfigConstants.EMAILPUSH_ACCOUNT_PASSWORD) ? "******" : value) + ", 但是因为值与原始值相同，所以未操作！");
        } else {
            if (preValue == null) {
                logger.warn("更新配置 \"" + key + "\" : " + (key.equals(ConfigConstants.EMAILPUSH_ACCOUNT_PASSWORD) ? "******" : value) + ", 但该key不属于默认配置项！");
            } else {
                logger.info("更新配置 \"" + key + "\" : " + (key.equals(ConfigConstants.EMAILPUSH_ACCOUNT_PASSWORD) ? "******" : value));
            }
            Config.set(key, value);
            if (key.equals(ConfigConstants.EMAILPUSH_THREAD_NUM)) {

            } else if (key.indexOf("_") != -1 && key.startsWith(emailPushPrefix)) {
                EmailUtil.updateAccountInfo();
            } else if (key.indexOf("_") != -1 && key.startsWith(toolSpeechPrefix)) {
                AudioUtil.updateTokenInfo();
            }
        }
    }

    private String convertClassPathAndGetRealPath (String path) {
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

}
