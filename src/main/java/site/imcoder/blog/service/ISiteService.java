package site.imcoder.blog.service;

import site.imcoder.blog.entity.SysMsg;
import site.imcoder.blog.entity.User;

import java.util.List;

public interface ISiteService {

    /**
     * 发送验证码邮件
     *
     * @param user
     * @return validateCode
     */
    public String sendValidateMail(User user);

    /**
     * 发送系统消息
     *
     * @param sysMsg
     * @return flag - 200：成功，500: 失败
     */
    public int sendSystemMessage(SysMsg sysMsg);

    /**
     * 清除系统消息未读状态
     *
     * @param smIdList
     * @return flag - 200：成功，404：未影响到行，500: 失败
     */
    public int updateSystemMessageStatus(List<Integer> smIdList);
}
