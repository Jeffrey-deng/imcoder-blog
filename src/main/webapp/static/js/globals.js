/**
 * 1、组织公共常量
 * 2、与服务器的互动
 * 3、对页面数据的写操作
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'toastr'], factory);
    } else {
        // Browser globals
        window.globals = factory(window.jQuery, toastr);
    }
})(function ($, toastr) {

    // 本地存储
    const storage = {
        "ctx": localStorage,
        "setItem": function (key, value) {
            return (this.ctx[key] = value), this;
        },
        "getItem": function (key) {
            return this.ctx[key];
        },
        "removeItem": function (key) {
            return (delete this.ctx[key]), this;
        }
    };

    let extend = function (source, append) {
        return $.extend(true, source, append);
    };

    // 扩展对象方法
    (function () {

        // 从ES5新增isArray()方法
        if (!Array.isArray) {
            /**
             * 判断是否为数组
             * @author Jeffrey.Deng
             * @param arg
             * @returns {boolean}
             */
            Array.isArray = function (arg) {
                return Object.prototype.toString.call(arg) === '[object Array]';
            };
        }

        /**
         * 将字符串值由相对url转换到绝对url返回
         * @author Jeffrey.Deng
         * @param {String=} prefix - url前缀，默认为 globals.path_params.basePath
         * @returns {String} - 绝对url
         */
        String.prototype.toURL = function (prefix) {
            let url = this;
            prefix = prefix || path_params.basePath;
            if (url) {
                if (!re.full_url.test(url)) {
                    url = prefix + url;
                }
            } else {
                url = prefix;
            }
            return url;
        };

        /**
         * 修改Jquery.extend方法，让如果某属性options为null而target中该属性有值就不覆盖
         * @author Jeffrey.Deng
         * @returns {*|{}}
         */
        $.extendNotNull = function () {
            var jQuery = $ || window.jQuery;
            var src, copyIsArray, copy, name, options, clone,
                target = arguments[0] || {},
                i = 1,
                length = arguments.length,
                deep = false;
            // Handle a deep copy situation
            if (typeof target === 'boolean') {
                deep = target;

                // skip the boolean and the target
                target = arguments[i] || {};
                i++;
            }
            // Handle case when target is a string or something (possible in deep copy)
            if (typeof target !== 'object' && !jQuery.isFunction(target)) {
                target = {};
            }
            // extend jQuery itself if only one argument is passed
            if (i === length) {
                target = this;
                i--;
            }
            for (; i < length; i++) {
                // Only deal with non-null/undefined values
                if ((options = arguments[i]) != null) {
                    // Extend the base object
                    for (name in options) {
                        src = target[name];
                        copy = options[name];
                        // Prevent never-ending loop
                        if (target === copy) {
                            continue;
                        }
                        // Recurse if we're merging plain objects or arrays
                        if (deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) )) {
                            if (copyIsArray) {
                                copyIsArray = false;
                                clone = src && jQuery.isArray(src) ? src : []; // 类型不同则覆盖
                            } else {
                                clone = src && jQuery.isPlainObject(src) ? src : {};
                            }
                            // Never move original objects, clone them
                            target[name] = jQuery.extendNotNull(deep, clone, copy); // modify by jeffrey.deng
                        } else if (copy !== undefined) {    // Don't bring in undefined values
                            // Don't bring in null values either, if we already have non-null ones. // modify by jeffrey.deng
                            if (copy === null) {  // 不复制null值，除非src为undefined
                                if (src === undefined) {
                                    target[name] = copy;
                                }
                            } else {
                                target[name] = copy;
                            }
                        }
                    }
                }
            }
            // Return the modified object
            return target;
        };

        /**
         * 修改Jquery.extend方法，让如果某属性target中该属性有值就不复制，支持深度复制
         * @author Jeffrey.Deng
         * @returns {*|{}}
         */
        $.extendNotHad = function () {
            var jQuery = $ || window.jQuery;
            var src, srcIsArray, copyIsArray, copy, name, options, clone,
                target = arguments[0] || {},
                i = 1,
                length = arguments.length,
                deep = false;
            // Handle a deep copy situation
            if (typeof target === 'boolean') {
                deep = target;

                // skip the boolean and the target
                target = arguments[i] || {};
                i++;
            }
            // Handle case when target is a string or something (possible in deep copy)
            if (typeof target !== 'object' && !jQuery.isFunction(target)) {
                target = {};
            }
            // extend jQuery itself if only one argument is passed
            if (i === length) {
                target = this;
                i--;
            }
            for (; i < length; i++) {
                // Only deal with non-null/undefined values
                if ((options = arguments[i]) != null) {
                    // Extend the base object
                    for (name in options) {
                        src = target[name];
                        copy = options[name];
                        // Prevent never-ending loop
                        if (target === copy) {
                            continue;
                        }
                        // Recurse if we're merging plain objects or arrays
                        // deep为true，src为array或对象，则迭代检查
                        if (deep && src && (jQuery.isPlainObject(src) || (srcIsArray = jQuery.isArray(src)))) {
                            if (srcIsArray) {
                                srcIsArray = false;
                                clone = copy && jQuery.isArray(copy) ? copy : null; // 类型不同则不复制
                            } else {
                                clone = copy && jQuery.isPlainObject(copy) ? copy : null;
                            }
                            if (clone !== null) {
                                // Never move original objects, clone them
                                target[name] = jQuery.extendNotHad(deep, src, clone);
                            }
                        } else if ((src === undefined || src === null) && copy !== undefined) { // 需要src中的字段没有值才复制
                            // Don't bring in null values either, if we already have non-null ones.
                            if (copy === null) { // 不复制null值，除非src为undefined
                                if (src === undefined) {
                                    target[name] = copy;
                                }
                            } else {
                                // deep为true，copy为array或对象则深度复制
                                if (deep && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
                                    if (copyIsArray) {
                                        copyIsArray = false;
                                        clone = [];
                                    } else {
                                        clone = {};
                                    }
                                    // Never move original objects, clone them
                                    target[name] = jQuery.extendNotHad(deep, clone, copy);
                                } else {
                                    target[name] = copy;
                                }
                            }
                        }
                    }
                }
            }
            // Return the modified object
            return target;
        };


        $.BackUpDeferred = $.Deferred;
        /**
         * 向Deferred对象添加一个final方法，以增加一个（类似then方法、但不会像then方法一样将返回结果链式调用）的功能
         * @author Jeffrey.Deng
         * @param {Function=} func
         * @returns {Deferred}
         * @constructor
         */
        $.Deferred = function (func) {
            return $.BackUpDeferred(function (dfd) {
                let promise = dfd.promise(),
                    final = function (doneFn, failFn, progressFn) {
                        $.isFunction(doneFn) && dfd.done(doneFn);
                        $.isFunction(failFn) && dfd.fail(failFn);
                        $.isFunction(progressFn) && dfd.progress(progressFn);
                        return this;
                    };
                if (!dfd.final) {
                    dfd.final = final;
                }
                if (!promise.final) {
                    promise.final = final;
                }
                if (func) {
                    func.call(dfd, dfd);
                }
            });
        };

        /**
         * 1、设置属性时转换相对url到绝对url，
         * 2、只传一个name,则可以取值，值为绝对url
         * @author Jeffrey.Deng
         * @param {String} name - attr name
         * @param {String=} value - attr value，为undefined时，不操作，为null时，删除属性
         * @param {String=} prefix - url前缀，默认为 globals.path_params.basePath
         * @returns {jQuery|String}
         */
        $.fn.url = function (name, value, prefix) {
            if (arguments.length == 1) { // get
                let propValue = this.attr(name); // 取值为undefined时，不修改值
                return propValue !== undefined ? propValue.toURL() : propValue;
            } else { // set
                return value !== undefined ? this.attr(name, value !== null ? String(value).toURL(prefix) : null) : this;
            }
        };

        /**
         * 返回当前jQuery对象是否有值
         * @author Jeffrey.Deng
         * @returns {boolean}
         */
        $.fn.hasValue = function () {
            return this.length > 0;
        };

        /**
         * div 自适应高度
         * @author Jeffrey.Deng
         * @param {Object} options - 选项
         */
        $.fn.autoTextareaHeight = function (options) {
            var $this = this, defaults = {
                maxHeight: null,//文本框是否自动撑高，默认：null，不自动撑高；如果自动撑高必须输入数值，该值作为文本框自动撑高的最大高度
                minHeight: $this.outerHeight(), //默认最小高度，也就是文本框最初的高度，当内容高度小于这个高度的时候，文本以这个高度显示
                runOnce: false // false 为绑定事件 true 为 计算一次高度，不绑定事件
            };
            var opts = $.extend({}, defaults, options);
            var updateHeight = function () {
                var height, style = this.style;
                this.style.height = opts.minHeight + 'px';
                if (this.scrollHeight >= opts.minHeight) {
                    if (opts.maxHeight && this.scrollHeight > opts.maxHeight) {
                        height = opts.maxHeight;
                        style.overflowY = 'scroll';
                    } else {
                        height = this.scrollHeight;
                        style.overflowY = 'hidden';
                    }
                    style.height = height + 'px';
                }
            };
            if (opts.runOnce) {
                $this.each(function () {
                    updateHeight.call(this);
                });
            } else {
                $this.on('input paste cut keydown keyup focus blur', updateHeight);
            }
            return $this;
        };

        /**
         * 把新添加的事件Event，添加到队列的第一个位置，调整执行顺序
         * @author Jeffrey.Deng
         * @param {String} eventType - 事件名称
         * @param {Object|Function} eventData 数据或处理函数
         * @param {Function=} handler eventData有值时选填
         * @returns {*}
         */
        $.fn.onfirst = function (eventType, eventData, handler) {
            var indexOfDot = eventType.indexOf('.');
            var eventNameSpace = indexOfDot > 0 ? eventType.substring(indexOfDot) : '';
            eventType = indexOfDot > 0 ? eventType.substring(0, indexOfDot) : eventType;
            handler = handler == undefined ? eventData : handler;
            eventData = typeof eventData == 'function' ? {} : eventData;
            return this.each(function () {
                var $this = $(this);
                var currentAttrListener = this["on" + eventType];
                if (currentAttrListener) {
                    $this.bind(eventType, function (e) {
                        return currentAttrListener(e.originalEvent);
                    });
                    this["on" + eventType] = null;
                }
                $this.bind(eventType + eventNameSpace, eventData, handler);
                var allEvents = $this.data('events') || $._data($this[0], 'events');
                var typeEvents = allEvents[eventType];
                var newEvent = typeEvents.pop();
                typeEvents.unshift(newEvent);
            });
        };

    })();

    // 吐司 全局设置
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "progressBar": false,
        "positionClass": "toast-bottom-left",
        "showDuration": "400",
        "hideDuration": "1000",
        "timeOut": "3500",
        "hideOnHover": false,
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut",
        "iconClasses": {
            error: 'toast-error',
            info: 'toast-info-no-icon',
            success: 'toast-success',
            warning: 'toast-warning-no-icon'
        }
    };

    // 全局显示请求错误
    $(document).ajaxError(function (e, XHR, options) {
        if (options.hasResolvedError === false || (!options.hasResolvedError && !options.error)) {
            let status = XHR.status, message = XHR.statusText;
            switch (status) {
                case 0:
                    message = options.crossDomain ? '跨域访问失败？' : '请求失败，断网了？';
                    break;
                case 200:
                    message = '请求的不是Ajax接口？';
                    break;
                case 502:
                    message = '服务器开小差了~';
                    break;
                case 504:
                    message = '服务器无响应~';
                    break;
            }
            // An error occurred!
            toastr.error(message, 'Ajax请求错误' + ((status == 0) ? '' : ('，代码' + status)), {'timeOut': 7000});
            console.warn('Error Code: ' + (status == 0 ? message : (status + ', Message: ' + message)));
        }
    });
    // 请求统一添加前缀，ajax设置global:false仍然会运行
    $.ajaxPrefilter(function (options, originalOptions, XHR) {
        // options对象 包括accepts、crossDomain、contentType、url、async、type、headers、error、dataType等许多参数选项
        // originalOptions对象 就是你为$.ajax()方法传递的参数对象，也就是 {url: "index"}
        // XHR对象 就是经过jQuery封装的XMLHttpRequest对象(保留了其本身的属性和方法)
        let url = originalOptions.url;
        if (!re.full_url.test(url)) {
            url = path_params.basePath + url;
            options.url = url;
        }
    });

    const selector = {
        id: {
            prefix: {
                photoNode: 'photo_',
            },
            requireJSNode: 'require_node'
        },
        className: {
            photoNode: 'photo'
        },
        'firstArea': '#first',
        'toolbar': '#header',
        'mainArea': '#main',
    };

    const re = { // 注意火狐不支持前置断言，只支持后置断言
        full_url: /^(https?:\/\/|\/)/,
        request_status_el: /\{(code|status)}/gi,
        brace_replace_el: /\{([^}]*?)}/gi,
        email: /^([a-zA-Z0-9]+(_|.)?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+(_|.)?)*[a-zA-Z0-9]+.[a-zA-Z]{2,5}$/,
        username: /^(?![0-9]+$)[a-zA-Z0-9][\w.-]{0,20}$/,
    };

    const path_params = {
        'basePath': $('#basePath').attr('href'),
        'staticPath': $('#staticPath').attr('href'),
        'cloudPath': $('#cloudPath').attr('href'),
    };

    const api = {
        'getConfigUpgrade': 'site.api?method=getConfigUpgrade',
        'login': 'auth.api?method=login',   // auth
        'logout': 'auth.api?method=logout',
        'sendValidateCode': 'auth.api?method=sendValidateCode',
        'checkValidateCode': 'auth.api?method=checkValidateCode',
        'register': 'user.api?method=register',
        "checkUsernameIsAvailable": 'auth.api?method=checkUsernameIsAvailable',
        "checkEmailIsAvailable": 'auth.api?method=checkEmailIsAvailable',
        'getUserAuthList': 'auth.api?method=getUserAuthList',
        'updateUserAccount': 'auth.api?method=updateAccount',
        'getUserSetting': 'user.api?method=getUserSetting',
        'updateUserSetting': 'user.api?method=updateUserSetting',
        'getUser': 'user.api?method=getUser',
        'updateUserProfile': 'user.api?method=saveProfile',
        'updateUserHeadPhoto': 'user.api?method=updateHeadPhoto',
        "checkUserIsFollowing": 'user.api?method=checkIsFollowing',   // follow
        'followUser': 'user.api?method=follow',
        "unfollowUser": 'user.api?method=unfollow',
        'getUserFollowings': 'user.api?method=getUserFollowings',
        'getUserFollowers': 'user.api?method=getUserFollowers',
        'getUserFriends': 'user.api?method=getUserFriends',
        'getUnreadMsgList': 'message.api?method=getUnreadMsgList',  // message service
        'getLetterList': 'message.api?method=getLetterList',
        'clearLetterListStatus': 'message.api?method=clearLetterListStatus',
        'deleteLetter': 'message.api?method=deleteLetter',
        'sendLetter': 'message.api?method=sendLetter',
        'getSysMsgList': 'message.api?method=getSysMsgList',
        'clearSysMsgListStatus': 'message.api?method=clearSysMsgListStatus',
        'deleteSysMsgList': 'message.api?method=deleteSysMsgList',
        'getCommentList': 'message.api?method=getCommentList',  // comment
        'addComment': 'message.api?method=addComment',
        'deleteComment': 'message.api?method=deleteComment',
        'likeComment': 'message.api?method=likeComment',
        'getCreateConfigInfo': 'article.api?method=getCreateConfigInfo',   // article
        'saveArticle': 'article.api?method=save',
        'getArticle': 'article.api?method=getArticle',
        'getArticleList': 'article.api?method=getArticleList',
        'getTopArticleList': 'article.api?method=getTopArticleList',
        'getRankingList': 'article.api?method=getRankingList',
        'deleteArticle': 'article.api?method=delete',
        'getArticleCreateConfigInfo': 'article.api?method=getCreateConfigInfo',
        'uploadAttachment': 'article.api?method=uploadAttachment',
        'deleteAttachment': 'article.api?method=deleteAttachment',
        'uploadImageFromURL': 'article.api?method=uploadImageFromURL',
        "checkArticleIsCollected": 'user.api?method=checkArticleIsCollected',   // article collection
        'collectArticle': 'user.api?method=collectArticle',
        'uncollectArticle': 'user.api?method=uncollectArticle',
        'getCollectedArticleList': 'user.api?method=getCollectedArticleList',
        'createAlbum': 'photo.api?method=createAlbum',  // album
        'getAlbum': 'photo.api?method=getAlbum',
        'getAlbumList': 'photo.api?method=getAlbumList',
        'updateAlbum': 'photo.api?method=updateAlbum',
        'deleteAlbum': 'photo.api?method=deleteAlbum',
        'getPhotoUploadConfigInfo': 'photo.api?method=getUploadConfigInfo', // photo
        'uploadPhoto': 'photo.api?method=upload',
        'getPhoto': 'photo.api?method=getPhoto',
        'getPhotoList': 'photo.api?method=getPhotoList',
        'updatePhoto': 'photo.api?method=update',
        'likePhoto': 'photo.api?method=likePhoto',
        'deletePhoto': 'photo.api?method=delete',
        'saveAlbumPhotoRelation': 'photo.api?method=saveAlbumPhotoRelation',
        'triggerPhotoAccess': 'photo.api?method=triggerPhotoAccess',
        'getVideoUploadConfigInfo': 'video.api?method=getUploadConfigInfo', // video
        'uploadVideo': 'video.api?method=upload',
        'getVideo': 'video.api?method=getVideo',
        'getVideoList': 'video.api?method=getVideoList',
        'getVideoListByCovers': 'video.api?method=getVideoListByCovers',
        'updateVideo': 'video.api?method=update',
        'likeVideo': 'video.api?method=likeVideo',
        'deleteVideo': 'video.api?method=delete',
        'triggerVideoAccess': 'video.api?method=triggerVideoAccess',
        'uploadSubtitle': 'video.api?method=uploadSubtitle',
        'postImage': 'cloud.api?method=postImage',  // cloud
        'saveTagWrapper': 'photo.api?method=saveTagWrapper',  // tagWrapper
        'updateTagWrapper': 'photo.api?method=updateTagWrapper',
        'getTagWrapper': 'photo.api?method=getTagWrapper',
        "getTagWrapperList": 'photo.api?method=getTagWrapperList',
        "getTagWrapperListByPhoto": 'photo.api?method=getTagWrapperListByPhoto',
        'getOrCreateTopic': 'photo.api?method=getOrCreateTopic',
        "getUserActionRecords": 'user.api?method=getUserActionRecords', // user action record
        "getUserArticleActionRecords": 'user.api?method=getUserArticleActionRecords',
        'getUserPhotoActionRecords': 'user.api?method=getUserPhotoActionRecords',
        'getUserVideoActionRecords': 'user.api?method=getUserVideoActionRecords',
        'getUserAlbumActionRecords': 'user.api?method=getUserAlbumActionRecords',
        'getUserCommentActionRecords': 'user.api?method=getUserCommentActionRecords',
        'getArticleActionRecords': 'article.api?method=getArticleActionRecords',
        'getPhotoActionRecords': 'photo.api?method=getPhotoActionRecords',
        'getAlbumActionRecords': 'photo.api?method=getAlbumActionRecords',
        'getVideoActionRecords': 'video.api?method=getVideoActionRecords',
        'getCommentActionRecords': 'message.api?method=getCommentActionRecords',
        'deleteUserArticleAccessDetail': 'user.api?method=deleteUserArticleAccessDetail',
        'deleteUserPhotoAccessDetail': 'user.api?method=deleteUserPhotoAccessDetail',
        'deleteUserVideoAccessDetail': 'user.api?method=deleteUserVideoAccessDetail',
        'deleteUserAlbumAccessDetail': 'user.api?method=deleteUserAlbumAccessDetail',
        'getIpLocation': 'tool.api?method=getIpLocation', // tool
        'runTextToVoice': 'tool.api?method=runTextToVoice',
        manager: {
            'getUserGroupList': 'manager.api?method=getUserGroupList',
            'updateUserGroup': 'manager.api?method=updateUserGroup',
            'reloadCache': 'manager.api?method=reloadCache',
            'reloadConfig': 'manager.api?method=reloadConfig',
            'getAllConfig': 'manager.api?method=getAllConfig',
            'updateConfig': 'manager.api?method=updateConfig',
            'loadLogFile': 'manager.api?method=loadLogFile',
            'upgradeSystem': 'manager.api?method=upgradeSystem',
            'getArticleInfoList': 'manager.api?method=getArticleInfoList',
            'modifyArticleInfo': 'manager.api?method=modifyArticleInfo',
            'modifyArticleContent': 'manager.api?method=modifyArticleContent',
        }
    };

    /**
     * 封装的通用请求对象
     * @author Jeffrey.Deng
     */
    const request = {
        'ajax': function (type, url, args, success, callArgs, failMessage) {
            let request = this,
                extendAjaxOptions = typeof type === 'object',
                ajaxOptions,
                // 当需要传入callArgs或failMessage时，那么success参数需要占位一个值(Function|Boolean)来判断hasArgs
                hasArgs = (typeof args !== 'function') && (typeof args !== 'boolean'),
                hasSuccessFn, runFailToast;
            if (!hasArgs) { // args可以省略
                failMessage = callArgs; // 注意顺序
                callArgs = success;
                success = args;
                args = undefined;
            }
            Array.isArray(callArgs) || (failMessage = callArgs, callArgs = undefined); // 当callArgs省略时，callArgs位置参数值相当于给failMessage赋值
            hasSuccessFn = typeof success == 'function';
            // success（指定为true）或（指定为function且failMessage不为false) 或 failMessage（指定为true 或 字符串）时，则理解为程序自己提示错误，否则自行处理错误的提示
            runFailToast = (!!hasSuccessFn && failMessage !== false) || (success === true || failMessage === true || typeof failMessage === 'string');
            runFailToast && typeof failMessage !== 'string' && (failMessage = true);
            if (extendAjaxOptions) { // type可以传入自定义ajax选项
                ajaxOptions = type;
                ajaxOptions.url = url;
                ajaxOptions.data = args;
                if (ajaxOptions.progress && !ajaxOptions.xhr) {
                    ajaxOptions.xhr = request.xhrOnProgress(ajaxOptions.progress);
                }
            } else {    // 当type传入string时，['get'、'post']
                ajaxOptions = {
                    'url': url,
                    'type': type,
                    'data': args
                };
            }
            return $.Deferred(function (dfd) {
                $.ajax(ajaxOptions).done(function (response) {
                    response.data = (response.data || {});
                    if (response.status == 200) {
                        // 自定义回调参数
                        request.resolvedResp(response, success, callArgs, false, dfd); // dfd.resolveWith(response, [data[callArgs[0], data[callArgs[1]], ...])
                    } else {
                        response.type = 1; // 错误类型
                        // 统一错误格式，并统一提示错误
                        request.rejectedResp(response, runFailToast && failMessage, null, false, dfd); // dfd.rejectWith(response, [status, message, type = 1])
                    }
                }).fail(function (XHR, TS, MSG) {
                    let status = XHR.status, message = XHR.statusText, options = this, response = XHR;
                    switch (status) {
                        case 0: // 0代表请求未发出
                            message = options.crossDomain ? '跨域访问失败？' : '请求失败，断网了？';
                            break;
                        case 200:
                            message = '请求的不是Ajax接口？';
                            break;
                        case 502:
                            message = '服务器开小差了~';
                            break;
                        case 504:
                            message = '服务器无响应~';
                            break;
                    }
                    (response.message = message, response.type = 0, response.data = {});
                    // 统一错误格式，并统一提示错误
                    request.rejectedResp(response, runFailToast && failMessage, null, false, dfd); // dfd.rejectWith(response, [status, message, type = 0])
                    options.hasResolvedError = true;
                });
            }).promise();
        },
        'xhrOnProgress': function (fn) { // 返回一个绑定上传进度回调函数的XMLHttpRequest对象
            return function () {
                // 通过$.ajaxSettings.xhr();获得XMLHttpRequest对象
                let xhr = $.ajaxSettings.xhr();
                // 判断监听函数是否为函数
                if ($.isFunction(fn)) {
                    // 如果有监听函数并且xhr对象支持绑定时就把监听函数绑定上去
                    if (xhr.upload) {
                        xhr.upload.addEventListener('progress', fn);
                    }
                }
                return xhr;
            }
        },
        'resolvedResp': function (response, success, callArgs, async, dfd) { // 生成一个成功的请求
            let resp = $.extendNotHad(true, response || {}, {'status': 200, 'message': '成功', 'data': {}}),
                data = resp.data, applyArgs, hasSuccessFn = typeof success == 'function';
            (dfd && dfd.resolveWith && dfd.state() === 'pending') || (dfd = $.Deferred()); // 如果传入了未resolve的dfd对象，则重用
            if (callArgs && Array.isArray(callArgs) && callArgs.length > 0) { //  当指定了callArgs为数组时，既表示回调方法要指定哪些参数
                applyArgs = [];
                for (let arg of callArgs) { // arg为数据在resp.data对象中的key
                    applyArgs.push(data[arg]);
                }
            } else {
                applyArgs = [data];
            }
            if (async === true) { // 是否异步返回
                setTimeout(function () {
                    hasSuccessFn && success.apply(resp, applyArgs);
                    dfd.resolveWith(resp, applyArgs);
                }, 0);
            } else {
                hasSuccessFn && success.apply(resp, applyArgs);
                dfd.resolveWith(resp, applyArgs);
            }
            return dfd.promise();
        },
        'rejectedResp': function (response, failMessage, callArgs, async, dfd) { // 生成一个失败的请求
            let resp = $.extendNotHad(true, response || {}, {'status': 0, 'message': '失败', 'type': -1, 'data': {}}),
                applyArgs, runFailToast = (typeof failMessage === 'string' || failMessage === true);
            (dfd && dfd.rejectWith && dfd.state() === 'pending') || (dfd = $.Deferred());
            typeof failMessage !== 'string' && (failMessage = undefined);
            if (callArgs && Array.isArray(callArgs) && callArgs.length > 0) {
                applyArgs = [];
                for (let arg of callArgs) { // arg为数据在resp对象中的key
                    applyArgs.push(resp[arg]);
                }
            } else {
                applyArgs = [resp.status, resp.message, resp.type];
            }
            if (async === true) { // 是否异步返回
                setTimeout(function () {
                    dfd.rejectWith(resp, applyArgs);
                }, 0);
            } else {
                dfd.rejectWith(resp, applyArgs);
            }
            dfd.fail(function (status, message, type) {
                if (runFailToast) {
                    toastr.error(message, String(failMessage || ('错误' + (status == 0 ? '' : ('代码' + status)))).replace(re.request_status_el, String(status)), {
                        'timeOut': 7000,
                        "onclick": function () {
                            return false;
                        }
                    });
                }
                console.warn('Error Code: ' + (status == 0 ? message : (status + ', Message: ' + message)) + (failMessage ? (', Detail: ' + failMessage) : ''));
            });
            return dfd.promise();
        },
        'get': function (url, args, success, callArgs, failMessage) {
            return this.ajax('get', url, args, success, callArgs, failMessage);
        },
        'post': function (url, args, success, callArgs, failMessage) {
            return this.ajax('post', url, args, success, callArgs, failMessage);
        },
        'getUser': function (uid, success) { // 示例，回调方法中将以user作为参数，并自行处理错误提示，并且仍能通过this获取到response对象，也能统一错误到同一回调函数
            return request.get(api.getUser, {'uid': uid}, success, ['user'], success && '加载用户资料失败');
        }
    };

    /**
     * 提示通知对象缓存池
     * @type {{}}
     */
    const notifyPool = {};

    let notifyObject = (function () {
        let notify_options = {},
            internalTitleFn = function (title) {
                return this.find('.toast-title').html(title).end();
            }, internalContentFn = function (content) {
                return this.find('.toast-message').html(content).end();
            }, buildNotifyElement = function (type, content, title, notifyName, notify_options) {
                context.lastNotifyName = notifyName = notifyName || 'default';
                let $toastElement = toastr[type](content, title, notify_options).attr('data-name', notifyName);
                $toastElement.title = internalTitleFn;
                $toastElement.content = internalContentFn;
                notifyPool[notifyName] = $toastElement;
                return $toastElement;
            };
        let context = {
            "config": function (json) {
                notify_options = $.extend(true, {}, json);
                return context;
            },
            "default": function (json) {
                json && toastr.options(json);
                return context;
            },
            "lastNotifyName": null,
            "success": function (content, title, notifyName) {
                return buildNotifyElement('success', content, title, notifyName, notify_options);
            },
            "error": function (content, title, notifyName) {
                return buildNotifyElement('error', content, title, notifyName, notify_options);
            },
            "info": function (content, title, notifyName) {
                return buildNotifyElement('info', content, title, notifyName, notify_options);
            },
            "progress": function (content, title, notifyName) {
                notify_options = $.extendNotNull(true, {
                    "iconClass": "toast-success-no-icon",
                    "progressBar": false,
                    "hideDuration": 0,
                    "showDuration": 0,
                    "timeOut": 0,
                    "closeButton": false,
                    "hideOnHover": false,
                    "onclick": function (e) {
                        return false;
                    },
                }, notify_options);
                return buildNotifyElement('success', content, title, notifyName, notify_options);
            }
        };
        return context;
    })();

    /**
     * 返回通知对象
     * @param {Object|Boolean} options - json为配置，boolean设置为true则为继承上次通知配置
     * @returns notifyObject - {config, default, lastNotifyName, success, error, info, progress}
     */
    let notify = function (options) {
        let extendLast = (typeof options == 'boolean' ? options : false);
        if (!extendLast) {
            if (typeof options == 'object') {
                notifyObject.config(options);
            } else {
                notifyObject.config({});
            }
        }
        return notifyObject;
    };

    /**
     * 移除通知
     * @param notifyName 为空则删除所有通知
     */
    let removeNotify = function (notifyName) {
        if (!notifyName) {
            for (let key in notifyPool) {
                delete notifyPool[key];
            }
            toastr.clear();
        } else if (notifyPool.hasOwnProperty(notifyName)) {
            if (notifyPool[notifyName]) {
                toastr.remove(notifyPool[notifyName], true);
            }
            delete notifyPool[notifyName];
        }
        $('#toast-container').find('.toast[data-name="' + notifyName + '"]').each(function (i, toastElement) {
            toastr.remove($(toastElement), true);
        });
    };

    /**
     * 得到通知jquery对象
     * @param {String} notifyName
     * @param {Boolean=} force
     *  - 为true利用jquery选择器查找，100%查到所有的，可能返回多个（notifyName名称相同）
     *  - 为false从记录中查找，只会返回一个
     *  - 两个都会删除隐藏的通知对象
     * @returns {*}
     */
    let getNotify = function (notifyName, force) {
        if (force) {
            let internalTitleFn = function (title) {
                return this.find('.toast-title').html(title).end();
            }, internalContentFn = function (content) {
                return this.find('.toast-message').html(content).end();
            }, $toastElements = $('#toast-container').find('.toast[data-name="' + notifyName + '"]').filter(function (i, toastElement) {
                let $toastElement = $(toastElement);
                if ($toastElement.is(':visible')) {
                    return true;
                } else {
                    toastr.remove($toastElement, true);
                    return false;
                }
            });
            $toastElements.title = internalTitleFn;
            $toastElements.content = internalContentFn;
            return $toastElements.length !== 0 ? $toastElements : null;
        } else {
            let $toastElement = notifyPool[notifyName];
            if ($toastElement && !force && !$toastElement.is(':visible')) {
                $toastElement = null;
                delete notifyPool[notifyName];
                toastr.remove($toastElement, true);
            }
            return $toastElement;
        }
    };

    /**
     * 客户端本地配置
     * @param {String|Object=} module - 模块名称，当取所有配置时，此处可填所有配置的默认值
     * @param {Object=} defaultValue - module模块的默认值
     * @returns {*} 当module为传入的模块名称时，返回该模块配置；当module传入的是所有配置默认值或为空时，返回所有配置；
     */
    let getLocalConfig = function (module, defaultValue) {
        if (config_upgrade_start && !config_upgrade_completed) {
            if (!getNotify('notify_upgrade_config')) {
                context.notify({
                    "progressBar": false,
                    "timeOut": 10000,
                    "onclick": function () {
                        document.location.href = document.location.href;
                    }
                }).info('刷新页面应用新配置~', 'Upgraded new local config', 'notify_upgrade_config');
            }
            return (typeof module == 'string') ? defaultValue : (module || {});
        }
        let localConfig = storage.getItem('blog_local_config');
        if (!localConfig) {
            localConfig = {};
            storage.setItem('blog_local_config', JSON.stringify(localConfig));
        } else {
            localConfig = JSON.parse(localConfig);
        }
        if (defaultValue) {
            localConfig[module] = $.extend(true, defaultValue, localConfig[module]);
            storage.setItem('blog_local_config', JSON.stringify(localConfig));
        } else if (typeof module == 'object') {
            localConfig = $.extend(true, module, localConfig);
            storage.setItem('blog_local_config', JSON.stringify(localConfig));
        }
        return (typeof module == 'string') ? localConfig[module] : localConfig;
    };

    /**
     * 保存配置
     * @param moduleName
     * @param moduleValue
     */
    let setLocalConfig = function (moduleName, moduleValue) {
        let localConfig = getLocalConfig();
        if (typeof moduleName == 'string') {
            if (localConfig[moduleName]) {
                localConfig[moduleName] = $.extend(true, localConfig[moduleName], moduleValue);
            } else {
                localConfig[moduleName] = moduleValue;
            }
            storage.setItem('blog_local_config', JSON.stringify(localConfig));
        } else if (typeof moduleName == 'object') {
            $.extend(true, localConfig, moduleName);
            storage.setItem('blog_local_config', JSON.stringify(localConfig));
        }
    };

    /**
     * 绑定事件
     *
     * @param {String} eventName
     * @param {Function} func
     * @param {Boolean} bindFirst - 调整执行顺序，添加到队列的第一个位置
     */
    let on = function (eventName, func, bindFirst) {
        const context = this;
        if (bindFirst == true) {
            $(context).onfirst(eventName, func);
        } else {
            $(context).on(eventName, func);
        }
        return context;
    };

    /**
     * 绑定事件，仅执行一次
     *
     * @param {String} eventName
     * @param {Function} func
     * @param {Boolean} bindFirst - 调整执行顺序，添加到队列的第一个位置
     */
    let once = function (eventName, func, bindFirst) {
        const context = this;
        const funcWrapper = function () {
            try {
                func.apply(this, arguments);
            } finally {
                off.call(context, eventName, funcWrapper);
            }
        };
        on.call(context, eventName, funcWrapper, bindFirst);
        return context;
    };

    /**
     * 触发事件，参数接在事件名后
     *
     * @param {String} eventName
     * @returns 事件返回值
     */
    let trigger = function (eventName) {
        const context = this;
        return $(context).triggerHandler(eventName, Array.prototype.slice.call(arguments, 1));
    };

    /**
     * 取消事件绑定
     *
     * @param {String} eventName
     * @param {Function} func
     */
    let off = function (eventName, func) {
        const context = this;
        $(context).off(eventName, func);
        return context;
    };

    const context = {
        storage: storage,
        selector: selector,
        re: re,
        path_params: path_params,
        api: api,
        request: request,
        extend: extend,
        notifyPool: notifyPool,
        notify: notify,
        removeNotify: removeNotify,
        getNotify: getNotify,
        getLocalConfig: getLocalConfig,
        setLocalConfig: setLocalConfig,
        on: on,
        once: once,
        trigger: trigger,
        off: off,
    };

    // 检查是否需要升级配置
    let config_upgrade_start = false;
    let config_upgrade_completed = false; // 配置应用完成标记
    let require_node = document.getElementById(context.selector.id.requireJSNode);
    if (require_node) {
        let urlArgs = require_node.getAttribute('urlArgs');
        let last_upgrade_url = context.storage.getItem('blog_last_upgrade_url');
        if (urlArgs && last_upgrade_url != urlArgs) { // urlArgs更新时查询新配置
            config_upgrade_start = true;
            // js等主线程执行完成才会执行异步线程，既在这之前需要"阻止"网页在加载新配置完成之前使用旧配置
            context.request.ajax({
                type: 'get',
                global: false,    // 去掉全局事件
            }, context.api.getConfigUpgrade, false, ['config']).final(function (config) {
                let localConfig = JSON.parse(context.storage.getItem('blog_local_config') || '{}');
                let needUpgrade = config.version > (localConfig.version || '0');    // 版本是否需要升级
                if (needUpgrade) {
                    if (config.force == true) {
                        context.storage.setItem('blog_local_config', JSON.stringify(config));
                    } else {
                        config.force = false;
                        context.setLocalConfig(config);
                    }
                }
                context.storage.setItem('blog_last_upgrade_url', urlArgs);
                config_upgrade_completed = true;
                let $info = context.getNotify('notify_upgrade_config');
                if ($info && needUpgrade) {
                    $info.find('.toast-message').html('刷新页面应用新配置 <b>v' + config.version + '</b> ~');
                } else {
                    context.removeNotify('notify_upgrade_config');  // 不是新版本
                }
            }, function (status, message, type) {
                // 如果加载失败
                context.removeNotify('notify_upgrade_config');
                config_upgrade_completed = true;
                if (!(type == 1 && status == 404)) {
                    context.notify({
                        "progressBar": false,
                        "timeOut": 10000,
                        "onclick": function () {
                            document.location.href = document.location.href;
                        }
                    }).error('刷新页面恢复旧配置~', '升级新配置失败', 'notify_upgrade_config_fail');
                }
            });
        }
    }

    return context;

});