package site.imcoder.blog.controller.formatter.urlprefix.impl;

import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFill;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFiller;
import site.imcoder.blog.setting.Config;

import java.text.ParseException;

/**
 * @author Jeffrey.Deng
 * @date 2018-12-19
 */
public class AccessRecordURLPrefixFiller implements URLPrefixFiller {

    /**
     * 从请求的提交的url中尝试截取出相对url
     *
     * @param annotation
     * @param fieldClazz
     * @param inputAccessPath
     * @return
     */
    @Override
    public String parse(URLPrefixFill annotation, Class fieldClazz, String inputAccessPath) throws ParseException {
        if (inputAccessPath == null || inputAccessPath.length() == 0) {
            return inputAccessPath;
        }
        if (annotation.useParseURL()) {
            String prefixValue = annotation.prefixValue();
            if (prefixValue.equals(annotation.DEFAULT_EMPTY_PREFIX_VALUE)) {
                prefixValue = Config.get(annotation.prefixConfigKey());
            }
            if (prefixValue != null && prefixValue.length() > 0) {
                if (inputAccessPath.startsWith(prefixValue)) {
                    if (inputAccessPath.length() > prefixValue.length()) {
                        return "/" + inputAccessPath.substring(prefixValue.length());
                    } else {
                        return "/";
                    }
                }
            }
        }
        return inputAccessPath;
    }

    /**
     * 将相对url追加前缀
     *
     * @param annotation
     * @param fieldClazz
     * @param accessPath
     * @return
     */
    @Override
    public String print(URLPrefixFill annotation, Class fieldClazz, String accessPath) {
        String prefixValue = annotation.prefixValue();
        if (prefixValue.equals(annotation.DEFAULT_EMPTY_PREFIX_VALUE)) {
            prefixValue = Config.get(annotation.prefixConfigKey());
        }
        if (prefixValue != null && prefixValue.length() > 0) {
            if (accessPath != null) {
                if (accessPath.length() == 0) {
                    return prefixValue;
                } else if (accessPath.startsWith("/")) {
                    if (accessPath.length() > 1) {
                        return prefixValue + accessPath.substring(1);
                    } else {
                        return prefixValue;
                    }
                }
            }
        }
        return accessPath;
    }

}
