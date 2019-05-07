package site.imcoder.blog.advice;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;
import site.imcoder.blog.service.message.IResponse;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

/**
 * 将ajax返回类型的controller方法返回的对象设置到request中，以在拦截器中能够使用到
 *
 * @author Jeffrey.Deng
 * @date 2019-12-18
 */
@ControllerAdvice(basePackages = {"site.imcoder.blog.controller.api"})
public class PutIResponseToRequestAdvice implements ResponseBodyAdvice<Object> {

    /**
     * Whether this component supports the given controller method return type
     * and the selected {@code HttpMessageConverter} type.
     *
     * @param returnType    the return type
     * @param converterType the selected converter type
     * @return {@code true} if {@link #beforeBodyWrite} should be invoked;
     * {@code false} otherwise
     */
    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        if (returnType.getParameterType().equals(Void.class)) {
            return false;
        }
        return true;
    }

    /**
     * Invoked after an {@code HttpMessageConverter} is selected and just before
     * its write method is invoked.
     *
     * @param body                  the body to be written
     * @param returnType            the return type of the controller method
     * @param selectedContentType   the content type selected through content negotiation
     * @param selectedConverterType the converter type selected to write to the response
     * @param request               the current request
     * @param response              the current response
     * @return the body that was passed in or a modified (possibly new) instance
     */
    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType,
                                  MediaType selectedContentType, Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request, ServerHttpResponse response) {
        HttpServletRequest servletRequest = ((ServletServerHttpRequest) request).getServletRequest();
        Object putObject = body;
        if (body != null && returnType.getParameterType().equals(String.class)) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                putObject = mapper.readValue((String) body, IResponse.class);
            } catch (IOException e) {

            }
        }
        servletRequest.setAttribute("responseBodyReturnValue", putObject);
        return body;
    }

}
