package site.imcoder.blog.controller.json.deserializer;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.deser.ContextualDeserializer;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormatFormatter;

import java.io.IOException;
import java.text.ParseException;

/**
 * 时间格式器 JsonDeserializer
 *
 * @author Jeffrey.Deng
 * @date 2019-12-04
 */
public class TimeFormatDeserializer extends JsonDeserializer<Object> implements ContextualDeserializer {

    private TimeFormat timeFormat;

    private TimeFormatFormatter timeFormatFormatter;

    private Class filedClazz;

    public TimeFormatDeserializer() {
    }

    public TimeFormatDeserializer(TimeFormat timeFormat, Class filedClazz) {
        this.timeFormat = timeFormat;
        this.filedClazz = filedClazz;
        this.timeFormatFormatter = new TimeFormatFormatter(timeFormat, filedClazz);
    }

    @Override
    public Object deserialize(JsonParser jsonParser, DeserializationContext ctxt) throws IOException, JsonProcessingException {
        String input = jsonParser.getText();
        if (timeFormatFormatter != null) {
            try {
                return timeFormatFormatter.parse(input, null);
            } catch (ParseException e) {
                throw new IOException("TimeFormatDeserializer deserialize error: " + jsonParser.getText());
            }
        } else {
            try {
                return filedClazz.newInstance();
            } catch (InstantiationException | IllegalAccessException e) {
                throw new IOException("TimeFormatDeserializer deserialize error in filedClazz.newInstance(), the text: " + input);
            }
        }
    }

    @Override
    public JsonDeserializer<?> createContextual(DeserializationContext ctxt, BeanProperty property) throws JsonMappingException {
        TimeFormat timeFormat = property.getAnnotation(TimeFormat.class);
        if (timeFormat == null) {
            timeFormat = property.getContextAnnotation(TimeFormat.class);
        }
        if (timeFormat != null) { // 如果能得到注解，就将注解的 value 传入 TimeFormatDeserializer
            return new TimeFormatDeserializer(timeFormat, property.getType().getRawClass());
        } else {
            return ctxt.findContextualValueDeserializer(property.getType(), property);
        }
    }

}
