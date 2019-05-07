package site.imcoder.blog.service;

import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.GlobalConstants;

/**
 * @author Jeffrey.Deng
 * @date 2016-07-27
 */
public abstract class BaseService implements GlobalConstants {

    /**
     * 默认状态码的默认提示信息，可让子类重写，已修改默认message
     *
     * @param status
     * @return
     */
    public String convertStatusCodeToWord(int status) {
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

    /**
     * sql row 结果转为 status code
     *
     * @param row
     * @return status
     */
    public int convertRowToHttpCode(int row) {
        int httpCode = IResponse.STATUS_SUCCESS;
        if (row == 0) {
            httpCode = IResponse.STATUS_NOT_FOUND;
        } else if (row == -1) {
            httpCode = IResponse.STATUS_SERVER_ERROR;
        }
        return httpCode;
    }

    /**
     * @return int
     * 403 ： 不是管理员
     * 401 ： 未登录
     * 200 ： 是管理员
     */
    public int isAdmin(User loginUser) {
        if (loginUser == null || loginUser.getUid() == null || loginUser.getUid().equals(0L)) {
            return STATUS_NOT_LOGIN;
        } else if (loginUser.getUserGroup() != null && loginUser.getUserGroup().isManager()) {
            return STATUS_SUCCESS;
        } else {
            return STATUS_FORBIDDEN;
        }
    }

}
