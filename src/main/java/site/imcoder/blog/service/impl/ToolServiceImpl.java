package site.imcoder.blog.service.impl;

import org.apache.http.HttpHeaders;
import org.springframework.stereotype.Service;
import site.imcoder.blog.common.AudioUtil;
import site.imcoder.blog.common.IpUtil;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.BaseService;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.service.IToolService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * 工具服务类
 *
 * @author Jeffrey.Deng
 * @date 2019-10-21
 */
@Service("toolService")
public class ToolServiceImpl extends BaseService implements IToolService {

    @Resource(name = "fileService")
    private IFileService fileService;

    /**
     * 文字转语音
     *
     * @param text     文字
     * @param options  参数
     * @param iRequest
     * @return IResponse:
     * status - 200：成功，400：参数错误，401：未登录，500：转换错误
     * fileName
     * mp3_url
     */
    @Override
    public IResponse textToVoice(String text, HashMap options, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        if (iRequest.isHasNotLoggedIn()) {
            response.setStatus(STATUS_NOT_LOGIN);
        } else if (text != null && !text.equals("")) {
            byte[] bytes = AudioUtil.textToVoice(text, options);
            //AudioUtil.textToVoice(text, modelAndView.getModel(), dir + fileName);
            if (bytes != null && bytes.length > 0) {
                String fileName = "text-to-voice_" + IdUtil.convertDecimalIdTo62radix(System.currentTimeMillis()) + ".mp3";
                String relativePath = Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + IdUtil.convertToShortPrimaryKey(loginUser.getUid()) + "/files/text_to_voice/" + fileName;
                Map<String, Object> metadata = new HashMap<>();
                metadata.put(HttpHeaders.CONTENT_TYPE, "audio/mp3");
                InputStream inputStream = new ByteArrayInputStream(bytes);
                if (fileService.save(inputStream, fileService.baseCloudDir(relativePath), metadata)) {
                    response.putAttr("fileName", fileName);
                    response.putAttr("mp3_url", relativePath);
                    response.putAttr("mp3_cdn_url", Config.get(ConfigConstants.SITE_CLOUD_ADDR) + relativePath);
                    response.putAttr("cdn_path_prefix", Config.get(ConfigConstants.SITE_CLOUD_ADDR));
                    response.setStatus(STATUS_SUCCESS);
                } else {
                    response.setStatus(STATUS_SERVER_ERROR, "转换成功，但保存失败");
                }
            } else {
                response.setStatus(STATUS_SERVER_ERROR, "转换错误");
            }
        } else {
            response.setStatus(STATUS_PARAM_ERROR, "请输入内容~");
        }
        return response;
    }

    /**
     * 获取ip的地理位置
     *
     * @param ip
     * @return IResponse:
     * status: 200: 成功，400：参数错误，500：失败
     * ip: 源ip
     * location: 地址
     */
    @Override
    public IResponse getIpLocation(String ip, IRequest iRequest) {
        if (Utils.isEmpty(ip)) {
            ip = iRequest.getAccessIp();
        }
        IResponse response = new IResponse();
        response.putAttr("ip", ip);
        if (Utils.isEmpty(ip)) {
            response.setStatus(STATUS_PARAM_ERROR, "输入ip为空~");
        } else {
            String location = IpUtil.getIpLocation(ip);
            if (location == null) {
                response.setStatus(STATUS_SERVER_ERROR, "获取ip所在地失败~");
            } else {
                response.setStatus(STATUS_SUCCESS);
                response.putAttr("location", location);
            }
        }
        return response;
    }

}
