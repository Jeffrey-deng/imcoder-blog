package site.imcoder.blog.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;

import java.io.Serializable;
import java.util.List;

/**
 * 用户数据的统计
 *
 * @author Jeffrey.Deng
 * @date 2016-10-24
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserStats implements Serializable {

    private static final long serialVersionUID = 2119252316029163011L;

    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long uid;

    private Integer articleCount; // 文章数

    private Integer followingCount; // 关注数

    private Integer followerCount; // 粉丝数

    private Integer friendCount; // 好友数

    private Integer articleClickCount; // 文章总浏览数

    private Integer articleCommentCount; // 文章总评论数

    private Integer articleCollectCount; // 文章总被收藏数

    private Integer articleLikeCount; // 文章总点赞数

    private List<Category> articleCateCount; // 用户文章各分类的统计量

    public UserStats() {
    }

    public UserStats(Integer articleCount, Integer followingCount, Integer followerCount, Integer friendCount, Integer articleClickCount, Integer articleCommentCount, Integer articleCollectCount, Integer articleLikeCount, List<Category> articleCateCount) {
        this.articleCount = articleCount;
        this.followingCount = followingCount;
        this.followerCount = followerCount;
        this.friendCount = friendCount;
        this.articleClickCount = articleClickCount;
        this.articleCommentCount = articleCommentCount;
        this.articleCollectCount = articleCollectCount;
        this.articleLikeCount = articleLikeCount;
        this.articleCateCount = articleCateCount;
    }

    public Long getUid() {
        return uid;
    }

    public void setUid(Long uid) {
        this.uid = uid;
    }

    public Integer getArticleCount() {
        return articleCount;
    }

    public void setArticleCount(Integer articleCount) {
        this.articleCount = articleCount;
    }

    public Integer getFollowingCount() {
        return followingCount;
    }

    public void setFollowingCount(Integer followingCount) {
        this.followingCount = followingCount;
    }

    public Integer getFollowerCount() {
        return followerCount;
    }

    public void setFollowerCount(Integer followerCount) {
        this.followerCount = followerCount;
    }

    public Integer getFriendCount() {
        return friendCount;
    }

    public void setFriendCount(Integer friendCount) {
        this.friendCount = friendCount;
    }

    public Integer getArticleClickCount() {
        return articleClickCount;
    }

    public void setArticleClickCount(Integer articleClickCount) {
        this.articleClickCount = articleClickCount;
    }

    public Integer getArticleCommentCount() {
        return articleCommentCount;
    }

    public void setArticleCommentCount(Integer articleCommentCount) {
        this.articleCommentCount = articleCommentCount;
    }

    public Integer getArticleCollectCount() {
        return articleCollectCount;
    }

    public void setArticleCollectCount(Integer articleCollectCount) {
        this.articleCollectCount = articleCollectCount;
    }

    public Integer getArticleLikeCount() {
        return articleLikeCount;
    }

    public void setArticleLikeCount(Integer articleLikeCount) {
        this.articleLikeCount = articleLikeCount;
    }

    public List<Category> getArticleCateCount() {
        return articleCateCount;
    }

    public void setArticleCateCount(List<Category> articleCateCount) {
        this.articleCateCount = articleCateCount;
    }
}
