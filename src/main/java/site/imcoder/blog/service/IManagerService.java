package site.imcoder.blog.service;

import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.User;

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
     * 更换用户组
     * 管理员不能将别人提升为管理员
     * 管理员不能将其他管理员降级为会员
     *
     * @param user      需要参数：user.uid, user.userGroup.gid
     * @param loginUser
     * @return flag: 400: 参数错误，401：未登录， 403：无权修改， 404：用户不存在或提交的gid不存在， 500：服务器错误
     */
    public int updateUserGroup(User user, User loginUser);

    /**
     * 查询所有的用户组信息
     *
     * @param loginUser
     * @return
     */
    public Map<String, Object> findUserGroupList(User loginUser);

    /**
     * @return
     */
    public Map<String, Object> getBlogInfo(User loginUser);

    /**
     * @return
     */
    public Map<String, Object> getUserList(User loginUser);

    /**
     * @return
     */
    public Map<String, Object> getArticleInfoList(User loginUser);

    /**
     * 管理员更新文章基本信息
     *
     * @param article
     * @return
     */
    public int updateArticleInfo(Article article, User loginUser);

    /**
     * 升级旧地址格式为新地址格式
     *
     * @param loginUser
     * @return
     */
    public int upgradeNewFileNameStyle(User loginUser);
}
