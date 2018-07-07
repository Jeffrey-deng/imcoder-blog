package site.imcoder.blog.cache;

import org.apache.log4j.Logger;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Component;
import site.imcoder.blog.setting.Config;
import site.imcoder.blog.setting.ConfigConstants;

import java.util.Timer;
import java.util.TimerTask;

/**
 * 定时器任务
 * 定时将Cache的缓存数据持久化
 * ------------------------------------------------------------
 * 每隔一段时间检查是否有数据更新，如果有就持久化，如果没有就推迟
 * 且最多推迟 CACHEFLUSH_TIMER_DELAYTIMES 次
 * ------------------------------------------------------------
 *
 * @author dengchao
 * @date 2017-3-22
 */
@Component("flushCacheTimer")
@DependsOn({"configManager"})
public class FlushCacheTimer extends Timer {

    private static Logger logger = Logger.getLogger(FlushCacheTimer.class);

    private TimerTask timerTask;

    public FlushCacheTimer() {
        super("flushCacheTimer");
    }

    public void schedule(final Cache cache) {

        logger.info("缓存定时刷新器 启动！");

        timerTask = new TimerTask() {

            //记录已经推迟的次数
            private int _currentTime = 0;

            @Override
            public void run() {
                //无用户访问且在规定次数内跳过flush
                if (!cache.isHasNewUpdate() && _currentTime != 0) {
                    logger.debug("FlushCacheTimer 忽略了 一次 flush ");
                    _currentTime--;
                    return;
                }

                cache.flush();
                //重置次数(将Cache的缓存持久化的最大推迟次数)
                _currentTime = Config.getInt(ConfigConstants.CACHEFLUSH_TIMER_DELAYTIMES);
            }

        };

        super.schedule(timerTask, Config.getLong(ConfigConstants.CACHEFLUSH_TIMER_DELAY), Config.getLong(ConfigConstants.CACHEFLUSH_TIMER_PERIOD));
        //30*1000 ,30*1000
    }

    /**
     * 停止定时器
     */
    public void stop() {
        logger.info("停止 TimerTask ");
        timerTask.cancel();
        logger.info("停止 FlushCacheTimer ");
        super.cancel();
        super.purge();
    }

    /**
     * 重新启动
     * @param cache
     */
    public void restart(Cache cache) {
        stop();
        schedule(cache);
    }

}
