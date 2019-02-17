package site.imcoder.blog.controller.propertyeditors;

import com.github.binarywang.java.emoji.EmojiConverter;
import org.apache.log4j.Logger;
import org.springframework.beans.propertyeditors.PropertiesEditor;

import java.lang.reflect.Field;

/**
 * Emoji 表情转换工具，用户提交文字时转换emoji表情编码
 * <p>
 * 在需要转换的实体类字段上添加 {@link EmojiConvert} 注解，仅支持String类型字段
 *
 * @author Jeffrey.Deng
 * @date 2018-05-05
 */
public class EscapeEmojiEditor extends PropertiesEditor {

    private static Logger logger = Logger.getLogger(EscapeEmojiEditor.class);

    private static final Class EmojiConvertClazz = EmojiConvert.class;

    private static final Class StringClazz = String.class;

    private EmojiConverter emojiConverter = null;

    public EscapeEmojiEditor() {
        emojiConverter = EmojiConverter.getInstance();
    }

    @Override
    public void setValue(Object entity) {
        if (entity != null) {
            Field[] fs = entity.getClass().getDeclaredFields();
            for (int i = 0; i < fs.length; i++) {
                Field field = fs[i];
                field.setAccessible(true); // 设置属性是可以访问的
                if (field.isAnnotationPresent(EmojiConvertClazz)) {
                    if (field.getType() == StringClazz) {
                        try {
                            String content = (String) field.get(entity);
                            if (content != null && content.length() > 0) {
                                field.set(entity, emojiConverter.toHtml(content));
                            }
                        } catch (IllegalAccessException e) {
                            logger.error("EscapeEmojiEditor find exception: " + e.toString());
                        }
                    } else {
                        logger.warn("EmojiConvert Annotation only support for String Field");
                    }
                }
            }
        }
        super.setValue(entity);
    }
}
