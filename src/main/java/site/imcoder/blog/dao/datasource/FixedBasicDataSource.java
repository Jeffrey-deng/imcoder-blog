package site.imcoder.blog.dao.datasource;

import org.apache.commons.dbcp2.BasicDataSource;

import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * 修复BasicDataSource类close()的一个Bug。
 * Created by Jeffrey.Deng on 2018/5/2.
 */
public class FixedBasicDataSource extends BasicDataSource {

    @Override
    public synchronized void close() throws SQLException {
        DriverManager.deregisterDriver(DriverManager.getDriver(getUrl()));
        super.close();
    }

}