package site.imcoder.blog.controller.json;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.github.binarywang.java.emoji.EmojiConverter;

import java.io.IOException;

/**
 * Emoji 表情转换工具，用户提交文字时转换emoji表情编码
 * <pre>
 * 使用mysql数据库的时候，如果字符集是UTF-8并且在java服务器上，
 * 当存储emoji表情的时候，会抛出以上异常（比如微信开发获取用户昵称，有的用户的昵称用的是emoji的图像）
 * 这是由于字符集不支持的异常:
 *      因为utf-8编码有可能是两个，三个，四个字节，
 *      其中Emoji表情是四个字节，
 *      而mysql的utf-8编码最多三个字节，所以导致数据插不进去。
 * </pre>
 *
 * @author Jeffrey.Deng
 * @date 2018-05-05
 */
public class EscapeEmojiJsonDeserializer extends JsonDeserializer<String> {

    private EmojiConverter emojiConverter = null;

    public EscapeEmojiJsonDeserializer() {
        emojiConverter = EmojiConverter.getInstance();
    }

    @Override
    public String deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
        JsonNode node = jsonParser.getCodec().readTree(jsonParser);
        String content = node.asText();
        if (content != null && content.length() > 0) {
            content = emojiConverter.toHtml(content);
        }
        return content;
    }

}
