package com.blog.Interceptor;

import java.lang.annotation.*;

/**
 * 在需要验证登录的Controller的方法上使用此注解
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface LoginRequired {

    public boolean contentIsJson() default true;

    public String content() default "{\"flag\": 401, \"info\": \"需要登录\"}";

    public boolean isRedirect() default false;

    public String url() default "user.do?method=jumpLogin";

}
