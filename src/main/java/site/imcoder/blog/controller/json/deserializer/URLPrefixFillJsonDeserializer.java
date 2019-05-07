package site.imcoder.blog.controller.json.deserializer;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.deser.ContextualDeserializer;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFill;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFillFormatter;

import java.io.IOException;
import java.text.ParseException;

/**
 * URLPrefixFill转换器JsonDeserializer
 *
 * @author Jeffrey.Deng
 * @date 2019-12-04
 */
public class URLPrefixFillJsonDeserializer extends JsonDeserializer<String> implements ContextualDeserializer {

    private URLPrefixFill urlPrefixFill;

    private URLPrefixFillFormatter urlPrefixFillFormatter;

    public URLPrefixFillJsonDeserializer() {
    }

    public URLPrefixFillJsonDeserializer(URLPrefixFill urlPrefixFill) {
        this.urlPrefixFill = urlPrefixFill;
        this.urlPrefixFillFormatter = new URLPrefixFillFormatter(urlPrefixFill);
    }


    @Override
    public String deserialize(JsonParser jsonParser, DeserializationContext ctxt) throws IOException, JsonProcessingException {
        try {
            return urlPrefixFillFormatter.parse(jsonParser.getText(), null);
        } catch (ParseException e) {
            throw new IOException("URLPrefixFillJsonDeserializer deserialize error: " + jsonParser.getText());
        }
    }

    @Override
    public JsonDeserializer<?> createContextual(DeserializationContext ctxt, BeanProperty property) throws JsonMappingException {
        URLPrefixFill urlPrefixFill = property.getAnnotation(URLPrefixFill.class);
        if (urlPrefixFill == null) {
            urlPrefixFill = property.getContextAnnotation(URLPrefixFill.class);
        }
        if (urlPrefixFill != null) { // 如果能得到注解，就将注解的 value 传入 URLPrefixFillJsonDeserializer
            return new URLPrefixFillJsonDeserializer(urlPrefixFill);
        } else {
            return ctxt.findContextualValueDeserializer(property.getType(), property);
        }
    }

}
