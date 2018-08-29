package site.imcoder.blog.controller;

import org.apache.commons.httpclient.HttpStatus;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.RedirectView;
import site.imcoder.blog.Interceptor.LoginRequired;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.Category;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.IArticleService;
import site.imcoder.blog.service.IManagerService;
import site.imcoder.blog.service.ISiteService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * description: 站点控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/manager.do")
public class ManagerController extends BaseController {

    private static Logger logger = Logger.getLogger(ManagerController.class);

    //依赖注入[service]
    @Resource
    private IArticleService articleService;

    @Resource
    private IUserService userService;

    @Resource
    private ISiteService siteService;

    @Resource
    private IManagerService managerService;

    @RequestMapping()
    public ModelAndView defaultHandle(HttpServletRequest request) {
        String queryString = request.getQueryString();
        ModelAndView mv = new ModelAndView();
        if (queryString == null || queryString.length() == 0) {
            RedirectView redirectView = new RedirectView("manager.do?method=backstage", true);
            redirectView.setStatusCode(org.springframework.http.HttpStatus.MOVED_PERMANENTLY);
            mv.setView(redirectView);
        } else {
            mv.setViewName(PAGE_NOT_FOUND_ERROR);
        }
        return mv;
    }

    /**
     * 后台管理页面
     *
     * @param session
     * @param request
     * @return
     */
    @LoginRequired
    @RequestMapping(params = "method=backstage")
    public String backstage(HttpSession session, HttpServletRequest request) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = managerService.getBlogInfo(loginUser);
        int flag = (int) map.get(KEY_STATUS);
        if (flag == 200) {
            request.setAttribute("articleCount", map.get("articleCount"));
            request.setAttribute("userCount", map.get("userCount"));
            request.setAttribute("articleViewCount", map.get("articleViewCount"));
            request.setAttribute("userActiveCount", session.getServletContext().getAttribute("userActiveCount"));
            return "/manager/main_manager";
        } else if (flag == 403) {
            return PAGE_FORBIDDEN_ERROR;
        } else {
            return PAGE_LOGIN;
        }
    }

    @LoginRequired
    @RequestMapping(params = "method=user_manager")
    public String userManager(HttpSession session, HttpServletRequest request) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = managerService.getUserList(loginUser);
        int flag = (int) map.get(KEY_STATUS);
        if (flag == 200) {
            List<User> userList = (List<User>) map.get("userList");
            request.setAttribute("userList", userList);
            request.setAttribute("userCount", userList.size());
            return "/manager/user_manager";
        } else if (flag == 403) {
            return PAGE_FORBIDDEN_ERROR;
        } else {
            return PAGE_LOGIN;
        }
    }

    @LoginRequired
    @RequestMapping(params = "method=article_manager")
    public String articleManager(HttpSession session) {
        int auth = isAdmin(session);
        if (auth == 200) {
            return "/manager/article_manager";
        } else if (auth == 403) {
            return PAGE_FORBIDDEN_ERROR;
        } else {
            return PAGE_LOGIN;
        }
    }

    @LoginRequired
    @RequestMapping(params = "method=articleListByAjax")
    @ResponseBody
    public Map<String, Object> articleListByAjax(HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = managerService.getArticleInfoList(loginUser);
        int flag = (int) map.get(KEY_STATUS);
        convertStatusCodeToWord(map);
        if (flag == 200) {
            List<Article> list = (List<Article>) map.get("articleList");
            map.put("articles", list);
            map.put("articleCount", list.size());
            map.remove("articleList");
        }
        return map;
    }

    @LoginRequired
    @RequestMapping(params = "method=modifyArticleInfoByManager")
    @ResponseBody
    public Map<String, Object> modifyArticleInfoByManager(Article article, Category category, HttpSession session) {
        Map<String, Object> map = new HashMap<>();
        User loginUser = (User) session.getAttribute("loginUser");
        article.setCategory(category);
        int flag = managerService.updateArticleInfo(article, loginUser);
        map.put(KEY_STATUS, flag);
        convertStatusCodeToWord(map);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "文章信息修改成功");
        } else if (flag == 404) {
            map.put(KEY_STATUS_FRIENDLY, "该文章不存在");
        }
        return map;
    }

    @LoginRequired
    @RequestMapping(params = "method=article_modify")
    public String articleModify(HttpSession session) {
        int auth = isAdmin(session);
        if (auth == 200) {
            return "/manager/manager_article_modify";
        } else if (auth == 403) {
            return PAGE_FORBIDDEN_ERROR;
        } else {
            return PAGE_LOGIN;
        }
    }

    @LoginRequired
    @RequestMapping(params = "method=article_modify_save")
    @ResponseBody
    public Map<String, Object> articleModifySave(Article article, Category category, ModelAndView mv, HttpSession session) {
        Map<String, Object> map = new HashMap<>();
        User loginUser = (User) session.getAttribute("loginUser");
        article.setCategory(category);
        int flag = articleService.update(article, loginUser);
        map.put(KEY_STATUS, flag);
        convertStatusCodeToWord(map);
        if (flag == 200) {
            map.put("aid", article.getAid());
            map.put(KEY_STATUS_FRIENDLY, "文章修改成功");
        } else if (flag == 404) {
            map.put(KEY_STATUS_FRIENDLY, "该文章不存在");
        }
        return map;
    }

    /**
     * 重新初始化缓存
     */
    @LoginRequired
    @RequestMapping(params = "method=reload_cache")
    @ResponseBody
    public Map<String, Object> reloadCache(HttpSession session) {
        Map<String, Object> map = new HashMap<>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = managerService.reloadCache(loginUser);
        map.put(KEY_STATUS, flag);
        convertStatusCodeToWord(map);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "已重新初始化缓存");
        }
        return map;
    }

    /**
     * 重新读取配置文件
     */
    @LoginRequired
    @RequestMapping(params = "method=reload_config")
    @ResponseBody
    public Map<String, Object> reloadConfig(HttpSession session) {
        Map<String, Object> map = new HashMap<>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = managerService.reloadConfig(loginUser);
        map.put(KEY_STATUS, flag);
        convertStatusCodeToWord(map);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "已重新读取配置文件");
        }
        return map;
    }

    /**
     * 重新读取配置文件
     */
    @LoginRequired
    @RequestMapping(params = "method=update_config")
    @ResponseBody
    public Map<String, Object> updateConfig(String key, String value, HttpSession session) {
        Map<String, Object> map = new HashMap<>();
        User loginUser = (User) session.getAttribute("loginUser");
        int flag = managerService.updateConfig(key, value, loginUser);
        map.put(KEY_STATUS, flag);
        convertStatusCodeToWord(map);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "成功更新配置项");
        }
        return map;
    }

    /**
     * 取得所有配置
     *
     * @param session
     * @return {flag, info, configMap}
     */
    @LoginRequired
    @RequestMapping(params = "method=getAllConfig")
    @ResponseBody
    public Map<String, Object> getAllConfig(HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        Map<String, Object> map = managerService.getAllConfig(loginUser);
        int flag = (int) map.get(KEY_STATUS);
        convertStatusCodeToWord(map);
        if (flag == 200) {
            map.put(KEY_STATUS_FRIENDLY, "取得配置项");
        }
        return map;
    }


    @LoginRequired
    @RequestMapping(params = "method=log_view")
    public String checkLog(HttpSession session) {
        int auth = isAdmin(session);
        if (auth == 200) {
            return "/manager/log_view";
        } else if (auth == 403) {
            return PAGE_FORBIDDEN_ERROR;
        } else {
            return PAGE_LOGIN;
        }
    }

    /**
     * 加载日志文件
     */
    @LoginRequired(content = "")
    @RequestMapping(params = "method=load_log")
    @ResponseBody
    public void loadLogFile(@RequestParam(defaultValue = "error") String type, HttpSession session, HttpServletResponse response) {
        if (isAdmin(session) == 200) {
            String path = null;
            if (KEY_STATUS_FRIENDLY.equalsIgnoreCase(type)) {
                path = Config.get(ConfigConstants.LOG_FILE_INFO_PATH);
            } else if ("warn".equalsIgnoreCase(type)) {
                path = Config.get(ConfigConstants.LOG_FILE_WARN_PATH);
            } else if ("error".equalsIgnoreCase(type)) {
                path = Config.get(ConfigConstants.LOG_FILE_ERROR_PATH);
            }
            if (path != null) {
                File logFile = new File(path);
                if (logFile.exists() && logFile.isFile()) {
                    response.setHeader("Content-Type", "text/plain;charset=UTF-8");
                    try {
                        response.setHeader("Content-disposition", "attachment; filename=" + new String(logFile.getName().getBytes("utf-8"), "ISO8859-1"));
                    } catch (UnsupportedEncodingException e) {
                        e.printStackTrace();
                    }
                    PrintWriter out = null;
                    BufferedReader reader = null;
                    try {
                        out = response.getWriter();
                        int buffLen = 20000;
                        char[] buff = new char[buffLen];
                        reader = new BufferedReader(new FileReader(logFile));
                        int len = 0;
                        while ((len = reader.read(buff, 0, buffLen)) != -1) {
                            out.write(buff, 0, len);
                        }
                        out.flush();
                    } catch (FileNotFoundException e) {
                        e.printStackTrace();
                        logger.error("日志文件流读取出错, 文件未找到: " + path, e);
                    } catch (IOException e) {
                        e.printStackTrace();
                        logger.error("日志文件流读取出错", e);
                    } finally {
                        try {
                            if (reader != null) {
                                reader.close();
                            }
                            if (out != null) {
                                out.close();
                            }
                        } catch (IOException e) {
                            e.printStackTrace();
                            logger.error("日志文件流关闭出错", e);
                        }
                    }
                    return;
                } else {
                    response.setStatus(HttpStatus.SC_NOT_FOUND);
                }
            } else {
                response.setStatus(HttpStatus.SC_BAD_REQUEST);
            }
        } else {
            response.setStatus(HttpStatus.SC_FORBIDDEN);
        }
        response.addHeader("Content-Length", "0");
        try {
            response.getWriter().close();
        } catch (IOException e) {
            e.printStackTrace();
            logger.error("日志文件流关闭出错", e);
        }
    }

    protected void convertStatusCodeToWord(Map<String, Object> map, String codeKey, String wordKey) {
        super.convertStatusCodeToWord(map, codeKey, wordKey);
        int flag = (Integer) map.get(codeKey);
        if (flag == 403) {
            map.put(wordKey, "你不是管理员，无权修改！");
        }
    }

}
