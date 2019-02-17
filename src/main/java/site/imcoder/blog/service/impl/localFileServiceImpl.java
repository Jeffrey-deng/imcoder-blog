package site.imcoder.blog.service.impl;

import org.apache.commons.io.FileUtils;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.common.FileUtil;
import site.imcoder.blog.common.ImageUtil;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.entity.Album;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.Video;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.servlet.http.HttpServletRequest;
import java.io.*;
import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 本地文件系统
 * 约定（优先级从上往下）：
 * 1、不是为特定功能操作的方法输入都为绝对路径
 * 2、为特定功能操作的方法输入都为相对路径
 * 3、变量名没有特别标明relative的都为绝对路径
 *
 * @author Jeffrey.Deng
 */
@Service("localFileService")
public class localFileServiceImpl implements IFileService {

    private static Logger logger = Logger.getLogger(localFileServiceImpl.class);

    private static Comparator<File> ALBUM_DISK_PART_COMPARATOR = new Comparator<File>() {
        @Override
        public int compare(File left, File right) {
            return Integer.valueOf(right.getName()) - Integer.valueOf(left.getName());
        }
    };

    private static Comparator<File> ALBUM_DISK_PHOTO_COMPARATOR = new Comparator<File>() {
        @Override
        public int compare(File left, File right) {
            int num1 = Integer.valueOf(left.getName().substring(left.getName().indexOf('_') + 1, left.getName().lastIndexOf('_')));
            int num2 = Integer.valueOf(right.getName().substring(right.getName().indexOf('_') + 1, right.getName().lastIndexOf('_')));
            return num2 - num1;
        }
    };

    private static Comparator<File> VIDEO_DISK_COMPARATOR = new Comparator<File>() {
        @Override
        public int compare(File file1, File file2) {
            int num1 = Integer.valueOf(file1.getName().substring(file1.getName().indexOf('_') + 1, file1.getName().lastIndexOf('_')));
            int num2 = Integer.valueOf(file2.getName().substring(file2.getName().indexOf('_') + 1, file2.getName().lastIndexOf('_')));
            return num2 - num1;
        }
    };

    /**
     * 生成基于云盘基础路径的path
     *
     * @param relativePath
     * @return
     */
    @Override
    public String baseCloudDir(String relativePath) {
        if (Utils.isEmpty(relativePath)) {
            return Config.get(ConfigConstants.CLOUD_FILE_BASEPATH);
        } else {
            return Config.get(ConfigConstants.CLOUD_FILE_BASEPATH) + relativePath;
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
        if (Utils.isEmpty(relativePath)) {
            return Config.get(ConfigConstants.ARTICLE_UPLOAD_BASEPATH);
        } else {
            return Config.get(ConfigConstants.ARTICLE_UPLOAD_BASEPATH) + relativePath;
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
        if (Utils.isEmpty(relativePath)) {
            return Config.get(ConfigConstants.TRASH_RECYCLE_BASEPATH);
        } else {
            return Config.get(ConfigConstants.TRASH_RECYCLE_BASEPATH) + relativePath;
        }
    }

    @Override
    public boolean copy(String fromPath, String toPath, boolean isFile) {
        boolean rs = false;
        File source = new File(fromPath);
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
            rs = false;
            logger.warn("FileCopy found exception " + e.getMessage() + " , fromPath: \"" + fromPath + "\", toPath: \"" + toPath + "\"");
            e.printStackTrace();
        }
        return rs;
    }

    @Override
    public boolean move(String fromPath, String toPath, boolean isFile) {
        boolean rs = false;
        File source = new File(fromPath);
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
            rs = false;
            logger.warn("FileMove found exception " + e.getMessage() + " , fromPath: \"" + fromPath + "\", toPath: \"" + toPath + "\"");
            e.printStackTrace();
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

    @Override
    public boolean existsFile(String filePath) {
        return new File(filePath).exists();
    }

    @Override
    public boolean existsDir(String dirPath) {
        return new File(dirPath).exists();
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
            // 统一编码
            FileUtils.write(new File(filePath), text, "UTF-8");
            logger.info("save text to: " + filePath + " successfully");
            rs = true;
        } catch (IOException e) {
            logger.error("save text to \"" + filePath + "\" error: " + e.toString());
            rs = false;
        }
        return rs;
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
        byte[] buff = new byte[16384];
        int len = 0;
        FileOutputStream outputStream = null;
        try {
            File saveDir = new File(new File(filePath).getParent());
            if (!saveDir.exists()) {
                saveDir.mkdirs();
            }
            outputStream = new FileOutputStream(filePath);
            while ((len = inputStream.read(buff)) != -1) {
                outputStream.write(buff, 0, len);
            }
            logger.info("save file to: " + filePath + "successfully");
            return true;
        } catch (IOException e) {
            logger.error("save file to \"" + filePath + "\" error: " + e.toString());
        } finally {
            try {
                if (inputStream != null) {
                    inputStream.close();
                }
                if (outputStream != null) {
                    outputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return false;
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
    public boolean downloadInternetImage(String url, String relativePath, String fileName, Map<String, Object> map) {
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
            logger.warn("localImage fail: " + url + " 此网站文件格式不支持，或该网站禁止下载，exception: " + e.toString());
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
    private void getCurrentFileDateDir(String relativePath, boolean isImage, Map<String, Object> map) {
        //文件所属日期目录
        String datePath = Utils.formatDate(new Date(), "yyyy/MM/");
        map.put("datePath", datePath);

        //服务器文件真实路径
        //String realPath = request.getSession().getServletContext().getRealPath(basePath) + datePath;
        String realPath = null;
        if (isImage) {
            realPath = baseArticleUploadDir(relativePath + datePath);
        } else {
            realPath = baseCloudDir(relativePath + datePath);
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
    private void calculateWH(File targetFile, Map<String, Object> map) {
        int[] wh = null;
        try {
            wh = ImageUtil.getWH(targetFile);
        } catch (IOException e) {
            wh = new int[]{100, 100};
            logger.warn("ImageUpload error : " + targetFile.getPath() + " 此图片获取长宽失败，exception: " + e.toString());
            e.printStackTrace();
        }

        //设置后台计算js不能计算的图片实际尺寸
        map.put("width", wh[0]);
        map.put("height", wh[1]);
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
        boolean isSave = false;
        String realPath = baseArticleUploadDir(relativePath);
        createDirs(realPath);
        File head_photo = new File(realPath, fileName);
        try {
            FileUtil.copy(inputStream, head_photo);
            isSave = true;
        } catch (IOException e) {
            logger.error("FileUpload error path: " + realPath + " 头像上传失败，exception: " + e.toString());
            e.printStackTrace();
        }
        return isSave;
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
    public boolean savePhotoFile(InputStream inputStream, Photo photo, String relativePath, String fileName) {
        boolean isSave = false;
        String realPath = baseCloudDir(relativePath);
        createDirs(realPath);
        File photoFile = new File(realPath, fileName);
        try {
            FileUtil.copy(inputStream, photoFile);

            // todo "save file md5"
            // String md5Value = FileUtil.getMD5Value(photoFile);

            ImageUtil.SimpleImageInfo imageInfo = ImageUtil.getImageInfo(photoFile);
            photo.setWidth(imageInfo.getWidth());
            photo.setHeight(imageInfo.getHeight());
            photo.setSize((int) Math.round(photoFile.length() / 1024.0f));
            photo.setImage_type(imageInfo.getMimeType());

            isSave = true;
        } catch (IOException e) {
            logger.error("FileUpload error path: " + realPath + " 相册上传失败，exception: " + e.toString());
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
        String realPath = baseCloudDir(relativePath);
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
            String trashFullPath = trashPath;
            if (!Utils.isAbsolutePath(trashPath)) {
                trashFullPath = baseTrashRecycleDir(trashPath);
            }
            rs = move(file.getAbsolutePath(), trashFullPath, isFile);
            if (rs) {
                logger.info("FileRecycle from \"" + sourceFullPath + "\" to \"" + trashFullPath + "\"");
            }
        } else {
            logger.warn("FileRecycle error: path doesn't exist! the path: " + sourceFullPath);
        }
        return rs;
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
        boolean isSave = false;
        String realPath = baseCloudDir(relativePath);
        createDirs(realPath);
        File videoFile = new File(realPath, fileName);
        try {
            FileUtil.copy(inputStream, videoFile);
            Photo cover = video.getCover();
            video.setWidth(cover.getWidth());
            video.setHeight(cover.getHeight());
            video.setVideo_type("video/mp4");
            BigDecimal big = new BigDecimal(videoFile.length() / 1048576.00f); // MiB
            float size = big.setScale(2, BigDecimal.ROUND_HALF_UP).floatValue();
            video.setSize(size);
            isSave = true;
        } catch (IOException e) {
            logger.error("FileUpload error path: " + realPath + " 视频上传失败，exception: " + e.toString());
            e.printStackTrace();
        } finally {
            return isSave;
        }
    }

    /**
     * 生成相册相对路径
     *
     * @param album
     * @return
     */
    @Override
    public String generateAlbumPath(Album album) {
        return Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + album.getUser().getUid() + "/album/" + String.format("%05d", album.getAlbum_id()) + "/";
    }

    /**
     * 得到照片保存的文件夹
     *
     * @return
     */
    @Override
    public String generatePhotoFolderPath(Album album) {
        int folderIndex = 1;
        String albumPath = generateAlbumPath(album);
        if (album.getPhotos() != null) { // 从数据库中计算
            List<Photo> photos = album.getPhotos();
            if (photos.size() == 0) {
                folderIndex = 1;
            } else {
                List<Integer> pathList = new ArrayList<>(photos.size());
                Pattern subPattern = Pattern.compile("^.*/(\\d+)/[^/]+$");
                for (Photo photo : photos) {
                    if (photo.getAlbum_id() == album.getAlbum_id()) {
                        Matcher matcher = subPattern.matcher(photo.getPath());
                        matcher.find();
                        pathList.add(Integer.valueOf(matcher.group(1)));
                    }
                }
                Collections.sort(pathList, new Comparator<Integer>() {
                    @Override
                    public int compare(Integer o1, Integer o2) {
                        return o2 - o1;
                    }
                });
                int max = pathList.get(0);
                int count = 0;
                for (Integer block : pathList) {
                    if (max == block) {
                        count++;
                    } else {
                        break;
                    }
                }
                if (count >= 499) {
                    folderIndex = max + 1;
                } else {
                    folderIndex = max;
                }
            }
        } else {    // 从文件系统计算
            File dir = new File(baseCloudDir(albumPath));
            createDirs(dir.getAbsolutePath());
            File[] files = dir.listFiles(new FileFilter() {
                @Override
                public boolean accept(File file) {
                    return file.isDirectory();
                }
            });
            if (files == null || files.length == 0) {
                folderIndex = 1;
            } else {
                Arrays.sort(files, ALBUM_DISK_PART_COMPARATOR);
                int index = Integer.valueOf(files[0].getName());
                File[] photoFiles = files[0].listFiles();
                if (photoFiles != null && photoFiles.length >= 499) {
                    index++;
                }
                folderIndex = index;
            }
        }
        return albumPath + String.format("%03d", folderIndex) + "/";
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
        String filename = "";
        File dir = new File(baseCloudDir(savePath));
        createDirs(dir.getPath());

        //列出该目录下所有文件和文件夹
        File[] files = dir.listFiles();

        int num = 1;
        if (files != null && files.length > 0) {
            //按照文件文件名倒序排序
            Arrays.sort(files, ALBUM_DISK_PHOTO_COMPARATOR);
            num = Integer.valueOf(files[0].getName().substring(files[0].getName().indexOf('_') + 1, files[0].getName().lastIndexOf('_'))) + 1;
        }

        filename = generatePhotoFilename(photo, num);
        return filename;
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
        String path = (photo.getOriginName() == null || photo.getOriginName().equals("")) ? photo.getPath() : photo.getOriginName();
        int i = path.lastIndexOf('.');
        String suffix = (i == -1 ? ".jpg" : path.substring(i));
        return String.format("%05d", photo.getAlbum_id()) + "_" + String.format("%04d", index) + "_" + photo.getUpload_time().getTime() + suffix;
    }

    /**
     * 生成视频保存文件夹相对路径
     *
     * @param video
     * @return
     */
    @Override
    public String generateVideoFolderPath(Video video) {
        return Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + video.getUser().getUid() + "/video/" + String.format("%05d", video.getCover().getAlbum_id()) + "/";
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
        File dir = new File(baseCloudDir(savePath));
        createDirs(dir.getPath());
        File[] files = dir.listFiles(new FileFilter() {
            @Override
            public boolean accept(File file) {
                return file.isFile();
            }
        });
        if (files == null || files.length == 0) {
            return generateVideoFilename(video, 1);
        } else {
            //按照文件文件名倒序排序
            Arrays.sort(files, VIDEO_DISK_COMPARATOR);
            int num = Integer.valueOf(files[0].getName().substring(files[0].getName().indexOf('_') + 1, files[0].getName().lastIndexOf('_'))) + 1;
            return generateVideoFilename(video, num);
        }
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
        String path = (video.getOriginName() == null || video.getOriginName().equals("")) ? video.getPath() : video.getOriginName();
        int i = path.lastIndexOf('.');
        String suffix = (i == -1 ? ".mp4" : path.substring(i));
        return String.format("%05d", video.getCover().getAlbum_id()) + "_" + String.format("%04d", index) + "_" + video.getUpload_time().getTime() + suffix;
    }

}
