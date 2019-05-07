package site.imcoder.blog.listener;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

/**
 * session监听器
 *
 * @author Jeffrey.Deng
 */
public class SessionListener implements HttpSessionListener {

    private static String userActiveCountKey = "user_active_count";

    @Override
    public void sessionCreated(HttpSessionEvent httpSessionEvent) {
        ServletContext servletContext = httpSessionEvent.getSession().getServletContext();
        Integer userActiveCount = (Integer) servletContext.getAttribute(userActiveCountKey);
        if (userActiveCount == null) {
            userActiveCount = new Integer(1);
            servletContext.setAttribute(userActiveCountKey, userActiveCount);
        } else {
            servletContext.setAttribute(userActiveCountKey, ++userActiveCount);
        }
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent httpSessionEvent) {
        ServletContext servletContext = httpSessionEvent.getSession().getServletContext();
        Integer userActiveCount = (Integer) servletContext.getAttribute(userActiveCountKey);
        if (userActiveCount == null) {
            userActiveCount = new Integer(0);
            servletContext.setAttribute(userActiveCountKey, userActiveCount);
        } else if (userActiveCount > 0) {
            servletContext.setAttribute(userActiveCountKey, --userActiveCount);
        }
    }

}
