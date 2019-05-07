package site.imcoder.blog.filter.exclude;

/**
 * 排除页面地址的类型
 *
 * @author Jeffrey.Deng
 * @date 2017-06-12
 */
public enum ExcludedPageType {

    EQUALS(0), START_WITH(1), END_WITH(2);

    private int value;

    private ExcludedPageType(int value) {
        this.value = value;
    }

}
