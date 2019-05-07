package site.imcoder.blog.service.impl;

import org.apache.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.UserGroupType;
import site.imcoder.blog.dao.ISiteDao;
import site.imcoder.blog.dao.IUserDao;
import site.imcoder.blog.dao.IVideoDao;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.service.*;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * @author Jeffrey.Deng
 */
@Service("videoService")
public class VideoServiceImpl extends BaseService implements IVideoService {

    @Resource
    private IVideoDao videoDao;

    @Resource
    private IUserDao userDao;

    @Resource
    private ISiteDao siteDao;

    @Resource
    private IAlbumService albumService;

    @Resource(name = "fileService")
    private IFileService fileService;

    @Resource
    private IAuthService authService;

    @Resource
    private Cache cache;

    /**
     * 得到上传配置信息
     *
     * @param iRequest
     * @return IResponse:
     * <pre>
     * allowUploadLowestLevel
     * isAllowUpload
     * uploadArgs
     *   mode
     *   maxPhotoUploadSize
     *   maxVideoUploadSize
     * </pre>
     */
    @Override
    public IResponse getUploadConfigInfo(IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse uploadConfig = new IResponse();
        uploadConfig.putAttr("allowUploadLowestLevel", Config.getInt(ConfigConstants.CLOUD_ALLOW_UPLOAD_LOWEST_LEVEL));
        uploadConfig.putAttr("isAllowUpload", isAllowUpload(loginUser));
        // uploadArgs
        Map<String, Object> uploadArgs = new HashMap<>();
        uploadArgs.put("mode", Config.get(ConfigConstants.CLOUD_FILE_SYSTEM_MODE));
        uploadArgs.put("maxPhotoUploadSize", Integer.parseInt(Config.getChild(ConfigConstants.CLOUD_PHOTO_MAX_UPLOADSIZE, "@user_", loginUser.getUid() + "", ":")));
        uploadArgs.put("maxVideoUploadSize", Integer.parseInt(Config.getChild(ConfigConstants.CLOUD_VIDEO_MAX_UPLOADSIZE, "@user_", loginUser.getUid() + "", ":")));
        uploadConfig.putAttr("uploadArgs", uploadArgs);
        //
        uploadConfig.setStatus(STATUS_SUCCESS);
        return uploadConfig;
    }

    // 当前用户是否允许上传文件
    private boolean isAllowUpload(User loginUser) {
        if (loginUser == null) {
            return false;
        }
        // 云盘允许上传文件的用户组最低等级，值为对应用户组的Gid
        int lowestLevel = Config.getInt(ConfigConstants.CLOUD_ALLOW_UPLOAD_LOWEST_LEVEL);
        switch (UserGroupType.valueOfName(lowestLevel)) {
            case NOVICE_USER:
                return true;
            case SENIOR_USER:
                int gid = loginUser.getUserGroup().getGid();
                return gid == UserGroupType.SENIOR_USER.value || gid == UserGroupType.MANAGER.value;
            case MANAGER:
                return loginUser.getUserGroup().isManager();
            default:
                return false;
        }
    }

    /**
     * 保存上传的视频
     *
     * @param videoFile
     * @param video
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 封面未找到, 500: 服务器错误
     * video - video对象
     */
    @Override
    public IResponse saveVideo(MultipartFile videoFile, Video video, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (!isAllowUpload(loginUser)) {
            response.setStatus(STATUS_FORBIDDEN, "你的用户组不允许上传视频~");
        } else if (video == null || video.getCover() == null || !IdUtil.containValue(video.getCover().getPhoto_id())) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else {
            video.setVideo_id(IdUtil.generatePrimaryKey()); // 主键
            video.setUpload_time(new Date());
            video.setUser(loginUser);
            Photo cover = video.getCover();
            if (video.getRefer() == null) {
                if (cover.getRefer() != null) {
                    video.setRefer(cover.getRefer());
                } else {
                    video.setRefer("");
                }
            }
            fillVideoNotRequiredValueIfNull(video);
            int sourceType = video.getSource_type();
            if (sourceType == 0) {
                if (videoFile == null || videoFile.isEmpty()) {
                    response.setStatus(STATUS_PARAM_ERROR, "未上传视频文件~");
                } else {
                    if (video.getOriginName() == null) {
                        video.setOriginName(videoFile.getOriginalFilename());
                    }
                    if (video.getOriginName() != null && video.getOriginName().indexOf(".") == -1) {
                        if (videoFile.getContentType() == null || videoFile.getContentType().indexOf("audio") == -1) {
                            video.setOriginName(video.getOriginName() + ".mp4");
                        } else {
                            video.setOriginName(video.getOriginName() + ".mp3");
                        }
                    }
                    String relativePath = fileService.generateVideoSaveBlockPath(video);
                    String fileName = fileService.generateVideoFilename(video, relativePath);
                    boolean isSave = false;
                    try {
                        isSave = fileService.saveVideoFile(videoFile.getInputStream(), video, relativePath, fileName);
                    } catch (IOException e) {
                        e.printStackTrace();
                        isSave = false;
                    }
                    if (isSave) {
                        video.setPath(relativePath + fileName);
                        video.setCode("");
                        response.setStatus(STATUS_SUCCESS);
                    } else {
                        response.setStatus(STATUS_SERVER_ERROR, "视频文件保存失败~");
                    }
                }
            } else if (sourceType == 1 || sourceType == 2) {
                if (sourceType == 1 && Utils.isNotEmpty(video.getPath())) {
                    video.setCode("");
                    if (!video.getPath().matches("^https?://.*")) {
                        video.setPath("http://" + video.getPath());
                    }
                    response.setStatus(STATUS_SUCCESS);
                } else if (sourceType == 2 && Utils.isNotEmpty(video.getCode())) {
                    video.setPath("");
                    response.setStatus(STATUS_SUCCESS);
                } else {
                    response.setStatus(STATUS_PARAM_ERROR, "path与code设置错误~");
                }
                if (response.isSuccess()) {
                    video.setWidth(cover.getWidth());
                    video.setHeight(cover.getHeight());
                    if (sourceType == 1) {
                        if (!video.getPath().matches(".*\\.(?i)mp3$")) {
                            video.setVideo_type("video/mp4");
                        } else {
                            video.setVideo_type("video/mp3");
                        }
                    } else {
                        video.setVideo_type("video/mp4");
                    }
                    video.setSize(0.00f);
                    video.setOriginName("");
                }
            } else {
                response.setStatus(STATUS_PARAM_ERROR, "没有此sourceType~");
            }
            if (response.isSuccess()) {
                response.setStatus(convertRowToHttpCode(videoDao.saveVideo(video)));
                if (response.isSuccess()) {
                    cover.setImage_type(cover.getImage_type() == null ? "video/jpeg" : cover.getImage_type().replace("image", "video"));
                    videoDao.updateCoverImageType(cover);
                    response.putAttr("video", video);
                } else if (sourceType == 0) {
                    String diskPath = fileService.baseCloudDir(video.getPath());
                    fileService.delete(diskPath);
                }
            }
        }
        return response;
    }

    /**
     * 返回视频
     *
     * @param video    视频id，或者封面id
     * @param iRequest
     * @return ResponseEntity
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 视频ID未找到
     * video - video
     */
    @Override
    public IResponse findVideo(Video video, IRequest iRequest) {
        boolean loadAccessRecord = iRequest.getAttr("loadAccessRecord", true);
        IResponse response = new IResponse();
        if (video == null || (!IdUtil.containValue(video.getVideo_id()) && (video.getCover() == null || !IdUtil.containValue(video.getCover().getPhoto_id())))) {
            return response.setStatus(STATUS_PARAM_ERROR);
        }
        Video db_video = videoDao.findVideo(video);
        if (db_video == null) {
            return response.setStatus(STATUS_NOT_FOUND, "无此视频");
        }
        IResponse authResp = authService.validateUserPermissionUtil(db_video.getUser(), db_video.getPermission(), iRequest);
        if (authResp.isSuccess()) {
            if (iRequest.isHasNotLoggedIn() || !iRequest.getLoginUser().getUid().equals(db_video.getUser().getUid())) {
                db_video.setOriginName(null);
            }
            if (loadAccessRecord) {
                AccessRecord queryAccessRecord = new AccessRecord();
                queryAccessRecord.setBean(new Video(db_video.getVideo_id()));
                queryAccessRecord.setUser(iRequest.getLoginUser());
                queryAccessRecord.setLast_access_ip(iRequest.getAccessIp());
                AccessRecord<Video> videoAccessRecord = userDao.findVideoAccessRecord(queryAccessRecord);
                if (videoAccessRecord != null) {
                    Video accessVideo = videoAccessRecord.getBean();
                    db_video.setAccessed(accessVideo.getAccessed());
                    db_video.setLiked(accessVideo.getLiked());
                    db_video.setCommented(accessVideo.getCommented());
                } else {
                    db_video.setAccessed(false);
                    db_video.setLiked(false);
                    db_video.setCommented(false);
                }
            }
            response.putAttr("video", db_video).setStatus(STATUS_SUCCESS);
        } else {
            response.setStatus(authResp);
        }
        response.putAttr("cdn_path_prefix", Config.get(ConfigConstants.SITE_CLOUD_ADDR));
        return response;
    }

    /**
     * 查找视频集合
     *
     * @param video
     * @param logic_conn 逻辑连接符 "and" 或 "or"
     * @param start      正数代表正序(video_id从大到小)，从0开始；负数代表逆序(video_id从小到大)，从-1开始；包含起始
     * @param size       返回数量，0代表不限制数量
     * @param iRequest   attr:
     *                   {String} base - 在哪个基础之下查找
     * @return IResponse:
     * status - 200:成功，400：参数错误
     * videos -
     * cloud_photo_preview_args -
     */
    @Override
    public IResponse findVideoList(Video video, String logic_conn, int start, int size, IRequest iRequest) {
        String base = iRequest.getAttr("base", null);
        return findVideoList(base, video, logic_conn, start, size, iRequest);
    }

    /**
     * 查找视频集合
     *
     * @param base       在哪个基础之下查找
     * @param video
     * @param logic_conn 逻辑连接符 "and" 或 "or"
     * @param start      正数代表正序(video_id从大到小)，从0开始；负数代表逆序(video_id从小到大)，从-1开始；包含起始
     * @param size       返回数量，0代表不限制数量
     * @param iRequest
     * @return IResponse:
     * status - 200:成功，400：参数错误，404：没找到相册
     * videos -
     * cloud_photo_preview_args -
     */
    private IResponse findVideoList(String base, Video video, String logic_conn, int start, int size, IRequest iRequest) {
        IResponse response = new IResponse();
        if (base != null) {
            if (base.startsWith("album_detail")) {
                base = "album_detail";
            } else if (base.startsWith("user_likes")) {
                base = "user_likes";
            } else if (base.startsWith("user_history")) {
                base = "user_history";
            }
        }
        List<Video> videos = videoDao.findVideoList(base, video, logic_conn, start, size, iRequest.getLoginUser());
        if (videos == null) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else {
            response.setStatus(STATUS_SUCCESS);
        }
        response.putAttr("videos", videos);
        response.putAttr("cdn_path_prefix", Config.get(ConfigConstants.SITE_CLOUD_ADDR));
        if (response.isSuccess()) {
            String cloud_photo_preview_args = null;
            if (video != null && video.getUser() != null && IdUtil.containValue(video.getUser().getUid())) {
                cloud_photo_preview_args = Config.getChild(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, "@user_", video.getUser().getUid() + "", ":");
            } else {
                cloud_photo_preview_args = Config.getChildDefault(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, "@user_");
            }
            response.putAttr(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, cloud_photo_preview_args);
        }
        return response;
    }

    /**
     * 通过封面列表返回视频列表
     *
     * @param covers
     * @param iRequest
     * @return IResponse:
     * videos
     */
    @Override
    public IResponse findVideoListByCoverArray(List<Long> covers, IRequest iRequest) {
        IResponse response = new IResponse();
        if (covers != null) {
            response.putAttr("videos", videoDao.findVideoListByCoverArray(covers, iRequest.getLoginUser())).setStatus(STATUS_SUCCESS);
            response.putAttr("cdn_path_prefix", Config.get(ConfigConstants.SITE_CLOUD_ADDR));
        } else {
            response.setStatus(STATUS_PARAM_ERROR);
        }
        return response;
    }

    /**
     * 保存上传的视频
     *
     * @param videoFile
     * @param video
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 封面未找到, 500: 服务器错误
     * video - video对象
     */
    @Override
    public IResponse updateVideo(MultipartFile videoFile, Video video, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (!isAllowUpload(loginUser)) {
            response.setStatus(STATUS_FORBIDDEN, "你的用户组不允许上传视频~");
        } else if (video == null || !IdUtil.containValue(video.getVideo_id()) || video.getCover() == null || !IdUtil.containValue(video.getCover().getPhoto_id())) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else {
            IResponse videoResp = findVideo(video, iRequest);
            response.setStatus(videoResp);
            if (response.isSuccess()) {
                Video db_video = videoResp.getAttr("video");
                Photo cover = video.getCover();
                if (db_video.getUser().getUid().equals(loginUser.getUid())) {
                    fillVideoNotRequiredValueIfNull(video, db_video);
                    int sourceType = video.getSource_type();
                    if (sourceType == 0) {
                        if (videoFile != null && !videoFile.isEmpty()) {
                            if (video.getOriginName() == null) {
                                video.setOriginName(videoFile.getOriginalFilename() == null ? "" : videoFile.getOriginalFilename());
                            }
                            if (video.getOriginName() != null && video.getOriginName().indexOf(".") == -1) {
                                if (videoFile.getContentType() == null || videoFile.getContentType().indexOf("audio") == -1) {
                                    video.setOriginName(video.getOriginName() + ".mp4");
                                } else {
                                    video.setOriginName(video.getOriginName() + ".mp3");
                                }
                            }
                            String newPathDir = null;
                            String newPathFileName = null;
                            if (db_video.getSource_type() == 0) {
                                Matcher matcher = Pattern.compile("^(.*/[^/]+/)[^/]+$").matcher(db_video.getPath());
                                matcher.find();
                                newPathDir = matcher.group(1); //文件夹
                                newPathFileName = fileService.generateVideoFilename(video, newPathDir); // 新文件名
                            } else {
                                newPathDir = fileService.generateVideoSaveBlockPath(video);
                                newPathFileName = fileService.generateVideoFilename(video, newPathDir);
                            }
                            video.setPath(null);
                            try {
                                if (fileService.saveVideoFile(videoFile.getInputStream(), video, newPathDir, newPathFileName)) {
                                    video.setPath(newPathDir + newPathFileName);
                                    video.setCode("");
                                    response.setStatus(STATUS_SUCCESS);
                                } else {
                                    response.setStatus(STATUS_SERVER_ERROR, "视频文件保存失败~");
                                }
                            } catch (IOException e) {
                                e.printStackTrace();
                                response.setStatus(STATUS_SERVER_ERROR, "视频文件保存失败~");
                            }
                        } else if (db_video.getSource_type() == 0) {
                            video.setPath(db_video.getPath());
                            video.setCode(db_video.getCode());
                            video.setOriginName(db_video.getOriginName());
                            video.setVideo_type(db_video.getVideo_type());
                            video.setSize(db_video.getSize());
                            if (!db_video.getCover().getPhoto_id().equals(cover.getPhoto_id())) {
                                video.setWidth(cover.getWidth());
                                video.setHeight(cover.getHeight());
                            } else {
                                video.setWidth(db_video.getWidth());
                                video.setHeight(db_video.getHeight());
                            }
                            response.setStatus(STATUS_SUCCESS);
                        } else {
                            response.setStatus(STATUS_PARAM_ERROR, "未上传视频文件~");
                        }
                    } else if (sourceType == 1 || sourceType == 2) {
                        if (sourceType == 1 && Utils.isNotEmpty(video.getPath())) {
                            video.setCode("");
                            if (!video.getPath().matches("^https?://.*")) {
                                video.setPath("http://" + video.getPath());
                            }
                            response.setStatus(STATUS_SUCCESS);
                        } else if (sourceType == 2 && Utils.isNotEmpty(video.getCode())) {
                            video.setPath("");
                            response.setStatus(STATUS_SUCCESS);
                        } else {
                            response.setStatus(STATUS_PARAM_ERROR, "path与code设置错误~");
                        }
                        if (response.isSuccess()) {
                            if (!db_video.getCover().getPhoto_id().equals(cover.getPhoto_id())) {
                                video.setWidth(cover.getWidth());
                                video.setHeight(cover.getHeight());
                            } else {
                                video.setWidth(db_video.getWidth());
                                video.setHeight(db_video.getHeight());
                            }
                            if (sourceType == 1 && video.getPath().matches(".*\\.(?i)mp3$")) {
                                video.setVideo_type("video/mp3");
                            } else {
                                video.setVideo_type("video/mp4");
                            }
                            video.setSize(0.00f);
                            video.setOriginName("");
                        }
                    } else {
                        response.setStatus(STATUS_PARAM_ERROR, "没有此sourceType~");
                    }
                    if (response.isSuccess()) {
                        response.setStatus(convertRowToHttpCode(videoDao.updateVideo(video)));
                        if (response.isSuccess()) {
                            if (db_video.getSource_type() == 0 && !db_video.getPath().equals(video.getPath())) {
                                fileService.recycleTrash(fileService.baseCloudDir(null), db_video.getPath(), true);
                            }
                            if (!db_video.getCover().getPhoto_id().equals(cover.getPhoto_id())) {
                                if (db_video.getCover().getImage_type() == null) {
                                    Matcher matcher = Pattern.compile("^.*/[^/]+(\\.([^/]+))?$").matcher(db_video.getPath());
                                    String type = null;
                                    if (matcher.find() && matcher.groupCount() == 2 && matcher.group(2) != null) {
                                        type = matcher.group(2).replace("jpg", "jpeg");
                                    } else {
                                        type = "jpeg";
                                    }
                                    db_video.getCover().setImage_type("image/" + type);
                                } else {
                                    db_video.getCover().setImage_type(db_video.getCover().getImage_type().replace("video", "image"));
                                }
                                videoDao.updateCoverImageType(db_video.getCover());
                                cover.setImage_type(cover.getImage_type() == null ? "video/jpeg" : cover.getImage_type().replace("image", "video"));
                                videoDao.updateCoverImageType(cover);
                            }
                            response.putAttr("video", findVideo(db_video, iRequest).getAttr("video"));
                        } else if (sourceType == 0 && video.getPath() != null && !db_video.getPath().equals(video.getPath())) {
                            String diskPath = fileService.baseCloudDir(video.getPath());
                            fileService.delete(diskPath);
                        }
                    }
                } else {
                    response.setStatus(STATUS_FORBIDDEN);
                }
            }
        }
        return response;
    }

    /**
     * 点赞视频
     *
     * @param video    - 只需传video_id
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此评论，500: 失败
     */
    @Override
    public IResponse likeVideo(Video video, IRequest iRequest) {
        IResponse response = new IResponse();
        if (videoDao.updateVideoLikeCount(video, 1) > 0) {
            response.setStatus(STATUS_SUCCESS);
        } else {
            response.setStatus(STATUS_NOT_FOUND, "无此视频");
        }
        return response;
    }

    /**
     * 查询视频的历史用户访问记录
     *
     * @param video
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    @Override
    public IResponse findVideoAccessRecordList(Video video, IRequest iRequest) {
        IResponse response = new IResponse();
        if (video == null) {
            response.setStatus(STATUS_PARAM_ERROR);
        } else if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else {
            IResponse videoResp = findVideo(video, iRequest);
            if (videoResp.isSuccess()) {
                Video db_video = videoResp.getAttr("video");
                if (db_video.getUser().getUid().equals(iRequest.getLoginUser().getUid())) {
                    AccessRecord<Video> queryAccessRecord = new AccessRecord();
                    queryAccessRecord.setBean(new Video(db_video.getVideo_id()));
                    List<AccessRecord<Video>> videoAccessRecordList = userDao.findVideoAccessRecordList(queryAccessRecord, iRequest.getLoginUser());
                    response.putAttr("videoAccessRecords", videoAccessRecordList);
                    response.putAttr("video_access_record_count", videoAccessRecordList.size());
                    response.putAttr(videoResp.getAttr());
                } else {
                    response.setStatus(STATUS_FORBIDDEN, "访问记录只能作者本人查看~");
                }
            } else {
                response.setStatus(videoResp);
            }
        }
        return response;
    }

    /**
     * 保存字幕对象
     *
     * @param file
     * @param subtitle
     * @param iRequest
     * @return IResponse:
     * status - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     * subtitle - subtitle
     */
    @Override
    public IResponse saveSubtitle(MultipartFile file, Subtitle subtitle, IRequest iRequest) {
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (subtitle == null ||
                !IdUtil.containValue(subtitle.getVideo_id()) || Utils.isEmpty(subtitle.getName()) || Utils.isEmpty(subtitle.getLang())) {
            response.setStatus(STATUS_PARAM_ERROR, "需要video_id、name、lang");
        } else if (file == null || file.isEmpty()) {
            response.setStatus(STATUS_PARAM_ERROR, "字幕文件为空");
        } else {
            IResponse videoResp = findVideo(new Video(subtitle.getVideo_id()), iRequest);
            if (videoResp.isSuccess()) {
                Video video = videoResp.getAttr("video");
                if (video.getUser().getUid().equals(iRequest.getLoginUser().getUid()) || iRequest.isManagerRequest()) {
                    if (video.getSource_type() == 2) {
                        return response.setStatus(STATUS_PARAM_ERROR, "引用IFRAME视频类型不支持字幕~");
                    }
                    String originalFilename = file.getOriginalFilename();
                    String suffix;
                    if (!originalFilename.contains(".") || originalFilename.endsWith(".vtt")) {
                        subtitle.setMime_type("text/vtt");
                        suffix = ".vtt";
                    } else if (originalFilename.endsWith(".ttml")) {
                        subtitle.setMime_type("application/ttml+xml");
                        suffix = ".ttml";
                    } else {
                        return response.setStatus(STATUS_PARAM_ERROR, "此字幕类型不支持，只支持：vtt、ttml");
                    }
                    subtitle.setSt_id(IdUtil.generatePrimaryKey());
                    subtitle.setUid(iRequest.getLoginUser().getUid());
                    subtitle.setUpload_time(System.currentTimeMillis());
                    String videoSavePath = video.getSource_type() == 0 ? video.getPath() : fileService.generateVideoSaveBlockPath(video);
                    Matcher matcher = Pattern.compile("^.*/([^/]+)/[^/]+$").matcher(videoSavePath);
                    matcher.find();
                    String blockDir = matcher.group(1); //文件夹
                    String shortUid = IdUtil.convertToShortPrimaryKey(subtitle.getUid());
                    String subTitleSavePath = Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + shortUid + "/subtitles/" + blockDir + "/" +
                            shortUid + "_" + blockDir + "_" +
                            IdUtil.convertToShortPrimaryKey(video.getVideo_id()) + "_" +
                            IdUtil.convertToShortPrimaryKey(subtitle.getSt_id()) + "_" +
                            IdUtil.convertDecimalIdTo62radix(System.currentTimeMillis()) + suffix;
                    try {
                        Map<String, Object> metadata = new HashMap<>();
                        metadata.put(HttpHeaders.CONTENT_TYPE, subtitle.getMime_type());
                        metadata.put(HttpHeaders.CACHE_CONTROL, "max-age=16070400");
                        fileService.save(file.getInputStream(), fileService.baseCloudDir(subTitleSavePath), metadata);
                        subtitle.setPath(subTitleSavePath);
                    } catch (IOException e) {
                        e.printStackTrace();
                        response.setStatus(STATUS_SERVER_ERROR, "字幕文件保存失败~");
                    }
                    if (response.isSuccess()) {
                        response.setStatus(convertRowToHttpCode(videoDao.saveSubtitle(subtitle)));
                        if (response.isSuccess()) {
                            response.putAttr("subtitle", subtitle);
                        } else {
                            String diskPath = fileService.baseCloudDir(subTitleSavePath);
                            fileService.delete(diskPath);
                        }
                    }
                } else {
                    response.setStatus(STATUS_FORBIDDEN);
                }
            } else {
                response.setStatus(videoResp);
            }
        }
        return response;
    }

    // 填充非必需填项的null值为空字符串
    private void fillVideoNotRequiredValueIfNull(Video video) {
        if (video == null) {
            return;
        } else {
            String EMPTY = "";
            if (video.getSource_type() == null) {
                video.setSource_type(0);
            }
            if (video.getClick_count() == 0) {
                video.setClick_count(0);
            }
            if (video.getDescription() == null) {
                video.setDescription(EMPTY);
            }
            if (video.getName() == null) {
                video.setName(EMPTY);
            }
            if (video.getTags() == null) {
                video.setTags(EMPTY);
            }
            if (video.getUpload_time() == null) {
                video.setUpload_time(new Date());
            }
            if (video.getRefer() == null) {
                video.setRefer(EMPTY);
            }
            if (video.getRotate() == null) {
                video.setRotate(0);
            }
        }
    }

    // 如果非必需填项的值为null, 则填充为db_video的值
    private void fillVideoNotRequiredValueIfNull(Video video, Video db_video) {
        if (video == null) {
            return;
        } else if (db_video == null) {
            fillVideoNotRequiredValueIfNull(video);
        } else {
            if (video.getUser() == null) {
                video.setUser(db_video.getUser());
            }
            if (video.getCover() == null) {
                video.setCover(db_video.getCover());
            }
            if (video.getSource_type() == null) {
                video.setSource_type(db_video.getSource_type());
            }
            if (video.getClick_count() == 0) {
                video.setClick_count(db_video.getClick_count());
            }
            if (video.getDescription() == null) {
                video.setDescription(db_video.getDescription());
            }
            if (video.getName() == null) {
                video.setName(db_video.getName());
            }
            if (video.getTags() == null) {
                video.setTags(db_video.getTags());
            }
            if (video.getUpload_time() == null) {
                video.setUpload_time(db_video.getUpload_time());
            }
            if (video.getRefer() == null) {
                video.setRefer(db_video.getRefer());
            }
            if (video.getRotate() == null) {
                video.setRotate(db_video.getRotate());
            }
        }
    }

}
