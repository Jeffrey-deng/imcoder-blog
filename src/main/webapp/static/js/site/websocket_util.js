/**
 * @author Jeffrey.Deng
 * @date 2018-01-25
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'common_utils'], factory);
    } else {
        // Browser globals
        window.websocket_util = factory(window.jQuery, common_utils);
    }
})(function ($, common_utils) {

    /**
     * `WebsocketHeartbeatJs` constructor.
     *
     * @param {Object} opts
     * {
     *  url websocket链接地址
     *  pingTimeout 未收到消息多少秒之后发送ping请求，默认15000毫秒
     *  pongTimeout  发送ping之后，未收到消息超时时间，默认10000毫秒
     *  reconnectInterval
     *  pingMsg
     * }
     */
    function WebsocketHeartbeatJs(options) {
        options = options || {};
        this.opts = {
            url: options.url,
            pingTimeout: options.pingTimeout || 15000,
            pongTimeout: options.pongTimeout || 10000,
            reconnectInterval: options.reconnectInterval || 2000,
            pingMsg: options.pingMsg || 'ping'
        };
        this.ws = null;//websocket实例

        //override hook function
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
            _self.isAvailable = false;
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
            _self.reconnect("exception");
            throw e;
        }
    };
    // 绑定事件
    WebsocketHeartbeatJs.prototype.initEventHandle = function () {
        var _self = this;
        _self.ws.onclose = function (event) {
            _self.isAvailable = false;
            _self.onclose(event);
            _self.reconnect("close");
        };
        _self.ws.onerror = function (e) {
            _self.isAvailable = false;
            _self.onerror(e);
            _self.reconnect("error");
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
        if (typeof document.hidden !== "undefined") {
            hidden = "hidden";
            visibilityChange = "visibilitychange";
            state = "visibilityState";
        } else if (typeof document.webkitHidden !== "undefined") {
            hidden = "webkitHidden";
            visibilityChange = "webkitvisibilitychange";
            state = "webkitVisibilityState";
        } else if (typeof document.mozHidden !== "undefined") {
            hidden = "mozHidden";
            visibilityChange = "mozvisibilitychange";
            state = "mozVisibilityState";
        } else if (typeof document.msHidden !== "undefined") {
            hidden = "msHidden";
            visibilityChange = "msvisibilitychange";
            state = "msVisibilityState";
        }
        _self.visibilityStateKey = state;
        _self.visibilityChangeKey = visibilityChange;
        // 添加标签激活状态改变监听器
        document.removeEventListener(visibilityChange, wakeUp);
        document.addEventListener(visibilityChange, wakeUp, false);
    };
    // 重新连接
    WebsocketHeartbeatJs.prototype.reconnect = function (textStatus) {
        var _self = this;
        if (_self.lockReconnect || _self.forbidReconnect) return;
        _self.lockReconnect = true;
        _self.close();
        _self.onreconnect(textStatus);
        // 一般在断网后，浏览器会触发onclose或onerror方法，从而触发reconnect，没连接上会循环重连，
        // 为避免请求过多，设置延迟
        setTimeout(function () {
            _self.lockReconnect = false;
            _self.forbidReconnect = false;
            _self.createWebSocket();
        }, _self.opts.reconnectInterval);
    };
    // 发送消息
    WebsocketHeartbeatJs.prototype.send = function (msg) {
        this.ws.send(msg);
    };
    //心跳检测
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
            _self.ws.send(_self.opts.pingMsg);
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
        if (_self != null && !_self.isAvailable && document[_self.visibilityStateKey] == "visible") {
            // 重新连接
            _self.reconnect("wakeUp");
        }
    };
    // 关闭连接
    WebsocketHeartbeatJs.prototype.close = function () {
        // 如果设置关闭重连，不再重连
        this.forbidReconnect = true;
        this.heartReset();
        this.ws.close();
        document.removeEventListener(this.visibilityChangeKey, wakeUp);
    };

    /* -------------------------------------------------------------------------- */

    var pointer = {
        webSocket: null
    };

    var config = {
        wsUrl: "ws://localhost:8080/blog/socketServer.do",
        heartbeat: {
            pingTimeout: 15000,
            pongTimeout: 10000,
            reconnectInterval: 7000,
            pingMsg: JSON.stringify({"mapping": "ping"})
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
        $.extend(true, config, options);
        var basePath = document.location.origin + document.location.pathname.replace(/[^\/]*?\.do$/, "");
        if (basePath.indexOf("https") == 0) {
            config.wsUrl = basePath.replace(/^https/, "wss") + "socketServer.do";
        } else {
            config.wsUrl = basePath.replace(/^http/, "ws") + "socketServer.do";
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
            utils.triggerEvent(config.event.connectionOpen, event);
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
                if (message.mapping == "forbidden") {   // 如果拒绝连接
                    var time = common_utils.formatDate(new Date(), "hh:mm:ss");
                    pointer.webSocket.close();
                    console.log("websocket connection 强制下线 at " + time);
                } else if (message.mapping && message.mapping != "pong") { // 过滤掉ping消息的返回消息pong
                    // 调用绑定该mapping的事件
                    utils.triggerEvent(config.event.messageReceive + "." + message.mapping, message, wsEvent);
                }
            } catch (e) {
                console.warn("handle message of server pushing find exception", e);
            }
        };

        //连接发生错误的回调方法
        pointer.webSocket.onerror = function (e) {
            var time = common_utils.formatDate(new Date(), "hh:mm:ss");
            console.log("websocket an error occurred at " + time);
            utils.triggerEvent(config.event.connectionError, e);
        };

        //连接关闭的回调方法
        pointer.webSocket.onclose = function (event) {
            var time = common_utils.formatDate(new Date(), "hh:mm:ss");
            console.log("websocket connection disconnect from server at " + time);
            utils.triggerEvent(config.event.connectionClose, event);
        };

        //连接重连的回调方法
        pointer.webSocket.onreconnect = function (textStatus) {
            var time = common_utils.formatDate(new Date(), "hh:mm:ss");
            if (textStatus == "wakeUp") {
                console.log("websocket wake up and reconnection server at " + time);
            } else {
                console.log("websocket reconnection server at " + time);
            }
        };

        //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
        window.addEventListener("beforeunload", function () {
            pointer.webSocket.close();
        });
    }

    // 发送消息
    // 当连接ready之后才可以使用post方法
    var post = function (wsMessage) {
        ready(function () {
            utils.triggerEvent(config.event.messagePost, wsMessage);
            pointer.webSocket.send(JSON.stringify(wsMessage));
            wsMessage = null;
        });
        return this;
    };

    // 绑定事件
    // 收到消息事件可以绑定 （websocket_util.config.event.messageReceive + "." + mapping） 为事件名
    // 或者直接使用 onPush(mapping, call)
    var on = function (eventName, func) {
        utils.bindEvent(eventName, func);
        return this;
    };

    var bind = function (eventName, func) {
        utils.bindEvent(eventName, func);
        return this;
    };

    var unbind = function (eventName, func) {
        utils.unbindEvent(eventName, func);
        return this;
    };

    // onXXX方法命名时on后面接的字符不能为事件名前缀，不然会让jquery在触发事件时调用
    var onPush = function (mapping, func) {
        if (typeof mapping == "function") {
            on(config.event.messageReceive, mapping);
        } else {
            on(config.event.messageReceive + "." + mapping, func);
        }
        return this;
    };

    // 当连接ready之后才可以使用post方法
    var ready = function (func) {
        if (utils.isWsAvailable()) {
            func();
        } else {
            var call = function () {
                try {
                    func();
                } finally {
                    utils.unbindEvent(config.event.connectionOpen, call);
                }
            };
            utils.bindEvent(config.event.connectionOpen, call);
        }
        return this;
    };

    var utils = {
        "bindEvent": function (eventName, func) {
            $(context).bind(eventName, func);
        },
        "triggerEvent": function (eventName) {
            return $(context).triggerHandler(eventName, Array.prototype.slice.call(arguments, 1));
        },
        "unbindEvent": function (eventName, func) {
            $(context).unbind(eventName, func);
        },
        "isWsAvailable": function () {
            return pointer.webSocket && pointer.webSocket.isAvailable;
        }
    };

    var context = {
        "config": config,
        "pointer": pointer,
        "init": init,
        "utils": utils,
        "on": on,
        "bind": bind,
        "unbind": unbind,
        "onPush": onPush,
        "ready": ready,
        "post": post
    };

    return context;

});