package site.imcoder.blog.service;

import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.UserAuth;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import java.util.List;

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
     * @param iRequest
     * @return ResponseEntity
     * type - 1: 该凭证已存在，0：此凭证可用
     */
    public IResponse hasUserAuth(UserAuth userAuth, IRequest iRequest);

    /**
     * 根据凭证名查询用户公开信息
     *
     * @param userAuth
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，404：无此用户
     * user - 用户信息
     */
    public IResponse findUserByUserAuth(UserAuth userAuth, IRequest iRequest);

    /**
     * 根据ID或name email 密码 登陆用户
     *
     * @param userAuth
     * @param iRequest attr:
     *                 <p>{Boolean} remember - 是否记住密码</p>
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：凭证错误，403：账号冻结，404：无此用户
     * user - 用户对象
     */
    public IResponse login(UserAuth userAuth, IRequest iRequest);

    /**
     * 用户获取自己凭证列表的凭证列表
     *
     * @param iRequest
     * @return IResponse:
     * userAuths - 凭证列表
     */
    public IResponse findUserAuthList(IRequest iRequest);

    /**
     * 更新账号信息
     *
     * @param userAuthList
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * user - 用户对象
     */
    public IResponse updateAccount(List<UserAuth> userAuthList, IRequest iRequest);

    /**
     * 清除自动登录令牌
     *
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，404：无此用户或无token，500: 失败
     */
    public IResponse clearAutoLoginToken(IRequest iRequest);

    /**
     * 重设站内账号密码
     *
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * password - 新密码
     */
    public IResponse resetPasswordInside(IRequest iRequest);

    /**
     * 发送验证码
     *
     * @param iRequest attr:
     *                 {UserAuth} userAuth - 当用户没有登录既忘记密码时，传入一个凭证名称，如果能找到用户就给该用户发送验证邮件
     * @return IResponse:
     * validateCode 验证码
     */
    public IResponse sendValidateCode(IRequest iRequest);

    /**
     * 验证用户loginUser对于用户author的这个permission值有没有权限
     *
     * @param author
     * @param permission
     * @param iRequest
     * @return
     */
    public IResponse validateUserPermissionUtil(User author, int permission, IRequest iRequest);
}
