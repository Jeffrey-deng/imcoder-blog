package site.imcoder.blog.controller.view.old;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

/**
 * description: 相册控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/photo")
public class OldPhotoController extends BaseController {

    @RequestMapping()
    public ModelAndView defaultHandle(HttpServletRequest request) {
        String path = Utils.getRequestPath(request);
        ModelAndView mv = new ModelAndView();
        if (path.matches("^/[^/]*/?$") && !"XMLHttpRequest".equals(request.getHeader("X-Requested-With"))) {
            buildRedirectView(mv, "/p/dashboard?model=photo", Config.getInt(ConfigConstants.SITE_OLD_PAGE_REDIRECT_CODE));
        } else {
            mv.setViewName(PAGE_NOT_FOUND_ERROR);
        }
        return mv;
    }

    /**
     * 打开相册详情
     */
    @RequestMapping(value = "album_detail")
    public ModelAndView openAlbum(@RequestParam(defaultValue = "0") int id, int check, IRequest iRequest) {
        String album_id = IdUtil.convertToShortPrimaryKey(IdUtil.convertOldPrimaryKeyToNew(id));
        String photo_id = IdUtil.convertToShortPrimaryKey(IdUtil.convertOldPrimaryKeyToNew(check));
        return getModelAndView("/p/album/" + album_id + appendQueryString(iRequest.getQueryString().replaceFirst("(^|&)id=\\d+", "").replaceFirst("\\bcheck=" + check + "\\b", "check=" + photo_id)));
    }

    /**
     * 打开相册列表
     */
    @RequestMapping(value = "user_albums")
    public ModelAndView userAlbumList(@RequestParam(defaultValue = "0") int uid, IRequest iRequest) {
        long newUid = IdUtil.convertOldPrimaryKeyToNew(uid);
        return getModelAndView("/u/" + newUid + "/albums" + appendQueryString(iRequest.getQueryString().replaceFirst("(^|&)uid=\\d+", "")));
    }

    /**
     * 打开dashboard
     */
    @RequestMapping(value = "dashboard")
    public ModelAndView albumList(IRequest iRequest) {
        return getModelAndView("/p/dashboard" + appendQueryString(iRequest.getQueryString()));
    }

    /**
     * 打开标签广场
     */
    @RequestMapping(value = "tags_square")
    public ModelAndView tagsSquare(HttpSession session, IRequest iRequest) {
        return getModelAndView("/p/tags_square" + appendQueryString(iRequest.getQueryString()));
    }

    /**
     * 打开照片详情
     */
    @RequestMapping(value = "detail")
    public ModelAndView openPhotoDetail(@RequestParam(defaultValue = "0") int id, IRequest iRequest) {
        String photo_id = IdUtil.convertToShortPrimaryKey(IdUtil.convertOldPrimaryKeyToNew(id));
        return getModelAndView("/p/detail/" + photo_id + appendQueryString(iRequest.getQueryString().replaceFirst("(^|&)id=\\d+", "")));
    }

    /**
     * 用户照片标签，重定向至/photo/dashboard?model=photo
     */
    @RequestMapping(value = "tag")
    public ModelAndView photo_tag(String name, IRequest iRequest) {
        if (Utils.isEmpty(name)) {
            return buildModelAndView(PAGE_PARAM_ERROR);
        }
        String queryString = iRequest.getQueryString().replaceAll("(^|&)(name|tags)=[^&]+", "") + "&tags=" + Utils.encodeURL(name);
        return getModelAndView("/photo/dashboard?model=photo&" + appendQueryString(queryString).replaceFirst("^\\?", ""));
    }

    /**
     * 用户照片合集topic，重定向至/photo/dashboard?model=photo
     */
    @RequestMapping(value = "topic")
    public ModelAndView photo_topic(@RequestParam(defaultValue = "0") int id, String name, IRequest iRequest) {
        if (id == 0 && Utils.isEmpty(name)) {
            return buildModelAndView(PAGE_PARAM_ERROR);
        }
        String queryString = iRequest.getQueryString();
        if (id > 0) {
            queryString = queryString.replaceFirst("(^|&)id=[^&]+", "") + "&topic.ptwid=" + id;
        }
        if (Utils.isNotEmpty(name)) {
            queryString = queryString.replaceFirst("(^|&)name=[^&]+", "") + "&topic.name=" + Utils.encodeURL(name);
        }
        return getModelAndView("/photo/dashboard?model=photo&" + appendQueryString(queryString).replaceFirst("^\\?", ""));
    }

    private ModelAndView getModelAndView(String page) {
        return buildRedirectView(page, Config.getInt(ConfigConstants.SITE_OLD_PAGE_REDIRECT_CODE));
    }

}
