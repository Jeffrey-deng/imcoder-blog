package site.imcoder.blog.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import site.imcoder.blog.common.type.UserAuthType;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFill;

import java.io.Serializable;
import java.util.List;


/**
 * 用户实体类
 *
 * @author dengchao
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class User implements Serializable {

    private static final long serialVersionUID = 7859498874005586724L;

    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long uid; //用户id

    private String nickname; //用户昵称

    private String phone; //用户手机号码

    private String sex; //用户性别

    private String email; //用户EMAIL地址

    private String address; //用户地址

    private String birthday; //用户生日

    private String description; //自我描述

    @URLPrefixFill(prefixConfigKey = URLPrefixFill.DEFAULT_CDN_PREFIX)
    private String head_photo; //'用户头像存储路径

    private String qq; //用户QQ号码

    private String weibo; //用户微博

    private String site; //用户主页

    private String says; //用户语录

    private UserGroup userGroup;  //分组

    private UserStatus userStatus;  // 用户状态信息

    private UserStats userStats;  // 用户统计信息

    private List<UserAuth> userAuths;    // 用户权限信息

    private UserSetting userSetting;    // 用户的设置

    public User() {
    }

    public User(Long uid) {
        this.uid = uid;
    }

    public User(Long uid, String nickname) {
        this.uid = uid;
        this.nickname = nickname;
    }

    public Long getUid() {
        return uid;
    }

    public void setUid(Long uid) {
        this.uid = uid;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getBirthday() {
        return birthday;
    }

    public void setBirthday(String birthday) {
        this.birthday = birthday;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getHead_photo() {
        return head_photo;
    }

    public void setHead_photo(String head_photo) {
        this.head_photo = head_photo;
    }

    public String getQq() {
        return qq;
    }

    public void setQq(String qq) {
        this.qq = qq;
    }

    public String getWeibo() {
        return weibo;
    }

    public void setWeibo(String weibo) {
        this.weibo = weibo;
    }

    public String getSite() {
        return site;
    }

    public void setSite(String site) {
        this.site = site;
    }

    public String getSays() {
        return says;
    }

    public void setSays(String says) {
        this.says = says;
    }

    public UserGroup getUserGroup() {
        return userGroup;
    }

    public void setUserGroup(UserGroup userGroup) {
        this.userGroup = userGroup;
    }

    public UserStatus getUserStatus() {
        return userStatus;
    }

    public void setUserStatus(UserStatus userStatus) {
        this.userStatus = userStatus;
    }

    public UserStats getUserStats() {
        return userStats;
    }

    public void setUserStats(UserStats userStats) {
        this.userStats = userStats;
    }

    public List<UserAuth> getUserAuths() {
        return userAuths;
    }

    public void setUserAuths(List<UserAuth> userAuths) {
        this.userAuths = userAuths;
    }

    public UserSetting getUserSetting() {
        return userSetting;
    }

    public void setUserSetting(UserSetting userSetting) {
        this.userSetting = userSetting;
    }

    // 返回某一种凭证
    public UserAuth getUserAuth(UserAuthType userAuthType) {
        if (userAuths != null && !userAuths.isEmpty()) {
            for (UserAuth userAuth : userAuths) {
                if (userAuth.getIdentity_type() == userAuthType.value) {
                    return userAuth;
                }
            }
        }
        return null;
    }
}
