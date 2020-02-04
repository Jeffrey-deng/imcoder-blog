package site.imcoder.blog.service.impl;

import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Service;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.Callable;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.CommentType;
import site.imcoder.blog.dao.IMessageDao;
import site.imcoder.blog.dao.IUserDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.event.IEventTrigger;
import site.imcoder.blog.service.*;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.util.Date;
import java.util.List;
import java.util.Random;

/**
 * @author Jeffrey.Deng
 * @date 2016-10-27
 */
@Service("messageService")
@DependsOn({"configManager"})
public class MessageServiceImpl extends BaseService implements IMessageService {

    //依赖注入DAO
    @Resource
    private IMessageDao messageDao;

    @Resource
    private IUserDao userDao;

    @Resource
    private IAlbumService albumService;

    @Resource
    private IVideoService videoService;

    @Resource
    private INotifyService notifyService;

    @Resource
    private IAuthService authService;

    @Resource
    private Cache cache;

    @Resource
    private IEventTrigger trigger;

    private List<String> userDefaultManHeadPhotos;  //  默认的男生用户头像列表

    private List<String> userDefaultMissHeadPhotos; // 默认的女生用户头像列表

    @PostConstruct
    public void init() {
        // 获取设置的默认用户头像
        userDefaultManHeadPhotos = Config.getList(ConfigConstants.USER_DEFAULT_HEADPHOTOS_MAN, String.class);
        userDefaultMissHeadPhotos = Config.getList(ConfigConstants.USER_DEFAULT_HEADPHOTOS_MISS, String.class);
        // 注册用户打开页面的注册信息时间，
        // 判断：如果这个页面是用户这次访问本站打开的第一个页面，则推送未读消息提醒
        notifyService.onmessage("register_page_meta", new Callable<WsMessage, WsMessage>() {
            @Override
            public WsMessage call(WsMessage wsMessage) throws Exception {
                if (wsMessage.isHasLoggedIn()) {
                    User loginUser = wsMessage.getUser();
                    List<Object> userAllTabSessions = notifyService.getUserAllPushSessions(loginUser);
                    if (userAllTabSessions.size() == 1) {
                        WsMessage pushWsMessage = new WsMessage("unread_message_notify");
                        IRequest iRequest = new IRequest(loginUser);
                        List<Letter> letterList = findLetterList(0, iRequest).getAttr("letters");
                        List<SysMsg> sysMsgList = findSysMsgList(0, iRequest).getAttr("sysMsgs");
                        pushWsMessage.setMetadata("letters", letterList);
                        pushWsMessage.setMetadata("sysMsgs", sysMsgList);
                        pushWsMessage.setText("未读消息提醒：未读私信 " + letterList.size() + " 条，未读系统消息 " + sysMsgList.size() + " 条。");
                        return pushWsMessage;
                    }
                }
                return null;
            }
        });
    }

    /**
     * 发送私信
     *
     * @param letter
     * @param iRequest
     * @return IResponse:
     * status - 200：发送成功，401：需要登录，500: 失败
     * letter: 私信对象
     */
    @Override
    public IResponse sendLetter(Letter letter, IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (letter == null || letter.getContent() == null || !IdUtil.containValue(letter.getR_uid())) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else if (cache.getUser(letter.getR_uid(), Cache.READ) == null) {
            response.setStatus(STATUS_PARAM_ERROR, "无此用户: " + letter.getR_uid());
        } else {
            // letter.setLeid(IdUtil.generatePrimaryKey()); // 主键
            letter.setS_uid(iRequest.getLoginUser().getUid());
            letter.setSend_time(System.currentTimeMillis());
            int row = messageDao.saveLetter(letter);
            if (row > 0) {
                User receiveUser = cache.cloneSafetyUser(new User(letter.getR_uid()));
                letter.setChatUser(receiveUser);
                response.putAttr("letter", letter);
                // 收到私信通知
                // 构建一个新对象是因为，notifyService.receivedLetter中会修改chatUser
                // 而这里返回的chatUser应该是发送者的资料
                // userDao.findLetter查出的chatUser为发送人的资料
                notifyService.receivedLetter(messageDao.findLetter(letter));
            }
            response.setStatus(row > 0 ? STATUS_SUCCESS : STATUS_SERVER_ERROR);
        }
        return response;
    }

    /**
     * 删除私信
     *
     * @param letter
     * @param iRequest
     * @return IResponse:
     * status - 200：删除成功，401：需要登录，404: 无此私信，500: 失败
     */
    @Override
    public IResponse deleteLetter(Letter letter, IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        } else if (letter == null || !IdUtil.containValue(letter.getLeid())) {
            return response.setStatus(STATUS_PARAM_ERROR, "输入私信id");
        }
        User loginUser = iRequest.getLoginUser();
        Letter dbLetter = messageDao.findLetter(letter);
        if (dbLetter == null) {
            response.setStatus(STATUS_NOT_FOUND, "该私信不存在~");
        } else if (dbLetter.getS_uid().equals(loginUser.getUid()) || dbLetter.getR_uid().equals(loginUser.getUid())) {
            int row = messageDao.deleteLetter(letter);
            if (row > 0) {
                if (dbLetter.getS_uid().equals(loginUser.getUid())) { // 发送者删除的消息，则给接收者发送撤回通知，在接收端撤回该消息
                    notifyService.executeByAsync(() -> {
                        dbLetter.setContent(null); // 置空
                        notifyService.pushWsMessage(
                                new User(dbLetter.getR_uid()),
                                new WsMessage("withdraw_letter").setMetadata("letter", dbLetter).setMetadata("user", dbLetter.getChatUser())
                        );
                    });
                    response.setStatus(STATUS_SUCCESS, "已删除并撤回私信~");
                } else {
                    response.setStatus(STATUS_SUCCESS, "已删除私信~");
                }
            } else {
                response.setStatus(STATUS_SERVER_ERROR);
            }
        } else {
            response.setStatus(STATUS_FORBIDDEN);
        }
        return response;
    }

    /**
     * 清除私信消息未读状态
     *
     * @param leIdList 私信id列表, 只能清除别人发送的，自己发送的不能清除, 既loginUser.uid为r_uid
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，404：这些私信本来就已读或不存在，500: 失败
     */
    @Override
    public IResponse updateLetterListStatus(List<Integer> leIdList, IRequest iRequest) {
        IResponse response = new IResponse();
        if (leIdList == null) {
            return response.setStatus(STATUS_PARAM_ERROR);
        } else if (leIdList.size() > 0) {
            return response.setStatus(convertRowToHttpCode(messageDao.updateLetterStatus(leIdList, iRequest.getLoginUser())));
        } else {
            return response.setStatus(STATUS_NOT_FOUND, "这些私信本来就已读或不存在~");
        }
    }

    /**
     * 查询私信列表
     *
     * @param read_status 0 未读 1全部
     * @param iRequest
     * @return IResponse:
     * letters - 私信列表
     */
    @Override
    public IResponse findLetterList(int read_status, IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        } else {
            return response.putAttr("letters", messageDao.findLetterList(iRequest.getLoginUser(), read_status)).setStatus(STATUS_SUCCESS);
        }
    }

    /**
     * 得到评论列表
     *
     * @param comment  - 传入mainId和mainType
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，500: 失败
     * comments - 评论列表
     */
    @Override
    public IResponse findCommentList(Comment comment, IRequest iRequest) {
        iRequest.putAttr("loadAccessRecord", false);
        IResponse response = new IResponse();
        if (comment == null || !IdUtil.containValue(comment.getMainId())) {
            return response.setStatus(STATUS_PARAM_ERROR, "需要mainId");
        }
        // 根据评论主体类型mainType进行分别操作
        CommentType commentType = CommentType.valueOf(comment.getMainType());
        switch (commentType) {
            case ARTICLE:   // 文章
                Article cacheArticle = cache.getArticle(comment.getMainId(), Cache.READ);
                response.setStatus(authService.validateUserPermissionUtil(cacheArticle.getAuthor(), cacheArticle.getPermission(), iRequest));
                break;
            case PHOTO: // 照片
                response.setStatus(albumService.findPhoto(new Photo(comment.getMainId()), iRequest));
                break;
            case VIDEO: // 视频
                response.setStatus(videoService.findVideo(new Video(comment.getMainId()), iRequest));
                break;
            case PHOTO_TOPIC: // 照片合集
                response.setStatus(albumService.findPhotoTagWrapper(new PhotoTagWrapper(comment.getMainId()), iRequest));
                break;
            default:
                response.setStatus(STATUS_PARAM_ERROR, "该mainType不支持~");
                break;
        }
        if (response.isSuccess()) {
            List<Comment> comments = messageDao.findCommentList(comment, iRequest.getLoginUser());
            if (comments != null) {
                for (Comment cmt : comments) {
                    if (cmt.typeOfAnonymous()) {
                        cmt.setUser(getAnonymousUser(cmt.getUser()));
                    }
                }
            }
            response.putAttr("comments", comments);
        }
        return response;
    }

    /**
     * 添加评论
     *
     * @param comment
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，500: 失败
     * comment 对象
     */
    @Override
    public IResponse addComment(Comment comment, IRequest iRequest) {
        iRequest.putAttr("loadActionRecord", false);
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        } else if (comment == null || !IdUtil.containValue(comment.getMainId()) || comment.getContent() == null) {
            return response.setStatus(STATUS_PARAM_ERROR);
        }
        // 根据评论主体类型mainType进行分别操作
        CommentType commentType = CommentType.valueOf(comment.getMainType());
        Object mainTypeCreation = null;
        Long mainCreationHostUserId = 0L;
        switch (commentType) {
            case ARTICLE:   // 文章
                Article cacheArticle = cache.getArticle(comment.getMainId(), Cache.READ);
                response.setStatus(authService.validateUserPermissionUtil(cacheArticle.getAuthor(), cacheArticle.getPermission(), iRequest));
                if (response.isSuccess()) {
                    mainTypeCreation = cacheArticle;
                    mainCreationHostUserId = cacheArticle.getAuthor().getUid();
                }
                break;
            case PHOTO: // 照片
                IResponse photoResp = albumService.findPhoto(new Photo(comment.getMainId()), iRequest);
                response.setStatus(photoResp);
                if (photoResp.isSuccess()) {
                    mainTypeCreation = photoResp.getAttr("photo");
                    mainCreationHostUserId = ((Photo) mainTypeCreation).getUid();
                }
                break;
            case VIDEO: // 视频
                IResponse videoResp = videoService.findVideo(new Video(comment.getMainId()), iRequest);
                response.setStatus(videoResp);
                if (videoResp.isSuccess()) {
                    mainTypeCreation = videoResp.getAttr("video");
                    mainCreationHostUserId = ((Video) mainTypeCreation).getUser().getUid();
                }
                break;
            case PHOTO_TOPIC: // 照片合集
                IResponse tagWrapperResp = albumService.findPhotoTagWrapper(new PhotoTagWrapper(comment.getMainId()), iRequest);
                response.setStatus(tagWrapperResp);
                if (tagWrapperResp.isSuccess()) {
                    mainTypeCreation = tagWrapperResp.getAttr("tagWrapper");
                    mainCreationHostUserId = ((PhotoTagWrapper) mainTypeCreation).getUid();
                }
                break;
            default:
                response.setStatus(STATUS_PARAM_ERROR, "该mainType不支持~");
                break;
        }
        Comment parentComment = null;
        if (response.isSuccess()) {
            comment.setCid(IdUtil.generatePrimaryKey()); // 主键
            Long replyUid = 0L;
            if (IdUtil.containValue(comment.getParentId())) {    // 查到replyUid，防止父评论为匿名用户发送
                parentComment = messageDao.findComment(new Comment(comment.getParentId(), comment.getMainType()));
                if (parentComment == null) {
                    response.setStatus(STATUS_NOT_FOUND, "你回复的评论不存在~");
                } else if (parentComment.getMainType() != comment.getMainType()) {
                    response.setStatus(STATUS_PARAM_ERROR, "父评论mainType与当前comment不相同~");
                } else {
                    replyUid = parentComment.getUser().getUid();
                }
            } else {
                replyUid = mainCreationHostUserId;
            }
            if (response.isSuccess()) {
                comment.setUser(iRequest.getLoginUser());
                comment.setSend_time(new Date().getTime());
                int index = messageDao.saveComment(comment);
                if (index > 0) {
                    // 匿名发送去除资料
                    if (comment.typeOfAnonymous()) {
                        comment.setUser(getAnonymousUser(comment.getUser()));
                    }
                    // 触发发送新评论通知
                    notifyService.receivedComment(comment, replyUid, mainTypeCreation);
                }
                response.setStatus(convertRowToHttpCode(index));
            }
        }
        if (response.isSuccess()) {
            trigger.addComment(comment, mainTypeCreation);
            response.putAttr("comment", comment);
        }
        return response;
    }

    /**
     * 删除评论
     *
     * @param comment
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     * type - 1: 因为存在被引用故填充为‘已删除’, 2: 完全删除~
     */
    @Override
    public IResponse deleteComment(Comment comment, IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        } else if (comment == null || !IdUtil.containValue(comment.getCid())) {
            return response.setStatus(STATUS_PARAM_ERROR);
        }
        User loginUser = iRequest.getLoginUser();
        comment.setUser(loginUser);
        Comment db_comment = messageDao.findComment(comment);
        if (db_comment == null) {
            response.setStatus(STATUS_NOT_FOUND, "该评论不存在~");
        } else if (db_comment.getUser().getUid().equals(loginUser.getUid()) || loginUser.getUserGroup().isManager()) {
            int index = messageDao.deleteComment(comment);
            if (index == 2) {
                trigger.deleteComment(db_comment, null); // 减少评论数
                response.setStatus(STATUS_SUCCESS, "已删除评论~").putAttr("type", 2);
            } else if (index == 1) {
                response.setStatus(STATUS_SUCCESS, "已将评论清空，填充为‘已删除’~").putAttr("type", 1);
            } else if (index == 0) {
                response.setStatus(STATUS_NOT_FOUND, "该评论不存在~");
            } else {
                response.setStatus(STATUS_SERVER_ERROR);
            }
        } else {
            response.setStatus(STATUS_FORBIDDEN);
        }
        return response;
    }

    /**
     * 点赞评论
     *
     * @param comment  - 只需传cid
     * @param undo     - 是否取消赞
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    @Override
    public IResponse likeComment(Comment comment, boolean undo, IRequest iRequest) {
        IResponse response = new IResponse();
        if (comment == null || !IdUtil.containValue(comment.getCid())) {
            return response.setStatus(STATUS_PARAM_ERROR);
        } else {
            Comment db_comment = messageDao.findComment(comment);
            if (db_comment != null) {
                Boolean saveLikeValue = null;
                ActionRecord<Comment> actionRecord = new ActionRecord<>();
                actionRecord.setCreation(comment);
                if (iRequest.isHasLoggedIn()) {
                    actionRecord.setUser(iRequest.getLoginUser());
                } else {
                    actionRecord.setIp(iRequest.getAccessIp());
                }
                ActionRecord<Comment> lastActionRecord = userDao.findCommentActionRecord(actionRecord);
                if (!undo) {    // 赞
                    if (lastActionRecord != null && lastActionRecord.getLiked() != null && lastActionRecord.getLiked()) {
                        response.setMessage("你已经赞过该评论了~");
                    } else {
                        saveLikeValue = true;
                    }
                } else {    // 取消赞
                    if (lastActionRecord != null && lastActionRecord.getLiked() != null && lastActionRecord.getLiked()) {
                        saveLikeValue = false;
                    } else {
                        response.setMessage("你并没有赞过该评论~");
                    }
                }
                if (saveLikeValue != null) {
                    if (lastActionRecord != null) {
                        actionRecord.setAr_id(lastActionRecord.getAr_id());
                    }
                    actionRecord.setLiked(saveLikeValue);
                    response.setStatus(convertRowToHttpCode(userDao.saveCommentActionRecord(actionRecord)));
                    if (response.isSuccess()) {
                        response.putAttr("type", 1);
                        if (saveLikeValue) {
                            db_comment.setLike_count(db_comment.getLike_count() + 1);
                        } else {
                            db_comment.setLike_count(db_comment.getLike_count() > 0 ? db_comment.getLike_count() - 1 : 0);
                        }
                        messageDao.updateCommentLikeCount(comment, saveLikeValue ? 1 : -1);
                    }
                } else {
                    response.putAttr("type", 0);
                }
                comment.setLike_count(db_comment.getLike_count());
                response.putAttr("comment", comment); // 没验证就不能返回内容，防止空手套白狼
            } else {
                response.setStatus(STATUS_NOT_FOUND, "该评论不存在~");
            }
        }
        return response;
    }

    /**
     * 查询用户对评论的动作记录
     *
     * @param comment
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * commentActionRecords
     * comment_action_record_count
     */
    @Override
    public IResponse findCommentActionRecordList(Comment comment, IRequest iRequest) {
        IResponse response = new IResponse();
        if (comment == null || !IdUtil.containValue(comment.getCid())) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else {
            Comment db_comment = messageDao.findComment(comment);
            if (db_comment != null) {
                if (db_comment.getUser().getUid().equals(iRequest.getLoginUser().getUid())) {
                    ActionRecord<Comment> queryActionRecord = new ActionRecord<>();
                    queryActionRecord.setCreation(new Comment(comment.getCid()));
                    // 只返回赞的
                    queryActionRecord.setLiked(true);
                    List<ActionRecord<Comment>> commentActionRecordList = userDao.findCommentActionRecordList(queryActionRecord, iRequest.getLoginUser());
                    response.putAttr("commentActionRecords", commentActionRecordList);
                    response.putAttr("comment_action_record_count", commentActionRecordList.size());
                    response.putAttr("comment", db_comment);
                } else {
                    response.setStatus(STATUS_FORBIDDEN, "访问记录只能作者本人查看~");
                }
            } else {
                response.setStatus(STATUS_NOT_FOUND, "该评论不存在~");
            }
        }
        return response;
    }

    private String getRandomUserHeadPhoto(List<String> headPhotos) {
        if (headPhotos.size() == 1) {
            return headPhotos.get(0);
        } else {
            Random random = new Random();
            return headPhotos.get(random.nextInt(headPhotos.size()));
        }
    }

    /**
     * 创建一个匿名用户
     *
     * @return
     */
    private User getAnonymousUser(User user) {
        User anonymousUser = new User(0L, "匿名用户");
        if (user != null && user.getSex() != null && user.getSex().equals("男")) {
            anonymousUser.setHead_photo(getRandomUserHeadPhoto(userDefaultManHeadPhotos));
        } else {
            anonymousUser.setHead_photo(getRandomUserHeadPhoto(userDefaultMissHeadPhotos));
        }
        return anonymousUser;
    }

    /**
     * 手动发送系统消息, 只能由后台服务发，前台不能发
     *
     * @param sysMsg
     * @return IResponse:
     * status - 200：成功，400: 参数错误，500: 失败
     */
    @Override
    public IResponse sendSystemMessage(SysMsg sysMsg) {
        IResponse response = new IResponse();
        if (sysMsg != null && sysMsg.getContent() != null) {
            response.setStatus(messageDao.saveSystemMessage(sysMsg) > 0 ? STATUS_SUCCESS : STATUS_SERVER_ERROR);
        } else {
            response.setStatus(STATUS_PARAM_ERROR);
        }
        return response;
    }

    /**
     * 查询系统消息列表
     *
     * @param read_status 0 未读 1全部
     * @param iRequest
     * @return IResponse:
     * sysMsgs - 统消息列表
     */
    @Override
    public IResponse findSysMsgList(int read_status, IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            return response.setStatus(STATUS_NOT_LOGIN);
        } else {
            return response.putAttr("sysMsgs", messageDao.findSysMsgList(iRequest.getLoginUser(), read_status)).setStatus(STATUS_SUCCESS);
        }
    }

    /**
     * 清除系统消息未读状态
     *
     * @param smIdList
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，404：这些系统消息本来就已读或不存在，500: 失败
     */
    @Override
    public IResponse updateSystemMessageListStatus(List<Long> smIdList, IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (smIdList != null && smIdList.size() > 0) {
            int row = messageDao.updateSystemMessageStatus(smIdList, iRequest.getLoginUser());
            response.setStatus(convertRowToHttpCode(row));
            if (response.equalsStatus(STATUS_NOT_FOUND)) {
                response.setMessage("这些系统消息本来就已读或不存在~");
            }
        }
        return response;
    }

    /**
     * 删除系统消息
     *
     * @param smIdList
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，404：这些系统消息不存在~，500: 失败
     */
    @Override
    public IResponse deleteSystemMessageList(List<Long> smIdList, IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (smIdList == null) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else if (smIdList.size() > 0) {
            int row = messageDao.deleteSystemMessage(smIdList, iRequest.getLoginUser());
            response.setStatus(convertRowToHttpCode(row));
            if (response.equalsStatus(STATUS_NOT_FOUND)) {
                response.setMessage("这些系统消息不存在~");
            }
        }
        return response;
    }

}
