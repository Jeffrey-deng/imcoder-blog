package site.imcoder.blog.controller.formatter.timeformat;

import com.fasterxml.jackson.annotation.JacksonAnnotationsInside;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import site.imcoder.blog.controller.json.deserializer.TimeFormatDeserializer;
import site.imcoder.blog.controller.json.serializer.TimeFormatSerializer;

import java.lang.annotation.*;

/**
 * 时间格式化注解
 * 支持 Date类型和Long类型
 * 注意字段需要是 "Long", 为 "long" 不可以, 因为formatter只支持对象
 *
 * @author Jeffrey.Deng
 * @date 2018-12-03
 */
@Target(value = {ElementType.ANNOTATION_TYPE, ElementType.FIELD, ElementType.PARAMETER})
@Retention(value = RetentionPolicy.RUNTIME)
@Inherited
@Documented
@JacksonAnnotationsInside
@JsonSerialize(using = TimeFormatSerializer.class)
@JsonDeserialize(using = TimeFormatDeserializer.class)
public @interface TimeFormat {

    public static final String DEFAULT_PATTERN = "EEE MMM dd HH:mm:ss zzz yyyy";

    public final static String DEFAULT_LOCALE = "##default";

    public final static String DEFAULT_TIMEZONE = "##default";

    /**
     * 日期需要的格式
     * 默认：EEE MMM dd HH:mm:ss zzz yyyy
     *
     * @return
     */
    public String pattern() default DEFAULT_PATTERN;

    /**
     * 日期语言
     * 格式：{language}_{country} 或 {language}-{country} 或 {language}
     * 例：zh_CN、zh-CN、zh
     * 不填默认为当前系统语言
     *
     * @return
     */
    public String locale() default DEFAULT_LOCALE;

    /**
     * 日期时区
     * 格式：GMT+{timezoneId}
     * 例：GMT+8
     * 不填默认当前系统时间时区
     *
     * @return
     */
    public String timezone() default DEFAULT_TIMEZONE;

}
