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
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.type.UserAuthType;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.service.IArticleService;
import site.imcoder.blog.service.IUserService;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * description: 用户控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("**/user.do")
public class UserController extends BaseController {

    //依赖注入[service]
    @Resource
    private IUserService userService;

    @Resource
    private IArticleService articleService;

    @RequestMapping()
    public ModelAndView defaultHandle(HttpServletRequest request, HttpSession session) {
        String queryString = request.getQueryString();
        User loginUser = getLoginUser(session);
        ModelAndView mv = new ModelAndView();
        if ((queryString == null || queryString.length() == 0) && loginUser != null) {
            RedirectView redirectView = new RedirectView("user.do?method=home&uid=" + loginUser.getUid(), true);
            redirectView.setStatusCode(HttpStatus.MOVED_PERMANENTLY);
            mv.setView(redirectView);
        } else {
            mv.setViewName(PAGE_NOT_FOUND_ERROR);
        }
        return mv;
    }

    /**
     * 注册
     *
     * @param user
     * @return flag - 200：成功，500: 失败
     */
    @RequestMapping(params = "method=register")
    @ResponseBody
    public Map<String, Object> register(User user, String username, String email, String password, HttpServletRequest request) {
        Map<String, Object> map = new HashMap<String, Object>();
        if (email == null) {
            email = user.getEmail();
        }
        UserStatus userStatus = new UserStatus();
        userStatus.setRegister_ip(Utils.getRemoteAddr(request));
        if (user == null) {
            user = new User();
        }
        user.setUserStatus(userStatus);
        List<UserAuth> userAuthList = new ArrayList<>();
        UserAuth usernameUserAuth = new UserAuth(null, UserAuthType.USERNAME, username, password);
        UserAuth emailUserAuth = new UserAuth(null, UserAuthType.EMAIL, email, password);
        userAuthList.add(usernameUserAuth);
        userAuthList.add(emailUserAuth);
        user.setUserAuths(userAuthList);
        map.put(KEY_STATUS, userService.register(user));
        convertStatusCodeToWord(map);
        return map;
    }

    /**
     * 跳转注册
     */
    @RequestMapping(params = "method=toregister")
    public String toregister() {
        return "/site/register";
    }

    /**
     * 查询文章列表(访问主人的主页)
     *
     * @param jumpPage  跳转页
     * @param condition 条件 article
     * @param session
     * @return 通过权限检查的列表
     */
    @RequestMapping(params = "method=home")
    public String list(
            @RequestParam(defaultValue = "5") int pageSize,
            @RequestParam(defaultValue = "1") int jumpPage,
            @RequestParam(defaultValue = "0") int uid,
            Article condition, HttpServletRequest request, HttpSession session) {
        // convert [uid] to [author.uid]
        if (uid > 0) {
            if (condition == null) {
                condition = new Article();
                condition.setAuthor(new User());
            } else if (condition != null && condition.getAuthor() == null) {
                condition.setAuthor(new User());
            }
            condition.getAuthor().setUid(uid);
        }

        User loginUser = (User) session.getAttribute("loginUser");
        User hostUser = userService.findUser(condition.getAuthor(), loginUser);
        if (hostUser != null) {
            Map<String, Object> map = articleService.list(pageSize, jumpPage, condition, loginUser);
            if (map != null) {
                request.setAttribute("articleList", map.get("articleList"));
                request.setAttribute("page", map.get("page"));
            }
            request.setAttribute("condition", condition);
            request.setAttribute("hostUser", hostUser);
            request.setAttribute("categoryCount", articleService.getCategoryCount());
            return "/user/user_home";
        } else {
            return setNotFoundInfo(request, "该用户不存在！请检查请求参数");
        }
    }

    /**
     * 转到用户 关注粉丝好友 信息页
     *
     * @param session
     * @return
     */
    @RequestMapping(params = "method=contact")
    public String contact(@RequestParam(defaultValue = "0") int query_uid, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (loginUser == null && query_uid == 0) {
            return PAGE_LOGIN;
        } else {
            return "/user/contacts";
        }
    }

    /**
     * 转到个人中心
     *
     * @param session
     * @return
     */
    @LoginRequired
    @RequestMapping(params = "method=profilecenter")
    @GZIP
    public String profilecenter(HttpSession session) {
        /* 登陆验证 */
        User loginUser = (User) session.getAttribute("loginUser");
        if (loginUser != null) {
            return "/user/profilecenter";
        } else {
            return PAGE_LOGIN;
        }
    }

    /**
     * 查询个人资料
     *
     * @param user
     * @param session
     * @return
     */
    @RequestMapping(params = "method=profile")
    @ResponseBody
    public User profile(User user, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (user != null && user.getUid() > 0) {
            //查询用户为当前用户也要查询数据库 因为如果用户更新了资料(直接通过数据库改的方式)就会不同步
            return userService.findUser(user, loginUser);
        } else {
            return loginUser;
        }
    }

    /**
     * 保存个人资料
     *
     * @param user
     * @param session
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=saveProfile")
    @ResponseBody
    public Map<String, Object> saveProfile(User user, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = new HashMap<String, Object>();
        if (loginUser != null) {
            user.setUid(loginUser.getUid());
            int flag = userService.saveProfile(user, loginUser);
            map.put(KEY_STATUS, flag);
            if (flag == 200) {
                //更新session中的loginUser
                session.setAttribute("loginUser", userService.findUser(user, loginUser, true));
            }
        } else {
            map.put(KEY_STATUS, 401);
        }
        convertStatusCodeToWord(map);
        return map;
    }

    /**
     * 更新头像
     *
     * @param imageFile       与headPhotoPath二选一
     * @param imageRawFile    头像的原图
     * @param head_photo_path 设置默认头像时传入链接，不需要传file了
     * @param session
     * @return flag - 200：成功，400: 图片为空，401：需要登录，403：无权限，404：无此用户，500: 失败
     * head_photo - 头像地址
     */
    @LoginRequired
    @RequestMapping(params = "method=updateHeadPhoto")
    @ResponseBody
    public Map<String, Object> updateUserHeadPhoto(MultipartFile imageFile, MultipartFile imageRawFile, String head_photo_path, HttpSession session) {
        User loginUser = getLoginUser(session);
        Map<String, Object> map = userService.saveHeadPhoto(imageFile, imageRawFile, head_photo_path, loginUser);
        int flag = (int) map.get(KEY_STATUS);
        if (flag == 200) {
            loginUser.setHead_photo((String) map.get("head_photo"));
        }
        convertStatusCodeToWord(map);
        return map;
    }

    /**
     * 取得用户设置
     *
     * @param user    不设置uid时默认为当前登陆用户，当uid与loginUser相同或loginUser为管理员时才返回
     * @param session
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * userSetting - 用户设置
     */
    @LoginRequired
    @RequestMapping(params = "method=getUserSetting")
    @ResponseBody
    public Map<String, Object> getUserSetting(User user, HttpSession session) {
        User loginUser = getLoginUser(session);
        Map<String, Object> map = userService.getUserSetting(user, loginUser);
        convertStatusCodeToWord(map);
        return map;
    }

    /**
     * 更新用户设置
     *
     * @param userSetting 要包含uid
     * @param session
     * @return flag - 200：成功，401：需要登录，403：无权限，404：无此用户，500: 失败
     * userSetting - 用户设置
     */
    @LoginRequired
    @RequestMapping(params = "method=updateUserSetting")
    @ResponseBody
    public Map<String, Object> updateUserSetting(UserSetting userSetting, HttpSession session) {
        User loginUser = getLoginUser(session);
        Map<String, Object> map = userService.updateUserSetting(userSetting, loginUser);
        convertStatusCodeToWord(map);
        return map;
    }


    /**
     * 检查是否loginUser关注了hostUser
     *
     * @param hostUser
     * @param session
     * @return flag - 200：已关注，401：需要登录，404：未关注
     */
    @LoginRequired
    @RequestMapping(params = "method=checkFollow")
    @ResponseBody
    public Map<String, Object> checkFollow(User hostUser, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = new HashMap<String, Object>();
        if (loginUser != null) {
            int flag = userService.checkFollow(hostUser, loginUser);
            map.put(KEY_STATUS, flag);
            if (flag == 200) {
                map.put(KEY_STATUS_FRIENDLY, "已关注");
            } else {
                map.put(KEY_STATUS_FRIENDLY, "未关注");
            }
        } else {
            map.put(KEY_STATUS, 401);
            map.put(KEY_STATUS_FRIENDLY, "未登录");
        }
        return map;
    }

    /**
     * 关注，相互关注则成为好友
     *
     * @param hostUser
     * @param session
     * @return flag - 200：关注成功，201：关注成功并成为好友，204：重复插入，401：需要登录，404：无此用户，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=follow")
    @ResponseBody
    public Map<String, Object> follow(User hostUser, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = new HashMap<String, Object>();
        int flag = userService.follow(hostUser, loginUser);
        map.put(KEY_STATUS, flag);
        convertStatusCodeToWord(map);
        if (flag == 201) {
            map.put(KEY_STATUS_FRIENDLY, "关注成功并成为好友");
        } else if (flag == 204) {
            map.put(KEY_STATUS_FRIENDLY, "重复关注");
        } else if (flag == 404) {
            map.put(KEY_STATUS_FRIENDLY, "无此用户");
        }
        return map;
    }

    /**
     * 取消关注
     *
     * @param hostUser
     * @param session
     * @return flag - 200：取消成功，201：取消成功并取消好友，401：需要登录，404：无此记录，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=unFollow")
    @ResponseBody
    public Map<String, Object> unFollow(User hostUser, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = new HashMap<String, Object>();
        int flag = userService.removeFollow(hostUser, loginUser);
        map.put(KEY_STATUS, flag);
        convertStatusCodeToWord(map);
        if (flag == 201) {
            map.put(KEY_STATUS_FRIENDLY, "取消关注成功并取消好友");
        }
        return map;
    }

    /**
     * 查询关注列表
     *
     * @param user    条件
     * @param session
     * @return followList
     */
    @RequestMapping(params = "method=listFollows")
    @ResponseBody
    public List<User> listFollows(User user, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (user != null) {
            List<User> followList = userService.findFollowList(user, loginUser);
            return followList;
        } else {
            return null;
        }
    }

    /**
     * 查询粉丝列表
     *
     * @param user    条件
     * @param session
     * @return fansList
     */
    @RequestMapping(params = "method=listFans")
    @ResponseBody
    public List<User> listFans(User user, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (user != null) {
            List<User> fansList = userService.findFansList(user, loginUser);
            return fansList;
        } else {
            return null;
        }
    }

    /**
     * 查询好友列表
     *
     * @param session
     * @return friendList
     */
    @LoginRequired(content = "")
    @RequestMapping(params = "method=listFriends")
    @ResponseBody
    public List<User> listFriends(HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (loginUser != null) {
            List<User> friendList = userService.findFriendList(loginUser);
            return friendList;
        } else {
            return null;
        }
    }

    /**
     * 检查是否loginUser收藏了此文章
     *
     * @param article
     * @param session
     * @return flag - 200：已收藏，401: 未登录，404：未收藏
     */
    @LoginRequired
    @RequestMapping(params = "method=checkCollection")
    @ResponseBody
    public Map<String, Object> checkCollection(Article article, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = new HashMap<String, Object>();
        if (loginUser != null) {
            int flag = userService.checkCollection(article, loginUser);
            map.put(KEY_STATUS, flag);
            if (flag == 200) {
                map.put(KEY_STATUS_FRIENDLY, "已收藏");
            } else {
                map.put(KEY_STATUS_FRIENDLY, "未收藏");
            }
        } else {
            map.put(KEY_STATUS, 401);
            map.put(KEY_STATUS_FRIENDLY, "未登录");
        }
        return map;
    }

    /**
     * 保存收藏
     *
     * @param session
     * @param article
     * @return flag - 200：成功，204: 重复插入，401：需要登录，404: 无此文章，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=collectArticle")
    @ResponseBody
    public Map<String, Object> collectArticle(Article article, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = userService.collectArticle(loginUser, article);
        map.put(KEY_STATUS, flag);
        convertStatusCodeToWord(map);
        if (flag == 404) {
            map.put(KEY_STATUS_FRIENDLY, "无此文章");
        } else if (flag == 204) {
            map.put(KEY_STATUS_FRIENDLY, "之前已经收藏过了");
        }
        return map;
    }

    /**
     * 删除收藏
     *
     * @param session
     * @param article
     * @return flag - 200：取消成功，401：需要登录，404：无此记录，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=unCollectArticle")
    @ResponseBody
    public Map<String, Object> unCollectArticle(Article article, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = userService.unCollectArticle(loginUser, article);
        map.put(KEY_STATUS, flag);
        convertStatusCodeToWord(map);
        return map;
    }

    /**
     * 请求收藏文章列表
     *
     * @param session
     * @return
     */
    @LoginRequired(content = "")
    @RequestMapping(params = "method=listCollections")
    @ResponseBody
    public List<Collection> listCollections(HttpSession session) {
        List<Collection> list = null;
        User loginUser = (User) session.getAttribute("loginUser");
        if (loginUser != null) {
            list = userService.findCollectList(loginUser);
        }
        return list;
    }

}
