package site.imcoder.blog.service;

import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

/**
 * 管理员服务
 *
 * @author Jeffrey.Deng
 * @date 2017/10/25.
 */
public interface IManagerService {

    /**
     * 重新初始化缓存
     */
    public IResponse reloadCache(IRequest iRequest);

    /**
     * 重新读取配置文件
     */

    public IResponse reloadConfig(IRequest iRequest);

    /**
     * 更新配置
     */
    public IResponse updateConfig(String key, String value, IRequest iRequest);

    /**
     * 取得所有配置
     *
     * @param iRequest
     * @return IResponse:
     * configMap
     */
    public IResponse getAllConfig(IRequest iRequest);

    /**
     * 更换用户组
     * 管理员不能将别人提升为管理员
     * 管理员不能将其他管理员降级为会员
     *
     * @param user     需要参数：user.uid, user.userGroup.gid
     * @param iRequest
     * @return IResponse:
     * status: 400: 参数错误，401：未登录， 403：无权修改， 404：用户不存在或提交的gid不存在， 500：服务器错误
     * userGroup: 新组信息
     */
    public IResponse updateUserGroup(User user, IRequest iRequest);

    /**
     * 查询所有的用户组信息
     *
     * @param iRequest
     * @return IResponse:
     * userGroups
     */
    public IResponse findUserGroupList(IRequest iRequest);

    /**
     * SiteInfo
     *
     * @param iRequest
     * @return IResponse:
     * articleCount
     * userCount
     * articleViewCount
     */
    public IResponse getSiteInfo(IRequest iRequest);

    /**
     * 获取用户列表
     *
     * @param iRequest
     * @return IResponse:
     * users
     */
    public IResponse getUserList(IRequest iRequest);

    /**
     * 获取文章列表
     *
     * @param iRequest
     * @return IResponse:
     * articles
     */
    public IResponse getArticleInfoList(IRequest iRequest);

    /**
     * 更新文章信息
     *
     * @param article
     * @param iRequest
     * @return IResponse:
     * article
     */
    public IResponse updateArticleInfo(Article article, IRequest iRequest);

    /**
     * 升级服务
     *
     * @param version
     * @param iRequest
     * @return ResponseEntity：
     */
    public IResponse upgradeService(String version, IRequest iRequest);
}
