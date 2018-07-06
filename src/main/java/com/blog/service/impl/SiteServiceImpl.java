package com.blog.service.impl;

import com.blog.dao.ISiteDao;
import com.blog.entity.SysMsg;
import com.blog.entity.User;
import com.blog.service.IEmailService;
import com.blog.service.ISiteService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;

@Service("siteService")
public class SiteServiceImpl implements ISiteService {

	@Resource
	private IEmailService emailService;

	@Resource
    private ISiteDao siteDao;

	/**
	 * 发送验证码邮件
	 * @param user
	 * @return validateCode
	 */
	public String sendValidateMail(User user) {
		return emailService.validateCodeMail(user);
	}

    /**
     * 发送系统消息
     * @param sysMsg
     * @return  flag - 200：成功，500: 失败
     */
	public int sendSystemMessage(SysMsg sysMsg) {
        return siteDao.saveSystemMessage(sysMsg) > 0 ? 200 : 500;
	}

    /**
     * 清除系统消息未读状态
     * @param smIdList
     * @return  flag - 200：成功，404：未影响到行，500: 失败
     */
    public int updateSystemMessageStatus(List<Integer> smIdList) {
        return convertRowToHttpCode(siteDao.updateSystemMessageStatus(smIdList));

    }

	private int convertRowToHttpCode(int row) {
		int httpCode = 200;
		if (row == 0) {
			httpCode = 404;
		} else if (row == -1) {
			httpCode = 500;
		}
		return httpCode;
	}


}
