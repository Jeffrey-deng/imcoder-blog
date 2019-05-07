package site.imcoder.blog.controller.formatter.primarykey;

import org.springframework.format.AnnotationFormatterFactory;
import org.springframework.format.Parser;
import org.springframework.format.Printer;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * 注解 @PrimaryKeyConvert 的工厂类
 *
 * @author Jeffrey.Deng
 * @date 2019-08-26
 */
public class PrimaryKeyConvertAnnotationFormatterFactory implements AnnotationFormatterFactory<PrimaryKeyConvert> {

    private static final Set<Class<?>> FIELD_TYPES;

    static {
        Set<Class<?>> fieldTypes = new HashSet<Class<?>>(4);
        fieldTypes.add(Long.class); // 这里只处理Long类型
        FIELD_TYPES = Collections.unmodifiableSet(fieldTypes);
    }

    @Override
    public Set<Class<?>> getFieldTypes() {
        return FIELD_TYPES;
    }

    @Override
    public Printer<?> getPrinter(PrimaryKeyConvert annotation, Class<?> fieldType) {
        return new PrimaryKeyConvertFormatter(annotation);
    }

    @Override
    public Parser<?> getParser(PrimaryKeyConvert annotation, Class<?> fieldType) {
        return new PrimaryKeyConvertFormatter(annotation);
    }
}
