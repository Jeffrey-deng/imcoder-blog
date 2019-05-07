package site.imcoder.blog.common;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;

/**
 * 文件工具类
 *
 * @author dengchao
 * @date 2017-3-22
 */
public class FileUtil {

    public static byte[] downloadBytesFormUrl(String urlStr, int timeout) throws IOException {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        //设置超时间为3秒
        conn.setConnectTimeout(timeout);
        //防止屏蔽程序抓取而返回403错误
        conn.setRequestProperty("User-Agent", "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; DigExt)");
        conn.setRequestProperty("Referer", url.getProtocol() + "://" + url.getHost());
        //得到输入流
        InputStream inputStream = null;
        try {
            inputStream = conn.getInputStream();
            //获取自己数组
            byte[] bytesData = readInputStream(inputStream);
            return bytesData;
        } catch (IOException e) {
            throw e;
        }
    }

    /**
     * 从输入流中获取字节数组
     *
     * @param inputStream
     * @return
     * @throws IOException
     */
    public static byte[] readInputStream(InputStream inputStream) throws IOException {
        ByteArrayOutputStream bos = null;
        try {
            byte[] buffer = new byte[8192];
            int len = 0;
            bos = new ByteArrayOutputStream();
            while ((len = inputStream.read(buffer)) != -1) {
                bos.write(buffer, 0, len);
            }
            return bos.toByteArray();
        } catch (IOException e) {
            throw e;
        } finally {
            try {
                if (bos != null) {
                    bos.close();
                }
                if (inputStream != null) {
                    inputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * 从网络Url中下载文件
     *
     * @param urlStr
     * @param fileName
     * @param savePath
     * @throws IOException
     */
    public static void downloadFromUrl(String urlStr, String savePath, String fileName) throws IOException {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        //设置超时间为3秒
        conn.setConnectTimeout(3 * 1000);
        //防止屏蔽程序抓取而返回403错误
        conn.setRequestProperty("User-Agent", "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; DigExt)");
        conn.setRequestProperty("Referer", url.getProtocol() + "://" + url.getHost());
        //得到输入流
        InputStream inputStream = null;
        FileOutputStream out = null;
        try {
            inputStream = conn.getInputStream();
            //文件保存位置
            File saveDir = new File(savePath);
            if (!saveDir.exists()) {
                saveDir.mkdirs();
            }
            File file = new File(savePath + File.separator + fileName);
            byte[] buffer = new byte[10240];
            int len = 0;
            out = new FileOutputStream(file);
            while ((len = inputStream.read(buffer)) != -1) {
                out.write(buffer, 0, len);
            }
        } catch (IOException e) {
            throw e;
        } finally {
            if (out != null) {
                out.close();
            }
            if (inputStream != null) {
                inputStream.close();
            }
        }
    }

    /**
     * 计算文件md5
     *
     * @param path
     * @return
     */
    public static String getMD5Value(String path) {
        return getMD5Value(new File(path));
    }

    public static String getMD5Value(File file) {
        if (!file.exists() || !file.isFile()) {
            return null;
        }
        try {
            FileInputStream input = new FileInputStream(file);
            return getMD5Value(input);
        } catch (FileNotFoundException e) {
            e.printStackTrace();
            return null;
        }
    }

    public static String getMD5Value(InputStream input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] buff = new byte[16384];
            int len = 0;
            while ((len = input.read(buff)) != -1) {
                md.update(buff, 0, len);
            }
            return new String(Utils.encodeHex(md.digest()));
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            try {
                if (input != null) {
                    input.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * 校验该文件md5
     *
     * @param file
     * @param md5Value
     * @return
     */
    public static boolean compareMD5Value(File file, String md5Value) {
        if (!file.exists() || !file.isFile()) {
            return false;
        }
        String value = getMD5Value(file);
        if (value == null) {
            return false;
        } else if (value.equals(md5Value)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 比较两文件是否相等
     *
     * @param one
     * @param other
     * @return
     */
    public static boolean compareMD5Value(File one, File other) {
        if (!one.exists() || !other.exists()) {
            return false;
        }
        if (!one.isFile() || !other.isFile()) {
            return false;
        }
        if (one.length() != other.length()) {
            return false;
        }
        return compareMD5Value(other, getMD5Value(one));
    }

    public static void copy(InputStream inputStream, String outputFilePath) throws IOException {
        FileOutputStream outputStream = new FileOutputStream(outputFilePath);
        copy(inputStream, outputStream);
    }

    public static void copy(InputStream inputStream, File outputFile) throws IOException {
        FileOutputStream outputStream = new FileOutputStream(outputFile);
        copy(inputStream, outputStream);
    }

    public static void copy(InputStream inputStream, OutputStream outputStream) throws IOException {
        byte[] buff = new byte[16384];
        int len = 0;
        try {
            while ((len = inputStream.read(buff)) != -1) {
                outputStream.write(buff, 0, len);
            }
        } catch (IOException e) {
            throw e;
        } finally {
            try {
                if (inputStream != null) {
                    inputStream.close();
                }
                if (outputStream != null) {
                    outputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

}
