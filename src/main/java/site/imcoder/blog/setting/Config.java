package site.imcoder.blog.setting;

import java.util.*;


/**
 * 服务器的参数配置
 * 有其初始值
 * 其值可在xml中配置，并调用ConfigManager的loadConfig方法赋值,重新读取调用reloadConfig()
 *
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
     *
     * @param key
     * @param value
     */
    protected static void set(String key, String value) {
        prop.put(key, value);
    }

    /**
     * 获取配置项
     *
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
     *
     * @param key
     * @return
     */
    public static String get(String key) {
        return prop.get(key);
    }

    /**
     * 获取整数类型的配置项
     *
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
     *
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
     *
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
}
