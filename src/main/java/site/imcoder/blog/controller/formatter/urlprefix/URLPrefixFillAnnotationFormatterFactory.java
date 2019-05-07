package site.imcoder.blog.controller.formatter.urlprefix;

import org.springframework.format.AnnotationFormatterFactory;
import org.springframework.format.Parser;
import org.springframework.format.Printer;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * @author Jeffrey.Deng
 * @date 2017-12-03
 */
public class URLPrefixFillAnnotationFormatterFactory implements AnnotationFormatterFactory<URLPrefixFill> {

    private static final Set<Class<?>> FIELD_TYPES;

    static {
        Set<Class<?>> fieldTypes = new HashSet<Class<?>>(1);
        fieldTypes.add(String.class); // 这里只处理String类型
        FIELD_TYPES = Collections.unmodifiableSet(fieldTypes);
    }

    @Override
    public Set<Class<?>> getFieldTypes() {
        return FIELD_TYPES;
    }

    @Override
    public Printer<?> getPrinter(URLPrefixFill annotation, Class<?> fieldType) {
        return new URLPrefixFillFormatter(annotation);
    }

    @Override
    public Parser<?> getParser(URLPrefixFill annotation, Class<?> fieldType) {
        return new URLPrefixFillFormatter(annotation);
    }

}
