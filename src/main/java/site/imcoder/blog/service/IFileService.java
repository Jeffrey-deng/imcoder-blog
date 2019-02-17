package site.imcoder.blog.service;

import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.entity.Album;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.Video;

import javax.servlet.http.HttpServletRequest;
import java.io.InputStream;
import java.util.Map;

/**
 * 处理文件操作
 *
 * @author Jeffrey.Deng
 * @date 2018/1/3
 */
public interface IFileService {

    // 文件系统运行模式
    public enum Mode {
        LOCAL("local"),
        REMOTE("remote"),
        SYNC("sync");

        public String value;

        Mode(String name) {
            this.value = name;
        }

        public static Mode valueOfName(String name) {
            for (Mode system : values()) {
                if (system.value.equals(name)) {
                    return system;
                }
            }
            return null;
        }
    }

    /**
     * 生成基于云盘基础路径的path
     *
     * @param relativePath
     * @return
     */
    public String baseCloudDir(String relativePath);

    /**
     * 生成基于文章图片上传路径的path
     *
     * @param relativePath
     * @return
     */
    public String baseArticleUploadDir(String relativePath);

    /**
     * 生成基于垃圾回收路径的path
     *
     * @param relativePath
     * @return
     */
    public String baseTrashRecycleDir(String relativePath);

    public boolean copy(String fromPath, String toPath, boolean isFile);

    public boolean move(String fromPath, String toPath, boolean isFile);

    public boolean delete(String path);

    public boolean deleteDirectory(String path);

    public void createDirs(String path);

    public boolean existsFile(String filePath);

    public boolean existsDir(String dirPath);

    /**
     * 保存文本
     *
     * @param text
     * @param filePath
     */
    public boolean saveText(String text, String filePath);

    /**
     * 文件保存
     *
     * @param inputStream 输入流
     * @param filePath    文件保存绝对路径
     * @return
     */
    public boolean save(InputStream inputStream, String filePath);

    /**
     * 保存文章中上传的图片或附件
     *
     * @param file
     * @param relativePath 上传的文件的存储相对路径
     * @param fileName     图片重命名名字
     * @param isImage      是否是图片
     * @param map
     * @return boolean 是否成功保存
     */
    public boolean saveArticleAttachment(MultipartFile file, String relativePath, String fileName, boolean isImage, Map<String, Object> map);

    /**
     * 下载互联网图片
     *
     * @param url          图片链接
     * @param relativePath 保存相对路径
     * @param fileName     图片重命名名字
     * @param map
     * @return boolean 是否下载成功
     */
    public boolean downloadInternetImage(String url, String relativePath, String fileName, Map<String, Object> map);


    /**
     * 通过链接删除文件
     *
     * @param file_url           文件链接
     * @param deleteRelativePath 从哪个基础路径查找此文件
     * @param request
     * @return int
     * 0 : 删除失败
     * 1 ：删除成功
     * 2 ：文件不存在 或 该链接不属于本站
     */
    public int deleteFileByUrl(String file_url, String deleteRelativePath, HttpServletRequest request);

    /**
     * 保存用户头像
     *
     * @param inputStream
     * @param relativePath
     * @param fileName
     * @return
     */
    public boolean saveHeadPhotoFile(InputStream inputStream, String relativePath, String fileName);

    /**
     * 保存用户相片
     *
     * @param inputStream
     * @param photo
     * @param relativePath
     * @param fileName
     * @return
     */
    public boolean savePhotoFile(InputStream inputStream, Photo photo, String relativePath, String fileName);

    /**
     * 创建相册文件夹
     *
     * @param relativePath
     * @return
     */
    public void createAlbumFolder(String relativePath);

    /**
     * 回收<b>文件</b>到trashPathDir目录
     *
     * @param sourceFileFullPath 源文件物理绝对路径
     * @param trashPathDir       <b>回收站的目录</b>(<b>不可为文件</b>)，可输入绝对路径，输入相对路径则会转换为相对回收站的路径
     * @return
     */
    public boolean recycleTrashFile(String sourceFileFullPath, String trashPathDir);

    /**
     * 回收<b>文件与目录</b>，且在回收站中建立与sourceRelativePath相同的目录结构
     *
     * @param sourceBasePath     物理基础路径
     * @param sourceRelativePath 源文件相对路径，回收站中的目录结构也将使用此结构
     * @param isFile             回收的是不是文件
     */
    public boolean recycleTrash(String sourceBasePath, String sourceRelativePath, boolean isFile);

    /**
     * 回收<b>文件与目录</b>
     * <p>
     * <code>sourceFullPath</code> 与 <code>trashPath</code> 需要是同一种类型，<b>同为文件</b>或者<b>同为路径</b>;
     * <p>不是同一种请使用
     * <pre>
     *     {@link #recycleTrashFile(String, String)}
     * </pre>
     *
     * @param sourceFullPath 源文件全路径
     * @param isFile         回收的是不是文件
     * @param trashPath      回收路径，可输入绝对路径，输入相对路径则会转换为相对回收站的路径
     */
    public boolean recycleTrash(String sourceFullPath, boolean isFile, String trashPath);

    /**
     * 保存用户视频
     *
     * @param inputStream
     * @param video
     * @param relativePath
     * @param fileName
     * @return
     */
    public boolean saveVideoFile(InputStream inputStream, Video video, String relativePath, String fileName);

    /**
     * 生成相册相对路径
     *
     * @param album
     * @return
     */
    public String generateAlbumPath(Album album);

    /**
     * 得到照片保存的文件夹
     *
     * @return
     */
    public String generatePhotoFolderPath(Album album);

    /**
     * 得到该照片在这个相册的下一个文件名
     * 规则为 albumId_index_uploadTime
     *
     * @param photo
     * @param savePath
     * @return
     */
    public String generateNextPhotoFilename(Photo photo, String savePath);

    /**
     * 得到该照片在这个相册的文件名
     * 规则为 albumId_index_uploadTime
     *
     * @param photo
     * @param index 编号，属于这个文件夹第几个文件
     * @return
     */
    public String generatePhotoFilename(Photo photo, int index);

    /**
     * 生成视频保存文件夹相对路径
     *
     * @param video
     * @return
     */
    public String generateVideoFolderPath(Video video);

    /**
     * 生成下一个视频的文件名
     *
     * @param video
     * @param savePath 保存文件夹的绝对路径
     * @return
     */
    public String generateNextVideoName(Video video, String savePath);

    /**
     * 生成视频的文件名
     *
     * @param video
     * @param index 编号，属于这个文件夹第几个文件
     * @return
     */
    public String generateVideoFilename(Video video, int index);

}
