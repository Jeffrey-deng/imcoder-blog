package site.imcoder.blog.dao.impl;

import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.dao.CommonDao;
import site.imcoder.blog.dao.IAuthDao;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.UserAuth;

import java.util.List;

/**
 * 凭证鉴权数据处理层
 *
 * @author Jeffrey.Deng
 * @date 2016-10-04
 */
@Repository("authDao")
public class AuthDaoImpl extends CommonDao implements IAuthDao {

    /**
     * 插入某个用户的凭证账号的列表
     *
     * @param userAuths
     * @return
     */
    @Override
    public int saveUserAuthList(List<UserAuth> userAuths) {
        try {
            if (userAuths != null && userAuths.size() > 0) {
                SqlSession sqlSession = this.getSqlSession();
                int i = 0;
                for (UserAuth userAuth : userAuths) {
                    i += sqlSession.insert("auth.insertUserAuth", userAuth);
                }
                return i;
            } else {
                return 0;
            }
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveUserAuthList fail", e);
            return -1;
        }
    }

    /**
     * 插入某个用户的某个凭证账号
     *
     * @param userAuth
     * @return
     */
    @Override
    public int saveUserAuth(UserAuth userAuth) {
        try {
            return this.getSqlSession().insert("auth.insertUserAuth", userAuth);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveUserAuth fail", e);
            return -1;
        }
    }

    /**
     * 得到某个用户的凭证账号的列表
     *
     * @param userAuth
     * @return
     */
    @Override
    public List<UserAuth> findUserAuthList(UserAuth userAuth) {
        try {
            return this.getSqlSession().selectList("auth.findUserAuth", userAuth);
        } catch (Exception e) {
            logger.error("findUserAuthList fail", e);
            return null;
        }
    }

    /**
     * 得到某个用户的凭证账号的列表
     *
     * @param user
     * @return
     */
    @Override
    public List<UserAuth> findUserAuthList(User user) {
        if (user != null && IdUtil.containValue(user.getUid())) {
            UserAuth userAuth = new UserAuth();
            userAuth.setUid(user.getUid());
            return findUserAuthList(userAuth);
        } else {
            return null;
        }

    }

    /**
     * 根据 uid与identity_type与identifier 得到凭证信息
     *
     * @param userAuth
     * @return
     */
    @Override
    public UserAuth findUserAuth(UserAuth userAuth) {
        try {
            return this.getSqlSession().selectOne("auth.findUserAuth", userAuth);
        } catch (Exception e) {
            logger.error("findUserAuth fail", e);
            return null;
        }
    }

    /**
     * 更新某个用户的凭证账号的列表
     *
     * @param userAuths
     * @return
     */
    @Override
    public int updateUserAuthList(List<UserAuth> userAuths) {
        try {
            if (userAuths != null && userAuths.size() > 0) {
                SqlSession sqlSession = this.getSqlSession();
                int i = 0;
                for (UserAuth userAuth : userAuths) {
                    if (userAuth.getUaid() != null || (userAuth.getUid() != null && (userAuth.getIdentity_type() != null || userAuth.getGroup_type() != null))) {
                        i += sqlSession.update("auth.updateUserAuth", userAuth);
                    }
                }
                return i;
            } else {
                return 0;
            }
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateUserAuthList fail", e);
            return -1;
        }
    }

    /**
     * 更新某个用户的某个凭证账号
     *
     * @param userAuth
     * @return
     */
    @Override
    public int updateUserAuth(UserAuth userAuth) {
        try {
            if (userAuth.getUaid() != null || (userAuth.getUid() != null && (userAuth.getIdentity_type() != null || userAuth.getGroup_type() != null))) {
                return this.getSqlSession().update("auth.updateUserAuth", userAuth);
            } else {
                return 0;
            }
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateUserAuth fail", e);
            return -1;
        }
    }

}
