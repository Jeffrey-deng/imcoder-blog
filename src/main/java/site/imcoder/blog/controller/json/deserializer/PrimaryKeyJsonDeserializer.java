package site.imcoder.blog.controller.json.deserializer;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.deser.ContextualDeserializer;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvertFormatter;

import java.io.IOException;
import java.text.ParseException;

/**
 * Json读取请求反序列化时将 "短码id" 转换为 "长码id"
 *
 * @author Jeffrey.Deng
 * @date 2019-08-27
 */
public class PrimaryKeyJsonDeserializer extends JsonDeserializer<Long> implements ContextualDeserializer {

    private PrimaryKeyConvert primaryKeyConvert;

    private PrimaryKeyConvertFormatter primaryKeyConvertFormatter;

    public PrimaryKeyJsonDeserializer() {
    }

    public PrimaryKeyJsonDeserializer(PrimaryKeyConvert primaryKeyConvert) {
        this.primaryKeyConvert = primaryKeyConvert;
        this.primaryKeyConvertFormatter = new PrimaryKeyConvertFormatter(primaryKeyConvert);
    }

    @Override
    public Long deserialize(JsonParser jsonParser, DeserializationContext ctxt) throws IOException, JsonProcessingException {
        try {
            return primaryKeyConvertFormatter.parse(jsonParser.getText(), null);
        } catch (ParseException e) {
            throw new IOException("PrimaryKeyJsonDeserializer deserialize error: " + jsonParser.getText());
        }
    }

    @Override
    public JsonDeserializer<?> createContextual(DeserializationContext ctxt, BeanProperty property) throws JsonMappingException {
        PrimaryKeyConvert primaryKeyConvert = property.getAnnotation(PrimaryKeyConvert.class);
        if (primaryKeyConvert == null) {
            primaryKeyConvert = property.getContextAnnotation(PrimaryKeyConvert.class);
        }
        if (primaryKeyConvert != null) { // 如果能得到注解，就将注解的 value 传入 PrimaryKeyJsonSerializer
            return new PrimaryKeyJsonDeserializer(primaryKeyConvert);
        } else {
            return ctxt.findContextualValueDeserializer(property.getType(), property);
        }
    }
}
