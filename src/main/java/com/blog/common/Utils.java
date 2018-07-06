package com.blog.common;

import sun.misc.BASE64Encoder;

import java.io.File;
import java.io.UnsupportedEncodingException;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * description: 工具类
 * @author dengchao
 * @date 2016-7-12
 */
public class Utils {

	/**
	 * description:得到当前项目根路径
	 * @author dengchao
	 * @return String
	 */
	public static String getContextRealPath(){
		String path = null;
		try {
			path = Utils.class.getResource("/").toURI().resolve("../../").getPath();
			path = URLDecoder.decode(path,"utf-8");
		} catch (URISyntaxException e) {
			e.printStackTrace();
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}
		return path;
	}

	/**
	 * description:得到当前项目根路路径的父路径
	 * @author dengchao
	 * @return String
	 */
	public static String getContextFatherPath(){
		String path = null;
		try {
			path = Utils.class.getResource("/").toURI().resolve("../../../").getPath();
			path = URLDecoder.decode(path,"utf-8");
		} catch (URISyntaxException e) {
			e.printStackTrace();
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}
		return path;
	}

	/**
	 * description:得到当前项目名
	 * @author dengchao
	 * @return String
	 */
	public static String getContextName(){
		String name = null;
		try {
			name = new File(Utils.class.getResource("/").toURI().resolve("../../")).getName();
			name = URLDecoder.decode(name,"utf-8");
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
		while(i < num) {
			int lastFirst = str.lastIndexOf('/');
			result = str.substring(lastFirst) + result;
			str = str.substring(0, lastFirst);
			i++;
		}
		return result.substring(1);
	}


	/**
	 * description: 转换date为字符串
	 * @author dengchao
	 * @param date
	 * @param format 日期格式
	 * @return String
	 */
	public static String FormatDate(Date date, String format){
		SimpleDateFormat sdf = new SimpleDateFormat(format);
		String str = sdf.format(date);
		return str;

	}

	/**MD5 MD2 SHA
	 * 字符串加密
	 * @param pattern 加密的方式
	 * @param value 待加密的字符串
	 * @return 加密后的字符串
	 */
	public static String MD(String pattern, String value) {
		String returnValue = "";// 加密后的字符串
		// 加密的方式
		try {
			MessageDigest digest = MessageDigest.getInstance(pattern);
			// digest.digest( value.getBytes() );
			// 转型成utf-8字符编码
			BASE64Encoder encoder = new BASE64Encoder();
			returnValue = encoder.encode(digest.digest(value.getBytes("utf-8")));
		} catch (Exception e) {
			e.printStackTrace();
		}
		return returnValue;
	}

	/**
	 * 编码URL
	 *
	 * js需要两次decodeURIComponent解码
	 * @param str
	 * @return
	 */
	public static String encoder(String str){
		String result = null;
		try {
			result = URLEncoder.encode(URLEncoder.encode(str,"utf-8"),"utf-8");
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}
		return result;
	}

	/**
	 * 解码URL
	 * @param str
	 * @return
	 */
	public static String decoder(String str){
		String result = null;
		try {
			result = URLDecoder.decode(URLDecoder.decode(str,"utf-8"),"utf-8");
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}
		return result;
	}

	/**
	 * 生成一个验证码
	 * @return
	 */
	public static String getValidateCode(){
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
			ip = request.getRemoteAddr();
		}
		return ip.equals("0:0:0:0:0:0:0:1") ? "127.0.0.1" : ip;
	}

    /**
     * 从str中获取标记中间的字段
     * @param source
     * @param pattern_start
     * @param pattern_end
     * @return
     */
	public static String getMatchInStr(String source, String pattern_start, String pattern_end) {
		String regex = ".*?"+ pattern_start +"(.*?)" + pattern_end + ".*?";
		Pattern pattern = Pattern.compile(regex);
		Matcher matcher = pattern.matcher(source);
		String result = "";
		while (matcher.find()) {
			result = matcher.group(1);
		}
		return result;
	}

}
