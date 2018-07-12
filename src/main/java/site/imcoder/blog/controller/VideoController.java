package site.imcoder.blog.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.Video;
import site.imcoder.blog.service.IAlbumService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.service.IVideoService;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.Map;

/**
 * 视频控制器
 *
 * @author Jeffrey.Deng
 */
@Controller
@RequestMapping("/video.do")
public class VideoController {

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
     * @param photoFile
     * @param video
     * @param request
     * @param session
     * @return
     */
    @RequestMapping(params = "method=upload")
    @ResponseBody
    public Map<String, Object> uploadVideo(@RequestParam(value = "file") MultipartFile videoFile, @RequestParam(value = "file", required = false) MultipartFile photoFile, Video video, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> photoMap = albumService.savePhoto(photoFile, video.getCover(), loginUser);
        int photoSaveFlag = (int) photoMap.get("flag");
        if (photoSaveFlag == 200) {
            Map<String, Object> videoMap = videoService.saveVideo(videoFile, video, loginUser);
            int videoSaveFlag = (int) photoMap.get("flag");
            if (videoSaveFlag == 200) {
                videoMap.put("info", "视频上传成功");
            } else {
                convertStatusCodeToWord(videoMap, "flag", "info");
            }
            return videoMap;
        } else {
            convertStatusCodeToWord(photoMap, "flag", "info");
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
    public Map<String, Object> videoDetailByAjax(int video_id, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Video video = new Video();
        video.setVideo_id(video_id);
        Map<String, Object> map = videoService.findVideo(video, loginUser);
        int flag = (int) map.get("flag");
        if (flag == 200) {
            map.put("info", "查找成功！");
        } else {
            convertStatusCodeToWord(map, "flag", "info");
        }
        return map;
    }

    private void convertStatusCodeToWord(Map<String, Object> map, String codeKey, String wordKey) {
        int flag = (Integer) map.get(codeKey);
        if (flag == 400) {
            map.put(wordKey, "参数错误");
        } else if (flag == 401) {
            map.put(wordKey, "需要登录");
        } else if (flag == 403) {
            map.put(wordKey, "没有权限");
        } else if (flag == 404) {
            map.put(wordKey, "ID不存在");
        } else {
            map.put(wordKey, "服务器错误");
        }
    }

}
