package site.imcoder.blog.cache.sort;

import org.springframework.stereotype.Component;
import site.imcoder.blog.entity.Article;

import java.util.Comparator;

/**
 * description: 热门文章比较器
 * @author dengchao
 * @date 2017-4-13
 */
@Component("articleHotComparator")
public class ArticleHotComparator implements Comparator<Article> {

	@Override
	public int compare(Article a1, Article a2) {
		return -Integer.compare(a1.getClick(), a2.getClick());
	}

}
