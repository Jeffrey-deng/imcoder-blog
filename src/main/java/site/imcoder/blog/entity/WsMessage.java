package site.imcoder.blog.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.Serializable;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * @author Jeffrey.Deng
 * @date 2018-01-24
 */
@JsonIgnoreProperties(ignoreUnknown = true) // 反序列化时忽略不存在的属性
@JsonInclude(JsonInclude.Include.NON_NULL)  // 序列化时去掉为null的属性
public class WsMessage implements Serializable {

    private static final long serialVersionUID = -4448205103851488985L;

    private long id = System.currentTimeMillis();

    private String mapping;

    // 客户端对应的用户，服务端接收消息时需设置
    @JsonIgnore
    private User user;

    @JsonIgnore
    private WebSocketSession webSocketSession;

    private String text;

    private Map<String, Object> metadata;

    public WsMessage() {

    }

    public WsMessage(String mapping) {
        this.mapping = mapping;
    }

    public WsMessage(String mapping, String text) {
        this.mapping = mapping;
        this.text = text;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getMapping() {
        return mapping;
    }

    public void setMapping(String mapping) {
        this.mapping = mapping;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public WebSocketSession getWebSocketSession() {
        return webSocketSession;
    }

    public void setWebSocketSession(WebSocketSession webSocketSession) {
        this.webSocketSession = webSocketSession;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public Object getMetadata(String key) {
        if (metadata == null) {
            return null;
        } else {
            return metadata.get(key);
        }
    }

    public WsMessage setMetadata(String key, Object value) {
        if (metadata == null) {
            this.metadata = new LinkedHashMap<>();
        }
        metadata.put(key, value);
        return this;
    }

    public boolean containsMetadata(String key) {
        if (metadata == null) {
            return false;
        } else {
            return metadata.containsKey(key);
        }
    }

    public TextMessage makeTextMessage() {
        return new TextMessage(toString());
    }

    /**
     * 当前请求的用户是否已登录
     *
     * @return
     */
    @JsonIgnore
    public boolean isHasLoggedIn() {
        return user != null && user.getUid() != null && user.getUid() > 0;
    }

    /**
     * 当前是否是管理员
     *
     * @return
     */
    @JsonIgnore
    public boolean isManager() {
        return isHasLoggedIn() && user.getUserGroup() != null && user.getUserGroup().isManager();
    }

    @Override
    public String toString() {
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            return objectMapper.writeValueAsString(this);
        } catch (JsonProcessingException e) {
        }
        return "";
    }
}
