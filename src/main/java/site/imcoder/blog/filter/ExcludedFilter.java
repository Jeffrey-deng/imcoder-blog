package site.imcoder.blog.filter;

import site.imcoder.blog.filter.exclude.ExcludedPage;
import site.imcoder.blog.filter.exclude.ExcludedPageType;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.regex.Pattern;

/**
 * <pre>
 * <b>排除页面(不设置过期头)</b> 功能的filter：
 * 例子（排除所有.do的请求和排除/static开头的请求）：{@code
 *  <init-param>
 *      <param-name>ExcludedPages</param-name>
 *      <param-value>*.do,/static/*</param-value>
 *  </init-param>
 * }</pre>
 *
 * @author Jeffrey.Deng
 */
public abstract class ExcludedFilter implements Filter {

    private static final String EXCLUDED_PAGES = "ExcludedPages";

    // 排除页面数组
    protected ExcludedPage[] excludedPageArray;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // 获取需要排除设置的页面
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
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        String path = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath.length() > 0) {
            path = path.substring(contextPath.length());
        }
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
        if (!shouldExclude) {
            doFilter(request, response, chain);
        } else {
            chain.doFilter(request, response);
        }
    }

    /**
     * 经过排除页面的doFilter
     *
     * @param request
     * @param response
     * @param chain
     * @throws IOException
     * @throws ServletException
     */
    public abstract void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws IOException, ServletException;

    @Override
    public void destroy() {
        excludedPageArray = null;
    }

    /**
     * {@link Pattern} for a comma delimited string that support whitespace
     * characters
     */
    private static final Pattern commaSeparatedValuesPattern = Pattern.compile("\\s*,\\s*");

    /**
     * Convert a given comma delimited list of strings into an array of String
     *
     * @param commaDelimitedStrings the string to be split
     * @return array of patterns (non {@code null})
     */
    protected static String[] commaDelimitedListToStringArray(String commaDelimitedStrings) {
        return (commaDelimitedStrings == null || commaDelimitedStrings.length() == 0) ? new String[0]
                : commaSeparatedValuesPattern.split(commaDelimitedStrings);
    }

    /**
     * @param string can be {@code null}
     * @param prefix can be {@code null}
     * @return {@code true} if the given {@code string} starts with the
     * given {@code prefix} ignoring case.
     */
    protected static boolean startsWithIgnoreCase(String string, String prefix) {
        if (string == null || prefix == null) {
            return string == null && prefix == null;
        }
        if (prefix.length() > string.length()) {
            return false;
        }
        return string.regionMatches(true, 0, prefix, 0, prefix.length());
    }

}
