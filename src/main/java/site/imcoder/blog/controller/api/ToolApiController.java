package site.imcoder.blog.controller.api;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import site.imcoder.blog.Interceptor.annotation.LoginRequired;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.service.IToolService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * 工具api控制器
 *
 * @author Jeffrey.Deng
 * @date 2019-10-21
 */
@Controller()
@RequestMapping("/tool.api")
public class ToolApiController extends BaseController {

    @Resource
    private IToolService toolService;

    /**
     * 文字转语音
     *
     * @param text
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400：参数错误，401：未登录，500：转换错误
     * fileName
     * mp3_url
     */
    @LoginRequired
    @RequestMapping(params = "method=runTextToVoice")
    @ResponseBody
    public IResponse textToVoice(String text, HttpServletRequest request, IRequest iRequest) {
        // to HashMap
        HashMap<String, Object> options = new HashMap<String, Object>();
        for (Iterator itr = request.getParameterMap().entrySet().iterator(); itr.hasNext(); ) {
            Map.Entry element = (Map.Entry) itr.next();
            String strKey = (String) element.getKey();
            String strValue = ((String[]) (element.getValue()))[0];
            options.put(strKey, strValue);
        }
        return toolService.textToVoice(text, options, iRequest);
    }

    /**
     * 获取ip的地理位置
     *
     * @param ip
     * @param iRequest
     * @return IResponse:
     * status: 200: 成功，400：参数错误，500：失败
     * ip: 源ip
     * location: 地址
     */
    @RequestMapping(params = "method=getIpLocation")
    @ResponseBody
    public IResponse getIpLocation(@RequestParam(name = "ip", required = false) String ip, IRequest iRequest) {
        return toolService.getIpLocation(ip, iRequest);
    }

    /**
     * 获取本机ip的地理位置
     *
     * @param iRequest
     * @return IResponse:
     * status: 200: 成功，400：参数错误，500：失败
     * ip: 源ip
     * location: 地址
     */
    @RequestMapping(params = "method=getCurrentIpLocation")
    @ResponseBody
    public IResponse getCurrentIpLocation(IRequest iRequest) {
        return toolService.getIpLocation(null, iRequest);
    }

}
