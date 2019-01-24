package site.imcoder.blog.common;

/**
 * @author Jeffrey.Deng
 */
public interface Callable<I, R> {
    public R call(I i) throws Exception;
}
