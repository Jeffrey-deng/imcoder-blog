package site.imcoder.blog.common;

import java.io.Serializable;


/**
 * 分页工具类
 * @author dengchao
 */
public class PageUtil implements Serializable {

	private Integer pageSize = 5;// 页面显示记录条数

	private Integer rowCount;// 总行数

	private Integer pageCount;// 总页数========5/2========

	private Integer nextPage;// 下一页========当前页+1============

	private Integer prePage;// 上一页========当前页-1============

	private Integer firstPage = 1;// 第一页

	private Integer lastPage;// 最后一页 总页数

	private Integer currentPage;// 当前页===================

	private Integer startRow;// (当前页-1)*页记录条数

	private Integer endRow;

	public Integer getStartRow() {
		return startRow;
	}

	public void setStartRow(Integer startRow) {
		this.startRow = startRow;
	}

	public Integer getEndRow() {
		return endRow;
	}

	public void setEndRow(Integer endRow) {
		this.endRow = endRow;
	}

	public PageUtil(Integer rowCount, Integer current) {
		this(rowCount, 5, current);
	}

	public PageUtil(Integer rowCount, Integer pageSize, Integer current) {

		this.pageSize = pageSize;
		this.rowCount = rowCount;
		this.currentPage = current;

		// 判断总行数是不是每页显示的倍数
		if (rowCount % pageSize == 0) {
			pageCount = rowCount / pageSize;
		} else {
			// 如果不是倍数 总页数加一页
			pageCount = rowCount / pageSize + 1;
		}

		// 果当前页小于或等于零 将当前页赋值为1
		if (currentPage <= 0) {
			currentPage = 1;
			// 如果当关页大于总页数 将总页数赋值为总页数
		} else if (currentPage >= pageCount) {
			currentPage = pageCount;
		}

		// 如果当前页大于1并且小于或等于总页数 则上一页可以减1
		if (currentPage > 1 && currentPage <= pageCount) {
			prePage = currentPage - 1;
			// 如果当前页刚好等于第一页数 则将上一页数赋值第一页
		} else {
			prePage = firstPage;
		}

		// 赋值总页数
		lastPage = pageCount;
		// 如果当前页大于0并且小于总页数 则下一页可以加1
		if (currentPage > 0 && currentPage < pageCount) {
			nextPage = currentPage + 1;
			// 如果当前页刚好等于总页数 则将总页数赋于下一次
		} else {
			nextPage = pageCount;
		}

		// 起始行 (当前页-1)*业大小
		startRow = (currentPage - 1) * pageSize;
		// 结束行 (当前页)*业大小
		endRow = currentPage * pageSize;
	}

	public Integer getPageSize() {
		return pageSize;
	}

	public void setPageSize(Integer pageSize) {
		this.pageSize = pageSize;
	}

	public Integer getRowCount() {
		return rowCount;
	}

	public void setRowCount(Integer rowCount) {
		this.rowCount = rowCount;
	}

	public Integer getPageCount() {
		return pageCount;
	}

	public void setPageCount(Integer pageCount) {
		this.pageCount = pageCount;
	}

	public Integer getNextPage() {
		return nextPage;
	}

	public void setNextPage(Integer nextPage) {
		this.nextPage = nextPage;
	}

	public Integer getPrePage() {
		return prePage;
	}

	public void setPrePage(Integer prePage) {
		this.prePage = prePage;
	}

	public Integer getFirstPage() {
		return firstPage;
	}

	public void setFirstPage(Integer firstPage) {
		this.firstPage = firstPage;
	}

	public Integer getLastPage() {
		return lastPage;
	}

	public void setLastPage(Integer lastPage) {
		this.lastPage = lastPage;
	}

	public Integer getCurrentPage() {
		return currentPage;
	}

	public void setCurrentPage(Integer currentPage) {
		this.currentPage = currentPage;
	}

}
