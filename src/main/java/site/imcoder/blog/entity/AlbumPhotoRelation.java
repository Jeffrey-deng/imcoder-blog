package site.imcoder.blog.entity;

import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;

import java.io.Serializable;

/**
 * 相册与照片关联类
 *
 * @author Jeffrey.Deng
 * @date 2019-03-02
 */
public class AlbumPhotoRelation implements Serializable {

    private static final long serialVersionUID = -6007975894089096962L;

    private Long aprid;

    @PrimaryKeyConvert
    private Long album_id;

    @PrimaryKeyConvert
    private Long photo_id;

    // 排序权重
    private Long sort;

    public AlbumPhotoRelation() {
    }

    public AlbumPhotoRelation(Long album_id, Long photo_id, Long sort) {
        this.album_id = album_id;
        this.photo_id = photo_id;
        this.sort = sort;
    }

    public Long getAprid() {
        return aprid;
    }

    public void setAprid(Long aprid) {
        this.aprid = aprid;
    }

    public Long getAlbum_id() {
        return album_id;
    }

    public void setAlbum_id(Long album_id) {
        this.album_id = album_id;
    }

    public Long getPhoto_id() {
        return photo_id;
    }

    public void setPhoto_id(Long photo_id) {
        this.photo_id = photo_id;
    }

    public Long getSort() {
        return sort;
    }

    public void setSort(Long sort) {
        this.sort = sort;
    }
}
