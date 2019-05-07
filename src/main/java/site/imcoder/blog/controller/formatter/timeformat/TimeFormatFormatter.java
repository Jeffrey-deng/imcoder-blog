package site.imcoder.blog.controller.formatter.timeformat;

import org.springframework.format.Formatter;
import site.imcoder.blog.controller.formatter.general.Converter;
import site.imcoder.blog.controller.formatter.timeformat.impl.DateTimeFormatConverter;
import site.imcoder.blog.controller.formatter.timeformat.impl.LongTimeFormatConverter;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 时间格式转换Formatter
 *
 * @author Jeffrey.Deng
 * @date 2018-12-03
 */
public class TimeFormatFormatter implements Formatter<Object> {

    private Pattern locale_pattern = Pattern.compile("([a-zA-z]+)[_-]([a-zA-z]+)");

    private TimeFormat timeFormat;

    private Class fieldClass;

    private SimpleDateFormat sdf;

    private Converter converter;

    public TimeFormatFormatter() {
    }

    public TimeFormatFormatter(TimeFormat timeFormat, Class fieldClass) {
        this.timeFormat = timeFormat;
        this.fieldClass = fieldClass;
        this.sdf = getSimpleDateFormat(timeFormat);
        if (fieldClass.equals(Date.class)) {
            this.converter = new DateTimeFormatConverter(timeFormat, sdf);
        } else if (fieldClass.equals(Long.class)) {
            this.converter = new LongTimeFormatConverter(timeFormat, sdf);
        } else {
            throw new RuntimeException("TimeFormat Annotation don't support this field type: " + fieldClass.toString());
        }
    }

    @Override
    public Object parse(String text, Locale locale) throws ParseException {
        return converter.parse(timeFormat, fieldClass, text);
    }

    @Override
    public String print(Object object, Locale locale) {
        return converter.print(timeFormat, fieldClass, object);
    }

    private SimpleDateFormat getSimpleDateFormat(TimeFormat timeFormat) {
        SimpleDateFormat sdf = null;
        if (timeFormat == null) {
            sdf = new SimpleDateFormat(TimeFormat.DEFAULT_PATTERN);
        } else {
            String locale_str = timeFormat.locale();
            if (timeFormat.locale().equals(TimeFormat.DEFAULT_LOCALE)) {
                sdf = new SimpleDateFormat(timeFormat.pattern());
            } else {
                Matcher locale_matcher = locale_pattern.matcher(locale_str);
                Locale locale = null;
                if (locale_matcher.find()) {
                    locale = new Locale(locale_matcher.group(1).toLowerCase(), locale_matcher.group(2).toUpperCase());
                } else {
                    locale = new Locale(locale_str);
                }
                sdf = new SimpleDateFormat(timeFormat.pattern(), locale);
            }
            if (!timeFormat.timezone().equals(TimeFormat.DEFAULT_TIMEZONE)) {
                sdf.setTimeZone(TimeZone.getTimeZone(timeFormat.timezone()));
            }
        }
        return sdf;
    }

}
