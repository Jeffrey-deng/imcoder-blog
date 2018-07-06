package com.blog.service.impl;

import com.blog.cache.Cache;
import com.blog.common.PageUtil;
import com.blog.dao.IArticleDao;
import com.blog.entity.*;
import com.blog.entity.temp.Friend;
import com.blog.event.IEventTrigger;
import com.blog.service.IArticleService;
import com.blog.service.IEmailService;
import com.blog.service.ISiteService;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private IEmailService emailService;

    @Resource
    private ISiteService siteService;

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
     * @param article
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此文章，500: 失败
     */
    @Override
    public int update(Article article, User loginUser) {
        if (loginUser == null) {
            return 401;
        }
        if (article == null || article.getAuthor() == null || article.getCategory() == null) {
            return 400;
        }
        if (article.getAuthor().getUid() == loginUser.getUid() || loginUser.getUserGroup().getGid() == 1) {
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
                        //userDao.checkFriendRalationship(new Friend(loginUser.getUid(),article.getAuthor().getUid()));
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
     * 查找文章列表
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
            //触发发送新评论邮件
            emailService.receivedCommentMail(comment);

            //增加评论数
            //articleDao.raiseCommentCnt(comment);
            trigger.addComment(comment);

            //系统通知
            User sendUser = comment.getUser();
            User recvUser = cache.getUser(comment.getReplyuid(), Cache.READ);
            String message = recvUser.getNickname() + "你好，你收到了一条来自 " + sendUser.getNickname() + " 评论! ：<a style=\"color:#18a689;\" href=\"article.do?method=detail&aid=" + comment.getAid() + "#comments\" target=\"_balnk\" >点击查看</a>";
            SysMsg sysMsg = new SysMsg(recvUser.getUid(), message, new Date().getTime(), 0);
            siteService.sendSystemMessage(sysMsg);
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
        List<Entry<String, Integer>> hotTagList = cache.getTagCount(size);

        Map<String, Object> map = new HashMap<String, Object>();
        map.put("clickRankList", clickRankList);
        map.put("newestList", newestList);
        map.put("hotTagList", hotTagList);
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