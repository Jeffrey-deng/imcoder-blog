package site.imcoder.blog.service.impl;

import org.apache.commons.io.FileUtils;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.common.FileUtil;
import site.imcoder.blog.common.ImageUtil;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.Video;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.Date;
import java.util.Map;

/**
 * @author Jeffrey.Deng
 */
@Service("fileService")
public class FileServiceImpl implements IFileService {

    private static Logger logger = Logger.getLogger(FileServiceImpl.class);

    @Override
    public boolean copy(String formPath, String toPath, boolean isFile) {
        boolean rs = false;
        File source = new File(formPath);
        File target = new File(toPath);
        try {
            if (isFile) {
                FileUtils.copyFile(source, target);
            } else {
                if (target.getCanonicalPath().startsWith(source.getCanonicalPath())) {
                    throw new IOException("Cannot move directory to a subdirectory of itself");
                }
                FileUtils.copyDirectory(source, target); // 复制source下的文件，复制到target下
            }
            rs = true;
        } catch (IOException e) {
            e.printStackTrace();
            rs = false;
            logger.warn("FileCopy found exception " + e.getMessage() + " , formPath: \"" + formPath + "\", toPath: \"" + toPath + "\"");
        }
        return rs;
    }

    @Override
    public boolean move(String formPath, String toPath, boolean isFile) {
        boolean rs = false;
        File source = new File(formPath);
        File target = new File(toPath);
        try {
            if (isFile) {
                FileUtils.moveFile(source, target);
            } else {
                if (target.getCanonicalPath().startsWith(source.getCanonicalPath())) {
                    throw new IOException("Cannot move directory to a subdirectory of itself");
                }
                FileUtils.copyDirectory(source, target); // 复制source下的文件，复制到target下
                FileUtils.deleteDirectory(source);
                //FileUtils.moveDirectoryToDirectory(source, target, true); //这个方法是将source移动到target的目录下，所以不符合要求
                //FileUtils.moveDirectory(source, target); //这个方法相当于将source重命名为target，需要target不存在，所以不符合要求
            }
            rs = true;
        } catch (IOException e) {
            e.printStackTrace();
            rs = false;
            logger.warn("FileMove found exception " + e.getMessage() + " , formPath: \"" + formPath + "\", toPath: \"" + toPath + "\"");
        }
        return rs;
    }

    @Override
    public boolean delete(String path) {
        File file = new File(path);
        if (file.exists() && file.isFile()) {
            logger.info("FileDelete from " + path);
            return FileUtils.deleteQuietly(file);
        } else {
            logger.warn("FileDelete path is directory, so not delete:  " + path);
            return false;
        }
    }

    @Override
    public boolean deleteDirectory(String path) {
        File file = new File(path);
        logger.info("FileDelete from " + path);
        return FileUtils.deleteQuietly(file);
    }

    @Override
    public void createDirs(String path) {
        File dir = new File(path);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    /**
     * 保存文本
     *
     * @param text
     * @param filePath
     */
    @Override
    public boolean saveText(String text, String filePath) {
        boolean rs = false;
        try {
            FileUtils.write(new File(filePath), text);
            rs = true;
        } catch (IOException e) {
            e.printStackTrace();
            rs = false;
        }
        return rs;
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
    public boolean saveArticleAttachment(MultipartFile file, String relativePath, String fileName, boolean isImage, Map map) {

        boolean isSave = false;

        getCurrentFileDateDir(relativePath, isImage, map);

        //服务器文件目录真实路径
        String realPath = (String) map.get("realPath");
        //文件所属日期目录
        String datePath = (String) map.get("datePath");

        //保存目标文件对象
        File targetFile = new File(realPath, fileName);

        //保存
        try {
            file.transferTo(targetFile);
            isSave = true;
        } catch (IOException e) {
            //保存失败
            logger.error("FileUpload error dirPath: " + realPath);
            e.printStackTrace();
            return isSave;
        }
        logger.info("FileUpload into " + realPath + fileName);

        //计算图片高宽
        if (isImage) {
            calculateWH(targetFile, map);
        }

        //返回给客户端的相对路径
        if (isImage) {
            map.put("image_url", relativePath + datePath + fileName);
        } else {
            map.put("file_url", relativePath + datePath + fileName);
        }

        return isSave;
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
    public boolean downloadInternetImage(String url, String relativePath, String fileName, Map map) {
        boolean isDownload = false;

        getCurrentFileDateDir(relativePath, true, map);
        //服务器文件目录真实路径
        String realPath = (String) map.get("realPath");
        //文件所属日期目录
        String datePath = (String) map.get("datePath");

        //下载
        try {
            FileUtil.downloadFromUrl(url, fileName, realPath);
            isDownload = true;
        } catch (IOException e) {
            //下载失败
            logger.warn("localImage fail: " + url + " 此网站文件格式不支持，或该网站禁止下载");
            e.printStackTrace();
            return isDownload;
        }

        logger.info("ImageLocal into \"" + realPath + fileName + "\"");

        //保存的目标文件对象
        File targetFile = new File(realPath, fileName);
        //计算图片高宽
        calculateWH(targetFile, map);

        //返回给客户端的相对路径
        map.put("image_url", relativePath + datePath + fileName);

        return isDownload;
    }

    /**
     * 通过链接删除文件
     *
     * @param file_url           文件链接
     * @param deleteRelativePath 从哪个基础路径查找此文件
     * @param request
     * @return int
     * 500 : 删除失败
     * 200 ：删除成功
     * 404 ：文件不存在 或 该链接不属于本站 或 提交的URL为一个目录
     */
    @Override
    public int deleteFileByUrl(String file_url, String deleteRelativePath, HttpServletRequest request) {
        int result = 0;
        int index = file_url.indexOf(deleteRelativePath);
        if (index == -1) {
            result = 404;
            return result;
        }
        file_url = file_url.substring(index);

        String basePath = Config.get(ConfigConstants.CLOUD_FILE_BASEPATH);
        File file = new File(basePath + file_url);
        if (!file.exists()) {
            basePath = Config.get(ConfigConstants.ARTICLE_UPLOAD_BASEPATH);
            file = new File(basePath + file_url);
        }
        if (file.exists()) {
            if (file.isDirectory()) {
                logger.warn("FileDelete submit is a directory! so not delete：" + file.getPath());
                result = 404;
            } else if (recycleTrash(basePath, file_url, true)) {
                //logger.info("FileDelete from " + file.getPath());
                result = 200;
            } else {
                logger.warn("FileDelete error path: " + file.getPath());
                result = 500;
            }
        } else if (request != null) {
            String realPath = request.getSession().getServletContext().getRealPath(file_url);
            //如果等于空  说明文件不存在 或  插入的图片是链接
            if (realPath != null) {
                File thefile = new File(realPath);
                if (thefile.isDirectory()) {
                    logger.warn("FileDelete submit is a directory! so not delete：" + file.getPath());
                    result = 404;
                } else if (recycleTrashFile(realPath, "upload/image/article/deleteByRequest/")) {
                    //返回成功
                    //logger.info("FileDelete from " + realPath);
                    result = 200;
                } else {
                    //返回失败
                    logger.warn("FileDelete error path: " + realPath);
                    result = 500;
                }
            } else {
                result = 404;
            }
        } else {
            result = 404;
        }
        return result;
    }

    /**
     * 获得图片或附件当前日期所在的文件夹
     *
     * @param relativePath
     * @param isImage      是否为图片
     * @return String{datePath, realPath}
     */
    private void getCurrentFileDateDir(String relativePath, boolean isImage, Map map) {
        //文件所属日期目录
        String datePath = Utils.FormatDate(new Date(), "yyyy/MM/");
        map.put("datePath", datePath);

        //服务器文件真实路径
        //String realPath = request.getSession().getServletContext().getRealPath(basePath) + datePath;
        String realPath = null;
        if (isImage) {
            realPath = Config.get(ConfigConstants.ARTICLE_UPLOAD_BASEPATH) + relativePath + datePath;
        } else {
            realPath = Config.get(ConfigConstants.CLOUD_FILE_BASEPATH) + relativePath + datePath;
        }
        map.put("realPath", realPath);

        //不存在则创建
        File dir = new File(realPath);
        if (!dir.exists()) {
            logger.info("FileUpload create dirs " + realPath);
            dir.mkdirs();
        }
    }

    /**
     * 计算图片高宽
     *
     * @param targetFile
     * @param map
     */
    private void calculateWH(File targetFile, Map map) {
        int[] wh = null;
        try {
            wh = ImageUtil.getWH(targetFile);
        } catch (IOException e) {
            wh = new int[]{100, 100};
            logger.warn("ImageUpload error : " + targetFile.getPath() + " 此图片获取长宽失败");
            e.printStackTrace();
        }

        //设置后台计算js不能计算的图片实际尺寸
        map.put("width", wh[0]);
        map.put("height", wh[1]);
    }

    /**
     * 保存用户头像
     *
     * @param file
     * @param relativePath
     * @param fileName
     * @return
     */
    @Override
    public boolean saveHeadPhotoFile(MultipartFile file, String relativePath, String fileName) {
        boolean isSave = false;
        String realPath = Config.get(ConfigConstants.CLOUD_FILE_BASEPATH) + relativePath;
        createDirs(realPath);
        File head_photo = new File(realPath, fileName);
        try {
            file.transferTo(head_photo);
            isSave = true;
        } catch (IOException e) {
            logger.error("FileUpload error path: " + realPath + " 头像上传失败");
            e.printStackTrace();
        }
        return isSave;
    }

    /**
     * 保存用户相片
     *
     * @param file
     * @param photo
     * @param relativePath
     * @param fileName
     * @return
     */
    public boolean savePhotoFile(MultipartFile file, Photo photo, String relativePath, String fileName) {
        boolean isSave = false;
        String realPath = Config.get(ConfigConstants.CLOUD_FILE_BASEPATH) + relativePath;
        createDirs(realPath);
        File photoFile = new File(realPath, fileName);
        try {
            file.transferTo(photoFile);

            ImageUtil.SimpleImageInfo imageInfo = ImageUtil.getImageInfo(photoFile);
            photo.setWidth(imageInfo.getWidth());
            photo.setHeight(imageInfo.getHeight());
            photo.setSize((int) Math.round(photoFile.length() / 1024.0f));
            photo.setImage_type(imageInfo.getMimeType());

            isSave = true;
        } catch (IOException e) {
            logger.error("FileUpload error path: " + realPath + " 相册上传失败");
            e.printStackTrace();
        } finally {
            return isSave;
        }
    }

    /**
     * 创建相册文件夹
     *
     * @param relativePath
     * @return
     */
    public void createAlbumFolder(String relativePath) {
        String realPath = Config.get(ConfigConstants.CLOUD_FILE_BASEPATH) + relativePath;
        this.createDirs(realPath);
    }

    /**
     * 回收<b>文件</b>到trashPathDir目录
     *
     * @param sourceFileFullPath 源文件物理绝对路径
     * @param trashPathDir       <b>回收站的目录</b>(<b>不可为文件</b>)，可输入绝对路径，输入相对路径则会转换为相对回收站的路径
     * @return
     */
    public boolean recycleTrashFile(String sourceFileFullPath, String trashPathDir) {
        if (sourceFileFullPath == null || trashPathDir == null) {
            return false;
        }
        File file = new File(sourceFileFullPath);
        if (file.exists()) {
            if (!trashPathDir.endsWith("/")) {
                trashPathDir = trashPathDir + "/";
            }
            if (file.isFile()) {
                return recycleTrash(sourceFileFullPath, true, trashPathDir + file.getName());
            } else {
                logger.warn("FileRecycle error: sourceFileFullPath isn't a file! the path: " + sourceFileFullPath);
            }
        } else {
            logger.warn("FileRecycle error: sourceFileFullPath doesn't exist! the path: " + sourceFileFullPath);
        }
        return false;
    }

    /**
     * 回收<b>文件与目录</b>，且在回收站中建立与sourceRelativePath相同的目录结构
     *
     * @param sourceBasePath     物理基础路径
     * @param sourceRelativePath 源文件相对路径，回收站中的目录结构也将使用此结构
     * @param isFile             回收的是不是文件
     */
    public boolean recycleTrash(String sourceBasePath, String sourceRelativePath, boolean isFile) {
        if (sourceBasePath == null || sourceRelativePath == null) {
            return false;
        }
        String fullPath = sourceBasePath + sourceRelativePath;
        return recycleTrash(fullPath, isFile, sourceRelativePath);
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
    public boolean recycleTrash(String sourceFullPath, boolean isFile, String trashPath) {
        if (sourceFullPath == null || trashPath == null) {
            return false;
        }
        boolean rs = false;
        File file = new File(sourceFullPath);
        if (file.exists()) {
            if (!Utils.isAbsolutePath(trashPath)) {
                trashPath = Config.get(ConfigConstants.TRASH_RECYCLE_BASEPATH) + trashPath;
            }
            rs = move(file.getAbsolutePath(), trashPath, isFile);
            if (rs) {
                logger.info("FileRecycle from \"" + sourceFullPath + "\" to \"" + trashPath + "\"");
            }
        } else {
            logger.warn("FileRecycle error: path doesn't exist! the path: " + sourceFullPath);
        }
        return rs;
    }

    /**
     * 保存用户视频
     *
     * @param file
     * @param video
     * @param relativePath
     * @param fileName
     * @return
     */
    @Override
    public boolean saveVideoFile(MultipartFile file, Video video, String relativePath, String fileName) {
        boolean isSave = false;
        String realPath = Config.get(ConfigConstants.CLOUD_FILE_BASEPATH) + relativePath;
        createDirs(realPath);
        File videoFile = new File(realPath, fileName);
        try {
            file.transferTo(videoFile);
            Photo cover = video.getCover();
            video.setWidth(cover.getWidth());
            video.setHeight(cover.getHeight());
            video.setVideo_type("video/mp4");
            BigDecimal big = new BigDecimal(videoFile.length() / 1048576.00f); // MiB
            float size = big.setScale(2, BigDecimal.ROUND_HALF_UP).floatValue();
            video.setSize(size);
            isSave = true;
        } catch (IOException e) {
            logger.error("FileUpload error path: " + realPath + " 视频上传失败");
            e.printStackTrace();
        } finally {
            return isSave;
        }
    }

}
