package site.imcoder.blog.entity;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import site.imcoder.blog.controller.json.LongToDateStrJsonSerializer_Two;

import java.io.Serializable;

/**
 * description: 文章收藏类
 *
 * @author dengchao
 * @date 2017-5-2
 */
public class Collection implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 收藏编号
     */
    private int coid;

    /**
     * 用户编号
     */
    private int uid;

    /**
     * 文章作者id
     */
    private int author_uid;

    /**
     * 文章作者昵称
     */
    private String author_nickname;

    /**
     * 文章编号
     */
    private int article_aid;

    /**
     * 文章标题
     */
    private String article_title;

    /**
     * 收藏创建时间
     */
    private Long clet_time;

    public Collection() {
    }

    public Collection(int uid, int article_aid) {
        this.uid = uid;
        this.article_aid = article_aid;
    }

    public int getCoid() {
        return coid;
    }

    public void setCoid(int coid) {
        this.coid = coid;
    }

    public String getAuthor_nickname() {
        return author_nickname;
    }

    public void setAuthor_nickname(String author_nickname) {
        this.author_nickname = author_nickname;
    }

    public int getAuthor_uid() {
        return author_uid;
    }

    public void setAuthor_uid(int author_uid) {
        this.author_uid = author_uid;
    }

    public String getArticle_title() {
        return article_title;
    }

    public void setArticle_title(String article_title) {
        this.article_title = article_title;
    }

    @JsonSerialize(using = LongToDateStrJsonSerializer_Two.class)
    public Long getClet_time() {
        return clet_time;
    }

    public void setClet_time(Long clet_time) {
        this.clet_time = clet_time;
    }

    public int getArticle_aid() {
        return article_aid;
    }

    public void setArticle_aid(int article_aid) {
        this.article_aid = article_aid;
    }

    public int getUid() {
        return uid;
    }

    public void setUid(int uid) {
        this.uid = uid;
    }

}
