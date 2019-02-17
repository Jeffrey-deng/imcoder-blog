package site.imcoder.blog.entity;

import java.io.Serializable;

/**
 * 相册与照片关联类
 *
 * @author Jeffrey.Deng
 * @date 2019-03-02
 */
public class AlbumPhotoRelation implements Serializable {

    private static final long serialVersionUID = -6007975894089096962L;

    private int aprid;

    private int album_id;

    private int photo_id;

    // 排序权重
    private int sort;

    public AlbumPhotoRelation() {
    }

    public AlbumPhotoRelation(int album_id, int photo_id, int sort) {
        this.album_id = album_id;
        this.photo_id = photo_id;
        this.sort = sort;
    }

    public int getAprid() {
        return aprid;
    }

    public void setAprid(int aprid) {
        this.aprid = aprid;
    }

    public int getAlbum_id() {
        return album_id;
    }

    public void setAlbum_id(int album_id) {
        this.album_id = album_id;
    }

    public int getPhoto_id() {
        return photo_id;
    }

    public void setPhoto_id(int photo_id) {
        this.photo_id = photo_id;
    }

    public int getSort() {
        return sort;
    }

    public void setSort(int sort) {
        this.sort = sort;
    }
}
