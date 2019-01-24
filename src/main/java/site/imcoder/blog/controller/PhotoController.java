package site.imcoder.blog.controller;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.RedirectView;
import site.imcoder.blog.Interceptor.GZIP;
import site.imcoder.blog.Interceptor.LoginRequired;
import site.imcoder.blog.entity.Album;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.PhotoTagWrapper;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.IAlbumService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * description: 相册控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/photo.do")
public class PhotoController extends BaseController {

    private static String MOUNT_PREFIX = "mount@";

    private static Comparator<Photo> ALBUM_PHOTO_COMPARATOR = new Comparator<Photo>() {
        @Override
        public int compare(Photo b, Photo n) {
            return b.getPhoto_id() - n.getPhoto_id();
        }
    };

    @Resource
    private IAlbumService albumService;

    @Resource
    private IUserService userService;

    @RequestMapping()
    public ModelAndView defaultHandle(HttpServletRequest request) {
        String queryString = request.getQueryString();
        ModelAndView mv = new ModelAndView();
        if (queryString == null || queryString.length() == 0) {
            RedirectView redirectView = new RedirectView("photo.do?method=dashboard&model=photo", true);
            redirectView.setStatusCode(HttpStatus.MOVED_PERMANENTLY);
            mv.setView(redirectView);
        } else {
            mv.setViewName(PAGE_NOT_FOUND_ERROR);
        }
        return mv;
    }

    /**
     * 创建新相册
     *
     * @param album
     * @param session
     * @param request
     * @return
     */
    @LoginRequired
    @RequestMapping(params = "method=createAlbum")
    @ResponseBody
    public Map<String, Object> createAlbum(Album album, HttpSession session, HttpServletRequest request) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = albumService.createAlbum(album, loginUser);
        int flag = (Integer) map.get(KEY_STATUS);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "相册创建成功！");
        } else {
            convertAlbumStatusCodeToWord(map);
        }
        return map;
    }

    /**
     * 打开相册详情
     *
     * @param id
     * @param session
     * @param request
     * @return
     */
    @RequestMapping(params = "method=album_detail")
    public String openAlbum(int id, HttpSession session, HttpServletRequest request) {
        Album album = new Album();
        album.setAlbum_id(id);
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = albumService.findAlbumInfo(album, loginUser);
        int flag = (int) map.get(KEY_STATUS);
        if (flag == 200) {
            request.setAttribute("album", map.get("album"));
            return "/album/album_detail";
        } else if (flag == 401) {
            request.setAttribute("http_code", 403);
            return PAGE_LOGIN;
        } else if (flag == 403) {
            return PAGE_FORBIDDEN_ERROR;
        } else if (flag == 404) {
            return PAGE_NOT_FOUND_ERROR;
        } else {
            return PAGE_PARAM_ERROR;
        }
    }

    /**
     * Ajax 打开相册详情
     *
     * @param id      相册ID
     * @param photos  是否加载照片列表
     * @param mount   是否加载挂载到本相册的照片
     * @param session
     * @param request
     * @return
     */
    @RequestMapping(params = "method=albumByAjax")
    @ResponseBody
    @GZIP
    public Map<String, Object> openAlbumByAjax(int id, @RequestParam(defaultValue = "true") boolean photos, @RequestParam(defaultValue = "false") boolean mount, HttpSession session, HttpServletRequest request) {
        Album album = new Album();
        album.setAlbum_id(id);
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = null;
        if (photos) {
            map = albumService.findAlbumWithPhotos(album, mount, loginUser);
        } else {
            map = albumService.findAlbumInfo(album, loginUser);
        }
        int flag = (int) map.get(KEY_STATUS);
        if (flag == 200) {
            Album db_album = (Album) map.get("album");
            map.put(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, Config.getChild(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, "@user_", db_album.getUser().getUid() + "", ":"));
            map.put(KEY_STATUS_FRIENDLY, "查找成功！");
        } else {
            convertAlbumStatusCodeToWord(map);
        }
        return map;
    }

    /**
     * 打开相册列表
     *
     * @param uid
     * @param session
     * @param request
     * @return
     */
    @RequestMapping(params = "method=user_albums")
    public String userAlbumList(@RequestParam(defaultValue = "0") int uid, HttpSession session, HttpServletRequest request) {
        User loginUser = (User) session.getAttribute("loginUser");

        if (uid == 0) {
            if (loginUser == null)
                return PAGE_LOGIN;
            else
                return "redirect:/photo.do?method=user_albums&uid=" + loginUser.getUid();
        }

        User hostUser = new User();
        hostUser.setUid(uid);
        hostUser = userService.findUser(hostUser, loginUser);
        if (hostUser == null) {
            return PAGE_NOT_FOUND_ERROR;
        } else {
            request.setAttribute("hostUser", hostUser);
            return "/album/album_list";
        }
    }

    /**
     * Ajax 打开相册列表
     *
     * @param album
     * @param session
     * @param request
     * @return albums
     */
    @RequestMapping(params = "method=albumListByAjax")
    @ResponseBody
    public Map<String, Object> albumListByAjax(Album album, HttpSession session, HttpServletRequest request) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = new HashMap<>();
        List<Album> albumList = albumService.findAlbumList(album, loginUser);
        map.put("albums", albumList);
        if (albumList != null) {
            String cloud_photo_preview_args = null;
            if (album != null && album.getUser() != null && album.getUser().getUid() > 0) {
                cloud_photo_preview_args = Config.getChild(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, "@user_", album.getUser().getUid() + "", ":");
            } else {
                cloud_photo_preview_args = Config.getChildDefault(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, "@user_");
            }
            map.put(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, cloud_photo_preview_args);
            map.put(KEY_STATUS, 200);
        } else {
            map.put(KEY_STATUS, 400);
        }
        convertStatusCodeToWord(map);
        return map;
    }

    /**
     * 相册信息更新
     *
     * @param album
     * @param request
     * @param session
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到，500：服务器错误
     */
    @LoginRequired
    @RequestMapping(params = "method=updateAlbum")
    @ResponseBody
    public Map<String, Object> updateAlbum(Album album, HttpServletRequest request, HttpSession session) {
        Map<String, Object> map = new HashMap<>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = albumService.updateAlbum(album, loginUser);
        map.put(KEY_STATUS, flag);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "更新相册成功！");
        } else {
            convertAlbumStatusCodeToWord(map);
        }
        return map;
    }

    /**
     * 删除相册
     *
     * @param album
     * @param request
     * @param session
     * @return flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID未找到，500：服务器错误
     */
    @LoginRequired
    @RequestMapping(params = "method=deleteAlbum")
    @ResponseBody
    public Map<String, Object> deleteAlbum(Album album, Boolean deleteFromDisk, HttpServletRequest request, HttpSession session) {
        Map<String, Object> map = new HashMap<>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = albumService.deleteAlbum(album, loginUser, deleteFromDisk);
        map.put(KEY_STATUS, flag);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "删除相册相册成功！");
        } else {
            convertAlbumStatusCodeToWord(map);
        }
        return map;
    }

    /**
     * 上传照片
     *
     * @param file
     * @param photo
     * @param request
     * @param session
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID不存在，500：服务器错误
     * photo - photo对象
     */
    @LoginRequired
    @RequestMapping(params = "method=upload")
    @ResponseBody
    public Map<String, Object> uploadPhoto(@RequestParam(value = "file") MultipartFile file, Photo photo, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = albumService.savePhoto(file, photo, loginUser);
        int flag = (Integer) map.get(KEY_STATUS);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "照片保存成功！");
        } else {
            convertAlbumStatusCodeToWord(map);
        }
        return map;
    }

    /**
     * 照片详情
     *
     * @param id
     * @param request
     * @param session
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到
     * photo - photo对象
     */
    @RequestMapping(params = "method=detailByAjax")
    @ResponseBody
    public Map<String, Object> photoDetailByAjax(int id, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Photo photo = new Photo();
        photo.setPhoto_id(id);
        Map<String, Object> map = albumService.findPhoto(photo, loginUser);
        int flag = (int) map.get(KEY_STATUS);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "查找成功！");
        } else {
            convertPhotoStatusCodeToWord(map);
        }
        return map;
    }

    /**
     * 查找照片集合
     *
     * @param photo
     * @param logic_conn
     * @param query_start
     * @param query_size
     * @param base  数据查询的特殊基准
     * @param from  实际的执行js请求的页面
     * @param extend    查询的标签是否将其展开查询
     * @param session
     * @return
     */
    @RequestMapping(params = "method=photoListByAjax")
    @ResponseBody
    @GZIP
    public Map<String, Object> photoListByAjax(
            Photo photo,
            @RequestParam(defaultValue = "and") String logic_conn,
            @RequestParam(defaultValue = "0") int query_start,
            @RequestParam(defaultValue = "500") int query_size,
            String base,    // 数据查询的特殊基准
            String from,    // 实际的执行js请求的页面
            @RequestParam(defaultValue = "false") boolean extend,
            HttpSession session
    ) {
        Map<String, Object> map = new HashMap<>();
        User loginUser = (User) session.getAttribute("loginUser");
        List<Photo> photos = albumService.findPhotoList(base, photo, logic_conn, query_start, query_size, loginUser, extend);
        map.put("photos", photos);
        if (photos != null) {
            if (extend && from != null && from.equals("album_tags_square")) {   // 来自标签广场的请求且extend=true的话，返回用户的标签设置
                PhotoTagWrapper queryTagWrapper = null;
                if (photo != null && photo.getUid() > 0) {
                    queryTagWrapper = new PhotoTagWrapper();
                    queryTagWrapper.setUid(photo.getUid());
                }
                List<PhotoTagWrapper> photoTagWrappers = albumService.findPhotoTagWrappers(queryTagWrapper, loginUser);
                map.put("tag_wrappers", photoTagWrappers);
            }
            String cloud_photo_preview_args = null;
            if (photo != null && photo.getUid() > 0) {
                cloud_photo_preview_args = Config.getChild(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, "@user_", photo.getUid() + "", ":");
            } else {
                cloud_photo_preview_args = Config.getChildDefault(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, "@user_");
            }
            map.put(ConfigConstants.CLOUD_PHOTO_PREVIEW_ARGS, cloud_photo_preview_args);
            map.put(KEY_STATUS, 200);
        } else {
            map.put(KEY_STATUS, 400);
        }
        convertStatusCodeToWord(map);
        return map;
    }

    /**
     * 照片更新
     *
     * @param photo
     * @param request
     * @param session
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到，500：服务器错误
     * info - 详细信息
     */
    @LoginRequired
    @RequestMapping(params = "method=update")
    @ResponseBody
    public Map<String, Object> updatePhoto(Photo photo, @RequestParam(value = "file", required = false) MultipartFile file, HttpServletRequest request, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = albumService.updatePhoto(photo, file, loginUser);
        map.put(KEY_STATUS, flag);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "更新成功！");
        } else {
            convertPhotoStatusCodeToWord(map);
        }
        return map;
    }

    /**
     * 照片删除
     *
     * @param photo
     * @param request
     * @param session
     * @return map
     * flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到，500：服务器错误
     * info - 详细信息
     */
    @LoginRequired
    @RequestMapping(params = "method=delete")
    @ResponseBody
    public Map<String, Object> deletePhoto(Photo photo, @RequestParam(defaultValue = "true") boolean deleteFromDisk, HttpServletRequest request, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = albumService.deletePhoto(photo, loginUser, deleteFromDisk);
        map.put(KEY_STATUS, flag);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "删除成功！");
        } else {
            convertPhotoStatusCodeToWord(map);
        }
        return map;
    }

    /**
     * 打开dashboard
     *
     * @param model   photo、album
     * @param session
     * @param request
     * @return
     */
    @RequestMapping(params = "method=dashboard")
    public String albumList(@RequestParam(defaultValue = "photo") String model, HttpSession session, HttpServletRequest request) {
        if (model.equalsIgnoreCase("photo")) {
            request.setAttribute("dashboard_model", "photo");
        } else if (model.equalsIgnoreCase("album")) {
            request.setAttribute("dashboard_model", "album");
        } else {
            return "redirect:/photo.do?method=dashboard&model=photo";
        }
        return "/album/album_dashboard";
    }

    /**
     * 打开标签广场
     *
     * @param session
     * @param request
     * @return
     */
    @RequestMapping(params = "method=tags_square")
    public String tagsSquare(HttpSession session, HttpServletRequest request) {
        return "/album/album_tags_square";
    }

    /**
     * 查找用户特殊配置标签
     *
     * @param tagWrapper
     * @param session
     * @return
     */
    @RequestMapping(params = "method=getTagWrappers")
    @ResponseBody
    public Map<String, Object> getTagWrappers(PhotoTagWrapper tagWrapper, HttpSession session) {
        Map<String, Object> map = new HashMap<>();
        User loginUser = getLoginUser(session);
        List<PhotoTagWrapper> wrappers = albumService.findPhotoTagWrappers(tagWrapper, loginUser);
        map.put("tag_wrappers", wrappers);
        if (wrappers != null) {
            map.put(KEY_STATUS, 200);
        } else {
            map.put(KEY_STATUS, 400);
        }
        convertStatusCodeToWord(map);
        return map;
    }

    protected void convertPhotoStatusCodeToWord(Map<String, Object> map) {
        super.convertStatusCodeToWord(map, KEY_STATUS, KEY_STATUS_FRIENDLY);
        int flag = (Integer) map.get(KEY_STATUS);
        if (flag == 404) {
            map.put(KEY_STATUS_FRIENDLY, "照片ID不存在");
        }
    }

    protected void convertAlbumStatusCodeToWord(Map<String, Object> map) {
        super.convertStatusCodeToWord(map, KEY_STATUS, KEY_STATUS_FRIENDLY);
        int flag = (Integer) map.get(KEY_STATUS);
        if (flag == 404) {
            map.put(KEY_STATUS_FRIENDLY, "相册ID不存在");
        }
    }

}
