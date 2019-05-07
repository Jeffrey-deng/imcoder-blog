package site.imcoder.blog.controller.api;

import org.apache.commons.httpclient.HttpStatus;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import site.imcoder.blog.Interceptor.annotation.GZIP;
import site.imcoder.blog.Interceptor.annotation.LoginRequired;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.entity.Article;
import site.imcoder.blog.entity.Category;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.entity.UserGroup;
import site.imcoder.blog.service.IArticleService;
import site.imcoder.blog.service.IManagerService;
import site.imcoder.blog.service.ISiteService;
import site.imcoder.blog.service.IUserService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.util.List;

/**
 * description: 管理员控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/manager.api")
public class ManagerApiController extends BaseController {

    private static Logger logger = Logger.getLogger(ManagerApiController.class);

    //依赖注入[service]
    @Resource
    private IArticleService articleService;

    @Resource
    private IUserService userService;

    @Resource
    private ISiteService siteService;

    @Resource
    private IManagerService managerService;

    /**
     * 获取文章列表
     *
     * @param iRequest
     * @return IResponse:
     * articles
     * articleCount
     */
    @LoginRequired
    @RequestMapping(params = "method=getArticleInfoList")
    @ResponseBody
    @GZIP
    public IResponse getArticleInfoList(IRequest iRequest) {
        IResponse articleListResp = managerService.getArticleInfoList(iRequest);
        if (articleListResp.isSuccess()) {
            articleListResp.putAttr("articleCount", ((List<Article>) articleListResp.getAttr("articles")).size());
        }
        return articleListResp;
    }

    /**
     * 管理员更新文章信息
     *
     * @param article
     * @param category
     * @param iRequest
     * @return
     */
    @LoginRequired
    @RequestMapping(params = "method=modify_article_info")
    @ResponseBody
    public IResponse modifyArticleInfo(Article article, Category category, IRequest iRequest) {
        article.setCategory(category);
        return managerService.updateArticleInfo(article, iRequest);
    }


    /**
     * 管理员更新文章内容
     *
     * @param article
     * @param inform
     * @param iRequest
     * @return ResponseEntity
     * article：文章
     * status - 200：成功，400: 参数错误，401：需要登录，403: 没有权限，404：无此文章，500: 失败
     */
    @LoginRequired
    @RequestMapping(params = "method=modify_article_content")
    @ResponseBody
    public IResponse articleModifyContent(Article article, @RequestParam(defaultValue = "false") boolean inform, IRequest iRequest) {
        iRequest.putAttr("inform", inform);
        iRequest.putAttr("modifyByManager", true);
        return articleService.updateArticle(article, iRequest);
    }

    /**
     * 重新初始化缓存
     *
     * @param iRequest
     * @return
     */
    @LoginRequired
    @RequestMapping(params = "method=reload_cache")
    @ResponseBody
    public IResponse reloadCache(IRequest iRequest) {
        return managerService.reloadCache(iRequest);
    }

    /**
     * 重新读取配置文件
     */
    @LoginRequired
    @RequestMapping(params = "method=reload_config")
    @ResponseBody
    public IResponse reloadConfig(IRequest iRequest) {
        return managerService.reloadConfig(iRequest);
    }

    /**
     * 重新读取配置文件
     */
    @LoginRequired
    @RequestMapping(params = "method=update_config")
    @ResponseBody
    public IResponse updateConfig(String key, String value, IRequest iRequest) {
        return managerService.updateConfig(key, value, iRequest);
    }

    /**
     * 取得所有配置
     *
     * @param iRequest
     * @return IResponse:
     * configMap
     */
    @LoginRequired
    @RequestMapping(params = "method=getAllConfig")
    @ResponseBody
    public IResponse getAllConfig(IRequest iRequest) {
        return managerService.getAllConfig(iRequest);
    }

    /**
     * 更换用户组
     * 管理员不能将别人提升为管理员
     * 管理员不能将其他管理员降级为会员
     *
     * @param user
     * @param userGroup
     * @param iRequest
     * @return IResponse:
     * status: 400: 参数错误，401：未登录， 403：无权修改， 404：用户不存在或提交的gid不存在， 500：服务器错误
     * userGroup: 新组信息
     */
    @LoginRequired
    @RequestMapping(params = "method=updateUserGroup")
    @ResponseBody
    public IResponse updateUserGroup(User user, UserGroup userGroup, IRequest iRequest) {
        if (user == null) {
            user = new User();
        }
        user.setUserGroup(userGroup);
        return managerService.updateUserGroup(user, iRequest);
    }

    /**
     * 查询所有的用户组信息
     *
     * @param iRequest
     * @return IResponse:
     * userGroups
     */
    @LoginRequired
    @RequestMapping(params = "method=getUserGroupList")
    @ResponseBody
    public IResponse getUserGroupList(IRequest iRequest) {
        return managerService.findUserGroupList(iRequest);
    }

    /**
     * 加载日志文件
     *
     * @param type
     * @param response
     * @param iRequest
     */
    @LoginRequired(content = "")
    @RequestMapping(params = "method=load_log")
    @ResponseBody
    @GZIP
    public void loadLogFile(@RequestParam(defaultValue = "error") String type, HttpServletResponse response, IRequest iRequest) {
        if (iRequest.isManagerRequest()) {
            String path = null;
            if ("info".equalsIgnoreCase(type)) {
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
                        response.setHeader("Content-disposition", "attachment; filename=" + new String(logFile.getName().getBytes(), "ISO8859-1"));
                    } catch (UnsupportedEncodingException e) {
                        logger.error("UnsupportedEncodingException", e);
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
                        logger.error("日志文件流读取出错, 文件未找到: " + path, e);
                    } catch (IOException e) {
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
            logger.error("日志文件流关闭出错", e);
        }
    }

    /**
     * 升级系统
     *
     * @param version
     * @param iRequest
     * @return
     */
    @LoginRequired
    @RequestMapping(params = "method=upgradeService")
    @ResponseBody
    public IResponse upgradeService(String version, IRequest iRequest) {
        return managerService.upgradeService(version, iRequest);
    }

}
