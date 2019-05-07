package site.imcoder.blog.service.impl;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.common.Utils;
import site.imcoder.blog.common.id.IdUtil;
import site.imcoder.blog.entity.Photo;
import site.imcoder.blog.entity.User;
import site.imcoder.blog.service.BaseService;
import site.imcoder.blog.service.ICloudService;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import javax.annotation.Resource;
import java.io.IOException;
import java.util.Date;

/**
 * @author Jeffrey.Deng
 * @date 2018-05-16
 */
@Service("cloudService")
public class CloudServiceImpl extends BaseService implements ICloudService {

    private static Logger logger = Logger.getLogger(CloudServiceImpl.class);

    @Resource(name = "fileService")
    private IFileService fileService;

    /**
     * 贴图，用于用户文章评论和用户私信聊天等，
     * 存于 user/{uid}/posts/image/{year}{month}/ 下
     *
     * @param imageFile
     * @param iRequest
     * @return IResponse:
     * status: - 200：成功，400: 参数错误， 401：需要登录，403：没有权限，500：服务器错误
     * image_path: 图片路径
     * image_type: 图片content_type
     * raw_width: 图片宽度
     * raw_height: 图片高度
     * file_size: 图片大小
     */
    @Override
    public IResponse postImage(MultipartFile imageFile, IRequest iRequest) {
        User loginUser = iRequest.getLoginUser();
        IResponse response = new IResponse();
        int flag = STATUS_SUCCESS;
        if (iRequest.isHasNotLoggedIn()) {
            flag = STATUS_NOT_LOGIN;
        } else if (imageFile == null || imageFile.isEmpty() || imageFile.getContentType() == null || imageFile.getContentType().indexOf("image") == -1) {
            flag = STATUS_PARAM_ERROR;
        } else {
            Photo photo = new Photo();
            photo.setOriginName(imageFile.getOriginalFilename());
            String savePath = Config.get(ConfigConstants.CLOUD_FILE_RELATIVEPATH) + IdUtil.convertToShortPrimaryKey(loginUser.getUid()) + "/posts/image/" + Utils.formatDate(new Date(), "yyMM") + "/";
            String fileName = IdUtil.convertToShortPrimaryKey(loginUser.getUid()) + "_" + IdUtil.convertDecimalIdTo62radix(System.currentTimeMillis());
            String ext = null;
            if (Utils.isNotEmpty(photo.getOriginName())) {
                if (photo.getOriginName().lastIndexOf(".") == -1) {
                    photo.setOriginName(photo.getOriginName() + ".jpg");
                    ext = ".jpg";
                } else {
                    ext = photo.getOriginName().substring(photo.getOriginName().lastIndexOf("."));
                }
            } else {
                ext = ".jpg";
                photo.setOriginName(fileName + ext);
            }
            fileName = fileName + ext;
            try {
                boolean result = fileService.savePhotoFile(imageFile.getInputStream(), photo, savePath, fileName);
                if (result) {
                    photo.setPath(savePath + fileName);
                    response.putAttr("image_path", savePath + fileName);
                    response.putAttr("image_cdn_path", Config.get(ConfigConstants.SITE_CLOUD_ADDR) + savePath + fileName);
                    response.putAttr("cdn_path_prefix", Config.get(ConfigConstants.SITE_CLOUD_ADDR));
                    response.putAttr("image_type", photo.getImage_type());
                    response.putAttr("raw_width", photo.getWidth());
                    response.putAttr("raw_height", photo.getHeight());
                    response.putAttr("file_size", photo.getSize());
                    flag = STATUS_SUCCESS;
                } else {
                    flag = STATUS_SERVER_ERROR;
                }
            } catch (IOException e) {
                flag = STATUS_SERVER_ERROR;
                logger.error("云盘Handler / 保存贴图失败：获取流失败： " + e.toString());
            }
        }
        response.setStatus(flag);
        return response;
    }

    /**
     * 上传文件到用户的云空间
     *
     * @param file
     * @param dirPath
     * @param fileName
     * @param iRequest
     * @return IResponse:
     * status: - 200：成功，400: 参数错误， 401：需要登录，403：没有权限，500：服务器错误
     * file_path: 图片路径
     * file_size: 图片大小
     */
    @Override
    public IResponse uploadFile(MultipartFile file, String dirPath, String fileName, IRequest iRequest) {
        return null;
    }
}
