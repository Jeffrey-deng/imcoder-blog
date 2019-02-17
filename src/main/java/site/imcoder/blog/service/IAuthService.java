package site.imcoder.blog.service;

import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.UserAuth;

import java.util.List;
import java.util.Map;

/**
 * 凭证鉴权业务类
 *
 * @author Jeffrey.Deng
 * @date 2016-10-04
 */
public interface IAuthService {

    /**
     * 判断账号凭证是否重复（存在）在用户修改用户名或注册时等时需要
     *
     * @param userAuth
     * @return
     */
    public int hasUserAuth(UserAuth userAuth);

    /**
     * 根据凭证名查询用户公开信息
     *
     * @param userAuth
     * @return flag - 200：成功，400: 参数错误，404：无此用户
     * user - 用户信息
     */
    public Map<String, Object> findUserByUserAuth(UserAuth userAuth);

    /**
     * 根据ID或name email 密码,token等登陆用户
     *
     * @param userAuth
     * @param remember
     * @return flag - 200：成功，400: 参数错误，401：凭证错误，403：账号冻结，404：无此用户
     * user - 用户对象
     */
    public Map<String, Object> login(UserAuth userAuth, boolean remember);

    /**
     * 用户获取自己凭证列表的凭证名
     *
     * @param loginUser
     * @return
     */
    public List<UserAuth> findUserAuthList(User loginUser);

    /**
     * 更新账号信息
     *
     * @param userAuthList
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * user - 用户对象
     */
    public Map<String, Object> updateAccount(List<UserAuth> userAuthList, User loginUser);

    /**
     * 清除自动登录令牌
     *
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，404：无此用户，500: 失败
     */
    public int clearAutoLoginToken(User loginUser);

    /**
     * 重设站内账号密码
     *
     * @param loginUser
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * password - 新密码
     */
    public Map<String, Object> resetPasswordInside(User loginUser);
}
