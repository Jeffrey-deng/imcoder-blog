package site.imcoder.blog.controller.propertyeditors;

import java.lang.reflect.Field;

/**
 * Spring处理提交字段时的自定义实体属性转换类的逻辑处理接口
 * 修改该 field 为需要的值
 *
 * @author Jeffrey.Deng
 * @date 2018-05-05
 */
public interface PropertyFieldConverter<T> {

    /**
     * 判断该字段类型是否支持
     *
     * @param field
     * @param obj
     * @return
     */
    public boolean isSupport(Field field, Object obj);

    /**
     * 转换字段值
     *
     * @param input
     * @param field
     * @param obj
     * @return
     */
    public T convert(T input, Field field, Object obj);

}
