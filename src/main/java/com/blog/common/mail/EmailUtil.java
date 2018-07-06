package com.blog.common.mail;

import com.blog.setting.Config;
import com.blog.setting.ConfigConstants;
import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;

import java.util.List;
import java.util.concurrent.*;

/**
 * 邮件发送类
 *
 * @author dengchao
 * @since 1.0
 */
public class EmailUtil {

    private static final Logger LOGGER = Logger.getLogger(EmailUtil.class);

    /**
     * 常见的邮件发送协议地址
     **/
    private static final String SMTP_ALI = "smtpdm.aliyun.com";
    private static final String SMTP_ALIQY = "smtp.mxhichina.com";
    private static final String SMTP_QQ = "smtp.qq.com";
    private static final String SMTP_163 = "smtp.163.com";
    private static final String SMTP_SINA = "smtp.sina.com";
    private static final String SMTP_GMAIL = "smtp.gmail.com";


    public static String CFG_SMTP = SMTP_ALI;

    public static String SSL_PORT = "465";

    public static String SEND_USER = "";

    public static String SEND_PASSWORD = "";

    public static String NICK = "Blog Service";

    public static void updateAccountInfo() {
        CFG_SMTP = Config.get(ConfigConstants.EMAILPUSH_SMTP_ADDR);
        SSL_PORT = Config.get(ConfigConstants.EMAILPUSH_SMTP_PORT);
        SEND_USER = Config.get(ConfigConstants.EMAILPUSH_ACCOUNT_ADDR);
        SEND_PASSWORD = Config.get(ConfigConstants.EMAILPUSH_ACCOUNT_PASSWORD);
        NICK = Config.get(ConfigConstants.EMAILPUSH_ACCOUNT_NICKNAME);
    }


    /**
     * 发送邮件
     *
     * @param toMail  收件人地址
     * @param subject 发送主题
     * @param content 发送内容
     * @return 成功返回true，失败返回false
     * @throws Exception
     */
    public static boolean send(String toMail, String subject, String content) {
        return sendProcess(CFG_SMTP, SSL_PORT, SEND_USER, SEND_PASSWORD, toMail, null, subject, content, null);
    }

    /**
     * 发送邮件并发送附件
     *
     * @param toMail  收件人地址
     * @param subject 发送主题
     * @param content 发送内容
     * @param files   附件列表
     * @return 成功返回true，失败返回false
     * @throws Exception
     */
    public static boolean send(String toMail, String subject, String content, List<String> files) {
        return sendProcess(CFG_SMTP, SSL_PORT, SEND_USER, SEND_PASSWORD, toMail, null, subject, content, files);
    }

    /**
     * 发送并抄送
     *
     * @param toMail  收件人地址
     * @param ccMail  抄送地址
     * @param subject 发送主题
     * @param content 发送内容
     * @return 成功返回true，失败返回false
     */
    public static boolean sendAndCc(String toMail, String ccMail, String subject, String content) {
        return sendProcess(CFG_SMTP, SSL_PORT, SEND_USER, SEND_PASSWORD, toMail, ccMail, subject, content, null);
    }

    /**
     * 发送邮件并抄送，带附件
     *
     * @param toMail
     * @param ccMail
     * @param subject
     * @param content
     * @param files
     * @return
     */
    public static boolean sendAndCc(String toMail, String ccMail, String subject, String content, List<String> files) {
        return sendProcess(CFG_SMTP, SSL_PORT, SEND_USER, SEND_PASSWORD, toMail, ccMail, subject, content, files);
    }

    /**
     * 发送邮件
     *
     * @param smtp        邮件服务器地址
     * @param ssl_port    ssl端口
     * @param fromAddress 发送人地址
     * @param fromPass    发送人密码
     * @param toAddress   收件人地址
     * @param ccAddress   抄送人地址
     * @param subject     发送主题
     * @param content     发送内容
     * @throws Exception
     */
    public static boolean sendProcess(String smtp, String ssl_port, String fromAddress, String fromPass, String toAddress,
                                      String ccAddress, String subject, String content, List<String> fileList) {
        boolean success = false;
        try {
            Email email = new Email(smtp, ssl_port, true);
            email.setNamePass(fromAddress, fromPass);
            email.setFrom(fromAddress, NICK);
            email.setSubject(subject);
            email.setBody(content);
            email.setToAddress(toAddress);

            /**添加抄送**/
            if (StringUtils.isNotEmpty(ccAddress)) {
                email.setCopyToAddress(ccAddress);
            }

            if (null != fileList && fileList.size() > 0) {
                /** 附件文件路径 **/
                for (String file : fileList) {
                    email.addFileAffix(file);
                }
            }
            success = email.sendEmail();
        } catch (Exception e) {
            success = false;
            e.printStackTrace();
            LOGGER.warn("邮件推送：发送给 " + toAddress + " 邮件失败！" + e.toString());
        }
        return success;
    }


    /*********************************************异步发送:S*******************************************/

    /**
     * 异步发送邮件
     *
     * @param toMail
     * @param subject
     * @param content
     * @return
     */
    public static void asynSend(final String toMail, final String subject, final String content) {
        asynSend(CFG_SMTP, SSL_PORT, SEND_USER, SEND_PASSWORD, toMail, null, subject, content, null);
    }

    /**
     * 异步发送并抄送
     *
     * @param toMail
     * @param ccMail
     * @param subject
     * @param content
     */
    public static void asynSendAndCc(final String toMail, final String ccMail, final String subject, final String content) {
        asynSend(CFG_SMTP, SSL_PORT, SEND_USER, SEND_PASSWORD, toMail, ccMail, subject, content, null);
    }

    /**
     * 异步发送邮件并发送附件
     *
     * @param toMail
     * @param subject
     * @param content
     * @return
     */
    public static void asynSend(final String toMail, final String subject, final String content, final List<String> files) {
        asynSend(CFG_SMTP, SSL_PORT, SEND_USER, SEND_PASSWORD, toMail, null, subject, content, files);
    }

    /**
     * 异步发送邮件并抄送，带附件
     *
     * @param toMail
     * @param ccMail
     * @param subject
     * @param content
     * @param files
     * @return
     */
    public static void asynSendAndCc(final String toMail, final String ccMail, final String subject, final String content, final List<String> files) {
        asynSend(CFG_SMTP, SSL_PORT, SEND_USER, SEND_PASSWORD, toMail, ccMail, subject, content, files);
    }

    /**
     * 发送邮件
     *
     * @param smtp        邮件服务器地址
     * @param ssl_port    ssl端口
     * @param fromAddress 发送人地址
     * @param fromPass    发送人密码
     * @param toAddress   收件人地址
     * @param ccAddress   抄送人地址
     * @param subject     发送主题
     * @param content     发送内容
     * @throws Exception
     */
    public static void asynSend(final String smtp, final String ssl_port, final String fromAddress, final String fromPass, final String toAddress,
                                final String ccAddress, final String subject, final String content, final List<String> fileList) {

        new Thread(new Runnable() {

            @Override
            public void run() {
                Email email = new Email(smtp, ssl_port, true);
                email.setNamePass(fromAddress, fromPass);
                email.setFrom(fromAddress, NICK);
                email.setSubject(subject);
                email.setBody(content);
                email.setToAddress(toAddress);
                /**添加抄送**/
                if (StringUtils.isNotEmpty(ccAddress)) {
                    email.setCopyToAddress(ccAddress);
                }

                if (null != fileList && fileList.size() > 0) {
                    /** 附件文件路径 **/
                    for (String file : fileList) {
                        email.addFileAffix(file);
                    }
                }
                try {
                    email.sendEmail();
                } catch (Exception e) {
                    LOGGER.warn("邮件推送：发送给 " + toAddress + " 邮件失败！" + e.toString());
                    e.printStackTrace();
                }
            }
        }).start();
    }

    /**
     * 发送邮件
     *
     * @param smtp        邮件服务器地址
     * @param ssl_port    ssl端口
     * @param fromAddress 发送人地址
     * @param fromPass    发送人密码
     * @param toAddress   收件人地址
     * @param ccAddress   抄送人地址
     * @param subject     发送主题
     * @param content     发送内容
     * @throws Exception
     */
    public static boolean asynSend2(final String smtp, final String ssl_port, final String fromAddress, final String fromPass, final String toAddress,
                                    final String ccAddress, final String subject, final String content, final List<String> fileList) {
        Boolean flag = Boolean.FALSE;
        FutureTask<Boolean> futureTask = null;
        ExecutorService excutorService = Executors.newCachedThreadPool();
        // 执行任务
        futureTask = new FutureTask<Boolean>(new Callable<Boolean>() {
            @Override
            public Boolean call() throws Exception {
                Email email = new Email(smtp, ssl_port, true);
                email.setNamePass(fromAddress, fromPass);
                email.setFrom(fromAddress, NICK);
                email.setSubject(subject);
                email.setBody(content);
                email.setToAddress(toAddress);
                /**添加抄送**/
                if (StringUtils.isNotEmpty(ccAddress)) {
                    email.setCopyToAddress(ccAddress);
                }

                if (null != fileList && fileList.size() > 0) {
                    /** 附件文件路径 **/
                    for (String file : fileList) {
                        email.addFileAffix(file);
                    }
                }
                return email.sendEmail();
            }
        });
        excutorService.submit(futureTask);

        try {
            // 任务没超时说明发送成功
            flag = futureTask.get(5L, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            futureTask.cancel(true);
            e.printStackTrace();
        } catch (ExecutionException e) {
            futureTask.cancel(true);
            e.printStackTrace();
        } catch (TimeoutException e) {
            futureTask.cancel(true);
            e.printStackTrace();
        } finally {
            excutorService.shutdown();
        }
        return flag;
    }

    /*********************************************异步发送:E*******************************************/


    public static void asynSendTemplate(final String toMail, final String username, final String subject, final String content) {
        final String mailcontent = "<h3><img src='http://imcoder.site/img/favicon.ico' style='width:20px;height:26px;' /><b>&nbsp;imcoder.site</b></h3><b>" + username + " </b> 你好：<br><br>&nbsp;&nbsp;" + content;
        asynSend(CFG_SMTP, SSL_PORT, SEND_USER, SEND_PASSWORD, toMail, null, subject, mailcontent, null);
    }

    //此次帐号信息变更需要的验证码如下，请在 30 分钟内输入验证码进行下一步操作。
    public static String formatContent(String username, String startMsg, String code, String endMsg) {
        String content = "<style type='text/css'>@media screen and (max-width:525px){.qmbox table[class=responsive-table]{width:100%!important}.qmbox td[class=padding]{padding:30px 8% 35px 8%!important}.qmbox td[class=padding2]{padding:30px 4% 10px 4%!important;text-align:left}}@media all and (-webkit-min-device-pixel-ratio:1.5){.qmbox body[yahoo] .zhwd-high-res-img-wrap{background-size:contain;background-position:center;background-repeat:no-repeat}.qmbox body[yahoo] .zhwd-high-res-img-wrap img{display:none!important}.qmbox body[yahoo] .zhwd-high-res-img-wrap.zhwd-zhihu-logo{width:71px;height:54px}}</style><table border='0' cellpadding='0' cellspacing='0' width='100%'><tbody><tr><td bgcolor='#f7f9fa' align='center' style='padding:22px 0 20px 0' class='responsive-table'><table border='0' cellpadding='0' cellspacing='0' style='background-color:f7f9fa;border-radius:3px;border:1px solid #dedede;margin:0 auto;background-color:#fff' width='552' class='responsive-table'><tbody><tr><td bgcolor='#0373d6' "
                + "height='54' align='center' style='border-top-left-radius:3px;border-top-right-radius:3px'><table border='0' cellpadding='0' cellspacing='0' width='100%'><tbody><tr><td align='center' class='zhwd-high-res-img-wrap zhwd-zhihu-logo'><a href='http://imcoder.site' target='_blank' style='text-decoration:none'><b><h1 style='margin:0 auto;color:#fff;font-family:Open Sans'>imcoder.site</h1></b></a></td></tr></tbody></table></td></tr><tr><td bgcolor='#ffffff' align='center' style='padding:0 15px 0 15px'><table border='0' cellpadding='0' cellspacing='0' width='480' class='responsive-table'><tbody><tr><td><table width='100%' border='0' cellpadding='0' cellspacing='0'><tbody><tr><td><table cellpadding='0' cellspacing='0' border='0' align='left' class='responsive-table'><tbody><tr><td width='550' align='left' valign='top'><table width='100%' border='0' cellpadding='0' cellspacing='0'><tbody><tr><td bgcolor='#ffffff' align='left' style='background-color:#fff;font-size:17px;color:#7b7b7b;padding:28px 0 0 0;line-height:25px'><b>"
                + username +
                "，你好，</b></td></tr><tr><td align='left' valign='top' style='font-size:15px;color:#7b7b7b;font-size:14px;line-height:25px;font-family:Hiragino Sans GB;padding:20px 0 20px 0'>"
                + startMsg +
                "</td></tr><tr><td style='border-bottom:1px #f1f4f6 solid;padding:0 0 25px 0' align='center' class='padding'><table border='0' cellspacing='0' cellpadding='0' class='responsive-table'><tbody><tr><td><span style='font-family:Hiragino Sans GB'><div style='padding:10px 18px 10px 18px;border-radius:3px;text-align:center;text-decoration:none;background-color:#ecf4fb;color:#4581E9;font-size:20px;font-weight:700;letter-spacing:2px;margin:0;white-space:nowrap'><span style='border-bottom:1px dashed #ccc;z-index:1;position:static' t='7' onclick='return!1' data='' isout='1'>"
                + code +
                "</span></div></span></td></tr></tbody></table></td></tr><tr><td align='left' valign='top' style='font-size:15px;color:#7b7b7b;font-size:14px;line-height:25px;font-family:Hiragino Sans GB;padding:20px 0 35px 0'> "
                + endMsg +
                "</td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table>";
        return content;
    }
}
