package site.imcoder.blog.Interceptor;

import org.springframework.web.method.HandlerMethod;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.lang.annotation.Annotation;

/**
 * 为添加了@GZIP注解的方法添加response头
 * Content-Encoding: gzip
 * 使之在过滤器中使用GZIPResponseStream输出流
 *
 * @author Jeffrey.Deng
 * @date 2018-12-22
 */
public class GZIPCompressInterceptor extends BaseInterceptor {

    private final static String ACCEPT_ENCODING = "accept-encoding";
    private final static String CONTENT_ENCODING = "Content-Encoding";
    private final static String GZIP = "gzip";

    @Override
    protected Annotation findMethodAnnotation(Object handler) {
        return ((HandlerMethod) handler).getMethodAnnotation(GZIP.class);
    }

    @Override
    protected boolean preRunHandler(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String acceptEncoding = request.getHeader(ACCEPT_ENCODING);
        if (acceptEncoding != null && acceptEncoding.indexOf(GZIP) >= 0) {
            response.setHeader(CONTENT_ENCODING, GZIP); // 设置压缩编码头会进入过滤器
        }
        return true;
    }
}
