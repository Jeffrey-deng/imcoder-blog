package site.imcoder.blog.Interceptor;

import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.lang.annotation.Annotation;


/**
 * 拦截器
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
        // 一定要在运行isMyHandler前判断是否是映射到方法
        // 取出注解
        Annotation annotation = null;
        try {
            annotation = findMethodAnnotation(handler);
        } catch (Exception e) {
            annotation = null;
        }
        // 有注解，需要认证
        if (annotation != null) {
            return true;
        } else {
            return false;
        }
    }

    // 业务处理器处理请求之前被调用
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 如果不是映射到方法直接通过
        if (!handler.getClass().isAssignableFrom(HandlerMethod.class)) {
            return true;
        }
        if (isMyHandler(handler)) {
            return preRunHandler(request, response, handler);
        } else {
            return preOtherHandler(request, response, handler);
        }
    }

    // 在业务处理器处理请求执行完成后,生成视图之前执行的动作
    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        // 如果不是映射到方法直接通过
        if (!handler.getClass().isAssignableFrom(HandlerMethod.class)) {
            postRunHandler(request, response, handler, modelAndView);
            return;
        }
        if (isMyHandler(handler)) {
            postRunHandler(request, response, handler, modelAndView);
        } else {
            postOtherHandler(request, response, handler, modelAndView);
        }
    }

    // 完全处理完请求后被调用,可用于清理资源等
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        // 如果不是映射到方法直接通过
        if (!handler.getClass().isAssignableFrom(HandlerMethod.class)) {
            super.afterCompletion(request, response, handler, ex);
            return;
        }
        if (isMyHandler(handler)) {
            afterRunHandler(request, response, handler, ex);
        } else {
            afterOtherHandler(request, response, handler, ex);
        }
    }

    protected boolean preRunHandler(HttpServletRequest request, HttpServletResponse response, Object handler) {
        return true;
    }

    protected boolean preOtherHandler(HttpServletRequest request, HttpServletResponse response, Object handler) {
        return true;
    }

    protected void postRunHandler(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        super.postHandle(request, response, handler, modelAndView);
    }

    protected void postOtherHandler(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        super.postHandle(request, response, handler, modelAndView);
    }

    public void afterRunHandler(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        super.afterCompletion(request, response, handler, ex);
    }

    public void afterOtherHandler(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        super.afterCompletion(request, response, handler, ex);
    }

}
