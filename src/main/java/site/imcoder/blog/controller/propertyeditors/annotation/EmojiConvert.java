package site.imcoder.blog.controller.propertyeditors.annotation;

import com.fasterxml.jackson.annotation.JacksonAnnotationsInside;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import site.imcoder.blog.controller.formatter.general.GeneralConvert;
import site.imcoder.blog.controller.formatter.general.impl.EscapeEmojiConverter;
import site.imcoder.blog.controller.json.deserializer.EscapeEmojiJsonDeserializer;

import java.lang.annotation.*;

/**
 * 用户提交文字时转换emoji表情编码<br>
 * 在需要转换实体类字段上添加 {@link EmojiConvert} 注解，仅支持String类型字段<br>
 *
 * @author Jeffrey.Deng
 * @date 2018-05-05
 */
@Target({ElementType.ANNOTATION_TYPE, ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
@JsonDeserialize(using = EscapeEmojiJsonDeserializer.class) // 重复设置了两个, EscapeEmojiConverter中已设置
@JacksonAnnotationsInside // 告诉Jackson这是一个Jackson注解, 子注解中标记此注解没用, 必须在最外层标记
// @GeneralConvert(using = EscapeEmojiConverter.class)
public @interface EmojiConvert {
}
