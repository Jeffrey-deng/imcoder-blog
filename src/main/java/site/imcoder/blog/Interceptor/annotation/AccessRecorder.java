package site.imcoder.blog.Interceptor.annotation;

import java.lang.annotation.*;

/**
 * 访问历史记录器
 *
 * @author Jeffrey.Deng
 * @date 2019-10-30
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface AccessRecorder {

    public static enum Types {

        ARTICLE(0), PHOTO(1), VIDEO(2), ALBUM(3), USER(4);

        private int value;

        private Types(int value) {
            this.value = value;
        }
    }

    public static enum Actions {

        SAVE(0), LIKE(1), DELETE(-1);

        private int value;

        private Actions(int value) {
            this.value = value;
        }
    }

    /**
     * 记录的对象类型, 由 {@link Types} 枚举
     *
     * @return
     */
    public Types type();

    /**
     * request中bean对象的key
     *
     * @return
     */
    public String key();

    /**
     * 记录的处理的响应方式，是保存、点赞、删除？
     * 由 {@link Actions} 枚举
     *
     * @return
     */
    public Actions action() default Actions.SAVE;

    /**
     * 扩展变量
     * 用来标记访问的深度
     * 如记录：
     * 访问视频的记录可分为 只看到引用的IFRAME、打开了详情页、点击了播放
     * 访问图片可分为 只点击放大查看了、点开详情页也查看了
     * 注意：此值在同个主体多个记录中取最大值
     *
     * @return 用来指定当前请求的status，如需在controller方法体内修改status的值，使用 {@link #recordRewriteKey}
     */
    public int deep() default 0;

    /**
     * 当需要在controller方法体内修改请求的 {@link site.imcoder.blog.entity.AccessRecord} 的值
     * 需要在controller方法的model或IResponse中储存返回一个status
     * 而此字段用来指明存储时使用的key
     *
     * @return
     */
    public String recordRewriteKey() default "recordRewriteKey";

}
