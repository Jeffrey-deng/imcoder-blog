package site.imcoder.blog.dao.impl;

import org.apache.ibatis.session.SqlSession;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import site.imcoder.blog.common.PageUtil;
import site.imcoder.blog.dao.CommonDao;
import site.imcoder.blog.dao.IArticleDao;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

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
    public Article find(Long aid) {
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
                    condition.setTitle(encodeRegexField("a.title", title, false));
                }
                if (condition.getTags() != null && condition.getTags().length() != 0) {
                    condition.setTags(encodeRegexField("a.tags", tags));
                }
            }
            HashMap<String, Object> map = new HashMap<String, Object>();
            map.put("condition", condition);
            map.put("loginUser", loginUser);
            map.put("feed_flow_allow_following_show", Config.getBoolean(ConfigConstants.FEED_FLOW_ALLOW_FOLLOWING_SHOW));
            map.put("feed_flow_allow_show_lowest_level", Config.getInt(ConfigConstants.FEED_FLOW_ALLOW_SHOW_LOWEST_LEVEL));
            int count = this.getSqlSession().selectOne("article.findCount", map);
            if (condition != null) {
                condition.setTitle(title);
                condition.setTags(tags);
            }
            return count;
        } catch (Exception e) {
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
                    condition.setTitle(encodeRegexField("a.title", title, false));
                }
                if (condition.getTags() != null && condition.getTags().length() != 0) {
                    condition.setTags(encodeRegexField("a.tags", tags));
                }
            }
            HashMap<String, Object> map = new HashMap<String, Object>();
            map.put("condition", condition);
            map.put("loginUser", loginUser);
            map.put("startRow", page.getStartRow());
            map.put("pageSize", page.getPageSize());
            map.put("feed_flow_allow_following_show", Config.getBoolean(ConfigConstants.FEED_FLOW_ALLOW_FOLLOWING_SHOW));
            map.put("feed_flow_allow_show_lowest_level", Config.getInt(ConfigConstants.FEED_FLOW_ALLOW_SHOW_LOWEST_LEVEL));
            List<Article> list = this.getSqlSession().selectList("article.findArticleList", map);
            if (condition != null) {
                condition.setTitle(title);
                condition.setTags(tags);
            }
            return list;
        } catch (Exception e) {
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
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("delete fail", e);
            return -1;
        }
    }

    /** --------article dml end----------------- */

    /** ---------- article rank manager start ------------------- */
    /**
     * 点击量加1
     *
     * @param article
     * @param step    - 步长，可为负数
     * @return
     */
    @Override
    public int updateArticleClickCount(Article article, int step) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("article", article);
            map.put("step", step);
            return this.getSqlSession().update("article.updateArticleClickCount", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.warn("updateArticleClickCount fail", e);
            return -1;
        }
    }

    /**
     * 收藏量量加1
     *
     * @param article
     * @param step    - 步长，可为负数
     * @return
     */
    @Override
    public int updateArticleCollectCount(Article article, int step) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("article", article);
            map.put("step", step);
            return this.getSqlSession().update("article.updateArticleCollectCount", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.warn("updateArticleCollectCount fail", e);
            return -1;
        }
    }

    /**
     * 评论量加1
     *
     * @param article
     * @param step    - 步长，可为负数
     * @return
     */
    @Override
    public int updateArticleCommentCount(Article article, int step) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("article", article);
            map.put("step", step);
            return this.getSqlSession().update("article.updateArticleCommentCount", map);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.warn("updateArticleCommentCount fail", e);
            return -1;
        }
    }
    /** ---------- article rank manager end ------------------- */

	/* ---------------article rank find start------------------*/

    /**
     * 获得置顶列表
     *
     * @param size      列表数量
     * @param loginUser
     * @return List<Article>
     */
    public List<Article> findTopArticleList(int size, User loginUser) {
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("size", size);
        map.put("loginUser", loginUser);
        return this.getSqlSession().selectList("article.findTopArticleList", map);
    }

    /**
     * 获得排行榜列表
     *
     * @param uid  是否查询所有还是单个 uid=0 为查询所有
     * @param size list长度 默认5
     * @return Map<String,Object>
     */
    public Map<String, Object> findRankList(int uid, int size) {
        SqlSession session = this.getSqlSession();
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("uid", uid);
        map.put("size", size);
        map.put("clickRankList", session.selectList("article.findClickRankList", map));
        // map.put("commentRankList",session.selectList("article.findCommentRankList",map));
        // map.put("CollectRankList",session.selectList("article.findCollectRankList",map));
        map.put("newestList", session.selectList("article.findNewestList", map));
        return map;
    }

    /*---------------article rank find end------------------*/

    /**
     * 校正处理结果，可通过继承再调整结果值
     *
     * @param field
     * @param value
     * @return
     */
    @Override
    protected String reviseEncodeResult(String field, String value) {
        if (value != null && field != null && field.indexOf("tags") != -1) {
            return value.replace(regexp_word_boundary_left, "#").replace(regexp_word_boundary_right, "#");
        } else {
            return value;
        }
    }

}