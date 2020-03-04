package site.imcoder.blog.controller.resolver;

import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.controller.resolver.annotation.BindIRequest;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.setting.GlobalConstants;

import javax.servlet.http.HttpServletRequest;

/**
 * 方法参数解析器: 请求的用户的信息
 *
 * @author Jeffrey.Deng
 * @date 2017-10-23
 */
@Component("bindIRequestMethodArgumentResolver")
public class BindIRequestMethodArgumentResolver implements HandlerMethodArgumentResolver {

    public BindIRequestMethodArgumentResolver() {
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        // 如果参数类型是 IRequest 或 User并且有BindIRequest注解 则支持
        if (parameter.getParameterType().equals(IRequest.class) ||
                (parameter.hasParameterAnnotation(BindIRequest.class) && parameter.getParameterType().isAssignableFrom(User.class))) {
            return true;
        } else {
            return false;
        }
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer, NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
        // todo 准备修改成从 Cache 中获取，在session中只放标识identifier的uid
        User loginUser = (User) webRequest.getAttribute(GlobalConstants.KEY_LOGIN_USER, RequestAttributes.SCOPE_SESSION);
        if (parameter.getParameterType().equals(IRequest.class)) {
            HttpServletRequest nativeRequest = webRequest.getNativeRequest(HttpServletRequest.class);
            return buildIRequest(loginUser, nativeRequest);
        } else {
            return loginUser;
        }
    }

    public IRequest buildIRequest(User loginUser, HttpServletRequest nativeRequest) {
        IRequest iRequest = new IRequest(loginUser);
        iRequest.setAccessIp(Utils.getRemoteAddr(nativeRequest));
        iRequest.setAccessPath(Utils.getRequestPath(nativeRequest));
        iRequest.setQueryString(nativeRequest.getQueryString() != null ? nativeRequest.getQueryString() : "");
        return iRequest;
    }

}
