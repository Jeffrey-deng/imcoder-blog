package site.imcoder.blog.cache;

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
        if (user != null) {
            User _user = userBuffer.get(user.getUid());
            if (_user != null) {
                user.setArticleCount(_user.getArticleCount());
                user.setFollowCount(_user.getFollowCount());
                user.setFansCount(_user.getFansCount());
                user.setLoginIP(_user.getLoginIP());
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
        int maxAid = ((Article) getTimeSortArticle(0, 0).get(0)).getAid();
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
     * 获取管理员列表
     *
     * @return
     */
    public List<User> getManagers() {
        List<User> managers = new ArrayList<User>();
        for (User user : userBuffer.values()) {
            if (user.getUserGroup().getGid() == 1) {
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


    private List<Article> staticClickRankList;
    private long clickRankListLastViewTime = new Date().getTime();

    /**
     * 按热门程序排序的文章
     *
     * @param uid  是否查询所有还是单个用户 uid=0 为查询所有
     * @param size list长度
     * @return List<Article>
     */
    public List<Article> getHotSortArticle(int uid, int size) {

        long time = new Date().getTime();
        if (uid == 0 && staticClickRankList != null) {
            if (time - 60 * 1000 * 15 < clickRankListLastViewTime) {
                return staticClickRankList;
            }
        }

        List<Article> hotSortArticle = new ArrayList<Article>();
        for (Article article : articleBuffer.values()) {
            //只返回公开文章
            if (article.getPermission() != 0) {
                continue;
            }
            if (uid == 0) {
                hotSortArticle.add(article);
            } else if (article.getAuthor().getUid() == uid) {
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

        if (uid == 0) {
            clickRankListLastViewTime = time;
            staticClickRankList = clickRankList;
        }
        return clickRankList;
    }

    private List<Article> staticTimeRankList;
    private long timeRankListLastViewTime = new Date().getTime();

    /**
     * 按时间排序的文章
     *
     * @param uid  是否查询所有还是单个用户 uid=0 为查询所有
     * @param size list长度
     * @return List<Article>
     */
    public List<Article> getTimeSortArticle(int uid, int size) {
        if (size == 0) {
            size = Config.getInt(ConfigConstants.ARTICLE_HOME_SIZE_RANK);
        }
        long time = new Date().getTime();
        if (uid == 0 && staticTimeRankList != null) {
            if (time - 60 * 1000 * 10 < timeRankListLastViewTime) {
                return staticTimeRankList;
            }
        }
        List<Article> timeSortArticle = new ArrayList<Article>();
        for (Article article : articleBuffer.values()) {
            //只返回公开文章
            if (article.getPermission() != 0) {
                continue;
            }
            if (uid == 0) {
                timeSortArticle.add(article);
            } else if (article.getAuthor().getUid() == uid) {
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

        if (uid == 0) {
            timeRankListLastViewTime = time;
            staticTimeRankList = newestList;
        }
        return newestList;
    }

    private List<Entry<String, Integer>> staticTagRankList;
    private long tagRankListLastViewTime = new Date().getTime();

    /**
     * 得到每种标签数量从大到小的集合
     *
     * @param size
     * @return
     */
    public List<Entry<String, Integer>> getTagCount(int size) {

        long time = new Date().getTime();
        if (staticTagRankList != null) {
            if (time - 60 * 1000 * 15 < tagRankListLastViewTime) {
                return staticTagRankList;
            }
        }

        List<Entry<String, Integer>> list = new ArrayList<Entry<String, Integer>>();
        if (tagCount.size() < size) {
            size = tagCount.size();
        }
        for (int i = 0; i < size; i++) {
            list.add(tagCount.get(i));
        }
        Collections.sort(list, new Comparator<Entry<String, Integer>>() {
            //降序排序
            public int compare(Entry<String, Integer> o1, Entry<String, Integer> o2) {
                return -o1.getValue().compareTo(o2.getValue());
            }
        });

        tagRankListLastViewTime = time;
        staticTagRankList = list;
        return list;
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
    }

    /**
     * 添加用户行
     *
     * @param user
     */
    public void putUser(User user) {
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
        this.fillUserStats(user);
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
        }
    }

    /**
     * 更新每个标签文章数接口
     *
     * @param tag
     * @param step
     */
    public void updateTagCount(String tag, int step) {
        for (Entry<String, Integer> entry : this.tagCount) {
            if (tag.contains(entry.getKey())) {
                entry.setValue(entry.getValue() + step);
            }
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
            _user.setArticleCount(_user.getArticleCount() + step);
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
            _user.setFollowCount(_user.getFollowCount() + step);
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
            _user.setFansCount(_user.getFansCount() + step);
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