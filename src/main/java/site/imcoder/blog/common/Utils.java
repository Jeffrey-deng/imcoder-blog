package site.imcoder.blog.common;

import java.io.File;
import java.io.UnsupportedEncodingException;
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
            e.printStackTrace();
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
        } catch (URISyntaxException e) {
            e.printStackTrace();
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
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
        } catch (URISyntaxException e) {
            e.printStackTrace();
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
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
        } catch (URISyntaxException e) {
            e.printStackTrace();
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        /*String name =getSubStr( Utils.class.getResource("/").toURI().resolve("../../").getPath() , 2 ).replaceAll("/", "");
        try {
			name = URLDecoder.decode(name,"utf-8");
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}*/
        return name;
    }

    //截取str的倒数第num个“/”之后的字符串
    private static String getSubStr(String str, int num) {
        String result = "";
        int i = 0;
        while (i < num) {
            int lastFirst = str.lastIndexOf('/');
            result = str.substring(lastFirst) + result;
            str = str.substring(0, lastFirst);
            i++;
        }
        return result.substring(1);
    }

    /**
     * MD5 MD2 SHA
     * 字符串加密
     *
     * @param pattern 加密的方式
     * @param value   待加密的字符串
     * @return 加密后且BASE64编码的字符串
     */
    public static String MD(String pattern, String value) {
        String returnValue = null;// 加密后的字符串
        // 加密的方式
        try {
            MessageDigest md = MessageDigest.getInstance(pattern);
            // 转型成base64编码
            returnValue = Base64.getEncoder().encodeToString(md.digest(value.getBytes("utf-8")));
            // getUrlEncoder(), 由于URL对反斜线“/”有特殊的意义，因此URL编码会替换掉它，使用下划线替换
        } catch (Exception e) {
            e.printStackTrace();
        }
        return returnValue;
    }

    /**
     * MD5且BASE64编码
     *
     * @param value
     * @return
     */
    public static String MD5(String value) {
        return MD("MD5", value);
    }

    /**
     * 编码URL
     * <p>
     * 当request已经设置为UTF-8时，不需要编码两次
     *
     * @param str
     * @return
     */
    public static String encoder(String str) {
        String result = null;
        try {
            result = URLEncoder.encode(str, "utf-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
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
    public static String decoder(String str) {
        String result = null;
        try {
            result = URLDecoder.decode(str, "utf-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
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

    public static boolean isBlank(String str) {
        if (isEmpty(str)) {
            return true;
        } else {
            return str.matches("^\\s*$");
        }
    }

    public static boolean isNotBlank(String str) {
        return !isBlank(str);
    }

    public static boolean isEmpty(String str) {
        return str == null || str.length() == 0;
    }

    public static boolean isNotEmpty(String str) {
        return !isEmpty(str);
    }

    public static String formatDate(Date date, String pattern) {
        if (isEmpty(pattern)) {
            pattern = "yyyy-MM-dd HH:mm:ss";
        }
        SimpleDateFormat sdf = new SimpleDateFormat(pattern);
        String format = sdf.format(date);
        return format;
    }

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

}
