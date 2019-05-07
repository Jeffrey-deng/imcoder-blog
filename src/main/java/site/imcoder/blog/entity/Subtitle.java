package site.imcoder.blog.entity;

import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.controller.formatter.timeformat.TimeFormat;
import site.imcoder.blog.controller.formatter.urlprefix.URLPrefixFill;

/**
 * 视频字幕
 *
 * @author Jeffrey.Deng
 * @date 2020-01-28
 */
public class Subtitle {

    /**
     * 字幕id
     */
    private Long st_id;

    /**
     * 上传用户
     */
    @PrimaryKeyConvert(supportLongParse = true, printShort = false)
    private Long uid;

    /**
     * video id
     */
    @PrimaryKeyConvert
    private Long video_id;

    /**
     * 字幕可读名称
     */
    private String name;

    /**
     * 字幕语言
     */
    private String lang;

    /**
     * 字幕类型
     */
    private String mime_type;

    /**
     * 字幕文件路径
     */
    @URLPrefixFill(prefixConfigKey = URLPrefixFill.DEFAULT_CLOUD_PREFIX)
    private String path;

    /**
     * 字幕上传时间
     */
    @TimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Long upload_time;

    public Subtitle() {
    }

    public Long getSt_id() {
        return st_id;
    }

    public void setSt_id(Long st_id) {
        this.st_id = st_id;
    }

    public Long getUid() {
        return uid;
    }

    public void setUid(Long uid) {
        this.uid = uid;
    }

    public Long getVideo_id() {
        return video_id;
    }

    public void setVideo_id(Long video_id) {
        this.video_id = video_id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLang() {
        return lang;
    }

    public void setLang(String lang) {
        this.lang = lang;
    }

    public String getMime_type() {
        return mime_type;
    }

    public void setMime_type(String mime_type) {
        this.mime_type = mime_type;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Long getUpload_time() {
        return upload_time;
    }

    public void setUpload_time(Long upload_time) {
        this.upload_time = upload_time;
    }
}
