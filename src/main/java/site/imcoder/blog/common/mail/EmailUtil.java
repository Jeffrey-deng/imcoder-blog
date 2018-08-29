package site.imcoder.blog.common.mail;

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

    public static String NICK = "Service";

    public static void updateAccountInfo(String CFG_SMTP, String SSL_PORT, String NICK, String SEND_USER, String SEND_PASSWORD) {
        EmailUtil.CFG_SMTP = CFG_SMTP;
        EmailUtil.SSL_PORT = SSL_PORT;
        EmailUtil.NICK = NICK;
        EmailUtil.SEND_USER = SEND_USER;
        EmailUtil.SEND_PASSWORD = SEND_PASSWORD;
/*        CFG_SMTP = Config.get(ConfigConstants.EMAILPUSH_SMTP_ADDR);
        SSL_PORT = Config.get(ConfigConstants.EMAILPUSH_SMTP_PORT);
        SEND_USER = Config.get(ConfigConstants.EMAILPUSH_ACCOUNT_ADDR);
        SEND_PASSWORD = Config.get(ConfigConstants.EMAILPUSH_ACCOUNT_PASSWORD);
        NICK = Config.get(ConfigConstants.EMAILPUSH_ACCOUNT_NICKNAME);*/
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
        return sendProcess(CFG_SMTP, SSL_PORT, NICK, SEND_USER, SEND_PASSWORD, toMail, null, subject, content, null);
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
        return sendProcess(CFG_SMTP, SSL_PORT, NICK, SEND_USER, SEND_PASSWORD, toMail, null, subject, content, files);
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
        return sendProcess(CFG_SMTP, SSL_PORT, NICK, SEND_USER, SEND_PASSWORD, toMail, ccMail, subject, content, null);
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
        return sendProcess(CFG_SMTP, SSL_PORT, NICK, SEND_USER, SEND_PASSWORD, toMail, ccMail, subject, content, files);
    }

    /**
     * 发送邮件
     *
     * @param smtp         邮件服务器地址
     * @param ssl_port     ssl端口
     * @param formNickName 发件人昵称
     * @param fromAddress  发送人地址
     * @param fromPass     发送人密码
     * @param toAddress    收件人地址
     * @param ccAddress    抄送人地址
     * @param subject      发送主题
     * @param content      发送内容
     * @throws Exception
     */
    public static boolean sendProcess(String smtp, String ssl_port, String formNickName, String fromAddress, String fromPass, String toAddress,
                                      String ccAddress, String subject, String content, List<String> fileList) {
        boolean success = false;
        try {
            Email email = new Email(smtp, ssl_port, true);
            email.setNamePass(fromAddress, fromPass);
            email.setFrom(fromAddress, formNickName);
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
    public static void asyncSend(final String toMail, final String subject, final String content) {
        asyncSend(CFG_SMTP, SSL_PORT, NICK, SEND_USER, SEND_PASSWORD, toMail, null, subject, content, null);
    }

    /**
     * 异步发送并抄送
     *
     * @param toMail
     * @param ccMail
     * @param subject
     * @param content
     */
    public static void asyncSendAndCc(final String toMail, final String ccMail, final String subject, final String content) {
        asyncSend(CFG_SMTP, SSL_PORT, NICK, SEND_USER, SEND_PASSWORD, toMail, ccMail, subject, content, null);
    }

    /**
     * 异步发送邮件并发送附件
     *
     * @param toMail
     * @param subject
     * @param content
     * @return
     */
    public static void asyncSend(final String toMail, final String subject, final String content, final List<String> files) {
        asyncSend(CFG_SMTP, SSL_PORT, NICK, SEND_USER, SEND_PASSWORD, toMail, null, subject, content, files);
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
    public static void asyncSendAndCc(final String toMail, final String ccMail, final String subject, final String content, final List<String> files) {
        asyncSend(CFG_SMTP, SSL_PORT, NICK, SEND_USER, SEND_PASSWORD, toMail, ccMail, subject, content, files);
    }

    /**
     * 发送邮件
     *
     * @param smtp         邮件服务器地址
     * @param ssl_port     ssl端口
     * @param formNickName 发件人昵称
     * @param fromAddress  发送人地址
     * @param fromPass     发送人密码
     * @param toAddress    收件人地址
     * @param ccAddress    抄送人地址
     * @param subject      发送主题
     * @param content      发送内容
     * @throws Exception
     */
    public static void asyncSend(final String smtp, final String ssl_port, final String formNickName, final String fromAddress, final String fromPass, final String toAddress,
                                 final String ccAddress, final String subject, final String content, final List<String> fileList) {

        new Thread(new Runnable() {

            @Override
            public void run() {
                Email email = new Email(smtp, ssl_port, true);
                email.setNamePass(fromAddress, fromPass);
                email.setFrom(fromAddress, formNickName);
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
     * @param smtp         邮件服务器地址
     * @param ssl_port     ssl端口
     * @param formNickName 发件人昵称
     * @param fromAddress  发送人地址
     * @param fromPass     发送人密码
     * @param toAddress    收件人地址
     * @param ccAddress    抄送人地址
     * @param subject      发送主题
     * @param content      发送内容
     * @throws Exception
     */
    public static boolean asyncSend2(final String smtp, final String ssl_port, final String formNickName, final String fromAddress, final String fromPass, final String toAddress,
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
                email.setFrom(fromAddress, formNickName);
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
}
