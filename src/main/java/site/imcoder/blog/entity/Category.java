package site.imcoder.blog.entity;

import java.io.Serializable;

/**
 * description: 文章类型
 * @author dengchao
 * @date 2016-9-1
 */
public class Category implements Serializable {

	private static final long serialVersionUID = 1L;

	/**
	 * 类型id
	 */
	private int atid;

	/**
	 * 类型名称
	 */
	private String atname;

	/**
	 * 类型 数量
	 */
	private int count;

	public Category() {
	}

	public Category(int atid, String atname) {
		this.atid = atid;
		this.atname = atname;
	}

	public int getAtid() {
		return atid;
	}

	public void setAtid(int atid) {
		this.atid = atid;
	}

	public String getAtname() {
		return atname;
	}

	public void setAtname(String atname) {
		this.atname = atname;
	}

	public int getCount() {
		return count;
	}

	public void setCount(int count) {
		this.count = count;
	}



}
