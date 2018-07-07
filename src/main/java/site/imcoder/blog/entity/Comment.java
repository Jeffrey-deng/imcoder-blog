package site.imcoder.blog.entity;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import site.imcoder.blog.controller.json.LongToDateStrJsonSerializer;

import java.io.Serializable;

/**
 * description: 评论
 * @author dengchao
 * @date 2016-9-9
 */
public class Comment implements Serializable {

	private static final long serialVersionUID = 1L;

	/**
	 * 评论ID
	 */
	private int cid ;

	/**
	 * 文章ID
	 */
	private int aid ;

	/**
	 * 该评论所有者
	 */
	private User user ;

	/**
	 * 该评论回复的评论id
	 * 如果为0，则是回复文章
	 */
	private int parentid ;

	/**
	 * 该评论回复的评论的用户id
	 * 无须从数据查出，仅用来保存在客户端上传评论时携带uid
	 * 直接回复文章为作者id,回复评论为用户id
	 */
	private int replyuid;

	/**
	 * 评论内容
	 */
	private String content ;

	/**
	 * 发送时间
	 */
	private Long send_time ;

	public int getCid() {
		return cid;
	}

	public void setCid(int cid) {
		this.cid = cid;
	}

	public int getAid() {
		return aid;
	}

	public void setAid(int aid) {
		this.aid = aid;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}


	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	//格式化时间
	@JsonSerialize(using=LongToDateStrJsonSerializer.class)
	public Long getSend_time() {
		return send_time;
	}

	public void setSend_time(Long send_time) {
		this.send_time = send_time;
	}

	public static long getSerialversionuid() {
		return serialVersionUID;
	}

	public int getParentid() {
		return parentid;
	}

	public void setParentid(int parentid) {
		this.parentid = parentid;
	}


	public int getReplyuid() {
		return replyuid;
	}

	public void setReplyuid(int replyuid) {
		this.replyuid = replyuid;
	}

	@Override
	public String toString() {
		return "Comment [cid=" + cid + ", aid=" + aid + ", user=" + user
				+ ", parentid=" + parentid + ", replyuid=" + replyuid
				+ ", content=" + content + ", send_time=" + send_time + "]";
	}

}
