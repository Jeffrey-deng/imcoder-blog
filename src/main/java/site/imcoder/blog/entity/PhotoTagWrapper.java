package site.imcoder.blog.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;

import java.io.Serializable;

/**
 * 用户设置的特殊标签
 *
 * @author Jeffrey.Deng
 * @date 2019-01-10
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PhotoTagWrapper implements Serializable {

    private static final long serialVersionUID = -6137609606621612556L;

    /**
     * 标签包装ID
     */
    @PrimaryKeyConvert
    private Long ptwid;

    /**
     * 所属用户
     */
    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long uid;

    /**
     * 标签类型，0：标识标签，1：搜索标签
     * {@link site.imcoder.blog.common.type.TagWrapperType}
     */
    private Integer type;

    /**
     * 标签包装名称
     */
    private String name;

    /**
     * 标签名称的匹配方式：0:相等, 1:前缀, 2:后缀, 3:正则, 4:包含，5:同时包含多个(支持正则，正则间以 && 或 空格 隔开)
     */
    private Integer match_mode;

    /**
     * 匹配标签的字符串，根据match_type设置不同的类型
     */
    private String pattern;

    /**
     * 匹配到了，响应方式
     * 0: continue - 匹配到了, 继续下一次匹配
     * 1: break - 匹配到了, 跳过出匹配（完成匹配）
     */
    private Integer action;

    /**
     * 该标签包装是否额外单独显示，值为0为不显示，值为1为单独显示意为组合(父类)标签
     */
    private Integer extra;

    /**
     * 匹配到的标签排序权重
     */
    private Integer weight;

    /**
     * 该标签权重的作用域, 0: 全部，>0 ：值所对应的为相册id
     */
    @PrimaryKeyConvert
    private Long scope;

    /**
     * 标签查看权限，0：公开、1：好友、2：私有
     */
    private Integer permission;

    /**
     * 该标签包装说明
     */
    private String description;

    /**
     * 是否作为公共标签，供所有用户使用
     * 仅管理员可设置
     * 0：不作为公共标签
     * 1：作为公共标签
     */
    private Integer common_value;

    /**
     * 是否是主题标签，0：不是，1：是
     */
    private Integer topic;

    public PhotoTagWrapper() {
    }

    public PhotoTagWrapper(Long ptwid) {
        this.ptwid = ptwid;
    }

    public Long getPtwid() {
        return ptwid;
    }

    public void setPtwid(Long ptwid) {
        this.ptwid = ptwid;
    }

    public Long getUid() {
        return uid;
    }

    public void setUid(Long uid) {
        this.uid = uid;
    }

    public Integer getType() {
        return type;
    }

    public void setType(Integer type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getMatch_mode() {
        return match_mode;
    }

    public void setMatch_mode(Integer match_mode) {
        this.match_mode = match_mode;
    }

    public String getPattern() {
        return pattern;
    }

    public void setPattern(String pattern) {
        this.pattern = pattern;
    }

    public Integer getAction() {
        return action;
    }

    public void setAction(Integer action) {
        this.action = action;
    }

    public Integer getExtra() {
        return extra;
    }

    public void setExtra(Integer extra) {
        this.extra = extra;
    }

    public Integer getWeight() {
        return weight;
    }

    public void setWeight(Integer weight) {
        this.weight = weight;
    }

    public Long getScope() {
        return scope;
    }

    public void setScope(Long scope) {
        this.scope = scope;
    }

    public Integer getPermission() {
        return permission;
    }

    public void setPermission(Integer permission) {
        this.permission = permission;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getCommon_value() {
        return common_value;
    }

    public void setCommon_value(Integer common_value) {
        this.common_value = common_value;
    }

    public Integer getTopic() {
        return topic;
    }

    public void setTopic(Integer topic) {
        this.topic = topic;
    }

}
