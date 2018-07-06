package com.blog.dao.impl;

import com.blog.dao.CommonDao;
import com.blog.dao.IAlbumDao;
import com.blog.entity.Album;
import com.blog.entity.Photo;
import com.blog.entity.User;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.interceptor.TransactionAspectSupport;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by Jeffrey.Deng on 2018/1/5.
 * 相册持久化层实现类
 */
@Repository("albumDao")
public class AlbumDaoImpl extends CommonDao implements IAlbumDao {

    private static Logger logger = Logger.getLogger(AlbumDaoImpl.class);

    /**
     * 保存相册
     * @param album
     * @return
     */
    @Override
    public int saveAlbum(Album album) {
        try {
            return this.getSqlSession().insert("album.saveAlbum", album);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("saveAlbum fail", e);
            return -1;
        }
    }

    /**
     * 查找相册
     * @param album
     * @return
     */
    @Override
    public Album findAlbumInfo(Album album) {
        return this.getSqlSession().selectOne("album.findAlbumInfo", album);
    }

    /**
     * 查找相册列表
     * @param album
     * @param loginUser
     * @return
     */
    @Override
    public List<Album> findAlbumInfoList(Album album, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        map.put("album", album);
        map.put("loginUser", loginUser);
        return this.getSqlSession().selectList("album.findAlbumInfoList", map);
    }

    /**
     * 更新相册信息
     * @param album
     * @return
     */
    @Override
    public int updateAlbum(Album album) {
        try {
            return this.getSqlSession().update("album.updateAlbum", album);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateAlbum fail", e);
            return -1;
        }
    }

    /**
     * 更新相册封面
     * @param album
     * @return
     */
    public int updateCoverForAlbum(Album album) {
        try {
            this.getSqlSession().update("album.clearCoverForAlbum", album);
            return this.getSqlSession().update("album.updateCoverForAlbum", album);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updateCoverForAlbum fail", e);
            return -1;
        }
    }

    /**
     * 删除相册
     * @param album
     * @return
     */
    @Override
    public int deleteAlbum(Album album) {
        try {
            return this.getSqlSession().delete("album.deleteAlbum", album);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deleteAlbum fail", e);
            return -1;
        }
    }

    /**
     * 插入照片
     * @param photo
     * @return
     */
    @Override
    public int savePhoto(Photo photo) {
        try {
            return this.getSqlSession().insert("album.savePhoto", photo);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("savePhoto fail", e);
            return -1;
        }
    }

    /**
     * 删除照片
     * @param photo
     * @return
     */
    @Override
    public int deletePhoto(Photo photo) {
        try {
            return this.getSqlSession().delete("album.deletePhoto", photo);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("deletePhoto fail", e);
            return -1;
        }
    }

    /**
     * 更新照片信息
     * @param photo
     * @return
     */
    @Override
    public int updatePhoto(Photo photo) {
        try {
            return this.getSqlSession().update("album.updatePhoto", photo);
        } catch (Exception e) {
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            logger.error("updatePhoto fail", e);
            return -1;
        }
    }

    /**
     * 查找照片信息
     * @param photo
     * @return
     */
    @Override
    public Photo findPhotoInfo(Photo photo) {
        return this.getSqlSession().selectOne("album.findPhotoInfo", photo);
    }

    /**
     * 查找一个相册下的照片集合
     * @param album
     * @return
     */
    public List<Photo> findPhotosFromAlbum(Album album){
        return this.getSqlSession().selectList("album.findPhotosFromAlbum", album);
    }

    /**
     * 查找照片集合
     * @param photo
     * @param logic_conn
     * @param start
     * @param size
     * @param loginUser
     * @return photos
     */
    public List<Photo> findPhotoList(Photo photo, String logic_conn, int start, int size, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        map.put("photo", photo);
        map.put("logic_conn", logic_conn);
        map.put("start", start);
        map.put("size", size);
        map.put("loginUser", loginUser);
        return this.getSqlSession().selectList("album.findPhotoList", map);
    }
}
