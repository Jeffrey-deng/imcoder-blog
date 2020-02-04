package site.imcoder.blog.common.type;

/**
 * 匹配到了，响应方式
 *
 * @author Jeffrey.Deng
 * @date 2017-10-27
 */
public enum TagWrapperType {

    MARK(0),    // 标识标签，不做匹配用，主要是利用tagWrapper给tag提供一个ID
    SEARCH(1);  // 搜索标签

    public final int value;

    private TagWrapperType(int value) {
        this.value = value;
    }

    /**
     * 根据Type的值，获取对应的type枚举对象
     *
     * @param value
     * @return
     */
    public static TagWrapperType valueOf(int value) {
        for (TagWrapperType type : values()) {
            if (type.value == value) {
                return type;
            }
        }
        return null;
    }

}
