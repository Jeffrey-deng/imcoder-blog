package site.imcoder.blog.service.impl;

import org.apache.commons.io.FileUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.entity.Album;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.Video;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.Map;

/**
 * @author Jeffrey.Deng
 * @date 2019-04-09
 * 约定（优先级从上往下）：
 * 1、不是为特定功能操作的方法输入都为绝对路径
 * 2、为特定功能操作的方法输入都为相对路径
 * 3、变量名没有特别标明relative的都为绝对路径
 */
@Service("fileService")
public class FileServiceWrapper implements IFileService {

    @Resource(name = "localFileService")
    private IFileService localFileService;

    @Resource(name = "ossFileService")
    private RemoteFileServiceWrapper remoteFileService;

    private Mode fileSystemMode;

    protected Mode runMode() {
        if (fileSystemMode == null) {
            fileSystemMode = Mode.valueOfName(Config.get(ConfigConstants.CLOUD_FILE_SYSTEM_MODE));
        }
        return fileSystemMode;
    }

    protected boolean isLocalcMode() {
        return Mode.LOCAL.value.equals(Config.get(ConfigConstants.CLOUD_FILE_SYSTEM_MODE));
    }

    protected boolean isSyncMode() {
        return Mode.SYNC.value.equals(Config.get(ConfigConstants.CLOUD_FILE_SYSTEM_MODE));
    }

    protected boolean isRomoteMode() {
        return Mode.REMOTE.value.equals(Config.get(ConfigConstants.CLOUD_FILE_SYSTEM_MODE));
    }

    /**
     * 生成基于云盘基础路径的path
     *
     * @param relativePath
     * @return
     */
    @Override
    public String baseCloudDir(String relativePath) {
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                return localFileService.baseCloudDir(relativePath);
            case REMOTE:
                return remoteFileService.baseCloudDir(relativePath);
            default:
                return relativePath;
        }
    }

    /**
     * 生成基于文章图片上传路径的path
     *
     * @param relativePath
     * @return
     */
    @Override
    public String baseArticleUploadDir(String relativePath) {
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                return localFileService.baseArticleUploadDir(relativePath);
            case REMOTE:
                return remoteFileService.baseArticleUploadDir(relativePath);
            default:
                return relativePath;
        }
    }

    /**
     * 生成基于垃圾回收路径的path
     *
     * @param relativePath
     * @return
     */
    @Override
    public String baseTrashRecycleDir(String relativePath) {
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                return localFileService.baseTrashRecycleDir(relativePath);
            case REMOTE:
                return remoteFileService.baseTrashRecycleDir(relativePath);
            default:
                return relativePath;
        }
    }

    protected String replaceLocalToRemote(String path) {
        if (Utils.isEmpty(path)) {
            return path;
        } else {
            int i = path.indexOf(Config.get(ConfigConstants.CLOUD_FILE_BASEPATH));
            if (i == 0) {
                return remoteFileService.cloud_file_basepath + path.substring(i + Config.get(ConfigConstants.CLOUD_FILE_BASEPATH).length());
            } else {
                int j = path.indexOf(Config.get(ConfigConstants.TRASH_RECYCLE_BASEPATH));
                if (j == 0) {
                    return remoteFileService.trash_recycle_basepath + path.substring(i + Config.get(ConfigConstants.TRASH_RECYCLE_BASEPATH).length());
                } else {
                    return path;
                }
            }
        }
    }

    @Override
    public boolean copy(String fromPath, String toPath, boolean isFile) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
                result = localFileService.copy(fromPath, toPath, isFile);
                break;
            case SYNC:
                result = localFileService.copy(fromPath, toPath, isFile) && remoteFileService.copy(replaceLocalToRemote(fromPath), replaceLocalToRemote(toPath), isFile);
                break;
            case REMOTE:
                result = remoteFileService.copy(fromPath, toPath, isFile);
                break;
        }
        return result;
    }

    @Override
    public boolean move(String fromPath, String toPath, boolean isFile) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
                result = localFileService.move(fromPath, toPath, isFile);
                break;
            case SYNC:
                result = localFileService.move(fromPath, toPath, isFile) && remoteFileService.move(replaceLocalToRemote(fromPath), replaceLocalToRemote(toPath), isFile);
                break;
            case REMOTE:
                result = remoteFileService.move(fromPath, toPath, isFile);
                break;
        }
        return result;
    }

    @Override
    public boolean delete(String path) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
                result = localFileService.delete(path);
                break;
            case SYNC:
                result = localFileService.delete(path) && remoteFileService.delete(replaceLocalToRemote(path));
                break;
            case REMOTE:
                result = remoteFileService.delete(path);
                break;
        }
        return result;
    }

    @Override
    public boolean deleteDirectory(String path) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
                result = localFileService.deleteDirectory(path);
                break;
            case SYNC:
                result = localFileService.deleteDirectory(path) && remoteFileService.deleteDirectory(replaceLocalToRemote(path));
                break;
            case REMOTE:
                result = remoteFileService.deleteDirectory(path);
                break;
        }
        return result;
    }

    @Override
    public void createDirs(String path) {
        switch (runMode()) {
            case LOCAL:
                localFileService.createDirs(path);
                break;
            case SYNC:
                localFileService.createDirs(path);
                remoteFileService.createDirs(replaceLocalToRemote(path));
                break;
            case REMOTE:
                remoteFileService.createDirs(path);
                break;
        }
    }

    @Override
    public boolean existsFile(String filePath) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                result = localFileService.existsFile(filePath);
                break;
            case REMOTE:
                result = remoteFileService.existsFile(filePath);
                break;
        }
        return result;
    }

    @Override
    public boolean existsDir(String dirPath) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                result = localFileService.existsDir(dirPath);
                break;
            case REMOTE:
                result = remoteFileService.existsDir(dirPath);
                break;
        }
        return result;
    }

    /**
     * 保存文本
     *
     * @param text
     * @param filePath
     */
    @Override
    public boolean saveText(String text, String filePath) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
                result = localFileService.saveText(text, filePath);
                break;
            case SYNC:
                result = localFileService.saveText(text, filePath) && remoteFileService.saveText(text, replaceLocalToRemote(filePath));
                break;
            case REMOTE:
                result = remoteFileService.saveText(text, replaceLocalToRemote(filePath));
                break;
        }
        return result;
    }

    /**
     * 文件保存
     *
     * @param inputStream 输入流
     * @param filePath    文件保存绝对路径
     * @return
     */
    @Override
    public boolean save(InputStream inputStream, String filePath) {
        return save(inputStream, filePath, null);
    }

    /**
     * 文件保存
     *
     * @param inputStream 输入流
     * @param filePath    文件保存绝对路径
     * @param metadata    文件头信息
     * @return
     */
    @Override
    public boolean save(InputStream inputStream, String filePath, Map<String, Object> metadata) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
                result = localFileService.save(inputStream, filePath, metadata);
                break;
            case SYNC:
                result = localFileService.save(inputStream, filePath, metadata);
                if (result) {
                    try {
                        inputStream = new FileInputStream(filePath);
                        result = remoteFileService.save(inputStream, replaceLocalToRemote(filePath), metadata);
                    } catch (FileNotFoundException e) {
                        e.printStackTrace();
                        result = false;
                    }
                }
                break;
            case REMOTE:
                result = remoteFileService.save(inputStream, filePath, metadata);
                break;
        }
        return result;
    }

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
    @Override
    public boolean saveArticleAttachment(MultipartFile file, String relativePath, String fileName, boolean isImage, Map<String, Object> map) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
            case REMOTE:
                result = localFileService.saveArticleAttachment(file, relativePath, fileName, isImage, map);
                break;
        }
        return result;
    }

    /**
     * 下载互联网图片
     *
     * @param url          图片链接
     * @param relativePath 保存相对路径
     * @param fileName     图片重命名名字
     * @param map
     * @return boolean 是否下载成功
     */
    @Override
    public boolean downloadInternetImage(String url, String relativePath, String fileName, Map<String, Object> map) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
            case REMOTE:
                result = localFileService.downloadInternetImage(url, relativePath, fileName, map);
                break;
        }
        return result;
    }

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
    @Override
    public int deleteFileByUrl(String file_url, String deleteRelativePath, HttpServletRequest request) {
        int result = 500;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
            case REMOTE:
                result = localFileService.deleteFileByUrl(file_url, deleteRelativePath, request);
                break;
        }
        return result;
    }

    /**
     * 保存用户头像
     *
     * @param inputStream
     * @param relativePath
     * @param fileName
     * @return
     */
    @Override
    public boolean saveHeadPhotoFile(InputStream inputStream, String relativePath, String fileName) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
            case REMOTE:
                result = localFileService.saveHeadPhotoFile(inputStream, relativePath, fileName);
                break;
        }
        return result;
    }

    /**
     * 保存用户相片
     *
     * @param inputStream
     * @param photo
     * @param relativePath
     * @param fileName
     * @return
     */
    @Override
    public boolean savePhotoFile(InputStream inputStream, Photo photo, String relativePath, String fileName) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
                result = localFileService.savePhotoFile(inputStream, photo, relativePath, fileName);
                break;
            case SYNC:
                result = localFileService.savePhotoFile(inputStream, photo, relativePath, fileName);
                if (result) {
                    try {
                        FileInputStream remoteInput = new FileInputStream(localFileService.baseCloudDir(relativePath + fileName));
                        result = remoteFileService.savePhotoFile(remoteInput, photo, relativePath, fileName);
                    } catch (FileNotFoundException e) {
                        e.printStackTrace();
                        result = false;
                    }
                }
                break;
            case REMOTE:
                if (!Utils.isEmpty(fileName)) {
                    // 暂时中转处理（现存本地，获取meta, 再删除），以后再改
                    result = localFileService.savePhotoFile(inputStream, photo, relativePath, fileName);
                    if (result) {
                        try {
                            FileInputStream remoteInput = new FileInputStream(localFileService.baseCloudDir(relativePath + fileName));
                            result = remoteFileService.savePhotoFile(remoteInput, photo, relativePath, fileName);
                        } catch (FileNotFoundException e) {
                            e.printStackTrace();
                            result = false;
                        } finally {
                            FileUtils.deleteQuietly(new File(localFileService.baseCloudDir(relativePath + fileName)));
                        }
                    }
                }
                break;
        }
        return result;
    }

    /**
     * 创建相册文件夹
     *
     * @param relativePath
     * @return
     */
    @Override
    public void createAlbumFolder(String relativePath) {
        switch (runMode()) {
            case LOCAL:
                localFileService.createAlbumFolder(relativePath);
                break;
            case SYNC:
                localFileService.createAlbumFolder(relativePath);
                remoteFileService.createAlbumFolder(relativePath);
                break;
            case REMOTE:
                remoteFileService.createAlbumFolder(relativePath);
                break;
        }
    }

    /**
     * 回收<b>文件</b>到trashPathDir目录
     *
     * @param sourceFileFullPath 源文件物理绝对路径
     * @param trashPathDir       <b>回收站的目录</b>(<b>不可为文件</b>)，可输入绝对路径，输入相对路径则会转换为相对回收站的路径
     * @return
     */
    @Override
    public boolean recycleTrashFile(String sourceFileFullPath, String trashPathDir) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
                result = localFileService.recycleTrashFile(sourceFileFullPath, trashPathDir);
                break;
            case SYNC:
                result = localFileService.recycleTrashFile(sourceFileFullPath, trashPathDir)
                        && remoteFileService.recycleTrashFile(replaceLocalToRemote(sourceFileFullPath), replaceLocalToRemote(trashPathDir));
                break;
            case REMOTE:
                result = remoteFileService.recycleTrashFile(sourceFileFullPath, trashPathDir);
                break;
        }
        return result;
    }

    /**
     * 回收<b>文件与目录</b>，且在回收站中建立与sourceRelativePath相同的目录结构
     *
     * @param sourceBasePath     物理基础路径
     * @param sourceRelativePath 源文件相对路径，回收站中的目录结构也将使用此结构
     * @param isFile             回收的是不是文件
     */
    @Override
    public boolean recycleTrash(String sourceBasePath, String sourceRelativePath, boolean isFile) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
                result = localFileService.recycleTrash(sourceBasePath, sourceRelativePath, isFile);
                break;
            case SYNC:
                result = localFileService.recycleTrash(sourceBasePath, sourceRelativePath, isFile)
                        && remoteFileService.recycleTrash(replaceLocalToRemote(sourceBasePath), replaceLocalToRemote(sourceRelativePath), isFile);
                break;
            case REMOTE:
                result = remoteFileService.recycleTrash(sourceBasePath, sourceRelativePath, isFile);
                break;
        }
        return result;
    }

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
    @Override
    public boolean recycleTrash(String sourceFullPath, boolean isFile, String trashPath) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
                result = localFileService.recycleTrash(sourceFullPath, isFile, trashPath);
                break;
            case SYNC:
                result = localFileService.recycleTrash(sourceFullPath, isFile, trashPath)
                        && remoteFileService.recycleTrash(replaceLocalToRemote(sourceFullPath), isFile, replaceLocalToRemote(trashPath));
                break;
            case REMOTE:
                result = remoteFileService.recycleTrash(sourceFullPath, isFile, trashPath);
                break;
        }
        return result;
    }

    /**
     * 保存用户视频
     *
     * @param inputStream
     * @param video
     * @param relativePath
     * @param fileName
     * @return
     */
    @Override
    public boolean saveVideoFile(InputStream inputStream, Video video, String relativePath, String fileName) {
        boolean result = false;
        switch (runMode()) {
            case LOCAL:
                result = localFileService.saveVideoFile(inputStream, video, relativePath, fileName);
                break;
            case SYNC:
                result = localFileService.saveVideoFile(inputStream, video, relativePath, fileName);
                if (result) {
                    try {
                        FileInputStream remoteInput = new FileInputStream(localFileService.baseCloudDir(relativePath + fileName));
                        result = remoteFileService.saveVideoFile(remoteInput, video, relativePath, fileName);
                    } catch (FileNotFoundException e) {
                        e.printStackTrace();
                        result = false;
                    }
                }
                break;
            case REMOTE:
                if (!Utils.isEmpty(fileName)) {
                    // 暂时中转处理（现存本地，获取meta, 再删除），以后再改
                    result = localFileService.saveVideoFile(inputStream, video, relativePath, fileName);
                    if (result) {
                        try {
                            FileInputStream remoteInput = new FileInputStream(localFileService.baseCloudDir(relativePath + fileName));
                            result = remoteFileService.saveVideoFile(remoteInput, video, relativePath, fileName);
                        } catch (FileNotFoundException e) {
                            e.printStackTrace();
                            result = false;
                        } finally {
                            FileUtils.deleteQuietly(new File(localFileService.baseCloudDir(relativePath + fileName)));
                        }
                    }
                }
                break;
        }
        return result;
    }

    /**
     * 生成相册相对路径
     *
     * @param album
     * @return
     */
    @Override
    public String generateAlbumPath(Album album) {
        String path = null;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                path = localFileService.generateAlbumPath(album);
                break;
            case REMOTE:
                path = remoteFileService.generateAlbumPath(album);
                break;
        }
        return path;
    }

    /**
     * 得到照片保存的文件夹
     *
     * @param album
     * @return
     */
    @Override
    public String generatePhotoFolderPath(Album album) {
        String path = null;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                path = localFileService.generatePhotoFolderPath(album);
                break;
            case REMOTE:
                path = remoteFileService.generatePhotoFolderPath(album);
                break;
        }
        return path;
    }

    /**
     * 得到该照片在这个相册的下一个文件名
     * 规则为 albumId_index_uploadTime
     *
     * @param photo
     * @param savePath
     * @return
     */
    @Override
    public String generateNextPhotoFilename(Photo photo, String savePath) {
        String fileName = null;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                fileName = localFileService.generateNextPhotoFilename(photo, savePath);
                break;
            case REMOTE:
                fileName = remoteFileService.generateNextPhotoFilename(photo, savePath);
                break;
        }
        return fileName;
    }

    /**
     * 得到该照片在这个相册的文件名
     * 规则为 albumId_index_uploadTime
     *
     * @param photo
     * @param index 编号，属于这个文件夹第几个文件
     * @return
     */
    @Override
    public String generatePhotoFilename(Photo photo, int index) {
        String fileName = null;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                fileName = localFileService.generatePhotoFilename(photo, index);
                break;
            case REMOTE:
                fileName = remoteFileService.generatePhotoFilename(photo, index);
                break;
        }
        return fileName;
    }

    /**
     * 生成视频保存文件夹相对路径
     *
     * @param video
     * @return
     */
    @Override
    public String generateVideoFolderPath(Video video) {
        String path = null;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                path = localFileService.generateVideoFolderPath(video);
                break;
            case REMOTE:
                path = remoteFileService.generateVideoFolderPath(video);
                break;
        }
        return path;
    }

    /**
     * 生成下一个视频的文件名
     *
     * @param video
     * @param savePath 保存文件夹的绝对路径
     * @return
     */
    @Override
    public String generateNextVideoName(Video video, String savePath) {
        String fileName = null;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                fileName = localFileService.generateNextVideoName(video, savePath);
                break;
            case REMOTE:
                fileName = remoteFileService.generateNextVideoName(video, savePath);
                break;
        }
        return fileName;
    }

    /**
     * 生成视频的文件名
     *
     * @param video
     * @param index 编号，属于这个文件夹第几个文件
     * @return
     */
    @Override
    public String generateVideoFilename(Video video, int index) {
        String fileName = null;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                fileName = localFileService.generateVideoFilename(video, index);
                break;
            case REMOTE:
                fileName = remoteFileService.generateVideoFilename(video, index);
                break;
        }
        return fileName;
    }

    /**
     * 生成照片的块文件夹地址
     *
     * @param photo
     * @return
     */
    @Override
    public String generatePhotoSaveBlockPath(Photo photo) {
        String path = null;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                path = localFileService.generatePhotoSaveBlockPath(photo);
                break;
            case REMOTE:
                path = remoteFileService.generatePhotoSaveBlockPath(photo);
                break;
        }
        return path;
    }

    /**
     * 生成照片文件名称，需要照片id
     *
     * @param photo
     * @param blockPath 块文件夹地址
     * @return
     */
    @Override
    public String generatePhotoFilename(Photo photo, String blockPath) {
        String fileName = null;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                fileName = localFileService.generatePhotoFilename(photo, blockPath);
                break;
            case REMOTE:
                fileName = remoteFileService.generatePhotoFilename(photo, blockPath);
                break;
        }
        return fileName;
    }

    /**
     * 生成视频的块文件夹地址
     *
     * @param video
     * @return
     */
    @Override
    public String generateVideoSaveBlockPath(Video video) {
        String path = null;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                path = localFileService.generateVideoSaveBlockPath(video);
                break;
            case REMOTE:
                path = remoteFileService.generateVideoSaveBlockPath(video);
                break;
        }
        return path;
    }

    /**
     * 生成视频文件名称，需要视频id
     *
     * @param video
     * @param blockPath 块文件夹地址
     * @return
     */
    @Override
    public String generateVideoFilename(Video video, String blockPath) {
        String fileName = null;
        switch (runMode()) {
            case LOCAL:
            case SYNC:
                fileName = localFileService.generateVideoFilename(video, blockPath);
                break;
            case REMOTE:
                fileName = remoteFileService.generateVideoFilename(video, blockPath);
                break;
        }
        return fileName;
    }

}
