package com.blog.service.impl;

import com.blog.cache.Cache;
import com.blog.common.Utils;
import com.blog.common.mail.EmailUtil;
import com.blog.entity.Article;
import com.blog.entity.Comment;
import com.blog.entity.User;
import com.blog.service.IEmailService;
import com.blog.setting.Config;
import com.blog.setting.ConfigConstants;
import org.apache.log4j.Logger;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.annotation.Resource;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Component("emailService")
@Scope("singleton")
@DependsOn({"configManager"})
public class EmailServiceImpl implements IEmailService {

    private static Logger logger = Logger.getLogger(EmailServiceImpl.class);

    /**
     * 线程池，线程数由conf中EMAILPUSH_THREAD_NUM参数配置
     */
    private ExecutorService executorPool;

    @Resource
    private Cache cache;

    /**
     * 类实例化配置参数
     */
    @PostConstruct
    public void init() {
        executorPool = Executors.newFixedThreadPool(Config.getInt(ConfigConstants.EMAILPUSH_THREAD_NUM));
        logger.info("EmailService 线程池初始化");
    }

    /**
     * 停止邮件服务
     */
    @PreDestroy
    public void stop() {
        if (executorPool != null && !executorPool.isShutdown()) {
            executorPool.shutdown(); // Disable new tasks from being submitted
            try {
                // Wait a while for existing tasks to terminate
                if (!executorPool.awaitTermination(2, TimeUnit.SECONDS)) {
                    executorPool.shutdownNow(); // Cancel currently executing tasks
                    // Wait a while for tasks to respond to being cancelled
                    if (!executorPool.awaitTermination(2, TimeUnit.SECONDS))
                        logger.warn("EmailServicePool stop fail");
                }
            } catch (InterruptedException ie) {
                // (Re-)Cancel if current thread also interrupted
                executorPool.shutdownNow();
                // Preserve interrupt status
                Thread.currentThread().interrupt();
            }
            logger.info("EmailService 线程池关闭");
        }
    }

    /**
     * 验证码邮件
     *
     * @param user
     * @return validateCode 验证码
     */
    public String validateCodeMail(final User user) {
        final String code = Utils.getValidateCode();
        String emailContent = EmailUtil.formatContent(user.getNickname(), "此次帐号信息变更需要的验证码如下，请在 30 分钟内输入验证码进行下一步操作。", code, "如果非你本人操作，你的帐号可能存在安全风险，请立即 修改密码。");
        boolean success = EmailUtil.send(user.getEmail(), "博客验证码： " + code, emailContent);
        return success ? code : null;
    }

    /**
     * 新用户欢迎邮件
     *
     * @param user
     */
    public void welcomeMail(final User user) {
        executorPool.execute(new Runnable() {

            @Override
            public void run() {
                Thread.currentThread().setName("Thread-EmailServicePool-welcomeMail");
                String emailContent = EmailUtil.formatContent(user.getNickname(), "博客注册成功！此邮箱可以在忘记密码后，用于找回密码、重置密码！还会用来做未读消息提醒！", "<a href='" + Config.get(ConfigConstants.SITE_ADDR) + "/user.do?method=home&uid=" + user.getUid() + "' target='_blank' style='text-decoration:none;' >Welcome</a>", "如果不想再接收此类消息可以在个人中心设置页设置。<br>联系我：<a href='mailto:chao.devin@gmail.com' style='text-decoration:none;color:#259;border:none;outline:none;'>chao.devin@gmail.com</a>");
                EmailUtil.send(user.getEmail(), user.getUsername() + " ，博客注册成功！ - ", emailContent);
            }
        });
    }

    /**
     * 通知管理员新用户
     *
     * @param managers
     * @param newUser
     */
    public void notifyManagerNewUserMail(List<User> managers, final User newUser) {
        for (final User manager : managers) {
            executorPool.execute(new Runnable() {

                @Override
                public void run() {
                    Thread.currentThread().setName("Thread-EmailServicePool-notifyManagerNewUserMail");
                    String emailContent = EmailUtil.formatContent(manager.getNickname(), "有新的用户注册博客", "<a href='" + Config.get(ConfigConstants.SITE_ADDR) + "/user.do?method=home&uid=" + newUser.getUid() + "' target='_blank' style='text-decoration:none;' >" + newUser.getNickname() + "</a>", "如果不想再接收此类消息可以在个人中心设置页设置。");
                    EmailUtil.send(manager.getEmail(), "新的用户注册：" + newUser.getNickname(), emailContent);
                }
            });
        }
    }

    /**
     * 收到私信提醒邮件
     *
     * @param user     接收者
     * @param sendUser 发送者
     */
    public void receivedLetterMail(final User user, final User sendUser) {
        executorPool.execute(new Runnable() {

            @Override
            public void run() {
                Thread.currentThread().setName("Thread-EmailServicePool-receivedLetterMail");
                String emailContent = EmailUtil.formatContent(user.getNickname(), "你有一条新私信！ 来自 <b>\"" + sendUser.getNickname() + "\"</b>", "<a href='" + Config.get(ConfigConstants.SITE_ADDR) + "/user.do?method=profilecenter&action=sendLetter&chatuid=" + sendUser.getUid() + "' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在个人中心设置页设置。");
                EmailUtil.send(user.getEmail(), "你有一条新私信！", emailContent);
            }
        });
    }

    /**
     * 收到评论提醒邮件
     *
     * @param comment
     */
    public void receivedCommentMail(final Comment comment) {
        executorPool.execute(new Runnable() {

            @Override
            public void run() {
                Thread.currentThread().setName("Thread-EmailServicePool-receivedCommentMail");
                Article article = cache.getArticle(comment.getAid(), Cache.READ);
                User author = cache.getUser(article.getAuthor().getUid(), Cache.READ);
                User sendUser = comment.getUser();
                //自己给自己回复则不发信
                //由于Parentid=0时，replyuid会被设置为作者id 所以只需要此判断足以
                if (sendUser.getUid() != comment.getReplyuid()) {
                    //如果评论是直接回复文章 且 给文章作者发送一封信
                    if (comment.getParentid() == 0) {
                        String emailContent = EmailUtil.formatContent(author.getNickname(), "<b>\"" + sendUser.getNickname() + "\"</b> 对你的文章 <b>\"" + article.getTitle() + "\"</b> 发表了一条评论！", "<a href='" + Config.get(ConfigConstants.SITE_ADDR) + "/article.do?method=detail&aid=" + comment.getAid() + "#comments' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在个人中心设置页设置。");
                        EmailUtil.send(author.getEmail(), "你的文章 \"" + article.getTitle() + "\" 有一条新评论！", emailContent);
                    } else if (comment.getParentid() > 0) {
                        //如果是回复的评论，则给replyUser发送一封邮件
                        User replyUser = cache.getUser(comment.getReplyuid(), Cache.READ);
                        String emailContent = EmailUtil.formatContent(replyUser.getNickname(), "<b>\"" + sendUser.getNickname() + "\"</b> 回复了你在 <b>\"" + article.getTitle() + "\"</b> 的评论！", "<a href='" + Config.get(ConfigConstants.SITE_ADDR) + "/article.do?method=detail&aid=" + comment.getAid() + "#comments' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在个人中心设置页设置。");
                        EmailUtil.send(replyUser.getEmail(), "\"" + sendUser.getNickname() + "\" 回复了你的评论！", emailContent);
                    }
                }
            }
        });
    }

    /**
     * 新的关注者提醒邮件
     *
     * @param user
     * @param fan
     */
    public void theNewFollowerMail(final User user, final User fan) {
        executorPool.execute(new Runnable() {

            @Override
            public void run() {
                Thread.currentThread().setName("Thread-EmailServicePool-theNewFollowerMail");
                String emailContent = EmailUtil.formatContent(user.getNickname(), "以下用户刚刚关注了你", "<a href='" + Config.get(ConfigConstants.SITE_ADDR) + "/user.do?method=home&uid=" + fan.getUid() + "' target='_blank' style='text-decoration:none;' >" + fan.getNickname() + "</a>", "如果不想再接收此类消息可以在个人中心设置页设置。");
                EmailUtil.send(user.getEmail(), "有新的用户关注了你！", emailContent);
            }
        });
    }

    /**
     * 新文章发布，推送给关注者邮件
     *
     * @param article
     */
    public void postNewArticleToFollowerMail(Article article) {
        executorPool.execute(new Runnable() {

            @Override
            public void run() {
                Thread.currentThread().setName("Thread-EmailServicePool-postNewArticleToFollowerMail");
            }
        });
    }

}
