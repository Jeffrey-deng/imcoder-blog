package site.imcoder.blog.service.impl;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.PageUtil;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.UserGroupType;
import site.imcoder.blog.dao.IArticleDao;
import site.imcoder.blog.dao.IUserDao;
import site.imcoder.blog.entity.ActionRecord;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.event.IEventTrigger;
import site.imcoder.blog.service.*;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import java.util.*;
import java.util.Map.Entry;

/**
 * 业务实现类
 *
 * @author dengchao
 */
@Service("articleService")
public class ArticleServiceImpl extends BaseService implements IArticleService {

    private static Logger logger = Logger.getLogger(ArticleServiceImpl.class);

    //依赖注入DAO
    @Resource
    private IArticleDao articleDao;

    @Resource
    private IUserDao userDao;

    @Resource
    private INotifyService notifyService;

    @Resource(name = "fileService")
    private IFileService fileService;

    @Resource
    private IAuthService authService;

    @Resource
    private Cache cache;

    /**
     * 事件触发器
     */
    @Resource
    private IEventTrigger trigger;

    /**
     * 得到文章上传的配置信息
     *
     * @param iRequest
     * @return IResponse:
     * <pre>
     * allowCreateLowestLevel
     * isAllowCreate
     * uploadArgs
     *   mode
     *   maxPhotoUploadSize
     *   maxVideoUploadSize
     * </pre>
     */
    @Override
    public IResponse getCreateConfigInfo(IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse createConfig = new IResponse();
        createConfig.putAttr("allowCreateLowestLevel", Config.getInt(ConfigConstants.ARTICLE_ALLOW_CREATE_LOWEST_LEVEL));
        createConfig.putAttr("isAllowCreate", isAllowCreate(loginUser));
        // uploadArgs
        Map<String, Object> uploadArgs = new HashMap();
        uploadArgs.put("mode", site.imcoder.blog.service.IFileService.Mode.LOCAL.value);
        uploadArgs.put("maxPhotoUploadSize", Integer.parseInt(Config.getChild(ConfigConstants.CLOUD_PHOTO_MAX_UPLOADSIZE, "@user_", loginUser.getUid() + "", ":")));
        uploadArgs.put("maxVideoUploadSize", Integer.parseInt(Config.getChild(ConfigConstants.CLOUD_VIDEO_MAX_UPLOADSIZE, "@user_", loginUser.getUid() + "", ":")));
        createConfig.putAttr("uploadArgs", uploadArgs);
        //
        createConfig.setStatus(STATUS_SUCCESS);
        return createConfig;
    }

    // 当前用户是否允许创建文章
    private boolean isAllowCreate(User loginUser) {
        if (loginUser == null) {
            return false;
        }
        // 允许发表文章的用户组最低等级，值为对应用户组的Gid
        int lowestLevel = Config.getInt(ConfigConstants.ARTICLE_ALLOW_CREATE_LOWEST_LEVEL);
        switch (UserGroupType.valueOf(lowestLevel)) {
            case NOVICE_USER:
                return true;
            case SENIOR_USER:
                int gid = loginUser.getUserGroup().getGid();
                return gid == UserGroupType.SENIOR_USER.value || gid == UserGroupType.MANAGER.value;
            case MANAGER:
                return loginUser.getUserGroup().isManager();
            default:
                return false;
        }
    }

    /**
     * description:保存文章
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * article: 文章
     * status - 200：成功，400: 参数错误，401：需要登录，500: 失败
     */
    @Override
    public IResponse saveArticle(Article article, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        int flag = STATUS_SUCCESS;
        if (iRequest.isHasNotLoggedIn()) {
            flag = STATUS_NOT_LOGIN;
        } else if (!isAllowCreate(loginUser)) {
            flag = STATUS_FORBIDDEN;
        } else if (article == null || article.getCategory() == null) {
            flag = STATUS_PARAM_ERROR;
        } else {
            article.setAuthor(iRequest.getLoginUser());
            article.setAid(IdUtil.generatePrimaryKey()); // 主键
            Date date = new Date();
            article.setCreate_time(date);
            article.setUpdate_time(date);
            flag = convertRowToHttpCode(articleDao.save(article));
        }
        response.setStatus(flag);
        if (response.isSuccess()) {
            Article newArticle = articleDao.find(article.getAid());
            trigger.newArticle(newArticle, newArticle.getAuthor());
            response.putAttr("article", newArticle).putAttr("aid", newArticle.getAid());
        }
        return response;
    }

    /**
     * 更新文章
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * article：文章
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此文章，500: 失败
     */
    @Override
    public IResponse updateArticle(Article article, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (article == null || article.getCategory() == null) {
            response.setStatus(STATUS_PARAM_ERROR, "缺少参数");
        } else {
            Article cacheArticle = cache.getArticle(article.getAid(), Cache.READ);
            if (cacheArticle == null) {
                response.setStatus(STATUS_NOT_FOUND, "无此文章");
            } else {
                User author = cacheArticle.getAuthor();
                article.setAuthor(author);
                if (author.getUid().equals(loginUser.getUid()) || loginUser.getUserGroup().isManager()) {
                    Date date = new Date();
                    article.setUpdate_time(date);
                    int row = articleDao.update(article);
                    response.setStatus(convertRowToHttpCode(row));
                    if (response.isSuccess()) {
                        // 更新缓存中文章
                        Article newArticle = articleDao.find(article.getAid());
                        trigger.updateArticle(newArticle, newArticle.getAuthor());
                        response.putAttr("article", newArticle);
                    }
                } else {
                    response.setStatus(STATUS_FORBIDDEN);
                }
            }
        }
        return response;
    }

    /**
     * 打开文章
     *
     * @param article
     * @param isNeedAdjacentArticle 是否一起返回文章的相邻文章信息
     * @param iRequest              (to check AUTH)
     * @return IResponse:
     * article:文章
     */
    @Override
    public IResponse findArticle(Article article, boolean isNeedAdjacentArticle, IRequest iRequest) {
        boolean loadAccessRecord = iRequest.getAttr("loadActionRecord", true);
        IResponse response = new IResponse();
        Article db_article = null;
        if (article == null || !IdUtil.containValue(article.getAid())) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else {
            db_article = articleDao.find(article.getAid());
            if (db_article == null) {
                response.setStatus(STATUS_NOT_FOUND, "该文章不存在：" + article.getAid());
            } else {
                response.setStatus(authService.validateUserPermissionUtil(db_article.getAuthor(), db_article.getPermission(), iRequest));
            }
        }
        if (response.isSuccess()) {
            // 填充缓存中的统计信息
            cache.fillArticleStats(db_article);
            cache.fillUserStats(db_article.getAuthor());
            response.putAttr("article", db_article);
            if (isNeedAdjacentArticle) {
                Map<String, Article> adjacentArticle = cache.getAdjacentArticle(db_article.getAid(), Cache.READ);
                response.putAttr("preArticle", adjacentArticle.get("preArticle"));
                response.putAttr("nextArticle", adjacentArticle.get("nextArticle"));
            }
            if (loadAccessRecord) {
                ActionRecord<Article> queryActionRecord = new ActionRecord<>();
                queryActionRecord.setCreation(db_article);
                queryActionRecord.setUser(iRequest.getLoginUser());
                queryActionRecord.setIp(iRequest.getAccessIp());
                ActionRecord<Article> articleActionRecord = userDao.findArticleActionRecord(queryActionRecord);
                if (articleActionRecord != null) {
                    db_article.setAccessed(articleActionRecord.getAccessed());
                    db_article.setCollected(articleActionRecord.getLiked());
                    db_article.setCommented(articleActionRecord.getCommented());
                } else {
                    db_article.setAccessed(false);
                    db_article.setCollected(false);
                    db_article.setCommented(false);
                }
            }
        } else {
            response.putAttr("article", null);
            if (isNeedAdjacentArticle) {
                response.putAttr("preArticle", null).putAttr("nextArticle", null);
            }
        }
        return response;
    }

    /**
     * 打开文章
     *
     * @param article
     * @param iRequest (to check AUTH) attr:
     *                 <p>{Boolean} isNeedAdjacentArticle - 是否一起返回文章的相邻文章信息</p>
     * @return IResponse:
     * article:文章
     */
    @Override
    public IResponse findArticle(Article article, IRequest iRequest) {
        boolean isNeedAdjacentArticle = iRequest.getAttr("isNeedAdjacentArticle", false);
        return findArticle(article, isNeedAdjacentArticle, iRequest);
    }

    /**
     * 查找文章列表，分页
     *
     * @param condition article查找条件
     * @param pageSize  每页篇数
     * @param pageNum   跳转页
     * @param iRequest  发送请求的用户 用来判断权限
     * @return IResponse:
     * status - 200: 成功, 404:该条件未找到用户
     * articles 文章列表,
     * page 分页bean
     */
    @Override
    public IResponse findArticleList(Article condition, int pageSize, int pageNum, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        int rows = articleDao.findCount(condition, loginUser);
        if (rows > 0) {
            PageUtil page = new PageUtil(rows, pageSize, pageNum);
            //想查出符合条件的LIST
            List<Article> articleList = articleDao.findList(page, condition, loginUser);
            //填充统计数据
            cache.fillArticleStats(articleList);
            response.putAttr("articles", articleList);
            response.putAttr("page", page);
            response.setStatus(STATUS_SUCCESS);
            return response;
        } else {
            response.setStatus(STATUS_NOT_FOUND, "该条件未找到文章~");
            return response;
        }
    }

    /**
     * 查找文章列表, 不分页
     *
     * @param condition
     * @param iRequest
     * @return IResponse:
     * articles 文章列表
     */
    @Override
    public IResponse findArticleList(Article condition, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        int rows = articleDao.findCount(condition, loginUser);
        if (rows > 0) {
            PageUtil page = new PageUtil(rows, rows, 1);
            // 想查出符合条件的LIST
            List<Article> articleList = articleDao.findList(page, condition, loginUser);
            // 填充统计数据
            cache.fillArticleStats(articleList);
            response.putAttr("articles", articleList);
            response.setStatus(STATUS_SUCCESS);
        } else {
            response.putAttr("articles", new ArrayList<>());
            response.setStatus(STATUS_SUCCESS, "该条件未找到文章~");
        }
        return response;
    }

    /**
     * 删除文章
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此文章，500: 失败
     */
    @Override
    public IResponse deleteArticle(Article article, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        int flag = STATUS_SUCCESS;
        if (iRequest.isHasNotLoggedIn()) {
            flag = STATUS_NOT_LOGIN;
        } else if (article != null && IdUtil.containValue(article.getAid())) {
            Article cacheArticle = cache.getArticle(article.getAid(), Cache.READ);
            if (cacheArticle == null) {
                response.setStatus(STATUS_NOT_FOUND, "删除的文章不存在~");
            } else if (cacheArticle.getAuthor().getUid().equals(loginUser.getUid())) {
                trigger.deleteArticle(article, loginUser);
                flag = convertRowToHttpCode(articleDao.delete(article));
            } else {
                flag = STATUS_FORBIDDEN;
            }
        } else {
            flag = STATUS_PARAM_ERROR;
        }
        response.setStatus(flag);
        return response;
    }

    /**
     * 点赞文章
     *
     * @param article  - 只需传aid
     * @param undo     - 是否取消赞
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    @Override
    public IResponse likeArticle(Article article, boolean undo, IRequest iRequest) {
        IResponse response = new IResponse();
        if (article == null || !IdUtil.containValue(article.getAid())) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else {
            IResponse articleResp = findArticle(article, iRequest);
            if (articleResp.isSuccess()) {
                Boolean saveLikeValue = null;
                Article db_article = articleResp.getAttr("article");
                if (!undo) {    // 赞
                    if (db_article.getCollected() != null && db_article.getCollected()) {
                        response.setMessage("你已经赞过该文章了~");
                    } else {
                        saveLikeValue = true;
                    }
                } else {    // 取消赞
                    if (db_article.getCollected() != null && db_article.getCollected()) {
                        saveLikeValue = false;
                    } else {
                        response.setMessage("你并没有赞过该文章~");
                    }
                }
                if (saveLikeValue != null) {
                    ActionRecord<Article> actionRecord = new ActionRecord<>();
                    actionRecord.setCreation(article);
                    if (iRequest.isHasLoggedIn()) {
                        actionRecord.setUser(iRequest.getLoginUser());
                    } else {
                        actionRecord.setIp(iRequest.getAccessIp());
                    }
                    actionRecord.setLiked(saveLikeValue);
                    response.setStatus(convertRowToHttpCode(userDao.saveArticleActionRecord(actionRecord)));
                    if (response.isSuccess()) {
                        response.putAttr("type", 1);
                        if (saveLikeValue) {
                            db_article.setCollect_count(db_article.getCollect_count() + 1);
                        } else {
                            db_article.setCollect_count(db_article.getCollect_count() > 0 ? db_article.getCollect_count() - 1 : 0);
                        }
                        articleDao.updateArticleCollectCount(article, saveLikeValue ? 1 : -1);
                    }
                } else {
                    response.putAttr("type", 0);
                }
                response.putAttr("article", db_article);
            } else {
                response.setStatus(articleResp);
            }
        }
        return response;
    }

    /**
     * 得到每种分类的数量
     *
     * @param iRequest
     * @return IResponse:
     * categories
     */
    @Override
    public IResponse findCategoryCount(IRequest iRequest) {
        return new IResponse().putAttr("categories", cache.getCategoryCount()).setStatus(STATUS_SUCCESS);
    }

    /**
     * description: 获得置顶列表
     *
     * @param size     列表数量
     * @param iRequest
     * @return IResponse:
     * articles
     */
    @Override
    public IResponse findTopArticleList(int size, IRequest iRequest) {
        if (size == 0) {
            size = Config.getInt(ConfigConstants.ARTICLE_HOME_SIZE_TOP);
        }
        return new IResponse().putAttr("articles", articleDao.findTopArticleList(size, iRequest.getLoginUser())).setStatus(STATUS_SUCCESS);
    }

    /**
     * description:获得排行榜列表
     *
     * @param uid      是否查询所有还是单个用户 uid=0 为查询所有
     * @param size     list长度 默认5
     * @param iRequest
     * @return IResponse:
     * clickRankList
     * newestList
     * hotTagList
     */
    @Override
    public IResponse findRankingList(Long uid, int size, IRequest iRequest) {
        if (size == 0) {
            size = Config.getInt(ConfigConstants.ARTICLE_HOME_SIZE_RANK);
        }
        // 原从数据库查
        // Map<String, Object> findRankList = articleDao.findRankList(uid,num);
        // 改为从Cache中查
        List<Article> clickRankList = null;
        List<Article> newestList = null;
        List<Entry<String, Integer>> hotTagList = null;
        if ((uid == null || uid.equals(0L)) && iRequest.isHasNotLoggedIn()) {   // 查看主页且没有登录
            clickRankList = cache.getHotSortArticle(size);
            newestList = cache.getTimeSortArticle(size);
            hotTagList = cache.getTagCount(size);
        } else {
            List<Article> visibleArticles = cache.getVisibleArticles(uid, iRequest.getLoginUser());
            clickRankList = cache.getHotSortArticle(uid, size, visibleArticles);
            newestList = cache.getTimeSortArticle(uid, size, visibleArticles);
            hotTagList = cache.getTagCount(uid, size, visibleArticles);
        }
        IResponse response = new IResponse();
        response.putAttr("clickRankList", clickRankList);
        response.putAttr("newestList", newestList);
        response.putAttr("hotTagList", hotTagList);
        return response.setStatus(STATUS_SUCCESS);
    }

    /**
     * 获取文章标签列表，按文章数量降序排序
     *
     * @param hostUser 文章作者，为null,查询所有
     * @param size     列表长度，为0返回全部
     * @param iRequest
     * @return IResponse:
     * {List<Entry<String, Integer>>} tags
     */
    @Override
    public IResponse findTagList(User hostUser, int size, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        Long uid = ((hostUser == null || !IdUtil.containValue(hostUser.getUid())) ? 0L : hostUser.getUid());
        List<Entry<String, Integer>> tagList = null;
        if (iRequest.isHasLoggedIn()) { // 登录了时，从数据库查询该登录用户可见的文章
            Article condition = null;
            if (hostUser != null && IdUtil.containValue(hostUser.getUid())) {
                condition = new Article();
                condition.setAuthor(hostUser);
            }
            int rows = articleDao.findCount(condition, loginUser);
            if (rows > 0) {
                PageUtil page = new PageUtil(rows, rows, 1);
                List<Article> visibleList = articleDao.findList(page, condition, loginUser);
                tagList = cache.getTagCount(uid, size, visibleList);
            } else {
                tagList = new ArrayList<>();
            }
        } else {
            User user = null;
            tagList = cache.getTagCount(uid, size, user);
        }
        response.putAttr("tags", tagList);
        return response.setStatus(STATUS_SUCCESS);
    }

    /**
     * 图片或附件上传
     *
     * @param file
     * @param originName 源文件名
     * @param isImage    是否是图片
     * @param iRequest
     * @return IResponse:
     * image_url:
     * width:
     * height:
     * file_url:
     */
    @Override
    public IResponse uploadAttachment(MultipartFile file, String originName, String isImage, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (file != null && !file.isEmpty()) {
            boolean isSave = false;
            Map<String, Object> map = new HashMap();
            String saveName = null;
            if (Utils.isEmpty(originName) || originName.indexOf('.') == -1) {
                originName = "upload.jpg";
            }
            if (isImage.equalsIgnoreCase("true")) {
                saveName = IdUtil.convertDecimalIdTo62radix(System.currentTimeMillis()) + "_" + IdUtil.convertToShortPrimaryKey(loginUser.getUid()) + "_article" + originName.substring(originName.lastIndexOf('.'));
                isSave = fileService.saveArticleAttachment(file, Config.get(ConfigConstants.ARTICLE_UPLOAD_RELATIVEPATH) + "image/article/", saveName, true, map);
            } else {
                String shortUid = IdUtil.convertToShortPrimaryKey(loginUser.getUid());
                saveName = shortUid + "_" + IdUtil.convertDecimalIdTo62radix(System.currentTimeMillis()) + originName.substring(originName.lastIndexOf('.'));
                isSave = fileService.saveArticleAttachment(file, Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + shortUid + "/attachment/", saveName, false, map);
            }
            if (isSave) {
                response.putAttr(map).setStatus(STATUS_SUCCESS);
            } else {
                response.setStatus(STATUS_SERVER_ERROR, "保存附件失败~");
            }
        } else {
            response.setStatus(STATUS_PARAM_ERROR, "未上传文件~");
        }
        return response;
    }

    /**
     * 互联网图片本地化
     *
     * @param url
     * @param originName
     * @param iRequest
     * @return IResponse:
     * image_url:
     * width:
     * height:
     * file_url:
     */
    @Override
    public IResponse uploadImageFromURL(String url, String originName, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (Utils.isEmpty(url)) {
            response.setStatus(STATUS_PARAM_ERROR, "请输入链接");
        } else {
            boolean isSave = false;
            Map<String, Object> map = new HashMap();
            if (Utils.isEmpty(originName) || originName.indexOf('.') == -1) {
                originName = "upload.jpg";
            }
            String saveName = IdUtil.convertDecimalIdTo62radix(System.currentTimeMillis()) + "_" + IdUtil.convertToShortPrimaryKey(loginUser.getUid()) + "_article" + originName.substring(originName.lastIndexOf('.'));
            isSave = fileService.downloadInternetImage(url, Config.get(ConfigConstants.ARTICLE_UPLOAD_RELATIVEPATH) + "image/article/", saveName, map);
            if (isSave) {
                response.putAttr(map).setStatus(STATUS_SUCCESS);
            } else {
                response.setStatus(STATUS_SERVER_ERROR, "保存图片件失败~");
            }
        }
        return response;
    }

    /**
     * 删除文件
     *
     * @param file_url
     * @param isImage  是否时图片
     * @param iRequest
     * @return IResponse:
     * status: [200:服务器删除成功] [404:文章插入的图片为链接，不需要删除，返回成功] [500:图片删除失败]
     */
    @Override
    public IResponse deleteAttachment(String file_url, String isImage, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        // String contextPath = request.getContextPath() ;
        // int index = file_url.indexOf( contextPath ) + contextPath.length();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (Utils.isEmpty(file_url)) {
            response.setStatus(STATUS_PARAM_ERROR, "请输入链接");
        } else {
            int flag = 0;
            if (isImage.equalsIgnoreCase("true")) {
                flag = fileService.deleteFileByUrl(file_url, Config.get(ConfigConstants.ARTICLE_UPLOAD_RELATIVEPATH) + "image/article/", null);
            } else {
                flag = fileService.deleteFileByUrl(file_url, Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + IdUtil.convertToShortPrimaryKey(loginUser.getUid()) + "/posts/attachment/", null);
            }
            if (flag == STATUS_SUCCESS) {
                response.setStatus(flag, "服务器删除成功~");
            } else if (flag == STATUS_NOT_FOUND) {
                response.setStatus(flag, "链接文件不存在或该链接不属于本站~");
            } else {
                response.setStatus(flag, "图片删除失败~");
            }
        }
        return response;
    }

    /**
     * 查询文章的历史用户动作记录
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * articleActionRecords
     * article_action_record_count
     * article
     */
    @Override
    public IResponse findArticleActionRecordList(Article article, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (article == null) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else {
            IResponse articleResp = findArticle(article, iRequest);
            if (articleResp.isSuccess()) {
                Article db_article = articleResp.getAttr("article");
                if (db_article.getAuthor().getUid().equals(loginUser.getUid())) {
                    ActionRecord<Article> queryActionRecord = new ActionRecord<>();
                    queryActionRecord.setCreation(new Article(db_article.getAid()));
                    List<ActionRecord<Article>> articleActionRecordList = userDao.findArticleActionRecordList(queryActionRecord, iRequest.getLoginUser());
                    response.putAttr("articleActionRecords", articleActionRecordList);
                    response.putAttr("article_action_record_count", articleActionRecordList.size());
                    response.putAttr(articleResp.getAttr());
                } else {
                    response.setStatus(STATUS_FORBIDDEN, "访问记录只能作者本人查看~");
                }
            } else {
                response.setStatus(articleResp);
            }
        }
        return response;
    }

}