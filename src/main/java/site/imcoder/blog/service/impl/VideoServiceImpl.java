package site.imcoder.blog.service.impl;

import org.apache.commons.collections.map.HashedMap;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.type.UserGroupType;
import site.imcoder.blog.dao.ISiteDao;
import site.imcoder.blog.dao.IVideoDao;
import site.imcoder.blog.entity.Friend;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.Video;
import site.imcoder.blog.service.IAlbumService;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.service.IVideoService;
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
public class VideoServiceImpl implements IVideoService {

    @Resource
    private IVideoDao videoDao;

    @Resource
    private ISiteDao siteDao;

    @Resource
    private IAlbumService albumService;

    @Resource(name = "fileService")
    private IFileService fileService;

    @Resource
    private Cache cache;

    /**
     * 得到上传配置信息
     *
     * @param loginUser
     * @return
     */
    @Override
    public Map<String, Object> getUploadConfigInfo(User loginUser) {
        Map<String, Object> uploadConfig = new HashedMap();
        uploadConfig.put("allowUploadLowestLevel", Config.getInt(ConfigConstants.CLOUD_ALLOW_UPLOAD_LOWEST_LEVEL));
        uploadConfig.put("isAllowUpload", isAllowUpload(loginUser));
        // uploadArgs
        Map<String, Object> uploadArgs = new HashedMap();
        uploadArgs.put("mode", Config.get(ConfigConstants.CLOUD_FILE_SYSTEM_MODE));
        uploadArgs.put("maxPhotoUploadSize", Config.getInt(ConfigConstants.CLOUD_PHOTO_MAX_UPLOADSIZE));
        uploadArgs.put("maxVideoUploadSize", Config.getInt(ConfigConstants.CLOUD_VIDEO_MAX_UPLOADSIZE));
        uploadConfig.put("uploadArgs", uploadArgs);
        //
        uploadConfig.put("flag", 200);
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
     * @param loginUser
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 封面未找到, 500: 服务器错误
     * photo - photo对象
     */
    @Override
    public Map<String, Object> saveVideo(MultipartFile videoFile, Video video, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        int flag = 200;
        if (loginUser == null) {
            flag = 401;
        } else if (!isAllowUpload(loginUser)) {
            flag = 403;
        } else if (video == null || video.getCover() == null || video.getCover().getPhoto_id() == 0) {
            flag = 400;
        } else {
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
            if (video.getOriginName() == null) {
                video.setOriginName(videoFile.getOriginalFilename());
            }
            fillVideoNotRequiredValueIfNull(video);
            int sourceType = video.getSource_type();
            if (sourceType == 0) {
                if (videoFile == null || videoFile.isEmpty()) {
                    flag = 400;
                } else {
                    String relativePath = fileService.generateVideoFolderPath(video);
                    String fileName = fileService.generateNextVideoName(video, relativePath);
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
                        flag = 200;
                    } else {
                        flag = 500;
                    }
                }
            } else if (sourceType == 1 || sourceType == 2) {
                if (sourceType == 1) {
                    video.setCode("");
                } else {
                    video.setPath("");
                }
                video.setWidth(cover.getWidth());
                video.setHeight(cover.getHeight());
                video.setVideo_type("video/mp4");
                video.setSize(0.00f);
                video.setOriginName("");
                flag = 200;
            } else {
                flag = 400;
            }
            if (flag == 200) {
                int row = videoDao.saveVideo(video);
                flag = convertRowToHttpCode(row);
                if (flag == 200) {
                    cover.setImage_type(cover.getImage_type() == null ? "video/jpeg" : cover.getImage_type().replace("image", "video"));
                    videoDao.updateCoverImageType(cover);
                    map.put("video", video);
                } else if (sourceType == 0) {
                    String diskPath = fileService.baseCloudDir(video.getPath());
                    fileService.delete(diskPath);
                }
            }
        }
        map.put("flag", flag);
        return map;
    }

    /**
     * 返回视频
     *
     * @param video     视频id，或者封面id
     * @param loginUser
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 视频ID未找到
     * video - video
     */
    @Override
    public Map<String, Object> findVideo(Video video, User loginUser) {
        Map<String, Object> map = new HashMap<String, Object>();
        if (video == null) {
            map.put("flag", 400);
            return map;
        }
        video = videoDao.findVideo(video);
        map.put("video", video);
        map.put("flag", 200);
        if (video == null) {
            map.put("flag", 404);
            return map;
        }

        //作者本人查看时直接返回
        if (loginUser != null && loginUser.getUid() == video.getUser().getUid()) {
            return map;
        }

        int permission = video.getPermission();

        //公开权限直接返回
        if (permission == 0) {
            return map;
        }

        // 权限为好友可见
        if (permission == 1 && loginUser != null) {
            Friend friend = new Friend();
            friend.setUid(video.getUser().getUid());
            friend.setFid(loginUser.getUid());
            if (cache.containsFriend(friend) > 0) {
                return map;
            }
        }

        map.put("video", null);
        map.put("flag", loginUser == null ? 401 : 403);
        return map;
    }

    /**
     * 通过封面列表返回视频列表
     *
     * @param covers
     * @param loginUser
     * @return videoList
     */
    @Override
    public List<Video> findVideoListByCoverArray(List<Integer> covers, User loginUser) {
        return videoDao.findVideoListByCoverArray(covers, loginUser);
    }

    /**
     * 保存上传的视频
     *
     * @param videoFile
     * @param video
     * @param loginUser
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 封面未找到, 500: 服务器错误
     * photo - photo对象
     */
    @Override
    public Map<String, Object> updateVideo(MultipartFile videoFile, Video video, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        int flag = 200;
        if (loginUser == null) {
            flag = 401;
        } else if (!isAllowUpload(loginUser)) {
            flag = 403;
        } else if (video == null || video.getVideo_id() == 0 || video.getCover() == null || video.getCover().getPhoto_id() == 0) {
            flag = 400;
        } else {
            Map<String, Object> videoQuery = findVideo(video, loginUser);
            flag = (int) videoQuery.get("flag");
            if (flag == 200) {
                Video db_video = (Video) videoQuery.get("video");
                Photo cover = video.getCover();
                if (db_video.getUser().getUid() == loginUser.getUid()) {
                    fillVideoNotRequiredValueIfNull(video, db_video);
                    int sourceType = video.getSource_type();
                    if (sourceType == 0) {
                        if (videoFile != null && !videoFile.isEmpty()) {
                            if (video.getOriginName() == null) {
                                video.setOriginName(videoFile.getOriginalFilename() == null ? "" : videoFile.getOriginalFilename());
                            }
                            String newPathDir = null;
                            String newPathFileName = null;
                            if (db_video.getSource_type() == 0) {
                                Matcher matcher = Pattern.compile("^(.*/)(.*_)(\\d{10,})(\\..+)?$").matcher(db_video.getPath());
                                matcher.find();
                                newPathDir = matcher.group(1); //文件夹
                                String newPathExt = video.getOriginName().lastIndexOf('.') != -1 ? video.getOriginName().substring(video.getOriginName().lastIndexOf('.')) : ".mp4";
                                newPathFileName = matcher.group(2) + new Date().getTime() + newPathExt; // 新文件名
                            } else {
                                newPathDir = fileService.generateVideoFolderPath(video);
                                newPathFileName = fileService.generateNextVideoName(video, newPathDir);
                            }
                            video.setPath(null);
                            try {
                                if (fileService.saveVideoFile(videoFile.getInputStream(), video, newPathDir, newPathFileName)) {
                                    video.setPath(newPathDir + newPathFileName);
                                    video.setCode("");
                                    flag = 200;
                                } else {
                                    flag = 500;
                                }
                            } catch (IOException e) {
                                e.printStackTrace();
                                flag = 500;
                            }
                        } else if (db_video.getSource_type() == 0) {
                            video.setPath(db_video.getPath());
                            video.setCode(db_video.getCode());
                            video.setOriginName(db_video.getOriginName());
                            video.setVideo_type(db_video.getVideo_type());
                            video.setWidth(db_video.getWidth());
                            video.setHeight(db_video.getHeight());
                            video.setSize(db_video.getSize());
                            flag = 200;
                        } else {
                            flag = 400;
                        }
                    } else if (sourceType == 1 || sourceType == 2) {
                        if (sourceType == 1 && Utils.isNotEmpty(video.getPath())) {
                            video.setCode("");
                            flag = 200;
                        } else if (sourceType == 2 && Utils.isNotEmpty(video.getCode())) {
                            video.setPath("");
                            flag = 200;
                        } else {
                            flag = 400;
                        }
                        if (flag == 200) {
                            video.setWidth(cover.getWidth());
                            video.setHeight(cover.getHeight());
                            video.setVideo_type("video/mp4");
                            video.setSize(0.00f);
                            video.setOriginName("");
                        }
                    } else {
                        flag = 400;
                    }
                    if (flag == 200) {
                        flag = convertRowToHttpCode(videoDao.updateVideo(video));
                        if (flag == 200) {
                            if (db_video.getSource_type() == 0 && !db_video.getPath().equals(video.getPath())) {
                                fileService.recycleTrash(fileService.baseCloudDir(null), db_video.getPath(), true);
                            }
                            if (db_video.getCover().getPhoto_id() != cover.getPhoto_id()) {
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
                            map.put("video", findVideo(db_video, loginUser).get("video"));
                        } else if (sourceType == 0 && video.getPath() != null && !db_video.getPath().equals(video.getPath())) {
                            String diskPath = fileService.baseCloudDir(video.getPath());
                            fileService.delete(diskPath);
                        }
                    }
                } else {
                    flag = 403;
                }
            }
        }
        map.put("flag", flag);
        return map;
    }

    /**
     * 点击量加1
     *
     * @param video
     * @return
     */
    @Override
    public int raiseVideoClickCount(Video video) {
        return videoDao.raiseVideoClickCount(video);
    }

    // 填充非必需填项的null值为空字符串
    private void fillVideoNotRequiredValueIfNull(Video video) {
        if (video == null) {
            return;
        } else {
            String EMPTY = "";
            if (video.getClick() == 0) {
                video.setClick(0);
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
            if (video.getOriginName() == null) {
                video.setOriginName(EMPTY);
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
            if (video.getClick() == 0) {
                video.setClick(db_video.getClick());
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
        }
    }

    private int convertRowToHttpCode(int row) {
        int httpCode = 200;
        if (row == 0) {
            httpCode = 404;
        } else if (row == -1) {
            httpCode = 500;
        }
        return httpCode;
    }

}
