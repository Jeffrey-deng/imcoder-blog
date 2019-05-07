package site.imcoder.blog.controller.formatter.general;

import org.springframework.format.AnnotationFormatterFactory;
import org.springframework.format.Parser;
import org.springframework.format.Printer;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * @author Jeffrey.Deng
 * @date 2017-12-04
 */
public class GeneralConvertAnnotationFormatterFactory implements AnnotationFormatterFactory<GeneralConvert> {

    private static final Set<Class<?>> FIELD_TYPES;

    static {
        Set<Class<?>> fieldTypes = new HashSet<Class<?>>(1);
        fieldTypes.add(Object.class);
        FIELD_TYPES = Collections.unmodifiableSet(fieldTypes);
    }

    @Override
    public Set<Class<?>> getFieldTypes() {
        return FIELD_TYPES;
    }

    @Override
    public Printer<?> getPrinter(GeneralConvert annotation, Class<?> fieldType) {
        return new GeneralConvertFormatter(annotation, fieldType);
    }

    @Override
    public Parser<?> getParser(GeneralConvert annotation, Class<?> fieldType) {
        System.out.println();
        return new GeneralConvertFormatter(annotation, fieldType);
    }

}
