package site.imcoder.blog.service;

import site.imcoder.blog.entity.User;

import java.util.HashMap;
import java.util.Map;

public interface ISiteService {

    /**
     * 文字转语音
     *
     * @param text      文字
     * @param options   参数
     * @param loginUser
     * @return {200：成功，400：参数错误，401：未登录，500：转换错误}
     */
    public Map<String, Object> textToVoice(String text, HashMap options, User loginUser);

    /**
     * 获取ip的地理位置
     *
     * @param ip
     * @return flag: 200: 成功，400：参数错误，500：失败
     * ip: 源ip
     * location: 地址
     */
    public Map<String, Object> getIpLocation(String ip);

}
