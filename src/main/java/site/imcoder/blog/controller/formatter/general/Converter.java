package site.imcoder.blog.controller.formatter.general;

import java.lang.annotation.Annotation;
import java.text.ParseException;

/**
 * 转换器接口
 *
 * @author Jeffrey.Deng
 * @date 2017-12-04
 */
public interface Converter<A extends Annotation, T extends Object> {

    /**
     * 转换请求
     *
     * @param annotation
     * @param fieldClazz
     * @param input
     * @return
     */
    public T parse(A annotation, Class fieldClazz, String input) throws ParseException;

    /**
     * 转换输出
     *
     * @param annotation
     * @param fieldClazz
     * @param output
     * @return
     */
    public String print(A annotation, Class fieldClazz, T output);

}
