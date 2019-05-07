package site.imcoder.blog.filter;

import org.apache.catalina.filters.ExpiresFilter;
import site.imcoder.blog.filter.exclude.ExcludedPage;
import site.imcoder.blog.filter.exclude.ExcludedPageType;

import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;

/**
 * 设置过期时间http头
 * <p>
 * 继承自 <code>tomcat</code> 的 {@link org.apache.catalina.filters.ExpiresFilter}
 * <p>
 * 增加 <b>排除页面(不设置过期头)</b> 功能
 * <pre>例子（排除所有.do的请求和排除/static开头的请求）：{@code
 *  <init-param>
 *      <param-name>ExcludedPages</param-name>
 *      <param-value>*.do,/static/*</param-value>
 *  </init-param>
 * }</pre>
 *
 * @author Jeffrey.Deng
 */
public class CacheControlFilter extends ExpiresFilter {

    private static final String EXCLUDED_PAGES = "ExcludedPages";

    // 排除页面数组
    private ExcludedPage[] excludedPageArray;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        super.init(filterConfig);
        // 获取需要排除设置过期时间的页面
        String[] excludedPageStrArray = commaDelimitedListToStringArray(filterConfig.getInitParameter(EXCLUDED_PAGES));
        excludedPageArray = new ExcludedPage[excludedPageStrArray.length];
        for (int i = 0; i < excludedPageStrArray.length; i++) {
            String excludedPageStr = excludedPageStrArray[i];
            ExcludedPage excludedPage;
            if (excludedPageStr.endsWith("*") && excludedPageStr.length() > 1) {
                excludedPage = new ExcludedPage(ExcludedPageType.START_WITH, excludedPageStr.substring(0, excludedPageStr.length() - 1));
            } else if (startsWithIgnoreCase(excludedPageStr, "*.") && excludedPageStr.length() > 2) {
                excludedPage = new ExcludedPage(ExcludedPageType.END_WITH, excludedPageStr.substring(2));
            } else {
                excludedPage = new ExcludedPage(ExcludedPageType.EQUALS, excludedPageStr);
            }
            excludedPageArray[i] = excludedPage;
        }
    }

    @Override
    protected boolean isEligibleToExpirationHeaderGeneration(HttpServletRequest request, XHttpServletResponse response) {
        String path = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath.length() > 0) {
            path = path.substring(contextPath.length());
        }
        // 如果链接在排除数组中，则不设置过期时间头
        boolean shouldExclude = false;
        if (excludedPageArray != null && excludedPageArray.length > 0) {
            for (ExcludedPage excludedPage : this.excludedPageArray) {
                switch (excludedPage.type) {
                    case EQUALS:
                        if (path.equals(excludedPage.pattern)) {
                            shouldExclude = true;
                        }
                        break;
                    case START_WITH:
                        if (path.indexOf(excludedPage.pattern) == 0) {
                            shouldExclude = true;
                        }
                        break;
                    case END_WITH:
                        if (path.endsWith(excludedPage.pattern)) {
                            shouldExclude = true;
                        }
                        break;
                }
                if (shouldExclude) {
                    break;
                }
            }
        }
        if (shouldExclude) {
            return false;
        }
        return super.isEligibleToExpirationHeaderGeneration(request, response);
    }
}
