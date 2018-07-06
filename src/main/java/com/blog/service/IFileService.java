package com.blog.service;

import com.blog.entity.Photo;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Map;

/**
 * 处理文件操作
 * Created by Jeffrey.Deng on 2018/1/3.
 */
public interface IFileService {

    public void copy(String formPath, String toPath) throws IOException;

    public void move(String formPath, String toPath) throws IOException;

    public int delete(String path);

    public int deleteDirectory(String path);

    public void createDirs(String path);

    /**
     * 保存文章中上传的图片或附件
     * @param file
     * @param relativePath 上传的文件的存储相对路径
     * @param fileName 图片重命名名字
     * @param isImage 是否是图片
     * @param map
     * @return boolean 是否成功保存
     */
    public boolean saveArticleAttachment(MultipartFile file, String relativePath, String fileName, boolean isImage, Map map);

    /**
     * 下载互联网图片
     * @param url 图片链接
     * @param relativePath 保存相对路径
     * @param fileName 图片重命名名字
     * @param map
     * @return boolean 是否下载成功
     */
    public boolean downloadInternetImage(String url, String relativePath, String fileName, Map map);


    /**
     * 通过链接删除文件
     * @param file_url 文件链接
     * @param deleteRelativePath 从哪个基础路径查找此文件
     * @param request
     * @return int
     *          0 : 删除失败
     *          1 ：删除成功
     *          2 ：文件不存在 或 该链接不属于本站
     */
    public int deleteFileByUrl(String file_url, String deleteRelativePath, HttpServletRequest request);

    /**
     * 保存用户头像
     * @param file
     * @param relativePath
     * @param fileName
     * @return
     */
    public boolean saveHeadPhotoFile(MultipartFile file, String relativePath, String fileName);

    /**
     * 保存用户相片
     * @param file
     * @param photo
     * @param relativePath
     * @param fileName
     * @return
     */
    public boolean savePhotoFile(MultipartFile file, Photo photo, String relativePath, String fileName);

    /**
     * 创建相册文件夹
     * @param relativePath
     * @return
     */
    public void createAlbumFolder(String relativePath);
}
