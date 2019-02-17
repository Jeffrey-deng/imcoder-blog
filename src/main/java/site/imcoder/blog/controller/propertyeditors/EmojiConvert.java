package site.imcoder.blog.controller.propertyeditors;

import org.springframework.web.bind.WebDataBinder;

import java.lang.annotation.*;

/**
 * 用户提交文字时转换emoji表情编码<br>
 * 在需要转换实体类字段上添加此注解，仅支持String类型字段<br>
 * 并在 {@link site.imcoder.blog.controller.BaseController#initBinder(WebDataBinder)}中注册对应的实体类
 *
 * @author Jeffrey.Deng
 * @date 2018-05-05
 */
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface EmojiConvert {
}
