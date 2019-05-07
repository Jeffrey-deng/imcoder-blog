package site.imcoder.blog.controller.formatter.primarykey;

import org.springframework.format.Formatter;
import site.imcoder.blog.common.id.IdUtil;

import java.text.ParseException;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Formatter：实现“前端短码id”与“后端长码id”自动转换
 *
 * @author Jeffrey.Deng
 * @date 2019-08-26
 */
public class PrimaryKeyConvertFormatter implements Formatter<Long> {

    private final static String ZERO = "0";

    private PrimaryKeyConvert primaryKeyConvert;

    private Pattern longInputPattern = null;

    public PrimaryKeyConvertFormatter() {
        longInputPattern = Pattern.compile("^\\d{12,}$");
    }

    public PrimaryKeyConvertFormatter(PrimaryKeyConvert primaryKeyConvert) {
        this();
        this.primaryKeyConvert = primaryKeyConvert;
    }

    @Override
    public Long parse(String shortKey, Locale locale) throws ParseException {
        if (shortKey == null || shortKey.length() == 0) {
            if (primaryKeyConvert != null && !primaryKeyConvert.parseZeroIfNull()) { // 设置空值不允许转换为0时不转换
                return null;
            } else {
                return 0L;
            }
        } else {
            if (primaryKeyConvert != null && primaryKeyConvert.supportLongParse() && longInputPattern.matcher(shortKey).matches()) { // 字段设置为支持解码长码id时直接使用长码
                return Long.valueOf(shortKey);
            } else {
                return IdUtil.convertToLongPrimaryKey(shortKey);
            }
        }
    }

    @Override
    public String print(Long longKey, Locale locale) {
        if (longKey == null) {
            if (primaryKeyConvert != null && primaryKeyConvert.printZeroIfNull()) { // 字段设置为null打印0时，打印0
                return ZERO;
            } else {
                return null;
            }
        } else {
            if (primaryKeyConvert != null && !primaryKeyConvert.printShort()) { // 字段设置为打印长码id时打印长码
                return String.valueOf(longKey);
            } else {
                return IdUtil.convertToShortPrimaryKey(longKey);
            }
        }
    }

}
