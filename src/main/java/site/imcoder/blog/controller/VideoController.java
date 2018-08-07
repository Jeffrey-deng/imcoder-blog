package site.imcoder.blog.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.Video;
import site.imcoder.blog.service.IAlbumService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.service.IVideoService;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 视频控制器
 *
 * @author Jeffrey.Deng
 */
@Controller
@RequestMapping("/video.do")
public class VideoController extends BaseController {

    @Resource
    private IAlbumService albumService;

    @Resource
    private IVideoService videoService;

    @Resource
    private IUserService userService;

    /**
     * 上传视频
     *
     * @param videoFile
     * @param coverFile
     * @param video
     * @param request
     * @param session
     * @return
     */
    @RequestMapping(params = "method=upload")
    @ResponseBody
    public Map<String, Object> uploadVideo(@RequestParam(value = "videoFile", required = false) MultipartFile videoFile, @RequestParam(value = "coverFile", required = false) MultipartFile coverFile, Video video, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> photoMap = null;
        if (loginUser != null && coverFile == null && video != null && video.getCover() != null && video.getCover().getPhoto_id() > 0) { //如果指定了已有的图片
            photoMap = albumService.findPhoto(video.getCover(), loginUser);
            if (((int) photoMap.get(KEY_STATUS)) == 200 && ((Photo) photoMap.get("photo")).getUid() != loginUser.getUid()) {
                photoMap.put(KEY_STATUS, 403);
            }
        } else {
            photoMap = albumService.savePhoto(coverFile, video.getCover(), loginUser);
        }
        int photoSaveFlag = (int) photoMap.get(KEY_STATUS);
        if (photoSaveFlag == 200) {
            video.setCover((Photo) photoMap.get("photo"));
            Map<String, Object> videoMap = videoService.saveVideo(videoFile, video, loginUser);
            int videoSaveFlag = (int) videoMap.get(KEY_STATUS);
            if (videoSaveFlag == 200) {
                videoMap.put(KEY_STATUS_FRIENDLY, "视频上传成功");
            } else {
                convertStatusCodeToWord(videoMap, KEY_STATUS, KEY_STATUS_FRIENDLY);
            }
            return videoMap;
        } else {
            convertStatusCodeToWord(photoMap, KEY_STATUS, KEY_STATUS_FRIENDLY);
            return photoMap;
        }
    }

    /**
     * 视频详情
     *
     * @param video_id
     * @param request
     * @param session
     * @return
     */
    @RequestMapping(params = "method=detailByAjax")
    @ResponseBody
    public Map<String, Object> videoDetailByAjax(@RequestParam(defaultValue = "0") int video_id, @RequestParam(defaultValue = "0") int cover_id, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Video video = new Video();
        video.setVideo_id(video_id);
        if (cover_id > 0) {
            Photo cover = new Photo();
            cover.setPhoto_id(cover_id);
            video.setCover(cover);
        }
        Map<String, Object> map = videoService.findVideo(video, loginUser);
        int flag = (int) map.get(KEY_STATUS);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "查找成功！");
        } else {
            convertStatusCodeToWord(map);
        }
        return map;
    }

    /**
     * 视频列表详情通过封面id数组
     *
     * @param covers
     * @param session
     * @return
     */
    @RequestMapping(params = "method=videoListByAjaxAcceptCovers")
    @ResponseBody
    public Map<String, Object> videoListByAjaxAcceptCovers(@RequestParam("covers") ArrayList<Integer> covers, HttpSession session) {
        User loginUser = getLoginUser(session);
        List<Video> videos = videoService.findVideoListByCoverArray(covers, loginUser);
        Map<String, Object> map = new HashMap<>();
        map.put(KEY_STATUS, 200);
        map.put("videos", videos);
        return map;
    }

    /**
     * 打开用户的视频页面
     *
     * @param uid
     * @param session
     * @return
     */
    @RequestMapping(params = "method=user_videos")
    public String userVideos(@RequestParam(defaultValue = "0") int uid, HttpServletRequest request, HttpSession session) {
        User loginUser = getLoginUser(session);
        if (uid == 0) {
            if (loginUser == null)
                return PAGE_LOGIN;
            else
                return "redirect:/video.do?method=user_videos&uid=" + loginUser.getUid();
        }

        User hostUser = new User();
        hostUser.setUid(uid);
        hostUser = userService.findUser(hostUser, loginUser);
        if (hostUser == null) {
            return PAGE_NOT_FOUND_ERROR;
        } else {
            request.setAttribute("hostUser", hostUser);
            return "/video/video_list";
        }
    }

}
