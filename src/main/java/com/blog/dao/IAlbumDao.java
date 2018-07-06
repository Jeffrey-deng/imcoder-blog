package com.blog.dao;

import com.blog.entity.Album;
import com.blog.entity.Photo;
import com.blog.entity.User;

import java.util.List;

/**
 * Created by Jeffrey.Deng on 2018/1/5.
 * 相册持久化层
 */
public interface IAlbumDao {

    /**
     * 保存相册
     * @param album
     * @return
     */
    public int saveAlbum(Album album);

    /**
     * 查找相册
     * @param album
     * @return
     */
    public Album findAlbumInfo(Album album);

    /**
     * 查找相册列表
     * @param album
     * @param loginUser
     * @return
     */
    public List<Album> findAlbumInfoList(Album album, User loginUser);

    /**
     * 更新相册信息
     * @param album
     * @return
     */
    public int updateAlbum(Album album);

    /**
     * 更新相册封面
     * @param album
     * @return
     */
    public int updateCoverForAlbum(Album album);

    /**
     * 删除相册
     * @param album
     * @return
     */
    public int deleteAlbum(Album album);

    /**
     * 插入照片
     * @param photo
     * @return
     */
    public int savePhoto(Photo photo);

    /**
     * 删除照片
     * @param photo
     * @return
     */
    public int deletePhoto(Photo photo);

    /**
     * 更新照片信息
     * @param photo
     * @return
     */
    public int updatePhoto(Photo photo);

    /**
     * 查找照片信息
     * @param photo
     * @return
     */
    public Photo findPhotoInfo(Photo photo);

    /**
     * 查找一个相册下的照片集合
     * @param album
     * @return
     */
    public List<Photo> findPhotosFromAlbum(Album album);

    /**
     * 查找照片集合
     * @param photo
     * @param logic_conn
     * @param start
     * @param size
     * @param loginUser
     * @return photos
     */
    public List<Photo> findPhotoList(Photo photo, String logic_conn, int start, int size, User loginUser);
}
