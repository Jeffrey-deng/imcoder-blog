package site.imcoder.blog.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.entity.Album;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.PhotoTagWrapper;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.IAlbumService;
import site.imcoder.blog.service.IUserService;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

/**
 * Created by Jeffrey.Deng on 2018/5/7.
 * 重定向控制器
 */
@Controller
@RequestMapping("/redirect.do")
public class RedirectController extends BaseController {

    @Resource
    private IAlbumService albumService;

    @Resource
    private IUserService userService;

    @RequestMapping(params = {"model=album", "photo_id"})
    public String findAlbumOfPhoto(int photo_id, HttpSession session) {
        if (photo_id > 0) {
            User loginUser = (User) session.getAttribute("loginUser");
            Photo photo = new Photo();
            photo.setPhoto_id(photo_id);
            Map<String, Object> map = albumService.findPhoto(photo, loginUser);
            int flag = (int) map.get(KEY_STATUS);
            if (flag == 200) {
                return "redirect:/photo.do?method=album_detail&id=" + ((Photo) map.get("photo")).getAlbum_id() + "&check=" + photo_id;
            } else if (flag == 401) {
                return PAGE_LOGIN;
            } else if (flag == 403) {
                return PAGE_FORBIDDEN_ERROR;
            } else {
                return PAGE_NOT_FOUND_ERROR;
            }
        } else {
            return PAGE_NOT_FOUND_ERROR;
        }
    }

    @RequestMapping(params = {"model=photo_tag", "tags", "casting"})
    public String castingForPhotoTag(
            String tags,
            @RequestParam(defaultValue = "0") int uid,
            @RequestParam(defaultValue = "0") int album_id,
            @RequestParam(defaultValue = "up") String casting,
            HttpServletRequest request,
            HttpSession session) {
        String page = null;
        if (Utils.isNotEmpty(tags)) {
            User loginUser = getLoginUser(session);
            PhotoTagWrapper tagWrapper = new PhotoTagWrapper();
            if (uid > 0) {
                tagWrapper.setUid(uid);
            } else if (album_id > 0) {
                Album album = new Album();
                album.setAlbum_id(album_id);
                Map<String, Object> albumInfo = albumService.findAlbumInfo(album, loginUser);
                int flag = (int) (albumInfo.get(KEY_STATUS));
                if (flag == 200) {
                    uid = ((Album) albumInfo.get("album")).getUser().getUid();
                    tagWrapper.setUid(uid);
                } else if (flag == 404) {
                    return setNotFoundInfo(request, "相册不存在~");
                } else {
                    return getErrorPage(flag);
                }
            } else if (loginUser != null) { // 没有指定用户id时查询登录用户自己的
                tagWrapper.setUid(loginUser.getUid());
            } else {    // 没有指定用户id时, 又没有登录则不能查询，因为此时父类可能有多个，无法知道确切是哪一个
                page = PAGE_LOGIN;
                return page;
            }
            if (casting.equals("up")) { // 向上转型
                List<PhotoTagWrapper> wrappers = albumService.findPhotoTagWrappers(tagWrapper, loginUser);
                if (wrappers != null) {
                    PhotoTagWrapper matchWrapper = null;
                    if (wrappers.size() != 0) {
                        for (PhotoTagWrapper wrapper : wrappers) {
                            String pattern = wrapper.getPattern();
                            switch (wrapper.getMatch_mode()) { // 匹配类型
                                case 0: // 全等
                                    if (pattern.equalsIgnoreCase(tags)) {
                                        matchWrapper = wrapper;
                                    }
                                    break;
                                case 1: // 前缀
                                    if (tags.indexOf(pattern) == 0) {
                                        matchWrapper = wrapper;
                                    }
                                    break;
                                case 2: // 后缀
                                    if (tags.indexOf(pattern) + pattern.length() == tags.length()) {
                                        matchWrapper = wrapper;
                                    }
                                    break;
                                case 3: // 正则
                                    if (tags.matches(pattern)) {
                                        matchWrapper = wrapper;
                                    }
                                    break;
                                case 4: // 包含
                                    if (tags.indexOf(pattern) != -1) {
                                        matchWrapper = wrapper;
                                    }
                                    break;
                                default:
                                    continue;
                            }
                            if (matchWrapper != null) {
                                break;
                            }
                        }
                    }
                    if (matchWrapper != null) {
                        page = "redirect:/photo.do?"
                                + request.getQueryString()
                                .replace("model=photo_tag", "method=tags_square")
                                .replaceFirst("tags=[^&]*", "tags=" + Utils.encoder(matchWrapper.getName()))
                                .replace("&casting=up", "") +
                                // 当父类有作用域时添加
                                ((album_id == 0 && matchWrapper.getScope() > 0) ? ("&album_id=" + matchWrapper.getScope() + "&from=album_detail") : "") +
                                "&extend=true&filter=" + Utils.encoder(matchWrapper.getName());
                    } else {
                        page = setNotFoundInfo(request, "没有找到" + (uid > 0 ? ("用户" + uid) : "你") + "设置的该标签的父标签~");
                    }
                } else {
                    page = PAGE_SERVER_ERROR;
                }
            } else if (casting.equals("down")) {    // 向下转型
                tagWrapper.setName(tags);
                List<PhotoTagWrapper> wrappers = albumService.findPhotoTagWrappers(tagWrapper, loginUser);
                if (wrappers == null) {
                    page = PAGE_SERVER_ERROR;
                } else {
                    String albumIndex = "";
                    if (album_id == 0 && wrappers.size() > 0) {
                        int scope = wrappers.get(0).getScope(); // 所有匹配都有作用域且作用域都为同一值时，添加相册id
                        if (scope > 0) {
                            for (PhotoTagWrapper wrapper : wrappers) {
                                if (wrapper.getScope() != scope) {
                                    albumIndex = "";
                                    break;
                                } else {
                                    albumIndex = "&album_id=" + wrapper.getScope() + "&from=album_detail";
                                }

                            }
                        }
                    }
                    page = "redirect:/photo.do?"
                            + request.getQueryString()
                            .replace("model=photo_tag", "method=tags_square")
                            .replaceFirst("&casting=[^&]*", "") +
                            albumIndex +
                            (wrappers.size() > 0 ? "&extend=true" : "&extend=false") +
                            "&filter=" + Utils.encoder(tags);
                }
            } else {
                page = PAGE_PARAM_ERROR;
            }
        } else {
            page = setNotFoundInfo(request, "标签不能为空~");
        }
        return page;
    }

}
