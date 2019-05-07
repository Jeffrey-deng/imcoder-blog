package site.imcoder.blog.dao;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.support.SqlSessionDaoSupport;
import site.imcoder.blog.common.Utils;

import javax.annotation.Resource;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * @author Jeffrey.Deng
 * @date 2018/7/7
 */
public abstract class CommonDao extends SqlSessionDaoSupport {

    // 业务常量

    public final static String keyword_multiple_match = "#"; // 业务多重匹配分隔符

    public final static String keyword_word_boundary_left = "<"; // 业务左单词边界

    public final static String keyword_word_boundary_right = ">"; // 业务右单词边界

    public final static Pattern keyword_escape_match = Pattern.compile("\\{(.*?[^\\d,].*?)\\}"); //业务转义符

    // MySQL常量

    public final static String joiner_multiple_match = "' and ${column} rlike '"; // SQL多重匹配连接字符串

    public final static String replace_word_boundary_left = "@WD_BR_L"; // {<}或\\< 的替代符，防止被转换

    public final static String replace_word_boundary_right = "@WD_BR_R"; // {>}或\\> 的替代符，防止被转换

    public final static String replace_number_sign = "@NUMBER_SIGN"; // {#}或\\# 的替代符，防止被转换

    public final static String regexp_word_boundary_left = "[[:<:]]"; // 正则左边界符，keyword_word_boundary_left的结果值

    public final static String regexp_word_boundary_right = "[[:>:]]"; // 正则右边界符，keyword_word_boundary_right的结果值

    @Resource
    public void setSqlSessionFactory(SqlSessionFactory sqlSessionFactory) {
        super.setSqlSessionFactory(sqlSessionFactory);
    }

    /**
     * 编码正则表达式
     *
     * @param field 字段名
     * @param value 字段值
     * @return
     */
    public String encodeRegexField(String field, String value) {
        return encodeRegexFieldInMySQL(field, value, true);
    }

    /**
     * 编码正则表达式
     *
     * @param field            字段名
     * @param value            字段值
     * @param supportInjection 是否支持注入
     * @return
     */
    public String encodeRegexField(String field, String value, boolean supportInjection) {
        return encodeRegexFieldInMySQL(field, value, supportInjection);
    }

    /**
     * 编码 MySQL 正则表达式
     *
     * @param field            字段名
     * @param value            字段值
     * @param supportInjection 是否支持注入
     * @return
     */
    public String encodeRegexFieldInMySQL(String field, String value, boolean supportInjection) {
        if (value == null || value.length() == 0) {
            return value;
        }
        if (supportInjection) { // 转义单引号，防止sql注入
            value = value.replace("'", "''");
        }
        if (value.indexOf('<') != -1) {
            // 替换 < 为单词头，替换 > 为单词尾，忽略被转义的 <>
            value = value.replaceAll("\\{<\\}|\\\\\\\\<", replace_word_boundary_left).replaceAll("\\{>\\}|\\\\\\\\>", replace_word_boundary_right);
            value = value.replaceAll(keyword_word_boundary_left, regexp_word_boundary_left).replaceAll(keyword_word_boundary_right, regexp_word_boundary_right);
            value = value.replaceAll(replace_word_boundary_left, "<").replaceAll(replace_word_boundary_right, ">"); // <>MySQL中不是关键字
        }
        if (value.indexOf('{') != -1) { // { }写法时转义MySQL特殊字符
            Matcher keyword_escape_matcher = keyword_escape_match.matcher(value); //只匹配不是重复操作符的
            StringBuffer sb = new StringBuffer();
            while (keyword_escape_matcher.find()) { // 用 \\ 转义
                // 如果是{char}，替换成\\char
                String rs = "";
                for (char ch : keyword_escape_matcher.group(1).toCharArray()) {
                    rs += (ch != '\\' ? ("\\\\" + ch) : "\\\\\\\\"); //如果是{\}，替换成 \\\\
                }
                keyword_escape_matcher.appendReplacement(sb, Matcher.quoteReplacement(rs));
            }
            keyword_escape_matcher.appendTail(sb);
            value = sb.toString();
        }
        value = value.replaceAll("(^[\\|#])|(\\|$)", ""); // 去掉首尾|与首#
        value = value.replaceAll("\\[\\[\\.#\\.\\]\\]|\\\\\\\\#", replace_number_sign); // 忽略被转义的 # 符号
        if (value.indexOf(keyword_multiple_match) != -1) { // #替换为与正则
            String[] multiple_match_splits = Utils.splitNotEmpty(value, keyword_multiple_match);
            if (multiple_match_splits.length == 0) {
                value = "";
            } else if (multiple_match_splits.length == 1) {
                value = multiple_match_splits[0];
            } else if ((multiple_match_splits.length == 2 && value.indexOf('|') == -1) || !supportInjection) { //不支持注入最多支持同时匹配两个值
                value = "(" + multiple_match_splits[0] + ".*" + multiple_match_splits[1] + ")|(" + multiple_match_splits[1] + ".*" + multiple_match_splits[0] + ")";
            } else { // 支持注入可以同时匹配三个以上的值
                StringBuilder three = new StringBuilder();
                String multipleMatchJoiner = getFiledMultipleMatchJoiner(field);
                for (int i = 0; i < multiple_match_splits.length; i++) {
                    if (i == 0) {
                        three.append(multiple_match_splits[i]);
                    } else {
                        three.append(multipleMatchJoiner + multiple_match_splits[i]);
                    }
                }
                value = three.toString();
            }
        }
        value = value.replaceAll(replace_number_sign, "\\\\\\\\#"); //还原
        value = reviseEncodeResult(field, value);
        return value;
    }

    /**
     * 校正处理结果，可通过继承再调整结果值
     *
     * @param field
     * @param value
     * @return
     */
    protected String reviseEncodeResult(String field, String value) {
        return value;
    }

    /**
     * 得到该字段的多重匹配连接符
     *
     * @param filed 字段名
     * @return
     */
    protected String getFiledMultipleMatchJoiner(String filed) {
        return joiner_multiple_match.replace("${column}", filed);
    }


}
