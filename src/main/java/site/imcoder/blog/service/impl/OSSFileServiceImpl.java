package site.imcoder.blog.service.impl;

import com.aliyun.oss.*;
import com.aliyun.oss.common.auth.Credentials;
import com.aliyun.oss.common.auth.CredentialsProviderFactory;
import com.aliyun.oss.common.auth.DefaultCredentialProvider;
import com.aliyun.oss.common.auth.STSAssumeRoleSessionCredentialsProvider;
import com.aliyun.oss.common.comm.Protocol;
import com.aliyun.oss.model.*;
import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.disk.DiskFileItem;
import org.apache.log4j.Logger;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.commons.CommonsMultipartFile;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.entity.Album;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.Video;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;
import site.imcoder.blog.setting.ConfigManager;
import site.imcoder.blog.setting.OSSConfigConstants;
import sun.misc.BASE64Encoder;

import javax.servlet.http.HttpServletRequest;
import java.io.*;
import java.net.URLDecoder;
import java.util.*;

/**
 * oss远程文件系统
 *
 * @author Jeffrey.Deng
 * @date 2018-12-25
 */
@Service("ossFileService")
@DependsOn({"configManager"})
public class OSSFileServiceImpl extends RemoteFileServiceWrapper {

    private static Logger logger = Logger.getLogger(OSSFileServiceImpl.class);

    private final static String LIST_ENCODEING = "UTF-8";
    private final static int BATCH_SIZE = 499;

    private static String endpoint;     // region endpoint
    private static String accessKeyId;  // accessKeyId
    private static String accessKeySecret;  // accessKeySecret
    private static String securityToken;    // sts
    private static String bucketName;   // bucketName
    private static String regionId;     // 地域id
    private static String sts_role;     // 提供授权的角色 acs:ram::$accountID:role/$roleName

    private static String meta_image_max_age = "2678400";   // 图片http保存时间
    private static String meta_video_max_age = "16070400";   // 视频http保存时间

    private OSSClientBuilder ossClientBuilder = null;

    // 主凭证提供器
    private static DefaultCredentialProvider mainCredentialProvider = null;

    // 授权用户临时凭证提供器
    private static STSAssumeRoleSessionCredentialsProvider stsAssumeRoleSessionCredentialsProvider = null;

    private BASE64Encoder encoder;

    public static boolean loadProperties() {
        Properties props = ConfigManager.loadProperties(Config.get(ConfigConstants.REMOTE_OSS_CONFIG_LOCATION));
        if (props != null) {
            endpoint = props.getProperty(OSSConfigConstants.ENDPOINT);
            accessKeyId = props.getProperty(OSSConfigConstants.ACCESS_KEY_ID);
            accessKeySecret = props.getProperty(OSSConfigConstants.ACCESS_KEY_SECRET);
            securityToken = props.getProperty(OSSConfigConstants.SECURITY_TOKEN);
            bucketName = props.getProperty(OSSConfigConstants.BUCKET_NAME);
            regionId = props.getProperty(OSSConfigConstants.REGION_ID);
            sts_role = props.getProperty(OSSConfigConstants.STS_ROLE);
            trash_recycle_basepath = props.getProperty(OSSConfigConstants.TRASH_RECYCLE_BASEPATH);
            if (trash_recycle_basepath == null || trash_recycle_basepath.length() == 0) {
                trash_recycle_basepath = ".trash/";
            }
            meta_image_max_age = "2678400";
            meta_video_max_age = "16070400";
            return true;
        } else {
            return false;
        }
    }

    public OSSFileServiceImpl() {
        // 仅远程与同步模式开启
        if (!Mode.LOCAL.value.equals(Config.get(ConfigConstants.CLOUD_FILE_SYSTEM_MODE)) && loadProperties()) {
            ossClientBuilder = new OSSClientBuilder();
            mainCredentialProvider = CredentialsProviderFactory.newDefaultCredentialProvider(accessKeyId, accessKeySecret);
            try {
                stsAssumeRoleSessionCredentialsProvider = CredentialsProviderFactory.newSTSAssumeRoleSessionCredentialsProvider(regionId, accessKeyId, accessKeySecret, sts_role);
            } catch (com.aliyuncs.exceptions.ClientException e) {
                e.printStackTrace();
            }
            encoder = new BASE64Encoder();
        }
    }

    private ClientConfiguration getClientConfiguration() {
        ClientConfiguration conf = new ClientConfiguration();
        // 设置OSSClient允许打开的最大HTTP连接数，默认为1024个。
        conf.setMaxConnections(200);
        // 设置Socket层传输数据的超时时间，默认为50000毫秒。
        conf.setSocketTimeout(10000);
        // 设置建立连接的超时时间，默认为50000毫秒。
        conf.setConnectionTimeout(10000);
        // 设置从连接池中获取连接的超时时间（单位：毫秒），默认不超时。
        conf.setConnectionRequestTimeout(1000);
        // 设置连接空闲超时时间。超时则关闭连接，默认为60000毫秒。
        conf.setIdleConnectionTime(10000);
        // 设置失败请求重试次数，默认为3次。
        conf.setMaxErrorRetry(3);
        // 设置是否支持将自定义域名作为Endpoint，默认支持。
        conf.setSupportCname(false);
        // 设置是否开启二级域名的访问方式，默认不开启。
        conf.setSLDEnabled(false);
        // 设置连接OSS所使用的协议（HTTP/HTTPS），默认为HTTP。
        conf.setProtocol(Protocol.HTTP);
        // 设置用户代理，指HTTP的User-Agent头，默认为aliyun-sdk-java。
        //conf.setUserAgent("aliyun-sdk-java");
        // 设置代理服务器端口。
        //conf.setProxyHost("<yourProxyHost>");
        // 设置代理服务器验证的用户名。
        //conf.setProxyUsername("<yourProxyUserName>");
        // 设置代理服务器验证的密码。
        //conf.setProxyPassword("<yourProxyPassword>");
        return conf;
    }

    // 获取客户端
    protected OSSClient getClient() {
        // ossClientBuilder.build(endpoint, mainCredentialProvider); getClientConfiguration()
        return new OSSClient(endpoint, mainCredentialProvider, null);
    }

    // 关闭连接
    protected void closeClient(OSSClient client) {
        if (client != null) {
            client.shutdown();
        }
    }

    // 获得一张临时凭证
    protected Credentials getSTSToken() {
        if (stsAssumeRoleSessionCredentialsProvider != null) {
            return stsAssumeRoleSessionCredentialsProvider.getCredentials();
        } else {
            return null;
        }
    }

    // 返回一个文件夹下的所有文件
    protected List<OSSObjectSummary> listPath(OSSClient client, String path) throws OSSException, ClientException {
        List<OSSObjectSummary> objectSummaries = new ArrayList<>();
        listPath(client, path, new Utils.Callback<OSSObjectSummary, Boolean>() {
            @Override
            public Boolean call(OSSObjectSummary objectSummary) throws Exception {
                objectSummaries.add(objectSummary);
                return true;
            }
        });
        return objectSummaries;
    }

    // 回调一个文件夹下的所有文件（递归）
    protected void listPath(OSSClient client, String path, Utils.Callback<OSSObjectSummary, Boolean> callback) throws OSSException, ClientException {
        ListObjectsRequest listObjectsRequest = new ListObjectsRequest(bucketName);
        // 每次读取最大长度，需小于1000，默认100
        listObjectsRequest.setMaxKeys(BATCH_SIZE);
        // 前缀
        listObjectsRequest.setPrefix(path);
        // 文件名，标记从那个文件开始读取
        listObjectsRequest.setMarker(null);
        // 指定对返回的文件名称进行编码，目前仅支持url
        listObjectsRequest.setEncodingType("url");
        ObjectListing objectListing = null;
        do {
            objectListing = client.listObjects(listObjectsRequest);
            List<OSSObjectSummary> objectSummaries = objectListing.getObjectSummaries();
            try {
                if (objectSummaries != null && objectSummaries.size() > 0) {
                    for (OSSObjectSummary objectSummary : objectSummaries) {
                        objectSummary.setKey(URLDecoder.decode(objectSummary.getKey(), LIST_ENCODEING));
                        if (objectSummary.getKey().equals(path)) {
                            continue;
                        }
                        if (!callback.call(objectSummary)) {
                            break;
                        }
                    }
                }
                if (objectListing.getNextMarker() != null) {
                    listObjectsRequest.setMarker(URLDecoder.decode(objectListing.getNextMarker(), LIST_ENCODEING));
                }
            } catch (UnsupportedEncodingException e) {
                e.printStackTrace();
            } catch (OSSException e) {
                throw e;
            } catch (ClientException e) {
                throw e;
            } catch (Exception e) {
                e.printStackTrace();
            }
        } while (objectListing.isTruncated());
    }

    // 回调一个文件夹下的所有子文件夹
    protected void listPathSubDirs(OSSClient client, String path, Utils.Callback<String, Boolean> callback) throws OSSException, ClientException {
        ListObjectsRequest listObjectsRequest = new ListObjectsRequest(bucketName);
        // 每次读取最大长度，需小于1000，默认100
        listObjectsRequest.setMaxKeys(BATCH_SIZE);
        // 前缀
        listObjectsRequest.setPrefix(path);
        // 分组符
        listObjectsRequest.setDelimiter("/");
        // 文件名，标记从那个文件开始读取
        listObjectsRequest.setMarker(null);
        // 指定对返回的文件名称进行编码，目前仅支持url
        listObjectsRequest.setEncodingType("url");
        ObjectListing objectListing = null;
        Set<String> dirs = new TreeSet<>(new Comparator<String>() {
            @Override
            public int compare(String left, String right) {
                return left.compareTo(right);
            }
        });
        try {
            do {
                objectListing = client.listObjects(listObjectsRequest);
                List<OSSObjectSummary> objectSummaries = objectListing.getObjectSummaries();

                List<String> commonPrefixes = objectListing.getCommonPrefixes();
                if (commonPrefixes != null && commonPrefixes.size() > 0) {
                    for (String dir : commonPrefixes) {
                        dir = URLDecoder.decode(dir, LIST_ENCODEING);
                        if (dir.equals(path)) {
                            continue;
                        }
                        dirs.add(dir);
                    }
                }
                if (objectListing.getNextMarker() != null) {
                    listObjectsRequest.setMarker(URLDecoder.decode(objectListing.getNextMarker(), LIST_ENCODEING));
                }

            } while (objectListing.isTruncated());
            if (dirs.size() > 0) {
                for (String dir : dirs) {
                    if (!callback.call(dir)) {
                        break;
                    }
                }
            }
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        } catch (OSSException e) {
            throw e;
        } catch (ClientException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public boolean copy(String fromPath, String toPath, boolean isFile) {
        OSSClient client = getClient();
        try {
            copy(client, fromPath, toPath, isFile);
            return true;
        } catch (OSSException e) {
            logger.error("File Remote copy found exception, fromPath: \"" + fromPath + "\", toPath: \"" + toPath + "\"\r\n" + e.getMessage());
        } catch (ClientException e) {
            logger.error("File Remote copy found exception, fromPath: \"" + fromPath + "\", toPath: \"" + toPath + "\"\r\n" + e.getMessage());
        } finally {
            closeClient(client);
        }
        return false;
    }

    protected void copy(OSSClient client, String fromPath, String toPath, boolean isFile) throws OSSException, ClientException {
        if (isFile) {
            CopyObjectRequest copyObjectRequest = new CopyObjectRequest(bucketName, fromPath, bucketName, toPath);
            copyObjectRequest.setLogEnabled(false);
            client.copyObject(copyObjectRequest);
        } else {
            if (!fromPath.endsWith("/")) {
                fromPath += "/";
            }
            if (!toPath.endsWith("/")) {
                toPath += "/";
            }
            if (toPath.startsWith(fromPath)) {
                throw new ClientException("Cannot move directory to a subdirectory of itself");
            }
            final String finalFromPath = fromPath;
            final String finalToPath = toPath;
            listPath(client, fromPath, new Utils.Callback<OSSObjectSummary, Boolean>() {
                @Override
                public Boolean call(OSSObjectSummary objectSummary) throws Exception {
                    copy(client, objectSummary.getKey(), finalToPath + objectSummary.getKey().replace(finalFromPath, ""), true);
                    return true;
                }
            });
        }
    }

    @Override
    public boolean move(String fromPath, String toPath, boolean isFile) {
        OSSClient client = getClient();
        try {
            move(client, fromPath, toPath, isFile);
            return true;
        } catch (OSSException e) {
            logger.error("File Remote move found exception, fromPath: \"" + fromPath + "\", toPath: \"" + toPath + "\"\r\n" + e.getMessage());
        } catch (ClientException e) {
            logger.error("File Remote move found exception, fromPath: \"" + fromPath + "\", toPath: \"" + toPath + "\"\r\n" + e.getMessage());
        } finally {
            closeClient(client);
        }
        return false;
    }

    protected void move(OSSClient client, String fromPath, String toPath, boolean isFile) throws OSSException, ClientException {
        if (isFile) {
            copy(client, fromPath, toPath, isFile);
            delete(client, fromPath);
        } else {
            if (!fromPath.endsWith("/")) {
                fromPath += "/";
            }
            if (!toPath.endsWith("/")) {
                toPath += "/";
            }
            if (toPath.startsWith(fromPath)) {
                throw new ClientException("Cannot move directory to a subdirectory of itself");
            }
            final String finalFromPath = fromPath;
            final String finalToPath = toPath;
            List<String> fileKeys = new ArrayList<>();
            listPath(client, fromPath, new Utils.Callback<OSSObjectSummary, Boolean>() {
                @Override
                public Boolean call(OSSObjectSummary objectSummary) throws Exception {
                    fileKeys.add(objectSummary.getKey());
                    copy(client, objectSummary.getKey(), finalToPath + objectSummary.getKey().replace(finalFromPath, ""), true);
                    if (fileKeys.size() >= BATCH_SIZE) {
                        delete(client, fileKeys);
                        fileKeys.clear();
                    }
                    return true;
                }
            });
            if (fileKeys.size() > 0) {
                delete(client, fileKeys);
            }
        }
    }

    @Override
    public boolean delete(String filePath) {
        OSSClient client = getClient();
        try {
            delete(client, filePath);
            logger.info("delete remote file \"" + filePath + "\" successfully");
            return true;
        } catch (OSSException e) {
            logger.error("delete remote file error: " + e.getMessage());
        } catch (com.aliyun.oss.ClientException e) {
            logger.error("delete remote file error: " + e.getMessage());
        } finally {
            closeClient(client);
        }
        return false;
    }

    protected void delete(OSSClient client, String fileKey) throws OSSException, ClientException {
        GenericRequest genericRequest = new GenericRequest(bucketName, fileKey);
        client.deleteObject(genericRequest);
    }

    // 返回删除失败的文件列表
    protected List<String> delete(OSSClient client, List<String> fileKeys) throws OSSException, ClientException {
        DeleteObjectsRequest deleteObjectsRequest = new DeleteObjectsRequest(bucketName);
        deleteObjectsRequest.setKeys(fileKeys);
        // 返回模式。true表示简单模式，false表示详细模式。默认为详细模式。
        // 简单模式下为删除失败的文件列表，详细模式下为删除成功的文件列表，
        deleteObjectsRequest.setQuiet(true);
        // 指定对返回的文件名称进行编码，目前仅支持url
        deleteObjectsRequest.setEncodingType("url");
        return client.deleteObjects(deleteObjectsRequest).getDeletedObjects();
    }

    @Override
    public boolean deleteDirectory(String dirPath) {
        OSSClient client = getClient();
        try {
            deleteDirectory(client, dirPath);
            logger.info("delete remote path \"" + dirPath + "\" successfully");
            return true;
        } catch (OSSException e) {
            logger.error("delete remote directory error: " + e.getMessage());
        } catch (com.aliyun.oss.ClientException e) {
            logger.error("delete remote directory error" + e.getMessage());
        } finally {
            closeClient(client);
        }
        return false;
    }

    protected void deleteDirectory(OSSClient client, String path) throws OSSException, ClientException {
        List<String> fileKeys = new ArrayList<>();
        listPath(client, path, new Utils.Callback<OSSObjectSummary, Boolean>() {
            @Override
            public Boolean call(OSSObjectSummary objectSummary) throws Exception {
                fileKeys.add(objectSummary.getKey());
                if (fileKeys.size() >= BATCH_SIZE) {
                    delete(client, fileKeys);
                    fileKeys.clear();
                }
                return true;
            }
        });
        if (fileKeys.size() > 0) {
            delete(client, fileKeys);
        }
    }

    @Override
    public void createDirs(String path) {
        return;
    }

    @Override
    public boolean existsFile(String filePath) {
        OSSClient client = getClient();
        boolean b = false;
        try {
            b = client.doesObjectExist(bucketName, filePath, true);
        } catch (Exception e) {
            logger.error("existsFile error: " + e.getMessage());
        } finally {
            closeClient(client);
        }
        return b;
    }

    @Override
    public boolean existsDir(String dirPath) {
        OSSClient client = getClient();
        final String[] keys = new String[1];
        try {
            listPath(client, dirPath, new Utils.Callback<OSSObjectSummary, Boolean>() {
                @Override
                public Boolean call(OSSObjectSummary objectSummary) throws Exception {
                    keys[0] = objectSummary.getKey();
                    return false;
                }
            });
        } catch (OSSException e) {
            logger.error("existsDir error: " + e.getMessage());
        } catch (ClientException e) {
            logger.error("existsDir error: " + e.getMessage());
        } finally {
            closeClient(client);
        }
        return keys[0] == null ? false : true;
    }

    /**
     * 保存文本
     *
     * @param text
     * @param fileKey
     */
    @Override
    public boolean saveText(String text, String fileKey) {
        OSSClient client = getClient();
        try {
            ObjectMetadata meta = new ObjectMetadata(); // meta
            meta.setContentType("text/plain");
            Map<String, String> userMetadata = new HashMap<>(); // user-meta
            userMetadata.put("handle-sdk", "java-server");
            meta.setUserMetadata(userMetadata);
            ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(text.getBytes());
            save(client, byteArrayInputStream, fileKey, meta);
            logger.info("save text to remote system: " + fileKey);
            return true;
        } catch (OSSException e) {
            logger.error("save text to remote system error: " + e.getMessage());
        } catch (ClientException e) {
            logger.error("save text to remote system error: " + e.getMessage());
        } finally {
            closeClient(client);
        }
        return false;
    }

    /**
     * 文件保存
     *
     * @param inputStream 输入流
     * @param fileKey     文件保存路径
     * @return
     */
    @Override
    public boolean save(InputStream inputStream, String fileKey) {
        OSSClient client = getClient();
        try {
            ObjectMetadata meta = new ObjectMetadata(); // meta
            Map<String, String> userMetadata = new HashMap<>(); // user-meta
            userMetadata.put("handle-sdk", "java-server");
            meta.setUserMetadata(userMetadata);
            save(client, inputStream, fileKey, meta);
            logger.info("save file to remote system: " + fileKey);
            return true;
        } catch (OSSException e) {
            logger.error("save file to remote system error: " + e.getMessage());
        } catch (ClientException e) {
            logger.error("save file to remote system error: " + e.getMessage());
        } finally {
            closeClient(client);
        }
        return false;
    }

    protected void save(OSSClient client, InputStream inputStream, String fileKey, ObjectMetadata objectMetadata) throws OSSException, ClientException {
        PutObjectRequest putObjectRequest = new PutObjectRequest(null, null, (File) null); // request
        putObjectRequest.setBucketName(bucketName);
        putObjectRequest.setKey(fileKey);
        putObjectRequest.setInputStream(inputStream);
        putObjectRequest.setMetadata(objectMetadata);
        client.putObject(putObjectRequest);
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
        return false;
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
        return false;
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
        return 0;
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
        return false;
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
    @Override
    public boolean savePhotoFile(MultipartFile file, Photo photo, String relativePath, String fileName) {
        OSSClient client = getClient();
        try {
            InputStream fileInputSteam = getUploadFileInputSteam(file, relativePath + fileName);
            ObjectMetadata meta = new ObjectMetadata(); // meta
            meta.setContentType(photo.getImage_type());
            meta.setCacheControl("max-age=" + meta_image_max_age);
            Map<String, String> userMetadata = new HashMap<>(); // user-meta
            userMetadata.put("handle-sdk", "java-server");
            meta.setUserMetadata(userMetadata);
            //BinaryUtil.toBase64String("".getBytes());
            // meta.setContentMD5(encoder.encode(FileUtil.getMD5Value(getUploadFileInputSteam(file, relativePath + fileName)).getBytes()));
            save(client, fileInputSteam, relativePath + fileName, meta);
            logger.info("savePhotoFile: upload file \"" + (relativePath + fileName) + "\" to remote file system successfully");
        } catch (OSSException e) {
            logger.error("savePhotoFile: " + e.getMessage());
            return false;
        } catch (ClientException e) {
            logger.error("savePhotoFile: " + e.getMessage());
            return false;
        } finally {
            closeClient(client);
        }
        return true;
    }

    /**
     * 创建相册文件夹
     *
     * @param relativePath
     * @return
     */
    @Override
    public void createAlbumFolder(String relativePath) {
        return;
    }

    /**
     * 回收<b>文件</b>到trashPathDir目录
     *
     * @param sourceFilePath 源文件远程路径
     * @param trashPathDir   <b>回收站的目录</b>(<b>不可为文件</b>)，相对回收站的路径
     * @return
     */
    @Override
    public boolean recycleTrashFile(String sourceFilePath, String trashPathDir) {
        String filename = sourceFilePath.substring(sourceFilePath.lastIndexOf('/') + 1);
        if (!trashPathDir.endsWith("/")) {
            trashPathDir += "/";
        }
        return recycleTrash(sourceFilePath, true, trash_recycle_basepath + trashPathDir + filename);
    }

    /**
     * 回收<b>文件与目录</b>，且在回收站中建立与sourceRelativePath相同的目录结构
     *
     * @param sourcePathPrefix   需要忽略的路径前缀, 可为null
     * @param sourceRelativePath 源文件相对于前缀的路径，回收站中的目录结构也将使用此结构
     * @param isFile             回收的是不是文件
     */
    @Override
    public boolean recycleTrash(String sourcePathPrefix, String sourceRelativePath, boolean isFile) {
        if (sourcePathPrefix != null && sourcePathPrefix.length() > 0) {
            sourceRelativePath = sourcePathPrefix + sourceRelativePath;
        }
        return recycleTrash(sourceRelativePath, isFile, sourceRelativePath);
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
     * @param sourcePath 源文件远程文件路径
     * @param isFile     回收的是不是文件
     * @param trashPath  回收路径，相对回收站的路径
     */
    @Override
    public boolean recycleTrash(String sourcePath, boolean isFile, String trashPath) {
        if (sourcePath == null || trashPath == null) {
            return false;
        }
        OSSClient client = getClient();
        try {
            move(client, sourcePath, trash_recycle_basepath + trashPath, isFile);
            logger.info("FileRecycle from \"" + sourcePath + "\" to \"" + (trash_recycle_basepath + trashPath) + "\" in remote file system successfully");
            return true;
        } catch (OSSException e) {
            //logger.error("recycleTrash: " + e.getErrorCode() + ", " + e.getMessage() + ", requestId is " + e.getRequestId());
            logger.error("FileRecycle from \"" + sourcePath + "\" error: " + e.getMessage());
        } catch (ClientException e) {
            logger.error("FileRecycle from \"" + sourcePath + "\" error: " + e.getMessage());
        } finally {
            closeClient(client);
        }
        return false;
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
        OSSClient client = getClient();
        try {
            InputStream fileInputSteam = getUploadFileInputSteam(file, relativePath + fileName);
            ObjectMetadata meta = new ObjectMetadata(); // meta
            meta.setContentType(video.getVideo_type());
            meta.setCacheControl("max-age=" + meta_video_max_age);
            Map<String, String> userMetadata = new HashMap<>(); // user-meta
            userMetadata.put("handle-sdk", "java-server");
            meta.setUserMetadata(userMetadata);
            save(client, fileInputSteam, relativePath + fileName, meta);
            logger.info("saveVideoFile: upload file \"" + (relativePath + fileName) + "\" to remote file system successfully");
        } catch (OSSException e) {
            logger.error("saveVideoFile: " + e.getMessage());
            return false;
        } catch (ClientException e) {
            logger.error("saveVideoFile: " + e.getMessage());
            return false;
        } finally {
            closeClient(client);
        }
        return true;
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
     * @param album
     * @return
     */
    @Override
    public String generatePhotoFolderPath(Album album) {
        OSSClient client = getClient();
        try {
            String albumPath = generateAlbumPath(album);
            String[] maxSubDir = new String[1];
            listPathSubDirs(client, albumPath, new Utils.Callback<String, Boolean>() {
                @Override
                public Boolean call(String subDir) throws Exception {
                    maxSubDir[0] = subDir;
                    return true;
                }
            });
            String currentSubPath = null;
            if (maxSubDir[0] == null) {
                currentSubPath = albumPath + String.format("%03d", 1) + "/";
            } else {
                int index = Integer.parseInt(maxSubDir[0].replace("/", ""));
                List<OSSObjectSummary> objectSummaries = listPath(client, albumPath + maxSubDir[0]);
                if (objectSummaries.size() >= 499) {
                    index++;
                }
                objectSummaries.clear();
                currentSubPath = albumPath + String.format("%03d", index) + "/";
            }
            return currentSubPath;
        } catch (OSSException e) {
            logger.error("generatePhotoFolderPath: " + e.getMessage());
        } catch (ClientException e) {
            logger.error("generatePhotoFolderPath: " + e.getMessage());
        } catch (NumberFormatException e) {
            e.printStackTrace();
        } finally {
            closeClient(client);
        }
        return null;
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
        OSSClient client = getClient();
        try {
            String[] maxFileName = new String[1];
            listPath(client, savePath, new Utils.Callback<OSSObjectSummary, Boolean>() {
                @Override
                public Boolean call(OSSObjectSummary objectSummary) throws Exception {
                    maxFileName[0] = objectSummary.getKey();
                    return true;
                }
            });
            int index = 1;
            if (maxFileName[0] != null) {
                String name = maxFileName[0].replaceFirst("^.*/", "");
                index = Integer.valueOf(name.substring(name.indexOf('_') + 1, name.lastIndexOf('_'))) + 1;
            }
            return generatePhotoFilename(photo, index);
        } catch (OSSException e) {
            logger.error("generateNextPhotoFilename: " + e.getMessage());
        } catch (ClientException e) {
            logger.error("generateNextPhotoFilename: " + e.getMessage());
        } catch (NumberFormatException e) {
            e.printStackTrace();
        } finally {
            closeClient(client);
        }
        return null;
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
        OSSClient client = getClient();
        try {
            String[] maxFileName = new String[1];
            listPath(client, savePath, new Utils.Callback<OSSObjectSummary, Boolean>() {
                @Override
                public Boolean call(OSSObjectSummary objectSummary) throws Exception {
                    maxFileName[0] = objectSummary.getKey();
                    return true;
                }
            });
            int index = 1;
            if (maxFileName[0] != null) {
                String name = maxFileName[0].replaceFirst("^.*/", "");
                index = Integer.valueOf(name.substring(name.indexOf('_') + 1, name.lastIndexOf('_'))) + 1;
            }
            return generateVideoFilename(video, index);
        } catch (OSSException e) {
            logger.error("generateNextVideoName: " + e.getMessage());
        } catch (ClientException e) {
            logger.error("generateNextVideoName: " + e.getMessage());
        } catch (NumberFormatException e) {
            e.printStackTrace();
        } finally {
            closeClient(client);
        }
        return null;
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

    // MultipartFile是否可用
    private boolean isMultipartFileAvailable(MultipartFile file) {
        CommonsMultipartFile commonsMultipartFile = (CommonsMultipartFile) file;
        FileItem fileItem = commonsMultipartFile.getFileItem();
        return fileItem.isInMemory() ? true : (fileItem instanceof DiskFileItem ? ((DiskFileItem) fileItem).getStoreLocation().exists() : fileItem.getSize() == commonsMultipartFile.getSize());
    }

    /**
     * CommonsMultipartFile 只能使用一次，之后就会删除，
     * 防止出现错误在同步模式
     */
    private InputStream getUploadFileInputSteam(MultipartFile file, String fileRelativePath) {
        try {
            if (isSyncMode()) {
                return new FileInputStream(Config.get(ConfigConstants.CLOUD_FILE_BASEPATH) + fileRelativePath);
            } else {
                return file.getInputStream();
            }
        } catch (IOException e) {
            logger.error("getUploadFileInputSteam: 获取文件流失败，" + e.getMessage());
            return null;
        }
    }
}
