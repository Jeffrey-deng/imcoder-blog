package site.imcoder.blog.controller.view.old;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

/**
 * 视频控制器
 *
 * @author Jeffrey.Deng
 */
@Controller
@RequestMapping("/video")
public class OldVideoController extends BaseController {

    /**
     * 打开用户的视频页面
     */
    @RequestMapping(value = "user_videos")
    public ModelAndView userVideos(@RequestParam(defaultValue = "0") int uid, IRequest iRequest) {
        long newUid = IdUtil.convertOldPrimaryKeyToNew(uid);
        return getModelAndView("/u/" + newUid + "/videos" + appendQueryString(iRequest.getQueryString().replaceFirst("(^|&)uid=\\d+", "")));
    }

    /**
     * 视频IFrame分享引用
     */
    @RequestMapping(value = "embed", params = {"id"})
    public ModelAndView embed(@RequestParam(defaultValue = "0") int id, IRequest iRequest) {
        String newUid = IdUtil.convertToShortPrimaryKey(IdUtil.convertOldPrimaryKeyToNew(id));
        return getModelAndView("/video/embed/" + newUid + appendQueryString(iRequest.getQueryString().replaceFirst("(^|&)id=\\d+", "")));
    }

    /**
     * 打开视频详情
     */
    @RequestMapping(value = "detail", params = {"id"})
    public ModelAndView openVideoDetail(@RequestParam(defaultValue = "0") int id, IRequest iRequest) {
        String newId = IdUtil.convertToShortPrimaryKey(IdUtil.convertOldPrimaryKeyToNew(id));
        return getModelAndView("/video/detail/" + newId + appendQueryString(iRequest.getQueryString().replaceFirst("(^|&)id=\\d+", "")));
    }

    private ModelAndView getModelAndView(String page) {
        return buildRedirectView(page, Config.getInt(ConfigConstants.SITE_OLD_PAGE_REDIRECT_CODE));
    }

}
