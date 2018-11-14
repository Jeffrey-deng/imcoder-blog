package site.imcoder.blog.service.impl;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.PageUtil;
import site.imcoder.blog.dao.IArticleDao;
import site.imcoder.blog.entity.*;
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

    @Resource
    private IFileService fileService;

    @Resource
    private Cache cache;

    /**
     * 事件触发器
     */
    @Resource
    private IEventTrigger trigger;

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
        if (author.getUid() == loginUser.getUid() || loginUser.getUserGroup().getGid() == 1) {
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
        Article article = articleDao.find(aid);
        Map<String, Object> map = new HashMap<String, Object>();
        int flag = 200;
        //文章为空时info返回404
        if (article != null) {
            //需要权限
            int permission = article.getPermission();
            if (permission > 0) {
                //需要权限却没登录直接返回401
                if (loginUser != null) {
                    //权限--仅好友可见时
                    if (permission == 1 && article.getAuthor().getUid() != loginUser.getUid()) {
                        //userDao.checkFriendRelationship(new Friend(loginUser.getUid(),article.getAuthor().getUid()));
                        if (cache.containsFriend(new Friend(loginUser.getUid(), article.getAuthor().getUid())) != 2) {
                            flag = 403;
                        }
                        //权限--为私有时
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
     * 得到评论列表
     *
     * @param aid
     * @return
     */
    public List<Comment> findCommentList(int aid) {
        return articleDao.findCommentList(aid);
    }

    /**
     * 添加评论
     *
     * @param comment
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，500: 失败
     */
    public int addComment(Comment comment, User loginUser) {
        if (loginUser == null) {
            return 401;
        }
        comment.setUser(loginUser);
        comment.setSend_time(new Date().getTime());
        int index = articleDao.saveComment(comment);
        if (index > 0) {
            //触发发送新评论通知
            notifyService.receivedComment(comment);

            //增加评论数
            //articleDao.raiseCommentCnt(comment);
            trigger.addComment(comment);
        }
        return convertRowToHttpCode(index);
    }

    /**
     * 删除评论
     *
     * @param comment
     * @param loginUser
     * @return flag - 200：成功，201：填充为‘已删除’，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    public int deleteComment(Comment comment, User loginUser) {
        if (loginUser == null) {
            return 401;
        } else {
            comment.setUser(loginUser);
        }
        int index = articleDao.deleteComment(comment);
        if (index == 2) {
            //减少评论数
            //articleDao.reduceCommentCnt(comment);
            trigger.deleteComment(comment);
            return 200;
        } else if (index == 1) {
            return 201;
        } else if (index == 0) {
            return 404;
        } else {
            return 500;
        }
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
    public Map<String, Object> listRanking(int uid, int size) {
        //原从数据库查
        //Map<String, Object> findRankList = articleDao.findRankList(uid,num);

        //改为从Cache中查
        List<Article> clickRankList = cache.getHotSortArticle(uid, size);
        List<Article> newestList = cache.getTimeSortArticle(uid, size);
        List<Entry<String, Integer>> hotTagList = cache.getTagCount(uid, size);

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
            return cache.getTagCount(uid, size);
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