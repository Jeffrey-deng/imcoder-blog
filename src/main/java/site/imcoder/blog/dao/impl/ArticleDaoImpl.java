package site.imcoder.blog.dao.impl;

import org.apache.ibatis.session.SqlSession;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import site.imcoder.blog.common.PageUtil;
import site.imcoder.blog.dao.CommonDao;
import site.imcoder.blog.dao.IArticleDao;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.Comment;
import site.imcoder.blog.entity.User;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据处理实现类
 *
 * @author dengchao
 */
@Repository("articleDao")
public class ArticleDaoImpl extends CommonDao implements IArticleDao {

    private static Logger logger = Logger.getLogger(ArticleDaoImpl.class);

    public final static String regex_filed_article_title = "title"; // 支持正则表达式的字段

    public final static String regex_filed_article_tags = "tags";

    /** --------article dml start----------------- */
    /**
     * 保存文章
     *
     * @param article
     * @return 如果成功返回    文章id在对象article里
     * 如果失败返回0
     */
    public int save(Article article) {
        try {
            SqlSession session = this.getSqlSession();
            //*****插入文章表返回aid赋值给article对象，而“不是”返回值是aid
            int row1 = session.insert("article.saveArticle", article);
            //详情表
            int row2 = session.insert("article.saveArticleDetail", article);
            return row1 * row2;
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("save fail", e);
            return -1;
        }
    }

    /**
     * 更新文章
     *
     * @param article
     * @return
     */
    @Override
    public int update(Article article) {
        try {
            SqlSession session = this.getSqlSession();
            //插入文章表返回aid赋值给article
            int row1 = session.update("article.updateArticle", article);
            //详情表
            int row2 = session.update("article.updateArticleDetail", article);
            return row1 * row2;
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("update fail", e);
            return -1;
        }
    }

    /**
     * 打开文章
     *
     * @param aid
     * @return
     */
    public Article find(int aid) {
        return this.getSqlSession().selectOne("article.findArticle", aid);
    }

    /**
     * 查找文章数量 根据条件
     *
     * @param condition
     * @param loginUser
     * @return
     */
    public int findCount(Article condition, User loginUser) {
        try {
            String title = null, tags = null;
            if (condition != null) {
                title = condition.getTitle();
                tags = condition.getTags();
                if (condition.getTitle() != null && condition.getTitle().length() != 0) {
                    condition.setTitle(encodeRegexField(regex_filed_article_title, title, false));
                }
                if (condition.getTags() != null && condition.getTags().length() != 0) {
                    condition.setTags(encodeRegexField(regex_filed_article_tags, tags));
                }
            }
            HashMap<String, Object> map = new HashMap<String, Object>();
            map.put("condition", condition);
            map.put("loginUser", loginUser);
            int count = this.getSqlSession().selectOne("article.findCount", map);
            if (condition != null) {
                condition.setTitle(title);
                condition.setTags(tags);
            }
            return count;
        } catch (Exception e) {
            e.printStackTrace();
            logger.warn("findCount fail", e);
            return 0;
        }
    }

    /**
     * 查找文章列表
     *
     * @param page
     * @param condition
     * @param loginUser
     * @return
     */
    public List<Article> findList(PageUtil page, Article condition, User loginUser) {
        try {
            String title = null, tags = null;
            if (condition != null) {
                title = condition.getTitle();
                tags = condition.getTags();
                if (condition.getTitle() != null && condition.getTitle().length() != 0) {
                    condition.setTitle(encodeRegexField(regex_filed_article_title, title, false));
                }
                if (condition.getTags() != null && condition.getTags().length() != 0) {
                    condition.setTags(encodeRegexField(regex_filed_article_tags, tags));
                }
            }
            HashMap<String, Object> map = new HashMap<String, Object>();
            map.put("condition", condition);
            map.put("loginUser", loginUser);
            map.put("startRow", page.getStartRow());
            map.put("pageSize", page.getPageSize());
            List<Article> list = this.getSqlSession().selectList("article.findArticleList", map);
            if (condition != null) {
                condition.setTitle(title);
                condition.setTags(tags);
            }
            return list;
        } catch (Exception e) {
            e.printStackTrace();
            logger.warn("findList fail", e);
            return new ArrayList<>();
        }
    }

    /**
     * 删除文章
     *
     * @param article
     * @return
     */
    @Override
    public int delete(Article article) {
        try {
            SqlSession session = this.getSqlSession();
            int a = session.delete("article.deleteArticle_comment", article);
            int b = session.delete("article.deleteArticle_collection", article);
            int c = session.delete("article.deleteArticle_detail", article);
            if (c > 0) {
                return session.delete("article.deleteArticle", article);
            }
            return 0;
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("delete fail", e);
            return -1;
        }
    }

    /** --------article dml end----------------- */

    /** ---------- article rank manager start ------------------- */

    /**
     * 增加评论数
     */
    public int raiseCommentCnt(Comment comment) {
        try {
            return this.getSqlSession().update("article.raiseCommentCnt", comment);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("raiseCommentCnt fail", e);
            return -1;
        }
    }

    /**
     * 减少评论数
     */
    public int reduceCommentCnt(Comment comment) {
        try {
            return this.getSqlSession().update("article.reduceCommentCnt", comment);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("reduceCommentCnt fail", e);
            return -1;
        }
    }

    /**
     * 增加收藏数
     */
    public int raiseCollectCnt(Article article) {
        try {
            return this.getSqlSession().update("article.raiseCollectCnt", article);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("raiseCollectCnt fail", e);
            return -1;
        }
    }

    /**
     * 减少收藏数
     */
    public int reduceCollectCnt(Article article) {
        try {
            return this.getSqlSession().update("article.reduceCollectCnt", article);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("reduceCollectCnt fail", e);
            return -1;
        }
    }

    /**
     * 增加点击数
     */
    public int raiseClickCnt(Article article) {
        try {
            return this.getSqlSession().update("article.raiseClickCnt", article);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("raiseClickCnt fail", e);
            return -1;
        }
    }
    /** ---------- article rank manager end ------------------- */

	/* ---------------article rank find start------------------*/

    /**
     * 获得置顶列表
     *
     * @param num 列表数量
     * @return List<Article>
     */
    public List<Article> findTopsList(int num) {
        return this.getSqlSession().selectList("article.findTopsList", num);
    }

    /**
     * 获得排行榜列表
     *
     * @param uid 是否查询所有还是单个 uid=0 为查询所有
     * @param num list长度 默认5
     * @return Map<String,Object>
     */
    public Map<String, Object> findRankList(int uid, int num) {
        SqlSession session = this.getSqlSession();
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("uid", uid);
        map.put("num", num);
        map.put("clickRankList", session.selectList("article.findClickRankList", map));
        //map.put("commentRankList",session.selectList("article.findCommentRankList",map));
        //map.put("CollectRankList",session.selectList("article.findCollectRankList",map));
        map.put("newestList", session.selectList("article.findNewestList", map));
        return map;
    }
    /*---------------article rank find end------------------*/

}