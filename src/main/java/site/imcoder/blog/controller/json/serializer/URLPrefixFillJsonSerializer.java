package site.imcoder.blog.controller.json.serializer;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.ContextualSerializer;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFill;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFillFormatter;

import java.io.IOException;
import java.util.Objects;

/**
 * URLPrefixFill转换器JsonSerializer
 *
 * @author Jeffrey.Deng
 * @date 2019-12-04
 */
public class URLPrefixFillJsonSerializer extends JsonSerializer<String> implements ContextualSerializer {

    private URLPrefixFill urlPrefixFill;

    private URLPrefixFillFormatter urlPrefixFillFormatter;

    public URLPrefixFillJsonSerializer() {
    }

    public URLPrefixFillJsonSerializer(URLPrefixFill urlPrefixFill) {
        this.urlPrefixFill = urlPrefixFill;
        this.urlPrefixFillFormatter = new URLPrefixFillFormatter(urlPrefixFill);
    }

    @Override
    public void serialize(String relativePath, JsonGenerator jsonGenerator, SerializerProvider serializerProvider) throws IOException, JsonProcessingException {
        String fullPath = urlPrefixFillFormatter.print(relativePath, null);
        if (fullPath != null) {
            jsonGenerator.writeString(fullPath);
        } else {
            jsonGenerator.writeNull();
        }
    }

    @Override
    public JsonSerializer<?> createContextual(SerializerProvider prov, BeanProperty property) throws JsonMappingException {
        if (property != null) { // 为空直接跳过
            if (Objects.equals(property.getType().getRawClass(), String.class)) { // 非 String 类直接跳过
                URLPrefixFill urlPrefixFill = property.getAnnotation(URLPrefixFill.class);
                if (urlPrefixFill == null) {
                    urlPrefixFill = property.getContextAnnotation(URLPrefixFill.class);
                }
                if (urlPrefixFill != null) { // 如果能得到注解，就将注解的 value 传入 URLPrefixFillJsonSerializer
                    return new URLPrefixFillJsonSerializer(urlPrefixFill);
                }
            }
            return prov.findValueSerializer(property.getType(), property);
        }
        return prov.findNullValueSerializer(property);
    }
}
