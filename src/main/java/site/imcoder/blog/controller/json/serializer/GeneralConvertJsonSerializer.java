package site.imcoder.blog.controller.json.serializer;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.ContextualSerializer;
import site.imcoder.blog.controller.formatter.general.GeneralConvert;
import site.imcoder.blog.controller.formatter.general.GeneralConvertFormatter;

import java.io.IOException;

/**
 * 通用转换器JsonSerializer
 *
 * @author Jeffrey.Deng
 * @date 2019-12-04
 */
public class GeneralConvertJsonSerializer extends JsonSerializer<Object> implements ContextualSerializer {

    private GeneralConvert generalConvert;

    private GeneralConvertFormatter generalConvertFormatter;

    public GeneralConvertJsonSerializer() {
    }

    public GeneralConvertJsonSerializer(GeneralConvert generalConvert, Class filedClazz) {
        this.generalConvert = generalConvert;
        this.generalConvertFormatter = new GeneralConvertFormatter(generalConvert, filedClazz);
    }

    @Override
    public void serialize(Object value, JsonGenerator gen, SerializerProvider serializers) throws IOException, JsonProcessingException {
        String print = generalConvertFormatter.print(value, null);
        if (print != null) {
            gen.writeString(print);
        } else {
            gen.writeNull();
        }
    }

    @Override
    public JsonSerializer<?> createContextual(SerializerProvider prov, BeanProperty property) throws JsonMappingException {
        if (property != null) { // 为空直接跳过
            Class<?> propClass = property.getType().getRawClass();
            GeneralConvert generalConvert = property.getAnnotation(GeneralConvert.class);
            if (generalConvert == null) {
                generalConvert = property.getContextAnnotation(GeneralConvert.class);
            }
            if (generalConvert != null) { // 如果能得到注解，就将注解的 value 传入 GeneralConvertJsonSerializer
                return new GeneralConvertJsonSerializer(generalConvert, propClass);
            } else {
                return prov.findValueSerializer(property.getType(), property);
            }
        }
        return prov.findNullValueSerializer(property);
    }
}
