package site.imcoder.blog.cache;

import org.apache.log4j.Logger;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import site.imcoder.blog.cache.sort.ArticleHotComparator;
import site.imcoder.blog.cache.sort.ArticleTimeComparator;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.PermissionType;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.annotation.Resource;
import java.util.*;
import java.util.Collection;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * 自定义的缓存数据结构
 * 用于存储常用数据
 *
 * @author dengchao
 * @date 2017-3-22
 */
@Component("cache")
//单例
@Scope("singleton")
@DependsOn({"configManager"})
public class Cache {

    private static Logger logger = Logger.getLogger(Cache.class);

    /**
     * 文章基本信息缓存Map { aid : article }
     */
    public Map<Long, Article> articleBuffer;

    /**
     * 计量数有更新的文章Set { aid }
     */
    public Set<Long> hasUpdateArticle;

    /**
     * 用户基本信息缓存Map { uid : user }
     */
    public Map<Long, User> userBuffer;

    /**
     * 计量数有更新的用户Set { uid }
     */
    public Set<Long> hasUpdateUser;

    /**
     * user_follow表 缓存
     */
    public List<Follow> followBuffer;

    /**
     * friend表 缓存
     */
    public List<Friend> friendBuffer;

    /**
     * 每种文章类型的数量 集合
     */
    public List<Category> categoryCount;

    /**
     * 每种标签的数量
     */
    public List<Entry<String, Integer>> tagCount;

    /**
     * 网站信息缓存Map { String : Object }
     */
    public Map<String, Object> siteBuffer;

    /**
     * 映射加密的token与未加密的token
     */
    public Map<String, String> loginTokensMap;

    /**
     * 每个用户独立持有的缓存池，key为用户id
     */
    public Map<Long, Map<String, Object>> userHoldCachePool;

    /**
     * 常量 ：读操作
     */
    public static final int READ = 0;

    /**
     * 常量 ：写操作
     */
    public static final int WRITE = 1;

    /**
     * 持久化缓存工具类
     */
    @Resource
    private FlushCacheTool flushTool;

    /**
     * 初始化缓存工具类
     */
    @Resource
    private InitCacheTool initTool;

    @Resource
    private ArticleHotComparator articleHotComparator;

    @Resource
    private ArticleTimeComparator articleTimeComparator;

    @Resource
    private FlushCacheTimer flushCacheTimer;

    private boolean isInit = false;

    /**
     * 初始化
     */
    @PostConstruct
    public void initCache() {
        logger.info("Cache 执行 初始化 ");

        hasUpdateArticle = ConcurrentHashMap.newKeySet();
        hasUpdateUser = ConcurrentHashMap.newKeySet();
        siteBuffer = new ConcurrentHashMap<>();
        loginTokensMap = new ConcurrentHashMap<>();

        categoryCount = initTool.initCategoryCount();
        followBuffer = initTool.initFollowBuffer();
        friendBuffer = initTool.initFriendBuffer();

        articleBuffer = initTool.initArticleBuffer(this);
        userBuffer = initTool.initUserBuffer(this);

        tagCount = initTool.initTagCount(this);

        userHoldCachePool = new ConcurrentHashMap<>();

        siteBuffer.put("total_access_count", siteBuffer.get("article_access_count")); // 总访问量
        siteBuffer.put("today_date_mark", Utils.formatDate(new Date(), "yyyy-MM-dd")); // 标记同一日
        siteBuffer.put("today_access_count", 0); // 网站一天的访问量

        //启动 flush 定时器
        flushCacheTimer.schedule(this);

        isInit = true;
    }

    /**
     * 停止cache
     */
    @PreDestroy
    public void stop() {
        //先刷入数据
        flush();
        // 保存今日访问量
        logger.info("Site today_access_count in [" + (String) siteBuffer.get("today_date_mark") + "] is [" + siteBuffer.get("today_access_count") + "]");
        //停止flush定时器
        flushCacheTimer.stop();
        logger.info("Cache 停止! ");
    }

    /**
     * 是否初始化
     *
     * @return
     */
    public boolean isInit() {
        return isInit;
    }

    /**
     * 刷新当前数据到数据库
     */
    public void flush() {
        //..
        flushTool.flushArticleCache(articleBuffer, hasUpdateArticle);
    }

    /**
     * 重新读取缓存
     */
    public void reload() {
        logger.info("重新读取数据库初始化缓存池");
        stop();
        staticClickRankList = null;
        staticTimeRankList = null;
        staticTagRankList = null;
        flushCacheTimer = new FlushCacheTimer();
        initCache();
    }

    /**
     * 返回该用户独享的缓存池
     *
     * @param user
     * @return
     */
    public synchronized Map<String, Object> getUserHoldCache(User user) {
        return userHoldCachePool.computeIfAbsent(user.getUid(), key -> new ConcurrentHashMap<>());
    }

    /**
     * 填充文章的统计量为缓存中的最新数据
     *
     * @param articleList
     */
    public void fillArticleStats(List<Article> articleList) {
        if (articleList != null) {
            for (Article article : articleList) {
                fillArticleStats(article);
            }
        }
    }

    /**
     * 填充文章的统计量为缓存中的最新数据
     *
     * @param article
     */
    public void fillArticleStats(Article article) {
        if (article != null) {
            Article _article = articleBuffer.get(article.getAid());
            if (_article != null) {
                article.setClick_count(_article.getClick_count());
                article.setComment_count(_article.getComment_count());
                article.setCollect_count(_article.getCollect_count());
            } else {
                logger.warn("fillArticleStats error：文章 " + article.getAid() + " 未从缓存中找到数据！");
            }
        }
    }

    /**
     * 得到用户统计信息 例：关注数，粉丝数，文章数
     *
     * @param user
     * @return
     */
    public User fillUserStats(User user) {
        return fillUserStats(user, true);
    }

    /**
     * 得到用户统计信息 例：关注数，粉丝数，文章数
     *
     * @param userList
     */
    public void fillUserStats(List<User> userList) {
        if (userList != null) {
            for (User user : userList) {
                fillUserStats(user);
            }
        }
    }

    /**
     * 得到用户统计信息 例：关注数，粉丝数，文章数
     *
     * @param user
     * @param security 是否保护隐私信息
     * @return
     */
    public User fillUserStats(User user, boolean security) {
        if (user != null) {
            User _user = userBuffer.get(user.getUid());
            if (_user != null) {
                UserStatus userStatus = user.getUserStatus(); // 状态信息
                UserStatus _userStatus = _user.getUserStatus();
                UserStats userStats = null; // 统计信息
                UserStats _userStats = _user.getUserStats();
                if (userStatus == null) {
                    userStatus = new UserStatus();
                    user.setUserStatus(userStatus);
                }
                userStats = Utils.copyBeanByJson(_userStats);
                user.setUserStats(userStats);
                if (security == false && userStatus.getLast_login_ip() == null) {
                    userStatus.setLast_login_ip(_userStatus.getLast_login_ip());
                }
            } else {
                logger.warn("fillUserStats error：用户 " + user.getUid() + " 未从缓存中找到数据！");
            }
        }
        return user;
    }

    /**
     * 通过文章ID获取对象，并且如果取的目的是写，就会将此id添加 更新了 的标记
     *
     * @param aid 文章id
     * @param rw  目的是 读还是写{ Cache.WRITE:写 , Cache.READ:读 }
     * @return
     */
    public Article getArticle(Long aid, int rw) {
        Article article = articleBuffer.get(aid);
        if (article != null && rw == Cache.WRITE) {
            hasUpdateArticle.add(aid);
        }
        return article;
    }

    /**
     * 得到文章的相邻文章
     *
     * @param aid
     * @param rw
     * @return
     */
    public Map<String, Article> getAdjacentArticle(Long aid, int rw) {
        Map<String, Article> map = new HashMap<>();
        int size = this.articleBuffer.size();
        if (size == 0) {
            return map;
        }
        //    // aid使用了Long所以此方法作废
        //    Long index = aid;
        //    Long maxAid = ((Article) getTimeSortArticle(0).get(0)).getAid();
        //    Article pre = null;
        //    Article next = null;
        //    while (--index > 0) {
        //        pre = this.getArticle(index, rw);
        //        if (pre != null && pre.getPermission() == PermissionType.PUBLIC.value) {
        //            break;
        //        }
        //    }
        //    index = aid;
        //    while (++index <= maxAid) {
        //        next = this.getArticle(index, rw);
        //        if (next != null && next.getPermission() == PermissionType.PUBLIC.value) {
        //            break;
        //        }
        //    }
        List<Article> timeSortArticle = new ArrayList<Article>(articleBuffer.values());
        Collections.sort(timeSortArticle, articleTimeComparator); // 倒序
        Article pre = null;
        Article next = null;
        int feed_flow_allow_show_lowest_level = Config.getInt(ConfigConstants.FEED_FLOW_ALLOW_SHOW_LOWEST_LEVEL);
        for (int i = 0; i < timeSortArticle.size(); i++) {
            Article queryArticle = timeSortArticle.get(i);
            if (queryArticle.getAid().equals(aid)) {
                int j = i;
                while (pre == null && (j + 1) <= (timeSortArticle.size() - 1)) {
                    pre = timeSortArticle.get(j + 1);
                    if (pre.getPermission() != PermissionType.PUBLIC.value) {
                        pre = null;
                    } else if (!queryArticle.getAuthor().getUid().equals(pre.getAuthor().getUid()) &&
                            !isFeedFlowAllowShow(true, pre.getAuthor(), null, false, false, feed_flow_allow_show_lowest_level)) {
                        pre = null;
                    }
                    j++;
                }
                j = i;
                while (next == null && (j - 1) >= 0) {
                    next = timeSortArticle.get(j - 1);
                    if (next.getPermission() != PermissionType.PUBLIC.value) {
                        next = null;
                    } else if (!queryArticle.getAuthor().getUid().equals(next.getAuthor().getUid()) &&
                            !isFeedFlowAllowShow(true, next.getAuthor(), null, false, false, feed_flow_allow_show_lowest_level)) {
                        pre = null;
                    }
                    j--;
                }
            }
        }
        map.put("preArticle", pre);
        map.put("nextArticle", next);
        return map;
    }

    /**
     * 通过用户ID获取对象，并且如果取的目的是写，就会将此uid添加<b>更新了</b>的标记
     *
     * @param uid 文章id
     * @param rw  目的是 读还是写
     *            Cache.WRITE 写
     *            Cache.READ 读
     * @return user 用户
     */
    public User getUser(Long uid, int rw) {
        User user = userBuffer.get(uid);
        if (user != null && rw == Cache.WRITE) {
            hasUpdateUser.add(uid);
        }
        return user;
    }

    /**
     * 克隆一个用户对象，不包含隐私信息
     *
     * @param user
     * @return
     */
    public User cloneSafetyUser(User user) {
        if (user != null) {
            User fullUser = getUser(user.getUid(), Cache.READ);
            if (fullUser != null) {
                User newUser = null;
                try {
                    // PropertyUtils.copyProperties(newUser, fullUser); // 浅复制，不能复制list,array,map
                    newUser = Utils.copyBeanByJson(fullUser);
                    newUser.setUserAuths(null);
                    newUser.setEmail(null);
                    newUser.setUserSetting(null);
                    newUser.setUserStatus(null);
                    return newUser;
                } catch (Exception e) {
                    logger.error("", e);
                }
            }
        }
        return null;
    }

    /**
     * 克隆一个用户对象, 供管理员使用
     *
     * @param user
     * @return
     */
    public User cloneUser(User user) {
        if (user != null) {
            User fullUser = getUser(user.getUid(), Cache.READ);
            if (fullUser != null) {
                User newUser = null;
                try {
                    // PropertyUtils.copyProperties(newUser, fullUser);
                    newUser = Utils.copyBeanByJson(fullUser);
                    newUser.setUserAuths(null);
                    return newUser;
                } catch (Exception e) {
                }
            }
        }
        return null;
    }

    /**
     * 返回用户配置
     *
     * @param user
     * @return
     */
    public UserSetting getUserSetting(User user) {
        if (user != null) {
            User cacheUser = getUser(user.getUid(), READ);
            if (cacheUser != null) {
                return cacheUser.getUserSetting();
            }
        }
        return null;
    }

    /**
     * 获取管理员列表
     *
     * @return
     */
    public List<User> getManagers() {
        List<User> managers = new ArrayList<User>();
        for (User user : userBuffer.values()) {
            if (user.getUserGroup().isManager()) {
                managers.add(user);
            }
        }
        return managers;
    }

    /**
     * 是否有新更新的数据
     *
     * @return flag
     * 如果有 返回true
     * 如果没有 返回false
     */
    public boolean isHasNewUpdate() {
        boolean flag = true;
        if (hasUpdateUser.size() == 0 && hasUpdateArticle.size() == 0) {
            flag = false;
        }
        return flag;
    }

    /**
     * 得到该用户可见的文章
     *
     * @param uid
     * @param loginUser
     * @return
     */
    public List<Article> getVisibleArticles(Long uid, User loginUser) {
        Collection<Article> values = articleBuffer.values();
        boolean feed_flow_allow_following_show = Config.getBoolean(ConfigConstants.FEED_FLOW_ALLOW_FOLLOWING_SHOW);
        int feed_flow_allow_show_lowest_level = Config.getInt(ConfigConstants.FEED_FLOW_ALLOW_SHOW_LOWEST_LEVEL);
        List<Article> list = new ArrayList<>();
        if (loginUser == null || !IdUtil.containValue(loginUser.getUid())) { // 未登录只返回公开的
            for (Article article : values) {
                if (article.getPermission() != PermissionType.PUBLIC.value) {
                    continue;
                }
                if (uid == null || uid.equals(0L)) {
                    if (isFeedFlowAllowShow(true, article.getAuthor(), null, false, false, feed_flow_allow_show_lowest_level)) {
                        list.add(article);
                    }
                } else if (article.getAuthor().getUid().equals(uid)) {
                    list.add(article);
                }
            }
        } else if (IdUtil.containValue(uid)) {
            boolean isHimself = loginUser.getUid().equals(uid);
            boolean isFriend = containsFriend(new Friend(loginUser.getUid(), uid)) == 2;
            boolean isFollower = containsFollow(new Follow(loginUser.getUid(), uid)) > 0;
            boolean isFollowing = containsFollow(new Follow(uid, loginUser.getUid())) > 0;
            for (Article article : values) {
                int permission = article.getPermission();
                if (article.getAuthor().getUid().equals(uid)) {
                    if (isHimself || (permission == PermissionType.PUBLIC.value)
                            || (permission == PermissionType.LOGIN_ONLY.value)
                            || (permission == PermissionType.FOLLOWER_ONLY.value && isFollower)
                            || (permission == PermissionType.FOLLOWING_ONLY.value && isFollowing)
                            || (permission == PermissionType.FRIEND_ONLY.value && isFriend)) {
                        list.add(article);
                    }
                }
            }
        } else {
            Long loginUid = loginUser.getUid();
            List<Long> friendList = new ArrayList<Long>();
            for (Friend f : friendBuffer) {
                if (f.getUid().equals(loginUid)) {
                    friendList.add(f.getFid());
                }
            }
            List<Long> followerList = new ArrayList<Long>();
            for (Follow fw : followBuffer) {
                if (fw.getFollowingUid().equals(loginUid)) {
                    followerList.add(fw.getFollowerUid());
                }
            }
            List<Long> followingList = new ArrayList<Long>();
            for (Follow fw : followBuffer) {
                if (fw.getFollowerUid().equals(loginUid)) {
                    followingList.add(fw.getFollowingUid());
                }
            }
            for (Article article : values) {
                int permission = article.getPermission();
                Long author_uid = article.getAuthor().getUid();
                if (loginUid.equals(author_uid) || (permission == PermissionType.PUBLIC.value)
                        || (permission == PermissionType.LOGIN_ONLY.value)
                        || (permission == PermissionType.FOLLOWER_ONLY.value && followingList.contains(author_uid))
                        || (permission == PermissionType.FOLLOWING_ONLY.value && followerList.contains(author_uid))
                        || (permission == PermissionType.FRIEND_ONLY.value && friendList.contains(author_uid))) {
                    if (isFeedFlowAllowShow(true, article.getAuthor(), loginUser, followingList.contains(author_uid), feed_flow_allow_following_show, feed_flow_allow_show_lowest_level)) {
                        list.add(article);
                    }
                }
            }
        }
        return list;
    }

    private ReadWriteLock staticClickRankListLock = new ReentrantReadWriteLock();
    private List<Article> staticClickRankList;
    private long clickRankListLastViewTime = System.currentTimeMillis();
    private int clickRankListLastViewSize = 0;

    /**
     * 得到缓存中按热门程序排序公开的文章
     *
     * @param size list长度
     * @return List<Article>
     */
    public List<Article> getHotSortArticle(int size) {
        staticClickRankListLock.readLock().lock();
        long time = System.currentTimeMillis();
        try {
            if (size == clickRankListLastViewSize && staticClickRankList != null) {
                if (time - 60 * 1000 * 15 < clickRankListLastViewTime) {
                    return staticClickRankList;
                }
            }
        } finally {
            staticClickRankListLock.readLock().unlock(); // 先释放读锁才能获得写锁
        }
        staticClickRankListLock.writeLock().lock();
        try {
            int feed_flow_allow_show_lowest_level = Config.getInt(ConfigConstants.FEED_FLOW_ALLOW_SHOW_LOWEST_LEVEL);
            List<Article> hotSortArticle = new ArrayList<>();
            for (Article article : articleBuffer.values()) {
                // 只返回公开文章
                if (article.getPermission() == PermissionType.PUBLIC.value &&
                        isFeedFlowAllowShow(true, article.getAuthor(), null, false, false, feed_flow_allow_show_lowest_level)) {
                    hotSortArticle.add(article);
                }
            }
            Collections.sort(hotSortArticle, articleHotComparator);
            // 防止 该user 文章数 小于 num
            if (hotSortArticle.size() < size) {
                size = hotSortArticle.size();
            }
            List<Article> clickRankList = new ArrayList<>(size);
            for (int i = 0; i < size; i++) {
                clickRankList.add(hotSortArticle.get(i));
            }
            clickRankListLastViewTime = time;
            clickRankListLastViewSize = size;
            staticClickRankList = clickRankList;
            return clickRankList;
        } finally {
            staticClickRankListLock.writeLock().unlock();
        }
    }

    /**
     * 得到按热门程序排序的文章
     *
     * @param uid         是否查询所有还是单个用户 uid=0 为查询所有
     * @param size
     * @param visibleList 如果传入文章列表则统计此列表
     * @return
     */
    public List<Article> getHotSortArticle(Long uid, int size, List<Article> visibleList) {
        if (visibleList == null) {
            if (!IdUtil.containValue(uid)) {
                return getHotSortArticle(size);
            } else {
                visibleList = getVisibleArticles(uid, null);
            }
        }
        Collections.sort(visibleList, articleHotComparator);
        // 防止 该user 文章数 小于 num
        if (visibleList.size() < size) {
            size = visibleList.size();
        }
        List<Article> clickRankList = new ArrayList<Article>(size);
        for (int i = 0; i < size; i++) {
            clickRankList.add(visibleList.get(i));
        }
        return clickRankList;
    }

    /**
     * 得到按热门程序排序的文章
     *
     * @param uid       是否查询所有还是单个用户 uid=0 为查询所有
     * @param size
     * @param loginUser 传入loginUser则鉴权，否则只返回公开文章
     * @return
     */
    public List<Article> getHotSortArticle(Long uid, int size, User loginUser) {
        if (!IdUtil.containValue(uid) && (loginUser == null || !IdUtil.containValue(loginUser.getUid()))) {
            return getHotSortArticle(size);
        } else {
            return getHotSortArticle(uid, size, getVisibleArticles(uid, loginUser));
        }
    }

    private ReadWriteLock staticTimeRankListLock = new ReentrantReadWriteLock();
    private List<Article> staticTimeRankList;
    private long timeRankListLastViewTime = System.currentTimeMillis();
    private int timeRankListLastViewSize = 0;

    /**
     * 得到缓存中按时间排序的公开的文章
     *
     * @param size list长度
     * @return List<Article>
     */
    public List<Article> getTimeSortArticle(int size) {
        staticTimeRankListLock.readLock().lock();
        if (size == 0) {
            size = Config.getInt(ConfigConstants.ARTICLE_HOME_SIZE_RANK);
        }
        long time = System.currentTimeMillis();
        try {
            if (size == timeRankListLastViewSize && staticTimeRankList != null) {
                if (time - 60 * 1000 * 10 < timeRankListLastViewTime) {
                    return staticTimeRankList;
                }
            }
        } finally {
            staticTimeRankListLock.readLock().unlock();
        }
        staticClickRankListLock.writeLock().lock();
        try {
            int feed_flow_allow_show_lowest_level = Config.getInt(ConfigConstants.FEED_FLOW_ALLOW_SHOW_LOWEST_LEVEL);
            List<Article> timeSortArticle = new ArrayList<>();
            for (Article article : articleBuffer.values()) {
                // 只返回公开文章
                if (article.getPermission() == PermissionType.PUBLIC.value &&
                        isFeedFlowAllowShow(true, article.getAuthor(), null, false, false, feed_flow_allow_show_lowest_level)) {
                    timeSortArticle.add(article);
                }
            }
            Collections.sort(timeSortArticle, articleTimeComparator);
            // 防止 该user 文章数 小于 num
            if (timeSortArticle.size() < size) {
                size = timeSortArticle.size();
            }
            List<Article> newestList = new ArrayList<>(size);
            for (int i = 0; i < size; i++) {
                newestList.add(timeSortArticle.get(i));
            }
            timeRankListLastViewTime = time;
            timeRankListLastViewSize = size;
            staticTimeRankList = newestList;
            return newestList;
        } finally {
            staticClickRankListLock.writeLock().unlock();
        }
    }

    /**
     * 得到按按时间排序的文章
     *
     * @param uid         是否查询所有还是单个用户 uid=0 为查询所有
     * @param size
     * @param visibleList 如果传入文章列表则统计此列表
     * @return
     */
    public List<Article> getTimeSortArticle(Long uid, int size, List<Article> visibleList) {
        if (visibleList == null) {
            if (!IdUtil.containValue(uid)) {
                return getTimeSortArticle(size);
            } else {
                visibleList = getVisibleArticles(uid, null);
            }
        }
        Collections.sort(visibleList, articleTimeComparator);
        // 防止 该user 文章数 小于 num
        if (visibleList.size() < size) {
            size = visibleList.size();
        }
        List<Article> newestList = new ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            newestList.add(visibleList.get(i));
        }
        return newestList;
    }

    /**
     * 得到按按时间排序的文章
     *
     * @param uid       是否查询所有还是单个用户 uid=0 为查询所有
     * @param size
     * @param loginUser 传入loginUser则鉴权，否则只返回公开文章
     * @return
     */
    public List<Article> getTimeSortArticle(Long uid, int size, User loginUser) {
        if (!IdUtil.containValue(uid) && (loginUser == null || !IdUtil.containValue(loginUser.getUid()))) {
            return getTimeSortArticle(size);
        } else {
            return getTimeSortArticle(uid, size, getVisibleArticles(uid, loginUser));
        }
    }

    private ReadWriteLock staticTagRankListLock = new ReentrantReadWriteLock();
    private List<Entry<String, Integer>> staticTagRankList;
    private long tagRankListLastViewTime = System.currentTimeMillis();
    private int tagRankListLastViewSize = 0;

    /**
     * 得到缓存中每种标签数量从大到小的集合
     *
     * @param size
     * @return
     */
    public List<Entry<String, Integer>> getTagCount(int size) {
        staticTagRankListLock.readLock().lock();
        List<Entry<String, Integer>> tagList = tagCount;
        long time = System.currentTimeMillis();
        try {
            if (size == 0) { // site为0时，返回全部标签
                return tagList;
            }
            if (size == tagRankListLastViewSize && staticTagRankList != null) {
                if (time - 60 * 1000 * 15 < tagRankListLastViewTime) {
                    return staticTagRankList;
                }
            }
        } finally {
            staticTagRankListLock.readLock().unlock();
        }
        staticTagRankListLock.writeLock().lock();
        try {
            List<Entry<String, Integer>> list = new ArrayList<>();
            if (tagList.size() < size) {
                size = tagList.size();
            }
            for (int i = 0; i < size; i++) {
                list.add(tagList.get(i));
            }
            Collections.sort(list, new Comparator<Entry<String, Integer>>() {
                // 降序排序
                public int compare(Entry<String, Integer> o1, Entry<String, Integer> o2) {
                    return -o1.getValue().compareTo(o2.getValue());
                }
            });
            tagRankListLastViewTime = time;
            tagRankListLastViewSize = size;
            staticTagRankList = list;
            return list;
        } finally {
            staticTagRankListLock.writeLock().unlock();
        }
    }

    /**
     * 得到每种标签数量从大到小的集合
     *
     * @param uid         是否查询所有还是单个用户 uid=0 为查询所有
     * @param size        list长度
     * @param visibleList 如果传入文章列表则统计此列表的标签
     * @return
     */
    public List<Entry<String, Integer>> getTagCount(Long uid, int size, List<Article> visibleList) {
        List<Entry<String, Integer>> tagList = tagCount;
        Map<Long, Article> articleMap = articleBuffer;

        if (visibleList != null) { // if has visibleList, calc visibleList's tags
            articleMap = new LinkedHashMap<>();
            for (Article article : visibleList) {
                articleMap.put(article.getAid(), article);
            }
            tagList = initTool.initTagCount(false, articleMap, uid, this); // get the visible article List's  tags
        } else if (uid > 0) {
            tagList = initTool.initTagCount(true, articleMap, uid, this); // get the user's article tags
        } else {
            return getTagCount(size); // 直接返回缓存
        }

        if (size == 0) { // site为0时，返回全部标签
            return tagList;
        }

        List<Entry<String, Integer>> list = new ArrayList<Entry<String, Integer>>();
        if (tagList.size() < size) {
            size = tagList.size();
        }
        for (int i = 0; i < size; i++) {
            list.add(tagList.get(i));
        }
        Collections.sort(list, new Comparator<Entry<String, Integer>>() {
            // 降序排序
            public int compare(Entry<String, Integer> o1, Entry<String, Integer> o2) {
                return -o1.getValue().compareTo(o2.getValue());
            }
        });
        return list;
    }

    /**
     * 得到每种标签数量从大到小的集合
     *
     * @param uid       是否查询所有还是单个用户 uid=0 为查询所有
     * @param size      list长度
     * @param loginUser 传入loginUser则鉴权，否则只返回公开文章
     * @return
     */
    public List<Entry<String, Integer>> getTagCount(Long uid, int size, User loginUser) {
        if (!IdUtil.containValue(uid) && loginUser == null) {
            return getTagCount(size);
        } else {
            return getTagCount(uid, size, getVisibleArticles(uid, loginUser));
        }
    }

    /**
     * 刷新tagCount公开缓存
     * todo: 此接口的调用都在Cache类内部，所以暂时没有加锁，如果以后要在外部调用，记得加锁
     */
    public void calcRefreshTagCount() {
        tagCount = initTool.initTagCount(this);
        staticTagRankList = null;
    }

    /**
     * description:得到每种文章类型的数量集合
     *
     * @return List<Category>
     */
    public List<Category> getCategoryCount() {
        return categoryCount;
    }

    /**
     * 添加文章行
     *
     * @param article
     * @param user
     */
    public synchronized void putArticle(Article article, User user) {
        articleBuffer.put(article.getAid(), article);
        // 统计量更新
        updateCategoryCount(article, 1);
        updateUserArticleCount(user, 1);
        siteBuffer.put("article_count", (Integer) siteBuffer.get("article_count") + 1);
        staticClickRankList = null;
        staticTimeRankList = null;
        staticTagRankList = null;
        if (article.getPermission() == PermissionType.PUBLIC.value) {
            calcRefreshTagCount();
        }
    }

    /**
     * 移除文章行
     *
     * @param article
     * @param user
     */
    public synchronized void removeArticle(Article article, User user) {
        articleBuffer.remove(article.getAid());
        hasUpdateArticle.remove(article.getAid());

        // 统计量更新
        updateCategoryCount(article, -1);
        updateUserArticleCount(user, -1);
        siteBuffer.put("article_count", (Integer) siteBuffer.get("article_count") - 1);
        staticClickRankList = null;
        staticTimeRankList = null;
        staticTagRankList = null;
        calcRefreshTagCount();
    }


    /**
     * 更新文章
     *
     * @param article
     * @param user
     */
    public synchronized void updateArticle(Article article, User user) {
        User author = getUser(user.getUid(), WRITE);
        Article beforeArticle = getArticle(article.getAid(), Cache.READ);
        fillArticleStats(article);
        articleBuffer.put(article.getAid(), article);
        // 统计量更新
        updateCategoryCount(beforeArticle, -1);
        updateCategoryCount(article, 1);
        staticClickRankList = null;
        staticTimeRankList = null;
        staticTagRankList = null;
        calcRefreshTagCount();
    }

    /**
     * 添加用户行
     *
     * @param user
     */
    public synchronized void putUser(User user) {
        User cacheUser = getUser(user.getUid(), READ);
        if (cacheUser != null && user.getUserSetting() == null) {
            user.setUserSetting(cacheUser.getUserSetting());
        }
        userBuffer.put(user.getUid(), user);
        siteBuffer.put("user_count", (Integer) siteBuffer.get("user_count") + 1);
    }

    /**
     * 移除用户行
     *
     * @param user
     */
    public synchronized void removeUser(User user) {
        userBuffer.remove(user.getUid());
        hasUpdateUser.remove(user.getUid());
        siteBuffer.put("user_count", (Integer) siteBuffer.get("user_count") - 1);
    }

    /**
     * 更新用户
     *
     * @param user
     */
    public synchronized void updateUser(User user) {
        fillUserStats(user, false);
        User cacheUser = getUser(user.getUid(), READ);
        if (cacheUser != null && user.getUserSetting() == null) {
            user.setUserSetting(cacheUser.getUserSetting());
        }
        userBuffer.put(user.getUid(), user);
    }

    /**
     * 添加关注行
     *
     * @param follow
     */
    public synchronized void putFollow(Follow follow) {
        if (containsFollow(follow) == 0) {
            this.followBuffer.add(follow);
            // 更新统计量
            User followerUser = new User(follow.getFollowerUid());
            updateUserFollowingCount(followerUser, 1);
            User followingUser = new User(follow.getFollowingUid());
            updateUserFollowerCount(followingUser, 1);
        }
    }

    /**
     * 移除关注行
     *
     * @param follow
     */
    public synchronized void removeFollow(Follow follow) {
        Iterator<Follow> iterator = followBuffer.iterator();
        while (iterator.hasNext()) {
            Follow f = iterator.next();
            if (f.getFollowerUid().equals(follow.getFollowerUid()) && f.getFollowingUid().equals(follow.getFollowingUid())) {
                //只能用iterator.remove删除，不能用foreach + followBuffer.remove(follow)删除
                //不然会抛java.util.ConcurrentModificationException 异常
                iterator.remove();
                // 更新统计量
                User followerUser = new User(follow.getFollowerUid());
                updateUserFollowingCount(followerUser, -1);
                User followingUser = new User(follow.getFollowingUid());
                updateUserFollowerCount(followingUser, -1);
            }

        }
    }

    /**
     * 是否包含关注行
     *
     * @param follow
     * @return
     */
    public int containsFollow(Follow follow) {
        int row = 0;
        for (Follow f : followBuffer) {
            if (f.getFollowerUid().equals(follow.getFollowerUid()) && f.getFollowingUid().equals(follow.getFollowingUid())) {
                row += 1;
                break;
            }
        }
        return row;
    }

    /**
     * 添加好友行
     *
     * @param friend
     */
    public synchronized void putFriend(Friend friend) {
        if (containsFriend(friend) == 0) {
            this.friendBuffer.add(friend);
            this.friendBuffer.add(new Friend(friend.getFid(), friend.getUid()));
            // 更新统计量
            User user = getUser(friend.getUid(), Cache.WRITE);
            if (user != null) {
                user.getUserStats().setFriendCount(user.getUserStats().getFriendCount() + 1);
            }
            User otherUser = getUser(friend.getFid(), Cache.WRITE);
            if (otherUser != null) {
                otherUser.getUserStats().setFriendCount(otherUser.getUserStats().getFriendCount() + 1);
            }
        }
    }

    /**
     * 移除好友行
     *
     * @param friend
     */
    public synchronized void removeFriend(Friend friend) {
        Iterator<Friend> iterator = friendBuffer.iterator();
        while (iterator.hasNext()) {
            Friend f = iterator.next();
            if (f.getUid().equals(friend.getUid()) && f.getFid().equals(friend.getFid())) {
                //只能用iterator.remove删除，不能用foreach + friendBuffer.remove(friend)删除
                //不然会抛java.util.ConcurrentModificationException 异常
                iterator.remove();
                // 更新统计量
                User user = getUser(friend.getUid(), Cache.WRITE);
                if (user != null) {
                    user.getUserStats().setFriendCount(user.getUserStats().getFriendCount() - 1);
                }
            } else if (f.getUid().equals(friend.getFid()) && f.getFid().equals(friend.getUid())) {
                iterator.remove();
                User otherUser = getUser(friend.getFid(), Cache.WRITE);
                if (otherUser != null) {
                    otherUser.getUserStats().setFriendCount(otherUser.getUserStats().getFriendCount() - 1);
                }
            }
        }
    }

    /**
     * 是否包含好友行
     *
     * @param friend
     * @return
     */
    public int containsFriend(Friend friend) {
        int row = 0;
        for (Friend f : friendBuffer) {
            if ((f.getUid().equals(friend.getUid()) && f.getFid().equals(friend.getFid())) || (f.getUid().equals(friend.getFid()) && f.getFid().equals(friend.getUid()))) {
                row += 1;
            }
        }
        return row;
    }


    /** -------------- 更新统计量接口 ----------------**/

    /**
     * 更新文章收藏数接口
     *
     * @param article
     * @param step
     */
    public synchronized void updateArticleCollectCount(Article article, int step) {
        Article _article = getArticle(article.getAid(), Cache.WRITE);
        if (_article != null) {
            _article.setCollect_count(_article.getCollect_count() + step);
            UserStats userStats = getUser(_article.getAuthor().getUid(), WRITE).getUserStats();
            userStats.setArticleCollectCount(userStats.getArticleCollectCount() + step);
        }
    }

    /**
     * 更新文章点击量数接口
     *
     * @param article
     * @param step
     */
    public synchronized void updateArticleClickCount(Article article, int step) {
        Article _article = getArticle(article.getAid(), Cache.WRITE);
        if (_article != null) {
            _article.setClick_count(_article.getClick_count() + step);
            siteBuffer.put("article_access_count", (Integer) siteBuffer.get("article_access_count") + step);
            UserStats userStats = getUser(_article.getAuthor().getUid(), WRITE).getUserStats();
            userStats.setArticleClickCount(userStats.getArticleClickCount() + step);
        }
    }

    /**
     * 更新文章评论数接口
     *
     * @param article
     * @param step
     */
    public synchronized void updateArticleCommentCount(Article article, int step) {
        Article _article = getArticle(article.getAid(), Cache.WRITE);
        if (_article != null) {
            _article.setComment_count(_article.getComment_count() + step);
            if (_article.getComment_count() < 0) {
                _article.setComment_count(0);
            }
            UserStats userStats = getUser(_article.getAuthor().getUid(), WRITE).getUserStats();
            userStats.setArticleCommentCount(userStats.getArticleCommentCount() + step);
        }
    }

    /**
     * 更新每个标签文章数接口
     *
     * @param tag
     * @param step
     * @deprecated 已失效
     */
    public void updateTagCount(String tag, int step) {
        boolean isFound = false;
        for (Entry<String, Integer> entry : this.tagCount) {
            int index = tag.indexOf(entry.getKey());
            if (index != -1) {
                entry.setValue(entry.getValue() + step);
                if (isFound == false && index == 0 && tag.length() == entry.getKey().length()) {
                    isFound = true;
                }
            }
        }
        if (step > 0 && !isFound) { // 没有此标签，则添加
            this.tagCount.add(new AbstractMap.SimpleEntry<>(tag, step));
        }
    }

    /**
     * 更新每个分类文章数接口
     * todo: 此接口的调用都在Cache类内部，所以暂时没有加锁，如果以后要在外部调用，记得加锁
     *
     * @param article - 需要传入aid和atid
     * @param step
     */
    public void updateCategoryCount(Article article, int step) {
        Category category = article.getCategory();
        for (Category _category : categoryCount) {
            if (_category.getAtid() == category.getAtid()) {
                _category.setCount(_category.getCount() + step);
                break;
            }
        }
        User author = getUser(getArticle(article.getAid(), READ).getAuthor().getUid(), WRITE);
        for (Category _category : author.getUserStats().getArticleCateCount()) {
            if (_category.getAtid() == category.getAtid()) {
                _category.setCount(_category.getCount() + step);
            }
        }
        if (category.getAtid() != 0) { // 默认类型也跟着改变
            for (Category _category : categoryCount) {
                if (_category.getAtid() == 0) {
                    _category.setCount(_category.getCount() + step);
                    break;
                }
            }
            for (Category _category : author.getUserStats().getArticleCateCount()) {
                if (_category.getAtid() == 0) {
                    _category.setCount(_category.getCount() + step);
                }
            }
        }
    }

    /**
     * 更新用户的文章数
     * todo: 此接口的调用都在Cache类内部，所以暂时没有加锁，如果以后要在外部调用，记得加锁
     *
     * @param user
     * @param step
     */
    public void updateUserArticleCount(User user, int step) {
        User _user = getUser(user.getUid(), Cache.WRITE);
        if (_user != null) {
            _user.getUserStats().setArticleCount(_user.getUserStats().getArticleCount() + step);
        }
    }

    /**
     * 更新用户的关注数
     * todo: 此接口的调用都在Cache类内部，所以暂时没有加锁，如果以后要在外部调用，记得加锁
     *
     * @param user
     * @param step
     */
    public void updateUserFollowingCount(User user, int step) {
        User _user = getUser(user.getUid(), Cache.WRITE);
        if (_user != null) {
            _user.getUserStats().setFollowingCount(_user.getUserStats().getFollowingCount() + step);
        }
    }

    /**
     * 更新用户的粉丝数
     * todo: 此接口的调用都在Cache类内部，所以暂时没有加锁，如果以后要在外部调用，记得加锁
     *
     * @param user
     * @param step
     */
    public void updateUserFollowerCount(User user, int step) {
        User _user = getUser(user.getUid(), Cache.WRITE);
        if (_user != null) {
            _user.getUserStats().setFollowerCount(_user.getUserStats().getFollowerCount() + step);
        }
    }

    /**
     * 插入token映射关系
     *
     * @param encryptedToken 加密的token
     * @param token          提交的token
     */
    public synchronized void putTokenEntry(String encryptedToken, String token) {
        this.loginTokensMap.put(encryptedToken, token);
    }

    /**
     * 得到token映射关系
     *
     * @param encryptedToken
     * @return
     */
    public String getTokenEntry(String encryptedToken) {
        if (encryptedToken == null || encryptedToken.length() == 0) {
            return null;
        }
        String token = this.loginTokensMap.get(encryptedToken);
        if ("".equals(token)) {
            token = null;
        }
        return token;
    }

    /**
     * 移除token映射关系
     *
     * @param encryptedToken
     */
    public synchronized void removeTokenEntry(String encryptedToken) {
        this.loginTokensMap.remove(encryptedToken);
    }

    /**
     * 信息feed流设置改变
     */
    public synchronized void feedFlowConfigChange() {
        staticClickRankList = null;
        staticTimeRankList = null;
        staticTagRankList = null;
        calcRefreshTagCount();
    }

    /**
     * 判断当前情况下该author的文章是否能在信息feed流中出现
     *
     * @param isFeedFlow
     * @param author
     * @param loginUser
     * @param isFollowing
     * @param feed_flow_allow_following_show
     * @param feed_flow_allow_show_lowest_level
     * @return
     */
    public boolean isFeedFlowAllowShow(boolean isFeedFlow, User author,
                                       User loginUser, boolean isFollowing,
                                       boolean feed_flow_allow_following_show, int feed_flow_allow_show_lowest_level) {
        boolean isAllow;
        if (isFeedFlow) {
            switch (feed_flow_allow_show_lowest_level) {
                case 0:
                    isAllow = true;
                    break;
                case -1:
                    isAllow = author.getUserGroup().isManager();
                    break;
                default:
                    isAllow = author.getUserGroup().isManager() || author.getUserGroup().getGid() >= feed_flow_allow_show_lowest_level;
            }
            if (!isAllow && loginUser != null) {
                isAllow = author.getUid().equals(loginUser.getUid()) || (feed_flow_allow_following_show && isFollowing);
            }
        } else {
            isAllow = true;
        }
        return isAllow;
    }

}