package site.imcoder.blog.controller.formatter.timeformat;

import org.springframework.format.AnnotationFormatterFactory;
import org.springframework.format.Formatter;
import org.springframework.format.Parser;
import org.springframework.format.Printer;

import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

/**
 * @author Jeffrey.Deng
 * @date 2018-12-03
 */
public class TimeFormatAnnotationFormatterFactory implements AnnotationFormatterFactory<TimeFormat> {

    private static final Set<Class<?>> FIELD_TYPES;

    static {
        Set<Class<?>> fieldTypes = new HashSet<Class<?>>(4);
        fieldTypes.add(Long.class); // 这里只处理Long和Date类型
        fieldTypes.add(Date.class);
        FIELD_TYPES = Collections.unmodifiableSet(fieldTypes);
    }

    @Override
    public Set<Class<?>> getFieldTypes() {
        return FIELD_TYPES;
    }

    @Override
    public Printer<?> getPrinter(TimeFormat annotation, Class<?> fieldType) {
        return getTimeFormatFormatter(annotation, fieldType);
    }

    @Override
    public Parser<?> getParser(TimeFormat annotation, Class<?> fieldType) {
        return getTimeFormatFormatter(annotation, fieldType);
    }

    private Formatter getTimeFormatFormatter(TimeFormat timeFormat, Class<?> fieldType) {
        return new TimeFormatFormatter(timeFormat, fieldType);
    }

}
