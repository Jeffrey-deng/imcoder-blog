package site.imcoder.blog.entity.rewrite;

import site.imcoder.blog.entity.ActionRecord;
import site.imcoder.blog.entity.Comment;

import java.io.Serializable;

/**
 * spring mvc 数据绑定识别不了泛型，需要新建一类
 *
 * @author Jeffrey.Deng
 * @date 2018-12-31
 */
public class CommentActionRecord extends ActionRecord<Comment> implements Serializable {

    private static final long serialVersionUID = -5751914607528350344L;

}
