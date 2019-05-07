package site.imcoder.blog.controller.formatter.primarykey;

import com.fasterxml.jackson.annotation.JacksonAnnotationsInside;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import site.imcoder.blog.controller.json.deserializer.PrimaryKeyJsonDeserializer;
import site.imcoder.blog.controller.json.serializer.PrimaryKeyJsonSerializer;

import java.lang.annotation.*;

/**
 * 字段添加该注解可以让“前端短码id”与“后端长码id”自动转换
 * 返回前端时:
 * AJAX返回的JSON会自动处理。
 * JSP需要<s:eval expression="object_key"/>取对应的短码。
 * 注意字段需要是 "Long", 为 "long" 不可以, 因为formatter只支持对象
 *
 * @author Jeffrey.Deng
 * @date 2019-08-26
 */
@Target(value = {ElementType.ANNOTATION_TYPE, ElementType.FIELD, ElementType.PARAMETER})
@Retention(value = RetentionPolicy.RUNTIME)
@Inherited
@Documented
@JacksonAnnotationsInside
@JsonSerialize(using = PrimaryKeyJsonSerializer.class)
@JsonDeserialize(using = PrimaryKeyJsonDeserializer.class)
public @interface PrimaryKeyConvert {

    /**
     * 输入转换时同时支持长码id和短码id。<br>
     * true表示同时支持，false表示不支持，默认不支持
     *
     * @return
     */
    public boolean supportLongParse() default false;

    /**
     * 字段输入解析时，如果字段Long为null或空，字段设置为0。<br>
     * <b>注意在请求参数中明确指明参数名称时，该配置才会起作用，因为这样才会调用formatter</b><br>
     * true为设置0，false为设置null, 默认true
     *
     * @return
     */
    public boolean parseZeroIfNull() default true;

    /**
     * 输出时使用长码id还是短码id。<br>
     * true为短码，false为长码，默认true。<br>
     * <b>当printShort设置为false时，一般要与supportLongParse设置为true配合使用</b>
     *
     * @return
     */
    public boolean printShort() default true;

    /**
     * 字段输出转换时，如果字段Long为null，输出0。<br>
     * true输出0，false输出null, 默认false
     *
     * @return
     */
    public boolean printZeroIfNull() default false;

}
