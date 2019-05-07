package site.imcoder.blog.controller.formatter.urlprefix;

import site.imcoder.blog.controller.formatter.general.Converter;

import java.text.ParseException;

/**
 * 自定义URLPrefixFill的序列化与发序列化
 * 实现此接口，再配置到字段 {@link URLPrefixFill#using} 即可
 *
 * @author Jeffrey.Deng
 * @date 2017-12-03
 */
public interface URLPrefixFiller extends Converter<URLPrefixFill, String> {

    /**
     * 从请求的提交的url中尝试截取出相对url
     *
     * @param annotation
     * @param fieldClazz
     * @param fullPath
     * @return
     */
    public String parse(URLPrefixFill annotation, Class fieldClazz, String fullPath) throws ParseException;

    /**
     * 将相对url追加前缀
     *
     * @param annotation
     * @param fieldClazz
     * @param relativePath
     * @return
     */
    public String print(URLPrefixFill annotation, Class fieldClazz, String relativePath);

}
