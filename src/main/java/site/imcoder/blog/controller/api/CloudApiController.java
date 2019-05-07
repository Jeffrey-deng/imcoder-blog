package site.imcoder.blog.controller.api;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.Interceptor.annotation.LoginRequired;
import site.imcoder.blog.controller.BaseController;
import site.imcoder.blog.service.ICloudService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import javax.annotation.Resource;

/**
 * @author Jeffrey.Deng
 * @date 2018-12-17
 */
@Controller
@RequestMapping("/cloud.api")
public class CloudApiController extends BaseController {

    @Resource
    private ICloudService cloudService;

    /**
     * 贴图
     *
     * @param file
     * @param iRequest
     * @return IResponse:
     * status: - 200：成功，400: 参数错误， 401：需要登录，403：没有权限，500：服务器错误
     * image_path: 图片路径
     * image_type: 图片content_type
     * raw_width: 图片宽度
     * raw_height: 图片高度
     * file_size: 图片大小
     */
    @LoginRequired
    @RequestMapping(params = "method=postImage", method = RequestMethod.POST)
    @ResponseBody
    public IResponse uploadPhoto(@RequestParam(value = "file") MultipartFile file, IRequest iRequest) {
        return cloudService.postImage(file, iRequest);
    }

}
