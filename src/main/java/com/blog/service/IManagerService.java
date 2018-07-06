package com.blog.service;

import com.blog.entity.Article;
import com.blog.entity.User;

import java.util.Map;

/**
 * Created by Jeffrey.Deng on 2017/10/25.
 */
public interface IManagerService {

    /**
     * 重新初始化缓存
     */
    public int reloadCache(User loginUser);

    /**
     * 重新读取配置文件
     */
    public int reloadConfig(User loginUser);

    /**
     * 更新配置
     */
    public int updateConfig(String key, String value, User loginUser);

    /**
     * 取得所有配置
     */
    public Map<String, Object> getAllConfig(User loginUser);

    /**
     *
     * @return
     */
    public Map<String, Object> getBlogInfo(User loginUser);

    /**
     *
     * @return
     */
    public Map<String, Object> getUserList(User loginUser);

    /**
     *
     * @return
     */
    public Map<String, Object> getArticleInfoList(User loginUser);

    /**
     * 管理员更新文章基本信息
     * @param article
     * @return
     */
    public int updateArticleInfo(Article article, User loginUser);
}
