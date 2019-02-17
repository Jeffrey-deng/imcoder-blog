package site.imcoder.blog.service.impl;

import org.apache.commons.collections.map.HashedMap;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.PageUtil;
import site.imcoder.blog.common.type.UserGroupType;
import site.imcoder.blog.dao.IArticleDao;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.Category;
import site.imcoder.blog.entity.Friend;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.event.IEventTrigger;
import site.imcoder.blog.service.IArticleService;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.service.INotifyService;
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
public class ArticleServiceImpl implements IArticleService {

    private static Logger logger = Logger.getLogger(ArticleServiceImpl.class);

    //依赖注入DAO
    @Resource
    private IArticleDao articleDao;

    @Resource
    private INotifyService notifyService;

    @Resource(name = "fileService")
    private IFileService fileService;

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
     * @param loginUser
     * @return
     */
    @Override
    public Map<String, Object> getCreateConfigInfo(User loginUser) {
        Map<String, Object> createConfig = new HashedMap();
        createConfig.put("allowCreateLowestLevel", Config.getInt(ConfigConstants.ARTICLE_ALLOW_CREATE_LOWEST_LEVEL));
        createConfig.put("isAllowCreate", isAllowCreate(loginUser));
        // uploadArgs
        Map<String, Object> uploadArgs = new HashedMap();
        uploadArgs.put("mode", site.imcoder.blog.service.IFileService.Mode.LOCAL.value);
        uploadArgs.put("maxPhotoUploadSize", Config.getInt(ConfigConstants.CLOUD_PHOTO_MAX_UPLOADSIZE));
        uploadArgs.put("maxVideoUploadSize", Config.getInt(ConfigConstants.CLOUD_VIDEO_MAX_UPLOADSIZE));
        createConfig.put("uploadArgs", uploadArgs);
        //
        createConfig.put("flag", 200);
        return createConfig;
    }

    // 当前用户是否允许创建文章
    private boolean isAllowCreate(User loginUser) {
        if (loginUser == null) {
            return false;
        }
        // 允许发表文章的用户组最低等级，值为对应用户组的Gid
        int lowestLevel = Config.getInt(ConfigConstants.ARTICLE_ALLOW_CREATE_LOWEST_LEVEL);
        switch (UserGroupType.valueOfName(lowestLevel)) {
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
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，500: 失败
     */
    public int save(Article article, User loginUser) {
        if (loginUser == null) {
            return 401;
        }
        if (!isAllowCreate(loginUser)) {
            return 403;
        }
        if (article == null || article.getAuthor() == null || article.getCategory() == null) {
            return 400;
        }
        Date date = new Date();
        article.setCreate_time(date);
        article.setUpdate_time(date);
        int row = articleDao.save(article);
        trigger.newArticle(article, article.getAuthor());
        return row == 1 ? 200 : 500;
    }

    /**
     * 更新文章
     *
     * @param article
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此文章，500: 失败
     */
    @Override
    public int update(Article article, User loginUser) {
        if (loginUser == null) {
            return 401;
        }
        if (article == null || article.getCategory() == null) {
            return 400;
        }
        Article cacheArticle = cache.getArticle(article.getAid(), Cache.READ);
        if (cacheArticle == null) {
            return 404;
        }
        User author = cacheArticle.getAuthor();
        article.setAuthor(author);
        if (author.getUid() == loginUser.getUid() || loginUser.getUserGroup().isManager()) {
            Date date = new Date();
            article.setUpdate_time(date);
            int row = articleDao.update(article);
            if (row > 0) {
                //更新缓存中文章
                Article newArticle = articleDao.find(article.getAid());
                trigger.updateArticle(newArticle, newArticle.getAuthor());
            }
            return convertRowToHttpCode(row);
        } else {
            return 403;
        }
    }

    /**
     * 打开文章
     *
     * @param aid
     * @param loginUser (to check AUTH)
     * @return map (article:文章，flag：{200, 401, 403：无权限，404：无此文章})
     */
    public Map<String, Object> detail(int aid, User loginUser) {
        Map<String, Object> map = new HashMap<String, Object>();
        Article article = articleDao.find(aid);
        int flag = checkUserHasPermission(article, loginUser);
        map.put("flag", flag);
        if (flag == 200) {
            //填充缓存中的统计信息
            cache.fillArticleStats(article);
            cache.fillUserStats(article.getAuthor());
            map.put("article", article);
            Map<String, Article> adjacentArticle = cache.getAdjacentArticle(article.getAid(), Cache.READ);
            map.put("preArticle", adjacentArticle.get("preArticle"));
            map.put("nextArticle", adjacentArticle.get("nextArticle"));
        } else {
            map.put("article", null);
        }
        return map;
    }

    /**
     * 查找文章列表，分页
     *
     * @param pageSize  每页篇数
     * @param jumpPage  跳转页
     * @param condition article查找条件
     * @param loginUser 发送请求的用户 用来判断权限
     * @return 文章列表, 分页bean
     */
    public Map<String, Object> list(int pageSize, int jumpPage, Article condition, User loginUser) {
        Map<String, Object> map = new HashMap<String, Object>();
        int rows = articleDao.findCount(condition, loginUser);
        if (rows > 0) {
            PageUtil page = new PageUtil(rows, pageSize, jumpPage);
            //想查出符合条件的LIST
            List<Article> articleList = articleDao.findList(page, condition, loginUser);
            //填充统计数据
            cache.fillArticleStats(articleList);
            map.put("articleList", articleList);
            map.put("page", page);
            return map;
        } else {
            return null;
        }
    }

    /**
     * 查找文章列表, 不分页
     *
     * @param condition
     * @param loginUser
     * @return
     */
    public List<Article> list(Article condition, User loginUser) {
        int rows = articleDao.findCount(condition, loginUser);
        if (rows > 0) {
            PageUtil page = new PageUtil(rows, rows, 1);
            //想查出符合条件的LIST
            List<Article> articleList = articleDao.findList(page, condition, loginUser);
            //填充统计数据
            cache.fillArticleStats(articleList);
            return articleList;
        } else {
            return new ArrayList<>();
        }
    }

    /**
     * 删除文章
     *
     * @param article
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此文章，500: 失败
     */
    public int delete(Article article, User loginUser) {
        if (loginUser == null) {
            return 401;
        }
        if (article != null && article.getAid() > 0) {
            Article memArticle = cache.getArticle(article.getAid(), Cache.READ);
            if (memArticle.getAuthor().getUid() == loginUser.getUid()) {
                trigger.deleteArticle(article, loginUser);
                return convertRowToHttpCode(articleDao.delete(article));
            } else {
                return 403;
            }
        } else {
            return 400;
        }
    }

    /**
     * 得到每种分类的数量
     *
     * @return
     */
    public List<Category> getCategoryCount() {
        return cache.getCategoryCount();
    }

    /**
     * description: 获得置顶列表
     *
     * @param size 列表数量
     * @return List<Article>
     */
    public List<Article> listTops(int size) {
        return articleDao.findTopsList(size);
    }

    /**
     * description:获得排行榜列表
     *
     * @param uid  是否查询所有还是单个用户 uid=0 为查询所有
     * @param size list长度 默认5
     * @return Map<String,List>
     */
    public Map<String, Object> listRanking(int uid, int size, User loginUser) {
        //原从数据库查
        //Map<String, Object> findRankList = articleDao.findRankList(uid,num);

        //改为从Cache中查
        List<Article> clickRankList = null;
        List<Article> newestList = null;
        List<Entry<String, Integer>> hotTagList = null;
        if (uid == 0 && (loginUser == null || loginUser.getUid() == 0)) {
            clickRankList = cache.getHotSortArticle(size);
            newestList = cache.getTimeSortArticle(size);
            hotTagList = cache.getTagCount(size);
        } else {
            List<Article> visibleArticles = cache.getVisibleArticles(uid, loginUser);
            clickRankList = cache.getHotSortArticle(uid, size, visibleArticles);
            newestList = cache.getTimeSortArticle(uid, size, visibleArticles);
            hotTagList = cache.getTagCount(uid, size, visibleArticles);
        }

        Map<String, Object> map = new HashMap<String, Object>();
        map.put("clickRankList", clickRankList);
        map.put("newestList", newestList);
        map.put("hotTagList", hotTagList);
        return map;
    }

    /**
     * 获取文章标签列表，按文章数量降序排序
     *
     * @param hostUser  文章作者，为null,查询所有
     * @param size      列表长度，为0返回全部
     * @param loginUser
     * @return
     */
    public List<Entry<String, Integer>> findTagList(User hostUser, int size, User loginUser) {
        int uid = (hostUser == null ? 0 : hostUser.getUid());
        if (loginUser != null) { // 登录了时，从数据库查询该登录用户可见的文章
            Article condition = null;
            if (hostUser != null) {
                condition = new Article();
                condition.setAuthor(hostUser);
            }
            int rows = articleDao.findCount(condition, loginUser);
            if (rows > 0) {
                PageUtil page = new PageUtil(rows, rows, 1);
                List<Article> visibleList = articleDao.findList(page, condition, loginUser);
                return cache.getTagCount(uid, size, visibleList);
            } else {
                return new ArrayList<>();
            }
        } else {
            User user = null;
            return cache.getTagCount(uid, size, user);
        }
    }

    /**
     * 图片或附件上传
     *
     * @param file
     * @param fileName  重命名名字
     * @param isImage   是否是图片
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，500: 失败
     * info - 提示
     */

    public Map<String, Object> uploadAttachment(MultipartFile file, String fileName, String isImage, User loginUser) {
        Map<String, Object> map = new HashMap<String, Object>();
        if (loginUser == null) {
            map.put("flag", 401);
        } else if (file != null) {
            boolean isSave = false;
            if (isImage.equalsIgnoreCase("true")) {
                isSave = fileService.saveArticleAttachment(file, Config.get(ConfigConstants.ARTICLE_UPLOAD_RELATIVEPATH) + "image/article/", fileName, true, map);
            } else {
                int uid = loginUser.getUid();
                isSave = fileService.saveArticleAttachment(file, Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + uid + "/attachment/", fileName, false, map);
            }
            map.put("flag", isSave ? 200 : 500);
        } else {
            map.put("flag", 400);
        }
        return map;
    }

    /**
     * 互联网图片本地化
     *
     * @param url
     * @param fileName
     * @param loginUser
     * @return
     */
    public Map<String, Object> localImage(String url, String fileName, User loginUser) {
        Map<String, Object> map = new HashMap<String, Object>();
        if (loginUser == null) {
            map.put("flag", 401);
        } else if (url == null || url.length() == 0) {
            map.put("flag", 400);
        } else {
            boolean isDownload = fileService.downloadInternetImage(url, Config.get(ConfigConstants.ARTICLE_UPLOAD_RELATIVEPATH) + "image/article/", fileName, map);
            map.put("flag", isDownload ? 200 : 500);
        }
        return map;
    }

    /**
     * 删除文件
     *
     * @param file_url
     * @param isImage   是否时图片
     * @param loginUser
     * @return flag: [200:服务器删除成功] [404:文章插入的图片为链接，不需要删除，返回成功] [500:图片删除失败]
     */
    public Map<String, Object> deleteAttachment(String file_url, String isImage, User loginUser) {
        //String contextPath = request.getContextPath() ;
        //int index = file_url.indexOf( contextPath ) + contextPath.length();
        Map<String, Object> map = new HashMap<String, Object>();
        if (loginUser == null) {
            map.put("flag", 401);
        } else if (file_url == null || file_url.length() == 0) {
            map.put("flag", 400);
        } else {
            int flag = 0;
            if (isImage.equalsIgnoreCase("true")) {
                flag = fileService.deleteFileByUrl(file_url, Config.get(ConfigConstants.ARTICLE_UPLOAD_RELATIVEPATH) + "image/article/", null);
            } else {
                flag = fileService.deleteFileByUrl(file_url, Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + loginUser.getUid() + "/attachment/", null);
            }
            map.put("flag", flag);
        }
        return map;
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