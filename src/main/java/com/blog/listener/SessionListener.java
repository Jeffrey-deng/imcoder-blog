package com.blog.listener;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

/**
 * Created by Jeffrey.Deng on 2018/5/19.
 */
public class SessionListener implements HttpSessionListener {

    @Override
    public void sessionCreated(HttpSessionEvent httpSessionEvent) {
        ServletContext servletContext = httpSessionEvent.getSession().getServletContext();
        Integer userActiveCount = (Integer) servletContext.getAttribute("userActiveCount");
        if (userActiveCount == null) {
            userActiveCount = new Integer(1);
            servletContext.setAttribute("userActiveCount", userActiveCount);
        } else {
            servletContext.setAttribute("userActiveCount", ++userActiveCount);
        }
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent httpSessionEvent) {
        ServletContext servletContext = httpSessionEvent.getSession().getServletContext();
        Integer userActiveCount = (Integer) servletContext.getAttribute("userActiveCount");
        if (userActiveCount == null) {
            userActiveCount = new Integer(0);
            servletContext.setAttribute("userActiveCount", userActiveCount);
        } else if (userActiveCount > 0) {
            servletContext.setAttribute("userActiveCount", --userActiveCount);
        }
    }

}
