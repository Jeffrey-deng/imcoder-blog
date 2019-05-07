package site.imcoder.blog.controller.formatter.general.impl;

import com.github.binarywang.java.emoji.EmojiConverter;
import org.apache.log4j.Logger;
import site.imcoder.blog.controller.formatter.general.Converter;
import site.imcoder.blog.controller.formatter.general.GeneralConvert;

import java.text.ParseException;

/**
 * 通用转换器实现类: 转义Emoji表情
 *
 * @author Jeffrey.Deng
 * @date 2018-05-05
 */
public class EscapeEmojiConverter implements Converter<GeneralConvert, String> {

    private static Logger logger = Logger.getLogger(EscapeEmojiConverter.class);

    private EmojiConverter emojiConverter = null;

    public EscapeEmojiConverter() {
        this.emojiConverter = EmojiConverter.getInstance();
    }

    /**
     * 转换请求
     *
     * @param annotation
     * @param fieldClazz
     * @param input
     * @return
     */
    @Override
    public String parse(GeneralConvert annotation, Class fieldClazz, String input) throws ParseException {
        try {
            if (input != null && input.length() > 0) {
                return emojiConverter.toHtml(input);
            } else {
                return input;
            }
        } catch (Exception e) {
            throw new ParseException("EscapeEmojiEditor find exception: " + e.toString(), 0);
        }
    }

    /**
     * 转换输出
     *
     * @param annotation
     * @param fieldClazz
     * @param output
     * @return
     */
    @Override
    public String print(GeneralConvert annotation, Class fieldClazz, String output) {
        return output;
    }

}
