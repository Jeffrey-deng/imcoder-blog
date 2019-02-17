package site.imcoder.blog.setting;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
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

    /**
     * 返回一个list，类型为clazz决定
     *
     * @param key
     * @param clazz
     * @param <T>
     * @return
     */
    public static <T> List<T> getList(String key, Class<T> clazz) {
        String value = get(key);
        try {
            value = value.trim();
            ObjectMapper mapper = new ObjectMapper();
            mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            return mapper.readValue(value, new TypeReference<List<T>>() {
            });
        } catch (IOException e) {
            e.printStackTrace();
        }
        return new ArrayList<>();
    }

    /**
     * 得到一个配置项中的子配置项, 没有值则返回默认值
     * <pre>
     * 例：
     * 配置项compress中，有值：preview@user_16:raw@user_36:small
     * 则：
     * getChild("compress", "@user_", "16", ":"); 取用户16的值raw
     * getChild("compress", "@user_", "36", ":"); 取用户36的值small
     * getChild("compress", "@user_", "26", ":"); 无值则返回默认值preview
     * getChildNotDefault("compress", "@user_", "26", ":"); 无值则返回空值（null）
     * getChildDefault("compress", "@user_"); 返回默认值preview <pre/>
     * @param key 配置项key
     * @param childPrefix 自配置项key的前缀
     * @param child 自配置项key
     * @param childSuffix 自配置项key的后缀
     * @return
     */
    public static String getChild(String key, String childPrefix, String child, String childSuffix) {
        String childValue = getChildNotDefault(key, childPrefix, child, childSuffix);
        return childValue == null ? getChildDefault(key, childPrefix) : childValue;
    }

    /**
     * 得到一个配置项中的子配置项默认值
     * <pre>
     * 例：
     * 配置项compress中，有值：preview@user_16:raw@user_36:small
     * 则：
     * getChild("compress", "@user_", "16", ":"); 取用户16的值raw
     * getChild("compress", "@user_", "36", ":"); 取用户36的值small
     * getChild("compress", "@user_", "26", ":"); 无值则返回默认值preview
     * getChildNotDefault("compress", "@user_", "26", ":"); 无值则返回空值（null）
     * getChildDefault("compress", "@user_"); 返回默认值preview <pre/>
     * @param key 配置项key
     * @param childPrefix 自配置项key的前缀
     * @return
     */
    public static String getChildDefault(String key, String childPrefix) {
        String line = get(key);
        try {
            if (line == null || line.length() == 0) {
                return line;
            }
            int index = line.indexOf(childPrefix);
            if (index != -1) {
                return line.substring(0, index);
            } else {
                return line;
            }
        } catch (Exception e) {
            return line;
        }
    }

    /**
     * 得到一个配置项中的子配置项, 没有值则返回null
     * <pre>
     * 例：
     * 配置项compress中，有值：preview@user_16:raw@user_36:small
     * 则：
     * getChild("compress", "@user_", "16", ":"); 取用户16的值raw
     * getChild("compress", "@user_", "36", ":"); 取用户36的值small
     * getChild("compress", "@user_", "26", ":"); 无值则返回默认值preview
     * getChildNotDefault("compress", "@user_", "26", ":"); 无值则返回空值（null）
     * getChildDefault("compress", "@user_"); 返回默认值preview <pre/>
     * @param key 配置项key
     * @param childPrefix 自配置项key的前缀
     * @param child 自配置项key
     * @param childSuffix 自配置项key的后缀
     * @return
     */
    public static String getChildNotDefault(String key, String childPrefix, String child, String childSuffix) {
        try {
            String line = get(key);
            if (line == null || line.length() == 0) {
                return line;
            }
            String childKey = childPrefix + child + childSuffix;
            int i = line.indexOf(childKey);
            if (i != -1) {
                int start = i + childKey.length();
                if (start >= line.length()) {
                    return "";
                }
                int end = line.indexOf(childPrefix, start);
                if (end == -1) {
                    end = line.length();
                }
                return line.substring(start, end);
            } else {
                return null;
            }
//            // 正则方式查找
//            line += childPrefix; // 解决非贪婪模式问题
//            childPrefix = Utils.escapeExprSpecialWord(childPrefix);
//            child = Utils.escapeExprSpecialWord(child);
//            childSuffix = Utils.escapeExprSpecialWord(childSuffix);
//            Pattern pattern = Pattern.compile(".*" + childPrefix + child + childSuffix + "(.*?)" + childPrefix + ".*$");
//            Matcher matcher = pattern.matcher(line);
//            if (matcher.find()) {
//                return matcher.group(1);
//            } else {
//                return null;
//            }
        } catch (Exception e) {
            return null;
        }
    }

}
