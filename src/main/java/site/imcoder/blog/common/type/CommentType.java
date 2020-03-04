package site.imcoder.blog.common.type;

/**
 * @author Jeffrey.Deng
 * @date 2016-10-27
 */
public enum CommentType {

    ARTICLE(0),    // 文章
    PHOTO(1), // 照片
    VIDEO(2), // 视频
    AlBUM(3), // 相册
    PHOTO_TOPIC(4); // 照片合集

    public final int value;

    private CommentType(int value) {
        this.value = value;
    }

    /**
     * 根据Type的值，获取对应的type枚举对象
     *
     * @param value
     * @return
     */
    public static CommentType valueOf(int value) {
        for (CommentType type : values()) {
            if (type.value == value) {
                return type;
            }
        }
        return null;
    }

}
