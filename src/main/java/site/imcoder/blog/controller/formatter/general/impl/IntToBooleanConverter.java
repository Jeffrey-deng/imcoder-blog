package site.imcoder.blog.controller.formatter.general.impl;

import site.imcoder.blog.controller.formatter.general.Converter;
import site.imcoder.blog.controller.formatter.general.GeneralConvert;

import java.text.ParseException;

/**
 * 布尔-int转换器
 *
 * @author Jeffrey.Deng
 * @date 2018-01-06
 */
public class IntToBooleanConverter implements Converter<GeneralConvert, Integer> {

    /**
     * 转换请求
     *
     * @param annotation
     * @param fieldClazz
     * @param input
     * @return
     */
    @Override
    public Integer parse(GeneralConvert annotation, Class fieldClazz, String input) throws ParseException {
        if (input != null && input.length() > 0) {
            return input.equalsIgnoreCase("true") ? 1 : 0;
        } else {
            return null;
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
    public String print(GeneralConvert annotation, Class fieldClazz, Integer output) {
        if (output != null) {
            return output > 0 ? "true" : "false";
        } else {
            return null;
        }
    }

}
