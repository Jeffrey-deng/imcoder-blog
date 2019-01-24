package site.imcoder.blog.entity;

import java.io.Serializable;

/**
 * 用户设置的特殊标签
 *
 * @author Jeffrey.Deng
 * @date 2019-01-10
 */
public class PhotoTagWrapper implements Serializable {

    private static final long serialVersionUID = -6137609606621612556L;

    /**
     * 标签包装ID
     */
    private int ptwid;

    /**
     * 所属用户
     */
    private int uid;

    /**
     * 标签包装名称
     */
    private String name;

    /**
     * 该标签包装是否额外单独显示，值为0为不显示，值为1为单独显示意为组合(父类)标签
     */
    private int extra;

    /**
     * 标签名称的匹配方式：0:相等, 1:前缀, 2:后缀, 3:正则, 4:包含
     */
    private int match_mode;

    /**
     * 匹配标签的字符串，根据match_type设置不同的类型
     */
    private String pattern;

    /**
     * 匹配到的标签排序权重
     */
    private int weight;

    /**
     * 该标签权重的作用域, 0: 全部，>0 ：值所对应的为相册id
     */
    private int scope;

    /**
     * 标签查看权限，0：公开、1：好友、2：私有
     */
    private int permission;

    /**
     * 该标签包装说明
     */
    private String description;

    public int getPtwid() {
        return ptwid;
    }

    public void setPtwid(int ptwid) {
        this.ptwid = ptwid;
    }

    public int getUid() {
        return uid;
    }

    public void setUid(int uid) {
        this.uid = uid;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getExtra() {
        return extra;
    }

    public void setExtra(int extra) {
        this.extra = extra;
    }

    public int getMatch_mode() {
        return match_mode;
    }

    public void setMatch_mode(int match_mode) {
        this.match_mode = match_mode;
    }

    public String getPattern() {
        return pattern;
    }

    public void setPattern(String pattern) {
        this.pattern = pattern;
    }

    public int getWeight() {
        return weight;
    }

    public void setWeight(int weight) {
        this.weight = weight;
    }

    public int getScope() {
        return scope;
    }

    public void setScope(int scope) {
        this.scope = scope;
    }

    public int getPermission() {
        return permission;
    }

    public void setPermission(int permission) {
        this.permission = permission;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
