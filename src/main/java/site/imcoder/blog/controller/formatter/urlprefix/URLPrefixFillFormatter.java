package site.imcoder.blog.controller.formatter.urlprefix;

import org.springframework.format.Formatter;

import java.text.ParseException;
import java.util.Locale;

/**
 * @author Jeffrey.Deng
 * @date 2017-12-03
 */
public class URLPrefixFillFormatter implements Formatter<String> {

    private URLPrefixFill urlPrefixFill;

    private URLPrefixFiller urlPrefixFiller;

    private Class fieldClazz;

    public URLPrefixFillFormatter() {
        fieldClazz = String.class;
    }

    public URLPrefixFillFormatter(URLPrefixFill urlPrefixFill) {
        this();
        this.urlPrefixFill = urlPrefixFill;
        try {
            this.urlPrefixFiller = urlPrefixFill.using().newInstance();
        } catch (InstantiationException | IllegalAccessException e) {
            throw new RuntimeException("反射创建URLPrefixFiller实例失败");
        }
    }

    /**
     * 从请求的提交的url中尝试截取出相对url
     *
     * @param fullPath
     * @param locale
     * @return
     * @throws ParseException
     */
    @Override
    public String parse(String fullPath, Locale locale) throws ParseException {
        return urlPrefixFiller.parse(urlPrefixFill, fieldClazz, fullPath);
    }

    /**
     * 将相对url追加前缀
     *
     * @param relativePath
     * @param locale
     * @return
     */
    @Override
    public String print(String relativePath, Locale locale) {
        return urlPrefixFiller.print(urlPrefixFill, fieldClazz, relativePath);
    }

}
