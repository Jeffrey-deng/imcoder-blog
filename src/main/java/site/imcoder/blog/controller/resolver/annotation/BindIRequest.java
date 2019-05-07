package site.imcoder.blog.controller.resolver.annotation;

import java.lang.annotation.*;

/**
 * @author Jeffrey.Deng
 * @date 2017-10-23
 */
@Target({ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface BindIRequest {
}
