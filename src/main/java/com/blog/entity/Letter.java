package com.blog.entity;

import com.blog.controller.json.LongToDateStrJsonSerializer;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

import java.io.Serializable;

/**
 * description: 私信表
 * @author dengchao
 * @date 2016-9-11
 */
public class Letter implements Serializable {

	private static final long serialVersionUID = 1L;

	/**
	 * 私信ID
	 */
	private int leid;

	/**
	 * 私信发送者ID
	 */
	private int s_uid;

	/**
	 * 私信接收者ID
	 */
	private int r_uid;

	/**
	 * 该查询者聊天对象的资料(不必须是消息发送者)
	 */
	private User chatUser;

	/**
	 * 私信内容
	 */
	private String content;

	/**
	 * 私信时间
	 */
	private Long send_time;

	/**
	 * 是否已经被阅读
	 * 0：未读
	 * 1：已读
	 */
	private int status;

	public int getLeid() {
		return leid;
	}

	public void setLeid(int leid) {
		this.leid = leid;
	}

	public int getS_uid() {
		return s_uid;
	}

	public void setS_uid(int s_uid) {
		this.s_uid = s_uid;
	}

	public int getR_uid() {
		return r_uid;
	}

	public void setR_uid(int r_uid) {
		this.r_uid = r_uid;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	//  [json] Long-->DateStr
	@JsonSerialize(using=LongToDateStrJsonSerializer.class)
	public Long getSend_time() {
		return send_time;
	}

	public void setSend_time(Long send_time) {
		this.send_time = send_time;
	}

	public int getStatus() {
		return status;
	}

	public void setStatus(int status) {
		this.status = status;
	}

	public User getChatUser() {
		return chatUser;
	}

	public void setChatUser(User chatUser) {
		this.chatUser = chatUser;
	}

}
