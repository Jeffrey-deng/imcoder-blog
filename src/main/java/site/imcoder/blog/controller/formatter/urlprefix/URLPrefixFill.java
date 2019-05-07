package site.imcoder.blog.controller.formatter.urlprefix;

import com.fasterxml.jackson.annotation.JacksonAnnotationsInside;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import site.imcoder.blog.controller.formatter.urlprefix.impl.DefaultURLPrefixFiller;
import site.imcoder.blog.controller.json.deserializer.URLPrefixFillJsonDeserializer;
import site.imcoder.blog.controller.json.serializer.URLPrefixFillJsonSerializer;
import site.imcoder.blog.setting.ConfigConstants;

import java.lang.annotation.*;

/**
 * 填充文件相对路径为完整路径
 *
 * @author Jeffrey.Deng
 * @date 2017-12-03
 */
@Target(value = {ElementType.ANNOTATION_TYPE, ElementType.FIELD, ElementType.PARAMETER})
@Retention(value = RetentionPolicy.RUNTIME)
@Inherited
@Documented
@JacksonAnnotationsInside
@JsonSerialize(using = URLPrefixFillJsonSerializer.class)
@JsonDeserialize(using = URLPrefixFillJsonDeserializer.class)
public @interface URLPrefixFill {

    public static final String DEFAULT_EMPTY_PREFIX_VALUE = "###EMPTY";

    public static final String DEFAULT_SITE_PREFIX = ConfigConstants.SITE_ADDR;

    public final static String DEFAULT_CDN_PREFIX = ConfigConstants.SITE_CDN_ADDR;

    public final static String DEFAULT_CLOUD_PREFIX = ConfigConstants.SITE_CLOUD_ADDR;

    /**
     * 前缀可从Config获取，此字段为Config.get()的key值
     *
     * @return
     */
    public String prefixConfigKey() default DEFAULT_CLOUD_PREFIX;

    /**
     * 前缀可手动配置值，当此字段有值时，prefixConfigKey字段失效
     *
     * @return
     */
    public String prefixValue() default DEFAULT_EMPTY_PREFIX_VALUE;

    /**
     * 使用的序列化与发序列化类，默认为 {@link DefaultURLPrefixFiller}
     * 可自行实现，实现 {@link URLPrefixFiller} 接口，再配置到此字段即可
     *
     * @return
     */
    public Class<? extends URLPrefixFiller> using() default DefaultURLPrefixFiller.class;

    /**
     * 是否请求提交路径时，去除前缀
     * true:去除，false:不处理，默认true
     *
     * @return
     */
    public boolean useParseURL() default true;

}
