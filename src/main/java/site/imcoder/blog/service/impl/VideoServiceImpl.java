package site.imcoder.blog.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.cache.Cache;
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
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    @Resource(name = "localFileService")
    private IFileService fileService;

    @Resource
    private Cache cache;

    /**
     * 保存上传的视频
     *
     * @param file
     * @param video
     * @param loginUser
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 封面未找到, 500: 服务器错误
     * photo - photo对象
     */
    @Override
    public Map<String, Object> saveVideo(MultipartFile file, Video video, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        map.put("video", video);
        if (loginUser == null) {
            map.put("flag", 401);
        } else if (video == null) {
            map.put("flag", 400);
        } else {
            video.setUpload_time(new Date());
            video.setUser(loginUser);
            Photo cover = video.getCover();
            cover.setImage_type("video/mp4");
            albumService.updatePhoto(cover, null, loginUser);
            int sourceType = video.getSource_type();
            if (sourceType == 0) {
                if (file == null || file.isEmpty()) {
                    map.put("flag", 400);
                    return map;
                }
                String relativePath = fileService.generateVideoFolderPath(video);
                String fileName = fileService.generateNextVideoName(video, Config.get(ConfigConstants.CLOUD_FILE_BASEPATH) + relativePath);
                boolean isSave = fileService.saveVideoFile(file, video, relativePath, fileName);
                if (isSave) {
                    video.setPath(relativePath + fileName);
                    video.setCode("");
                    int row = videoDao.saveVideo(video);
                    if (row <= 0) {
                        String diskPath = Config.get(ConfigConstants.CLOUD_FILE_BASEPATH) + video.getPath();
                        fileService.delete(diskPath);
                    }
                    map.put("flag", convertRowToHttpCode(row));
                } else {
                    map.put("flag", 500);
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
                int row = videoDao.saveVideo(video);
                map.put("flag", convertRowToHttpCode(row));
            } else {
                map.put("flag", 400);
            }
        }
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
