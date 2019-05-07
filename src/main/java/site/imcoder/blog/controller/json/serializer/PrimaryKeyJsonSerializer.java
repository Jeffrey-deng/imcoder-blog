package site.imcoder.blog.controller.json.serializer;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.ContextualSerializer;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvertFormatter;

import java.io.IOException;
import java.util.Objects;

/**
 * Json输出序列化时将"长码id"转换为"短码id"
 *
 * @author Jeffrey.Deng
 * @date 2019-08-27
 */
public class PrimaryKeyJsonSerializer extends JsonSerializer<Long> implements ContextualSerializer {

    private PrimaryKeyConvert primaryKeyConvert;

    private PrimaryKeyConvertFormatter primaryKeyConvertFormatter;

    public PrimaryKeyJsonSerializer() {
    }

    public PrimaryKeyJsonSerializer(PrimaryKeyConvert primaryKeyConvert) {
        this.primaryKeyConvert = primaryKeyConvert;
        this.primaryKeyConvertFormatter = new PrimaryKeyConvertFormatter(primaryKeyConvert);
    }

    @Override
    public void serialize(Long longKey, JsonGenerator jsonGenerator, SerializerProvider serializerProvider) throws IOException, JsonProcessingException {
        String printKey = primaryKeyConvertFormatter.print(longKey, null);
        if (printKey != null) {
            jsonGenerator.writeString(printKey);
        } else {
            jsonGenerator.writeNull();
        }
    }

    @Override
    public JsonSerializer<?> createContextual(SerializerProvider prov, BeanProperty property) throws JsonMappingException {
        if (property != null) { // 为空直接跳过
            if (Objects.equals(property.getType().getRawClass(), Long.class)) { // 非 Long 类直接跳过
                PrimaryKeyConvert primaryKeyConvert = property.getAnnotation(PrimaryKeyConvert.class);
                if (primaryKeyConvert == null) {
                    primaryKeyConvert = property.getContextAnnotation(PrimaryKeyConvert.class);
                }
                if (primaryKeyConvert != null) { // 如果能得到注解，就将注解的 value 传入 PrimaryKeyJsonSerializer
                    return new PrimaryKeyJsonSerializer(primaryKeyConvert);
                }
            }
            return prov.findValueSerializer(property.getType(), property);
        }
        return prov.findNullValueSerializer(property);
    }
}
