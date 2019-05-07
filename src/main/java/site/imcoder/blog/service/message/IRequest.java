package site.imcoder.blog.service.message;

import site.imcoder.blog.entity.User;
import site.imcoder.blog.setting.GlobalConstants;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

/**
 * 请求entity
 *
 * @author Jeffrey.Deng
 * @date 2016-10-23
 */
public class IRequest implements GlobalConstants, Serializable {

    private static final long serialVersionUID = -7660459205803884825L;

    /**
     * 访问的用户
     */
    private User loginUser;

    /**
     * 访问ip
     */
    private String accessIp;

    /**
     * 访问路径（相对于contextPath）
     */
    private String accessPath;

    /**
     * 完整的查询参数，不以?开头，无查询参数时，返回空字符串
     */
    private String queryString;

    /**
     * 存储一些的不必需或有默认值的输入值
     */
    private Map<String, Object> attributes;

    public IRequest() {
    }

    public IRequest(User loginUser) {
        this.loginUser = loginUser;
    }

    public User getLoginUser() {
        return loginUser;
    }

    public IRequest setLoginUser(User loginUser) {
        this.loginUser = loginUser;
        return this;
    }

    public String getAccessIp() {
        return accessIp;
    }

    public IRequest setAccessIp(String accessIp) {
        this.accessIp = accessIp;
        return this;
    }

    public String getAccessPath() {
        return accessPath;
    }

    public IRequest setAccessPath(String accessPath) {
        this.accessPath = accessPath;
        return this;
    }

    public String getQueryString() {
        return queryString;
    }

    public void setQueryString(String queryString) {
        this.queryString = queryString;
    }

    public Map<String, Object> getAttrs() {
        return attributes;
    }

    public IRequest setAttrs(Map<String, Object> data) {
        this.attributes = data;
        return this;
    }

    /**
     * 插入值
     *
     * @param key
     * @param value
     * @return
     */
    public IRequest putAttr(String key, Object value) {
        if (attributes == null) {
            attributes = new HashMap();
        }
        attributes.put(key, value);
        return this;
    }

    /**
     * 从map插入值
     *
     * @param map
     * @return
     */
    public IRequest putAttr(Map<String, Object> map) {
        if (attributes == null) {
            attributes = new HashMap();
        }
        if (map != null) {
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                attributes.put(entry.getKey(), entry.getValue());
            }
        }
        return this;
    }

    /**
     * 获取值
     *
     * @param key
     * @param <T>
     * @return
     */
    public <T> T getAttr(String key) {
        if (attributes == null) {
            return null;
        } else {
            return (T) attributes.get(key);
        }
    }

    /**
     * 获取值
     *
     * @param key
     * @param defaultValue 当前key为null的默认值
     * @param <T>
     * @return
     */
    public <T> T getAttr(String key, Object defaultValue) {
        Object value = getAttr(key);
        if (value != null) {
            return (T) value;
        } else {
            return (T) defaultValue;
        }
    }

    /**
     * 当前请求的用户是否已登录
     *
     * @return
     */
    public boolean isHasLoggedIn() {
        return loginUser != null && loginUser.getUid() != null && loginUser.getUid() > 0;
    }

    /**
     * 当前请求的用户是否没有登录
     *
     * @return
     */
    public boolean isHasNotLoggedIn() {
        return !isHasLoggedIn();
    }

    /**
     * 当前请求是否是管理员请求
     * 当没有登录时，返回false
     *
     * @return
     */
    public boolean isManagerRequest() {
        return isHasLoggedIn() && loginUser.getUserGroup() != null && loginUser.getUserGroup().isManager();
    }

    /**
     * 复制一个请求
     * loginUser和map里对象只是复制引用
     *
     * @return
     */
    public IRequest copyIRequest() {
        IRequest copyIRequest = new IRequest(loginUser);
        copyIRequest.setAccessPath(accessPath);
        copyIRequest.setAccessIp(accessIp);
        copyIRequest.setQueryString(queryString);
        copyIRequest.putAttr(attributes);
        return copyIRequest;
    }

}
