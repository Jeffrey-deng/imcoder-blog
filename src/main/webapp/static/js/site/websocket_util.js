/**
 * WebSocket工具类
 * 实现
 *      1、WebSocket心跳重连
 *      2、只需根据mapping名注册事件就可接收后台对应的推送消息
 * @author Jeffrey.Deng
 * @date 2018-01-25
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'globals', 'common_utils'], factory);
    } else {
        // Browser globals
        window.websocket_util = factory(window.jQuery, globals, common_utils);
    }
})(function ($, globals, common_utils) {

    /**
     * `WebsocketHeartbeatJs` constructor.
     *
     * @param {Object} opts
     * {
     *  {String} url - websocket链接地址
     *  {Number} pingTimeout - 未收到消息多少秒之后发送ping请求，默认15000毫秒
     *  {Number} pongTimeout - 发送ping之后，未收到消息超时时间，默认10000毫秒
     *  {Number} reconnectInterval - 重连间隔
     *  {Number} inactiveInterval - 检查页面活跃状态间隔
     *  {String|Function} pingMsg - ping消息字符串，可用方法 function(isAvailable,isPageActive) 生成，
     * }
     */
    function WebsocketHeartbeatJs(options) {
        options = options || {};
        this.opts = {
            url: options.url,
            pingTimeout: options.pingTimeout || 15000,
            pongTimeout: options.pongTimeout || 10000,
            reconnectInterval: options.reconnectInterval || 2000,
            inactiveInterval: options.inactiveInterval || 300000,
            pingMsg: options.pingMsg || 'ping',
        };
        this.ws = null;//websocket实例
        this.isAvailable = false;  // 链接是否可用
        this.isPageActive = !document.hidden;   // 页面是否活跃
        // override hook function
        this.onclose = function (event) {
        };
        this.onerror = function (e) {
        };
        this.onopen = function (event) {
        };
        this.onmessage = function (event) {
        };
        this.onreconnect = function (textStatus) {
        };
        this.createWebSocket();
        WebsocketHeartbeatJs.instance = this;
    }

    // 创建WebSocket对象，并绑定事件
    WebsocketHeartbeatJs.prototype.createWebSocket = function () {
        var _self = this;
        try {
            _self.isAvailable = false;  // 链接是否可用
            // 判断当前浏览器是否支持WebSocket
            if ('WebSocket' in window) {
                _self.ws = new WebSocket(_self.opts.url);
            } else if ('MozWebSocket' in window) {
                _self.ws = new MozWebSocket(_self.opts.url);
            } else {
                console.log('当前浏览器 Not support websocket')
            }
            if (_self.ws != null) {
                _self.initEventHandle();
            }
        } catch (e) {
            _self.reconnect('exception');
            throw e;
        }
    };
    // 绑定事件
    WebsocketHeartbeatJs.prototype.initEventHandle = function () {
        var _self = this;
        _self.ws.onclose = function (event) {
            _self.isAvailable = false;
            _self.onclose(event);
            _self.reconnect('close');
        };
        _self.ws.onerror = function (e) {
            _self.isAvailable = false;
            _self.onerror(e);
            _self.reconnect('error');
        };
        _self.ws.onopen = function (event) {
            _self.isAvailable = true;
            _self.onopen(event);
            // 心跳检测重置
            _self.heartCheck();
        };
        _self.ws.onmessage = function (event) {
            _self.onmessage(event);
            // 如果获取到消息，心跳检测重置
            // 拿到任何消息都说明当前连接是正常的
            _self.heartCheck();
        };

        // 注册事件监控当设备从睡眠中唤醒时执行，启动重连
        // 各种浏览器兼容
        var hidden, state, visibilityChange;
        if (typeof document.hidden !== 'undefined') {
            hidden = "hidden";
            visibilityChange = "visibilitychange";
            state = "visibilityState";
        } else if (typeof document.webkitHidden !== 'undefined') {
            hidden = "webkitHidden";
            visibilityChange = "webkitvisibilitychange";
            state = "webkitVisibilityState";
        } else if (typeof document.mozHidden !== 'undefined') {
            hidden = "mozHidden";
            visibilityChange = "mozvisibilitychange";
            state = "mozVisibilityState";
        } else if (typeof document.msHidden !== 'undefined') {
            hidden = "msHidden";
            visibilityChange = "msvisibilitychange";
            state = "msVisibilityState";
        }
        _self.visibilityHiddenKey = hidden;
        _self.visibilityStateKey = state;
        _self.visibilityChangeKey = visibilityChange;
        // 添加标签激活状态改变监听器
        document.removeEventListener(visibilityChange, wakeUp);
        document.addEventListener(visibilityChange, wakeUp, false);

        // 监控页面是否活跃事件
        _self.resetInActiveTimer = function (interval) {
            _self.inactive_timer && window.clearInterval(_self.inactive_timer);
            _self.inactive_timer = window.setInterval(function () {  // 定时器隐藏控制条
                _self.isPageActive = false;
            }, interval || _self.opts.inactiveInterval);
            return _self.inactive_timer;
        };
        _self.resetInActiveTimer();
        $(document).on('mouseover', function (e) {
            if (!_self.inactive_timer) {
                _self.resetInActiveTimer();
            }
            _self.isPageActive = true;
        }).on('click', function (e) {
            if (!_self.inactive_timer) {
                _self.resetInActiveTimer();
            }
            _self.isPageActive = true;
        }).on('scroll', function (e) {
            if (!_self.inactive_timer) {
                _self.resetInActiveTimer();
            }
            _self.isPageActive = true;
        });
    };
    // 重新连接
    WebsocketHeartbeatJs.prototype.reconnect = function (textStatus, force) {
        var _self = this;
        if (!force && (_self.lockReconnect || _self.forbidReconnect)) return;
        _self.lockReconnect = true;
        _self.close();
        _self.forbidReconnect = false;
        _self.onreconnect(textStatus);
        // 一般在断网后，浏览器会触发onclose或onerror方法，从而触发reconnect，没连接上会循环重连，
        // 为避免请求过多，设置延迟
        _self.reconnectTimeoutId && clearTimeout(_self.reconnectTimeoutId);
        _self.reconnectTimeoutId = setTimeout(function () {
            _self.reconnectTimeoutId = null;
            _self.lockReconnect = false;
            _self.createWebSocket();
        }, _self.opts.reconnectInterval);
    };
    // 发送消息
    WebsocketHeartbeatJs.prototype.send = function (msg) {
        this.ws.send(msg);
    };
    // 心跳检测
    WebsocketHeartbeatJs.prototype.heartCheck = function () {
        try {
            this.heartReset();
            this.heartStart();
        } catch (e) {
        }
    };
    // 重新启动计时器
    WebsocketHeartbeatJs.prototype.heartStart = function () {
        var _self = this;
        if (_self.forbidReconnect) return; // 设置关闭重连就不再执行心跳
        _self.pingTimeoutId = setTimeout(function () {
            // 这里发送一个心跳，后端收到后，返回一个心跳消息，
            // onmessage拿到返回的心跳就说明连接正常，断网则发送不成功，浏览器会触发ws.onclose,从而触发reconnect
            if (typeof _self.opts.pingMsg == 'function') {
                _self.ws.send(_self.opts.pingMsg.call(_self, _self.isAvailable, _self.isPageActive));
            } else {
                _self.ws.send(_self.opts.pingMsg);
            }
            // 如果超过一定时间还没重置，说明后端主动断开了
            _self.pongTimeoutId = setTimeout(function () {
                // 如果onclose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onclose导致重连两次
                _self.ws.close();
            }, _self.opts.pongTimeout);
        }, _self.opts.pingTimeout);
    };
    // 清除计时器
    WebsocketHeartbeatJs.prototype.heartReset = function () {
        clearTimeout(this.pingTimeoutId);
        clearTimeout(this.pongTimeoutId);
    };
    // 当设备从睡眠中唤醒时执行
    var wakeUp = function () {
        var _self = WebsocketHeartbeatJs.instance;
        // 当连接不可用，且标签被激活时
        if (_self != null && !_self.isAvailable && document[_self.visibilityStateKey] == 'visible' && !_self.forbidReconnect) {
            // 重新连接
            _self.reconnect('wakeUp', true);
        }
        if (document[_self.visibilityHiddenKey]) {
            _self.isPageActive = false;
            if (_self.inactive_timer) {
                clearInterval(_self.inactive_timer);
                _self.inactive_timer = null;
            }
        } else {
            _self.isPageActive = true;
            if (!_self.inactive_timer) {
                _self.resetInActiveTimer();
            }
        }
    };
    // 关闭连接
    WebsocketHeartbeatJs.prototype.close = function () {
        // 如果设置关闭重连，不再重连
        this.forbidReconnect = true;
        this.heartReset();
        this.ws.close();
    };

    /* -------------------------------------------------------------------------- */

    var pointer = {
        webSocket: null
    };

    var config = {
        wsUrl: "ws://localhost:8080/blog/subscribe",
        heartbeat: {
            pingTimeout: 15000,
            pongTimeout: 10000,
            reconnectInterval: 7000,
            inactiveInterval: 300000,
            pingPageActiveMsg: JSON.stringify({"mapping": "ping", "text": "active"}),
            pingPageInActiveMsg: JSON.stringify({"mapping": "ping", "text": "inactive"}),
            pingMsg: function (isAvailable, isPageActive) {
                if (isPageActive) {
                    return config.heartbeat.pingPageActiveMsg;
                } else {
                    return config.heartbeat.pingPageInActiveMsg;
                }
            }
        },
        event: {
            connectionOpen: "connection.open",
            connectionClose: "connection.close",
            connectionError: "connection.error",
            messagePost: "message.post",
            messageReceive: "message.receive"
        }
    };

    var init = function (options) {
        $.extendNotNull(true, config, options);
        var basePath = globals.path_params.basePath;
        if (!basePath) {
            basePath = document.location.origin + document.location.pathname.replace(/[^\/]*?$/, '');
        }
        if (!basePath.match(/\/$/)) {
            basePath = basePath + '/';
        }
        if (basePath.indexOf('https') == 0) {
            config.wsUrl = basePath.replace(/^https/, 'wss') + 'subscribe';
        } else {
            config.wsUrl = basePath.replace(/^http/, 'ws') + 'subscribe';
        }
        createWebSocket();   //连接ws
    };

    function createWebSocket() {
        try {
            pointer.webSocket = new WebsocketHeartbeatJs({
                url: config.wsUrl,
                pingTimeout: config.heartbeat.pingTimeout,
                pongTimeout: config.heartbeat.pongTimeout,
                reconnectInterval: config.heartbeat.reconnectInterval,
                inactiveInterval: config.heartbeat.inactiveInterval,
                pingMsg: config.heartbeat.pingMsg
            });
            initEventHandle();
        } catch (e) {
            //console.log(e);
        }
    }

    function initEventHandle() {

        //连接成功建立的回调方法
        pointer.webSocket.onopen = function (event) {
            context.trigger(config.event.connectionOpen, event);
        };

        //接收到消息的回调方法
        pointer.webSocket.onmessage = function (wsEvent) {
            try {
                if (!wsEvent.data) {
                    return;
                }
                var message = JSON.parse(wsEvent.data);
                if (!message) {
                    return;
                }
                if (message.mapping == 'forbidden') {   // 如果拒绝连接
                    var time = common_utils.formatDate(new Date(), 'hh:mm:ss');
                    pointer.webSocket.close();
                    console.log('websocket connection 强制下线 at ' + time);
                } else if (message.mapping && message.mapping != 'pong') { // 过滤掉ping消息的返回消息pong
                    // 调用绑定该mapping的事件
                    context.trigger(config.event.messageReceive + '.' + message.mapping, message, wsEvent);
                }
            } catch (e) {
                console.warn('handle message of server pushing find exception', e);
            }
        };

        //连接发生错误的回调方法
        pointer.webSocket.onerror = function (e) {
            var time = common_utils.formatDate(new Date(), 'hh:mm:ss');
            console.log('websocket an error occurred at ' + time);
            context.trigger(config.event.connectionError, e);
        };

        //连接关闭的回调方法
        pointer.webSocket.onclose = function (event) {
            var time = common_utils.formatDate(new Date(), 'hh:mm:ss');
            console.log('websocket connection disconnect from server at ' + time);
            context.trigger(config.event.connectionClose, event);
        };

        //连接重连的回调方法
        pointer.webSocket.onreconnect = function (textStatus) {
            var time = common_utils.formatDate(new Date(), 'hh:mm:ss');
            if (textStatus == 'wakeUp') {
                console.log('websocket wake up and reconnection server at ' + time);
            } else {
                console.log('websocket reconnection server at ' + time);
            }
        };

        //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
        window.addEventListener('beforeunload', function () {
            pointer.webSocket.close();
        });
    }

    // 发送消息
    // 当连接ready之后才可以使用post方法
    var post = function (wsMessage) {
        ready(function () {
            context.on(config.event.messagePost, wsMessage);
            pointer.webSocket.send(JSON.stringify(wsMessage));
            wsMessage = null;
        });
        return this;
    };

    // 绑定事件
    // 收到消息事件可以绑定 （websocket_util.config.event.messageReceive + '.' + mapping） 为事件名
    // 或者直接使用 onPush(mapping, call)
    // bindFirst: 该事件是否插入到队列的第一个位置
    // onXXX方法命名时on后面接的字符不能为事件名前缀，不然会让jquery在触发事件时调用
    var onPush = function (mapping, func, bindFirst) {
        if (typeof mapping == 'function') {
            context.on(config.event.messageReceive, mapping, func);
        } else {
            context.on(config.event.messageReceive + '.' + mapping, func, bindFirst);
        }
        return this;
    };

    // 当连接ready之后才可以使用post方法
    var ready = function (func) {
        if (utils.isWsAvailable()) {
            func.call(context);
        } else {
            context.once(config.event.connectionOpen, func);
        }
        return this;
    };

    var utils = {
        "isWsAvailable": function () {
            return pointer.webSocket && pointer.webSocket.isAvailable;
        },
        "isPageActive": function () {
            return pointer.webSocket && pointer.webSocket.isPageActive;
        },
        "setPageActive": function (isPageActive) {
            if (pointer.webSocket) {
                pointer.webSocket.isPageActive = (!!isPageActive);
            }
        }
    };

    var context = {
        "config": config,
        "pointer": pointer,
        "init": init,
        "utils": utils,
        "on": globals.on,
        "once": globals.once,
        "trigger": globals.trigger,
        "off": globals.off,
        "onPush": onPush,
        "ready": ready,
        "post": post
    };

    return context;

});