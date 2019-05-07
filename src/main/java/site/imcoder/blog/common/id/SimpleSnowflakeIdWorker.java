package site.imcoder.blog.common.id;

import java.util.HashSet;

/**
 * 不带分布式唯一的单机id生成
 *
 * @author Jeffrey.Deng
 * @date 2018-06-17
 */
public class SimpleSnowflakeIdWorker {

    // ==============================Fields===========================================

    /**
     * 开始时间截 (2016-01-01)，设置为至少两年前，以兼容旧id系统
     */
    private final long twepoch = 1451577600000L;

    /**
     * 序列在id中占的位数
     */
    private final long sequenceBits = 4L;

    /**
     * 时间截向左移4位
     */
    private final long timestampLeftShift = sequenceBits;

    /**
     * 生成序列的掩码
     */
    private final long sequenceMask = -1L ^ (-1L << sequenceBits);

    /**
     * 毫秒内序列
     */
    private long sequence = 0L;

    /**
     * 上次生成ID的时间截
     */
    private long lastTimestamp = -1L;

    //==============================Constructors=====================================

    /**
     * 构造函数
     */
    public SimpleSnowflakeIdWorker() {

    }

    // ==============================Methods==========================================

    /**
     * 获得下一个ID (该方法是线程安全的)
     *
     * @return SnowflakeId
     */
    public synchronized long nextId() {
        long timestamp = timeGen();

        //如果当前时间小于上一次ID生成的时间戳，说明系统时钟回退过这个时候应当抛出异常
        if (timestamp < lastTimestamp) {
            throw new RuntimeException(
                    String.format("Clock moved backwards.  Refusing to generate id for %d milliseconds", lastTimestamp - timestamp));
        }

        //如果是同一时间生成的，则进行毫秒内序列
        if (lastTimestamp == timestamp) {
            sequence = (sequence + 1) & sequenceMask;
            //毫秒内序列溢出
            if (sequence == 0) {
                //阻塞到下一个毫秒,获得新的时间戳
                timestamp = tilNextMillis(lastTimestamp);
            }
        }
        //时间戳改变，毫秒内序列重置
        else {
            sequence = 0L;
        }

        //上次生成ID的时间截
        lastTimestamp = timestamp;

        //移位并通过或运算拼到一起组成64位的ID
        return operationResultId(timestamp - twepoch, timestampLeftShift, sequence);
    }

    /**
     * 阻塞到下一个毫秒，直到获得新的时间戳
     *
     * @param lastTimestamp 上次生成ID的时间截
     * @return 当前时间戳
     */
    protected long tilNextMillis(long lastTimestamp) {
        long timestamp = timeGen();
        while (timestamp <= lastTimestamp) {
            timestamp = timeGen();
        }
        return timestamp;
    }

    /**
     * 返回以毫秒为单位的当前时间
     *
     * @return 当前时间(毫秒)
     */
    protected long timeGen() {
        return System.currentTimeMillis();
    }

    /**
     * 移位并通过或运算拼到一起组成64位的ID
     *
     * @param difference
     * @return
     */
    public long operationResultId(long difference, long timestampLeftShift, long sequence) {
        // 移位并通过或运算拼到一起组成64位的ID
        return ((difference) << timestampLeftShift) //
                | sequence;
    }

    //==============================Test=============================================

    /**
     * 测试
     */
    public static void main(String[] args) {
        SimpleSnowflakeIdWorker idWorker = new SimpleSnowflakeIdWorker();
        HashSet set = new HashSet();
        for (int i = 0; i < 1000000; i++) {
            long id = idWorker.nextId();
            System.out.println(Long.toBinaryString(id));
            System.out.println(id);
            set.add(id);
        }
        System.out.println(set.size());
    }
}
