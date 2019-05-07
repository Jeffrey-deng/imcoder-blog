package site.imcoder.blog.service;

import org.springframework.web.multipart.MultipartFile;
import site.imcoder.blog.service.message.IRequest;
import site.imcoder.blog.service.message.IResponse;

/**
 * @author Jeffrey.Deng
 * @date 2018-05-16
 */
public interface ICloudService {

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
    public IResponse postImage(MultipartFile imageFile, IRequest iRequest);

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
    public IResponse uploadFile(MultipartFile file, String dirPath, String fileName, IRequest iRequest);

}
