package site.imcoder.blog.cache;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Component;
import site.imcoder.blog.dao.ISiteDao;
import site.imcoder.blog.entity.*;

import javax.annotation.Resource;
import java.util.*;
import java.util.Map.Entry;

/**
 * description: 初始化缓存工具类
 *
 * @author dengchao
 * @date 2017-4-12
 */
@Component("initTool")
public class InitCacheTool {

    private static Logger logger = Logger.getLogger(InitCacheTool.class);

    //依赖注入DAO
    @Resource
    private ISiteDao siteDao;

    /**
     * 初始化文章的缓存
     *
     * @return
     */
    public Map<Integer, Article> initArticleBuffer(Map<String, Object> siteBuffer) {
        Map<Integer, Article> articleBuffer = new LinkedHashMap<>();

        List<Article> ArticleBaseList = siteDao.findArticleBaseList();
        if (ArticleBaseList != null) {

            logger.info("初始化文章的缓存 size:" + ArticleBaseList.size());

            int articleCount = 0;
            int articleViewCount = 0;
            for (Article article : ArticleBaseList) {
                articleBuffer.put(article.getAid(), article);
                articleCount++;
                articleViewCount += article.getClick();
            }
            siteBuffer.put("articleCount", articleCount);
            siteBuffer.put("articleViewCount", articleViewCount);
        }
        return articleBuffer;
    }

    /**
     * 初始化用户的缓存
     *
     * @return
     */
    public Map<Integer, User> initUserBuffer(Map<Integer, Article> articleBuffer, List<Follow> followBuffer, Map<String, Object> siteBuffer) {

        Map<Integer, User> userBuffer = new LinkedHashMap<Integer, User>();

        List<User> userBaseList = siteDao.loadUserTable();
        if (userBaseList != null) {

            logger.info("初始化用户的缓存 size:" + userBaseList.size());

            //用户数
            int userCount = 0;

            for (User user : userBaseList) {

                //该用户文章数
                int userArticleCount = 0;
                userBuffer.put(user.getUid(), user);
                for (Article article : articleBuffer.values()) {
                    if (article.getAuthor().getUid() == user.getUid()) {
                        userArticleCount++;
                    }
                }
                user.setArticleCount(userArticleCount);

                int followCount = 0;
                int fansCount = 0;
                for (Follow follow : followBuffer) {
                    //关注数
                    if (follow.getUid() == user.getUid()) {
                        followCount++;
                    }
                    //粉丝数
                    if (follow.getFuid() == user.getUid()) {
                        fansCount++;
                    }
                }
                user.setFollowCount(followCount);
                user.setFansCount(fansCount);

                userCount++;
            }

            siteBuffer.put("userCount", userCount);
        }


        return userBuffer;
    }

    /**
     * 加载关注表
     *
     * @return
     */
    public List<Follow> initFollowBuffer() {
        return siteDao.loadFollowTable();
    }

    /**
     * 加载好友表
     *
     * @return
     */
    public List<Friend> initFriendBuffer() {
        return siteDao.loadFriendTable();
    }

    /**
     * 初始化 每种类型的数量
     *
     * @return
     */
    public List<Category> initCategoryCount() {
        logger.info("初始化文章类型 缓存");
        return siteDao.getCategoryCount();
    }

    /**
     * 统计每个tag的数量
     *
     * @param articleBuffer
     * @return
     */
    public List<Entry<String, Integer>> initTagCount(Map<Integer, Article> articleBuffer) {
        Map<String, Integer> map = new HashMap<String, Integer>();
        for (Article article : articleBuffer.values()) {
            //只统计公开文章的标签
            if (article.getPermission() == 0) {
                //例：#Hadoop#大数据#HA#学习笔记#ZK#JNS
                String tags = article.getTags();
                if (tags != null && !tags.equals("")) {
                    for (String tag : tags.split("#")) {
                        //过滤掉第一个""
                        if (!tag.equals("")) {
                            if (map.containsKey(tag))
                                map.put(tag, map.get(tag) + 1);
                            else
                                map.put(tag, 1);
                        }
                    }
                }
            }
        }
        List<Entry<String, Integer>> list = new ArrayList<Entry<String, Integer>>(map.entrySet());
        Collections.sort(list, new Comparator<Entry<String, Integer>>() {
            //降序排序
            public int compare(Entry<String, Integer> o1, Entry<String, Integer> o2) {
                return -o1.getValue().compareTo(o2.getValue());
            }
        });
        return list;
    }

}
