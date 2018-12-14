package site.imcoder.blog.filter;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.zip.GZIPOutputStream;

/**
 * 为添加了response头Content-Encoding: gzip的请求，对输出进行gzip压缩
 *
 * @author Jeffrey.Deng
 * @date 2018-12-22
 */
public class CompressFilter implements Filter {

    private final static String ACCEPT_ENCODING = "accept-encoding";
    private final static String CONTENT_ENCODING = "Content-Encoding";
    private final static String GZIP = "gzip";

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {

    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        String acceptEncoding = request.getHeader(ACCEPT_ENCODING);
        if (acceptEncoding != null) {
            //searching for 'gzip' in ACCEPT_ENCODING header
            if (acceptEncoding.indexOf(GZIP) >= 0) {
                GZIPResponseWrapper gzipResponse = this.new GZIPResponseWrapper(response);
                try {
                    chain.doFilter(request, gzipResponse);
                } catch (IOException e) {
                    throw e;
                } catch (ServletException e) {
                    throw e;
                } finally {
                    gzipResponse.finishResponse();
                }
                return;
            }
        }
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {

    }

    // 自定义response包装
    public class GZIPResponseWrapper extends HttpServletResponseWrapper {

        protected HttpServletResponse originResponse = null; // 原response
        protected ServletOutputStream stream = null;    // 输出流
        protected PrintWriter writer = null;

        public GZIPResponseWrapper(HttpServletResponse originResponse) {
            super(originResponse);
            this.originResponse = originResponse;
        }

        public ServletOutputStream createOutputStream() throws IOException {
            if (GZIP.equals(originResponse.getHeader(CONTENT_ENCODING))) {
                return (CompressFilter.this.new GZIPResponseStream(originResponse.getOutputStream())); // 如果指定了gzip输出编码（添加了@GZIP自定义注解），返回gzip输出流
            } else {
                return originResponse.getOutputStream(); // 返回原生输出流
            }
        }

        public void finishResponse() {
            try {
                if (writer != null) {
                    writer.close();
                } else {
                    if (stream != null) {
                        stream.close();
                    }
                }
            } catch (IOException e) {
            }
        }

        @Override
        public void flushBuffer() throws IOException {
            if (stream != null) {
                stream.flush();
            }
        }

        @Override
        public ServletOutputStream getOutputStream() throws IOException {
            if (writer != null) {
                throw new IllegalStateException("getWriter() has already been called!");
            }
            if (stream == null) {
                stream = createOutputStream();
            }
            return stream;
        }

        @Override
        public PrintWriter getWriter() throws IOException {
            if (writer != null) {
                return writer;
            }
            if (stream != null) {
                throw new IllegalStateException("getOutputStream() has already been called!");
            }
            stream = createOutputStream();
            writer = new PrintWriter(new OutputStreamWriter(stream, originResponse.getCharacterEncoding()));
            return writer;
        }

    }

    // gzip输出流，写入地为OutputStream
    public class GZIPResponseStream extends ServletOutputStream {

        protected GZIPOutputStream gzipStream;
        protected final AtomicBoolean open = new AtomicBoolean(false);
        protected OutputStream output;
        protected WriteListener writeListener;

        public GZIPResponseStream(OutputStream output) throws IOException {
            this.output = output;
            gzipStream = new GZIPOutputStream(output); // 传入输出流，gzip将直接输出给tomcat
            open.set(true);
        }

        public boolean isClosed() {
            return !open.get();
        }

        @Override
        public void close() throws IOException {
            if (open.compareAndSet(true, false)) {
                // gzip关闭时也会将输出流关闭
                gzipStream.close();
            }
        }

        @Override
        public void flush() throws IOException {
            gzipStream.flush();
        }

        @Override
        public void write(byte b[]) throws IOException {
            write(b, 0, b.length);
        }

        @Override
        public void write(byte b[], int off, int len) throws IOException {
            try {
                if (writeListener != null) {
                    writeListener.onWritePossible();
                }
                if (!open.get()) {
                    throw new IOException("Stream closed!");
                }
                gzipStream.write(b, off, len);
            } catch (IOException e) {
                if (writeListener != null) {
                    writeListener.onError(e);
                }
            }
        }

        @Override
        public void write(int b) throws IOException {
            try {
                if (writeListener != null) {
                    writeListener.onWritePossible();
                }
                if (!open.get()) {
                    throw new IOException("Stream closed!");
                }
                gzipStream.write(b);
            } catch (IOException e) {
                if (writeListener != null) {
                    writeListener.onError(e);
                }
            }
        }

        @Override
        public boolean isReady() {
            return open.get();
        }

        @Override
        public void setWriteListener(WriteListener writeListener) {
            this.writeListener = writeListener;
        }
    }

}
