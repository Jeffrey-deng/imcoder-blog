package site.imcoder.blog.service.impl;

import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import java.io.InputStream;

/**
 * 远程文件系统
 *
 * @author Jeffrey.Deng
 * @date 2018-12-25
 */
public abstract class RemoteFileServiceWrapper implements IFileService {

    // 在实现类中覆盖
    public static String cloud_file_basepath = "";   // 云盘文件存储基础路径
    public static String article_upload_basepath = "blog/";   // 文章上传文件存储基础路径
    public static String trash_recycle_basepath = ".trash/";   // 垃圾回收路径

    /**
     * 保存文本
     *
     * @param text
     * @param fileKey
     * @return
     */
    @Override
    public boolean saveText(String text, String fileKey) {
        return false;
    }

    /**
     * 文件保存
     *
     * @param inputStream 输入流
     * @param fileKey     文件保存路径
     * @return
     */
    @Override
    public boolean save(InputStream inputStream, String fileKey) {
        return false;
    }

    /**
     * 回收<b>文件</b>到trashPathDir目录
     *
     * @param sourceFilePath 源文件远程路径
     * @param trashPathDir   <b>回收站的目录</b>(<b>不可为文件</b>)，相对回收站的路径
     * @return
     */
    @Override
    public abstract boolean recycleTrashFile(String sourceFilePath, String trashPathDir);

    /**
     * 回收<b>文件与目录</b>，且在回收站中建立与sourceRelativePath相同的目录结构
     *
     * @param sourcePathPrefix   需要忽略的路径前缀, 可为null
     * @param sourceRelativePath 源文件相对于前缀的路径，回收站中的目录结构也将使用此结构
     * @param isFile             回收的是不是文件
     */
    @Override
    public abstract boolean recycleTrash(String sourcePathPrefix, String sourceRelativePath, boolean isFile);

    /**
     * 回收<b>文件与目录</b>
     * <p>
     * <code>sourceFullPath</code> 与 <code>trashPath</code> 需要是同一种类型，<b>同为文件</b>或者<b>同为路径</b>;
     * <p>不是同一种请使用
     * <pre>
     *     {@link #recycleTrashFile(String, String)}
     * </pre>
     *
     * @param sourcePath 源文件远程文件路径
     * @param isFile     回收的是不是文件
     * @param trashPath  回收路径，相对回收站的路径
     */
    @Override
    public abstract boolean recycleTrash(String sourcePath, boolean isFile, String trashPath);

    /**
     * 是否时同步模式
     *
     * @return
     */
    protected boolean isSyncMode() {
        return Mode.SYNC.value.equals(Config.get(ConfigConstants.CLOUD_FILE_SYSTEM_MODE));
    }

}
