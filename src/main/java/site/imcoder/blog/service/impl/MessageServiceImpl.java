package site.imcoder.blog.service.impl;

import org.springframework.stereotype.Service;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.type.CommentType;
import site.imcoder.blog.dao.IMessageDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.event.IEventTrigger;
import site.imcoder.blog.service.IAlbumService;
import site.imcoder.blog.service.IMessageService;
import site.imcoder.blog.service.INotifyService;
import site.imcoder.blog.service.IVideoService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import java.util.*;

/**
 * @author Jeffrey.Deng
 * @date 2016-10-27
 */
@Service("messageService")
public class MessageServiceImpl implements IMessageService {

    //依赖注入DAO
    @Resource
    private IMessageDao messageDao;

    @Resource
    private IAlbumService albumService;

    @Resource
    private IVideoService videoService;

    @Resource
    private INotifyService notifyService;

    @Resource
    private Cache cache;

    /**
     * 事件触发器
     */
    @Resource
    private IEventTrigger trigger;

    private List<String> userDefaultManHeadPhotos;  //  默认的男生用户头像列表

    private List<String> userDefaultMissHeadPhotos; // 默认的女生用户头像列表

    public MessageServiceImpl() {
        userDefaultManHeadPhotos = Config.getList(ConfigConstants.USER_DEFAULT_MAN_HEADPHOTOS, String.class);
        userDefaultMissHeadPhotos = Config.getList(ConfigConstants.USER_DEFAULT_MISS_HEADPHOTOS, String.class);
    }

    /**
     * 发送私信
     *
     * @param letter
     * @param loginUser
     * @return flag - 200：发送成功，401：需要登录，500: 失败
     * letter: 私信对象
     */
    @Override
    public Map<String, Object> sendLetter(Letter letter, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        int flag = 200;
        if (loginUser == null || loginUser.getUid() == 0) {
            flag = 401;
        } else if (letter == null || letter.getContent() == null || letter.getR_uid() == 0) {
            flag = 400;
        } else {
            letter.setS_uid(loginUser.getUid());
            int row = messageDao.saveLetter(letter);
            if (row > 0) {
                User receiveUser = cache.cloneSafetyUser(new User(letter.getR_uid()));
                letter.setChatUser(receiveUser);
                map.put("letter", letter);
                //收到私信通知
                // 构建一个新对象是因为，notifyService.receivedLetter中会修改chatUser
                // 而这里返回的chatUser应该是发送者的资料
                // userDao.findLetter查出的chatUser为发送人的资料
                notifyService.receivedLetter(messageDao.findLetter(letter));
            }
            flag = row > 0 ? 200 : 500;
        }
        map.put("flag", flag);
        return map;
    }

    /**
     * 删除私信
     *
     * @param letter
     * @param loginUser
     * @return flag - 200：发送成功，401：需要登录，404: 无此私信，500: 失败
     */
    @Override
    public int deleteLetter(Letter letter, User loginUser) {
        if (loginUser == null) {
            return 401;
        } else if (letter == null || letter.getLeid() == 0) {
            return 400;
        }
        Letter dbLetter = messageDao.findLetter(letter);
        if (dbLetter == null) {
            return 404;
        } else if (dbLetter.getS_uid() == loginUser.getUid() || dbLetter.getR_uid() == loginUser.getUid()) {
            int row = messageDao.deleteLetter(letter);
            if (row > 0 && dbLetter.getS_uid() == loginUser.getUid()) { // 发送者删除的消息，则给接收者发送撤回通知，在接收端撤回该消息
                new Thread(() -> {
                    dbLetter.setContent(null); // 置空
                    notifyService.pushWsMessage(
                            new User(dbLetter.getR_uid()),
                            new WsMessage("withdraw_letter").setMetadata("letter", dbLetter).setMetadata("user", dbLetter.getChatUser())
                    );
                }).start();
            }
            return row > 0 ? 200 : 500;
        } else {
            return 403;
        }
    }

    /**
     * 清除私信消息未读状态
     *
     * @param leIdList  私信id列表, 只能清除别人发送的，自己发送的不能清除, 既loginUser.uid为r_uid
     * @param loginUser
     * @return flag - 200：成功，404：未影响到行，500: 失败
     */
    @Override
    public int updateLetterListStatus(List<Integer> leIdList, User loginUser) {
        if (leIdList != null && leIdList.size() > 0) {
            return convertRowToHttpCode(messageDao.updateLetterStatus(leIdList, loginUser));
        } else {
            return 404;
        }
    }

    /**
     * 查询私信列表
     *
     * @param loginUser
     * @param read_status 0 未读 1全部
     * @return
     */
    @Override
    public List<Letter> findLetterList(User loginUser, int read_status) {
        if (loginUser == null || loginUser.getUid() == 0) {
            return null;
        } else {
            return messageDao.findLetterList(loginUser, read_status);
        }
    }

    /**
     * 得到评论列表
     *
     * @param comment   - 传入mainId和mainType
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，500: 失败
     * comments - 评论列表
     */
    @Override
    public Map<String, Object> findCommentList(Comment comment, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        int flag = 200;
        if (comment == null || comment.getMainId() == 0) {
            flag = 400;
        }
        if (!isRight(flag)) {
            map.put("flag", flag);
            return map;
        }
        // 根据评论主体类型mainType进行分别操作
        CommentType commentType = CommentType.valueOfName(comment.getMainType());
        switch (commentType) {
            case ARTICLE:   // 文章
                flag = checkUserHasPermission(cache.getArticle(comment.getMainId(), Cache.READ), loginUser);
                break;
            case PHOTO: // 照片
                flag = (int) albumService.findPhoto(new Photo(comment.getMainId()), loginUser).get("flag");
                break;
            case VIDEO: // 视频
                flag = (int) videoService.findVideo(new Video(comment.getMainId()), loginUser).get("flag");
                break;
            default:
                flag = 400;
                break;
        }
        if (flag == 200) {
            List<Comment> comments = messageDao.findCommentList(comment);
            if (comments != null) {
                for (Comment cmt : comments) {
                    if (cmt.typeOfAnonymous()) {
                        cmt.setUser(getAnonymousUser(cmt.getUser()));
                    }
                }
            }
            map.put("comments", comments);
        }
        map.put("flag", flag);
        return map;
    }

    /**
     * 添加评论
     *
     * @param comment
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，500: 失败
     * comment 对象
     */
    @Override
    public Map<String, Object> addComment(Comment comment, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        int flag = 200;
        if (loginUser == null) {
            flag = 401;
        } else if (comment == null || comment.getMainId() == 0 || comment.getContent() == null) {
            flag = 400;
        }
        if (!isRight(flag)) {
            map.put("flag", flag);
            return map;
        }
        // 根据评论主体类型mainType进行分别操作
        CommentType commentType = CommentType.valueOfName(comment.getMainType());
        Object mainTypeObject = null;
        int mainObjectHostUserId = 0;
        switch (commentType) {
            case ARTICLE:   // 文章
                Article article = cache.getArticle(comment.getMainId(), Cache.READ);
                flag = checkUserHasPermission(article, loginUser);
                if (flag == 200) {
                    mainTypeObject = article;
                    mainObjectHostUserId = article.getAuthor().getUid();
                }
                break;
            case PHOTO: // 照片
                Map<String, Object> photoQuery = albumService.findPhoto(new Photo(comment.getMainId()), loginUser);
                flag = (int) photoQuery.get("flag");
                if (flag == 200) {
                    mainTypeObject = photoQuery.get("photo");
                    mainObjectHostUserId = ((Photo) photoQuery.get("photo")).getUid();
                }
                break;
            case VIDEO: // 视频
                Map<String, Object> videoQuery = videoService.findVideo(new Video(comment.getMainId()), loginUser);
                flag = (int) videoQuery.get("flag");
                if (flag == 200) {
                    mainTypeObject = videoQuery.get("video");
                    mainObjectHostUserId = ((Video) videoQuery.get("video")).getUser().getUid();
                }
                break;
            default:
                flag = 400;
                break;
        }
        Comment parentComment = null;
        if (isRight(flag)) {
            int replyUid = 0;
            if (comment.getParentId() > 0) {    // 插到replyUid，防止父评论为匿名用户发送
                parentComment = messageDao.findComment(new Comment(comment.getParentId(), comment.getMainType()));
                if (parentComment == null || parentComment.getMainType() != comment.getMainType()) {
                    flag = 400;
                } else {
                    replyUid = parentComment.getUser().getUid();
                }
            } else {
                replyUid = mainObjectHostUserId;
            }
            if (isRight(flag)) {
                comment.setUser(loginUser);
                comment.setSend_time(new Date().getTime());
                int index = messageDao.saveComment(comment);
                if (index > 0) {
                    // 匿名发送去除资料
                    if (comment.typeOfAnonymous()) {
                        comment.setUser(getAnonymousUser(comment.getUser()));
                    }
                    // 触发发送新评论通知
                    notifyService.receivedComment(comment, replyUid, mainTypeObject);
                }
                flag = convertRowToHttpCode(index);
            }
        }
        if (isRight(flag)) {
            switch (commentType) {
                case ARTICLE:   // 文章
                    // 增加评论数
                    //articleDao.raiseCommentCnt(comment);
                    trigger.addComment(comment);
                    break;
                case PHOTO: // 照片

                    break;
                case VIDEO: // 视频

                    break;
                default:
            }
            map.put("comment", comment);
        }
        map.put("flag", flag);
        return map;
    }

    /**
     * 删除评论
     *
     * @param comment
     * @param loginUser
     * @return flag - 200：成功，201：填充为‘已删除’，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    @Override
    public int deleteComment(Comment comment, User loginUser) {
        if (loginUser == null) {
            return 401;
        } else if (comment == null || comment.getCid() == 0) {
            return 400;
        } else {
            comment.setUser(loginUser);
        }
        Comment db_comment = messageDao.findComment(comment);
        if (db_comment == null) {
            return 404;
        }
        if (db_comment.getUser().getUid() == loginUser.getUid() || loginUser.getUserGroup().isManager()) {
            int index = messageDao.deleteComment(comment);
            if (index == 2) {
                //减少评论数
                //articleDao.reduceCommentCnt(comment);
                trigger.deleteComment(db_comment);
                return 200;
            } else if (index == 1) {
                return 201;
            } else if (index == 0) {
                return 404;
            } else {
                return 500;
            }
        } else {
            return 403;
        }
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
        User anonymousUser = new User(0, "匿名用户");
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
     * @return flag - 200：成功，500: 失败
     */
    @Override
    public int sendSystemMessage(SysMsg sysMsg) {
        if (sysMsg != null && sysMsg.getContent() != null) {
            return messageDao.saveSystemMessage(sysMsg) > 0 ? 200 : 500;
        } else {
            return 400;
        }
    }

    /**
     * 查询系统消息列表
     *
     * @param loginUser
     * @param read_status 0 未读 1全部
     * @return
     */
    @Override
    public List<SysMsg> findSysMsgList(User loginUser, int read_status) {
        if (loginUser == null || loginUser.getUid() == 0) {
            return null;
        } else {
            return messageDao.findSysMsgList(loginUser, read_status);
        }
    }

    /**
     * 清除系统消息未读状态
     *
     * @param smIdList
     * @param loginUser
     * @return flag - 200：成功，404：未影响到行，500: 失败
     */
    @Override
    public int updateSystemMessageListStatus(List<Integer> smIdList, User loginUser) {
        if (smIdList != null && smIdList.size() > 0) {
            return convertRowToHttpCode(messageDao.updateSystemMessageStatus(smIdList, loginUser));
        } else {
            return 404;
        }
    }

    /**
     * 删除系统消息
     *
     * @param smIdList
     * @param loginUser
     * @return flag - 200：成功，404：未影响到行，500: 失败
     */
    @Override
    public int deleteSystemMessageList(List<Integer> smIdList, User loginUser) {
        if (smIdList != null && smIdList.size() > 0) {
            return convertRowToHttpCode(messageDao.deleteSystemMessage(smIdList, loginUser));
        } else {
            return 404;
        }
    }

    // 检查该用户是否对该文章有查看权限
    private int checkUserHasPermission(Article article, User loginUser) {
        int flag = 200;
        // 文章为空时info返回404
        if (article != null) {
            // 需要权限
            int permission = article.getPermission();
            if (permission > 0) {
                // 需要权限却没登录直接返回401
                if (loginUser != null) {
                    //权限--仅好友可见时
                    if (permission == 1 && article.getAuthor().getUid() != loginUser.getUid()) {
                        // userDao.checkFriendRelationship(new Friend(loginUser.getUid(),article.getAuthor().getUid()));
                        if (cache.containsFriend(new Friend(loginUser.getUid(), article.getAuthor().getUid())) != 2) {
                            flag = 403;
                        }
                        // 权限--为私有时
                    } else if (permission == 2) {
                        if (article.getAuthor().getUid() != loginUser.getUid()) {
                            flag = 403;
                        }
                    }
                } else {
                    flag = 401;
                }
            }
        } else {
            flag = 404;
        }
        return flag;
    }

    private boolean isRight(int flag) {
        return flag == 200;
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
