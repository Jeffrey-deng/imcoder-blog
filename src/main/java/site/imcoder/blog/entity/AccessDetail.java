package site.imcoder.blog.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFill;
import site.imcoder.blog.controller.formatter.urlprefix.impl.AccessRecordURLPrefixFiller;

import java.io.Serializable;

/**
 * 访问记录
 *
 * @author Jeffrey.Deng
 * @date 2019-10-30
 */
public class AccessDetail implements Serializable {

    private static final long serialVersionUID = -4296171129566776592L;

    /**
     * 动作id
     */
    @JsonIgnore
    private Long ar_id;

    /**
     * 访问的用户，用户未登录时设置uid为0
     */
    @JsonIgnore
    private Long uid;

    /**
     * 访问的对象id
     */
    @JsonIgnore
    private Long creation_id;

    /**
     * 首次访问访问路径
     */
    @URLPrefixFill(using = AccessRecordURLPrefixFiller.class, prefixConfigKey = URLPrefixFill.DEFAULT_SITE_PREFIX)
    private String first_access_path;

    /**
     * 首次访问referer
     */
    private String first_access_referer;

    /**
     * 首次访问时间
     */
    @TimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Long first_access_time;

    /**
     * 最后一次访问时间
     */
    @TimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Long last_access_time;

    /**
     * 最后一次访问IP
     */
    private String last_access_ip;

    /**
     * 最后一次访问user-agent
     */
    private String last_access_user_agent;

    /**
     * 访问次数
     */
    private int access_times;

    /**
     * 扩展变量
     * 用来标记访问的深度
     * 如记录：
     * 访问视频的记录可分为 只看到引用的IFRAME、打开了详情页、点击了播放
     * 访问图片可分为 只点击放大查看了、点开详情页也查看了
     * 注意：此值在同个主体多个记录中取最大值
     */
    private Integer deep;

    public AccessDetail() {
    }

    public Long getAr_id() {
        return ar_id;
    }

    public void setAr_id(Long ar_id) {
        this.ar_id = ar_id;
    }

    public Long getUid() {
        return uid;
    }

    public void setUid(Long uid) {
        this.uid = uid;
    }

    public Long getCreation_id() {
        return creation_id;
    }

    public void setCreation_id(Long creation_id) {
        this.creation_id = creation_id;
    }

    public String getFirst_access_path() {
        return first_access_path;
    }

    public void setFirst_access_path(String first_access_path) {
        this.first_access_path = first_access_path;
    }

    public String getFirst_access_referer() {
        return first_access_referer;
    }

    public void setFirst_access_referer(String first_access_referer) {
        this.first_access_referer = first_access_referer;
    }

    public Long getFirst_access_time() {
        return first_access_time;
    }

    public void setFirst_access_time(Long first_access_time) {
        this.first_access_time = first_access_time;
    }

    public Long getLast_access_time() {
        return last_access_time;
    }

    public void setLast_access_time(Long last_access_time) {
        this.last_access_time = last_access_time;
    }

    public String getLast_access_ip() {
        return last_access_ip;
    }

    public void setLast_access_ip(String last_access_ip) {
        this.last_access_ip = last_access_ip;
    }

    public String getLast_access_user_agent() {
        return last_access_user_agent;
    }

    public void setLast_access_user_agent(String last_access_user_agent) {
        this.last_access_user_agent = last_access_user_agent;
    }

    public int getAccess_times() {
        return access_times;
    }

    public void setAccess_times(int access_times) {
        this.access_times = access_times;
    }

    public Integer getDeep() {
        return deep;
    }

    public void setDeep(Integer deep) {
        this.deep = deep;
    }
}
