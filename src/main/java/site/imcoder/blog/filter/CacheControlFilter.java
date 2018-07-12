package site.imcoder.blog.filter;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Created by Jeffrey.Deng on 2018/5/9.
 */
public class CacheControlFilter implements Filter {

    /**
     * <p>
     * Wrapping extension of the {@link HttpServletResponse} to yrap the
     * "Start Write Response Body" event.
     * </p>
     * <p>
     * For performance optimization : this extended response holds the
     * {@link #lastModifiedHeader} and {@link #cacheControlHeader} values access
     * to the slow {@link #getHeader(String)} and to spare the {@code string}
     * to {@code date} to {@code long} conversion.
     * </p>
     */
    public class XHttpServletResponse extends HttpServletResponseWrapper {

        /**
         * Value of the {@code Cache-Control} http response header if it has
         * been set.
         */
        private String cacheControlHeader;

        /**
         * Value of the {@code Last-Modified} http response header if it has
         * been set.
         */
        private long lastModifiedHeader;

        private boolean lastModifiedHeaderSet;

        private PrintWriter printWriter;

        private final HttpServletRequest request;

        private ServletOutputStream servletOutputStream;

        /**
         * Indicates whether calls to write methods ({@code write(...)},
         * {@code print(...)}, etc) of the response body have been called or
         * not.
         */
        private boolean writeResponseBodyStarted;

        public XHttpServletResponse(HttpServletRequest request,
                                    HttpServletResponse response) {
            super(response);
            this.request = request;
        }

        @Override
        public void addDateHeader(String name, long date) {
            super.addDateHeader(name, date);
            if (!lastModifiedHeaderSet) {
                this.lastModifiedHeader = date;
                this.lastModifiedHeaderSet = true;
            }
        }

        @Override
        public void addHeader(String name, String value) {
            super.addHeader(name, value);
            if (HEADER_CACHE_CONTROL.equalsIgnoreCase(name) &&
                    cacheControlHeader == null) {
                cacheControlHeader = value;
            }
        }

        public String getCacheControlHeader() {
            return cacheControlHeader;
        }

        public long getLastModifiedHeader() {
            return lastModifiedHeader;
        }

        @Override
        public ServletOutputStream getOutputStream() throws IOException {
            if (servletOutputStream == null) {
                servletOutputStream = new XServletOutputStream(
                        super.getOutputStream(), request, this);
            }
            return servletOutputStream;
        }

        @Override
        public PrintWriter getWriter() throws IOException {
            if (printWriter == null) {
                printWriter = new XPrintWriter(super.getWriter(), request, this);
            }
            return printWriter;
        }

        public boolean isLastModifiedHeaderSet() {
            return lastModifiedHeaderSet;
        }

        public boolean isWriteResponseBodyStarted() {
            return writeResponseBodyStarted;
        }

        @Override
        public void reset() {
            super.reset();
            this.lastModifiedHeader = 0;
            this.lastModifiedHeaderSet = false;
            this.cacheControlHeader = null;
        }

        @Override
        public void setDateHeader(String name, long date) {
            super.setDateHeader(name, date);
            if (HEADER_LAST_MODIFIED.equalsIgnoreCase(name)) {
                this.lastModifiedHeader = date;
                this.lastModifiedHeaderSet = true;
            }
        }

        @Override
        public void setHeader(String name, String value) {
            super.setHeader(name, value);
            if (HEADER_CACHE_CONTROL.equalsIgnoreCase(name)) {
                this.cacheControlHeader = value;
            }
        }

        public void setWriteResponseBodyStarted(boolean writeResponseBodyStarted) {
            this.writeResponseBodyStarted = writeResponseBodyStarted;
        }
    }

    /**
     * Wrapping extension of {@link PrintWriter} to trap the
     * "Start Write Response Body" event.
     */
    public class XPrintWriter extends PrintWriter {
        private final PrintWriter out;

        private final HttpServletRequest request;

        private final XHttpServletResponse response;

        public XPrintWriter(PrintWriter out, HttpServletRequest request,
                            XHttpServletResponse response) {
            super(out);
            this.out = out;
            this.request = request;
            this.response = response;
        }

        @Override
        public PrintWriter append(char c) {
            fireBeforeWriteResponseBodyEvent();
            return out.append(c);
        }

        @Override
        public PrintWriter append(CharSequence csq) {
            fireBeforeWriteResponseBodyEvent();
            return out.append(csq);
        }

        @Override
        public PrintWriter append(CharSequence csq, int start, int end) {
            fireBeforeWriteResponseBodyEvent();
            return out.append(csq, start, end);
        }

        @Override
        public void close() {
            fireBeforeWriteResponseBodyEvent();
            out.close();
        }

        private void fireBeforeWriteResponseBodyEvent() {
            if (!this.response.isWriteResponseBodyStarted()) {
                this.response.setWriteResponseBodyStarted(true);
                onBeforeWriteResponseBody(request, response);
            }
        }

        @Override
        public void flush() {
            fireBeforeWriteResponseBodyEvent();
            out.flush();
        }

        @Override
        public void print(boolean b) {
            fireBeforeWriteResponseBodyEvent();
            out.print(b);
        }

        @Override
        public void print(char c) {
            fireBeforeWriteResponseBodyEvent();
            out.print(c);
        }

        @Override
        public void print(char[] s) {
            fireBeforeWriteResponseBodyEvent();
            out.print(s);
        }

        @Override
        public void print(double d) {
            fireBeforeWriteResponseBodyEvent();
            out.print(d);
        }

        @Override
        public void print(float f) {
            fireBeforeWriteResponseBodyEvent();
            out.print(f);
        }

        @Override
        public void print(int i) {
            fireBeforeWriteResponseBodyEvent();
            out.print(i);
        }

        @Override
        public void print(long l) {
            fireBeforeWriteResponseBodyEvent();
            out.print(l);
        }

        @Override
        public void print(Object obj) {
            fireBeforeWriteResponseBodyEvent();
            out.print(obj);
        }

        @Override
        public void print(String s) {
            fireBeforeWriteResponseBodyEvent();
            out.print(s);
        }

        @Override
        public PrintWriter printf(Locale l, String format, Object... args) {
            fireBeforeWriteResponseBodyEvent();
            return out.printf(l, format, args);
        }

        @Override
        public PrintWriter printf(String format, Object... args) {
            fireBeforeWriteResponseBodyEvent();
            return out.printf(format, args);
        }

        @Override
        public void println() {
            fireBeforeWriteResponseBodyEvent();
            out.println();
        }

        @Override
        public void println(boolean x) {
            fireBeforeWriteResponseBodyEvent();
            out.println(x);
        }

        @Override
        public void println(char x) {
            fireBeforeWriteResponseBodyEvent();
            out.println(x);
        }

        @Override
        public void println(char[] x) {
            fireBeforeWriteResponseBodyEvent();
            out.println(x);
        }

        @Override
        public void println(double x) {
            fireBeforeWriteResponseBodyEvent();
            out.println(x);
        }

        @Override
        public void println(float x) {
            fireBeforeWriteResponseBodyEvent();
            out.println(x);
        }

        @Override
        public void println(int x) {
            fireBeforeWriteResponseBodyEvent();
            out.println(x);
        }

        @Override
        public void println(long x) {
            fireBeforeWriteResponseBodyEvent();
            out.println(x);
        }

        @Override
        public void println(Object x) {
            fireBeforeWriteResponseBodyEvent();
            out.println(x);
        }

        @Override
        public void println(String x) {
            fireBeforeWriteResponseBodyEvent();
            out.println(x);
        }

        @Override
        public void write(char[] buf) {
            fireBeforeWriteResponseBodyEvent();
            out.write(buf);
        }

        @Override
        public void write(char[] buf, int off, int len) {
            fireBeforeWriteResponseBodyEvent();
            out.write(buf, off, len);
        }

        @Override
        public void write(int c) {
            fireBeforeWriteResponseBodyEvent();
            out.write(c);
        }

        @Override
        public void write(String s) {
            fireBeforeWriteResponseBodyEvent();
            out.write(s);
        }

        @Override
        public void write(String s, int off, int len) {
            fireBeforeWriteResponseBodyEvent();
            out.write(s, off, len);
        }

    }

    /**
     * Wrapping extension of {@link ServletOutputStream} to trap the
     * "Start Write Response Body" event.
     */
    public class XServletOutputStream extends ServletOutputStream {

        private final HttpServletRequest request;

        private final XHttpServletResponse response;

        private final ServletOutputStream servletOutputStream;

        public XServletOutputStream(ServletOutputStream servletOutputStream,
                                    HttpServletRequest request, XHttpServletResponse response) {
            super();
            this.servletOutputStream = servletOutputStream;
            this.response = response;
            this.request = request;
        }

        @Override
        public void close() throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.close();
        }

        private void fireOnBeforeWriteResponseBodyEvent() {
            if (!this.response.isWriteResponseBodyStarted()) {
                this.response.setWriteResponseBodyStarted(true);
                onBeforeWriteResponseBody(request, response);
            }
        }

        @Override
        public void flush() throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.flush();
        }

        @Override
        public void print(boolean b) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.print(b);
        }

        @Override
        public void print(char c) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.print(c);
        }

        @Override
        public void print(double d) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.print(d);
        }

        @Override
        public void print(float f) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.print(f);
        }

        @Override
        public void print(int i) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.print(i);
        }

        @Override
        public void print(long l) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.print(l);
        }

        @Override
        public void print(String s) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.print(s);
        }

        @Override
        public void println() throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.println();
        }

        @Override
        public void println(boolean b) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.println(b);
        }

        @Override
        public void println(char c) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.println(c);
        }

        @Override
        public void println(double d) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.println(d);
        }

        @Override
        public void println(float f) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.println(f);
        }

        @Override
        public void println(int i) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.println(i);
        }

        @Override
        public void println(long l) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.println(l);
        }

        @Override
        public void println(String s) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.println(s);
        }

        @Override
        public void write(byte[] b) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.write(b);
        }

        @Override
        public void write(byte[] b, int off, int len) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.write(b, off, len);
        }

        @Override
        public void write(int b) throws IOException {
            fireOnBeforeWriteResponseBodyEvent();
            servletOutputStream.write(b);
        }

        /**
         * TODO SERVLET 3.1
         */
        @Override
        public boolean isReady() {
            return false;
        }

        /**
         * TODO SERVLET 3.1
         */
        @Override
        public void setWriteListener(WriteListener listener) {
        }


    }

    private static final Pattern commaSeparatedValuesPattern = Pattern.compile("\\s*,\\s*");

    private static final String HEADER_CACHE_CONTROL = "Cache-Control";

    private static final String HEADER_EXPIRES = "Expires";

    private static final String HEADER_LAST_MODIFIED = "Last-Modified";

    private static final String PARAMETER_EXPIRES_BY_TYPE = "ExpiresByType";

    private static final String PARAMETER_EXPIRES_DEFAULT = "ExpiresDefault";

    private static final String PARAMETER_EXPIRES_EXCLUDED_RESPONSE_STATUS_CODES = "ExpiresExcludedResponseStatusCodes";

    private FilterConfig config = null;

    private String[] excludedPageArray;

    private Map<String, String> expiresConfigurationByContentType = new LinkedHashMap<>();

    private int[] excludedResponseStatusCodes;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        this.config = filterConfig;
        excludedPageArray = commaDelimitedListToStringArray(filterConfig.getInitParameter("ExcludedPages"));
        excludedResponseStatusCodes = commaDelimitedListToIntArray(filterConfig.getInitParameter(PARAMETER_EXPIRES_EXCLUDED_RESPONSE_STATUS_CODES));

        for (Enumeration<String> names = filterConfig.getInitParameterNames(); names.hasMoreElements(); ) {
            String name = names.nextElement();
            String value = filterConfig.getInitParameter(name);
            value = (isNotEmpty(value) ? value : "public");
            try {
                if (name.startsWith("ExpiresByType")) {
                    String contentType = name.substring(PARAMETER_EXPIRES_BY_TYPE.length()).trim().toLowerCase();
                    expiresConfigurationByContentType.put(contentType, value);
                }
            } catch (RuntimeException e) {
                throw new ServletException("expiresFilter.exceptionProcessingParameter", e);
            }
        }
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        if (request instanceof HttpServletRequest &&
                response instanceof HttpServletResponse) {
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            HttpServletResponse httpResponse = (HttpServletResponse) response;

            if (response.isCommitted()) {
                chain.doFilter(request, response);
            } else {
                XHttpServletResponse xResponse = new XHttpServletResponse(httpRequest, httpResponse);
                chain.doFilter(request, xResponse);
                if (!xResponse.isWriteResponseBodyStarted()) {
                    // Empty response, manually trigger
                    // onBeforeWriteResponseBody()
                    onBeforeWriteResponseBody(httpRequest, xResponse);
                }
            }
        } else {
            chain.doFilter(request, response);
        }
    }

    @Override
    public void destroy() {

    }

    public void onBeforeWriteResponseBody(HttpServletRequest request, XHttpServletResponse response) {

        if (isEligibleToExpirationHeaderGeneration(request, response)) {
            String contentType = response.getContentType();
            if (contentType != null) {
                contentType = contentType.toLowerCase(Locale.ENGLISH);
            }

            // lookup exact content-type match (e.g.
            // "text/html; charset=iso-8859-1")
            String value = expiresConfigurationByContentType.get(contentType);
            if (value != null) {
                response.addHeader("Cache-Control", value);
                return;
            }

            if (contains(contentType, ";")) {
                // lookup content-type without charset match (e.g. "text/html")
                String contentTypeWithoutCharset = substringBefore(contentType, ";").trim();
                value = expiresConfigurationByContentType.get(contentTypeWithoutCharset);
                if (value != null) {
                    response.addHeader("Cache-Control", value);
                    return;
                }
            }

            if (contains(contentType, "/")) {
                // lookup major type match (e.g. "text")
                String majorType = substringBefore(contentType, "/");
                value = expiresConfigurationByContentType.get(majorType);
                if (value != null) {
                    response.addHeader("Cache-Control", value);
                    return;
                }
            }

            if (value == null) {
                System.out.println("value null " + contentType);
                for (Map.Entry<String, String> entry : expiresConfigurationByContentType.entrySet()) {
                    System.out.println(entry.getKey() + ":" + entry.getValue());
                }
            }
        }
    }

    protected boolean isEligibleToExpirationHeaderGeneration(HttpServletRequest request, XHttpServletResponse response) {

        boolean expirationHeaderHasBeenSet = response.containsHeader(HEADER_EXPIRES) || contains(response.getCacheControlHeader(), "max-age");
        if (expirationHeaderHasBeenSet) {
            return false;
        }

        for (String excludedPage : this.excludedPageArray) {
            if (startsWithIgnoreCase(excludedPage, "*.")) {
                if (excludedPage.length() > 2) {
                    if (request.getServletPath().endsWith(excludedPage.substring(2))) {
                        return false;
                    }
                }
            }
            if (request.getServletPath().equals(excludedPage)) {
                return false;
            }
        }

        for (int skippedStatusCode : this.excludedResponseStatusCodes) {
            if (response.getStatus() == skippedStatusCode) {
                return false;
            }
        }

        return true;
    }

    protected static int[] commaDelimitedListToIntArray(String commaDelimitedInts) {
        String[] intsAsStrings = commaDelimitedListToStringArray(commaDelimitedInts);
        int[] ints = new int[intsAsStrings.length];
        for (int i = 0; i < intsAsStrings.length; i++) {
            String intAsString = intsAsStrings[i];
            try {
                ints[i] = Integer.parseInt(intAsString);
            } catch (NumberFormatException e) {
                throw new RuntimeException("Exception parsing number '" + i +
                        "' (zero based) of comma delimited list '" +
                        commaDelimitedInts + "'");
            }
        }
        return ints;
    }

    protected static String[] commaDelimitedListToStringArray(String commaDelimitedStrings) {
        return (commaDelimitedStrings == null || commaDelimitedStrings.length() == 0) ? new String[0]
                : commaSeparatedValuesPattern.split(commaDelimitedStrings);
    }

    protected static boolean contains(String str, String searchStr) {
        if (str == null || searchStr == null) {
            return false;
        }
        return str.indexOf(searchStr) >= 0;
    }

    protected static boolean startsWithIgnoreCase(String string, String prefix) {
        if (string == null || prefix == null) {
            return string == null && prefix == null;
        }
        if (prefix.length() > string.length()) {
            return false;
        }
        return string.regionMatches(true, 0, prefix, 0, prefix.length());
    }

    protected static String substringBefore(String str, String separator) {
        if (str == null || str.isEmpty() || separator == null) {
            return null;
        }

        if (separator.isEmpty()) {
            return "";
        }

        int separatorIndex = str.indexOf(separator);
        if (separatorIndex == -1) {
            return str;
        }
        return str.substring(0, separatorIndex);
    }

    public static boolean isEmpty(String str) {
        return str == null || str.length() == 0;
    }

    public static boolean isNotEmpty(String str) {
        return !isEmpty(str);
    }

}
