package site.imcoder.blog.service.impl;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.dao.IArticleDao;
import site.imcoder.blog.dao.ISiteDao;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.event.IEventTrigger;
import site.imcoder.blog.service.IManagerService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigManager;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by Jeffrey.Deng on 2017/10/25.
 */
@Service("managerService")
public class ManagerServiceImpl implements IManagerService {

    private static Logger logger = Logger.getLogger(ManagerServiceImpl.class);

    @Resource
    private Cache cache;

    @Resource
    private ISiteDao siteDao;

    @Resource
    private IArticleDao articleDao;

    @Resource
    private IEventTrigger trigger;

    @Resource
    private ConfigManager configManager;

    /**
     * 重新初始化缓存
     */
    @Override
    public int reloadCache(User loginUser) {
        int auth = isAdmin(loginUser);
        if (auth == 200) {
            int flag = 200;
            try {
                cache.reload();
            } catch (Exception e) {
                flag = 500;
                e.printStackTrace();
                logger.error("重新初始化缓存失败", e);
            }
            return flag;
        } else {
            return auth;
        }
    }

    /**
     * 重新读取配置文件
     */
    @Override
    public int reloadConfig(User loginUser) {
        int auth = isAdmin(loginUser);
        if (auth == 200) {
            int flag = 200;
            try {
                configManager.reloadConfig();
            } catch (Exception e) {
                flag = 500;
                e.printStackTrace();
                logger.error("重新读取配置文件错误", e);
            }
            return flag;
        } else {
            return auth;
        }
    }

    /**
     * 更新配置
     */
    @Override
    public int updateConfig(String key, String value, User loginUser) {
        int auth = isAdmin(loginUser);
        if (auth == 200) {
            int flag = 200;
            try {
                if (key != null && value != null && !key.equals("") && !value.equals("")) {
                    configManager.updateConfig(key, value);
                } else {
                    flag = 400;
                }
            } catch (Exception e) {
                flag = 500;
                e.printStackTrace();
                logger.error("重新读取配置文件错误", e);
            }
            return flag;
        } else {
            return auth;
        }
    }

    /**
     * 取得所有配置
     */
    public Map<String, Object> getAllConfig(User loginUser) {
        Map<String, Object> map = new HashMap<String, Object>();
        int auth = isAdmin(loginUser);
        map.put("flag", auth);
        if (auth == 200) {
            map.put("configMap", Config.getAll());
        }
        return map;
    }

    @Override
    public Map<String, Object> getBlogInfo(User loginUser) {
        Map<String, Object> map = new HashMap<String, Object>();
        int auth = isAdmin(loginUser);
        map.put("flag", auth);
        if (auth == 200) {
            map.put("articleCount", (Integer) cache.siteBuffer.get("articleCount"));
            map.put("userCount", (Integer) cache.siteBuffer.get("userCount"));
            map.put("articleViewCount", (Integer) cache.siteBuffer.get("articleViewCount"));
        }
        return map;
    }

    @Override
    public Map<String, Object> getUserList(User loginUser) {
        Map<String, Object> map = new HashMap<>();
        int auth = isAdmin(loginUser);
        map.put("flag", auth);
        if (auth == 200) {
            List<User> list = siteDao.loadUserTable();
            for (User user : list) {
                cache.fillUserStats(user, false);
            }
            map.put("userList", list);
        }
        return map;
    }

    @Override
    public Map<String, Object> getArticleInfoList(User loginUser) {
        Map<String, Object> map = new HashMap<>();
        int auth = isAdmin(loginUser);
        map.put("flag", auth);
        if (auth == 200) {
            List<Article> list = siteDao.findArticleBaseList();
            for (Article article : list) {
                cache.fillArticleStats(article);
            }
            map.put("articleList", list);
        }
        return map;
    }

    @Override
    public int updateArticleInfo(Article article, User loginUser) {
        int auth = isAdmin(loginUser);
        if (auth == 200) {
            int row = siteDao.updateArticleInfoByManager(article);
            if (row > 0) {
                Article article_new = articleDao.find(article.getAid());
                trigger.updateArticle(article_new, article_new.getAuthor());
            }
            return convertRowToHttpCode(row);
        } else {
            return auth;
        }
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

    /**
     * @return int
     * 403 ： 不是管理员
     * 401 ： 未登录
     * 200 ： 是管理员
     */
    private int isAdmin(User loginUser) {
        if (loginUser == null) {
            return 401;
        } else if (loginUser.getUserGroup().getGid() == 1) {
            return 200;
        } else {
            return 403;
        }
    }
}
