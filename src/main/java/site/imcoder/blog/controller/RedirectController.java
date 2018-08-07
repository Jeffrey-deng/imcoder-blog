package site.imcoder.blog.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.IAlbumService;
import site.imcoder.blog.service.IUserService;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;
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

}
