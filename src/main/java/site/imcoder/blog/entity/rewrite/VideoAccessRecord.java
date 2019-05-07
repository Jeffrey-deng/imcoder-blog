package site.imcoder.blog.entity.rewrite;

import site.imcoder.blog.entity.AccessRecord;
import site.imcoder.blog.entity.Video;

import java.io.Serializable;

/**
 * spring mvc 数据绑定识别不了泛型，需要新建一类
 *
 * @author Jeffrey.Deng
 * @date 2018-12-31
 */
public class VideoAccessRecord extends AccessRecord<Video> implements Serializable {

    private static final long serialVersionUID = 7804974574811374285L;

}
