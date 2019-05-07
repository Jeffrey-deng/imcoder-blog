package site.imcoder.blog.controller.formatter.urlprefix.impl;

import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFill;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFiller;
import site.imcoder.blog.setting.Config;

import java.text.ParseException;
import java.util.regex.Pattern;

/**
 * URLPrefixFiller默认实现
 *
 * @author Jeffrey.Deng
 * @date 2017-12-03
 */
public class DefaultURLPrefixFiller implements URLPrefixFiller {

    private Pattern completed_path_regex;

    public DefaultURLPrefixFiller() {
        this.completed_path_regex = Pattern.compile("^https?://.*$");
    }

    /**
     * 从请求的提交的url中尝试截取出相对url
     *
     * @param annotation
     * @param fullPath
     * @return
     */
    @Override
    public String parse(URLPrefixFill annotation, Class fieldClazz, String fullPath) throws ParseException {
        if (fullPath == null || fullPath.length() == 0) {
            return fullPath;
        }
        if (annotation.useParseURL()) {
            String prefixValue = annotation.prefixValue();
            if (prefixValue.equals(annotation.DEFAULT_EMPTY_PREFIX_VALUE)) {
                prefixValue = Config.get(annotation.prefixConfigKey());
            }
            if (prefixValue != null && prefixValue.length() > 0) {
                if (fullPath.startsWith(prefixValue) && fullPath.length() > prefixValue.length()) {
                    return fullPath.substring(prefixValue.length() + 1);
                }
            }
        }
        return fullPath;
    }

    /**
     * 将相对url追加前缀
     *
     * @param annotation
     * @param relativePath
     * @return
     */
    @Override
    public String print(URLPrefixFill annotation, Class fieldClazz, String relativePath) {
        if (relativePath != null && !completed_path_regex.matcher(relativePath).matches()) {
            String prefixValue = annotation.prefixValue();
            if (prefixValue.equals(annotation.DEFAULT_EMPTY_PREFIX_VALUE)) {
                prefixValue = Config.get(annotation.prefixConfigKey());
            }
            if (prefixValue != null && prefixValue.length() > 0) {
                return prefixValue + relativePath;
            }
        }
        return relativePath;
    }

}
