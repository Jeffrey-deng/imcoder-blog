package site.imcoder.blog.common;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.introspect.JacksonAnnotationIntrospector;
import org.apache.log4j.Logger;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.lang.annotation.Annotation;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.security.MessageDigest;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * description: 工具类
 *
 * @author dengchao
 * @date 2016-7-12
 */
public class Utils {

    private static Logger logger = Logger.getLogger(Utils.class);

    private static char[] digits = new char[]{'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'};

    /**
     * 得到classPath
     *
     * @return
     */
    public static String getClassPath() {
        String path = null;
        try {
            path = Utils.class.getResource("/").getPath();
            path = URLDecoder.decode(path, "utf-8");
        } catch (UnsupportedEncodingException e) {
            logger.error("getClassPath find exception: " + e.toString());
        }
        return path;
    }

    /**
     * 传入路径，返回是否是绝对路径，是绝对路径返回true，反之
     *
     * @param path
     * @return
     */
    public static boolean isAbsolutePath(String path) {
        if (path.startsWith("/") || path.indexOf(":\\") > 0 || path.indexOf(":/") > 0) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * description:得到当前项目根路径
     *
     * @return String
     * @author dengchao
     */
    public static String getContextRealPath() {
        String path = null;
        try {
            path = Utils.class.getResource("/").toURI().resolve("../../").getPath();
            path = URLDecoder.decode(path, "utf-8");
        } catch (URISyntaxException | UnsupportedEncodingException e) {
            logger.error("getContextRealPath find exception: " + e.toString());
        }
        return path;
    }

    /**
     * description:得到当前项目根路路径的父路径
     *
     * @return String
     * @author dengchao
     */
    public static String getContextFatherPath() {
        String path = null;
        try {
            path = Utils.class.getResource("/").toURI().resolve("../../../").getPath();
            path = URLDecoder.decode(path, "utf-8");
        } catch (URISyntaxException | UnsupportedEncodingException e) {
            logger.error("getContextFatherPath find exception: " + e.toString());
        }
        return path;
    }

    /**
     * description:得到当前项目名
     *
     * @return String
     * @author dengchao
     */
    public static String getContextName() {
        String name = null;
        try {
            name = new File(Utils.class.getResource("/").toURI().resolve("../../")).getName();
            name = URLDecoder.decode(name, "utf-8");
        } catch (URISyntaxException | UnsupportedEncodingException e) {
            logger.error("getContextName find exception: " + e.toString());
        }
        //    String name = getSubStr(Utils.class.getResource("/").toURI().resolve("../../").getPath(), 2).replaceAll("/", "");
        //    try {
        //        name = URLDecoder.decode(name, "utf-8");
        //    } catch (UnsupportedEncodingException e) {
        //        e.printStackTrace();
        //    }
        return name;
    }

    // 截取str的倒数第num个“separator”之后的字符串
    public static String getSubStr(String str, int num, String separator) {
        String result = "";
        int i = 0;
        while (i < num) {
            int lastFirst = str.lastIndexOf(separator);
            result = str.substring(lastFirst) + result;
            str = str.substring(0, lastFirst);
            i++;
        }
        return result.substring(1);
    }

    /**
     * 将16进制字符解码成字节数组
     *
     * @param data
     * @return
     * @throws Exception
     */
    public static byte[] decodeHex(char[] data) throws Exception {
        int l = data.length;
        if ((l & 1) != 0) {
            throw new Exception("Odd number of characters.");
        } else {
            byte[] out = new byte[l >> 1];
            int i = 0;
            for (int j = 0; j < l; ++i) {
                int f = Character.digit(data[j++], 16) << 4;
                f |= Character.digit(data[j++], 16);
                out[i] = (byte) (f & 255);
            }
            return out;
        }
    }

    /**
     * 将字节数组编码成16进制字符数组
     *
     * @param data
     * @return
     */
    public static char[] encodeHex(byte[] data) {
        int l = data.length;
        char[] out = new char[l << 1];
        int i = 0;
        for (int j = 0; i < l; ++i) {
            out[j++] = digits[(240 & data[i]) >>> 4];
            out[j++] = digits[15 & data[i]];
        }
        return out;
    }

    /**
     * MD5 MD2 SHA
     * 字符串加密
     *
     * @param pattern          加密的方式
     * @param str              待加密的字符串
     * @param encodeWithBase64 true使用base64编码，false使用16进制编码
     * @return 加密后且BASE64编码的字符串
     */
    public static String MD(String pattern, String str, boolean encodeWithBase64) {
        String returnValue = null;// 加密后的字符串
        // 加密的方式
        try {
            MessageDigest md = MessageDigest.getInstance(pattern);
            if (encodeWithBase64) {
                // 转型成base64编码
                returnValue = Base64.getEncoder().encodeToString(md.digest(str.getBytes("utf-8")));
                // getUrlEncoder(), 由于URL对反斜线“/”有特殊的意义，因此URL编码会替换掉它，使用下划线替换
            } else {
                returnValue = new String(encodeHex(md.digest(str.getBytes("utf-8"))));
            }
        } catch (Exception e) {
            logger.error("MD find exception: " + e.toString());
        }
        return returnValue;
    }

    /**
     * 16进制编码的MD5
     *
     * @param str
     * @return
     */
    public static String MD5(String str) {
        return MD("MD5", str, false);
    }

    /**
     * 编码URL
     * <p>
     * 当request已经设置为UTF-8时，不需要编码两次
     *
     * @param str
     * @return
     */
    public static String encodeURL(String str) {
        String result = null;
        try {
            result = URLEncoder.encode(str, "utf-8");
        } catch (UnsupportedEncodingException e) {
            logger.error("encodeURL find exception: " + e.toString());
        }
        return result;
    }

    /**
     * 解码URL
     * 当request已经设置为UTF-8时，不需要编码两次
     *
     * @param str
     * @return
     */
    public static String decodeURL(String str) {
        String result = null;
        try {
            result = URLDecoder.decode(str, "utf-8");
        } catch (UnsupportedEncodingException e) {
            logger.error("decodeURL find exception: " + e.toString());
        }
        return result;
    }

    /**
     * 生成一个验证码
     *
     * @return
     */
    public static String getValidateCode() {
        // 产生随机密码
        Random rd = new Random(); // 产生的是[0,1)的小数
        String code = "";
        int getNum;
        int getChar;
        do {
            getNum = Math.abs(rd.nextInt()) % 10 + 48;// 产生数字0-9的随机数
            getChar = Math.abs(rd.nextInt()) % 26 + 97;// 产生字母a-z的随机数
            char n = (char) getNum;
            char c = (char) getChar;
            String dn = Character.toString(n) + Character.toString(c);
            code += dn;
        } while (code.length() < 6);
        return code;
    }

    /**
     * 获取请求IP
     *
     * @param request
     * @return
     */
    public static String getRemoteAddr(javax.servlet.http.HttpServletRequest request) {
        String ip = request.getHeader("x-forwarded-for");
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip.equals("0:0:0:0:0:0:0:1") ? "127.0.0.1" : ip;
    }

    /**
     * 获取请求路径相对于contextPath的值，不包含参数
     * <pre>
     * 当contextPath为/blog时
     *      http://localhost:8080/blog/  -->  /
     *      http://localhost:8080/blog/article/list  -->  /article/list
     * 当contextPath为空时
     *      http://localhost:8080/ -->  /
     *      http://localhost:8080/article/list  -->  /article/list
     * </pre>
     *
     * @param request
     * @return
     */
    public static String getRequestPath(javax.servlet.http.HttpServletRequest request) {
        String path = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath.length() > 0) {
            path = path.substring(contextPath.length());
        }
        if (path.length() == 0) {
            path = "/";
        }
        return path;
    }

    /**
     * 从str中获取标记中间的字段
     *
     * @param source
     * @param pattern_start
     * @param pattern_end
     * @return
     */
    public static String getMatchInStr(String source, String pattern_start, String pattern_end) {
        String regex = ".*?" + pattern_start + "(.*?)" + pattern_end + ".*?";
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(source);
        String result = "";
        while (matcher.find()) {
            result = matcher.group(1);
        }
        return result;
    }

    /**
     * split去除空字符串
     *
     * @param str
     * @param separator
     * @return
     */
    public static String[] splitNotEmpty(String str, String separator) {
        if (str == null) {
            return null;
        }
        List<String> list = new ArrayList<String>();
        String[] splits = str.split(separator);
        for (String split : splits) {
            if (split.length() > 0) {
                list.add(split);
            }
        }
        return list.toArray(new String[list.size()]);
    }

    /**
     * 转义正则特殊字符 （$()*+.[]?\^{}
     * \\需要第一个替换
     */
    public static String escapeExprSpecialWord(String str) {
        if (str == null || str.length() == 0) {
            return str;
        }
        return str.replace("\\", "\\\\").replace("*", "\\*")
                .replace("+", "\\+").replace("|", "\\|")
                .replace("{", "\\{").replace("}", "\\}")
                .replace("(", "\\(").replace(")", "\\)")
                .replace("^", "\\^").replace("$", "\\$")
                .replace("[", "\\[").replace("]", "\\]")
                .replace("?", "\\?").replace(",", "\\,")
                .replace(".", "\\.").replace("&", "\\&");
    }

    /**
     * 为null或为空白字符
     *
     * @param str
     * @return
     */
    public static boolean isBlank(String str) {
        if (isEmpty(str)) {
            return true;
        } else {
            return str.matches("^\\s*$");
        }
    }

    /**
     * 不为null且不为空白字符
     *
     * @param str
     * @return
     */
    public static boolean isNotBlank(String str) {
        return !isBlank(str);
    }

    /**
     * 为null或为空字符串
     *
     * @param str
     * @return
     */
    public static boolean isEmpty(String str) {
        return str == null || str.length() == 0;
    }

    /**
     * 不为null且不为空字符串
     *
     * @param str
     * @return
     */
    public static boolean isNotEmpty(String str) {
        return !isEmpty(str);
    }

    /**
     * date对象转字符串
     *
     * @param date
     * @param pattern
     * @return
     */
    public static String formatDate(Date date, String pattern) {
        if (isEmpty(pattern)) {
            pattern = "yyyy-MM-dd HH:mm:ss";
        }
        SimpleDateFormat sdf = new SimpleDateFormat(pattern);
        String format = sdf.format(date);
        return format;
    }

    /**
     * 字符串转date对象
     *
     * @param dateStr
     * @param pattern
     * @return
     */
    public static Date parseDate(String dateStr, String pattern) {
        if (isEmpty(dateStr) || isEmpty(pattern)) {
            return null;
        }
        SimpleDateFormat sdf = new SimpleDateFormat(pattern);
        try {
            return sdf.parse(dateStr);
        } catch (ParseException e) {
            return null;
        }
    }

    // 复制时禁用某些注解
    private static class IgnoreMaskAnnotationIntrospector extends JacksonAnnotationIntrospector {
        @Override
        public boolean isAnnotationBundle(Annotation ann) {
            if ((ann.annotationType().equals(PrimaryKeyConvert.class)) || ann.annotationType().equals(TimeFormat.class)) {
                return false;
            } else {
                return super.isAnnotationBundle(ann);
            }
        }
    }

    /**
     * 复制对象
     *
     * @param obj
     * @param <T>
     * @return
     */
    public static <T> T copyBeanByJson(Object obj) {
        return copyBeanByJson(obj, obj.getClass());
    }

    /**
     * 复制对象
     *
     * @param obj
     * @param clazz - 改变class的作用，例如可将DTO对象复制成VO对象
     * @param <T>
     * @return
     */
    public static <T> T copyBeanByJson(Object obj, Class clazz) {
        ObjectMapper objectMapper = null;
        Object other = null;
        try {
            objectMapper = new ObjectMapper();
            objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            objectMapper.configure(MapperFeature.USE_ANNOTATIONS, false);   // 禁用所有注解
            // objectMapper.setAnnotationIntrospector(new IgnoreMaskAnnotationIntrospector()); // 禁用特定注解
            other = objectMapper.readValue(objectMapper.writeValueAsString(obj), clazz);
        } catch (JsonProcessingException e) {
            logger.error("copyBeanByJson find exception: " + e.toString() + ", is not ignore some annotation ?");
        } catch (IOException e) {
            logger.error("copyBeanByJson find exception: " + e.toString());
        }
        return (T) other;
    }

    /**
     * 复制集合类的
     *
     * @param obj
     * @param collectionClazz 指定集合的class，（改变class，例如可以将List复制成Set）
     * @param clazz           指定集合内容的class
     * @param <T>
     * @return
     */
    public static <T> T copyCollectionByJson(Object obj, Class collectionClazz, Class clazz) {
        ObjectMapper objectMapper = null;
        try {
            objectMapper = new ObjectMapper();
            objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            objectMapper.configure(MapperFeature.USE_ANNOTATIONS, false);   // 禁用所有注解
            // objectMapper.setAnnotationIntrospector(new IgnoreMaskAnnotationIntrospector()); // 禁用特定注解
            JavaType javaType = objectMapper.getTypeFactory().constructParametricType(collectionClazz, clazz);
            return objectMapper.readValue(objectMapper.writeValueAsString(obj), javaType);
        } catch (JsonProcessingException e) {
            logger.error("copyCollectionByJson find exception: " + e.toString() + ", is not ignore some annotation ?");
        } catch (IOException e) {
            logger.error("copyCollectionByJson find exception: " + e.toString());
        }
        return null;
    }

    /**
     * 复制list
     *
     * @param obj
     * @param clazz 指定list内容的class
     * @param <T>
     * @return
     */
    public static <T> T copyListByJson(Object obj, Class clazz) {
        return copyCollectionByJson(obj, List.class, clazz);
    }

}
