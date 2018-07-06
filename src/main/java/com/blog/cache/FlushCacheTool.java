package com.blog.cache;

import com.blog.dao.ISiteDao;
import com.blog.entity.Article;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * description: 持久化缓存工具类
 * @author dengchao
 * @date 2017-4-12
 */
@Component("flushTool")
public class FlushCacheTool {

	private static Logger logger = Logger.getLogger(FlushCacheTool.class);

	//依赖注入DAO
	@Resource
	private ISiteDao statsDao;

	/**
	 * 持久化文章缓存
	 * @param articleBuffer
	 * @return int 成功与否
	 */
	public void flushArticleCache(Map<Integer,Article> articleBuffer, Set<Integer> hasUpdateArticle){

		if(hasUpdateArticle.size() == 0){
			logger.debug("FlushArticleCache: hasUpdateArticle 的大小为 0 ，跳过flush article");
			return;
		}

		List<Article> articleList = new ArrayList<Article>();

		logger.info("FlushArticleCache: Cache触发执行flush, flush article数量：" + hasUpdateArticle.size());

		for(int aid : hasUpdateArticle){
			Article article = articleBuffer.get(aid);
			if(article != null){
				articleList.add(article);
			}
		}
		//重置hasUpdateArticle
		if (statsDao.saveArticleBuffer(articleList) > 0) {

			logger.debug("FlushArticleCache: 重置 hasUpdateArticle");
			logger.info("FlushArticleCache: flush success!");

			hasUpdateArticle.clear();
		} else {
			String tips = "";
			if (hasUpdateArticle.size() > 0) {
				tips = " 可能是文章 ";
				for (int aid : hasUpdateArticle) {
					tips += (aid + ",");
				}
				tips = tips.substring(0, tips.length() - 1);
				tips += " 已经在数据库中删除。";
			}
			logger.warn("FlushArticleCache: flush fail!" + tips);
		}
	}

}
