package site.imcoder.blog.common;

import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;
import java.util.List;

/**
 * ip工具
 *
 * @author Jeffrey.Deng
 */
public class IpUtil {

    private static Logger logger = Logger.getLogger(IpUtil.class);

    private static final String IP_CALLBACK_URL_TAOBAO = "http://ip.taobao.com/service/getIpInfo.php?ip=";

    private static final String IP_CALLBACK_URL_IPIP = "http://freeapi.ipip.net/";

    private static String IP_CALLBACK_USR_WHO = "ipip";

    private static final List<String> MUNICIPALITY = Arrays.asList(new String[]{"北京", "天津", "上海", "重庆"});

    private static final List<String> AUTONOMOUS = Arrays.asList(new String[]{"内蒙古", "广西", "宁夏", "新疆", "西藏"});

    private static final List<String> SPECIAL = Arrays.asList(new String[]{"香港", "澳门"});

    private static final String EMPTY = "XX";

    private static final String COUNTRY = "country";

    private static final String REGION = "region";

    private static final String CITY = "city";

    private static final String ISP = "isp";

    /**
     * 从输入流中获取字节数组
     *
     * @param inputStream
     * @return
     * @throws IOException
     */
    public static byte[] readInputStream(InputStream inputStream) throws IOException {
        ByteArrayOutputStream bos = null;
        try {
            byte[] buffer = new byte[8192];
            int len = 0;
            bos = new ByteArrayOutputStream();
            while ((len = inputStream.read(buffer)) != -1) {
                bos.write(buffer, 0, len);
            }
            return bos.toByteArray();
        } catch (IOException e) {
            throw e;
        } finally {
            try {
                if (bos != null) {
                    bos.close();
                }
                if (inputStream != null) {
                    inputStream.close();
                }
            } catch (IOException e) {
                logger.error("IpUtil's method synthesis find execption: " + e.toString());
            }
        }
    }

    /**
     * 请求ip接口
     *
     * @param ip
     * @return
     */
    public static String requestIpLocation(String ip) {
        String ipLocationStr = null;
        if (ip == null || ip.length() == 0) {
            return ipLocationStr;
        }
        try {
            URL url = new URL((IP_CALLBACK_USR_WHO.equals("taobao") ? IP_CALLBACK_URL_TAOBAO : IP_CALLBACK_URL_IPIP) + ip);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            //设置超时间为7秒
            conn.setConnectTimeout(7 * 1000);
            //防止屏蔽程序抓取而返回403错误
            conn.setRequestProperty("User-Agent", "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; DigExt)");
            conn.setRequestProperty("X-Requested-With", "XMLHttpRequest");
            //得到输入流
            InputStream inputStream = conn.getInputStream();
            //获取自己数组
            byte[] bytes = readInputStream(inputStream);
            ipLocationStr = new String(bytes, "utf-8");
        } catch (IOException e) {
            logger.warn("请求IP地址失败, ip: " + ip + " , exception: " + e.toString() + ", function: requestIpLocation");
            ipLocationStr = null;
        } finally {
            return ipLocationStr;
        }
    }

    /**
     * 拼接地址
     *
     * @param country
     * @param region
     * @param city
     * @param isp
     * @return
     */
    public static String generateIpLocation(String country, String region, String city, String isp) {
        String location = "";
        if (isp.equals("内网") || isp.equals("内网IP") || isp.equals("局域网")) {
            location = "局域网";
            return location;
        }
        if (SPECIAL.indexOf(country) != -1) {
            location += ("中国" + country + "特别行政区");
        } else {
            location += country;
        }
        if (country.equals("中国")) {
            if (MUNICIPALITY.indexOf(region) != -1) {
                location += (region + "市");
            } else if (AUTONOMOUS.indexOf(region) != -1) {
                location += (region + "自治区");
            } else {
                location += (region + "省");
            }
            if (contentIsNotEmpty(region, city)) {
                location += (city + (city.endsWith("市") ? "" : "市"));
            }
            if (contentIsNotEmpty(isp)) {
                location += isp;
            }
        } else if (country.equals("美国")) {
            location += (region + (region.endsWith("州") ? "" : "州"));
            if (contentIsNotEmpty(region, city)) {
                location += (city + "市");
            }
            if (contentIsNotEmpty(isp)) {
                location += isp;
            }
        } else {
            if (contentIsNotEmpty(country, region)) {
                location += region;
            }
            if (contentIsNotEmpty(region, city)) {
                location += city;
            }
            if (contentIsNotEmpty(isp)) {
                location += isp;
            }
        }
        return location;
    }

    private static boolean contentIsNotEmpty(String content) {
        if (content != null && content.length() > 0 && !content.equals(EMPTY)) {
            return true;
        } else {
            return false;
        }
    }

    private static boolean contentIsNotEmpty(String parent, String content) {
        if (contentIsNotEmpty(content) && !parent.equals(content)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 获取ip对应的地址字符串，失败返回null
     *
     * @param ip
     * @return
     */
    public static String getIpLocation(String ip) {
        String location = null;
        String locationStr = requestIpLocation(ip);
        try {
            if (IP_CALLBACK_USR_WHO.equals("taobao")) {
                location = parseTaobaoJson(locationStr);
            } else {
                location = parseIpipNetJson(locationStr);
            }
        } catch (Exception e) {
            logger.warn("转换IP地址失败, ip: " + ip + ", exception: " + e.toString());
            location = null;
        } finally {
            return location;
        }
    }

    private static String parseTaobaoJson(String str) throws Exception {
        JSONObject json = new JSONObject(str);
        if (json.getInt("code") == 0) {
            JSONObject data = json.getJSONObject("data");
            if (data.getString("isp_id").equals("local")) {
                return generateIpLocation(
                        data.getString(COUNTRY),
                        data.getString(REGION),
                        data.getString(CITY),
                        "内网");
            } else {
                return generateIpLocation(
                        data.getString(COUNTRY),
                        data.getString(REGION),
                        data.getString(CITY),
                        data.getString(ISP));
            }
        } else {
            throw new Exception("taobao interface return code == 1, requestHost: ip.taobao.com, function: parseTaobaoJson");
        }
    }

    private static String parseIpipNetJson(String str) throws Exception {
        if (str == null || "".equals(str)) {
            throw new Exception("IpipNet return data is empty, requestHost: freeapi.ipip.net, function: parseIpipNetJson");
        }
        JSONArray array = new JSONArray(str);
        if (array != null && array.length() > 0) {
            if ("本机地址".equals(array.getString(0))) {
                return generateIpLocation(
                        array.getString(0),
                        array.getString(1),
                        array.getString(2),
                        "局域网");
            } else {
                return generateIpLocation(
                        array.getString(0),
                        array.getString(1),
                        array.getString(2),
                        array.getString(4));
            }
        } else {
            throw new Exception("IpipNet return data is empty, requestHost: freeapi.ipip.net, function: parseIpipNetJson");
        }
    }

}
