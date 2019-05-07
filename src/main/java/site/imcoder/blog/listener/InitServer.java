package site.imcoder.blog.listener;

import org.apache.log4j.Logger;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Scope;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Service;

/**
 * 服务器启动时处理的事情
 *
 * @author dengchao
 * @date 2017-3-22
 */
@Service
@Scope("singleton")
public class InitServer implements ApplicationListener<ContextRefreshedEvent> {

    private static Logger logger = Logger.getLogger(InitServer.class);

    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        if (event.getApplicationContext().getParent() == null) {
            // event.getApplicationContext().getApplicationName().equals("")
            // logger.info("Init : 执行服务器初始化！");
            // 需要执行的逻辑代码，当spring容器初始化完成后就会执行该方法。
            logger.debug("InitServer run \" Root WebApplicationContext \"");
            logger.info("Init : 服务器执行 初始化 完毕");
        }
    }


}
