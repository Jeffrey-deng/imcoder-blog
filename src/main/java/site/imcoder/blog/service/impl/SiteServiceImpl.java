package site.imcoder.blog.service.impl;

import org.springframework.stereotype.Service;
import site.imcoder.blog.common.AudioUtil;
import site.imcoder.blog.dao.ISiteDao;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.ISiteService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import java.io.File;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service("siteService")
public class SiteServiceImpl implements ISiteService {

    @Resource
    private ISiteDao siteDao;

    /**
     * 文字转语音
     *
     * @param text  文字
     * @param options   参数
     * @param loginUser
     * @return {200：成功，400：参数错误，401：未登录，500：转换错误}
     */
    public Map<String, Object> textToVoice(String text, HashMap options, User loginUser) {
        Map<String, Object> map = new HashMap<>();
        if (loginUser == null) {
            map.put("flag", 401);
        } else if (text != null && !text.equals("")) {
            String dir = Config.get(ConfigConstants.CLOUD_FILE_BASEPATH) + Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + loginUser.getUid() + "/files/text_to_voice/";
            File dirFile = new File(dir);
            if (!dirFile.exists()) {
                dirFile.mkdirs();
            }
            String fileName = "text-to-voice_" + new Date().getTime() + ".mp3";

            int flag = AudioUtil.textToVoice(text, options, dir + fileName);
            //AudioUtil.textToVoice(text, modelAndView.getModel(), dir + fileName);
            if (flag > 0) {
                map.put("fileName", fileName);
                map.put("mp3_url", Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + loginUser.getUid() + "/files/text_to_voice/" + fileName);
                map.put("flag", 200);
            } else {
                map.put("flag", 500);
            }
        } else {
            map.put("flag", 400);
        }
        return map;
    }


}
