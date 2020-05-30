package site.imcoder.blog.controller.view;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import site.imcoder.blog.Interceptor.annotation.AccessRecord;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.common.type.TagWrapperType;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.controller.formatter.primarykey.PrimaryKeyConvert;
import site.imcoder.blog.entity.Album;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.PhotoTagWrapper;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.IAlbumService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import javax.annotation.Resource;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * description: 相册控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
public class PhotoController extends BaseController {

    @Resource
    private IAlbumService albumService;

    @Resource
    private IUserService userService;

    /**
     * 打开相册详情
     *
     * @param album_id
     * @param model
     * @param iRequest
     * @return
     */
    @AccessRecord(type = AccessRecord.Types.ALBUM, key = "album")
    @RequestMapping(value = "/p/album/{album_id}")
    public String openAlbum(@PathVariable @PrimaryKeyConvert Long album_id, Model model, IRequest iRequest) {
        Album album = new Album();
        album.setAlbum_id(album_id);
        IResponse albumResp = albumService.findAlbumInfo(album, iRequest);
        if (albumResp.isSuccess()) {
            model.addAttribute("album", albumResp.getAttr("album"));
        } else if (albumResp.equalsStatus(STATUS_NOT_LOGIN)) {
            model.addAttribute("http_code", 403);
        }
        return getViewPage(albumResp, "/album/album_detail");
    }

    /**
     * 打开相册列表
     *
     * @param uid
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = {"/u/albums", "/u/{uid}/albums"})
    public String userAlbumList(@PathVariable(required = false) @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid, Model model, IRequest iRequest) {
        if (!IdUtil.containValue(uid)) {
            if (iRequest.isHasNotLoggedIn())
                return PAGE_LOGIN;
            else
                return "redirect:/u/" + iRequest.getLoginUser().getUid() + "/albums" + appendQueryString(iRequest.getQueryString());
        }
        User hostUser = new User(uid);
        IResponse userResp = userService.findUser(hostUser, iRequest);
        if (userResp.isSuccess()) {
            model.addAttribute("hostUser", userResp.getAttr("user"));
        }
        return getViewPage(userResp, "/album/album_list");
    }

    /**
     * 打开dashboard
     *
     * @param dashboard_model photo、album
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = "/p/dashboard")
    public String photoDashboard(@RequestParam(name = "model", defaultValue = "photo") String dashboard_model,
                                 @PrimaryKeyConvert Long album_id,
                                 @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid,
                                 Model model, IRequest iRequest) {
        if (dashboard_model.equalsIgnoreCase("photo")) {
            model.addAttribute("dashboard_model", "photo");
        } else if (dashboard_model.equalsIgnoreCase("album")) {
            model.addAttribute("dashboard_model", "album");
        } else {
            return "redirect:/p/dashboard?model=photo";
        }
        if (IdUtil.containValue(album_id)) {
            IResponse albumResponse = albumService.findAlbumInfo(new Album(album_id), iRequest);
            if (albumResponse.isSuccess()) {
                Album album = albumResponse.getAttr("album");
                model.addAttribute("album", album);
                model.addAttribute("hostUser", album.getUser());
            }
        } else if (IdUtil.containValue(uid)) {
            IResponse userResponse = userService.findUser(new User(uid), iRequest.putAttr("strict", false));
            if (userResponse.isSuccess()) {
                model.addAttribute("hostUser", userResponse.getAttr("user"));
            }
        }
        return "/album/album_dashboard";
    }

    /**
     * 打开标签广场
     *
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = "/p/tags_square")
    public String tagsSquare(@PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid, Model model, IRequest iRequest) {
        if (IdUtil.containValue(uid)) {
            IResponse userResponse = userService.findUser(new User(uid), iRequest.putAttr("strict", false));
            if (userResponse.isSuccess()) {
                model.addAttribute("hostUser", userResponse.getAttr("user"));
            }
        }
        return "/album/album_tags_square";
    }

    /**
     * 打开照片详情
     *
     * @param id
     * @param model
     * @param iRequest
     * @return
     */
    @AccessRecord(type = AccessRecord.Types.PHOTO, key = "photo", deep = 1)
    @RequestMapping(value = "/p/detail/{id}")
    public String openPhotoDetail(@PathVariable @PrimaryKeyConvert Long id, String path, Model model, IRequest iRequest) {
        Photo photo = null;
        Album album = null;
        int flag = STATUS_SUCCESS;
        if (IdUtil.containValue(id)) {
            iRequest.putAttr("loadAlbum", true);
            Photo queryArgs = new Photo(id);
            IResponse photoResp = albumService.findPhoto(queryArgs, iRequest);
            flag = photoResp.getStatus();
            if (photoResp.isSuccess()) {
                photo = photoResp.getAttr("photo");
                album = photoResp.getAttr("album");
            }
        } else if (!Utils.isNotEmpty(path)) {
            Photo queryArgs = new Photo();
            Matcher matcher = Pattern.compile("/^https?://.*?/(blog/)?(user/\\w+/photos/\\w+/[0-9a-zA-Z_\\.]+\\.(gif|jpe?g|png|bmp|svg|ico))(\\?[\\x21-\\x7e]*)?$/").matcher(path);
            if (matcher.find()) {
                path = matcher.group(2);
            }
            queryArgs.setPath(path);
            IResponse photosResp = albumService.findPhotoList(queryArgs, "and", 0, -1, iRequest);
            List<Photo> photos = photosResp.getAttr("photos");
            if (photosResp.isSuccess() && photos.size() > 0) {
                photo = photos.get(0);
                flag = STATUS_SUCCESS;
            } else {
                flag = STATUS_NOT_FOUND;
            }
        } else {
            flag = STATUS_PARAM_ERROR;
        }
        if (flag == STATUS_SUCCESS) {
            if (album == null) {
                album = albumService.findAlbumInfo(new Album(photo.getAlbum_id()), iRequest).getAttr("album");
            }
            model.addAttribute("photo", photo);
            model.addAttribute("album", album);
        } else if (flag == STATUS_NOT_LOGIN) {
            model.addAttribute("http_code", 403);
        }
        return getViewPage(flag, "/album/photo_detail");
    }

    /**
     * 打开用户照片列表
     *
     * @param uid
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = {"/u/photos", "/u/{uid}/photos"})
    public String userPhotoList(@PathVariable(required = false) @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid, @PrimaryKeyConvert Long album_id, Model model, IRequest iRequest) {
        if (!IdUtil.containValue(uid)) {
            if (iRequest.isHasNotLoggedIn())
                return PAGE_LOGIN;
            else
                return "redirect:/u/" + iRequest.getLoginUser().getUid() + "/photos" + appendQueryString(iRequest.getQueryString());
        }
        User queryUser = new User(uid);
        IResponse userResp = userService.findUser(queryUser, iRequest);
        if (userResp.isSuccess()) {
            if (IdUtil.containValue(album_id)) {
                Album queryAlbum = new Album(album_id);
                queryAlbum.setUser(queryUser);
                IResponse albumResp = albumService.findAlbumInfo(queryAlbum, iRequest);
                if (albumResp.isSuccess()) {
                    model.addAttribute("album", albumResp.getAttr("album"));
                }
            }
            model.addAttribute("hostUser", userResp.getAttr("user"));
            model.addAttribute("isClearUserPage", true);
            model.addAttribute("dashboard_model", "photo");
        }
        return getViewPage(userResp, "/album/album_dashboard");
    }

    /**
     * 用户照片标签
     *
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = "/p/tag/{name}")
    public String photo_tag(@PathVariable String name, @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid, Model model, IRequest iRequest) {
        if (Utils.isEmpty(name)) {
            return PAGE_PARAM_ERROR;
        }
        if (IdUtil.containValue(uid)) {
            IResponse userResp = userService.findUser(new User(uid), iRequest.putAttr("strict", false));
            if (userResp.isSuccess()) {
                model.addAttribute("hostUser", userResp.getAttr("user"));
            }
        }
        model.addAttribute("clear_model", "tag");
        model.addAttribute("photo_tag", name);
        model.addAttribute("dashboard_model", "photo");
        return "/album/album_dashboard";
    }

    /**
     * 用户照片合集topic
     *
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = {"/p/topic/{id}", "/p/topic/{id}/{name}"})
    public String photo_topic(@PathVariable @PrimaryKeyConvert Long id,
                              @PathVariable(required = false) String name,
                              @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid,
                              Model model, IRequest iRequest) {
        if (!IdUtil.containValue(id) && Utils.isEmpty(name)) {
            return PAGE_PARAM_ERROR;
        }
        PhotoTagWrapper topic = new PhotoTagWrapper(id);
        if (!IdUtil.containValue(id)) {
            topic.setName(name);
        }
        topic.setTopic(1);
        topic.setUid(uid);
        topic.setType(TagWrapperType.MARK.value);
        IResponse topicResponse = albumService.findPhotoTagWrapper(topic, iRequest);
        if (topicResponse.isSuccess()) {
            PhotoTagWrapper dbTopic = topicResponse.getAttr("tagWrapper");
            // 没设置topic-id或者topic-name填写错误时重定向
            if (!IdUtil.containValue(id) || (Utils.isNotEmpty(name) && !name.equals(dbTopic.getName()))) {
                return "redirect:/p/topic/" + IdUtil.convertToShortPrimaryKey(dbTopic.getPtwid()) + "/" + Utils.encodeURL(dbTopic.getName()) + appendQueryString(iRequest.getQueryString());
            }
            model.addAttribute("clear_model", "topic");
            model.addAttribute("photo_topic", dbTopic);
        }
        return getViewPage(topicResponse, "/album/album_dashboard");
    }

    /**
     * 打开标签包装管理页面
     *
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = "/p/tags_wrappers")
    public String tagsWrappers(@PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid, Model model, IRequest iRequest) {
        if (iRequest.isHasLoggedIn()) {
            User loginUser = iRequest.getLoginUser();
            if (!IdUtil.containValue(uid)) {
                return "redirect:/p/tags_wrappers?uid=" + loginUser.getUid() + appendQueryString(iRequest.getQueryString());
            } else if (loginUser.getUid().equals(uid)) {
                model.addAttribute("hostUser", loginUser);
                return "/album/photo_tag_wrappers";
            } else {
                return PAGE_FORBIDDEN_ERROR;
            }
        } else {
            return PAGE_LOGIN;
        }
    }

    /**
     * 打开用户的主题列表页面
     *
     * @param uid
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = {"/u/topics", "/u/{uid}/topics"})
    public String userTopics(@PathVariable(required = false) @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid, Model model, IRequest iRequest) {
        if (!IdUtil.containValue(uid)) {
            if (iRequest.isHasNotLoggedIn())
                return PAGE_LOGIN;
            else
                return "redirect:/u/" + iRequest.getLoginUser().getUid() + "/topics" + appendQueryString(iRequest.getQueryString());
        }
        User queryUser = new User(uid);
        IResponse userResp = userService.findUser(queryUser, iRequest);
        if (userResp.isSuccess()) {
            model.addAttribute("hostUser", userResp.getAttr("user"));
            model.addAttribute("clear_model", "topics");
        }
        return getViewPage(userResp, "/album/photo_tag_wrappers");
    }

    /**
     * 打开用户喜欢的照片列表
     *
     * @param uid
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = {"/u/likes/photos", "/u/{uid}/likes/photos"})
    public String userLikePhotoList(@PathVariable(required = false) @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid, @PrimaryKeyConvert Long album_id, Model model, IRequest iRequest) {
        if (!IdUtil.containValue(uid)) {
            if (iRequest.isHasNotLoggedIn())
                return PAGE_LOGIN;
            else
                return "redirect:/u/" + iRequest.getLoginUser().getUid() + "/likes/photos" + appendQueryString(iRequest.getQueryString());
        }
        User queryUser = new User(uid);
        IResponse userResp = userService.findUser(queryUser, iRequest);
        if (userResp.isSuccess()) {
            if (iRequest.isHasLoggedIn() && iRequest.getLoginUser().getUid().equals(uid)) {
                model.addAttribute("hostUser", userResp.getAttr("user"));
                model.addAttribute("isClearUserPage", true);
                model.addAttribute("clear_model", "likes");
                model.addAttribute("dashboard_model", "photo");
            } else {
                userResp.setStatus(STATUS_FORBIDDEN);
            }
        }
        return getViewPage(userResp, "/album/album_dashboard");
    }

    /**
     * 打开用户历史访问的照片列表
     *
     * @param uid
     * @param model
     * @param iRequest
     * @return
     */
    @RequestMapping(value = {"/u/history/photos", "/u/{uid}/history/photos"})
    public String userAccessHistoryPhotoList(@PathVariable(required = false) @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid, @PrimaryKeyConvert Long album_id, Model model, IRequest iRequest) {
        if (!IdUtil.containValue(uid)) {
            if (iRequest.isHasNotLoggedIn())
                return PAGE_LOGIN;
            else
                return "redirect:/u/" + iRequest.getLoginUser().getUid() + "/history/photos" + appendQueryString(iRequest.getQueryString());
        }
        User queryUser = new User(uid);
        IResponse userResp = userService.findUser(queryUser, iRequest);
        if (userResp.isSuccess()) {
            if (iRequest.isHasLoggedIn() && iRequest.getLoginUser().getUid().equals(uid)) {
                model.addAttribute("hostUser", userResp.getAttr("user"));
                model.addAttribute("isClearUserPage", true);
                model.addAttribute("clear_model", "history");
                model.addAttribute("dashboard_model", "photo");
            } else {
                userResp.setStatus(STATUS_FORBIDDEN);
            }
        }
        return getViewPage(userResp, "/album/album_dashboard");
    }

}
