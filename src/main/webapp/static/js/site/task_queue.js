/**
 * 将按队列执行任务
 * 可以队列ajax和普通任务
 * @author Jeffrey.deng
 * @date 2018/4/1
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals
        window.TaskQueue = factory(window.jQuery);
    }
})(function ($) {

    /*  Class: TaskQueue
     *  Constructor: handler
     *      takes a function which will be the task handler to be called,
     *      handler should return Deferred object(not Promise), if not it will run immediately;
     *  methods: append
     *      appends a task to the Queue. Queue will only call a task when the previous task has finished
     *  @author Jeffrey.deng
     */
    var TaskQueue = function (handler) {
        var tasks = [];
        // empty resolved deferred object
        var deferred = $.when();

        // handle the next object
        function handleNextTask() {
            // if the current deferred task has resolved and there are more tasks
            if (deferred.state() == 'resolved' && tasks.length > 0) {
                // grab a task
                var task = tasks.shift();
                // set the deferred to be deferred returned from the handler
                deferred = handler(task);
                // if its not a deferred object then set it to be an empty deferred object
                if (!(deferred && deferred.promise)) {
                    deferred = $.when();
                }
                // if we have tasks left then handle the next one when the current one is done.
                if (tasks.length >= 0) {
                    deferred.fail(function () {
                        tasks = [];
                    });
                    deferred.done(handleNextTask);
                }
            }
        }

        // appends a task.
        this.append = function (task) {
            // add to the array
            tasks.push(task);
            // handle the next task
            handleNextTask();
        };
    };

    return TaskQueue;
});