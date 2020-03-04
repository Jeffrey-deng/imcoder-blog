package site.imcoder.blog.cache;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Component;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.PermissionType;
import site.imcoder.blog.dao.ISiteDao;
import site.imcoder.blog.dao.IUserDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

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

    //依赖注入DAO
    @Resource
    private IUserDao userDao;

    /**
     * 初始化文章的缓存
     *
     * @return
     */
    public Map<Long, Article> initArticleBuffer(Cache cache) {

        Map<String, Object> siteBuffer = cache.siteBuffer;

        Map<Long, Article> articleBuffer = new LinkedHashMap<>();

        List<Article> ArticleBaseList = siteDao.findArticleBaseList();
        if (ArticleBaseList != null) {

            logger.info("初始化文章的缓存 size:" + ArticleBaseList.size());

            int articleCount = 0;
            int articleAccessCount = 0;
            for (Article article : ArticleBaseList) {
                articleBuffer.put(article.getAid(), article);
                articleCount++;
                articleAccessCount += article.getClick_count();
            }
            siteBuffer.put("article_count", articleCount);
            siteBuffer.put("article_access_count", articleAccessCount);
        }
        return articleBuffer;
    }

    /**
     * 初始化用户的缓存
     *
     * @return
     */
    public Map<Long, User> initUserBuffer(Cache cache) {

        Map<Long, Article> articleBuffer = cache.articleBuffer;
        List<Follow> followBuffer = cache.followBuffer;
        List<Friend> friendBuffer = cache.friendBuffer;
        Map<String, Object> siteBuffer = cache.siteBuffer;
        List<Category> categoryCount = cache.categoryCount;

        Map<Long, User> userBuffer = new LinkedHashMap<Long, User>();

        List<User> userBaseList = siteDao.loadUserTable();
        if (userBaseList != null) {

            logger.info("初始化用户的缓存 size:" + userBaseList.size());

            //用户数
            int userCount = 0;

            for (User user : userBaseList) {
                // 用户配置
                if (user.getUserSetting() == null || user.getUserSetting().isEmpty()) {
                    user.setUserSetting(userDao.findUserSetting(user));
                }

                UserStats userStats = new UserStats();
                user.setUserStats(userStats);
                List<Category> userArticleCateCount = Utils.copyListByJson(categoryCount, Category.class);
                for (Category category : userArticleCateCount) {
                    category.setCount(0);
                }
                userStats.setArticleCateCount(userArticleCateCount);

                // 该用户文章数
                int userArticleCount = 0;
                int userArticleClickCount = 0;
                int userArticleCommentCount = 0;
                int userArticleCollectCount = 0;
                int userArticleLikeCount = 0;
                userBuffer.put(user.getUid(), user);
                for (Article article : articleBuffer.values()) {
                    if (article.getAuthor().getUid().equals(user.getUid())) {
                        userArticleCount++;
                        for (Category category : userArticleCateCount) {
                            if (category.getAtid() == article.getCategory().getAtid()) {
                                category.setCount(category.getCount() + 1);
                            }
                        }
                        userArticleClickCount += article.getClick_count();
                        userArticleCommentCount += article.getComment_count();
                        userArticleCollectCount += article.getCollect_count();
                        // userArticleLikeCount += article.getLike();
                    }
                }
                for (Category category : userArticleCateCount) {
                    if (category.getAtid() == 0) {
                        category.setCount(userArticleCount);
                    }
                }
                userStats.setArticleCount(userArticleCount);
                userStats.setArticleClickCount(userArticleClickCount);
                userStats.setArticleCommentCount(userArticleCommentCount);
                userStats.setArticleCollectCount(userArticleCollectCount);
                userStats.setArticleLikeCount(userArticleLikeCount);

                int followingCount = 0; // 关注数
                int followerCount = 0; // 粉丝数
                int friendCount = 0; // 好友数
                for (Follow follow : followBuffer) {
                    if (follow.getFollowerUid().equals(user.getUid())) {
                        followingCount++;
                    }
                    if (follow.getFollowingUid().equals(user.getUid())) {
                        followerCount++;
                    }
                }
                for (Friend friend : friendBuffer) {
                    if (friend.getUid().equals(user.getUid())) {
                        friendCount++;
                    }
                }
                userStats.setFollowingCount(followingCount);
                userStats.setFollowerCount(followerCount);
                userStats.setFriendCount(friendCount);

                userCount++;
            }

            siteBuffer.put("user_count", userCount);
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
     * @param checkPermission 是否只统计公开文章的标签
     * @param articleBuffer
     * @param uid             大于0时只统计该用户的文章
     * @param cache
     * @return
     */
    public List<Entry<String, Integer>> initTagCount(boolean checkPermission, Map<Long, Article> articleBuffer, Long uid, Cache cache) {
        boolean isFindUser = IdUtil.containValue(uid);
        int feed_flow_allow_show_lowest_level = Config.getInt(ConfigConstants.FEED_FLOW_ALLOW_SHOW_LOWEST_LEVEL);
        Map<String, Integer> map = new HashMap<String, Integer>();
        for (Article article : articleBuffer.values()) {
            if (isFindUser && !article.getAuthor().getUid().equals(uid)) { //是否只统计某一个用户文章的标签
                continue;
            }
            if (checkPermission && article.getPermission() != PermissionType.PUBLIC.value) { //是否只统计公开文章的标签
                continue;
            }
            if (!isFindUser && checkPermission) {
                if (!cache.isFeedFlowAllowShow(true, article.getAuthor(), null, false, false, feed_flow_allow_show_lowest_level)) {
                    continue;
                }
            }
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
        List<Entry<String, Integer>> list = new ArrayList<Entry<String, Integer>>(map.entrySet());
        Collections.sort(list, new Comparator<Entry<String, Integer>>() {
            //降序排序
            public int compare(Entry<String, Integer> o1, Entry<String, Integer> o2) {
                return -o1.getValue().compareTo(o2.getValue());
            }
        });
        return list;
    }

    /**
     * 统计每个tag的数量
     *
     * @param cache
     * @return
     */
    public List<Entry<String, Integer>> initTagCount(Cache cache) {
        return initTagCount(true, cache.articleBuffer, 0L, cache);
    }

}
