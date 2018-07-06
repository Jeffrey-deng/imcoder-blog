package com.blog.controller;

import com.blog.Interceptor.LoginRequired;
import com.blog.entity.Album;
import com.blog.entity.Photo;
import com.blog.entity.User;
import com.blog.service.IAlbumService;
import com.blog.service.IUserService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.RedirectView;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
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
public class PhotoController {

    @Resource
    private IAlbumService albumService;

    @Resource
    private IUserService userService;

    @RequestMapping()
    public ModelAndView defaultHandle() {
        RedirectView redirectView = new RedirectView("photo.do?method=dashboard&mode=photo", true);
        redirectView.setStatusCode(HttpStatus.MOVED_PERMANENTLY);
        return new ModelAndView(redirectView);
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
        int flag = (Integer) map.get("flag");
        if (flag == 200) {
            map.put("info", "相册创建成功！");
        } else {
            convertAlbumStatusCodeToWord(map, "flag", "info");
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
        int flag = (int) map.get("flag");
        if (flag == 200) {
            request.setAttribute("album", map.get("album"));
            return "/album/album_detail";
        } else if (flag == 401) {
            request.setAttribute("http_code", 403);
            return "/site/login";
        } else if (flag == 403) {
            return "/error/403";
        } else if (flag == 404) {
            return "/error/404";
        } else {
            return "/error/400";
        }
    }

    /**
     * Ajax 打开相册详情
     *
     * @param id
     * @param session
     * @param request
     * @return Json
     */
    @RequestMapping(params = "method=albumByAjax")
    @ResponseBody
    public Map<String, Object> openAlbumByAjax(int id, @RequestParam(defaultValue = "true") boolean photos, HttpSession session, HttpServletRequest request) {
        Album album = new Album();
        album.setAlbum_id(id);
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = null;
        if (photos) {
            map = albumService.findAlbumWithPhotos(album, loginUser);
        } else {
            map = albumService.findAlbumInfo(album, loginUser);
        }
        int flag = (int) map.get("flag");
        if (flag == 200) {
            map.put("info", "查找成功！");
        } else {
            convertAlbumStatusCodeToWord(map, "flag", "info");
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
                return "/site/login";
            else
                return "redirect:/photo.do?method=user_albums&uid=" + loginUser.getUid();
        }

        User hostUser = new User();
        hostUser.setUid(uid);
        hostUser = userService.findUser(hostUser, loginUser);
        if (hostUser == null) {
            return "/error/404";
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
        map.put("flag", 200);
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
        map.put("flag", flag);
        if (flag == 200) {
            map.put("info", "更新相册成功！");
        } else {
            convertAlbumStatusCodeToWord(map, "flag", "info");
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
     *      flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 相册ID不存在，500：服务器错误
     *      photo - photo对象
     */
    @LoginRequired
    @RequestMapping(params = "method=upload")
    @ResponseBody
    public Map<String, Object> uploadPhoto(@RequestParam(value = "file", required = false) MultipartFile file, Photo photo, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = albumService.savePhoto(file, photo, loginUser);
        int flag = (Integer) map.get("flag");
        if (flag == 200) {
            map.put("info", "照片保存成功！");
        } else {
            convertAlbumStatusCodeToWord(map, "flag", "info");
        }
        return map;
    }

    /**
     * 照片详情
     * @param id
     * @param request
     * @param session
     * @return map
     *          flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到
     *           photo - photo对象
     */
    @RequestMapping(params = "method=detailByAjax")
    @ResponseBody
    public Map<String, Object> photoDetailByAjax(int id, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Photo photo = new Photo();
        photo.setPhoto_id(id);
        Map<String, Object> map = albumService.findPhoto(photo, loginUser);
        int flag = (int) map.get("flag");
        if (flag == 200) {
            map.put("info", "查找成功！");
        } else {
            convertPhotoStatusCodeToWord(map, "flag", "info");
        }
        return map;
    }

    /**
     * 查找照片集合
     * @param photo
     * @param logic_conn
     * @param query_start
     * @param query_size
     * @param request
     * @param session
     * @return
     */
    @RequestMapping(params = "method=photoListByAjax")
    @ResponseBody
    public Map<String, Object> photoListByAjax(
            Photo photo,
            @RequestParam(defaultValue = "and") String logic_conn,
            @RequestParam(defaultValue = "0") int query_start,
            @RequestParam(defaultValue = "500") int query_size,
            HttpServletRequest request,
            HttpSession session
    ) {
        Map<String, Object> map = new HashMap<>();
        User loginUser = (User) session.getAttribute("loginUser");
        List<Photo> photos = albumService.findPhotoList(photo, logic_conn, query_start, query_size, loginUser);
        map.put("photos", photos);
        map.put("flag", 200);
        return map;
    }

    /**
     * 照片更新
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
    public Map<String, Object> updatePhoto(Photo photo, HttpServletRequest request, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = albumService.updatePhoto(photo, loginUser);
        map.put("flag", flag);
        if (flag == 200) {
            map.put("info", "更新成功！");
        } else {
            convertPhotoStatusCodeToWord(map, "flag", "info");
        }
        return map;
    }

    /**
     * 照片删除
     * @param photo
     * @param request
     * @param session
     * @return map
     *      flag - 200：成功，400: 参数错误，401：需要登录，403：没有权限，404: 照片未找到，500：服务器错误
     *      info - 详细信息
     */
    @LoginRequired
    @RequestMapping(params = "method=delete")
    @ResponseBody
    public Map<String, Object> deletePhoto(Photo photo, @RequestParam(defaultValue = "true") boolean deleteFromDisk, HttpServletRequest request, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = albumService.deletePhoto(photo, loginUser, deleteFromDisk);
        map.put("flag", flag);
        if (flag == 200) {
            map.put("info", "删除成功！");
        } else {
            convertPhotoStatusCodeToWord(map, "flag", "info");
        }
        return map;
    }

    /**
     * 打开dashboard
     * @param mode photo、album
     * @param session
     * @param request
     * @return
     */
    @RequestMapping(params = "method=dashboard")
    public String albumList(@RequestParam(defaultValue = "photo") String mode, HttpSession session, HttpServletRequest request) {
        if (mode.equalsIgnoreCase("photo")) {
            request.setAttribute("dashboard_mode", "photo");
        } else if (mode.equalsIgnoreCase("album")) {
            request.setAttribute("dashboard_mode", "album");
        } else {
            return "redirect:/photo.do?method=dashboard&mode=photo";
        }
        return "/album/album_dashboard";
    }

    /**
     * 打开标签广场
     * @param session
     * @param request
     * @return
     */
    @RequestMapping(params = "method=tags_square")
    public String tagsSquare(HttpSession session, HttpServletRequest request) {
        return "/album/album_tags_square";
    }

    private void convertPhotoStatusCodeToWord(Map<String, Object> map, String codeKey, String wordKey) {
        int flag = (Integer) map.get(codeKey);
        if (flag == 400) {
            map.put(wordKey, "参数错误");
        } else if (flag == 401) {
            map.put(wordKey, "需要登录");
        } else if (flag == 403) {
            map.put(wordKey, "没有权限");
        } else if (flag == 404) {
            map.put(wordKey, "照片ID不存在");
        } else {
            map.put(wordKey, "服务器错误");
        }
    }

    private void convertAlbumStatusCodeToWord(Map<String, Object> map, String codeKey, String wordKey) {
        this.convertPhotoStatusCodeToWord(map, codeKey, wordKey);
        int flag = (Integer) map.get(codeKey);
        if (flag == 404) {
            map.put(wordKey, "相册ID不存在");
        }
    }
}
