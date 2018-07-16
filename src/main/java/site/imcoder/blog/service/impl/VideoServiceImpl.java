package site.imcoder.blog.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.cache.Cache;
import site.imcoder.blog.dao.IVideoDao;
import site.imcoder.blog.entity.Friend;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.Video;
import site.imcoder.blog.service.IVideoService;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.Map;

/**
 * @author Jeffrey.Deng
 */
@Service("videoService")
public class VideoServiceImpl implements IVideoService {

    @Resource
    private IVideoDao videoDao;

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
        } else if (file == null || video == null) {
            map.put("flag", 400);
        } else {
            video.setUser(loginUser);
            video.getCover().setImage_type("video/mp4");
            //todo save disk
            int row = videoDao.saveVideo(video);
            map.put("flag", convertRowToHttpCode(row));
        }
        return map;
    }

    /**
     * 返回视频
     *
     * @param video
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
