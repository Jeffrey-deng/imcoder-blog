package com.blog.filter;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Created by Jeffrey.Deng on 2018/5/9.
 * http强转https
 */
public class Http2HttpsFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {

    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        //获取请求协议
        String scheme = request.getScheme();
        //根据请求协议进行过滤，请求协议为HTTP的都进行重定向
        if (scheme.equalsIgnoreCase("http")) {
            //http的url换成https的url
            String url = req.getRequestURL().toString().replaceFirst("http", "https");
            String queryString = req.getQueryString();
            if (queryString != null && queryString.length() > 0) {
                url = url + "?" + queryString;
            }
            //重定向
            res.sendRedirect(url);
        } else {
            chain.doFilter(req, res);
        }
    }

    @Override
    public void destroy() {

    }
}
