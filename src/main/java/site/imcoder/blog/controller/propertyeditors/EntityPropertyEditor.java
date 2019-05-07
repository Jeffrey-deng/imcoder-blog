package site.imcoder.blog.controller.propertyeditors;

import org.apache.log4j.Logger;
import org.springframework.beans.propertyeditors.PropertiesEditor;

import java.lang.reflect.Field;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Spring处理提交字段时的自定义实体属性转换类
 *
 * @author Jeffrey.Deng
 * @date 2018-05-05
 */
public class EntityPropertyEditor extends PropertiesEditor {

    private static Logger logger = Logger.getLogger(EntityPropertyEditor.class);

    private Map<Class, PropertyFieldConverter> annotationRegistry;

    public EntityPropertyEditor() {
        annotationRegistry = new LinkedHashMap<>();
        registerAnnotation(annotationRegistry);
    }

    @Override
    public void setValue(Object entity) {
        if (entity != null) {
            Field[] fs = entity.getClass().getDeclaredFields();
            Set<Map.Entry<Class, PropertyFieldConverter>> entries = annotationRegistry.entrySet();
            for (int i = 0; i < fs.length; i++) {
                Field field = fs[i];
                field.setAccessible(true); // 设置属性是可以访问的
                for (Map.Entry<Class, PropertyFieldConverter> entry : entries) {
                    try {
                        if (field.isAnnotationPresent(entry.getKey())) { // 字段是否有注册的注解
                            if (entry.getValue().isSupport(field, entity)) {    // 字段type是否支持
                                field.set(entity, entry.getValue().convert(field.get(entity), field, entity));
                            } else {
                                logger.error(entry.getKey() + "Annotation only support for String Field");
                            }
                        }
                    } catch (IllegalAccessException e) {
                        logger.error("EntityPropertyEditor find exception: " + e.toString());
                    }
                }

            }
        }
        super.setValue(entity);
    }

    // 注册
    protected void registerAnnotation(Map<Class, PropertyFieldConverter> annotationRegistry) {
        //
    }

    // 外部注册
    public void registerAnnotation(Class annotation, PropertyFieldConverter propertyFieldConverter) {
        annotationRegistry.put(annotation, propertyFieldConverter);
    }

}
