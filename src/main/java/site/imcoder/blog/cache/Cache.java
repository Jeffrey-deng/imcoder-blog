package site.imcoder.blog.cache;

import org.apache.commons.beanutils.PropertyUtils;
import org.apache.log4j.Logger;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import site.imcoder.blog.cache.sort.ArticleHotComparator;
import site.imcoder.blog.cache.sort.ArticleTimeComparator;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.annotation.Resource;
import java.util.*;
import java.util.Collection;
import java.util.Map.Entry;

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
    public Map<Integer, Article> articleBuffer;

    /**
     * 计量数有更新的文章Set { aid }
     */
    public Set<Integer> hasUpdateArticle;

    /**
     * 用户基本信息缓存Map { uid : user }
     */
    public Map<Integer, User> userBuffer;

    /**
     * 计量数有更新的用户Set { uid }
     */
    public Set<Integer> hasUpdateUser;

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

        hasUpdateArticle = new HashSet<Integer>();
        hasUpdateUser = new HashSet<Integer>();
        siteBuffer = new HashMap<String, Object>();
        loginTokensMap = new HashMap<String, String>();

        categoryCount = initTool.initCategoryCount();
        followBuffer = initTool.initFollowBuffer();
        friendBuffer = initTool.initFriendBuffer();

        articleBuffer = initTool.initArticleBuffer(siteBuffer);
        userBuffer = initTool.initUserBuffer(articleBuffer, followBuffer, siteBuffer);

        tagCount = initTool.initTagCount(articleBuffer);

        siteBuffer.put("totalViews", 0);

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
     * 填充文章的统计量为缓存中的最新数据
     *
     * @param articleList
     */
    public void fillArticleStats(List<Article> articleList) {
        if (articleList != null) {
            for (Article article : articleList) {
                Article _article = articleBuffer.get(article.getAid());
                if (_article != null) {
                    article.setClick(_article.getClick());
                    article.setComment(_article.getComment());
                    article.setCollection(_article.getCollection());
                }
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
                article.setClick(_article.getClick());
                article.setComment(_article.getComment());
                article.setCollection(_article.getCollection());
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
     * @param user
     * @param security 是否保护隐私信息
     * @return
     */
    public User fillUserStats(User user, boolean security) {
        if (user != null) {
            User _user = userBuffer.get(user.getUid());
            if (_user != null) {
                UserStatus userStatus = user.getUserStatus();
                UserStatus _userStatus = _user.getUserStatus();
                if (userStatus == null) {
                    userStatus = new UserStatus();
                    user.setUserStatus(userStatus);
                }
                userStatus.setArticleCount(_userStatus.getArticleCount());
                userStatus.setFollowCount(_userStatus.getFollowCount());
                userStatus.setFansCount(_userStatus.getFansCount());
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
    public Article getArticle(int aid, int rw) {
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
    public Map<String, Article> getAdjacentArticle(int aid, int rw) {
        Map<String, Article> map = new HashMap<>();
        int size = this.articleBuffer.size();
        if (size == 0) {
            return map;
        }
        int index = aid;
        int maxAid = ((Article) getTimeSortArticle(0).get(0)).getAid();
        Article pre = null;
        Article next = null;
        while (--index > 0) {
            pre = this.getArticle(index, rw);
            if (pre != null && pre.getPermission() == 0) {
                break;
            }
        }
        index = aid;
        while (++index <= maxAid) {
            next = this.getArticle(index, rw);
            if (next != null && next.getPermission() == 0) {
                break;
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
    public User getUser(int uid, int rw) {
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
                User newUser = new User();
                try {
                    PropertyUtils.copyProperties(newUser, fullUser);
                    newUser.setUserAuths(null);
                    newUser.setEmail(null);
                    newUser.setUserSetting(null);
                    UserStatus userStatus = newUser.getUserStatus();
                    userStatus.setLast_login_ip(null);
                    userStatus.setLast_login_time(null);
                    userStatus.setRegister_ip(null);
                    userStatus.setRegister_time(null);
                    return newUser;
                } catch (Exception e) {
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
                User newUser = new User();
                try {
                    PropertyUtils.copyProperties(newUser, fullUser);
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
    public List<Article> getVisibleArticles(int uid, User loginUser) {
        Collection<Article> values = articleBuffer.values();
        List<Article> list = new ArrayList<>();
        if (loginUser == null || loginUser.getUid() == 0) {
            for (Article article : values) {
                if (article.getPermission() != 0) {
                    continue;
                }
                if (uid == 0) {
                    list.add(article);
                } else if (article.getAuthor().getUid() == uid) {
                    list.add(article);
                }
            }
            return list;
        }
        if (uid > 0) {
            boolean isHimself = loginUser.getUid() == uid;
            boolean isFriend = containsFriend(new Friend(loginUser.getUid(), uid)) == 2;
            for (Article article : values) {
                if (article.getAuthor().getUid() == uid) {
                    if (isHimself || article.getPermission() == 0 || (isFriend && article.getPermission() == 1)) {
                        list.add(article);
                    }
                }
            }
        } else {
            int loginUid = loginUser.getUid();
            List<Integer> friendList = new ArrayList<Integer>();
            for (Friend f : friendBuffer) {
                if (f.getUid() == loginUid) {
                    friendList.add(f.getFid());
                }
            }
            for (Article article : values) {
                if (loginUid == article.getAuthor().getUid() || article.getPermission() == 0 || (article.getPermission() == 1 && friendList.contains(article.getAuthor().getUid()))) {
                    list.add(article);
                }
            }
        }
        return list;
    }

    private List<Article> staticClickRankList;
    private long clickRankListLastViewTime = new Date().getTime();
    private int clickRankListLastViewSize = 0;

    /**
     * 得到缓存中按热门程序排序公开的文章
     *
     * @param size list长度
     * @return List<Article>
     */
    public List<Article> getHotSortArticle(int size) {
        long time = System.currentTimeMillis();
        synchronized (this) {
            if (size == clickRankListLastViewSize && staticClickRankList != null) {
                if (time - 60 * 1000 * 15 < clickRankListLastViewTime) {
                    return staticClickRankList;
                }
            }
        }

        List<Article> hotSortArticle = new ArrayList<Article>();
        for (Article article : articleBuffer.values()) {
            //只返回公开文章
            if (article.getPermission() == 0) {
                hotSortArticle.add(article);
            }
        }
        Collections.sort(hotSortArticle, articleHotComparator);

        //防止 该user 文章数 小于 num
        if (hotSortArticle.size() < size) {
            size = hotSortArticle.size();
        }
        List<Article> clickRankList = new ArrayList<Article>(size);
        for (int i = 0; i < size; i++) {
            clickRankList.add(hotSortArticle.get(i));
        }

        synchronized (this) {
            clickRankListLastViewTime = time;
            clickRankListLastViewSize = size;
            staticClickRankList = clickRankList;
        }
        return clickRankList;
    }

    /**
     * 得到按热门程序排序的文章
     *
     * @param uid         是否查询所有还是单个用户 uid=0 为查询所有
     * @param size
     * @param visibleList 如果传入文章列表则统计此列表
     * @return
     */
    public List<Article> getHotSortArticle(int uid, int size, List<Article> visibleList) {
        if (visibleList == null) {
            if (uid == 0) {
                return getHotSortArticle(size);
            } else {
                visibleList = getVisibleArticles(uid, null);
            }
        }
        Collections.sort(visibleList, articleHotComparator);
        //防止 该user 文章数 小于 num
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
    public List<Article> getHotSortArticle(int uid, int size, User loginUser) {
        if (uid == 0 && (loginUser == null || loginUser.getUid() == 0)) {
            return getHotSortArticle(size);
        } else {
            return getHotSortArticle(uid, size, getVisibleArticles(uid, loginUser));
        }
    }

    private List<Article> staticTimeRankList;
    private long timeRankListLastViewTime = new Date().getTime();
    private int timeRankListLastViewSize = 0;

    /**
     * 得到缓存中按时间排序的公开的文章
     *
     * @param size list长度
     * @return List<Article>
     */
    public List<Article> getTimeSortArticle(int size) {
        if (size == 0) {
            size = Config.getInt(ConfigConstants.ARTICLE_HOME_SIZE_RANK);
        }
        long time = System.currentTimeMillis();
        synchronized (this) {
            if (size == timeRankListLastViewSize && staticTimeRankList != null) {
                if (time - 60 * 1000 * 10 < timeRankListLastViewTime) {
                    return staticTimeRankList;
                }
            }
        }

        List<Article> timeSortArticle = new ArrayList<Article>();
        for (Article article : articleBuffer.values()) {
            //只返回公开文章
            if (article.getPermission() == 0) {
                timeSortArticle.add(article);
            }
        }
        Collections.sort(timeSortArticle, articleTimeComparator);

        //防止 该user 文章数 小于 num
        if (timeSortArticle.size() < size) {
            size = timeSortArticle.size();
        }
        List<Article> newestList = new ArrayList<Article>(size);
        for (int i = 0; i < size; i++) {
            newestList.add(timeSortArticle.get(i));
        }

        synchronized (this) {
            timeRankListLastViewTime = time;
            timeRankListLastViewSize = size;
            staticTimeRankList = newestList;
        }

        return newestList;
    }

    /**
     * 得到按按时间排序的文章
     *
     * @param uid         是否查询所有还是单个用户 uid=0 为查询所有
     * @param size
     * @param visibleList 如果传入文章列表则统计此列表
     * @return
     */
    public List<Article> getTimeSortArticle(int uid, int size, List<Article> visibleList) {
        if (visibleList == null) {
            if (uid == 0) {
                return getTimeSortArticle(size);
            } else {
                visibleList = getVisibleArticles(uid, null);
            }
        }
        Collections.sort(visibleList, articleTimeComparator);
        //防止 该user 文章数 小于 num
        if (visibleList.size() < size) {
            size = visibleList.size();
        }
        List<Article> newestList = new ArrayList<Article>(size);
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
    public List<Article> getTimeSortArticle(int uid, int size, User loginUser) {
        if (uid == 0 && (loginUser == null || loginUser.getUid() == 0)) {
            return getTimeSortArticle(size);
        } else {
            return getTimeSortArticle(uid, size, getVisibleArticles(uid, loginUser));
        }
    }

    private List<Entry<String, Integer>> staticTagRankList;
    private long tagRankListLastViewTime = new Date().getTime();
    private int tagRankListLastViewSize = 0;

    /**
     * 得到缓存中每种标签数量从大到小的集合
     *
     * @param size
     * @return
     */
    public List<Entry<String, Integer>> getTagCount(int size) {
        List<Entry<String, Integer>> tagList = tagCount;
        if (size == 0) { // site为0时，返回全部标签
            return tagList;
        }

        long time = System.currentTimeMillis();
        synchronized (this) {
            if (size == tagRankListLastViewSize && staticTagRankList != null) {
                if (time - 60 * 1000 * 15 < tagRankListLastViewTime) {
                    return staticTagRankList;
                }
            }
        }

        List<Entry<String, Integer>> list = new ArrayList<Entry<String, Integer>>();
        if (tagList.size() < size) {
            size = tagList.size();
        }
        for (int i = 0; i < size; i++) {
            list.add(tagList.get(i));
        }
        Collections.sort(list, new Comparator<Entry<String, Integer>>() {
            //降序排序
            public int compare(Entry<String, Integer> o1, Entry<String, Integer> o2) {
                return -o1.getValue().compareTo(o2.getValue());
            }
        });

        synchronized (this) {
            tagRankListLastViewTime = time;
            tagRankListLastViewSize = size;
            staticTagRankList = list;
        }
        return list;
    }

    /**
     * 得到每种标签数量从大到小的集合
     *
     * @param uid         是否查询所有还是单个用户 uid=0 为查询所有
     * @param size        list长度
     * @param visibleList 如果传入文章列表则统计此列表的标签
     * @return
     */
    public List<Entry<String, Integer>> getTagCount(int uid, int size, List<Article> visibleList) {

        List<Entry<String, Integer>> tagList = tagCount;
        Map<Integer, Article> articleMap = articleBuffer;

        if (visibleList != null) { // if has visibleList, calc visibleList's tags
            articleMap = new LinkedHashMap<>();
            for (Article article : visibleList) {
                articleMap.put(article.getAid(), article);
            }
            tagList = initTool.initTagCount(articleMap, uid, false); // get the visible article List's  tags
        } else if (uid > 0) {
            tagList = initTool.initTagCount(articleMap, uid, true); // get the user's article tags
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
            //降序排序
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
    public List<Entry<String, Integer>> getTagCount(int uid, int size, User loginUser) {
        if (uid == 0 && loginUser == null) {
            return getTagCount(size);
        } else {
            return getTagCount(uid, size, getVisibleArticles(uid, loginUser));
        }
    }

    /**
     * 刷新tagCount公开缓存
     */
    public void calcRefreshTagCount() {
        tagCount = initTool.initTagCount(articleBuffer, 0, true);
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
    public void putArticle(Article article, User user) {
        articleBuffer.put(article.getAid(), article);
        staticClickRankList = null;
        staticTimeRankList = null;
        staticTagRankList = null;
        if (article.getPermission() == 0) {
            calcRefreshTagCount();
        }
    }

    /**
     * 移除文章行
     *
     * @param article
     * @param user
     */
    public void removeArticle(Article article, User user) {
        articleBuffer.remove(article.getAid());
        hasUpdateArticle.remove(article.getAid());
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
    public void putUser(User user) {
        User cacheUser = getUser(user.getUid(), READ);
        if (cacheUser != null && user.getUserSetting() == null) {
            user.setUserSetting(cacheUser.getUserSetting());
        }
        userBuffer.put(user.getUid(), user);
    }

    /**
     * 移除用户行
     *
     * @param user
     */
    public void removeUser(User user) {
        userBuffer.remove(user.getUid());
        hasUpdateUser.remove(user.getUid());
    }

    /**
     * 添加关注行
     *
     * @param follow
     */
    public void putFollow(Follow follow) {
        if (containsFollow(follow) == 0) {
            this.followBuffer.add(follow);
        }
    }

    /**
     * 移除关注行
     *
     * @param follow
     */
    public void removeFollow(Follow follow) {
        Iterator<Follow> iterator = followBuffer.iterator();
        while (iterator.hasNext()) {
            Follow f = iterator.next();
            if (f.getUid() == follow.getUid() && f.getFuid() == follow.getFuid()) {
                //只能用iterator.remove删除，不能用foreach + followBuffer.remove(follow)删除
                //不然会抛java.util.ConcurrentModificationException 异常
                iterator.remove();
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
            if (f.getUid() == follow.getUid() && f.getFuid() == follow.getFuid()) {
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
    public void putFriend(Friend friend) {
        if (containsFriend(friend) == 0) {
            this.friendBuffer.add(friend);
            this.friendBuffer.add(new Friend(friend.getFid(), friend.getUid()));
        }
    }

    /**
     * 移除好友行
     *
     * @param friend
     */
    public void removeFriend(Friend friend) {
        Iterator<Friend> iterator = friendBuffer.iterator();
        while (iterator.hasNext()) {
            Friend f = iterator.next();
            if ((f.getUid() == friend.getUid() && f.getFid() == friend.getFid()) || (f.getUid() == friend.getFid() && f.getFid() == friend.getUid())) {
                //只能用iterator.remove删除，不能用foreach + friendBuffer.remove(friend)删除
                //不然会抛java.util.ConcurrentModificationException 异常
                iterator.remove();
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
            if ((f.getUid() == friend.getUid() && f.getFid() == friend.getFid()) || (f.getUid() == friend.getFid() && f.getFid() == friend.getUid())) {
                row += 1;
            }
        }
        return row;
    }

    /**
     * 更新用户
     *
     * @param user
     */
    public void updateUser(User user) {
        this.fillUserStats(user, false);
        User cacheUser = getUser(user.getUid(), READ);
        if (cacheUser != null && user.getUserSetting() == null) {
            user.setUserSetting(cacheUser.getUserSetting());
        }
        userBuffer.put(user.getUid(), user);
    }

    /**
     * 更新文章
     *
     * @param article
     * @param user
     */
    public void updateArticle(Article article, User user) {
        this.fillArticleStats(article);
        articleBuffer.put(article.getAid(), article);
        staticClickRankList = null;
        staticTimeRankList = null;
        staticTagRankList = null;
        calcRefreshTagCount();
    }


    /** -------------- 更新统计量接口 ----------------**/

    /**
     * 更新文章收藏数接口
     *
     * @param article
     * @param step
     */
    public void updateArticleCollection(Article article, int step) {
        Article _article = getArticle(article.getAid(), Cache.WRITE);
        if (_article != null) {
            _article.setCollection(_article.getCollection() + step);
        }
    }

    /**
     * 更新文章点击量数接口
     *
     * @param article
     * @param step
     */
    public void updateArticleClick(Article article, int step) {
        Article _article = getArticle(article.getAid(), Cache.WRITE);
        if (_article != null) {
            _article.setClick(_article.getClick() + step);
        }
    }

    /**
     * 更新文章评论数接口
     *
     * @param article
     * @param step
     */
    public void updateArticleComment(Article article, int step) {
        Article _article = getArticle(article.getAid(), Cache.WRITE);
        if (_article != null) {
            _article.setComment(_article.getComment() + step);
            if (_article.getComment() < 0) {
                _article.setComment(0);
            }
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
     *
     * @param category
     * @param step
     */
    public void updateCategoryCount(Category category, int step) {
        for (Category _category : categoryCount) {
            if (category.getAtid() == _category.getAtid()) {
                _category.setCount(_category.getCount() + step);
                break;
            }
        }
    }

    /**
     * 更新用户的文章数
     *
     * @param user
     * @param step
     */
    public void updateUserArticleCount(User user, int step) {
        User _user = getUser(user.getUid(), Cache.WRITE);
        if (_user != null) {
            _user.getUserStatus().setArticleCount(_user.getUserStatus().getArticleCount() + step);
        }
    }

    /**
     * 更新用户的关注数
     *
     * @param user
     * @param step
     */
    public void updateUserFollowCount(User user, int step) {
        User _user = getUser(user.getUid(), Cache.WRITE);
        if (_user != null) {
            _user.getUserStatus().setFollowCount(_user.getUserStatus().getFollowCount() + step);
        }
    }

    /**
     * 更新用户的粉丝数
     *
     * @param user
     * @param step
     */
    public void updateUserFansCount(User user, int step) {
        User _user = getUser(user.getUid(), Cache.WRITE);
        if (_user != null) {
            _user.getUserStatus().setFansCount(_user.getUserStatus().getFansCount() + step);
        }
    }

    /**
     * 插入token映射关系
     *
     * @param encryptedToken 加密的token
     * @param token          提交的token
     */
    public void putTokenEntry(String encryptedToken, String token) {
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
    public void removeTokenEntry(String encryptedToken) {
        this.loginTokensMap.remove(encryptedToken);
    }

}