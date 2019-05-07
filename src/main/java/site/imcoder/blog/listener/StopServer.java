package site.imcoder.blog.listener;

import org.apache.log4j.Logger;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.stereotype.Service;

/**
 * 容器停止事件
 * Created by Jeffrey.Deng on 2017/5/29.
 */
@Service
public class StopServer implements ApplicationListener<ContextClosedEvent> {

    private static Logger logger = Logger.getLogger(StopServer.class);

    @Override
    public void onApplicationEvent(ContextClosedEvent contextClosedEvent) {
        if (contextClosedEvent.getApplicationContext().getParent() == null) {
            // FileCleaner.getInstance().exitWhenFinished();
            logger.info("停止服务器前做一些处理...");
            // System.gc();
        }
    }

}
