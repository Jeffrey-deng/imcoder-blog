package site.imcoder.blog.dao;

import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.UserAuth;

import java.util.List;

/**
 * 凭证鉴权数据处理层
 *
 * @author Jeffrey.Deng
 * @date 2016-10-04
 */
public interface IAuthDao {

    /**
     * 插入某个用户的凭证账号的列表
     *
     * @param userAuths
     * @return
     */
    public int saveUserAuthList(List<UserAuth> userAuths);

    /**
     * 插入某个用户的某个凭证账号
     *
     * @param userAuth
     * @return
     */
    public int saveUserAuth(UserAuth userAuth);

    /**
     * 根据条件得到凭证账号的列表
     *
     * @param userAuth
     * @return
     */
    public List<UserAuth> findUserAuthList(UserAuth userAuth);

    /**
     * 得到某个用户的凭证账号的列表
     *
     * @param user
     * @return
     */
    public List<UserAuth> findUserAuthList(User user);

    /**
     * 根据 uid与identity_type与identifier 得到凭证信息
     *
     * @param userAuth
     * @return
     */
    public UserAuth findUserAuth(UserAuth userAuth);

    /**
     * 更新某个用户的凭证账号的列表
     *
     * @param userAuths
     * @return
     */
    public int updateUserAuthList(List<UserAuth> userAuths);

    /**
     * 更新某个用户的某个凭证账号
     *
     * @param userAuth
     * @return
     */
    public int updateUserAuth(UserAuth userAuth);

}
