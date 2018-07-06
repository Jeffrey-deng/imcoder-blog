package com.blog.entity;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.io.Serializable;
import java.util.Date;

/**
 * description: 文章类
 * @author dengchao
 * @date 2016-9-1
 */
public class Article implements Serializable {

	private static final long serialVersionUID = 1L;

	/**
	 * 文章id
	 */
	private int aid;

	/**
	 * 文章标题
	 */
	private String title;

	/**
	 * 作者信息
	 */
	private User author;

	/**
	 * 文章类型
	 */
	private Category category;

	/**
	 * 标签
	 */
	private String tags;

	/**
	 * 摘要
	 */
	private String summary;

	/**
	 * 发布时间
	 */
	@JsonFormat(pattern="yyyy-MM-dd HH:mm:ss",timezone = "GMT+8")
	private Date create_time;

	/**
	 * 更新时间
	 */
	@JsonFormat(pattern="yyyy-MM-dd HH:mm:ss",timezone = "GMT+8")
	private Date update_time;

	/**
	 * 查看人数
	 */
	private int click;

	/**
	 * 收藏数
	 */
	private int collection;

	/**
	 * 评论数
	 */
	private int comment;

	/**
	 * 文章的模式:0为公开，1为仅好友查看，2为私有
	 */
	private int permission;

	/**
	 * 是否置顶:0为否，1为是
	 */
	private int top;

	/**
	 * 是否博主推荐:0为否，1为是
	 */
	private int recommend;

	/**
	 * 文章详情
	 */
	private String detail;

	public int getAid() {
		return aid;
	}

	public void setAid(int aid) {
		this.aid = aid;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public User getAuthor() {
		return author;
	}

	public void setAuthor(User author) {
		this.author = author;
	}

	public Category getCategory() {
		return category;
	}

	public void setCategory(Category category) {
		this.category = category;
	}

	public String getTags() {
		return tags;
	}

	public void setTags(String tags) {
		this.tags = tags;
	}

	public String getSummary() {
		return summary;
	}

	public void setSummary(String summary) {
		this.summary = summary;
	}

	public Date getCreate_time() {
		return create_time;
	}

	public void setCreate_time(Date create_time) {
		this.create_time = create_time;
	}

	public Date getUpdate_time() {
		return update_time;
	}

	public void setUpdate_time(Date update_time) {
		this.update_time = update_time;
	}

	public int getClick() {
		return click;
	}

	public void setClick(int click) {
		this.click = click;
	}

	public int getPermission() {
		return permission;
	}

	public void setPermission(int permission) {
		this.permission = permission;
	}

	public int getTop() {
		return top;
	}

	public void setTop(int top) {
		this.top = top;
	}

	public int getRecommend() {
		return recommend;
	}

	public void setRecommend(int recommend) {
		this.recommend = recommend;
	}

	public String getDetail() {
		return detail;
	}

	public void setDetail(String detail) {
		this.detail = detail;
	}

	@Override
	public String toString() {
		return "Article [aid=" + aid + ", title=" + title + ", author="
				+ author + ", category=" + category + ", tags=" + tags
				+ ", summary=" + summary + ", create_time=" + create_time
				+ ", update_time=" + update_time + ", click=" + click
				+ ", permission=" + permission + ", top=" + top + ", recommend="
				+ recommend + ", detail=" + detail + "]";
	}

	public int getCollection() {
		return collection;
	}

	public void setCollection(int collection) {
		this.collection = collection;
	}

	public int getComment() {
		return comment;
	}

	public void setComment(int comment) {
		this.comment = comment;
	}

}
