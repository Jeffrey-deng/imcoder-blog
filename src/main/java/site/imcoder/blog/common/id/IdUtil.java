package site.imcoder.blog.common.id;

import site.imcoder.blog.common.Utils;

import java.util.UUID;

/**
 * 主键id工具类
 *
 * @author Jeffrey.Deng
 * @date 2018-06-17
 */
public class IdUtil {

    // 唯一id生成算法类
    private static SimpleSnowflakeIdWorker idWorker = new SimpleSnowflakeIdWorker();

    // 62进制字典
    private final static char[] dict62 = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
            'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
            'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',}; // '+', '/'

    // 不能使用的特殊关键字
    private static String[] special_keywords_short = {"home", "videos", "albums", "photos", "articles", "center", "history", "likes"};

    private static long[] special_keywords_long = null;

    /**
     * 转换旧式id为新式id
     *
     * @param id
     * @return
     */
    public static long convertOldPrimaryKeyToNew(long id) {
        if (id == 0) {
            return 0L;
        }
        long timestampBits = 5L;
        return idWorker.operationResultId(31536000000L + id * 194275 + 233594976L, timestampBits, id % (-1L ^ (-1L << timestampBits)));
    }

    /**
     * 生成主键id
     *
     * @return
     */
    public static long generatePrimaryKey() {
        long id = idWorker.nextId();
        if (special_keywords_long == null) {
            synchronized (special_keywords_short) {
                special_keywords_long = new long[special_keywords_short.length];
                for (int i = 0; i < special_keywords_short.length; i++) {
                    special_keywords_long[i] = convertToLongPrimaryKey(special_keywords_short[i]);
                }
            }
        }
        boolean isRepeat = false;
        for (long special_keyword_value : special_keywords_long) {
            if (special_keyword_value == id) {
                isRepeat = true;
                break;
            }
        }
        if (isRepeat) {
            return generatePrimaryKey();
        } else {
            return id;
        }
    }

    /**
     * 短码id转长码id
     *
     * @return
     */
    public static long convertToLongPrimaryKey(String shortId) {
        if (Utils.isNotEmpty(shortId)) {
            return convert62radixIdToDecimal(shortId);
        } else {
            return 0L;
        }
    }

    /**
     * 生成短码id
     *
     * @return
     */
    public static String generateShortPrimaryKey() {
        return convertDecimalIdTo62radix(generatePrimaryKey());
    }

    /**
     * 长码id转短码id
     *
     * @return
     */
    public static String convertToShortPrimaryKey(long longId) {
        return convertDecimalIdTo62radix(longId);
    }

    /**
     * 十进制id转为十六制id
     *
     * @param id
     * @return
     */
    public static String convertDecimalIdToHex(long id) {
        return Long.toHexString(id);
    }

    /**
     * 十六制id转为十进制id
     *
     * @param id
     * @return
     */
    public static long convertHexIdToDecimal(String id) {
        return (Long.parseLong(id, 16));
    }

    /**
     * 把10进制的数字转换成62进制
     *
     * @param number
     * @return
     */
    public static String convertDecimalIdTo62radix(long number) {
        StringBuilder sBuilder = new StringBuilder();
        while (true) {
            int remainder = (int) (number % 62);
            sBuilder.append(dict62[remainder]);
            number = number / 62;
            if (number == 0) {
                break;
            }
        }
        return sBuilder.reverse().toString();
    }

    /**
     * 把62进制的字符串转换成10进制
     *
     * @param compressStr
     * @return
     */
    public static long convert62radixIdToDecimal(String compressStr) {
        long sum = 0L;
        int len = compressStr.length();
        for (int i = 0; i < len; i++) {
            char ch = compressStr.charAt(len - i - 1);
            int n = 0;
            for (int j = 0; j < dict62.length; j++) {
                if (ch == dict62[j]) {
                    n = j;
                    break;
                }
            }
            sum += Math.pow(dict62.length, i) * n;
        }
        return sum;
    }

    /**
     * 生成uuid
     *
     * @return
     */
    public static String generateUUID() {
        return UUID.randomUUID().toString().replace("-", "").toLowerCase();
    }

    /**
     * 判断id是否合法
     *
     * @param id
     * @return
     */
    public static boolean containValue(Long id) {
        return id != null && id > 0;
    }

    /**
     * 判断id是否合法
     *
     * @param id
     * @return
     */
    public static boolean containValue(Integer id) {
        return id != null && id > 0;
    }

}
