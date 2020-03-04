package site.imcoder.blog.entity.rewrite;

import site.imcoder.blog.entity.CreationSetting;

/**
 * 视频的一些追加设置
 * 基本采取默认值为false的原则
 *
 * @author Jeffrey.Deng
 * @date 2020-03-09
 */
public class VideoSetting extends CreationSetting {

    /**
     * 默认旋转角度，【0，90，180，270】
     */
    private Integer rotate;

    /**
     * 开启循环播放
     */
    private Boolean enable_loop;

    /**
     * 关闭下载
     */
    private Boolean disable_download;

    public VideoSetting() {
    }

    public Integer getRotate() {
        return rotate;
    }

    public void setRotate(Integer rotate) {
        this.rotate = rotate;
    }

    public Boolean getEnable_loop() {
        return enable_loop;
    }

    public void setEnable_loop(Boolean enable_loop) {
        this.enable_loop = enable_loop;
    }

    public Boolean getDisable_download() {
        return disable_download;
    }

    public void setDisable_download(Boolean disable_download) {
        this.disable_download = disable_download;
    }

}