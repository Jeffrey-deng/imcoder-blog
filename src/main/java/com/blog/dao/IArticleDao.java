package com.blog.dao;

import com.blog.common.PageUtil;
import com.blog.entity.Article;
import com.blog.entity.Comment;
import com.blog.entity.User;

import java.util.List;
import java.util.Map;

/**
 * 数据处理层接口
 * @author dengchao
 *
 */
public interface IArticleDao {

	/**
	 * 保存文章
	 * @param article
	 * @return 如果成功返回    文章id在对象article里
	 * 		     如果失败返回0
	 */
	public int save(Article article);

	/**
	 * 更新文章
	 * @param article
	 * @return
	 */
	public int update(Article article);

	/**
	 * 打开文章
	 * @param aid
	 * @return
	 */
	public Article find(int aid);

	/**
	 * 查找文章数量 根据条件
	 * @param condition
	 * @param loginUser
	 * @return
	 */
	public int findCount(Article condition, User loginUser);

	/**
	 * 查找文章列表
	 * @param page
	 * @param condition
	 * @param loginUser
	 * @return
	 */
	public List<Article> findList(PageUtil page, Article condition, User loginUser);

	/**
	 * 删除文章
	 * @param article
	 * @return
	 */
	public int delete(Article article);

	/**
	 * 添加评论
	 */
	public int saveComment(Comment comment);

	/**
	 * 查找文章评论
	 */
	public List<Comment> findCommentList(int aid);

	/**
	 * 删除评论 有子节点 就改content为 ‘已删除’
	 * @param comment
	 * @return 0：删除失败 1：填充为‘已删除’ 2：完全删除
	 */
	public int deleteComment(Comment comment);

	/**
	 * 增加评论数
	 */
	public int raiseCommentCnt(Comment comment);

	/**
	 * 减少评论数
	 */
	public int reduceCommentCnt(Comment comment);

	/**
	 * 增加收藏数
	 */
	public int raiseCollectCnt(Article article);

	/**
	 * 减少收藏数
	 */
	public int reduceCollectCnt(Article article);

	/**
	 * 增加点击数
	 */
	public int raiseClickCnt(Article article);

	/**
	 * 获得置顶列表
	 * @param num 列表数量
	 * @return List<Article>
	 */
	public List<Article> findTopsList(int num);

	/**获得排行榜列表
	 * @param uid 是否查询所有还是单个 uid=0 为查询所有
	 * @param num list长度 默认5
	 * @return Map<String,Object> 
	 */
	public Map<String, Object> findRankList(int uid, int num);

}