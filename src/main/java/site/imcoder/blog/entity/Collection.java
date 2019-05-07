package site.imcoder.blog.entity;

import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;

import java.io.Serializable;

/**
 * description: 文章收藏类
 *
 * @author dengchao
 * @date 2017-5-2
 */
public class Collection implements Serializable {

    private static final long serialVersionUID = 226746702853035681L;

    /**
     * 收藏编号
     */
    private Long coid;

    /**
     * 用户编号
     */
    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long uid;

    /**
     * 文章
     */
    private Article article;

    /**
     * 收藏创建时间
     */
    // @JsonSerialize(using = LongToDateStrJsonSerializer_Two.class) //  [json] Long-->DateStr
    @TimeFormat(pattern = "yyyy年MM月dd日(E) ahh:mm", locale = "zh-CN")
    private Long clet_time;

    public Collection() {
    }

    public Collection(Long uid, Long article_aid) {
        this.uid = uid;
        this.article = new Article(article_aid);
    }

    public Long getCoid() {
        return coid;
    }

    public void setCoid(Long coid) {
        this.coid = coid;
    }

    public Long getUid() {
        return uid;
    }

    public void setUid(Long uid) {
        this.uid = uid;
    }

    public Article getArticle() {
        return article;
    }

    public void setArticle(Article article) {
        this.article = article;
    }

    public Long getClet_time() {
        return clet_time;
    }

    public void setClet_time(Long clet_time) {
        this.clet_time = clet_time;
    }
}
