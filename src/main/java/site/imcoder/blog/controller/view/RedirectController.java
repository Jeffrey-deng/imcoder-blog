package site.imcoder.blog.controller.view;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import javax.annotation.Resource;
import java.util.List;

/**
 * 重定向控制器
 *
 * @author Jeffrey.Deng
 * @date 2017-05-07
 */
@Controller
@RequestMapping("/redirect")
public class RedirectController extends BaseController {

    @Resource
    private IAlbumService albumService;

    @RequestMapping(params = {"model=album", "photo_id"})
    public String findAlbumOfPhoto(@PrimaryKeyConvert Long photo_id, IRequest iRequest) {
        if (IdUtil.containValue(photo_id)) {
            IResponse photoResp = albumService.findPhoto(new Photo(photo_id), iRequest);
            return getViewPage(photoResp, "redirect:/p/album/"
                    + IdUtil.convertToShortPrimaryKey(((Photo) photoResp.getAttr("photo")).getAlbum_id()) +
                    "?check=" + IdUtil.convertToShortPrimaryKey(photo_id));
        } else {
            return PAGE_NOT_FOUND_ERROR;
        }
    }

    @RequestMapping(params = {"model=photo_tag", "tags", "casting"})
    public String castingForPhotoTag(
            String tags,
            @RequestParam(defaultValue = "0") @PrimaryKeyConvert(supportLongParse = true, printShort = false) Long uid,
            @RequestParam(defaultValue = "0") @PrimaryKeyConvert Long album_id,
            @RequestParam(defaultValue = "up") String casting,
            Model model, IRequest iRequest) {
        String page = null;
        if (Utils.isNotEmpty(tags) && !tags.equals("<>")) {
            // 查询参数处理
            tags = tags.replaceAll("(^<)|(>$)", "");
            User loginUser = iRequest.getLoginUser();
            PhotoTagWrapper tagWrapper = new PhotoTagWrapper();
            if (uid > 0) {
                tagWrapper.setUid(uid);
            } else if (album_id > 0) {
                Album album = new Album();
                album.setAlbum_id(album_id);
                IResponse albumResp = albumService.findAlbumInfo(album, iRequest);
                if (albumResp.isSuccess()) {
                    uid = ((Album) albumResp.getAttr("album")).getUser().getUid();
                    tagWrapper.setUid(uid);
                } else if (albumResp.equalsStatus(STATUS_NOT_LOGIN)) {
                    return setNotFoundInfo(model, "相册不存在~");
                } else {
                    return getErrorPage(albumResp.getStatus());
                }
            } else if (loginUser != null) { // 没有指定用户id时查询登录用户自己的
                tagWrapper.setUid(loginUser.getUid());
            } else {    // 没有指定用户id时, 又没有登录则不能查询，因为此时父类可能有多个，无法知道确切是哪一个
                return PAGE_LOGIN;
            }
            tagWrapper.setType(TagWrapperType.SEARCH.value);
            // 查询tagWrapper
            if (casting.equals("up")) { // 向上转型
                IResponse tagWrappersResp = albumService.findPhotoTagWrapperList(tagWrapper, iRequest);
                if (tagWrappersResp.isSuccess()) {
                    List<PhotoTagWrapper> wrappers = tagWrappersResp.getAttr("tagWrappers");
                    PhotoTagWrapper matchWrapper = null;
                    if (wrappers.size() != 0) {
                        for (PhotoTagWrapper wrapper : wrappers) {
                            try {
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
                                    case 5: // 多重包含，这里向上查找匹配一个就算查找到了
                                        String[] splitPatterns = pattern.split("(\\s*&&\\s*)|\\s+");
                                        for (String splitPattern : splitPatterns) {
                                            if (tags.matches(splitPattern)) {
                                                matchWrapper = wrapper;
                                                break;
                                            }
                                        }
                                        break;
                                    default:
                                        continue;
                                }
                                if (matchWrapper != null) {
                                    break;
                                }
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        }
                    }
                    if (matchWrapper != null) {
                        page = "redirect:/photo/tags_square?"
                                + iRequest.getQueryString().replaceAll("&?extend=[^&#]*", "")
                                .replace("model=photo_tag", "")
                                .replaceFirst("tags=[^&#]*", "tags=" + Utils.encodeURL(matchWrapper.getName()) + "&extend=true")
                                .replace("&casting=up", "") +
                                // 当父类有作用域时添加
                                ((album_id == 0 && IdUtil.containValue(matchWrapper.getScope())) ? ("&album_id=" + IdUtil.convertToShortPrimaryKey(matchWrapper.getScope()) + "&from=album_detail") : "") +
                                "&filter=" + Utils.encodeURL(matchWrapper.getName());
                        if (matchWrapper.getMatch_mode() == 5) {
                            page = page.replaceFirst("tags=[^&#]*&extend=true", "");
                        }
                    } else {
                        page = setNotFoundInfo(model, "没有找到" + (uid > 0 ? ("用户" + uid) : "你") + "设置的该标签的父标签~");
                    }
                } else {
                    page = PAGE_SERVER_ERROR;
                }
            } else if (casting.equals("down")) {    // 向下转型
                tagWrapper.setName(tags);
                IResponse tagWrappersResp = albumService.findPhotoTagWrapperList(tagWrapper, iRequest);
                if (tagWrappersResp.isFail()) {
                    page = PAGE_SERVER_ERROR;
                } else {
                    List<PhotoTagWrapper> wrappers = tagWrappersResp.getAttr("tagWrappers");
                    String albumIndex = "";
                    if (album_id == 0 && wrappers.size() > 0) {
                        Long scope = wrappers.get(0).getScope(); // 所有匹配都有作用域且作用域都为同一值时，添加相册id
                        if (scope != null && scope > 0) {
                            for (PhotoTagWrapper wrapper : wrappers) {
                                if (!wrapper.getScope().equals(scope)) {
                                    albumIndex = "";
                                    break;
                                } else {
                                    albumIndex = "&album_id=" + IdUtil.convertToShortPrimaryKey(wrapper.getScope()) + "&from=album_detail";
                                }
                            }
                        }
                    }
                    page = "redirect:/photo/tags_square?"
                            + iRequest.getQueryString().replaceAll("&?extend=[^&#]*", "")
                            .replace("model=photo_tag", "")
                            .replaceFirst("&casting=[^&#]*", "") +
                            albumIndex +
                            (wrappers.size() > 0 ? "&extend=true" : "&extend=false") +
                            "&filter=" + Utils.encodeURL(tags);
                }
            } else {
                page = PAGE_PARAM_ERROR;
            }
        } else {
            page = setNotFoundInfo(model, "标签不能为空~");
        }
        return page;
    }

}
