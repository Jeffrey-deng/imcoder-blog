package site.imcoder.blog.event.impl;

import org.springframework.stereotype.Component;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.event.IEventTrigger;

import javax.annotation.Resource;

/**
 * 事件触发接口
 * 用来统一处理统计类的日志收集
 *
 * @author dengchao
 * @date 2017-3-22
 */
@Component("trigger")
public class EventTriggerImpl implements IEventTrigger {

    @Resource
    Cache cache;

    /**
     * 文章被浏览事件
     *
     * @param user    访客
     * @param article 文章
     */
    @Override
    public void clickArticle(User user, Article article) {
        if (article != null) {
            cache.updateArticleClick(article, 1);

            cache.siteBuffer.put("articleViewCount", (Integer) cache.siteBuffer.get("articleViewCount") + 1);
        }
    }

    /**
     * 用户个人空间被浏览事件
     *
     * @param user
     */
    @Override
    public void clickUserHome(User user) {

    }

    /**
     * 网站被浏览事件
     *
     * @param user
     */
    @Override
    public void clickSite(User user) {

    }

    /**
     * 添加评论事件
     *
     * @param comment
     */
    @Override
    public void addComment(Comment comment) {
        if (comment != null) {
            Article article = new Article();
            article.setAid(comment.getAid());
            cache.updateArticleComment(article, 1);
        }
    }

    /**
     * 删除评论事件
     *
     * @param comment
     */
    @Override
    public void deleteComment(Comment comment) {
        if (comment != null) {
            Article article = new Article();
            article.setAid(comment.getAid());
            cache.updateArticleComment(article, -1);
        }
    }

    /**
     * 关注事件
     *
     * @param follow
     */
    @Override
    public void follow(Follow follow) {
        if (follow != null && follow.getUid() != 0 && follow.getFuid() != 0) {
            cache.putFollow(follow);

            User _fans = new User();
            _fans.setUid(follow.getUid());
            cache.updateUserFollowCount(_fans, 1);

            User _hostUser = new User();
            _hostUser.setUid(follow.getFuid());
            cache.updateUserFansCount(_hostUser, 1);
        }
    }


    /**
     * 取消关注事件
     *
     * @param follow
     */
    public void unFollow(Follow follow) {
        if (follow != null && follow.getUid() != 0 && follow.getFuid() != 0) {
            cache.removeFollow(follow);

            User _fans = new User();
            _fans.setUid(follow.getUid());
            cache.updateUserFollowCount(_fans, -1);

            User _hostUser = new User();
            _hostUser.setUid(follow.getFuid());
            cache.updateUserFansCount(_hostUser, -1);
        }

    }

    /**
     * 成为好友事件
     *
     * @param friend
     */
    public void friend(Friend friend) {
        if (friend != null && friend.getUid() != 0 && friend.getFid() != 0) {
            cache.putFriend(friend);
        }
    }

    /**
     * 取消好友事件
     *
     * @param friend
     */
    public void unFriend(Friend friend) {
        if (friend != null && friend.getUid() != 0 && friend.getFid() != 0) {
            cache.removeFriend(friend);
        }
    }

    /**
     * 新文章创建事件
     *
     * @param article
     * @param user
     */
    @Override
    public void newArticle(Article article, User user) {
        if (article != null && user != null) {
            article.setDetail("");
            cache.putArticle(article, user);
            cache.updateCategoryCount(article.getCategory(), 1);
            for (String tag : article.getTags().split("#")) {
                if (!tag.equals("")) {
                    cache.updateTagCount(tag, 1);
                }
            }

            cache.updateUserArticleCount(user, 1);

            cache.siteBuffer.put("articleCount", (Integer) cache.siteBuffer.get("articleCount") + 1);
        }
    }

    /**
     * 文章删除事件
     *
     * @param article
     * @param user
     */
    @Override
    public void deleteArticle(Article article, User user) {
        if (article != null && user != null) {

            Article _article = cache.getArticle(article.getAid(), Cache.READ);
            cache.updateCategoryCount(_article.getCategory(), -1);
            for (String tag : _article.getTags().split("#")) {
                if (!tag.equals("")) {
                    cache.updateTagCount(tag, -1);
                }
            }

            cache.updateUserArticleCount(user, -1);

            cache.removeArticle(article, user);

            cache.siteBuffer.put("articleCount", (Integer) cache.siteBuffer.get("articleCount") - 1);
        }
    }

    /**
     * 文章更新事件
     *
     * @param article
     * @param user
     */
    public void updateArticle(Article article, User user) {
        if (article != null && article.getAuthor() != null) {
            Article beforeArticle = cache.getArticle(article.getAid(), Cache.READ);
            cache.updateCategoryCount(beforeArticle.getCategory(), -1);
            for (String tag : beforeArticle.getTags().split("#")) {
                if (!tag.equals("")) {
                    cache.updateTagCount(tag, -1);
                }
            }

            article.setDetail("");
            cache.updateArticle(article, user);

            cache.updateCategoryCount(article.getCategory(), 1);
            for (String tag : article.getTags().split("#")) {
                if (!tag.equals("")) {
                    cache.updateTagCount(tag, 1);
                }
            }
        }
    }

    /**
     * 新用户创建事件
     *
     * @param user
     */
    @Override
    public void newUser(User user) {
        if (user != null) {
            cache.putUser(user);
            cache.siteBuffer.put("userCount", (Integer) cache.siteBuffer.get("userCount") + 1);
        }
    }

    /**
     * 用户更新事件
     *
     * @param user
     */
    public void updateUser(User user) {
        if (user != null) {
            cache.updateUser(user);
        }
    }

    /**
     * 用户删除事件
     *
     * @param user
     */
    @Override
    public void deleteUser(User user) {
        if (user != null) {
            cache.removeUser(user);

            cache.siteBuffer.put("userCount", (Integer) cache.siteBuffer.get("userCount") - 1);
        }
    }

    /**
     * 添加收藏事件
     *
     * @param article
     * @param user
     */
    @Override
    public void addCollection(Article article, User user) {
        if (article != null) {
            cache.updateArticleCollection(article, 1);
        }
    }

    /**
     * 删除收藏事件
     *
     * @param article
     * @param user
     */
    @Override
    public void deleteCollection(Article article, User user) {
        if (article != null) {
            cache.updateArticleCollection(article, -1);
        }
    }

}
