package site.imcoder.blog.filter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * <pre>
 * <b>http强转https</b>
 * 排除页面(不设置过期头) 功能：
 * 例子（排除所有.do的请求和排除/static开头的请求）：{@code
 *  <init-param>
 *      <param-name>ExcludedPages</param-name>
 *      <param-value>*.do,/static/*</param-value>
 *  </init-param>
 * }</pre>
 *
 * @author Jeffrey.Deng
 */
public class Http2HttpsFilter extends ExcludedFilter {

    @Override
    public void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws IOException, ServletException {
        // 获取请求协议
        String scheme = request.getScheme();
        // 根据请求协议进行过滤，请求协议为HTTP的都进行重定向
        if (scheme.equalsIgnoreCase("http")) {
            // http的url换成https的url
            String url = request.getRequestURL().toString().replaceFirst("^http", "https");
            String queryString = request.getQueryString();
            if (queryString != null && queryString.length() > 0) {
                url = url + "?" + queryString;
            }
            // 重定向
            response.sendRedirect(url);
        } else {
            chain.doFilter(request, response);
        }
    }

}
