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
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.mail.EmailUtil;
import site.imcoder.blog.common.type.CommentType;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.service.BaseService;
import site.imcoder.blog.service.IMessageService;
import site.imcoder.blog.service.INotifyService;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;
import site.imcoder.blog.setting.GlobalConstants;

import javax.annotation.PreDestroy;
import javax.annotation.Resource;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.*;

/**
 * 消息服务，仅能内部调用，不提供controller调用
 */
@Component("notifyService")
@Scope("singleton")
@DependsOn({"configManager"})
public class NotifyServiceImpl extends BaseService implements INotifyService, WebSocketHandler {

    private static Logger logger = Logger.getLogger(NotifyServiceImpl.class);

    private ExecutorService executorPool; // 线程池，线程数由conf中EMAILPUSH_THREAD_NUM参数配置

    private Set<WebSocketSession> userSessions; // 存储所有WebSocketSession

    private Map<String, List<Callable<WsMessage, WsMessage>>> onMessageCalls;   // 存储所有注册的回调方法，key为mapping, value为该mapping的对应的回调方法list

    private static final String GLOBAL_WS_CALLBACK = "global_ws_callback";  // 全局事件（所有消息都响应）的KEY

    private static boolean RUN_OFFLINE_NOTIFY_WHEN_ONLINE = false; // 用户在线时是否运行离线通知，true: 同时运行，false: 当用户在线时，不执行其他方式通知

    @Resource
    private Cache cache;

    @Resource
    private IMessageService messageService;

    /**
     * 类实例化配置参数
     */
    public NotifyServiceImpl() {
        executorPool = Executors.newFixedThreadPool(Config.getInt(ConfigConstants.NOTIFYSERVICE_THREAD_NUM));
        RUN_OFFLINE_NOTIFY_WHEN_ONLINE = Config.getBoolean(ConfigConstants.RUN_OFFLINE_NOTIFY_WHEN_ONLINE);
        if (userSessions == null) {
            // new ConcurrentHashMap<>();
            userSessions = ConcurrentHashMap.newKeySet();
        }
        if (onMessageCalls == null) {
            // 这个map没有线程安全问题，因为不会修改
            onMessageCalls = new HashMap<>();
        }
        final WsMessage pongWs = new WsMessage("pong");
        // 注册心跳连接事件
        onmessage("ping", new Callable<WsMessage, WsMessage>() {
            @Override
            public WsMessage call(WsMessage wsMessage) throws Exception {
                boolean isPageActive = false;
                if ("active".equals(wsMessage.getText())) {
                    isPageActive = true;
                }
                Map<String, Object> attributes = wsMessage.getWebSocketSession().getAttributes();
                if (attributes != null) {
                    Map<String, Object> page_meta = (Map<String, Object>) attributes.get("page_meta");
                    if (page_meta != null) {
                        page_meta.put("active", isPageActive);
                    }
                }
                return pongWs;
            }
        });
        // 注册用户打开页面的信息
        onmessage("register_page_meta", new Callable<WsMessage, WsMessage>() {
            @Override
            public WsMessage call(WsMessage wsMessage) throws Exception {
                WebSocketSession webSocketSession = wsMessage.getWebSocketSession();
                Map<String, Object> attributes = webSocketSession.getAttributes();
                if (attributes != null) {
                    Map<String, Object> page_meta = new HashMap();
                    page_meta.put("id", wsMessage.getMetadata("id"));
                    page_meta.put("title", wsMessage.getMetadata("title"));
                    page_meta.put("link", wsMessage.getMetadata("link"));
                    page_meta.put("open_time", Utils.formatDate(new Date(), "yyyy-MM-dd HH:mm:ss"));
                    page_meta.put("platform", wsMessage.getMetadata("platform"));
                    page_meta.put("active", wsMessage.getMetadata("active"));
                    String ip = webSocketSession.getRemoteAddress().getHostString();
                    page_meta.put("ip", ip);
                    if (wsMessage.isHasLoggedIn()) {
                        User loginUser = wsMessage.getUser();
                        page_meta.put("user", new User(loginUser.getUid(), loginUser.getNickname()));
                    } else {
                        page_meta.put("user", new User(0L, "游客（" + ip + "）"));
                    }
                    attributes.put("page_meta", page_meta);
                }
                return null;
            }
        });
        // 标签之间传送数据接口，不包含发送消息的标签
        onmessage("transfer_data_in_tabs", new Callable<WsMessage, WsMessage>() {
            @Override
            public WsMessage call(WsMessage wsMessage) throws Exception {
                if (wsMessage.isHasLoggedIn()) {
                    User loginUser = wsMessage.getUser();
                    // 如果只转发给特定标签
                    List<Long> specialTabIds = (List<Long>) wsMessage.getMetadata("tabIds");
                    int hasSendCount = 0;
                    TextMessage textMessage = wsMessage.makeTextMessage();
                    for (WebSocketSession webSocketSession : userSessions) {
                        User u = getWsSessionLoginUser(webSocketSession);
                        if (u != null && loginUser.getUid().equals(u.getUid()) && webSocketSession != wsMessage.getWebSocketSession()) {
                            if (specialTabIds != null) {
                                Map<String, Object> page_meta = (Map<String, Object>) webSocketSession.getAttributes().get("page_meta");
                                if (page_meta != null) {
                                    for (Long specialTabId : specialTabIds) {
                                        if (specialTabId.equals(page_meta.get("id"))) {
                                            pushMsMessage(webSocketSession, textMessage);
                                            if (++hasSendCount == specialTabIds.size()) {
                                                break;
                                            }
                                        }
                                    }
                                }
                            } else {
                                pushMsMessage(webSocketSession, textMessage);
                            }
                        }
                    }
                }
                return null;
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
     * 异步运行
     *
     * @param command
     */
    @Override
    public void executeByAsync(Runnable command) {
        executorPool.execute(command);
    }

    /**
     * 发送验证码
     *
     * @param user
     * @return validateCode 验证码
     */
    @Override
    public String sendValidateCode(final User user) {
        final String code = Utils.getValidateCode();
        String emailContent = formatContent(user.getNickname(), "此次帐号信息变更需要的验证码如下，请在 30 分钟内输入验证码进行下一步操作。", code, "如果非你本人操作，你的帐号可能存在安全风险，请立即 <a href='" + fillUrl("u/center/account") + "' style='text-decoration:none;color:#259;border:none;outline:none;' target='_blank'>修改密码</a>。");
        boolean success = sendEmail(user.getEmail(), "博客验证码： " + code, emailContent);
        return success ? code : null;
    }

    /**
     * 新用户欢迎通知
     *
     * @param user
     */
    @Override
    public void welcomeNewUser(final User user) {
        executorPool.execute(new Runnable() {
            @Override
            public void run() {
                Thread.currentThread().setName("Thread-NotifyServicePool-welcomeNewUser");
                List<User> managers = cache.getManagers();
                String managerUrl = "u/center/sendLetter";
                if (managers != null && managers.size() > 0) {
                    managerUrl += ("?chatuid=" + managers.get(0).getUid());
                }
                String emailContent = formatContent(user.getNickname(), "博客注册成功！此邮箱用来接收未读消息，修改密码等，有任何问题请直接回复此邮件。", "<a href='" + fillUrl(getUserHomePageUrl(user.getUid())) + "' target='_blank' style='text-decoration:none;' >Welcome</a>", "如果不想再接收此类消息可以在<a target=\"_blank\" href=\"" + fillUrl(getUserSettingPageUrl()) + "\" style=\"text-decoration:none;\">个人中心设置页</a>设置。<br>联系我：<a href='" + fillUrl(managerUrl) + "' style='text-decoration:none;color:#259;border:none;outline:none;'>站内信</a>");
                sendEmail(user.getEmail(), user.getNickname() + " ，博客注册成功！ - ", emailContent);
            }
        });
    }

    /**
     * 通知管理员新用户
     *
     * @param managers
     * @param newUser
     */
    @Override
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
                    String emailContent = formatContent(manager.getNickname(), "有新的用户注册博客", "<a href='" + fillUrl(getUserHomePageUrl(newUser.getUid())) + "' target='_blank' style='text-decoration:none;' >" + newUser.getNickname() + "</a>", "如果不想再接收此类消息可以在<a target=\"_blank\" href=\"" + fillUrl(getUserSettingPageUrl()) + "\" style=\"text-decoration:none;\">个人中心设置页</a>设置。");
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
    @Override
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
                String main_url = "u/center/sendLetter?chatuid=" + sendUser.getUid();
                if (!pushWsMessage(user, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                    if (user.getUserSetting().isEnableReceiveNotifyEmail()) {
                        // mail
                        String emailContent = formatContent(user.getNickname(), "你有一条新私信！ 来自 <b>\"" + sendUser.getNickname() + "\"</b>", "<a href='" + fillUrl(main_url) + "' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在<a target=\"_blank\" href=\"" + fillUrl(getUserSettingPageUrl()) + "\" style=\"text-decoration:none;\">个人中心设置页</a>设置。");
                        sendEmail(user.getEmail(), "你有一条新私信！来自" + sendUser.getNickname(), emailContent);
                    }
                }
            }
        });
    }

    /**
     * 收到评论提醒通知
     *
     * @param comment
     * @param replyUid 父类评论的用户id(parentId为0时设置主体对象的作者id)
     * @param creation 评论主体的对象（article?photo?video?）
     */
    @Override
    public void receivedComment(Comment comment, Long replyUid, Object creation) {
        executorPool.execute(new Runnable() {
            @Override
            public void run() {
                Thread.currentThread().setName("Thread-NotifyServicePool-receivedComment");
                User sendUser = null;
                if (!comment.typeOfAnonymous()) {
                    sendUser = cache.cloneSafetyUser(comment.getUser());
                    comment.setUser(sendUser);
                } else {
                    sendUser = comment.getUser();
                }
                // 自己给自己回复则不发信，发的匿名信则都发送
                // 由于Parentid=0时，replyuid会被设置为作者id 所以只需要此判断足以
                if (comment.typeOfAnonymous() || (!sendUser.getUid().equals(replyUid))) {
                    // 接收通知的对象
                    User replyUser = cache.getUser(replyUid, Cache.READ);
                    // 根据评论主体类型mainType进行分别操作
                    CommentType commentType = CommentType.valueOf(comment.getCreationType());
                    WsMessage wsMessage = null;
                    String creation_link = null;
                    switch (commentType) {
                        case ARTICLE:   // 文章
                            Article article = (Article) creation;
                            wsMessage = new WsMessage("receive_comment");
                            wsMessage.setMetadata("comment", comment);
                            wsMessage.setMetadata("article", article);
                            creation_link = "a/detail/" + IdUtil.convertToShortPrimaryKey(comment.getCreationId()) + "#comment_" + comment.getCid();
                            // 如果评论是直接回复文章 且 给文章作者发送一封信
                            if (!IdUtil.containValue(comment.getParentId())) {
                                // WebSocket
                                wsMessage.setText("你的文章 \"" + article.getTitle() + "\" " + sendUser.getNickname() + " 发表了评论~");
                                if (!pushWsMessage(replyUser, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                                    // 发送系统通知
                                    String message = replyUser.getNickname() + "你好，你收到了一条来自 " + sendUser.getNickname() + " 评论！：<a style=\"color:#18a689;\" href=\"" + creation_link + "\" target=\"_blank\" >点击查看</a>";
                                    SysMsg sysMsg = new SysMsg(replyUser.getUid(), message, new Date().getTime(), 0);
                                    sendSystemMessage(sysMsg);
                                    // mail
                                    if (replyUser.getUserSetting().isEnableReceiveNotifyEmail()) {
                                        String emailContent = formatContent(replyUser.getNickname(), "<b>\"" + sendUser.getNickname() + "\"</b> 对你的文章 <b>\"" + article.getTitle() + "\"</b> 发表了一条评论！", "<a href='" + fillUrl(creation_link) + "' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在<a target=\"_blank\" href=\"" + fillUrl(getUserSettingPageUrl()) + "\" style=\"text-decoration:none;\">个人中心设置页</a>设置。");
                                        sendEmail(replyUser.getEmail(), "你的文章 \"" + article.getTitle() + "\" " + sendUser.getNickname() + " 发表了评论~", emailContent);
                                    }
                                }
                            } else {
                                // 如果是回复的评论，则给replyUser发送一封邮件
                                // WebSocket
                                wsMessage.setText("\"" + sendUser.getNickname() + "\" 回复了你的评论！");
                                if (!pushWsMessage(replyUser, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                                    // 发送系统通知
                                    String message = replyUser.getNickname() + "你好，<b>\"" + sendUser.getNickname() + "\"</b> 回复了你的评论！：<a style=\"color:#18a689;\" href=\"" + creation_link + "\" target=\"_blank\" >点击查看</a>";
                                    SysMsg sysMsg = new SysMsg(replyUser.getUid(), message, new Date().getTime(), 0);
                                    sendSystemMessage(sysMsg);
                                    // 邮件
                                    if (replyUser.getUserSetting().isEnableReceiveNotifyEmail()) {
                                        String emailContent = formatContent(replyUser.getNickname(), "<b>\"" + sendUser.getNickname() + "\"</b> 回复了你在 <b>\"" + article.getTitle() + "\"</b> 的评论！", "<a href='" + fillUrl(creation_link) + "' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在<a target=\"_blank\" href=\"" + fillUrl(getUserSettingPageUrl()) + "\" style=\"text-decoration:none;\">个人中心设置页</a>设置。");
                                        sendEmail(replyUser.getEmail(), "\"" + sendUser.getNickname() + "\" 回复了你的评论！", emailContent);
                                    }
                                }
                            }
                            break;
                        case PHOTO: // 照片
                            Photo photo = (Photo) creation;
                            wsMessage = new WsMessage("receive_comment");
                            wsMessage.setMetadata("comment", comment);
                            wsMessage.setMetadata("photo", photo);
                            creation_link = "p/detail/" + IdUtil.convertToShortPrimaryKey(comment.getCreationId()) + "#comment_" + comment.getCid();
                            if (!IdUtil.containValue(comment.getParentId())) {
                                // WebSocket
                                wsMessage.setText("你的照片 \"" + photo.getPhoto_id() + "\" " + sendUser.getNickname() + " 发表了评论~");
                                if (!pushWsMessage(replyUser, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                                    // 发送系统通知
                                    String message = replyUser.getNickname() + "你好，你收到了一条来自 " + sendUser.getNickname() + " 评论！：<a style=\"color:#18a689;\" href=\"" + creation_link + "\" target=\"_blank\" >点击查看</a>";
                                    SysMsg sysMsg = new SysMsg(replyUser.getUid(), message, new Date().getTime(), 0);
                                    sendSystemMessage(sysMsg);
                                    // mail
                                    if (replyUser.getUserSetting().isEnableReceiveNotifyEmail()) {
                                        String emailContent = formatContent(replyUser.getNickname(), "<b>\"" + sendUser.getNickname() + "\"</b> 对你的照片 <b>\"" + photo.getPhoto_id() + "\"</b> 发表了一条评论！", "<a href='" + fillUrl(creation_link) + "' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在<a target=\"_blank\" href=\"" + fillUrl(getUserSettingPageUrl()) + "\" style=\"text-decoration:none;\">个人中心设置页</a>设置。");
                                        sendEmail(replyUser.getEmail(), "你的照片 \"" + photo.getPhoto_id() + "\" " + sendUser.getNickname() + " 发表了评论~", emailContent);
                                    }
                                }
                            } else {
                                // WebSocket
                                wsMessage.setText("\"" + sendUser.getNickname() + "\" 回复了你的评论！");
                                if (!pushWsMessage(replyUser, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                                    // 发送系统通知
                                    String message = replyUser.getNickname() + "你好，<b>\"" + sendUser.getNickname() + "\"</b> 回复了你的评论！：<a style=\"color:#18a689;\" href=\"" + creation_link + "\" target=\"_blank\" >点击查看</a>";
                                    SysMsg sysMsg = new SysMsg(replyUser.getUid(), message, new Date().getTime(), 0);
                                    sendSystemMessage(sysMsg);
                                    // 邮件
                                    if (replyUser.getUserSetting().isEnableReceiveNotifyEmail()) {
                                        String emailContent = formatContent(replyUser.getNickname(), "<b>\"" + sendUser.getNickname() + "\"</b> 回复了你的评论！", "<a href='" + fillUrl(creation_link) + "' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在<a target=\"_blank\" href=\"" + fillUrl(getUserSettingPageUrl()) + "\" style=\"text-decoration:none;\">个人中心设置页</a>设置。");
                                        sendEmail(replyUser.getEmail(), "\"" + sendUser.getNickname() + "\" 回复了你的评论！", emailContent);
                                    }
                                }
                            }
                            break;
                        case VIDEO: // 视频
                            Video video = (Video) creation;
                            wsMessage = new WsMessage("receive_comment");
                            wsMessage.setMetadata("comment", comment);
                            wsMessage.setMetadata("video", video);
                            creation_link = "video/detail/" + IdUtil.convertToShortPrimaryKey(comment.getCreationId()) + "#comment_" + comment.getCid();
                            if (!IdUtil.containValue(comment.getParentId())) {
                                // WebSocket
                                wsMessage.setText("你的视频 \"" + video.getVideo_id() + "\" " + sendUser.getNickname() + " 发表了评论~");
                                if (!pushWsMessage(replyUser, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                                    // 发送系统通知
                                    String message = replyUser.getNickname() + "你好，你收到了一条来自 " + sendUser.getNickname() + " 评论！：<a style=\"color:#18a689;\" href=\"" + creation_link + "\" target=\"_blank\" >点击查看</a>";
                                    SysMsg sysMsg = new SysMsg(replyUser.getUid(), message, new Date().getTime(), 0);
                                    sendSystemMessage(sysMsg);
                                    // mail
                                    if (replyUser.getUserSetting().isEnableReceiveNotifyEmail()) {
                                        String emailContent = formatContent(replyUser.getNickname(), "<b>\"" + sendUser.getNickname() + "\"</b> 对你的视频 <b>\"" + video.getVideo_id() + "\"</b> 发表了一条评论！", "<a href='" + fillUrl(creation_link) + "' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在<a target=\"_blank\" href=\"" + fillUrl(getUserSettingPageUrl()) + "\" style=\"text-decoration:none;\">个人中心设置页</a>设置。");
                                        sendEmail(replyUser.getEmail(), "你的视频 \"" + video.getVideo_id() + "\" " + sendUser.getNickname() + " 发表了评论~", emailContent);
                                    }
                                }
                            } else {
                                // WebSocket
                                wsMessage.setText("\"" + sendUser.getNickname() + "\" 回复了你的评论！");
                                if (!pushWsMessage(replyUser, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                                    // 发送系统通知
                                    String message = replyUser.getNickname() + "你好，<b>\"" + sendUser.getNickname() + "\"</b> 回复了你的评论！：<a style=\"color:#18a689;\" href=\"" + creation_link + "\" target=\"_blank\" >点击查看</a>";
                                    SysMsg sysMsg = new SysMsg(replyUser.getUid(), message, new Date().getTime(), 0);
                                    sendSystemMessage(sysMsg);
                                    // 邮件
                                    if (replyUser.getUserSetting().isEnableReceiveNotifyEmail()) {
                                        String emailContent = formatContent(replyUser.getNickname(), "<b>\"" + sendUser.getNickname() + "\"</b> 回复了你的评论！", "<a href='" + fillUrl(creation_link) + "' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在<a target=\"_blank\" href=\"" + fillUrl(getUserSettingPageUrl()) + "\" style=\"text-decoration:none;\">个人中心设置页</a>设置。");
                                        sendEmail(replyUser.getEmail(), "\"" + sendUser.getNickname() + "\" 回复了你的评论！", emailContent);
                                    }
                                }
                            }
                            break;
                        case AlBUM: // 相册
                            Album album = (Album) creation;
                            wsMessage = new WsMessage("receive_comment");
                            wsMessage.setMetadata("comment", comment);
                            wsMessage.setMetadata("album", album);
                            creation_link = "p/album/" + IdUtil.convertToShortPrimaryKey(comment.getCreationId()) + "#comment_" + comment.getCid();
                            if (!IdUtil.containValue(comment.getParentId())) {
                                // WebSocket
                                wsMessage.setText("你的相册 \"" + album.getName() + "\" " + sendUser.getNickname() + " 发表了评论~");
                                if (!pushWsMessage(replyUser, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                                    // 发送系统通知
                                    String message = replyUser.getNickname() + "你好，你收到了一条来自 " + sendUser.getNickname() + " 评论！：<a style=\"color:#18a689;\" href=\"" + creation_link + "\" target=\"_blank\" >点击查看</a>";
                                    SysMsg sysMsg = new SysMsg(replyUser.getUid(), message, new Date().getTime(), 0);
                                    sendSystemMessage(sysMsg);
                                    // mail
                                    if (replyUser.getUserSetting().isEnableReceiveNotifyEmail()) {
                                        String emailContent = formatContent(replyUser.getNickname(), "<b>\"" + sendUser.getNickname() + "\"</b> 对你的相册 <b>\"" + album.getName() + "\"</b> 发表了一条评论！", "<a href='" + fillUrl(creation_link) + "' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在<a target=\"_blank\" href=\"" + fillUrl(getUserSettingPageUrl()) + "\" style=\"text-decoration:none;\">个人中心设置页</a>设置。");
                                        sendEmail(replyUser.getEmail(), "你的相册 \"" + album.getName() + "\" " + sendUser.getNickname() + " 发表了评论~", emailContent);
                                    }
                                }
                            } else {
                                // WebSocket
                                wsMessage.setText("\"" + sendUser.getNickname() + "\" 回复了你的评论！");
                                if (!pushWsMessage(replyUser, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                                    // 发送系统通知
                                    String message = replyUser.getNickname() + "你好，<b>\"" + sendUser.getNickname() + "\"</b> 回复了你的评论！：<a style=\"color:#18a689;\" href=\"" + creation_link + "\" target=\"_blank\" >点击查看</a>";
                                    SysMsg sysMsg = new SysMsg(replyUser.getUid(), message, new Date().getTime(), 0);
                                    sendSystemMessage(sysMsg);
                                    // 邮件
                                    if (replyUser.getUserSetting().isEnableReceiveNotifyEmail()) {
                                        String emailContent = formatContent(replyUser.getNickname(), "<b>\"" + sendUser.getNickname() + "\"</b> 回复了你的评论！", "<a href='" + fillUrl(creation_link) + "' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在<a target=\"_blank\" href=\"" + fillUrl(getUserSettingPageUrl()) + "\" style=\"text-decoration:none;\">个人中心设置页</a>设置。");
                                        sendEmail(replyUser.getEmail(), "\"" + sendUser.getNickname() + "\" 回复了你的评论！", emailContent);
                                    }
                                }
                            }
                            break;
                        case PHOTO_TOPIC: // 照片合集
                            PhotoTagWrapper tagWrapper = (PhotoTagWrapper) creation;
                            wsMessage = new WsMessage("receive_comment");
                            wsMessage.setMetadata("comment", comment);
                            wsMessage.setMetadata("tagWrapper", tagWrapper);
                            if (tagWrapper.getTopic() == 0) {
                                creation_link = "p/tag/" + Utils.encodeURL(tagWrapper.getName()) + "?uid=" + tagWrapper.getUid() + "#comment_" + comment.getCid();
                            } else {
                                creation_link = "p/topic/" + IdUtil.convertToShortPrimaryKey(tagWrapper.getPtwid()) + "#comment_" + comment.getCid();
                            }
                            if (!IdUtil.containValue(comment.getParentId())) {
                                // WebSocket
                                wsMessage.setText("你的照片合集 \"" + tagWrapper.getName() + "\" " + sendUser.getNickname() + " 发表了评论~");
                                if (!pushWsMessage(replyUser, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                                    // 发送系统通知
                                    String message = replyUser.getNickname() + "你好，你收到了一条来自 " + sendUser.getNickname() + " 评论！：<a style=\"color:#18a689;\" href=\"" + creation_link + "\" target=\"_blank\" >点击查看</a>";
                                    SysMsg sysMsg = new SysMsg(replyUser.getUid(), message, new Date().getTime(), 0);
                                    sendSystemMessage(sysMsg);
                                    // mail
                                    if (replyUser.getUserSetting().isEnableReceiveNotifyEmail()) {
                                        String emailContent = formatContent(replyUser.getNickname(), "<b>\"" + sendUser.getNickname() + "\"</b> 对你的照片合集 <b>\"" + tagWrapper.getName() + "\"</b> 发表了一条评论！", "<a href='" + fillUrl(creation_link) + "' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在<a target=\"_blank\" href=\"" + fillUrl(getUserSettingPageUrl()) + "\" style=\"text-decoration:none;\">个人中心设置页</a>设置。");
                                        sendEmail(replyUser.getEmail(), "你的照片合集 \"" + tagWrapper.getName() + "\" " + sendUser.getNickname() + " 发表了评论~", emailContent);
                                    }
                                }
                            } else {
                                // WebSocket
                                wsMessage.setText("\"" + sendUser.getNickname() + "\" 回复了你的评论！");
                                if (!pushWsMessage(replyUser, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                                    // 发送系统通知
                                    String message = replyUser.getNickname() + "你好，<b>\"" + sendUser.getNickname() + "\"</b> 回复了你的评论！：<a style=\"color:#18a689;\" href=\"" + creation_link + "\" target=\"_blank\" >点击查看</a>";
                                    SysMsg sysMsg = new SysMsg(replyUser.getUid(), message, new Date().getTime(), 0);
                                    sendSystemMessage(sysMsg);
                                    // 邮件
                                    if (replyUser.getUserSetting().isEnableReceiveNotifyEmail()) {
                                        String emailContent = formatContent(replyUser.getNickname(), "<b>\"" + sendUser.getNickname() + "\"</b> 回复了你的评论！", "<a href='" + fillUrl(creation_link) + "' target='_blank' style='text-decoration:none;' >点击此处查看</a>", "如果不想再接收此类消息可以在<a target=\"_blank\" href=\"" + fillUrl(getUserSettingPageUrl()) + "\" style=\"text-decoration:none;\">个人中心设置页</a>设置。");
                                        sendEmail(replyUser.getEmail(), "\"" + sendUser.getNickname() + "\" 回复了你的评论！", emailContent);
                                    }
                                }
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        });
    }

    /**
     * 新的关注者提醒通知
     *
     * @param hostUser
     * @param fan
     */
    @Override
    public void theNewFollower(final User hostUser, final User fan, final boolean isFriend) {
        executorPool.execute(new Runnable() {
            @Override
            public void run() {
                Thread.currentThread().setName("Thread-NotifyServicePool-theNewFollower");
                User user = cache.getUser(hostUser.getUid(), Cache.READ);
                // WebSocket
                WsMessage wsMessage = new WsMessage("new_follower", "用户 " + fan.getNickname() + " 关注了你~");
                wsMessage.setMetadata("user", cache.cloneSafetyUser(fan));
                wsMessage.setMetadata("isFriend", isFriend);
                if (!pushWsMessage(user, wsMessage) || RUN_OFFLINE_NOTIFY_WHEN_ONLINE) { // when not login
                    // 系统通知
                    String message = user.getNickname() + "你好，有新的用户关注了你：<a style=\"color:#18a689;\" href=\"" + getUserHomePageUrl(fan.getUid()) + "\" target=\"_blank\" >" + fan.getNickname() + "</a>" + (isFriend ? "，由于相互关注你们成为了好友。" : "");
                    SysMsg sysMsg = new SysMsg(user.getUid(), message, new Date().getTime(), 0);
                    sendSystemMessage(sysMsg);
                    // 邮件
                    if (user.getUserSetting().isEnableReceiveNotifyEmail()) {
                        String emailContent = formatContent(user.getNickname(), "以下用户刚刚关注了你", "<a href='" + fillUrl(getUserHomePageUrl(fan.getUid())) + "' target='_blank' style='text-decoration:none;' >" + fan.getNickname() + "</a>" + (isFriend ? "，由于相互关注你们成为了好友。" : ""), "如果不想再接收此类消息可以在<a target=\"_blank\" href=\"" + fillUrl(getUserSettingPageUrl()) + "\" style=\"text-decoration:none;\">个人中心设置页</a>设置。");
                        sendEmail(user.getEmail(), "有新的用户 " + fan.getNickname() + " 关注了你！", emailContent);
                    }
                }
            }
        });
    }

    /**
     * 新文章发布，推送给关注者通知
     *
     * @param article
     */
    @Override
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
                    String message = article_cache.getAuthor().getNickname() + "你好，有以下用户收藏了你的文章（" + article_cache.getTitle() + "）：<a style=\"color:#18a689;\" href=\"" + getUserHomePageUrl(user.getUid()) + "\" target=\"_blank\" >" + user.getNickname() + "</a>";
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
    @Override
    public boolean sendEmail(String toMail, String subject, String content) {
        Boolean enable = Config.getBoolean(ConfigConstants.EMAILPUSH_ENABLE);
        if (enable) {
            String CFG_SMTP = Config.get(ConfigConstants.EMAILPUSH_SMTP_ADDR);
            String SSL_PORT = Config.get(ConfigConstants.EMAILPUSH_SMTP_PORT);
            String SEND_USER = Config.get(ConfigConstants.EMAILPUSH_ACCOUNT_ADDR);
            String SEND_PASSWORD = Config.get(ConfigConstants.EMAILPUSH_ACCOUNT_PASSWORD);
            String NICK = Config.get(ConfigConstants.EMAILPUSH_ACCOUNT_NICKNAME);
            return EmailUtil.sendProcess(CFG_SMTP, SSL_PORT, NICK, SEND_USER, SEND_PASSWORD, toMail, null, subject, content, null);
        } else {
            logger.warn("邮件推送服务被设置为关闭，故此邮件未被发送：" + toMail);
            return false;
        }
    }

    /**
     * 手动发送系统消息, 只能由后台服务发，前台不能发
     *
     * @param sysMsg
     * @return IResponse:
     * status - 200：成功，400: 参数错误，500: 失败
     */
    private IResponse sendSystemMessage(SysMsg sysMsg) {
        return messageService.sendSystemMessage(sysMsg);
    }

    private String formatContent(String username, String startMsg, String code, String endMsg) {
        String content = "<table border='0' cellpadding='0' cellspacing='0' width='100%'><tbody><tr><td bgcolor='#f7f9fa' align='center' style='padding:22px 0 20px 0'><table border='0' cellpadding='0' cellspacing='0' style='border-radius:3px;border:1px solid #dedede;margin:0 auto;background-color:#fff' width='552'>" +
                "<tbody><tr><td bgcolor='#0373d6' height='54' align='center' style='border-top-left-radius:3px;border-top-right-radius:3px'><table border='0' cellpadding='0' cellspacing='0' width='100%'><tbody><tr>" +
                "<td align='center'><a class='mail-site-name' href='" + Config.get(ConfigConstants.SITE_ADDR) + "' style='text-decoration:none' target='_blank'><b><h1 style='margin:0 auto;color:#fff;font-family:Open Sans'>imcoder.site</h1></b></a></td></tr></tbody>" +
                "</table></td></tr><tr><td bgcolor='#ffffff' align='center' style='padding:0 15px 0 15px'><table width='480' border='0' cellpadding='0' cellspacing='0'><tbody><tr><td bgcolor='#ffffff' align='left' style='background-color:#fff;font-size:17px;color:#7b7b7b;padding:28px 0 0 0;line-height:25px'>" +
                "<b><span class='mail-to-user-name'>" + username + "</span>，你好，</b></td></tr><tr><td align='left' valign='top' style='font-size:14px;font-family:Hiragino Sans GB;color:#7b7b7b;line-height:25px;padding:20px 0 20px 0'>" +
                "<span class='mail-start-message'>" + startMsg + "</span></td></tr><tr><td align='center' style='border-bottom:1px #f1f4f6 solid;padding:0 0 25px 0'><table border='0' cellspacing='0' cellpadding='0'><tbody><tr><td>" +
                "<div style='display:inline-block;font-family: Hiragino Sans GB;padding:10px 18px 10px 18px;border-radius:3px;text-align:center;text-decoration:none;background-color:#ecf4fb;color:#4581e9;font-size:20px;font-weight:700;letter-spacing:2px;margin:0;white-space:nowrap'>" +
                "<span style='border-bottom:1px dashed #ccc' class='mail-content'>" + code + "</span></div>" +
                "</td></tr></tbody></table></td></tr><tr><td align='left' valign='top' style='font-size:14px;font-family:Hiragino Sans GB;color:#7b7b7b;line-height:25px;padding:20px 0 35px 0'>" +
                "<span class='mail-end-message'>" + endMsg + "</span></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table>";
        return content;
    }

    private String fillUrl(String url) {
        return Config.get(ConfigConstants.SITE_ADDR) + url;
    }

    private String getUserHomePageUrl(Long uid) {
        return "u/" + uid + "/home";
    }

    private String getUserSettingPageUrl() {
        return "u/center/settings";
    }

    /* ---------------------------*-----WebSocket----*---------------------------- */

    @Override
    public void afterConnectionEstablished(WebSocketSession webSocketSession) throws Exception {
        User loginUser = getWsSessionLoginUser(webSocketSession);
        if (loginUser != null) {
            if (logger.isDebugEnabled()) {
                logger.debug("ws: user " + loginUser.getUid() + " hand shake connection successfully~");
            }
        } else {
            if (logger.isDebugEnabled()) {
                logger.debug("ws: hand shake connection, but not login~");
            }
        }
        userSessions.add(webSocketSession);
    }

    @Override
    public void handleMessage(WebSocketSession webSocketSession, WebSocketMessage<?> webSocketMessage) throws Exception {
        try {
            User loginUser = getWsSessionLoginUser(webSocketSession);
            String jsonText = (String) webSocketMessage.getPayload();
            if (Utils.isEmpty(jsonText)) {
                return;
            }
            ObjectMapper mapper = new ObjectMapper();
            // mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            WsMessage wsMessage = mapper.readValue(jsonText, WsMessage.class);
            wsMessage.setUser(loginUser);   // 该请求的用户
            wsMessage.setWebSocketSession(webSocketSession);   // 该请求的WebSocketSession
            if (true || loginUser != null) {
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
        String info = throwable.toString();
        if (info != null && info.startsWith("java.io.EOFException")) {
            if (logger.isDebugEnabled()) {
                logger.warn("ws: find exception: " + info);
            }
        } else {
            logger.error("ws: find exception: " + info);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession webSocketSession, CloseStatus closeStatus) throws Exception {
        User loginUser = getWsSessionLoginUser(webSocketSession);
        if (loginUser != null) {
            if (logger.isDebugEnabled()) {
                logger.debug("ws: user " + loginUser.getUid() + " close connection~");
            }
        } else {
            if (logger.isDebugEnabled()) {
                logger.debug("ws: close connection, but not login~");
            }
        }
        userSessions.remove(webSocketSession);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    private User getWsSessionLoginUser(WebSocketSession webSocketSession) {
        if (webSocketSession != null && webSocketSession.getAttributes() != null) {
            // todo 准备修改成从 Cache 中获取，在session中只放标识identifier的uid
            return (User) (webSocketSession.getAttributes().get(GlobalConstants.KEY_LOGIN_USER));
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
        TextMessage textMessage = wsMessage.makeTextMessage();
        for (WebSocketSession webSocketSession : userSessions) {
            User loginUser = getWsSessionLoginUser(webSocketSession);
            if (loginUser != null && loginUser.getUid().equals(user.getUid())) {
                pushMsMessage(webSocketSession, textMessage);
                isFind = true;
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

    /**
     * 得到用户所有实时通信session
     *
     * @return
     */
    @Override
    public Set<WebSocketSession> getAllPushSessions() {
        return userSessions;
    }

    /**
     * 得到用户所有实时通信session
     *
     * @param user
     * @return
     */
    @Override
    public List<WebSocketSession> getUserAllPushSessions(User user) {
        List<WebSocketSession> list = new ArrayList<>();
        for (WebSocketSession webSocketSession : userSessions) {
            User loginUser = getWsSessionLoginUser(webSocketSession);
            if (loginUser != null && loginUser.getUid().equals(user.getUid())) {
                list.add(webSocketSession);
            }
        }
        return list;
    }

}
