package site.imcoder.blog.controller.api;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.service.ISiteService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;

/**
 * description: 站点控制器
 *
 * @author dengchao
 * @date 2016-9-1
 */
@Controller
@RequestMapping("/site.api")
public class SiteApiController extends BaseController {

    @Resource
    private ISiteService siteService;

    /**
     * 获取新的客户端配置
     *
     * @return status: {200：成功，404：没有配置}； data{ config: 配置 }
     */
    @RequestMapping(params = "method=getConfigUpgrade", produces = "application/json;charset=UTF-8")
    @ResponseBody
    public String getConfigUpgrade() {
        String clientConfigStr = Config.get(ConfigConstants.SITE_CLIENT_CONFIG);
        int status;
        String message;
        if (Utils.isBlank(clientConfigStr)) {
            status = 404;
            message = "没有配置";
            clientConfigStr = "null";
        } else {
            status = 200;
            message = "成功";
            clientConfigStr = clientConfigStr.replace('\'', '"').replaceFirst("^\"", "").replaceFirst("\"$", "");
        }
        return String.format("{\"status\": %d, \"message\": \"%s\", \"data\": {\"config\": %s}}", status, message, clientConfigStr);
    }

}
