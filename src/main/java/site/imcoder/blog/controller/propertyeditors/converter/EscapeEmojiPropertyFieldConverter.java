package site.imcoder.blog.controller.propertyeditors.converter;

import com.github.binarywang.java.emoji.EmojiConverter;
import org.apache.log4j.Logger;
import org.springframework.web.bind.WebDataBinder;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.controller.propertyeditors.PropertyFieldConverter;
import site.imcoder.blog.controller.propertyeditors.annotation.EmojiConvert;

import java.lang.reflect.Field;

/**
 * Emoji 表情转换工具，用户提交文字时转换emoji表情编码
 * <p>
 * 在需要转换的实体类字段上添加 {@link EmojiConvert} 注解，仅支持String类型字段
 * 并在 {@link BaseController#initBinder(WebDataBinder)}中注册对应的实体类的处理类为 {@link site.imcoder.blog.controller.propertyeditors.EntityPropertyEditor}
 *
 * @author Jeffrey.Deng
 * @date 2018-05-05
 */
public class EscapeEmojiPropertyFieldConverter implements PropertyFieldConverter<String> {

    private static Logger logger = Logger.getLogger(EscapeEmojiPropertyFieldConverter.class);

    private static final Class StringClazz = String.class;

    private EmojiConverter emojiConverter = null;

    private static EscapeEmojiPropertyFieldConverter instance;

    private EscapeEmojiPropertyFieldConverter() {
        this.emojiConverter = EmojiConverter.getInstance();
    }

    public static synchronized EscapeEmojiPropertyFieldConverter getInstance() {
        if (instance == null) {
            instance = new EscapeEmojiPropertyFieldConverter();
        }
        return instance;
    }

    /**
     * 判断该字段类型是否支持
     *
     * @param field
     * @param obj
     * @return
     */
    @Override
    public boolean isSupport(Field field, Object obj) {
        return field.getType() == StringClazz;
    }

    /**
     * 转换字段值
     *
     * @param input
     * @param field
     * @param obj
     * @return
     */
    @Override
    public String convert(String input, Field field, Object obj) {
        if (input != null && input.length() > 0) {
            return emojiConverter.toHtml(input);
        } else {
            return input;
        }
    }
}
