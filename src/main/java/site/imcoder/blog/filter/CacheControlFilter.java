package site.imcoder.blog.filter;

import org.apache.catalina.filters.ExpiresFilter;

import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;

/**
 * 设置过期时间http头
 * <p>
 * 继承自 <code>tomcat</code> 的 {@link org.apache.catalina.filters.ExpiresFilter}
 * <p>
 * 增加 <b>排除页面(不设置过期头)</b> 功能
 * <pre>例子(排除所有.do的请求)：{@code
 * <init-param>
 *      <param-name>ExcludedPages</param-name>
 *      <param-value>*.do</param-value>
 * </init-param>
 * }</pre>
 *
 * @author Jeffrey.Deng
 */
public class CacheControlFilter extends ExpiresFilter {

    private static final String EXCLUDED_PAGES = "ExcludedPages";

    private String[] excludedPageArray;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        super.init(filterConfig);
        // 获取需要排除设置过期时间的页面
        excludedPageArray = commaDelimitedListToStringArray(filterConfig.getInitParameter(EXCLUDED_PAGES));
    }

    @Override
    protected boolean isEligibleToExpirationHeaderGeneration(HttpServletRequest request, XHttpServletResponse response) {
        String path = request.getServletPath();
        // 如果链接在排除数组中，则不设置过期时间头
        for (String excludedPage : this.excludedPageArray) {
            if (startsWithIgnoreCase(excludedPage, "*.")) {
                if (excludedPage.length() > 2) {
                    if (path.endsWith(excludedPage.substring(2))) {
                        return false;
                    }
                }
            }
            if (path.equals(excludedPage)) {
                return false;
            }
        }
        return super.isEligibleToExpirationHeaderGeneration(request, response);
    }
}
