/**
 * Created by Jeffrey.Deng on 2018/3/31.
 * PeriodCache
 * 避免频繁请求的缓存工具类（在超时时间之内返回本地数据，反之请求新数据）
 *     使用静态方法：使用默认缓存池(localStorage)，所有连接共用一个缓存池
 *     使用实例方法：使用用户自定义的缓存池，每个实例共用一个缓存池
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals
        window.PeriodCache = factory(window.jQuery);
    }
})(function ($) {

    var PeriodCache = function (cacheContextRewrite, groupDefaultConfig) {
        var staticDefaultPointer = $.extend(true, {}, PeriodCache.pointer);
        var staticGroupDefaultConfig = $.extend(true, {}, PeriodCache.groupDefaultConfig);
        try {
            // extend默认实现
            // 传入cacheContextRewrite，可以修改存储的实现
            this.pointer = $.extend(true, staticDefaultPointer, cacheContextRewrite);
            // 为该实例的所有连接提供一个默认的配置
            this.groupDefaultConfig = $.extend(true, staticGroupDefaultConfig, groupDefaultConfig);
            // 手动指定防止循环引用
            this.utils.context = {
                "pointer": this.pointer,
                "groupDefaultConfig": this.groupDefaultConfig
            };
        } catch (e) {
            console.error("你的配置有问题，循环引用？ Exception: ", e);
        }
    };

    /**
     * 传入一个配置，创造一个缓存组
     * @param groupConfig
     */
    PeriodCache.prototype.create = function (groupConfig) {
        var context = this;
        var defaultConfig = $.extend(true, {}, context.groupDefaultConfig);
        var options = $.extend(true, defaultConfig, groupConfig);
        if (groupConfig.reload) {
            delete options.reload_udf;
        }
        var groupName = options.groupName;
        if (groupName) {
            context.utils.setGroupConfig({}, options);
        }
    };

    /**
     * 从一个缓存组中取一个对象，在callback中使用该对象
     * @param groupName
     * @param key
     * @param callback
     */
    PeriodCache.prototype.get = function (groupName, key, callback) {
        var context = this;
        var group = context.utils.getGroup(groupName);
        if (group) {
            try {
                var isLoadNew = true;
                var old_object = context.utils.getCache(group, key);
                var groupConfig = context.utils.getGroupConfig(group);
                if (!groupConfig) {
                    console.error("PeriodCache Error: groupConfig don't exist, groupName: " + groupName + "\n\tyou should run create before use get, or run getOrCreateGroup!");
                    callback.call(null, null);
                    return;
                }
                if (old_object && old_object.header.version == groupConfig.version) {
                    if (new Date().getTime() - old_object.header.update_time < groupConfig.timeOut) {
                        isLoadNew = false;
                        callback.call(old_object.value, old_object.value);
                        return;
                    }
                }
                if (isLoadNew) {
                    if (groupConfig.reload_udf) {
                        var saveNewObjectValue_callback = function (object_value) {
                            context.utils.setCache(groupName, key, {"update_time": new Date().getTime(), "version": groupConfig.version}, object_value);
                            callback.call(object_value, object_value);
                        };
                        groupConfig.reload_udf.call(context, context.pointer.cacheCtx, groupName, key, (old_object ? old_object.value : null), saveNewObjectValue_callback);
                    } else {
                        $.ajax({
                            "url": groupConfig.reload.url,
                            "type": groupConfig.reload.type,
                            "dataType": groupConfig.reload.dataType,
                            "data": groupConfig.reload.params(groupName, key),
                            "success": function (data) {
                                var new_object_value = groupConfig.reload.parse.call(context, context.pointer.cacheCtx, groupName, key, (old_object ? old_object.value : null), data);
                                context.utils.setCache(groupName, key, {"update_time": new Date().getTime(), "version": groupConfig.version}, new_object_value);
                                callback.call(new_object_value, new_object_value);
                            },
                            "error": function (XHR, TS) {
                                callback.call(null, null);
                                console.error("PeriodCache Error: found exception when load data from internet, text: " + TS);
                            }
                        });
                    }
                    context.clearTimeoutKeys(groupName);
                }
            } catch (e) {
                context.utils.setGroup(groupName, null);
                console.warn("PeriodCache Warn: object has been modified, so the group was cleared, key: " + key + ", exception: ", e);
                callback.call(null, null);
            }
        } else {
            console.warn("PeriodCache Warn: The group is not initialized or may have been manually deleted, GroupName: " + groupName);
            callback.call(null, null);
        }
    };

    /**
     * 得到一个组连接
     * 如果该缓存组不存在，则创建一个组，再返回一个组连接
     * @param groupConfig - 参考 groupDefaultConfig
     */
    PeriodCache.prototype.getOrCreateGroup = function (groupConfig) {
        var context = this;
        if (!groupConfig.version) {
            groupConfig.version = context.groupDefaultConfig.version;
        }
        context.utils.setGroupConfig(groupConfig.groupName, groupConfig, false);
        var group = context.utils.getGroup(groupConfig.groupName);
        if (!group) {
            context.create(groupConfig);
        }
        return {
            "get": function (key, callback) {
                context.get(groupConfig.groupName, key, callback);
            },
            "remove": function (key) {
                context.utils.removeCache(groupConfig.groupName, key);
            },
            "clearTimeoutKeys": function () {
                context.clearTimeoutKeys(groupConfig.groupName);
            },
            "groupConfig": groupConfig
        };
    };

    /**
     * 清除该组所有过时的key值
     * @param groupName
     */
    PeriodCache.prototype.clearTimeoutKeys = function (groupName) {
        var context = this;
        try {
            var group = context.utils.getGroup(groupName);
            var groupConfig = context.utils.getGroupConfig(group);
            var nowTime = new Date().getTime();
            $.each(group, function (key, item) {
                if (key != context.pointer.groupConfig_storeKey) {
                    if (nowTime - item.header.update_time >= groupConfig.timeOut) {
                        delete group[key];
                    }
                }
            });
            context.utils.setGroup(group[context.pointer.groupConfig_storeKey].groupName, group);
        } catch (e) {
            console.warn("PeriodCache Warn: found error when clear timeout keys from cache, groupName: " + groupName + ", exception: ", e);
        }
    };

    PeriodCache.prototype.utils = {
        "context": null,
        /**
         * 存储一个缓存组的配置
         * @param groupName
         * @param groupConfig
         * @param saveToLocal
         */
        "setGroupConfig": function (groupName, groupConfig, saveToLocal) {
            if (saveToLocal == false) {
                groupName = typeof groupName == "object" ? groupName[this.context.pointer.groupConfig_storeKey].groupName : groupName;
                this.context.pointer.groupConfig[groupName] = groupConfig;
                return;
            }
            var group = typeof groupName == "object" ? groupName : this.getGroup(groupName);
            if (group) {
                var storeConfig = {};
                storeConfig.groupName = groupConfig.groupName;
                storeConfig.timeOut = groupConfig.timeOut;
                group[this.context.pointer.groupConfig_storeKey] = storeConfig;
                this.setGroup(groupConfig.groupName, group);
                this.context.pointer.groupConfig[groupConfig.groupName] = groupConfig;
            }
        },

        /**
         * 取出一个缓存组的配置
         * @param groupName
         * @returns {*}
         */
        "getGroupConfig": function (groupName) {
            groupName = typeof groupName == "object" ? groupName[this.context.pointer.groupConfig_storeKey].groupName : groupName;
            if (groupName) {
                return this.context.pointer.groupConfig[groupName];
            } else {
                return null;
            }
        },
        /**
         * 新建一个缓存组
         * @param groupName
         * @param group
         */
        "setGroup": function (groupName, group) {
            if (group) {
                this.context.pointer.cacheCtx.setItem(groupName, group);
            } else {
                this.context.pointer.cacheCtx.removeItem(groupName);
            }

        },
        /**
         * 取出一个缓存组
         * @param groupName
         * @returns {null}
         */
        "getGroup": function (groupName) {
            if (typeof groupName == "object") {
                return groupName;
            } else {
                return this.context.pointer.cacheCtx.getItem(groupName);
            }
        },
        /**
         * 添加一个对象到缓存组
         * @param groupName
         * @param key
         * @param object_header
         * @param object_value
         */
        "setCache": function (groupName, key, object_header, object_value) {
            var group = typeof groupName == "object" ? groupName : this.getGroup(groupName);
            if (group) {
                var object = {};
                object.header = object_header;
                object.value = object_value;
                group[key] = object;
                this.setGroup(group[this.context.pointer.groupConfig_storeKey].groupName, group);
            }
        },
        "setCacheValue": function (groupName, key, value) {
            var object = this.getCache(groupName, key);
            if (object) {
                object.value = value;
                this.setCache(groupName, key, object.header, object.value);
            }
        },
        "setCacheHeader": function (groupName, key, header) {
            var object = this.getCache(groupName, key);
            if (object) {
                object.header = header;
                this.setCache(groupName, key, object.header, object.value);
            }
        },
        /**
         * 从缓存组中取出一个对象
         * @param groupName
         * @param key
         * @returns {*}
         */
        "getCache": function (groupName, key) {
            var group = typeof groupName == "object" ? groupName : this.getGroup(groupName);
            if (group) {
                return group[key];
            } else {
                return null;
            }
        },
        "getCacheValue": function (groupName, key) {
            var object = this.getCache(groupName, key);
            if (object) {
                return object.value;
            } else {
                return null;
            }
        },
        "getCacheHeader": function (groupName, key) {
            var object = this.getCache(groupName, key);
            if (object) {
                return object.header;
            } else {
                return null;
            }
        },
        "removeCache": function (groupName, key) {
            var group = this.getGroup(groupName);
            delete group[key];
            this.setGroup(group[this.context.pointer.groupConfig_storeKey].groupName, group);
        }
    };

    /**
     * 默认实现的cacheContext，静态
     * @type {{groupConfig: {}, cacheCtx: {ctx: Storage, setItem: setItem, getItem: getItem, removeItem: removeItem}, groupConfig_storeKey: string}}
     */
    PeriodCache.pointer = {
        groupConfig: {},
        cacheCtx: { // 在new PeriodCache(cacheContextRewrite, groupDefaultConfig)时重写cacheContextRewrite实现，可以修改存储的位置
            "ctx": localStorage,
            "setItem": function (key, value) {
                this.ctx.setItem(key, JSON.stringify(value));
            },
            "getItem": function (key) {
                var str = this.ctx.getItem(key);
                if (str) {
                    return JSON.parse(str);
                } else {
                    return null;
                }
            },
            "removeItem": function (key) {
                this.ctx.removeItem(key);
            }
        },
        groupConfig_storeKey: "periodCache_groupConfig"
    };

    /**
     *  默认的配置，静态
     *  reload 与 reload_udf 取其一
     *  <pre>
     *  "exampleGroupConfig 1":
     *  {
     *      "groupName": "example1",
     *      "timeOut": 900000,
     *      "reload_udf": function (cacheCtx, groupName, key, object, saveNewObject_callback) {
     *           $.get("url", {}, function(data){
     *              saveNewObject_callback(data);
     *           });
     *      }
     *  }
     *  "exampleGroupConfig 2":
     *  {
     *      "groupName": "example2",
     *      "timeOut": 900000,
     *      "reload": {
     *            "url": "url",
     *            "params": function (groupName, key) {
     *                return {"uid": key};
     *            },
     *            "parse": function (cacheCtx, groupName, key, old_object_value, data) {
     *                return data.user;
     *            }
     *       }
     *  } </pre>
     */
    PeriodCache.groupDefaultConfig = {
        "version": "1.0", // add this config will has version verification for object
        "groupName": "example",
        "timeOut": 900000,
        "reload": {
            "url": "",
            "type": "GET",
            "dataType": undefined,
            "params": function (groupName, key) {
                return undefined;
            },
            "parse": function (cacheCtx, groupName, key, old_object_value, data) {
                return data;
            }
        },
        "reload_udf": function (cacheCtx, groupName, key, old_object_value, saveNewObjectValue_callback) {
            var new_object_value = {};
            saveNewObjectValue_callback(new_object_value);
        }
    };

    /**
     * create - 静态方法
     * @returns {*}
     */
    PeriodCache.create = function () {
        return PeriodCache.prototype.create.apply(PeriodCache.staticContext, arguments);
    };

    /**
     * get - 静态方法
     * @returns {*}
     */
    PeriodCache.get = function () {
        return PeriodCache.prototype.get.apply(PeriodCache.staticContext, arguments);
    };

    /**
     * getOrCreateGroup - 静态方法
     * @returns {*}
     */
    PeriodCache.getOrCreateGroup = function () {
        return PeriodCache.prototype.getOrCreateGroup.apply(PeriodCache.staticContext, arguments);
    };

    /**
     * 清除该组所有过时的key值
     * @param groupName
     */
    PeriodCache.clearTimeoutKeys = function () {
        return PeriodCache.prototype.clearTimeoutKeys.apply(PeriodCache.staticContext, arguments);
    };

    /**
     * 静态context
     */
    PeriodCache.staticContext = {
        "pointer": PeriodCache.pointer,
        "groupDefaultConfig": PeriodCache.groupDefaultConfig,
        "create": PeriodCache.create,
        "get": PeriodCache.get,
        "getOrCreateGroup": PeriodCache.getOrCreateGroup,
        "clearTimeoutKeys": PeriodCache.clearTimeoutKeys,
        "utils": $.extend({"context": null}, PeriodCache.prototype.utils)
    };
    // 手动指定防止循环引用
    PeriodCache.staticContext.utils.context = {
        "pointer": PeriodCache.pointer,
        "groupDefaultConfig": PeriodCache.groupDefaultConfig
    };

    /**
     * utils - 静态工具箱
     * @returns {*}
     */
    PeriodCache.utils = PeriodCache.staticContext.utils;

    /**
     * 构建一个缓存实例
     * @param cacheContextRewrite
     * @param groupDefaultConfig
     * @returns {PeriodCache}
     */
    PeriodCache.build = function (cacheContextRewrite, groupDefaultConfig) {
        return new PeriodCache(cacheContextRewrite, groupDefaultConfig);
    };

    return PeriodCache;
});
