package com.blog.service;

import com.blog.entity.Article;
import com.blog.entity.Category;
import com.blog.entity.Comment;
import com.blog.entity.User;

import java.util.List;
import java.util.Map;


public interface IArticleService {

    /**
     * description:保存文章
     *
     * @param article
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，500: 失败
     */
    public int save(Article article, User loginUser);

    /**
     * 更新文章
     *
     * @param article
     * @return
     */
    /**
     * @param article
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此文章，500: 失败
     */
    public int update(Article article, User loginUser);

    /**
     * 打开文章
     *
     * @param aid
     * @param loginUser (to check AUTH)
     * @return map (article:文章，flag：{200, 401, 403：无权限，404：无此文章})
     */
    public Map<String, Object> detail(int aid, User loginUser);

    /**
     * 查找文章列表
     * @param pageSize  每页篇数
     * @param jumpPage  跳转页
     * @param condition article查找条件
     * @param loginUser 发送请求的用户 用来判断权限
     * @return 文章列表, 分页bean
     */
    public Map<String, Object> list(int pageSize, int jumpPage, Article condition, User loginUser);

    /**
     * 删除文章
     *
     * @param article
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此文章，500: 失败
     */
    public int delete(Article article, User loginUser);

    /**
     * 得到每种分类的数量
     *
     * @return
     */
    public List<Category> getCategoryCount();

    /**
     * 得到评论列表
     *
     * @param aid
     * @return
     */
    public List<Comment> findCommentList(int aid);

    /**
     * 添加评论
     *
     * @param comment
     * @param loginUser
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，500: 失败
     */
    public int addComment(Comment comment, User loginUser);

    /**
     * 删除评论
     *
     * @param comment
     * @param loginUser
     * @return flag - 200：成功，201：填充为‘已删除’，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    public int deleteComment(Comment comment, User loginUser);

    /**
     * description: 获得置顶列表
     *
     * @param size 列表数量
     * @return List<Article>
     */
    public List<Article> listTops(int size);

    /**
     * description:获得排行榜列表
     *
     * @param uid  是否查询所有还是单个用户 uid=0 为查询所有
     * @param size list长度 默认5
     * @return Map<String,List>
     */
    public Map<String, Object> listRanking(int uid, int size);
}
