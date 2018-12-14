package site.imcoder.blog.controller;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.RedirectView;
import site.imcoder.blog.Interceptor.GZIP;
import site.imcoder.blog.Interceptor.LoginRequired;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.entity.*;
import site.imcoder.blog.service.IArticleService;
import site.imcoder.blog.service.IUserService;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
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
    public Map<String, Object> register(User user) {
        Map<String, Object> map = new HashMap<String, Object>();
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
     * 登陆
     *
     * @param user
     * @param remember
     * @param session
     * @param request
     * @return flag - 200：成功，400: 参数错误，401：凭证错误，403：账号冻结，404：无此用户
     * loginUser - 用户对象
     */
    @RequestMapping(params = "method=login", method = RequestMethod.POST)
    @ResponseBody
    public Map<String, Object> login(User user, @RequestParam(defaultValue = "false") boolean remember, HttpSession session, HttpServletRequest request) {
        /* 登陆验证 */
        user.setEmail(user.getUsername());
        user.setLoginIP(Utils.getRemoteAddr(request));
        if (user.getPassword() != null && remember && user.getToken() == null) {
            user.setToken(session.getId());
        }
        Map<String, Object> map = userService.login(user, remember);
        int flag = (int) map.get(KEY_STATUS);
        if (flag == 200) {
            //登陆成功
            User loginUser = (User) map.get("user");
            loginUser.setPassword("");
            session.setAttribute("loginUser", loginUser);
            map.put("loginUser", loginUser);
            map.remove("user");
            if (remember) {
                map.put("token", map.get("token"));
            }
            map.put("continue", "article.do?method=list");
        } else if (flag == 400) {
            map.put(KEY_STATUS_FRIENDLY, "参数错误");
        } else if (flag == 401) {
            map.put(KEY_STATUS_FRIENDLY, "凭证错误");
        } else if (flag == 403) {
            map.put(KEY_STATUS_FRIENDLY, "账号为锁定状态");
        } else {
            map.put(KEY_STATUS_FRIENDLY, "该用户不存在");
        }
        return map;
    }

    /**
     * 跳转到 登陆
     *
     * @param user
     * @param mv
     * @param request
     * @return
     */
    @RequestMapping(params = "method=jumpLogin")
    public ModelAndView jumpLogin(User user, ModelAndView mv, HttpServletRequest request) {
        if (request.getAttribute("http_code") == null) {
            request.setAttribute("http_code", 200);
        }
        //传入了参数则跳转到重新登录页面，没有则普通登陆
        if (user != null && (user.getUsername() != null || user.getEmail() != null || user.getUid() > 0)) {
            user.setEmail(user.getUsername());
            User userInfo = userService.findUser(user, null);
            if (userInfo != null) {
                User cacheUser = userService.findUser(userInfo, null, true);
                userInfo.setUsername(cacheUser.getUsername());
                userInfo.setHead_photo(cacheUser.getHead_photo());
                mv.addObject("user", userInfo);
                mv.setViewName(PAGE_LOGIN_EXPIRED);
                return mv;
            }
        }
        mv.setViewName(PAGE_LOGIN);
        return mv;
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
     * 检查该邮箱是否存在
     *
     * @param user username
     * @return flag - 200：已存在，404：未使用
     */
    @RequestMapping(params = "method=checkEmail")
    @ResponseBody
    public Map<String, Object> checkEmail(User user) {
        Map<String, Object> map = new HashMap<String, Object>();
        User rs = userService.findUser(user, null);
        int flag = (rs == null ? 404 : 200);
        map.put(KEY_STATUS, flag);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "已存在");
        } else {
            map.put(KEY_STATUS_FRIENDLY, "未使用");
        }
        return map;
    }

    /**
     * 检查改用户名是否存在
     *
     * @param user 用户名
     * @return flag - 200：已存在，404：未使用
     */
    @RequestMapping(params = "method=checkUsername")
    @ResponseBody
    public Map<String, Object> checkUsername(User user) {
        Map<String, Object> map = new HashMap<String, Object>();
        User rs = userService.findUser(user, null);
        int flag = (rs == null ? 404 : 200);
        map.put(KEY_STATUS, flag);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "已存在");
        } else {
            map.put(KEY_STATUS_FRIENDLY, "未使用");
        }
        return map;
    }

    /**
     * 更新账号信息
     *
     * @param user
     * @param validateCode
     * @param session
     * @return flag - 200：成功，401：需要登录或验证码错误，403：无权限，404：无此用户，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=updateAccount")
    @ResponseBody
    public Map<String, Object> updateAccount(User user, String validateCode, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        String memValidateCode = (String) session.getAttribute("validateCode");
        Map<String, Object> map = new HashMap<String, Object>();
        if (loginUser == null) {
            map.put(KEY_STATUS, 401);
            map.put(KEY_STATUS_FRIENDLY, "未登录");
            //服务端再与Session中的验证码验证，防止修改html破解
        } else if (memValidateCode.equalsIgnoreCase(validateCode)) {
            user.setUid(loginUser.getUid());
            int flag = userService.updateAccount(user, loginUser);
            map.put(KEY_STATUS, flag);
            convertStatusCodeToWord(map);
            if (flag == 200) {
                //销毁session让其重新登录
                session.invalidate(); //由于前面清除了token，使所有终端自动登录失效，重新登录是为了让其获取新的token
            }
        } else {
            map.put(KEY_STATUS, 401);
            map.put(KEY_STATUS_FRIENDLY, "验证码错误");
        }
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
     * 查询私信列表
     *
     * @param read_status 0 未读 ，1全部
     * @param session
     * @return
     */
    @LoginRequired(content = "")
    @RequestMapping(params = "method=listLetters")
    @ResponseBody
    public List<Letter> listLetters(int read_status, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (loginUser != null) {
            return userService.findLetterList(loginUser, read_status);
        } else {
            return null;
        }
    }

    /**
     * 查询系统消息列表
     *
     * @param read_status 0 未读 ，1全部
     * @param session
     * @return
     */
    @LoginRequired(content = "")
    @RequestMapping(params = "method=listSysMsgs")
    @ResponseBody
    @GZIP
    public List<SysMsg> listSysMsgs(int read_status, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (loginUser != null) {
            return userService.findSysMsgList(loginUser, read_status);
        } else {
            return null;
        }
    }

    /**
     * 查询所有未读消息
     *
     * @param session
     * @return
     */
    @LoginRequired(content = "")
    @RequestMapping(params = "method=listUnreadMsg")
    @ResponseBody
    public Map<String, Object> listUnreadMsg(HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = new HashMap<String, Object>();
        if (loginUser != null) {
            map.put("letters", userService.findLetterList(loginUser, 0));
            map.put("sysMsgs", userService.findSysMsgList(loginUser, 0));
            return map;
        } else {
            return null;
        }
    }

    /**
     * 发送私信
     *
     * @param letter
     * @param session
     * @return flag - 200：发送成功，401：需要登录，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=sendLetter")
    @ResponseBody
    public Map<String, Object> sendLetter(Letter letter, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = userService.sendLetter(letter, loginUser);
        map.put(KEY_STATUS, flag);
        convertStatusCodeToWord(map);
        return map;
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

    /**
     * 安全退出
     *
     * @param session
     * @return flag - 200：成功，401：需要登录，404：无此用户，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=logout")
    @ResponseBody
    public Map<String, Object> logout(HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = userService.clearToken(loginUser); //清除token，让所有终端自动登录失效
        map.put(KEY_STATUS, flag);
        convertStatusCodeToWord(map);
        session.invalidate();
        return map;
    }

}
