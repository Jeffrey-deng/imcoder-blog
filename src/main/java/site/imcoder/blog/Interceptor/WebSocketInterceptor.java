package site.imcoder.blog.Interceptor;

import org.apache.log4j.Logger;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.setting.GlobalConstants;

import javax.servlet.http.HttpSession;
import java.util.Map;

/**
 * @author Jeffrey.Deng
 * @date 2018-01-24
 */
public class WebSocketInterceptor extends HttpSessionHandshakeInterceptor {

    private static Logger logger = Logger.getLogger(WebSocketInterceptor.class);

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
//        HttpSession session = this.getSession(request);
//        if(session != null) {
//            User loginUser = (User)session.getAttribute(GlobalConstants.LOGIN_USER_KEY);
//            if (loginUser != null) {
//                attributes.put(GlobalConstants.LOGIN_USER_KEY, loginUser);
//            }
//        }
        // 父类中实现了复制session中所有元素
        return super.beforeHandshake(request, response, wsHandler, attributes);
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception ex) {
        if (logger.isDebugEnabled()) {
            HttpSession session = this.getSession(request);
            if (session != null) {
                User loginUser = (User) session.getAttribute(GlobalConstants.LOGIN_USER_KEY);
                if (loginUser != null) {
                    logger.debug("user " + loginUser.getUid() + " hand shake with server successfully");
                }
            }
        }
        super.afterHandshake(request, response, wsHandler, ex);
    }

    private HttpSession getSession(ServerHttpRequest request) {
        if (request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest serverRequest = (ServletServerHttpRequest) request;
            return serverRequest.getServletRequest().getSession(this.isCreateSession());
        } else {
            return null;
        }
    }
}
