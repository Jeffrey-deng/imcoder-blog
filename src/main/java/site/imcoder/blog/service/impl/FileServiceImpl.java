package site.imcoder.blog.service.impl;

import org.apache.commons.io.FileUtils;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.common.FileUtil;
import site.imcoder.blog.common.ImageUtil;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.util.Date;
import java.util.Map;

/**
 * Created by Jeffrey.Deng on 2018/1/3.
 */
@Service("fileService")
public class FileServiceImpl implements IFileService {

    private static Logger logger = Logger.getLogger(FileServiceImpl.class);

    @Override
    public void copy(String formPath, String toPath) throws IOException {
        File source = new File(formPath);
        File targe = new File(toPath);
        FileUtils.copyFile(source, targe);
    }

    @Override
    public void move(String formPath, String toPath) throws IOException {
        File source = new File(formPath);
        File targe = new File(toPath);
        FileUtils.moveFile(source, targe);
    }

    @Override
    public int delete(String path) {
        File file = new File(path);
        if (file.exists() && file.isFile()) {
            logger.info("FileDelete from " + path);
            return FileUtils.deleteQuietly(file) == true ? 1 : 0;
        } else {
            logger.warn("FileDelete path is directory, so not delete:  " + path);
            return 0;
        }
    }

    @Override
    public int deleteDirectory(String path) {
        File file = new File(path);
        logger.info("FileDelete from " + path);
        return FileUtils.deleteQuietly(file) == true ? 1 : 0;
    }

    @Override
    public void createDirs(String path) {
        File dir = new File(path);
        if (!dir.exists()) {
            dir.mkdirs();
        }

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

        logger.info("ImageLocal into " + realPath + fileName);

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

        File file = new File(Config.get(ConfigConstants.CLOUD_FILE_BASEPATH) + file_url);
        if (!file.exists()) {
            file = new File(Config.get(ConfigConstants.ARTICLE_UPLOAD_BASEPATH) + file_url);
        }
        if (file.exists()) {
            if (file.isDirectory()) {
                logger.warn("FileDelete submit is a directory! so not delete：" + file.getPath());
                result = 404;
            } else if (file.delete()) {
                logger.info("FileDelete from " + file.getPath());
                result = 200;
            } else {
                logger.warn("FileDelete error path: " + file.getPath());
                result = 500;
            }
        } else {
            String realPath = request.getSession().getServletContext().getRealPath(file_url);
            //如果等于空  说明文件不存在 或  插入的图片是链接
            if (realPath != null) {
                File thefile = new File(realPath);
                if (thefile.isDirectory()) {
                    logger.warn("FileDelete submit is a directory! so not delete：" + file.getPath());
                    result = 404;
                } else if (thefile.delete()) {
                    //返回成功
                    logger.info("FileDelete from " + realPath);
                    result = 200;
                } else {
                    //返回失败
                    logger.warn("FileDelete error path: " + realPath);
                    result = 500;
                }
            } else {
                result = 404;
            }
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

}
