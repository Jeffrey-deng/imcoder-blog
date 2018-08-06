package site.imcoder.blog.controller;

import org.apache.commons.lang.StringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.RedirectView;
import site.imcoder.blog.Interceptor.LoginRequired;
import site.imcoder.blog.controller.propertyeditors.IntEditor;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.UserGroup;
import site.imcoder.blog.service.IArticleService;
import site.imcoder.blog.service.INotifyService;
import site.imcoder.blog.service.ISiteService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.*;

/**
 * description: 站点控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/site.do")
public class SiteController {

    //依赖注入[service]
    @Resource
    private IArticleService articleService;

    @Resource
    private IUserService userService;

    @Resource
    private ISiteService siteService;

    @Resource
    private INotifyService notifyService;

    @RequestMapping()
    public ModelAndView defaultHandle() {
        RedirectView redirectView = new RedirectView("site.do?method=about", true);
        redirectView.setStatusCode(HttpStatus.MOVED_PERMANENTLY);
        return new ModelAndView(redirectView);
    }

    /**
     * 查询公告列表
     *
     * @param jumpPage  跳转页
     * @param condition 条件
     * @param session
     * @return 通过权限检查的列表
     */
    @RequestMapping(params = "method=notices")
    public String list(@RequestParam(defaultValue = "5") int pageSize, @RequestParam(defaultValue = "1") int jumpPage, Article condition, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (condition == null) {
            condition = new Article();
        }
        condition.setTags("公告|notice");
        UserGroup group = new UserGroup();
        group.setGid(1);
        User author = new User();
        author.setUserGroup(group);
        condition.setAuthor(author);
        Map<String, Object> map = articleService.list(pageSize, jumpPage, condition, loginUser);
        if (map != null) {
            request.setAttribute("articleList", map.get("articleList"));
            request.setAttribute("page", map.get("page"));
        }
        request.setAttribute("condition", condition);
        return "/site/notice";
    }

    @RequestMapping(params = "method=about")
    public String about(HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");

        int aid = Config.getInt(ConfigConstants.SITE_ABOUT_ARTICLE_ID);
        Map<String, Object> queryMap = articleService.detail(aid, loginUser);

        Article article = (Article) queryMap.get("article");
        if (article != null) {
            request.setAttribute("article", article);
            userService.hasClickArticle((User) session.getAttribute("loginUser"), article);
            return "/site/about";
        } else {
            request.setAttribute("errorInfo", "站点还未设置关于页~");
            return "/error/404_detail";
        }
    }

    @RequestMapping(params = "method=help")
    public String about(@RequestParam(defaultValue = "search") String module, HttpServletRequest request, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        String configKey = ConfigConstants.HelpConfigEnum.getModuleConfigKey(module);
        if (configKey == null) {
            return "/error/400";
        }
        int aid = Config.getInt(configKey);
        Map<String, Object> queryMap = articleService.detail(aid, loginUser);
        Article article = (Article) queryMap.get("article");
        if (article != null) {
            request.setAttribute("article", article);
            userService.hasClickArticle((User) session.getAttribute("loginUser"), article);
            return "/site/about";
        } else {
            request.setAttribute("errorInfo", "站点还未设置" + module + "帮助页~");
            return "/error/404_detail";
        }
    }

    /**
     * 发送验证码邮件
     *
     * @param session
     * @return code
     */
    @LoginRequired(content = "")
    @RequestMapping(params = "method=sendValidateMail")
    @ResponseBody
    public String sendValidateMail(HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        String code = notifyService.validateCode(loginUser);
        if (code != null) {
            session.setAttribute("validateCode", code);
        }
        return code;
    }

    /**
     * 清除系统消息未读状态
     *
     * @param session
     */
    @LoginRequired
    @RequestMapping(params = "method=clearSysMsgStatus")
    @ResponseBody
    public Map<String, Object> clearSystemMessageStatus(String smids, HttpSession session) {
        Map<String, Object> map = new HashMap<String, Object>();
        if (!smids.equals("")) {
            String[] split = StringUtils.split(smids, '_');
            List<Integer> list = new ArrayList<>();
            for (String id : split) {
                list.add(Integer.valueOf(id));
            }
            User loginUser = (User) session.getAttribute("loginUser");
            int flag = notifyService.updateSystemMessageStatus(list);
            map.put("flag", flag);
            convertStatusCodeToWord(map, "flag", "info");
        } else {
            map.put("flag", 400);
            map.put("info", "参数错误");
        }
        return map;
    }

    /**
     * 文字转语音
     *
     * @param text
     * @return session
     */
    @LoginRequired
    @RequestMapping(params = "method=runTextToVoice")
    @ResponseBody
    public Map<String, Object> textToVoice(HttpServletRequest request, String text, HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        // to HashMap
        HashMap<String, Object> options = new HashMap<String, Object>();
        for (Iterator itr = request.getParameterMap().entrySet().iterator(); itr.hasNext(); ) {
            Map.Entry element = (Map.Entry) itr.next();
            String strKey = (String) element.getKey();
            String strValue = ((String[]) (element.getValue()))[0];
            options.put(strKey, strValue);
        }
        Map<String, Object> map = siteService.textToVoice(text, options, loginUser);
        convertStatusCodeToWord(map, "flag", "info");
        return map;
    }

    /**
     * 文字转语音页面
     *
     * @return session
     */
    @LoginRequired
    @RequestMapping(params = "method=text_to_voice")
    public String textToVoice(HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (loginUser == null) {
            return "/site/login";
        } else {
            return "/tool/text_to_voice";
        }
    }

    //注册类型转换
    @InitBinder
    protected void initBinder(WebDataBinder binder) {
        //binder.registerCustomEditor(Date.class, new CustomDateEditor(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"), true));
        binder.registerCustomEditor(int.class, new IntEditor());
    }

    private void convertStatusCodeToWord(Map<String, Object> map, String codeKey, String wordKey) {
        int flag = (Integer) map.get(codeKey);
        if (flag == 200) {
            map.put(wordKey, "成功");
        } else if (flag == 400) {
            map.put(wordKey, "参数错误");
        } else if (flag == 401) {
            map.put(wordKey, "需要登录或凭证错误");
        } else if (flag == 403) {
            map.put(wordKey, "没有权限");
        } else if (flag == 404) {
            map.put(wordKey, "无此记录");
        } else {
            map.put(wordKey, "服务器错误");
        }
    }
}
