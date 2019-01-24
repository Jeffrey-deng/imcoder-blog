package site.imcoder.blog.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.log4j.Logger;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.Callable;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.mail.EmailUtil;
import site.imcoder.blog.dao.ISiteDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.service.INotifyService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;
import site.imcoder.blog.setting.Constants;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.annotation.Resource;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Component("notifyService")
@Scope("singleton")
@DependsOn({"configManager"})
public class NotifyServiceImpl implements INotifyService, WebSocketHandler {

    private static Logger logger = Logger.getLogger(NotifyServiceImpl.class);

    /**
     * 线程池，线程数由conf中EMAILPUSH_THREAD_NUM参数配置
     */
    private ExecutorService executorPool;

    private Set<WebSocketSession> userSessions; // 存储所有WebSocketSession

    private HashMap<String, List<Callable<WsMessage, WsMessage>>> onMessageCalls;   // 存储所有注册的回调方法，key为mapping, value为该mapping的对应的回调方法list

    private static final String GLOBAL_WS_CALLBACK = "global_ws_callback";  // 全局事件（所有消息都响应）的KEY

    private static final boolean RUN_OFFLINE_NOTIFY_WHEN_ONLINE = false; // 用户在线时是否运行离线通知，true: 同时运行，false: 当用户在线时，不执行其他方式通知

    @Resource
    private Cache cache;

    @Resource
    private ISiteDao siteDao;

    /**
     * 类实例化配置参数
     */
    @PostConstruct
    public void init() {
        executorPool = Executors.newFixedThreadPool(Config.getInt(ConfigConstants.NOTIFYSERVICE_THREAD_NUM));
        if (userSessions == null) {
            userSessions = new HashSet<>();
        }
        if (onMessageCalls == null) {
            onMessageCalls = new HashMap<>();
        }
        // 注册心跳连接事件
        onmessage("ping", new Callable<WsMessage, WsMessage>() {
            @Override
            public WsMessage call(WsMessage wsMessage) throws Exception {
                return new WsMessage("ping");
            }
        });
        // 注册返回WebSocket状态事件
        onmessage("status", new Callable<WsMessage, WsMessage>() {
            @Override
            public WsMessage call(WsMessage wsMessage) throws Exception {
                User loginUser = wsMessage.getUser();
                if (loginUser != null && loginUser.getUserGroup().getGid() == 1) {  // 仅管理员响应
                    Map<Integer, User> users = new HashMap<>();  // 返回WebSocket状态
                    for (WebSocketSession wss : userSessions) {
                        User u = getLoginUser(wss);
                        if (u != null && !users.containsKey(u.getUid())) {
                            users.put(u.getUid(), cache.cloneUser(u));
                        }
                    }
                    users.remove(null);
                    WsMessage statusMessage = new WsMessage("status");
                    statusMessage.setMetadata("users", users.values());
                    statusMessage.setMetadata("uv", users.size());
                    statusMessage.setMetadata("pv", userSessions.size());
                    return statusMessage;
                } else {
                    return null;
                }
            }
        });
        logger.info("NotifyService 线程池初始化");
    }

    /**
     * 停止通知服务
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
                        logger.warn("NotifyServicePool stop fail");
                }
            } catch (InterruptedException ie) {
                // (Re-)Cancel if current thread also interrupted
                executorPool.shutdownNow();
                // Preserve interrupt status
                Thread.currentThread().interrupt();
            }
            logger.info("NotifyService 线程池关闭");
        }
    }

    /**
     * 发送验证码
     *
     * @param user
     * @return validateCode 验证码
     */
    public String validateCode(final User user) {
        final String code = Utils.getValidateCode();
        String emailContent = formatContent(user.getNickname(), "此次帐号信息变更需要的验证码如下，请在 30 分钟内输入验证码进行下一步操作。", code, "如果非你本人操作，你的帐号可能存在安全风险，请立即 <a href='" + Config.get(ConfigConstants.SITE_ADDR) + "/user.do?method=profilecenter&action=account' style='text-decoration:none;color:#259;border:none;outline:none;' target='_blank'>修改密码</a>。");
        boolean success = sendEmail(user.getEmail(), "博客验证码： " + code, emailContent);
        return success ? code : null;
    }

    /**
     * 新用户欢迎通知
     *
     * @param user
     */
    public void welcomeNewUser(final User user) {
        executorPool.execute(new Runnable() {
            @Override
            public void run() {
                Thread.currentThread().setName("Thread-NotifyServicePool-welcomeNewUser");
                String siteHost = Config.get(ConfigConstants.SITE_ADDR);
                List<User> managers = cache.getManagers();
                String managerUrl = siteHost + "/user.do?method=profilecenter&action=sendLetter";
                if (managers != null && managers.size() > 0) {
                    managerUrl += ("&chatuid=" + managers.get(0).getUid());
                }
                String emailContent = formatContent(user.getNickname(), "博客注册成功！此邮箱可以在忘记密码后，用于找回密码、重置密码！还会用来做未读消息提醒！", "<a href='" + siteHost + "/user.do?method=home&uid=" + user.getUid() + "' target='_blank' style='text-decoration:none;' >Welcome</a>", "如果不想再接收此类消息可以在个人中心设置页设置。<br>联系我：<a href='" + managerUrl + "' style='text-decoration:none;color:#259;border:none;outline:none;'>站内信</a>");
                sendEmail(user.getEmail(), user.getUsername() + " ，博客注册成功！ - ", emailContent);
            }
        });
    }

    /**
     * 通知管理员新用户
     *
     * @param managers
     * @param newUser
     */
    public void notifyManagerNewUser(final List<User> managers, final User newUser) {
        executorPool.execute(new Runnable() {
            @Override
            public void run() {
                Thread.currentThread().setName("Thread-NotifyServicePool-notifyManagerNewUser");
                // WebSocket
                WsMessage wsMessage = new WsMessage("new_register_user");
                wsMessage.setMetadata("user", cache.cloneUser(newUser));
                pushWsMessage(managers, wsMessage);
                for (User manager : managers) {
                    // 邮件
                    String emailContent = formatContent(manager.getNickname(), "有新的用户注册博客", "<a href='" + Config.get(ConfigConstants.SITE_ADDR) + "/user.do?method=home&uid=" + newUser.getUid() + "' target='_blank' style='text-decoration:none;' >" + newUser.getNickname() + "</a>", "如果不想再接收此类消息可以在个人中心设置页设置。");
                    sendEmail(manager.getEmail(), "新的用户注册：" + newUser.getNickname(), emailContent);
                }
            }
        });
    }

    /**
     * 收到私信提醒通知
     *
     * @param letter 私信
     */
    public void receivedLetter(final Letter letter) {
        executorPool.execute(new Runnable() {
            @Override
            public void run() {
                User sendUser = cache.cloneSafetyUser(new User(letter.getS_uid()));
                User user = cache.getUser(letter.getR_uid(), Cache.READ);
                Thread.currentThread().setName("Thread-NotifyServicePool-receivedLetter");
                // WebSocket
                WsMessage wsMessage = new WsMessage("receive_letter", "你有一条新私信！ 来自 \"" + sendUser.getNickname() + "\"");
                letter.setChatUser(sendUser);
                wsMessage.setMetadata("letter", letter);
                wsMessage.setMetadata("user", sendUser);
                if (!pushWsMessage(user, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                    // mail
                    String emailContent = formatContent(user.getNickname(), "你有一条新私信！ 来自 <b>\"" + sendUser.getNickname() + "\"</b>", "<a href='" + Config.get(ConfigConstants.SITE_ADDR) + "/user.do?method=profilecenter&action=sendLetter&chatuid=" + sendUser.getUid() + "' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在个人中心设置页设置。");
                    sendEmail(user.getEmail(), "你有一条新私信！来自" + sendUser.getNickname(), emailContent);
                }
            }
        });
    }

    /**
     * 收到评论提醒通知
     *
     * @param comment
     */
    public void receivedComment(final Comment comment) {
        executorPool.execute(new Runnable() {
            @Override
            public void run() {
                Thread.currentThread().setName("Thread-NotifyServicePool-receivedComment");
                Article article = cache.getArticle(comment.getAid(), Cache.READ);
                User author = cache.getUser(article.getAuthor().getUid(), Cache.READ);
                User sendUser = comment.getUser();
                //自己给自己回复则不发信
                //由于Parentid=0时，replyuid会被设置为作者id 所以只需要此判断足以
                if (sendUser.getUid() != comment.getReplyuid()) {
                    // 如果评论是直接回复文章 且 给文章作者发送一封信
                    if (comment.getParentid() == 0) {
                        // WebSocket
                        WsMessage wsMessage = new WsMessage("receive_comment", "你的文章 \"" + article.getTitle() + "\" " + sendUser.getNickname() + " 发表了评论~");
                        comment.setUser(cache.cloneSafetyUser(comment.getUser()));
                        wsMessage.setMetadata("comment", comment);
                        wsMessage.setMetadata("article", article);
                        if (!pushWsMessage(author, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                            // 发送系统通知
                            String message = author.getNickname() + "你好，你收到了一条来自 " + sendUser.getNickname() + " 评论! ：<a style=\"color:#18a689;\" href=\"article.do?method=detail&aid=" + comment.getAid() + "#comments\" target=\"_blank\" >点击查看</a>";
                            SysMsg sysMsg = new SysMsg(author.getUid(), message, new Date().getTime(), 0);
                            sendSystemMessage(sysMsg);
                            // mail
                            String emailContent = formatContent(author.getNickname(), "<b>\"" + sendUser.getNickname() + "\"</b> 对你的文章 <b>\"" + article.getTitle() + "\"</b> 发表了一条评论！", "<a href='" + Config.get(ConfigConstants.SITE_ADDR) + "/article.do?method=detail&aid=" + comment.getAid() + "#comments' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在个人中心设置页设置。");
                            sendEmail(author.getEmail(), "你的文章 \"" + article.getTitle() + "\" " + sendUser.getNickname() + " 发表了评论~", emailContent);
                        }
                    } else if (comment.getParentid() > 0) {
                        // 如果是回复的评论，则给replyUser发送一封邮件
                        User replyUser = cache.getUser(comment.getReplyuid(), Cache.READ);
                        // WebSocket
                        WsMessage wsMessage = new WsMessage("receive_comment", "\"" + sendUser.getNickname() + "\" 回复了你的评论！");
                        comment.setUser(cache.cloneSafetyUser(sendUser));
                        wsMessage.setMetadata("comment", comment);
                        wsMessage.setMetadata("article", article);
                        if (!pushWsMessage(replyUser, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                            // 发送系统通知
                            String message = replyUser.getNickname() + "你好，<b>\"" + sendUser.getNickname() + "\"</b> 回复了你的评论! ：<a style=\"color:#18a689;\" href=\"article.do?method=detail&aid=" + comment.getAid() + "#comments\" target=\"_blank\" >点击查看</a>";
                            SysMsg sysMsg = new SysMsg(replyUser.getUid(), message, new Date().getTime(), 0);
                            sendSystemMessage(sysMsg);
                            // 邮件
                            String emailContent = formatContent(replyUser.getNickname(), "<b>\"" + sendUser.getNickname() + "\"</b> 回复了你在 <b>\"" + article.getTitle() + "\"</b> 的评论！", "<a href='" + Config.get(ConfigConstants.SITE_ADDR) + "/article.do?method=detail&aid=" + comment.getAid() + "#comments' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在个人中心设置页设置。");
                            sendEmail(replyUser.getEmail(), "\"" + sendUser.getNickname() + "\" 回复了你的评论！", emailContent);
                        }
                    }
                }
            }
        });
    }

    /**
     * 新的关注者提醒通知
     *
     * @param user
     * @param fan
     */
    public void theNewFollower(final User user, final User fan, final boolean isFriend) {
        executorPool.execute(new Runnable() {
            @Override
            public void run() {
                Thread.currentThread().setName("Thread-NotifyServicePool-theNewFollower");
                // WebSocket
                WsMessage wsMessage = new WsMessage("new_follower", "用户 " + fan.getNickname() + " 关注了你~");
                wsMessage.setMetadata("user", cache.cloneSafetyUser(fan));
                wsMessage.setMetadata("isFriend", isFriend);
                if (!pushWsMessage(user, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                    // 系统通知
                    String message = user.getNickname() + "你好，有新的用户关注了你：<a style=\"color:#18a689;\" href=\"user.do?method=home&uid=" + fan.getUid() + "\" target=\"_blank\" >" + fan.getNickname() + "</a>" + (isFriend ? "，由于相互关注你们成为了好友。" : "");
                    SysMsg sysMsg = new SysMsg(user.getUid(), message, new Date().getTime(), 0);
                    sendSystemMessage(sysMsg);
                    // 邮件
                    String emailContent = formatContent(user.getNickname(), "以下用户刚刚关注了你", "<a href='" + Config.get(ConfigConstants.SITE_ADDR) + "/user.do?method=home&uid=" + fan.getUid() + "' target='_blank' style='text-decoration:none;' >" + fan.getNickname() + "</a>" + (isFriend ? "，由于相互关注你们成为了好友。" : ""), "如果不想再接收此类消息可以在个人中心设置页设置。");
                    sendEmail(user.getEmail(), "有新的用户 " + fan.getNickname() + " 关注了你！", emailContent);
                }
            }
        });
    }

    /**
     * 新文章发布，推送给关注者通知
     *
     * @param article
     */
    public void postNewArticleToFollower(Article article) {
        executorPool.execute(new Runnable() {
            @Override
            public void run() {
                Thread.currentThread().setName("Thread-NotifyServicePool-postNewArticleToFollower");
            }
        });
    }

    /**
     * 被用户收藏
     *
     * @param article
     */
    @Override
    public void collectedByUser(User user, Article article) {
        executorPool.execute(new Runnable() {
            @Override
            public void run() {
                Thread.currentThread().setName("Thread-NotifyServicePool-collectedByUser");
                Article article_cache = cache.getArticle(article.getAid(), Cache.READ);
                // WebSocket
                WsMessage wsMessage = new WsMessage("new_article_collected", "用户 " + user.getNickname() + " 收藏了你的文章 " + article_cache.getTitle() + "~");
                wsMessage.setMetadata("user", cache.cloneSafetyUser(user));
                wsMessage.setMetadata("article", article_cache);
                if (!pushWsMessage(article_cache.getAuthor(), wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                    //系统通知
                    String message = article_cache.getAuthor().getNickname() + "你好，有以下用户收藏了你的文章（" + article_cache.getTitle() + "）：<a style=\"color:#18a689;\" href=\"user.do?method=home&uid=" + user.getUid() + "\" target=\"_blank\" >" + user.getNickname() + "</a>";
                    SysMsg sysMsg = new SysMsg(article_cache.getAuthor().getUid(), message, new Date().getTime(), 0);
                    sendSystemMessage(sysMsg);
                }
            }
        });
    }

    /**
     * 手动发送邮件
     *
     * @param toMail
     * @param subject
     * @param content
     * @return
     */
    public boolean sendEmail(String toMail, String subject, String content) {
        String CFG_SMTP = Config.get(ConfigConstants.EMAILPUSH_SMTP_ADDR);
        String SSL_PORT = Config.get(ConfigConstants.EMAILPUSH_SMTP_PORT);
        String SEND_USER = Config.get(ConfigConstants.EMAILPUSH_ACCOUNT_ADDR);
        String SEND_PASSWORD = Config.get(ConfigConstants.EMAILPUSH_ACCOUNT_PASSWORD);
        String NICK = Config.get(ConfigConstants.EMAILPUSH_ACCOUNT_NICKNAME);
        return EmailUtil.sendProcess(CFG_SMTP, SSL_PORT, NICK, SEND_USER, SEND_PASSWORD, toMail, null, subject, content, null);
    }

    /**
     * 手动发送系统消息
     *
     * @param sysMsg
     * @return flag - 200：成功，500: 失败
     */
    public int sendSystemMessage(SysMsg sysMsg) {
        return siteDao.saveSystemMessage(sysMsg) > 0 ? 200 : 500;
    }

    /**
     * 清除系统消息未读状态
     *
     * @param smIdList
     * @return flag - 200：成功，404：未影响到行，500: 失败
     */
    public int updateSystemMessageStatus(List<Integer> smIdList) {
        return convertRowToHttpCode(siteDao.updateSystemMessageStatus(smIdList));

    }

    private String formatContent(String username, String startMsg, String code, String endMsg) {
        String content = "<style type='text/css'>@media screen and (max-width:525px){.qmbox table[class=responsive-table]{width:100%!important}.qmbox td[class=padding]{padding:30px 8% 35px 8%!important}.qmbox td[class=padding2]{padding:30px 4% 10px 4%!important;text-align:left}}@media all and (-webkit-min-device-pixel-ratio:1.5){.qmbox body[yahoo] .zhwd-high-res-img-wrap{background-size:contain;background-position:center;background-repeat:no-repeat}.qmbox body[yahoo] .zhwd-high-res-img-wrap img{display:none!important}.qmbox body[yahoo] .zhwd-high-res-img-wrap.zhwd-zhihu-logo{width:71px;height:54px}}</style><table border='0' cellpadding='0' cellspacing='0' width='100%'><tbody><tr><td bgcolor='#f7f9fa' align='center' style='padding:22px 0 20px 0' class='responsive-table'><table border='0' cellpadding='0' cellspacing='0' style='background-color:f7f9fa;border-radius:3px;border:1px solid #dedede;margin:0 auto;background-color:#fff' width='552' class='responsive-table'><tbody><tr><td bgcolor='#0373d6' "
                + "height='54' align='center' style='border-top-left-radius:3px;border-top-right-radius:3px'><table border='0' cellpadding='0' cellspacing='0' width='100%'><tbody><tr><td align='center' class='zhwd-high-res-img-wrap zhwd-zhihu-logo'><a href='" + Config.get(ConfigConstants.SITE_ADDR) + "' target='_blank' style='text-decoration:none'><b><h1 style='margin:0 auto;color:#fff;font-family:Open Sans'>imcoder.site</h1></b></a></td></tr></tbody></table></td></tr><tr><td bgcolor='#ffffff' align='center' style='padding:0 15px 0 15px'><table border='0' cellpadding='0' cellspacing='0' width='480' class='responsive-table'><tbody><tr><td><table width='100%' border='0' cellpadding='0' cellspacing='0'><tbody><tr><td><table cellpadding='0' cellspacing='0' border='0' align='left' class='responsive-table'><tbody><tr><td width='550' align='left' valign='top'><table width='100%' border='0' cellpadding='0' cellspacing='0'><tbody><tr><td bgcolor='#ffffff' align='left' style='background-color:#fff;font-size:17px;color:#7b7b7b;padding:28px 0 0 0;line-height:25px'><b>"
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

    private int convertRowToHttpCode(int row) {
        int httpCode = 200;
        if (row == 0) {
            httpCode = 404;
        } else if (row == -1) {
            httpCode = 500;
        }
        return httpCode;
    }

    /* ---------------------------*-----WebSocket----*---------------------------- */

    @Override
    public void afterConnectionEstablished(WebSocketSession webSocketSession) throws Exception {
        User loginUser = getLoginUser(webSocketSession);
        if (loginUser != null) {
            userSessions.add(webSocketSession);
            logger.debug("ws: user " + loginUser.getUid() + " hand shake connection successfully~");
        } else {
            logger.warn("ws: hand shake connection, but not login~");
        }
    }

    @Override
    public void handleMessage(WebSocketSession webSocketSession, WebSocketMessage<?> webSocketMessage) throws Exception {
        try {
            User loginUser = getLoginUser(webSocketSession);
            String jsonText = (String) webSocketMessage.getPayload();
            if (Utils.isEmpty(jsonText)) {
                return;
            }
            ObjectMapper mapper = new ObjectMapper();
            // objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            WsMessage wsMessage = mapper.readValue(jsonText, WsMessage.class);
            wsMessage.setUser(loginUser);   // 该请求的用户
            if (loginUser != null) {
                if (Utils.isBlank(wsMessage.getMapping())) {
                    return;
                }
                // 运行该mapping对应的注册的回调
                List<Callable<WsMessage, WsMessage>> callables = onMessageCalls.get(wsMessage.getMapping());
                if (callables != null && callables.size() > 0) {
                    for (Callable<WsMessage, WsMessage> callback : callables) {
                        WsMessage replyMessage = callback.call(wsMessage);
                        if (replyMessage != null) { // 如果回调返回了消息，则输出给客户端
                            pushMsMessage(webSocketSession, replyMessage.makeTextMessage());
                        }
                    }
                }
                // 运行注册的全局回调（任何消息都响应）
                List<Callable<WsMessage, WsMessage>> globalCallables = onMessageCalls.get(GLOBAL_WS_CALLBACK);
                if (globalCallables != null && globalCallables.size() > 0) {
                    for (Callable<WsMessage, WsMessage> callback : globalCallables) {
                        WsMessage replyMessage = callback.call(wsMessage);
                        if (replyMessage != null) { // 如果回调返回了消息，则输出给客户端
                            pushMsMessage(webSocketSession, replyMessage.makeTextMessage());
                        }
                    }
                }
            } else {
                logger.warn("ws: client send message, but not login~");
                WsMessage forbidMessage = new WsMessage("forbidden");   // 没有登录，禁止连接
                pushMsMessage(webSocketSession, forbidMessage.makeTextMessage());
            }
        } catch (Exception e) {
            logger.error("ws: handle client message find exception: " + e);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession webSocketSession, Throwable throwable) throws Exception {
        logger.error("ws: find exception: " + throwable);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession webSocketSession, CloseStatus closeStatus) throws Exception {
        User loginUser = getLoginUser(webSocketSession);
        if (loginUser != null) {
            logger.debug("ws: user " + loginUser.getUid() + " close connection~");
        } else {
            logger.warn("ws: close connection, but not login~");
        }
        userSessions.remove(webSocketSession);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    private User getLoginUser(WebSocketSession webSocketSession) {
        if (webSocketSession != null && webSocketSession.getAttributes() != null) {
            return (User) (webSocketSession.getAttributes().get(Constants.LOGIN_USER_KEY));
        } else {
            return null;
        }
    }

    private void pushMsMessage(WebSocketSession webSocketSession, TextMessage textMessage) {
        if (webSocketSession != null) {
            if (logger.isDebugEnabled()) {
                logger.debug("ws: push message, content is " + textMessage);
            }
            try {
                webSocketSession.sendMessage(textMessage);
            } catch (IOException e) {
                logger.error("ws: push message fail, find exception: " + e);
            }
        }
    }

    /**
     * 向一位已登录的用户推送消息
     *
     * @param user
     * @param wsMessage
     * @return boolean 是否发送成功，既该用户是否登录
     */
    public boolean pushWsMessage(User user, WsMessage wsMessage) {
        boolean isFind = false;
        for (WebSocketSession webSocketSession : userSessions) {
            User loginUser = getLoginUser(webSocketSession);
            if (loginUser != null && loginUser.getUid() == user.getUid()) {
                isFind = true;
                pushMsMessage(webSocketSession, wsMessage.makeTextMessage());
            }
        }
        if (logger.isDebugEnabled() && !isFind) {
            logger.debug("ws: push message break, not find session~");
        }
        return isFind;
    }

    /**
     * 向一批已登录的用户推送消息
     *
     * @param users
     * @param wsMessage
     */
    public void pushWsMessage(List<User> users, WsMessage wsMessage) {
        if (users != null) {
            users.forEach((user -> pushWsMessage(user, wsMessage)));
        }
    }

    /**
     * 向所有已登录的用户推送消息
     *
     * @param wsMessage
     */
    public void pushWsMessageToAll(WsMessage wsMessage) {
        TextMessage textMessage = wsMessage.makeTextMessage();
        for (WebSocketSession webSocketSession : userSessions) {
            pushMsMessage(webSocketSession, textMessage);
        }
    }

    /**
     * 注册在接收到用户的消息后触发的回调方法，全局回调（任何消息都响应）
     * 回到方法中，入参为接收到的消息，回参为返回的消息
     *
     * @param callback
     */
    public void onmessage(Callable<WsMessage, WsMessage> callback) {
        if (onMessageCalls == null) {
            onMessageCalls = new HashMap<>();
        }
        if (!onMessageCalls.containsKey(GLOBAL_WS_CALLBACK)) {
            onMessageCalls.put(GLOBAL_WS_CALLBACK, new ArrayList<>());
        }
        onMessageCalls.get(GLOBAL_WS_CALLBACK).add(callback);
    }

    /**
     * 注册在接收到用户的消息后触发的回调方法，只响应mapping对应的回调方法
     * 回到方法中，入参为接收到的消息，回参为返回的消息
     *
     * @param mapping  mapping名，收到消息时，对应的mapping将响应
     * @param callback
     */
    public void onmessage(String mapping, Callable<WsMessage, WsMessage> callback) {
        if (onMessageCalls == null) {
            onMessageCalls = new HashMap<>();
        }
        if (!onMessageCalls.containsKey(mapping)) {
            onMessageCalls.put(mapping, new ArrayList<>());
        }
        onMessageCalls.get(mapping).add(callback);
    }

}
