package site.imcoder.blog.filter.exclude;

/**
 * 包装排除的页面地址类
 *
 * @author Jeffrey.Deng
 * @date 2017-06-12
 */
public class ExcludedPage {

    public ExcludedPageType type;

    public String pattern;

    public ExcludedPage() {
    }

    public ExcludedPage(ExcludedPageType type, String pattern) {
        this.type = type;
        this.pattern = pattern;
    }

}
