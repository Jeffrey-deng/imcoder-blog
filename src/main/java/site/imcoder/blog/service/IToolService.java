package site.imcoder.blog.service;

import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

import java.util.HashMap;

/**
 * 工具服务类接口
 *
 * @author Jeffrey.Deng
 * @date 2019-10-21
 */
public interface IToolService {

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
    public IResponse textToVoice(String text, HashMap options, IRequest iRequest);

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
    public IResponse getIpLocation(String ip, IRequest iRequest);

}
