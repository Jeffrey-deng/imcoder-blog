package site.imcoder.blog.controller.json.serializer;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.ContextualSerializer;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormatFormatter;

import java.io.IOException;
import java.util.Date;
import java.util.Objects;

/**
 * json序列化Long和Date对象为DateStr
 *
 * @author Jeffrey.Deng
 * @date 2019-09-01
 */
public class TimeFormatSerializer extends JsonSerializer<Object> implements ContextualSerializer {

    private TimeFormat timeFormat;

    private TimeFormatFormatter timeFormatFormatter;

    public TimeFormatSerializer() {
    }

    public TimeFormatSerializer(TimeFormat timeFormat, Class filedClazz) {
        this.timeFormat = timeFormat;
        this.timeFormatFormatter = new TimeFormatFormatter(timeFormat, filedClazz);
    }

    @Override
    public void serialize(Object value, JsonGenerator gen, SerializerProvider serializers) throws IOException, JsonProcessingException {
        if (timeFormatFormatter != null) {
            String print = timeFormatFormatter.print(value, null);
            if (print != null) {
                gen.writeString(print);
            } else {
                gen.writeNull();
            }
        } else {
            gen.writeObject(value);
        }
    }

    @Override
    public JsonSerializer<?> createContextual(SerializerProvider prov, BeanProperty property) throws JsonMappingException {
        if (property != null) { // 为空直接跳过
            Class<?> propClass = property.getType().getRawClass();
            if (Objects.equals(propClass, Long.class) || Objects.equals(propClass, Date.class)) { // 非 Long类 或 Date类 直接跳过
                TimeFormat timeFormat = property.getAnnotation(TimeFormat.class);
                if (timeFormat == null) {
                    timeFormat = property.getContextAnnotation(TimeFormat.class);
                }
                if (timeFormat != null) { // 如果能得到注解，就将注解的 value 传入 TimeFormatSerializer
                    return new TimeFormatSerializer(timeFormat, propClass);
                }
            }
            return prov.findValueSerializer(property.getType(), property);
        }
        return prov.findNullValueSerializer(property);
    }

}
