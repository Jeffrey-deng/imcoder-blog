package site.imcoder.blog.controller.formatter;

import org.springframework.format.FormatterRegistrar;
import org.springframework.format.FormatterRegistry;
import site.imcoder.blog.controller.formatter.general.GeneralConvertAnnotationFormatterFactory;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvertAnnotationFormatterFactory;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormatAnnotationFormatterFactory;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFillAnnotationFormatterFactory;

/**
 * Formatter注册器
 * 将该对象添加到 SpringMvc.xml 的对象 org.springframework.format.support.FormattingConversionServiceFactoryBean 的 formatterRegistrars 字段中
 * 并在 mvc:annotation-driven 节点上的属性 conversion-service 的值设置为该对象的 名称
 *
 * @author Jeffrey.Deng
 * @date 2019-08-27
 */
public class ApplicationFormatterRegistrar implements FormatterRegistrar {

    /**
     * Register Formatters and Converters with a FormattingConversionService
     * through a FormatterRegistry SPI.
     *
     * @param registry the FormatterRegistry instance to use.
     */
    @Override
    public void registerFormatters(FormatterRegistry registry) {
        // 注册 @PrimaryKeyConverter
        registry.addFormatterForFieldAnnotation(new PrimaryKeyConvertAnnotationFormatterFactory());
        // 时间格式转换类
        registry.addFormatterForFieldAnnotation(new TimeFormatAnnotationFormatterFactory());
        // URL前缀转换类
        registry.addFormatterForFieldAnnotation(new URLPrefixFillAnnotationFormatterFactory());
        // 通用转换类
        registry.addFormatterForFieldAnnotation(new GeneralConvertAnnotationFormatterFactory());
    }

}
