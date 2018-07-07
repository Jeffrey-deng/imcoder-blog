package site.imcoder.blog.dao.typehandler;

import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.TypeHandler;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Date;

/**
 * description: mybatis日期转换器
 *
 * @author dengchao
 * @date 2016-8-30
 */
public class DateTypeHandler implements TypeHandler<Date> {

    public Date getResult(ResultSet rs, String column) throws SQLException {
        if (rs.getObject(column) instanceof Long) {
            Date date = new Date(rs.getLong(column));
            return date;
        } else {
            return (Date) rs.getObject(column);
        }
    }

    public Date getResult(ResultSet rs, int column) throws SQLException {
        if (rs.getObject(column) instanceof Long) {
            Date date = new Date(rs.getLong(column));
            return date;
        } else {
            return (Date) rs.getObject(column);
        }
    }

    public Date getResult(CallableStatement arg0, int arg1)
            throws SQLException {
        return null;
    }

    public void setParameter(PreparedStatement stmt, int index, Date date,
                             JdbcType arg3) throws SQLException {
        long time = date.getTime();
        stmt.setLong(index, time);
    }

}
