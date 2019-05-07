package site.imcoder.blog.entity;

import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.type.UserAuthType;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;

import java.io.Serializable;

/**
 * @author Jeffrey.Deng
 * @date 2016-10-04
 */
public class UserAuth implements Serializable {

    private static final long serialVersionUID = 5013672743658092923L;

    private Long uaid;

    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long uid;

    private Integer group_type; // identity_type对应的大组类型，0：站内账号、 1：第三方账号、 2：鉴权类（非登陆账号）

    private Integer identity_type;  // 登录类型（手机号 邮箱 用户名）或第三方应用名称（微信 微博等）

    private String identifier;  // 标识（手机号 邮箱 用户名或第三方应用的唯一标识）

    private String credential;  // 密码凭证（站内的保存密码，站外的不保存或保存token）

    private Integer verified; // 是否已验证

    private String login_ip; // 以identity_type登陆时对应的ip，注意与userStatus.last_login_ip的区别

    public UserAuth() {

    }

    public UserAuth(UserAuthType userAuthType, String identifier, String credential) {
        this.group_type = userAuthType.group;
        this.identity_type = userAuthType.value;
        this.identifier = identifier;
        this.credential = credential;
    }

    public UserAuth(Long uid, UserAuthType userAuthType, String identifier, String credential) {
        this.uid = uid;
        this.group_type = userAuthType.group;
        this.identity_type = userAuthType.value;
        this.identifier = identifier;
        this.credential = credential;
    }

    public UserAuth(Long uid, UserAuthType userAuthType, String identifier, String credential, Integer verified, String login_ip) {
        this.uid = uid;
        this.group_type = userAuthType.group;
        this.identity_type = userAuthType.value;
        this.identifier = identifier;
        this.credential = credential;
        this.verified = verified;
        this.login_ip = login_ip;
    }

    public Long getUaid() {
        return uaid;
    }

    public void setUaid(Long uaid) {
        this.uaid = uaid;
    }

    public Long getUid() {
        return uid;
    }

    public void setUid(Long uid) {
        this.uid = uid;
    }

    public Integer getGroup_type() {
        return group_type;
    }

    public void setGroup_type(Integer group_type) {
        this.group_type = group_type;
    }

    public Integer getIdentity_type() {
        return identity_type;
    }

    public void setIdentity_type(Integer identity_type) {
        this.identity_type = identity_type;
    }

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public String getCredential() {
        return credential;
    }

    public void setCredential(String credential) {
        this.credential = credential;
    }

    public Integer getVerified() {
        return verified;
    }

    public void setVerified(Integer verified) {
        this.verified = verified;
    }

    public String getLogin_ip() {
        return login_ip;
    }

    public void setLogin_ip(String login_ip) {
        this.login_ip = login_ip;
    }

    /**
     * 插入鉴权账号时判断是否是合法的凭证对象
     *
     * @param userAuth
     * @return
     */
    public static boolean typeOfLegalAuth(UserAuth userAuth) {
        if (userAuth == null || userAuth.getGroup_type() == null || userAuth.getIdentity_type() == null || Utils.isEmpty(userAuth.getIdentifier()) || Utils.isEmpty(userAuth.getCredential())) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * 插入鉴权账号时判断是否是合法的凭证对象
     *
     * @return
     */
    public boolean typeOfLegalAuth() {
        return typeOfLegalAuth(this);
    }

    /**
     * 判断authType是否为站内凭证
     *
     * @return
     */
    public boolean typeOfInsideGroup() {
        return UserAuthType.typeOfInsideGroup(this);
    }

    /**
     * 判断authType是否为第三方凭证
     *
     * @return
     */
    public boolean typeOfThirdPartGroup() {
        return UserAuthType.typeOfThirdPartGroup(this);
    }

    /**
     * 判断authType是否为鉴权类（非登录）凭证
     *
     * @return
     */
    public boolean typeOfAuthKeyGroup() {
        return UserAuthType.typeOfAuthKeyGroup(this);
    }
}
