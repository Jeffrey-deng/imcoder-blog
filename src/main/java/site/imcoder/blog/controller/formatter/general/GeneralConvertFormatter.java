package site.imcoder.blog.controller.formatter.general;

import org.springframework.format.Formatter;

import java.text.ParseException;
import java.util.Locale;

/**
 * 通用转换器Formatter
 *
 * @author Jeffrey.Deng
 * @date 2017-12-04
 */
public class GeneralConvertFormatter implements Formatter<Object> {

    private GeneralConvert generalConvert;

    private Converter converter;

    private Class filedClazz;

    public GeneralConvertFormatter() {
    }

    public GeneralConvertFormatter(GeneralConvert generalConvert, Class filedClazz) {
        this.generalConvert = generalConvert;
        this.filedClazz = filedClazz;
        try {
            this.converter = generalConvert.using().newInstance();
        } catch (InstantiationException | IllegalAccessException e) {
            throw new RuntimeException("GeneralConvertFormat反射创建converter实例失败");
        }
    }

    /**
     * 这里可以直接返回Object，是因为后面接受的就是Object
     * {@link org.springframework.format.support.FormattingConversionService.ParserConverter#convert}
     *
     * @param text
     * @param locale
     * @return
     * @throws ParseException
     */
    @Override
    public Object parse(String text, Locale locale) throws ParseException {
        return converter.parse(generalConvert, filedClazz, text);
    }

    @Override
    public String print(Object object, Locale locale) {
        return converter.print(generalConvert, filedClazz, object);
    }

}
