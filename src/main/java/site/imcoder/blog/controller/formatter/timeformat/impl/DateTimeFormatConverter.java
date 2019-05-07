package site.imcoder.blog.controller.formatter.timeformat.impl;

import site.imcoder.blog.controller.formatter.general.Converter;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Date <code><-></code> DateStr
 *
 * @author Jeffrey.Deng
 * @date 2018-12-03
 */
public class DateTimeFormatConverter implements Converter<TimeFormat, Date> {

    private TimeFormat timeFormat;

    private SimpleDateFormat sdf;

    public DateTimeFormatConverter() {
    }

    public DateTimeFormatConverter(TimeFormat timeFormat, SimpleDateFormat sdf) {
        this.timeFormat = timeFormat;
        this.sdf = sdf;
    }

    /**
     * 转换请求
     *
     * @param annotation
     * @param fieldClazz
     * @param input
     * @return
     */
    @Override
    public Date parse(TimeFormat annotation, Class fieldClazz, String input) throws ParseException {
        if (input == null || input.length() == 0) {
            return null;
        } else {
            return sdf.parse(input);
        }
    }

    /**
     * 转换输出
     *
     * @param annotation
     * @param fieldClazz
     * @param date
     * @return
     */
    @Override
    public String print(TimeFormat annotation, Class fieldClazz, Date date) {
        if (date == null) {
            return "";
        } else {
            return sdf.format(date);
        }
    }
}
