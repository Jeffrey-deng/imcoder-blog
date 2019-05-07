package site.imcoder.blog.controller.resolver.annotation;

import java.lang.annotation.*;

/**
 * 方法参数设置此注解：
 * 当controller方法绑定的对象所有字段没有提交的parameter时，对象设置为null
 *
 * @author Jeffrey.Deng
 * @date 2018-01-10
 */
@Target({ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface BindNullIfEmpty {
}
