package site.imcoder.blog.service.message;

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSetter;
import site.imcoder.blog.service.BaseService;
import site.imcoder.blog.setting.GlobalConstants;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

/**
 * 服务调用返回的Response
 *
 * @author Jeffrey.Deng
 * @date 2016-10-23
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class IResponse implements GlobalConstants, Serializable {

    private static final long serialVersionUID = -8903476797491192067L;

    @JsonIgnore
    private BaseService serviceImpl;

    /**
     * 状态码
     */
    private int status;

    /**
     * 状态码意义（友好性文字）
     */
    private String message;

    /**
     * 数据map
     */
    private Map<String, Object> data;

    public IResponse() {
        setStatus(STATUS_SUCCESS);
    }

    public IResponse(BaseService serviceImpl) {
        this.serviceImpl = serviceImpl;
        setStatus(STATUS_SUCCESS);
    }

    public IResponse(int status) {
        setStatus(status);
    }

    public IResponse(int status, String message) {
        setStatus(status).setMessage(message);
    }

    public IResponse(BaseService serviceImpl, int status) {
        this.serviceImpl = serviceImpl;
        setStatus(status);
    }

    /**
     * 设置状态码
     *
     * @param status
     * @return
     */
    public IResponse setStatus(int status) {
        this.status = status;
        message = convertStatusCodeToWord(status);
        return this;
    }

    /**
     * 获取状态码, 状态码意义（友好性文字）
     *
     * @param status
     * @param message
     * @return
     */
    public IResponse setStatus(int status, String message) {
        this.status = status;
        if (message != null) {
            this.message = message;
        } else {
            this.message = convertStatusCodeToWord(status);
        }
        return this;
    }

    /**
     * 复制前一个response的状态码
     *
     * @param other
     * @return
     */
    public IResponse setStatus(IResponse other) {
        this.setStatus(other.getStatus());
        this.setMessage(other.getMessage());
        return this;
    }

    /**
     * 获取状态码
     *
     * @return
     */
    public int getStatus() {
        return status;
    }

    /**
     * 设置状态码意义（友好性文字）
     *
     * @param message
     * @return
     */
    public IResponse setMessage(String message) {
        this.message = message;
        return this;
    }

    /**
     * 获取状态码意义（友好性文字）
     *
     * @return
     */
    public String getMessage() {
        return message;
    }

    /**
     * 插入值
     *
     * @param key
     * @param value
     * @return
     */
    public IResponse putAttr(String key, Object value) {
        if (data == null) {
            data = new HashMap();
        }
        data.put(key, value);
        return this;
    }

    /**
     * 从map插入值
     *
     * @param map
     * @return
     */
    @JsonSetter("data")
    public IResponse putAttr(Map<String, Object> map) {
        if (map != null) {
            if (data == null) {
                data = new HashMap();
            }
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                data.put(entry.getKey(), entry.getValue());
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
    @JsonIgnore
    public <T> T getAttr(String key) {
        if (data == null) {
            return null;
        } else {
            return (T) data.get(key);
        }
    }

    /**
     * 获取所有值的map
     *
     * @return map
     */
    @JsonGetter("data")
    public Map<String, Object> getAttr() {
        return data;
    }

    /**
     * 移除key
     *
     * @param key
     * @return
     */
    public IResponse removeAttr(String key) {
        if (data != null) {
            data.remove(key);
        }
        return this;
    }

    /**
     * 返回结果是否成功 (status == 200)
     *
     * @return
     */
    @JsonIgnore
    public boolean isSuccess() {
        return status == STATUS_SUCCESS;
    }

    /**
     * 返回结果是否失败 (status != 200)
     *
     * @return
     */
    @JsonIgnore
    public boolean isFail() {
        return !isSuccess();
    }

    /**
     * status与参数是否都相等
     *
     * @param status
     * @return
     */
    public boolean equalsStatus(int status) {
        return this.status == status;
    }

    /**
     * 默认状态码的默认提示信息
     *
     * @param status
     * @return
     */
    public String convertStatusCodeToWord(int status) {
        if (serviceImpl != null) {
            return serviceImpl.convertStatusCodeToWord(status);
        } else {
            String message = null;
            switch (status) {
                case STATUS_SUCCESS:
                    message = FRIENDLY_SUCCESS;
                    break;
                case STATUS_PARAM_ERROR:
                    message = FRIENDLY_PARAM_ERROR;
                    break;
                case STATUS_NOT_LOGIN:
                    message = FRIENDLY_NOT_LOGIN;
                    break;
                case STATUS_FORBIDDEN:
                    message = FRIENDLY_FORBIDDEN;
                    break;
                case STATUS_NOT_FOUND:
                    message = FRIENDLY_NOT_FOUND;
                    break;
                case STATUS_SERVER_ERROR:
                    message = FRIENDLY_SERVER_ERROR;
                    break;
                default:
                    message = null;
            }
            return message;
        }
    }

}
