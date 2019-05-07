package site.imcoder.blog.controller.formatter.urlprefix.impl;

import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFill;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFiller;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import java.text.ParseException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 替换img标签中的src图片链接前缀
 *
 * @author Jeffrey.Deng
 * @date 2019-12-04
 */
public class ImgTagURLPrefixFiller implements URLPrefixFiller {

    private Pattern imgTagPattern = Pattern.compile("(<img[^>]*?src=\")([^\">]+?)(\"[^>]*?data-relative-path=\"([^\">]+?)\"[^>]*?>)");

    private static String CLOUD_IMAGE_FLAG = "data-cloud-image=\"true\"";

    /**
     * 从请求的提交的url中尝试截取出相对url
     *
     * @param annotation
     * @param fieldClazz
     * @param content
     * @return
     */
    @Override
    public String parse(URLPrefixFill annotation, Class fieldClazz, String content) throws ParseException {
        return content;
    }

    /**
     * 将相对url追加前缀
     *
     * @param annotation
     * @param fieldClazz
     * @param content
     * @return
     */
    @Override
    public String print(URLPrefixFill annotation, Class fieldClazz, String content) {
        if (content != null && content.length() > 0) {
            String prefixValue = annotation.prefixValue();
            if (prefixValue.equals(annotation.DEFAULT_EMPTY_PREFIX_VALUE)) {
                prefixValue = Config.get(annotation.prefixConfigKey());
            }
            if (prefixValue != null && prefixValue.length() > 0) {
                return replaceURLPrefix(prefixValue, content);
            }
        }
        return content;
    }

    private String replaceURLPrefix(String prefixValue, String content) {
        String cloud_prefix = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
        StringBuffer sb = new StringBuffer();
        Matcher matcher = imgTagPattern.matcher(content);
        while (matcher.find()) {
            String newPath;
            if (matcher.group(0).indexOf(CLOUD_IMAGE_FLAG) == -1) { // 判断属于哪种图片
                newPath = matcher.group(1) + prefixValue + matcher.group(4) + matcher.group(3);
            } else {
                newPath = matcher.group(1) + cloud_prefix + matcher.group(4) + matcher.group(3);
            }
            matcher.appendReplacement(sb, Matcher.quoteReplacement(newPath));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

}
