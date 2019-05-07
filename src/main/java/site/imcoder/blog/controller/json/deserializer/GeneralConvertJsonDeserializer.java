package site.imcoder.blog.controller.json.deserializer;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.deser.ContextualDeserializer;
import site.imcoder.blog.controller.formatter.general.GeneralConvert;
import site.imcoder.blog.controller.formatter.general.GeneralConvertFormatter;

import java.io.IOException;
import java.text.ParseException;

/**
 * 通用转换器JsonDeserializer
 *
 * @author Jeffrey.Deng
 * @date 2019-12-04
 */
public class GeneralConvertJsonDeserializer extends JsonDeserializer<Object> implements ContextualDeserializer {

    private GeneralConvert generalConvert;

    private GeneralConvertFormatter generalConvertFormatter;

    public GeneralConvertJsonDeserializer() {
    }

    public GeneralConvertJsonDeserializer(GeneralConvert generalConvert, Class filedClazz) {
        this.generalConvert = generalConvert;
        this.generalConvertFormatter = new GeneralConvertFormatter(generalConvert, filedClazz);
    }

    @Override
    public Object deserialize(JsonParser jsonParser, DeserializationContext ctxt) throws IOException, JsonProcessingException {
        try {
            return generalConvertFormatter.parse(jsonParser.getText(), null);
        } catch (ParseException e) {
            throw new IOException("GeneralConvertJsonDeserializer deserialize error: " + jsonParser.getText());
        }
    }

    @Override
    public JsonDeserializer<?> createContextual(DeserializationContext ctxt, BeanProperty property) throws JsonMappingException {
        GeneralConvert generalConvert = property.getAnnotation(GeneralConvert.class);
        if (generalConvert == null) {
            generalConvert = property.getContextAnnotation(GeneralConvert.class);
        }
        if (generalConvert != null) { // 如果能得到注解，就将注解的 value 传入 GeneralConvertJsonDeserializer
            return new GeneralConvertJsonDeserializer(generalConvert, property.getType().getRawClass());
        } else {
            return ctxt.findContextualValueDeserializer(property.getType(), property);
        }
    }
}
