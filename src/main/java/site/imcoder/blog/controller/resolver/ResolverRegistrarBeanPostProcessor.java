package site.imcoder.blog.controller.resolver;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

/**
 * <p>HandlerMethodArgumentResolver注册器</p>
 * 1: 在springmvc为纯 java config 模式的话
 * <pre><code>
 *  public class ClientResourcesConfig extends WebMvcConfigurerAdapter {
 *
 *      public void addArgumentResolvers(List&lt;HandlerMethodArgumentResolver&gt; argumentResolvers) {
 *          argumentResolvers.add(new BindIRequestMethodArgumentResolver());
 *      }
 *  }
 * </code>
 * 2: 在xml配置模式,&lt;mvc:annotation-driven&gt; :
 *  <code>
 *      &lt;mvc:annotation-driven&gt;
 *          &lt;mvc:argument-resolvers&gt;
 *              &lt;bean class=&quot;site.imcoder.blog.controller.resolver.BindIRequestMethodArgumentResolver&quot;/&gt;
 *          &lt;/mvc:argument-resolvers&gt;
 *      &lt;/mvc:annotation-driven&gt;
 *  </code>
 * 3: 但是我想主体仍采用xml配置，但这个不想xml配置怎么弄呢，
 *  就在{@link RequestMappingHandlerAdapter#afterPropertiesSet} 运行之前注入到 {@link RequestMappingHandlerAdapter#customArgumentResolvers} 就行了
 *  一定要是之前，既postProcessBeforeInitialization，不能是postProcessAfterInitialization
 *  // afterPropertiesSet 里调用了 getDefaultArgumentResolvers
 *  <code>
 *      // Custom arguments
 *      if (getCustomArgumentResolvers() != null) {
 *          resolvers.addAll(getCustomArgumentResolvers());
 *      }
 *  </code></pre>
 *
 * @author Jeffrey.Deng
 * @date 2017-10-23
 */
@Component
public class ResolverRegistrarBeanPostProcessor implements BeanPostProcessor {

    @Resource
    BindIRequestMethodArgumentResolver bindIRequestMethodArgumentResolver;

    @Resource
    BindNullIfEmptyParamResolver bindNullIfEmptyParamResolver;

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        // requestMappingHandlerAdapter进行修改
        if (bean instanceof RequestMappingHandlerAdapter) {
            RequestMappingHandlerAdapter adapter = (RequestMappingHandlerAdapter) bean;
            List<HandlerMethodArgumentResolver> argumentResolvers = addArgumentResolvers();
            // 添加自定义参数处理器
            adapter.setCustomArgumentResolvers(argumentResolvers);
        }
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        return bean;
    }

    private List<HandlerMethodArgumentResolver> addArgumentResolvers() {
        List<HandlerMethodArgumentResolver> resolvers = new ArrayList<>();
        resolvers.add(bindIRequestMethodArgumentResolver);
        resolvers.add(bindNullIfEmptyParamResolver);
        return resolvers;
    }

}
