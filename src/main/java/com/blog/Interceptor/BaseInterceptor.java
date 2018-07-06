package com.blog.Interceptor;

import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.lang.annotation.Annotation;

/**
 * Created by Jeffrey.Deng on 2018/5/15.
 */
public abstract class BaseInterceptor extends HandlerInterceptorAdapter {

    /**
     * 需实现 从handler中找出注解类来判断是否需要拦截
     *
     * @param handler
     * @return
     */
    protected abstract Annotation findMethodAnnotation(Object handler);

    /**
     * 判断是否有注解
     *
     * @param handler
     * @return hasHandler
     */
    protected boolean isMyHandler(Object handler) {
        // 如果不是映射到方法直接通过
        if (!handler.getClass().isAssignableFrom(HandlerMethod.class)) {
            return false;
        }
        // 取出注解
        Annotation annotation = findMethodAnnotation(handler);
        // 有注解，需要认证
        if (annotation != null) {
            return true;
        } else {
            return false;
        }
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (isMyHandler(handler)) {
            return runHandler(request, response, handler);
        } else {
            return otherHandler(request, response, handler);
        }
    }

    protected abstract boolean runHandler(HttpServletRequest request, HttpServletResponse response, Object handler);

    public boolean otherHandler(HttpServletRequest request, HttpServletResponse response, Object handler) {
        return true;
    }

}
