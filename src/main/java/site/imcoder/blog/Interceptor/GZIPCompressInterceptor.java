package site.imcoder.blog.Interceptor;

import org.springframework.web.method.HandlerMethod;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.lang.annotation.Annotation;

/**
 * 为添加了@GZIP注解的方法添加response头
 * Mark-Encoding: gzip
 * 使之在过滤器中使用GZIPResponseStream输出流
 *
 * @author Jeffrey.Deng
 * @date 2018-12-22
 */
public class GZIPCompressInterceptor extends BaseInterceptor {

    private static final String ACCEPT_ENCODING = "Accept-Encoding";
    private static final String MARK_ENCODING = "Mark-Encoding";
    private final static String GZIP = "gzip";

    @Override
    protected Annotation findMethodAnnotation(Object handler) {
        return ((HandlerMethod) handler).getMethodAnnotation(site.imcoder.blog.Interceptor.annotation.GZIP.class);
    }

    @Override
    protected boolean preRunHandler(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String acceptEncoding = request.getHeader(ACCEPT_ENCODING);
        if (acceptEncoding != null && acceptEncoding.indexOf(GZIP) >= 0) {
            response.setHeader(MARK_ENCODING, GZIP); // 设置压缩编码头会进入过滤器
        }
        return true;
    }
}
