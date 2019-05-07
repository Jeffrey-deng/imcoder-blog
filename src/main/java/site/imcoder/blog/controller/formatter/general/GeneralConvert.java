package site.imcoder.blog.controller.formatter.general;

import com.fasterxml.jackson.annotation.JacksonAnnotationsInside;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import site.imcoder.blog.controller.json.deserializer.GeneralConvertJsonDeserializer;
import site.imcoder.blog.controller.json.serializer.GeneralConvertJsonSerializer;

import java.lang.annotation.*;

/**
 * 通用转换器注解
 * 通过 {@link #using} 设置转换器实现类, 实现自定义的转换
 *
 * @author Jeffrey.Deng
 * @date 2017-12-04
 */
@Target(value = {ElementType.ANNOTATION_TYPE, ElementType.FIELD, ElementType.PARAMETER})
@Retention(value = RetentionPolicy.RUNTIME)
@Inherited
@Documented
@JacksonAnnotationsInside
@JsonSerialize(using = GeneralConvertJsonSerializer.class)
@JsonDeserialize(using = GeneralConvertJsonDeserializer.class)
public @interface GeneralConvert {

    /**
     * 使用的自定义的转换器实现类来进行序列化与发序列化类
     * 需继承接口 {@link Converter}
     *
     * @return
     */
    public Class<? extends Converter> using();

    /**
     * 标记是否请求提交字段时，运行 parse 方法
     * 需要在 {@link Converter} 实现类中自行根据逻辑使用此字段
     *
     * @return
     */
    public boolean useParse() default true;

    /**
     * 标记是否输出字段时，运行 parse 方法
     * 需要在 {@link Converter} 实现类中自行根据逻辑使用此字段
     *
     * @return
     */
    public boolean usePrint() default true;

}
