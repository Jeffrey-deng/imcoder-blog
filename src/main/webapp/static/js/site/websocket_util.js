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
        this.onreconnect = function () {
        };

        this.createWebSocket();
    }

    // 创建WebSocket对象，并绑定事件
    WebsocketHeartbeatJs.prototype.createWebSocket = function () {
        var _self = this;
        try {
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
            _self.reconnect();
            throw e;
        }
    };
    // 绑定事件
    WebsocketHeartbeatJs.prototype.initEventHandle = function () {
        var _self = this;
        _self.ws.onclose = function (event) {
            _self.onclose(event);
            _self.reconnect();
        };
        _self.ws.onerror = function (e) {
            _self.onerror(e);
            _self.reconnect();
        };
        _self.ws.onopen = function (event) {
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
    };
    // 重新连接
    WebsocketHeartbeatJs.prototype.reconnect = function () {
        var _self = this;
        if (_self.lockReconnect || _self.forbidReconnect) return;
        _self.lockReconnect = true;
        _self.close();
        _self.onreconnect();
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
    // 关闭连接
    WebsocketHeartbeatJs.prototype.close = function () {
        // 如果设置关闭重连，不再重连
        this.forbidReconnect = true;
        this.heartReset();
        this.ws.close();
    };

    /* -------------------------------------------------------------------------- */

    var pointer = {
        webSocket: null,
        isReady: false
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
            pointer.isReady = true;
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
                    pointer.webSocket.close();
                } else if (message.mapping && message.mapping != "ping") { // 过滤掉ping消息
                    // 调用绑定该mapping的事件
                    utils.triggerEvent(config.event.messageReceive + "." + message.mapping, message, wsEvent);
                }
            } catch (e) {
                console.warn("handle message of server pushing find exception", e);
            }
        };

        //连接发生错误的回调方法
        pointer.webSocket.onerror = function (e) {
            console.log("websocket an error occurred");
            utils.triggerEvent(config.event.connectionError, e);
        };

        //连接关闭的回调方法
        pointer.webSocket.onclose = function (event) {
            pointer.isReady = false;
            console.log("websocket connection disconnect from server");
            utils.triggerEvent(config.event.connectionClose, event);
        };

        //连接重连的回调方法
        pointer.webSocket.onreconnect = function () {
            console.log("websocket reconnection server...");
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
        if (pointer.isReady) {
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
            $(context).triggerHandler(eventName, Array.prototype.slice.call(arguments, 1));
        },
        "unbindEvent": function (eventName, func) {
            $(context).unbind(eventName, func);
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