package site.imcoder.blog.controller.resolver;

import org.apache.commons.collections.CollectionUtils;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.BeanFactoryAware;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.config.ConfigurableBeanFactory;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.annotation.RequestParamMethodArgumentResolver;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.HandlerMethodArgumentResolverComposite;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.servlet.mvc.method.annotation.ServletModelAttributeMethodProcessor;
import site.imcoder.blog.controller.resolver.annotation.BindNullIfEmpty;

import javax.servlet.http.HttpServletRequest;
import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.*;

/**
 * 方法参数解析器: 当controller方法绑定的对象所有字段没有提交的parameter时，对象设置为null
 *
 * @author Jeffrey.Deng
 * @date 2018-01-10
 */
@Component("bindNullIfEmptyParamResolver")
public class BindNullIfEmptyParamResolver implements HandlerMethodArgumentResolver, BeanFactoryAware, InitializingBean {

    private ConfigurableBeanFactory beanFactory;

    private HandlerMethodArgumentResolverComposite argumentResolvers;

    private Map<Class, Field[]> beanFieldsCache;

    public BindNullIfEmptyParamResolver() {
        beanFieldsCache = new HashMap<>();
    }

    /**
     * 字段需要有 {@link BindNullIfEmpty} 注解 和 对象类型 才行
     *
     * @param parameter
     * @return
     */
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(BindNullIfEmpty.class) && Object.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer, NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
        Object resolveValue = null;
        if (argumentResolvers.supportsParameter(parameter)) {   // 运行默认的resolver
            resolveValue = argumentResolvers.resolveArgument(parameter, mavContainer, webRequest, binderFactory);
        }
        if (resolveValue != null) {
            Class<?> parameterClazz = parameter.getParameterType();
            boolean isEmpty = true;
            if (parameterClazz.isArray() && Array.getLength(resolveValue) > 0) {    // 数组
                isEmpty = false;
            } else if (Collection.class.isAssignableFrom(parameterClazz) && CollectionUtils.isNotEmpty((Collection) resolveValue)) {    // 集合
                isEmpty = false;
            } else if (Map.class.isAssignableFrom(parameterClazz) && ((Map) resolveValue).size() > 0) {  // map
                isEmpty = false;
            } else {    // 对象
                HttpServletRequest nativeRequest = webRequest.getNativeRequest(HttpServletRequest.class);
                Field[] fields = getBeanFields(parameter);
                for (Field field : fields) {    // 判断参数中是否有字段值
                    Class fieldClazz = field.getType();
                    if (fieldClazz.isPrimitive()) { // 基本类型
                        if (nativeRequest.getParameter(field.getName()) != null) {
                            isEmpty = false;
                            break;
                        }
                    } else {    // 对象
                        if (field.get(resolveValue) != null) {
                            isEmpty = false;
                            break;
                        }
                    }
                    //Enumeration<String> parameterNames = nativeRequest.getParameterNames();
                    //while (parameterNames.hasMoreElements()) {
                    //    String parameterName = parameterNames.nextElement();
                    //    // eg: album: parameterName eq 'name' or 'user.uid' pass
                    //    if (parameterName.equals(field.getName()) || (Object.class.isAssignableFrom(field.getClass()) && parameterName.startsWith(field.getName() + "."))) {
                    //        isEmpty = false;
                    //        break;
                    //    }
                    //}
                }
            }
            if (isEmpty) {
                resolveValue = null;
            }
        }
        return resolveValue;
    }

    /**
     * 因为返回值一样，所以这里不需要加synchronized
     *
     * @param parameter
     * @return
     */
    private Field[] getBeanFields(MethodParameter parameter) {
        Class<?> parameterClazz = parameter.getParameterType();
        Field[] fields = beanFieldsCache.get(parameterClazz);
        if (fields == null) {
            Field[] allFields = parameterClazz.getDeclaredFields();
            List<Field> list = new ArrayList<>();
            for (Field field : allFields) {
                if (!Modifier.isStatic(field.getModifiers())) { // 去掉static
                    field.setAccessible(true);
                    list.add(field);
                }
            }
            fields = list.toArray(new Field[list.size()]);
            beanFieldsCache.put(parameterClazz, fields);
        }
        return fields;
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        argumentResolvers = new HandlerMethodArgumentResolverComposite();
        List<HandlerMethodArgumentResolver> resolvers = new ArrayList<>();
        // 添加默认的resolver
        resolvers.add(new RequestParamMethodArgumentResolver(getBeanFactory(), true));
        resolvers.add(new ServletModelAttributeMethodProcessor(true));
        argumentResolvers.addResolvers(resolvers);
    }

    /**
     * A {@link ConfigurableBeanFactory} is expected for resolving expressions
     * in method argument default values.
     */
    @Override
    public void setBeanFactory(BeanFactory beanFactory) {
        if (beanFactory instanceof ConfigurableBeanFactory) {
            this.beanFactory = (ConfigurableBeanFactory) beanFactory;
        }
    }

    /**
     * Return the owning factory of this bean instance, or {@code null} if none.
     */
    protected ConfigurableBeanFactory getBeanFactory() {
        return this.beanFactory;
    }

}
