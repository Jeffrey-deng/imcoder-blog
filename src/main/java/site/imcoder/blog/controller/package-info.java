/**
 * <pre>
 * {@link site.imcoder.blog.controller.view} 此包放置页面请求的controller.
 * {@link site.imcoder.blog.controller.view.old} 此包放置用作重定向老式页面地址格式请求的controller，为了能让以前的地址仍能访问到.
 * {@link site.imcoder.blog.controller.api} 此包放置ajax/api请求的controller.
 *
 * 请求命名约定:
 *      请求加载用 get 前缀
 *      请求列表:
 *          1、组合词尽量用形容词在前修改名词；
 *          2、当请求名为两个名词并列时，需前一个名词修饰后一个，这时复数加s后缀，当这两个名词组合在一起是类名则除外；
 *          3、其余情况一律用List后缀；
 *      返回数据：
 *          1、如果是对象，名词一律用小写开头，并用驼峰；
 *          2、如果是基本类型，则全部小写，单词之间用下划线隔开；
 *          3、如果是列表，一律使用类名驼峰加个后缀s；
 * </pre>
 *
 * @author Jeffrey.Deng
 * @date 2018-04-23
 */
package site.imcoder.blog.controller;