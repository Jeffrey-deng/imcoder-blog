package site.imcoder.blog.cache.sort;

import org.springframework.stereotype.Component;
import site.imcoder.blog.entity.Article;

import java.util.Comparator;

/**
 * description: 最新文章比较器
 *
 * @author dengchao
 * @date 2017-4-13
 */
@Component("articleTimeComparator")
public class ArticleTimeComparator implements Comparator<Article> {

    @Override
    public int compare(Article a1, Article a2) {
        return -Long.compare(a1.getCreate_time().getTime(), a2.getCreate_time().getTime());
    }

}
