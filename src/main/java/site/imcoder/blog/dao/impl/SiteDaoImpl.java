package site.imcoder.blog.dao.impl;

import org.apache.ibatis.session.SqlSession;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import site.imcoder.blog.dao.CommonDao;
import site.imcoder.blog.dao.ISiteDao;
import site.imcoder.blog.entity.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 站点和统计类持久化类
 *
 * @author dengchao
 * @date 2017-3-23
 */
@Repository("siteDao")
public class SiteDaoImpl extends CommonDao implements ISiteDao {

    private static Logger logger = Logger.getLogger(SiteDaoImpl.class);

    /**
     * 文章的基本信息
     */
    public List<Article> findArticleBaseList() {
        return this.getSqlSession().selectList("site.findArticleBaseList");
    }

    /**
     * 持久化文章缓存
     */
    @Override
    public int saveArticleBuffer(List<Article> articleList) {
        try {
            return this.getSqlSession().update("site.updateArticleBaseBatch", articleList);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveArticleBuffer fail", e);
            return -1;
        }
    }

    /**
     * description:得到每种文章类型的数量集合
     *
     * @return
     */
    @Override
    public List<Category> getCategoryCount() {
        SqlSession sqlSession = this.getSqlSession();
        List<Category> CategoryList = sqlSession.selectList("site.selectCategory");
        List<Category> categoryCountList = sqlSession.selectList("site.selectCategoryCount");

        int sum = 0;
        Category defaultCategory = null;
        for (Category category : CategoryList) {
            for (Category category_temp : categoryCountList) {
                if (category.getAtid() == category_temp.getAtid()) {
                    category.setCount(category_temp.getCount());
                }
            }

            sum += category.getCount();
            if (category.getAtid() == 0) {
                defaultCategory = category;
            }
        }

        defaultCategory.setCount(sum);
        return CategoryList;
    }

    /**
     * 得到user表
     */
    @Override
    public List<User> loadUserTable() {
        return this.getSqlSession().selectList("site.selectUserTable");
    }

    /**
     * 得到Friend表
     */
    @Override
    public List<Friend> loadFriendTable() {
        return this.getSqlSession().selectList("site.selectFriendTable");
    }

    /**
     * 得到user_follow表
     */
    @Override
    public List<Follow> loadFollowTable() {
        return this.getSqlSession().selectList("site.selectFollowTable");
    }

    @Override
    public int updateArticleInfoByManager(Article article) {
        try {
            return this.getSqlSession().update("site.updateArticleInfoByManager", article);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateArticleInfoByManager fail", e);
            return -1;
        }
    }

    @Override
    public int saveSystemMessage(SysMsg sysMsg) {
        try {
            return this.getSqlSession().update("msg.insertSystemMessage", sysMsg);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveSystemMessage fail", e);
            return -1;
        }
    }

    @Override
    public int updateSystemMessageStatus(List<Integer> smIdList) {
        try {
            return this.getSqlSession().update("msg.updateSystemMessageStatus", smIdList);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateSystemMessageStatus fail", e);
            return -1;
        }
    }

    /**
     * 加载相册列表
     *
     * @param user 为null查找所有
     * @return
     */
    @Override
    public List<Album> loadAlbumTable(User user) {
        return this.getSqlSession().selectList("site.findAlbumList", user);
    }

    /**
     * 加载照片列表
     *
     * @param album 为null查找所有
     * @return
     */
    @Override
    public List<Photo> loadPhotoTable(Album album) {
        return this.getSqlSession().selectList("site.findPhotoList", album);
    }

    /**
     * 加载视频列表
     *
     * @param user 为null查找所有
     * @return
     */
    @Override
    public List<Video> loadVideoTable(User user) {
        return this.getSqlSession().selectList("site.findVideoList", user);
    }

    /**
     * 更新文章中的文件相对路径
     *
     * @param oldPath
     * @param newPath
     * @return
     */
    @Override
    public int updateArticleFilePath(String oldPath, String newPath) {
        try {
            Map<String, String> map = new HashMap<String, String>();
            map.put("oldPath", oldPath);
            map.put("newPath", newPath);
            int left = this.getSqlSession().update("updateArticleDetailFilePath", map);
            int right = this.getSqlSession().update("updateArticleSummaryFilePath", map);
            return left * right < 0 ? -1 : left * right;
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateArticleFilePath fail", e);
            return -1;
        }
    }
}
