/**
 * Created by Jeffrey.Deng on 2018/3/31.
 */
(function (view) {
    "use strict";

    view.URL = view.URL || view.webkitURL;

    if (view.Blob && view.URL) {
        try {
            new Blob;
            return;
        } catch (e) {
        }
    }

    // Internally we use a BlobBuilder implementation to base Blob off of
    // in order to support older browsers that only have BlobBuilder
    var BlobBuilder = view.BlobBuilder || view.WebKitBlobBuilder || view.MozBlobBuilder || (function (view) {
            var
                get_class = function (object) {
                    return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];
                }
                , FakeBlobBuilder = function BlobBuilder() {
                    this.data = [];
                }
                , FakeBlob = function Blob(data, type, encoding) {
                    this.data = data;
                    this.size = data.length;
                    this.type = type;
                    this.encoding = encoding;
                }
                , FBB_proto = FakeBlobBuilder.prototype
                , FB_proto = FakeBlob.prototype
                , FileReaderSync = view.FileReaderSync
                , FileException = function (type) {
                    this.code = this[this.name = type];
                }
                , file_ex_codes = (
                    "NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR "
                    + "NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR"
                ).split(" ")
                , file_ex_code = file_ex_codes.length
                , real_URL = view.URL || view.webkitURL || view
                , real_create_object_URL = real_URL.createObjectURL
                , real_revoke_object_URL = real_URL.revokeObjectURL
                , URL = real_URL
                , btoa = view.btoa
                , atob = view.atob

                , ArrayBuffer = view.ArrayBuffer
                , Uint8Array = view.Uint8Array

                , origin = /^[\w-]+:\/*\[?[\w\.:-]+\]?(?::[0-9]+)?/
                ;
            FakeBlob.fake = FB_proto.fake = true;
            while (file_ex_code--) {
                FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1;
            }
            // Polyfill URL
            if (!real_URL.createObjectURL) {
                URL = view.URL = function (uri) {
                    var
                        uri_info = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
                        , uri_origin
                        ;
                    uri_info.href = uri;
                    if (!("origin" in uri_info)) {
                        if (uri_info.protocol.toLowerCase() === "data:") {
                            uri_info.origin = null;
                        } else {
                            uri_origin = uri.match(origin);
                            uri_info.origin = uri_origin && uri_origin[1];
                        }
                    }
                    return uri_info;
                };
            }
            URL.createObjectURL = function (blob) {
                var
                    type = blob.type
                    , data_URI_header
                    ;
                if (type === null) {
                    type = "application/octet-stream";
                }
                if (blob instanceof FakeBlob) {
                    data_URI_header = "data:" + type;
                    if (blob.encoding === "base64") {
                        return data_URI_header + ";base64," + blob.data;
                    } else if (blob.encoding === "URI") {
                        return data_URI_header + "," + decodeURIComponent(blob.data);
                    }
                    if (btoa) {
                        return data_URI_header + ";base64," + btoa(blob.data);
                    } else {
                        return data_URI_header + "," + encodeURIComponent(blob.data);
                    }
                } else if (real_create_object_URL) {
                    return real_create_object_URL.call(real_URL, blob);
                }
            };
            URL.revokeObjectURL = function (object_URL) {
                if (object_URL.substring(0, 5) !== "data:" && real_revoke_object_URL) {
                    real_revoke_object_URL.call(real_URL, object_URL);
                }
            };
            FBB_proto.append = function (data/*, endings*/) {
                var bb = this.data;
                // decode data to a binary string
                if (Uint8Array && (data instanceof ArrayBuffer || data instanceof Uint8Array)) {
                    var
                        str = ""
                        , buf = new Uint8Array(data)
                        , i = 0
                        , buf_len = buf.length
                        ;
                    for (; i < buf_len; i++) {
                        str += String.fromCharCode(buf[i]);
                    }
                    bb.push(str);
                } else if (get_class(data) === "Blob" || get_class(data) === "File") {
                    if (FileReaderSync) {
                        var fr = new FileReaderSync;
                        bb.push(fr.readAsBinaryString(data));
                    } else {
                        // async FileReader won't work as BlobBuilder is sync
                        throw new FileException("NOT_READABLE_ERR");
                    }
                } else if (data instanceof FakeBlob) {
                    if (data.encoding === "base64" && atob) {
                        bb.push(atob(data.data));
                    } else if (data.encoding === "URI") {
                        bb.push(decodeURIComponent(data.data));
                    } else if (data.encoding === "raw") {
                        bb.push(data.data);
                    }
                } else {
                    if (typeof data !== "string") {
                        data += ""; // convert unsupported types to strings
                    }
                    // decode UTF-16 to binary string
                    bb.push(unescape(encodeURIComponent(data)));
                }
            };
            FBB_proto.getBlob = function (type) {
                if (!arguments.length) {
                    type = null;
                }
                return new FakeBlob(this.data.join(""), type, "raw");
            };
            FBB_proto.toString = function () {
                return "[object BlobBuilder]";
            };
            FB_proto.slice = function (start, end, type) {
                var args = arguments.length;
                if (args < 3) {
                    type = null;
                }
                return new FakeBlob(
                    this.data.slice(start, args > 1 ? end : this.data.length)
                    , type
                    , this.encoding
                );
            };
            FB_proto.toString = function () {
                return "[object Blob]";
            };
            FB_proto.close = function () {
                this.size = 0;
                delete this.data;
            };
            return FakeBlobBuilder;
        }(view));

    view.Blob = function (blobParts, options) {
        var type = options ? (options.type || "") : "";
        var builder = new BlobBuilder();
        if (blobParts) {
            for (var i = 0, len = blobParts.length; i < len; i++) {
                if (Uint8Array && blobParts[i] instanceof Uint8Array) {
                    builder.append(blobParts[i].buffer);
                }
                else {
                    builder.append(blobParts[i]);
                }
            }
        }
        var blob = builder.getBlob(type);
        if (!blob.slice && blob.webkitSlice) {
            blob.slice = blob.webkitSlice;
        }
        return blob;
    };

    var getPrototypeOf = Object.getPrototypeOf || function (object) {
            return object.__proto__;
        };
    view.Blob.prototype = getPrototypeOf(new view.Blob());
}(
    typeof self !== "undefined" && self
    || typeof window !== "undefined" && window
    || this
));

(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'toastr'], factory);
    } else {
        // Browser globals
        window.common_utils = factory(window.jQuery, toastr);
    }
})(function ($, toastr) {
    /* --------- **** ------------- */

    //吐司 设置
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "progressBar": false,
        "positionClass": "toast-bottom-left",
        "showDuration": "400",
        "hideDuration": "1000",
        "timeOut": "3500",
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

    var parseURL = function (url) {
        var a = document.createElement('a');
        a.href = url;
        return {
            source: url,
            protocol: a.protocol.replace(':', ''),
            host: a.hostname,
            port: a.port,
            query: a.search,
            params: (function () {
                var ret = {},
                    seg = a.search.replace(/^\?/, '').split('&'),
                    len = seg.length, i = 0, s;
                for (; i < len; i++) {
                    if (!seg[i]) {
                        continue;
                    }
                    s = seg[i].split('=');
                    ret[s[0]] = s[1];
                }
                return ret;
            })(),
            file: (a.pathname.match(/\/([^\/?#]+)$/i) || [, ''])[1],
            hash: a.hash.replace('#', ''),
            path: a.pathname.replace(/^([^\/])/, '/$1'),
            relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [, ''])[1],
            segments: a.pathname.replace(/^\//, '').split('/')
        };
    };

    var formatDate = function (date, fmt) {
        if (typeof date == "number") {
            date = new Date(date);
        }
        var o = {
            "M+": date.getMonth() + 1,               //月份
            "d+": date.getDate(),                    //日
            "h+": date.getHours(),                   //小时
            "m+": date.getMinutes(),                 //分
            "s+": date.getSeconds(),                 //秒
            "q+": Math.floor((date.getMonth() + 3) / 3), //季度
            "S": date.getMilliseconds()              //毫秒
        };
        if (/(y+)/.test(fmt))
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    };

    var addStyle = function (aCss) {
        'use strict';
        var head = document.getElementsByTagName('head')[0];
        if (head) {
            var style = document.createElement('style');
            style.setAttribute('type', 'text/css');
            style.textContent = aCss;
            head.appendChild(style);
            return style;
        }
        return null;
    };

    var encodeHTML = function (html) {
        var temp = document.createElement("div");
        /**
         * textContent: 赋值时会在innerHTML中添加一个textNode,不会将回车替换为<br>
         * innerText: 赋值时会在innerHTML中将回车替换为<br>
         */
        temp.textContent == "" ? (temp.textContent = html) : (temp.innerText = html);
        var output = temp.innerHTML;
        temp = null;
        return output;
    };

    var decodeHTML = function (text) {
        var temp = document.createElement("div");
        temp.innerHTML = text;
        /**
         * textContent: 取值时直接剔除标签并转义
         * innerText: 取值时是取浏览器解释的结果
         */
        var output = temp.textContent || temp.innerText;
        temp = null;
        return output;
    };

    /**
     *  用JS实现EL表达式功能，默认支持 " "、{ }、${ }、“”包裹，
     *  可通过设置 sepLeft，sepRight 自定义, 如果想自定义匹配正则，那么设置sepLeft为你需要的正则
     *  不允许嵌套
     *  eg:
     *  <pre>
     *  var str = "path:\"Jeffrey\";name:{Jeffrey},attr:${Jeffrey},desc:“Jeffrey”";
     *  var result = replaceByEL(str, function(index, key){
     *      return "replace_" + key + "_" + index;
     *  });
     *  result: "path:replace_Jeffrey_1;name:replace_Jeffrey_2,attr:replace_Jeffrey_3,desc:replace_Jeffrey_4" </pre>
     * @author Jeffrey.deng
     * @param {String} str
     * @param {Function} replace 替换函数，将匹配到的表达式替换成你想要的
     * @param {String|RegExp} sepLeft - 自定义分隔符左，特殊字符自己转义（分割符前面加“\\”）, 如果想自定义匹配正则，那么设置sepLeft为你需要的正则
     * @param {String|optional} sepRight - 自定义分隔符右，特殊字符自己转义, 如果想自定义匹配正则，那么设置sepRight为不需要设置
     * @returns {string}
     */
    var replaceByEL = function (str, replace, sepLeft, sepRight) {
        if (!str) {
            return str;
        }
        var regex = null;
        if (sepLeft && sepLeft instanceof RegExp) {
            regex = sepLeft;
        } else if (sepLeft && sepRight) {
            regex = new RegExp(sepLeft + "(.*?)" + sepRight, "g")
        } else {
            regex = /\$\{(.*?)\}|\{(.*?)\}|"(.*?)"|“(.*?)”|”(.*?)“/g;
        }
        var result;
        var lastMatchEndIndex = 0;
        var partArr = [];
        var key = "";
        var keyIndex = 0;
        while ((result = regex.exec(str)) != null) {
            for (var i = 1; i < result.length; i++) {
                if (result[i] != undefined) {
                    key = result[i].trim();
                    break;
                }
            }
            partArr.push(str.substring(lastMatchEndIndex, result.index) + replace.call(result, ++keyIndex, key));
            lastMatchEndIndex = regex.lastIndex;
        }
        if (lastMatchEndIndex > 0 && lastMatchEndIndex < str.length) {
            partArr.push(str.substring(lastMatchEndIndex));
        }
        return keyIndex == 0 ? str : partArr.join('');
    };

    var cookieUtil = {
        // get the cookie of the key is name
        get: function (name) {
            var cookieName = encodeURIComponent(name) + "=", cookieStart = document.cookie
                .indexOf(cookieName), cookieValue = null;
            if (cookieStart > -1) {
                var cookieEnd = document.cookie.indexOf(";", cookieStart);
                if (cookieEnd == -1) {
                    cookieEnd = document.cookie.length;
                }
                cookieValue = decodeURIComponent(document.cookie.substring(
                    cookieStart + cookieName.length, cookieEnd));
            }
            return cookieValue;
        },
        // set the name/value pair to browser cookie
        set: function (name, value, expires, path, domain, secure) {
            var cookieText = encodeURIComponent(name) + "="
                + encodeURIComponent(value);

            if (expires) {
                // set the expires time , then the browser will save it to disk
                var expiresTime = new Date();
                expiresTime.setTime(expires);
                cookieText += ";expires=" + expiresTime.toGMTString();
            }

            if (path) {
                cookieText += ";path=" + path;
            }

            if (domain) {
                cookieText += ";domain=" + domain;
            }

            if (secure) {
                cookieText += ";secure";
            }

            document.cookie = cookieText;
        },
        delete: function (name) {
            if (this.get(name) != null) {
                var expiresTime = new Date().getTime() - 10;
                this.set(name, name, expiresTime);
            }
        }
    };

    /*  Class: TaskQueue
     *  Constructor: handler
     *      takes a function which will be the task handler to be called,
     *      handler should return Deferred object(not Promise), if not it will run immediately;
     *  methods: append
     *      appends a task to the Queue. Queue will only call a task when the previous task has finished
     */
    var TaskQueue = function (handler) {
        var tasks = [];
        // empty resolved deferred object
        var deferred = $.when();

        // handle the next object
        function handleNextTask() {
            // if the current deferred task has resolved and there are more tasks
            if (deferred.state() == "resolved" && tasks.length > 0) {
                // grab a task
                var task = tasks.shift();
                // set the deferred to be deferred returned from the handler
                deferred = handler(task);
                // if its not a deferred object then set it to be an empty deferred object
                if (!(deferred && deferred.promise)) {
                    deferred = $.when();
                }
                // if we have tasks left then handle the next one when the current one
                // is done.
                if (tasks.length >= 0) {
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

    var ajaxDownload = function (url, callback, args) {
        /*new Promise(function (resolve, reject) {
         resolve(xhr.response);
         }).then(function (blob) {
         callback(blob);
         });*/
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = "blob";
            xhr.onreadystatechange = function (evt) {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 304 || xhr.status === 0) {
                        callback(xhr.response, args);
                    } else {
                        callback(null, args);
                    }
                }
            };
            xhr.send();
        } catch (e) {
            console.warn("url: " + url + " 下载失败，exception: ", e);
            callback(null, null);
        }
    };

    var fileNameFromHeader = function (disposition, url) {
        var result = null;
        if (disposition && /filename=.*/ig.test(disposition)) {
            result = disposition.match(/filename=.*/ig);
            return decodeURI(result[0].split("=")[1]);
        }
        return url.substring(url.lastIndexOf('/') + 1);
    };

    var downloadBlobFile = function (content, fileName) {
        /*
         var blob = new Blob([content]);
         aLink.href = URL.createObjectURL(blob);
         window.URL.revokeObjectURL(aLink.href);
         */
        //saveAs(content, fileName);
        if ('msSaveOrOpenBlob' in navigator) {
            window.navigator.msSaveOrOpenBlob(content, fileName);
        } else {
            var aLink = document.createElement('a');
            aLink.download = fileName;
            aLink.target = "_blank";
            aLink.style = "display:none;";
            var blob = new Blob([content]);
            aLink.href = window.URL.createObjectURL(blob);
            document.body.appendChild(aLink);
            if (document.all) {
                aLink.click(); //IE
            } else {
                var evt = document.createEvent("MouseEvents");
                evt.initEvent("click", true, true);
                aLink.dispatchEvent(evt); // 其它浏览器
            }
            window.URL.revokeObjectURL(aLink.href);
            document.body.removeChild(aLink);
        }
    };

    var downloadUrlFile = function (url, fileName) {
        var aLink = document.createElement('a');
        if (fileName) {
            aLink.download = fileName;
        } else {
            aLink.download = url.substring(url.lastIndexOf('/') + 1);
        }
        aLink.target = "_blank";
        aLink.style = "display:none;";
        aLink.href = url;
        document.body.appendChild(aLink);
        if (document.all) {
            aLink.click(); //IE
        } else {
            var evt = document.createEvent("MouseEvents");
            evt.initEvent("click", true, true);
            aLink.dispatchEvent(evt); // 其它浏览器
        }
        document.body.removeChild(aLink);
    };

    var zipRemoteFilesAndDownload = function (ZipObject, config) {
        var JSZip = ZipObject;
        var location_info = parseURL(document.location.href);
        var options = {
            "suffix": null,
            "callback": {
                "parseLocationInfo_callback": function (location_info, options) {
                    return parseURL(document.location.href);
                },
                "parseFiles_callback": function (location_info, options) {
                    // file.url file.folder_sort_index
                    // not folder_sort_index -> use fileName
                    var files = [];
                    return files;
                },
                "makeNames_callback": function (arr, location_info, options) {
                    var names = {};
                    var time = new Date().getTime();
                    names.zipName = "pack_" + time;
                    names.folderName = names.zipName;
                    names.infoName = null;
                    names.infoValue = null;
                    names.prefix = time;
                    names.suffix = options.suffix;
                    return names;
                },
                "beforeFileDownload_callback": function (files, location_info, options, zip, main_folder) {
                },
                "eachFileOnload_callback": function (blob, file, location_info, options, zipFileLength, zip, main_folder, folder) {
                }
            }
        };

        var ajaxDownloadAndZipFiles = function (files, names, location_info, options) {
            var notify_start = toastr.success("正在打包～", names.zipName, {
                "progressBar": false,
                "timeOut": 0,
                "closeButton": false
            });
            if (files && files.length > 0) {
                var zip = new JSZip();
                var main_folder = zip.folder(names.folderName);
                var zipFileLength = 0;
                var maxIndex = files.length;
                if (names.infoName) {
                    main_folder.file(names.infoName, names.infoValue);
                }
                options.callback.beforeFileDownload_callback(files, names, location_info, options, zip, main_folder);
                var downloadFile = function (file, resolveCallback) {
                    ajaxDownload(file.url, function (blob, file) {
                        resolveCallback && resolveCallback();   // resolve延迟对象
                        var folder = file.location ? main_folder.folder(file.location) : main_folder;
                        var isSave = options.callback.eachFileOnload_callback(blob, file, location_info, options, zipFileLength, zip, main_folder, folder);
                        if (isSave != false) {
                            if (file.fileName) {
                                folder.file(file.fileName, blob);
                            } else {
                                var suffix = names.suffix || file.url.substring(file.url.lastIndexOf('.') + 1);
                                var photoName = names.prefix + "_" + file.folder_sort_index + "." + suffix;
                                folder.file(photoName, blob);
                            }
                        }
                        zipFileLength++;
                        notify_start.find(".toast-message").text("正在打包～ 第 " + zipFileLength + " 张");
                        if (zipFileLength >= maxIndex) {
                            zip.generateAsync({type: "blob"}).then(function (content) {
                                downloadBlobFile(content, names.zipName + ".zip");
                            });
                            toastr.remove(notify_start, true);
                            toastr.success("下载完成！", names.zipName, {"progressBar": false});
                        }
                    }, file);
                };
                if (maxIndex <= 100) {
                    // 并发数在100内，直接下载
                    for (var i = 0; i < maxIndex; i++) {
                        downloadFile(files[i]);
                    }
                } else {
                    // 并发数在100之上，采用队列下载
                    var queue = new TaskQueue(function (file) {
                        if (file) {
                            var dfd = $.Deferred();
                            downloadFile(file, function () {
                                dfd.resolve();
                            });
                            return dfd;
                        }
                    });
                    for (var i = 0; i < maxIndex; i++) {
                        queue.append(files[i]);
                    }
                }
            } else {
                toastr.remove(notify_start, true);
                toastr.error("未解析到图片！", "错误", {"progressBar": false});
            }
        };

        try {
            options = $.extend(true, options, config);
            location_info = options.callback.parseLocationInfo_callback(options);
            var files = options.callback.parseFiles_callback(location_info, options);

            if (confirm("是否下载 " + files.length + " 张图片")) {
                var names = options.callback.makeNames_callback(files, location_info, options);
                ajaxDownloadAndZipFiles(files, names, location_info, options);
            }
        } catch (e) {
            console.warn("批量下载照片 出现错误！, exception: ", e);
            toastr.error("批量下载照片 出现错误！", "");
        }
    };

    /**
     * 格式化JSON源码(对象转换为JSON文本)
     * @param txt
     * @param {Boolean} compress - 是否为压缩模式
     * @returns {string}
     */
    var formatJson = function format(txt, compress) {
        if (typeof txt == "string") {
            if (/^\s*$/.test(txt)) {
                toastr.error('数据为空,无法格式化! ');
                return;
            }
            try {
                var data = eval('(' + txt + ')');
            } catch (e) {
                toastr.error('数据源语法错误,格式化失败! 错误信息: ' + e.description, 'err');
                return;
            }
        } else if (typeof txt == "object") {
            var data = txt;
        } else {
            return;
        }
        var indentChar = '    ';
        var draw = [], last = false, This = this, line = compress ? '' : '\r\n', nodeCount = 0, maxDepth = 0;

        var notify = function (name, value, isLast, indent/*缩进*/, formObj) {
            nodeCount++;
            /*节点计数*/
            for (var i = 0, tab = ''; i < indent; i++)tab += indentChar;
            /* 缩进HTML */
            tab = compress ? '' : tab;
            /*压缩模式忽略缩进*/
            maxDepth = ++indent;
            /*缩进递增并记录*/
            if (value && value.constructor == Array) {/*处理数组*/
                draw.push(tab + (formObj ? ('"' + name + '":') : '') + '[' + line);
                /*缩进'[' 然后换行*/
                for (var i = 0; i < value.length; i++)
                    notify(i, value[i], i == value.length - 1, indent, false);
                draw.push(tab + ']' + (isLast ? line : (',' + line)));
                /*缩进']'换行,若非尾元素则添加逗号*/
            } else if (value && typeof value == 'object') {/*处理对象*/
                draw.push(tab + (formObj ? ('"' + name + '":') : '') + '{' + line);
                /*缩进'{' 然后换行*/
                var len = 0, i = 0;
                for (var key in value)len++;
                for (var key in value)notify(key, value[key], ++i == len, indent, true);
                draw.push(tab + '}' + (isLast ? line : (',' + line)));
                /*缩进'}'换行,若非尾元素则添加逗号*/
            } else {
                if (typeof value == 'string') value = '"' + value + '"';
                draw.push(tab + (formObj ? ('"' + name + '":') : '') + value + (isLast ? '' : ',') + line);
            }
        };
        var isLast = true, indent = 0;
        notify('', data, isLast, indent, false);
        return draw.join('');
    };

    /**
     * 提示通知
     * @type {{}}
     */
    var notifyPool = {};

    var notifyObject = (function () {
        var notify_options = {};
        var context = {
            "config": function (json) {
                notify_options = $.extend(true, {}, json);
                return context;
            },
            "default": function (json) {
                json && toastr.options(json);
            },
            "lastNotifyName": null,
            "success": function (content, title, notifyName) {
                context.lastNotifyName = notifyName = notifyName || "default";
                var toastElement = toastr.success(content, title, notify_options);
                notifyPool[notifyName] = toastElement;
                return toastElement;
            },
            "error": function (content, title, notifyName) {
                context.lastNotifyName = notifyName = notifyName || "default";
                var toastElement = toastr.error(content, title, notify_options);
                notifyPool[notifyName] = toastElement;
                return toastElement;
            },
            "info": function (content, title, notifyName) {
                context.lastNotifyName = notifyName = notifyName || "default";
                var toastElement = toastr.info(content, title, notify_options);
                notifyPool[notifyName] = toastElement;
                return toastElement;
            }
        };
        return context;
    })();

    /**
     * 返回通知对象
     * @param {Object|Boolean} options - json为配置，boolean设置为true则为继承上次通知配置
     * @returns notifyObject - {config, default, lastNotifyName, success, error, info}
     */
    var notify = function (options) {
        var extendLast = (typeof options == "boolean" ? options : false);
        if (!extendLast) {
            if (options) {
                notifyObject.config(options);
            } else {
                notifyObject.config({});
            }
        }
        return notifyObject;
    };

    var removeNotify = function (notifyName) {
        if (!notifyName) {
            notifyPool = {};
            toastr.clear();
        } else {
            notifyPool.hasOwnProperty(notifyName) && toastr.remove(notifyPool[notifyName], true);
        }
    };

    var getNotify = function (notifyName, force) {
        var notify = notifyPool[notifyName];
        if (notify && !force && !notify.is(':visible')) {
            notify = null;
            delete notifyPool[notifyName];
        }
        return notify;
    };

    /**
     * 客户端本地配置
     */
    var getLocalConfig = function (module) {
        var localConfig = localStorage.getItem("blog_local_config");
        if (!localConfig) {
            localConfig = {};
            localConfig.search = {}; //搜索帮助
            localConfig.search.hasReadHelp = false; // 是否查看过搜索帮助
            localStorage.setItem("blog_local_config", JSON.stringify(localConfig));
        } else {
            localConfig = JSON.parse(localConfig);
        }
        return module ? localConfig[module] : localConfig;
    };

    /**
     * 保存配置
     * @param moduleName
     * @param moduleValue
     */
    var setLocalConfig = function (moduleName, moduleValue) {
        if (moduleName) {
            var localConfig = getLocalConfig();
            localConfig[moduleName] = moduleValue;
            localStorage.setItem("blog_local_config", JSON.stringify(localConfig));
        }
    };

    var context = {
        "addStyle": addStyle,
        "encodeHTML": encodeHTML,
        "decodeHTML": decodeHTML,
        "replaceByEL": replaceByEL,
        "TaskQueue": TaskQueue,
        "ajaxDownload": ajaxDownload,
        "fileNameFromHeader": fileNameFromHeader,
        "downloadBlobFile": downloadBlobFile,
        "downloadUrlFile": downloadUrlFile,
        "parseURL": parseURL,
        "cookieUtil": cookieUtil,
        "formatDate": formatDate,
        "zipRemoteFilesAndDownload": zipRemoteFilesAndDownload,
        "formatJson": formatJson,
        "notify": notify,
        "removeNotify": removeNotify,
        "getNotify": getNotify,
        "getLocalConfig": getLocalConfig,
        "setLocalConfig": setLocalConfig
    };

    return context;
});