package site.imcoder.blog.entity;

import java.io.Serializable;
import java.util.List;

/**
 * Created by Jeffrey.Deng on 2018/2/17.
 */
public class UserSetting implements Serializable {

    private static final long serialVersionUID = 1336765578106043573L;

    private int uid;

    /**
     * 是否接收通知的邮件
     */
    private int receiveInformEmail;

    /**
     * 隐私资料可视级别
     * 0：全部公开
     * 1：好友
     * 2：全部不可见
     */
    private int profileViewLevel;

    /**
     * 主页展示的相片
     */
    private List<Photo> photoShow;

    /**
     * 主页背景图
     */
    private Photo bg_page;

}
