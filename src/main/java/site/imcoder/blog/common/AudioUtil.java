package site.imcoder.blog.common;

import com.baidu.aip.speech.AipSpeech;
import com.baidu.aip.speech.TtsResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import java.io.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * Created by Jeffrey.Deng on 2018/2/19.
 */
public class AudioUtil {

    //设置APPID/AK/SK
    public static String APP_ID = null;

    public static String API_KEY = null;

    public static String SECRET_KEY = null;

    public static void updateTokenInfo() {
        APP_ID = Config.get(ConfigConstants.TOOL_SPEECH_TOKEN_APP_ID);
        API_KEY = Config.get(ConfigConstants.TOOL_SPEECH_TOKEN_API_KEY);
        SECRET_KEY = Config.get(ConfigConstants.TOOL_SPEECH_TOKEN_SECRET_KEY);
    }

    public static void main(String[] args) {
        // 初始化一个FaceClient
        AipSpeech client = new AipSpeech(APP_ID, API_KEY, SECRET_KEY);
        // 可选：设置网络连接参数
        client.setConnectionTimeoutInMillis(2000);
        client.setSocketTimeoutInMillis(60000);
        // 调用API
        //JSONObject res = client.asr("test.pcm", "pcm", 16000, null);
        //System.out.println(res.toString(2));
        //synthesis(client, "");

        HashMap<String, Object> options = new HashMap<String, Object>();
        options.put("spd", "5");
        options.put("pit", "5");
        options.put("per", "0");
        synthesis(client, "", options, "");
    }

    public static int textToVoice(String text, HashMap<String, Object> options, String savePath) {
        // 初始化一个FaceClient
        AipSpeech client = new AipSpeech(APP_ID, API_KEY, SECRET_KEY);
        // 可选：设置网络连接参数
        client.setConnectionTimeoutInMillis(2000);
        client.setSocketTimeoutInMillis(60000);
        // 调用API
        return synthesis(client, text, options, savePath);
    }

    public static int synthesis(AipSpeech client, String text, HashMap<String, Object> options, String savePath) {
        text = text.replaceAll("\r|\n", "");
        DataOutputStream out = null;
        int status = 0;
        try {
            out = new DataOutputStream(new BufferedOutputStream(new FileOutputStream(savePath, true)));
            for (String str : splitText(text)) {
                TtsResponse res = client.synthesis(str, "zh", 1, options);
                if (res.getResult() != null) {

                }
                out.write(res.getData());
            }
            status = 1;
        } catch (FileNotFoundException e) {
            status = -1;
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
            status = -1;
        } finally {
            try {
                if (out != null)
                    out.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return status;
    }

    public static List<String> splitText(String text) {
        List<String> list = new ArrayList<>();
        int MAX = 300;
        int len = text.length();
        if (len > MAX) {
            int i = len % MAX;
            int j = len / MAX;
            for (int x = 0; x <= j; x++) {
                String str = text.substring(x * MAX, j - 1 < x ? (x * MAX + i) : (x * MAX + MAX));
                list.add(str);
            }
        } else {
            list.add(text);
        }
        return list;
    }
}
