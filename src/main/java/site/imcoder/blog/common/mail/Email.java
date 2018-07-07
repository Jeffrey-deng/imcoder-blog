package site.imcoder.blog.common.mail;

import com.sun.net.ssl.internal.ssl.Provider;
import org.apache.log4j.Logger;

import javax.activation.DataHandler;
import javax.activation.FileDataSource;
import javax.mail.*;
import javax.mail.internet.*;
import java.security.Security;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Properties;

/**
 * 邮件发送处理工具类
 * @author dengchao
 * @date 2016-12-19 14:08
 */
public class Email {
 
    private static final Logger LOGGER = Logger.getLogger(Email.class);
     
    /** 邮件对象 **/
    private MimeMessage mimeMsg;
     
    /** 发送邮件的Session会话 **/
    private Session session;
     
    /** 邮件发送时的一些配置信息的一个属性对象
     *	创建Session时用到
     **/
    private Properties props;
     
    /** 发件人的用户名
     *	最后发送邮件时用到
     **/
    private String sendUserName;
     
    /** 发件人密码 **/
    private String sendUserPass;
     
    /** 附件添加的组件 **/
    private Multipart mp;
     
    /** 存放附件文件 **/
    private List<FileDataSource> files = new LinkedList<FileDataSource>();
 
    /**
     * @param smtp 指定SMTP服务器 
     * @param port 设置发送邮件端口号 465是SSL协议端口
     */
    public Email(String smtp, String port, boolean auth) {
        sendUserName = "";
        sendUserPass = "";
        props = new Properties();
        setSmtpHost(smtp);
        setSslPort(port);
        setNeedAuth(auth);
        createMimeMessage();
    }
 
    /**
     *  指定SMTP服务器 （SMTP：简单邮件传输协议）
     * @param hostName
     */
    private void setSmtpHost(String hostName) {
        if (props == null){
            props = new Properties();
        }
        props.put("mail.smtp.host", hostName);
    }
 
    /**
     * 设置发送邮件端口号 465是SSL协议端口
     * @param port
     */
    private void setSslPort(String port) {
        if (props == null){
            props = new Properties();
        }
        props.put("mail.smtp.port", port);
        // 指定的端口，连接到，在使用指定的套接字工厂。如果没有设置,将使用默认端口。
        props.setProperty("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
        props.put("mail.smtp.socketFactory.port", port);
    }
    
    /**
     * 指定是否需要SMTP验证 设置邮件发送需要认证
     */
    public void setNeedAuth(boolean need) {
        if (props == null){ props = new Properties();}
        if (need){
            props.put("mail.smtp.auth", "true");
        }else{
            props.put("mail.smtp.auth", "false");
        }
    }
    
    public boolean createMimeMessage() {
        try {
        	/**
			 * 添加安全权限 加密引擎的提供者 用于邮件加密
        	 **/
        	Security.addProvider(new Provider());
            /**
             * 用props对象来创建并初始化session对象
             **/
            session = Session.getDefaultInstance(props);
            /**
             * 用session对象来创建并初始化邮件对象
             **/
            mimeMsg = new MimeMessage(session);
            /**
             * 新建一个装内容的大盒子 用于添加内容和附件
             **/
            mp = new MimeMultipart();
            return true;
        } catch (Exception e) {
        	LOGGER.error("获取邮件会话对象时发生错误！" + e);
            return false;
        }
         
    }
 
    /**
     * 进行用户身份验证时，设置用户名和密码
     */
    public void setNamePass(String name, String pass) {
        sendUserName = name;
        sendUserPass = pass;
    }
 
    /**
     * 设置邮件主题
     * 
     * @param mailSubject
     * @return
     */
    public boolean setSubject(String mailSubject) {
        try {
            mimeMsg.setSubject(mailSubject);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
 
    /**
     * 设置邮件内容,并设置其为文本格式或HTML文件格式，编码方式为UTF-8
     * @param mailBody
     * @return
     */
    public boolean setBody(String mailBody) {
        try {
        	// 新建一个小盒子
            BodyPart bp = new MimeBodyPart();
            bp.setContent("<meta http-equiv=Content-Type content=text/html; charset=UTF-8>" + mailBody, "text/html;charset=UTF-8");
            // 将小盒子放到大盒子中去
            mp.addBodyPart(bp);
        } catch (Exception e) {
            System.err.println("设置邮件正文时发生错误！" + e);
            return false;
        }
        return true;
    }
 
    /**
     * 增加发送附件
     * @param filename 邮件附件的地址，只能是本机地址而不能是网络地址，否则抛出异常
     * @return
     */
    public boolean addFileAffix(String filename) {
        try {
            BodyPart bp = new MimeBodyPart();
            FileDataSource fileds = new FileDataSource(filename);
            bp.setDataHandler(new DataHandler(fileds));
            /**解决附件名称乱码**/
            bp.setFileName(MimeUtility.encodeText(fileds.getName(), "UTF-8",null));
            /**添加附件**/
            mp.addBodyPart(bp);
            files.add(fileds);
            return true;
        } catch (Exception e) {
            System.err.println("增加邮件附件<" + filename + ">时发生错误：" + e);
            return false;
        }
         
    }
 
    /**
     * 删除添加的附件
     * @return
     */
    public boolean delFileAffix() {
        try {
            FileDataSource fileds = null;
            for (Iterator<FileDataSource> it = files.iterator(); it.hasNext();) {
                fileds = it.next();
                if (fileds != null && fileds.getFile() != null) {
                    fileds.getFile().delete();
                }
            }
            return true;
        } catch (Exception e) {
            System.err.println("删除邮件附件发生错误：" + e);
            return false;
        }
         
    }
 
    /**
     * 设置发件人地址
     * @param from   发件人地址
     * @return
     */
    public boolean setFrom(String from) {
        try {
            mimeMsg.setFrom(new InternetAddress(from));
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 设置发件人地址与昵称
     * @param from   发件人地址
     * @return
     */
    public boolean setFrom(String from, String nick) {
        try {
            mimeMsg.setFrom(new InternetAddress(from,nick));
            return true;
        } catch (Exception e) {
            return false;
        }
    }
     
    /**
     * 设置收件人地址
     * @param toAddress    收件人的地址列表
     * @return
     */
    public boolean setToAddress(String toAddress) {
        try {
            if (toAddress == null)
                return false;
            InternetAddress[] iaToAddress = InternetAddress.parse(toAddress);
            mimeMsg.setRecipients(Message.RecipientType.TO, iaToAddress);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
     
    /**
     * 发送抄送
     * @param ccAddress
     * @return
     */
    public boolean setCopyToAddress(String ccAddress) {
        try {
            if (ccAddress == null)
                return false;
            InternetAddress[] iacopytoAddress = InternetAddress.parse(ccAddress);
            mimeMsg.setRecipients(javax.mail.Message.RecipientType.CC, iacopytoAddress);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
 
    /**
     * 发送邮件
     * @return
     */
    public boolean sendEmail() throws Exception {
        LOGGER.debug("正在发送邮件....");
         
        mimeMsg.setContent(mp);
        mimeMsg.saveChanges();
        Transport transport = session.getTransport("smtp");
         
        /** 连接邮件服务器并进行身份验证 **/
        transport.connect((String) props.get("mail.smtp.host"), sendUserName, sendUserPass);
         
        /** 发送邮件 **/
        transport.sendMessage(mimeMsg, mimeMsg.getRecipients(Message.RecipientType.TO));
        transport.close();
        LOGGER.info("邮件推送：发送给 "+ mimeMsg.getRecipients(Message.RecipientType.TO)[0].toString() +" 邮件成功！");
        return true;
    }
     
}
