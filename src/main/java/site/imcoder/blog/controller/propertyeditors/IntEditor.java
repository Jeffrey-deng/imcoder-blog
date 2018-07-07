package site.imcoder.blog.controller.propertyeditors;

import org.springframework.beans.propertyeditors.PropertiesEditor;

/**
 * int 类型转换
 * @author dengchao
 * @date 2016-9-5
 */
public class IntEditor extends PropertiesEditor {

    @Override
    public void setAsText(String text) throws IllegalArgumentException {
        if (text == null || text.equals("")) {
            text = "0";
        }
        setValue(Integer.parseInt(text));
    }

    @Override
    public String getAsText() {
        return getValue().toString();
    }
} 