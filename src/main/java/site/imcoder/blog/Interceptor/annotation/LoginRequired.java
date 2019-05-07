package site.imcoder.blog.Interceptor.annotation;

import java.lang.annotation.*;

/**
 * 在需要验证登录的Controller的方法上使用此注解
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface LoginRequired {

    /**
     * 返回内容是否是JSON格式。
     * true为json，false为text，默认true
     *
     * @return
     */
    public boolean contentIsJson() default true;

    /**
     * 返回的内容。
     * 默认{"status": 401, "message": "需要登陆"}
     *
     * @return
     */
    public String content() default "{\"status\": 401, \"message\": \"需要登录\"}";

    /**
     * 跳转到登录时，使用重定向还是forward。
     * true为redirect，false为forward，默认为false
     *
     * @return
     */
    public boolean isRedirect() default false;

    /**
     * 登录页面的地址。
     *
     * @return
     */
    public String url() default "/auth/login";

}
