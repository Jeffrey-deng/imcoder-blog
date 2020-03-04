package site.imcoder.blog.controller.view;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import site.imcoder.blog.Interceptor.annotation.AccessRecord;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.Video;
import site.imcoder.blog.service.IAlbumService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.service.IVideoService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import javax.annotation.Resource;

/**
 * 视频控制器
 *
 * @author Jeffrey.Deng
 */
@Controller
public class VideoController extends BaseController {

    @Resource
    private IAlbumService albumService;

    @Resource
    private IVideoService videoService;

    @Resource
    private IUserService userService;

    /**
     * 打开用户的视频页面
     *
     * @param uid
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = {"/u/videos", "/u/{uid}/videos"})
    public String userVideos(@PathVariable(required = false) @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid,
                             Model model, IRequest iRequest) {
        if (!IdUtil.containValue(uid)) {
            if (iRequest.isHasNotLoggedIn())
                return PAGE_LOGIN;
            else
                return "redirect:/u/" + iRequest.getLoginUser().getUid() + "/videos" + appendQueryString(iRequest.getQueryString());
        }
        User hostUser = new User(uid);
        IResponse userResp = userService.findUser(hostUser, iRequest);
        if (userResp.isSuccess()) {
            model.addAttribute("hostUser", userResp.getAttr("user"));
        }
        return getViewPage(userResp, "/video/video_list");
    }

    /**
     * 视频IFrame分享引用
     *
     * @param id
     * @param model
     * @param iRequest
     * @return
     */
    @AccessRecord(type = AccessRecord.Types.VIDEO, key = "video", deep = 0)
    @RequestMapping(value = "/video/embed/{id}")
    public String embed(@PathVariable @PrimaryKeyConvert Long id, @RequestParam(defaultValue = "true") boolean save_access_record, Model model, IRequest iRequest) {
        IResponse videoResp = videoService.findVideo(new Video(id), iRequest);
        if (videoResp.isSuccess()) {
            model.addAllAttributes(videoResp.getAttr());
            if (!save_access_record) { // 拒绝保存访问记录
                model.addAttribute(AccessRecord.DEFAULT_RECORD_REWRITE_KEY, false);
            }
        }else if (videoResp.equalsStatus(STATUS_FORBIDDEN) && "setting_disable_view".equals(videoResp.getAttr("forbidden_type"))) {
            model.addAttribute(KEY_ERROR_INFO, videoResp.getMessage());
        }
        return getViewPage(videoResp, "/video/video_embed");
    }

    /**
     * 打开视频详情
     *
     * @param id       视频id
     * @param cover_id 封面照片id，与上两者二选一
     * @param model
     * @param iRequest
     * @return
     */
    @AccessRecord(type = AccessRecord.Types.VIDEO, key = "video", deep = 2)
    @RequestMapping(value = {"/video/detail/{id}", "/video/detail"})
    public String openVideoDetail(@PathVariable(required = false) @PrimaryKeyConvert Long id,
                                  @RequestParam(defaultValue = "0") @PrimaryKeyConvert Long cover_id,
                                  Model model, IRequest iRequest) {
        int flag = STATUS_SUCCESS;
        Video videoArgs = null;
        if (IdUtil.containValue(id)) {
            videoArgs = new Video(id);
        } else if (cover_id != 0) {
            videoArgs = new Video();
            Photo cover = new Photo(cover_id);
            videoArgs.setCover(cover);
        } else {
            flag = STATUS_PARAM_ERROR;
        }
        if (flag == STATUS_SUCCESS) {
            IResponse videoResp = videoService.findVideo(videoArgs, iRequest);
            flag = videoResp.getStatus();
            if (videoResp.isSuccess()) {
                model.addAllAttributes(videoResp.getAttr());
            } else if (videoResp.equalsStatus(STATUS_FORBIDDEN) && "setting_disable_view".equals(videoResp.getAttr("forbidden_type"))) {
                model.addAttribute(KEY_ERROR_INFO, videoResp.getMessage());
            }
        }
        if (flag == STATUS_NOT_LOGIN) {
            model.addAttribute("http_code", 403);
        }
        return getViewPage(flag, "/video/video_detail");
    }

    /**
     * 打开视频广场
     *
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = {"/video/dashboard"})
    public String videoDashboard(Model model, IRequest iRequest) {
        model.addAttribute("dashboard_model", "video");
        return "/video/video_list";
    }

    /**
     * 打开用户赞过的视频列表
     *
     * @param uid
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = {"/u/likes/videos", "/u/{uid}/likes/videos"})
    public String userLikeVideoList(@PathVariable(required = false) @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid, Model model, IRequest iRequest) {
        if (!IdUtil.containValue(uid)) {
            if (iRequest.isHasNotLoggedIn())
                return PAGE_LOGIN;
            else
                return "redirect:/u/" + iRequest.getLoginUser().getUid() + "/likes/videos" + appendQueryString(iRequest.getQueryString());
        }
        User queryUser = new User(uid);
        IResponse userResp = userService.findUser(queryUser, iRequest);
        if (userResp.isSuccess()) {
            if (iRequest.isHasLoggedIn() && iRequest.getLoginUser().getUid().equals(uid)) {
                model.addAttribute("hostUser", userResp.getAttr("user"));
                model.addAttribute("clear_model", "likes");
                model.addAttribute("dashboard_model", "video");
            } else {
                userResp.setStatus(STATUS_FORBIDDEN);
            }
        }
        return getViewPage(userResp, "/video/video_list");
    }

    /**
     * 打开用户历史访问的视频列表
     *
     * @param uid
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = {"/u/history/videos", "/u/{uid}/history/videos"})
    public String userAccessHistoryVideoList(@PathVariable(required = false) @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid, Model model, IRequest iRequest) {
        if (!IdUtil.containValue(uid)) {
            if (iRequest.isHasNotLoggedIn())
                return PAGE_LOGIN;
            else
                return "redirect:/u/" + iRequest.getLoginUser().getUid() + "/history/videos" + appendQueryString(iRequest.getQueryString());
        }
        User queryUser = new User(uid);
        IResponse userResp = userService.findUser(queryUser, iRequest);
        if (userResp.isSuccess()) {
            if (iRequest.isHasLoggedIn() && iRequest.getLoginUser().getUid().equals(uid)) {
                model.addAttribute("hostUser", userResp.getAttr("user"));
                model.addAttribute("clear_model", "history");
                model.addAttribute("dashboard_model", "video");
            } else {
                userResp.setStatus(STATUS_FORBIDDEN);
            }
        }
        return getViewPage(userResp, "/video/video_list");
    }

}
