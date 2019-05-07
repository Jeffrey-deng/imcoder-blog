package site.imcoder.blog.Interceptor.annotation;

import java.lang.annotation.*;

/**
 * 添加了@GZIP注解的方法添加response头
 * Mark-Encoding: gzip
 * 使之在过滤器中使用GZIPResponseStream输出流
 *
 * @author Jeffrey.Deng
 * @date 2018-12-22
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface GZIP {
}
