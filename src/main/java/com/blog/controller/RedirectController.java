package com.blog.controller;

import com.blog.entity.Photo;
import com.blog.entity.User;
import com.blog.service.IAlbumService;
import com.blog.service.IUserService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;
import java.util.Map;

/**
 * Created by Jeffrey.Deng on 2018/5/7.
 * 重定向控制器
 */
@Controller
@RequestMapping("/redirect.do")
public class RedirectController {

    @Resource
    private IAlbumService albumService;

    @Resource
    private IUserService userService;

    @RequestMapping(params = {"mode=photo", "photo_id"})
    public String findAlbumOfPhoto(int photo_id, HttpSession session) {
        if (photo_id > 0) {
            User loginUser = (User) session.getAttribute("loginUser");
            Photo photo = new Photo();
            photo.setPhoto_id(photo_id);
            Map<String, Object> map = albumService.findPhoto(photo, loginUser);
            int flag = (int) map.get("flag");
            if (flag == 200) {
                return "redirect:/photo.do?method=album_detail&id=" + ((Photo)map.get("photo")).getAlbum_id() + "&check=" + photo_id;
            } else if (flag == 401) {
                return "/site/login";
            } else if (flag == 403) {
                return "/error/403";
            } else {
                return "/error/404";
            }
        } else {
            return "/error/404";
        }
    }
}
