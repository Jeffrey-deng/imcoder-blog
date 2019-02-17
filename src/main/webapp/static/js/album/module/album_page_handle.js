/**
 * Created by Jeffrey.Deng on 2018/5/3.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'macy', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.album_page_handle = factory(window.jQuery, null, toastr, Macy, common_utils, login_handle);
    }
})(function ($, bootstrap, toastr, Macy, common_utils, login_handle) {

    var pointer = {
        albums: null,
        masonryInstance: null
    };
    var config = {
        callback: {
            "loadAlbums_callback": function (config, success) { // 加载相册列表的回调
                var object = {};
                $.get("photo.do?method=albumListByAjax", object, function (data) {
                    if (data.flag == 200) {
                        success(data.albums);
                    } else {
                        toastr.error(data.info, "加载相册失败!");
                        console.warn("Error Code: " + data.flag);
                    }
                });
            },
            "generatePhotoPreviewUrl": function (source, relativePath, hitCol) { // 生成预览图片url的函数
                return source;
            },
            "actionForEditAlbum": function (album) {
                //var albumDom = this.utils.getAlbumDom(album.album_id);
                return;
            },
            "makeupNode_callback": function (album_node, album) {
                return;
            },
            "paginationClick_callback": function (paginationNode) {
                return;
            },
            "photosOnLoad_callback": function (masonryInstance) {
                return;
            }
        },
        event: { // 以事件方式添加回调，以便支持多个回调，这时定义的是事件名
            "actionForEditAlbum": "album.edit",
            "pagePaginationClick": "page.jump.click",
            "pageJumpCompleted": "page.jump.completed",
            "pageLoadCompleted": "page.load.completed"
        },
        path_params: {
            "basePath": "https://imcoder.site/",
            "cloudPath": "https://cloud.imcoder.site/",
            "staticPath": "https://static.imcoder.site/"
        },
        selector: {
            "albumsContainer_id": "masonryContainer",
            "page_nav": ".page-navigator",
            "album_id_prefix": "album_",
            "album_count": "#album_count"
        },
        page_params: {
            "pageSize": 0, // 设置0为自适应：列数 * 10
            "pageCount": 0,
            "pageNum": 1,
            "col": undefined,
            "default_col": {
                "2000": 4,
                "1800": 4,
                "1600": 4,
                "940": 3,
                "720": 2
            }
        },
        load_condition: null,
        album_href_prefix: ""
    };

    var init = function (options) {
        $.extend(true, config, options);
        loadAlbums(config, function (data) {

            pointer.albums = data.albums;
            pointer.count = data.albums ? data.albums.length : 0;

            if (config.page_params.pageSize == 0) {
                config.page_params.default_size = 0;
            }
            config.page_params.pageCount = utils.calcPageCount();

            if (pointer.albums != null) {
                jumpPage(config.page_params.pageNum);
            }

            utils.updateAlbumCountInPage();
            $(window).resize(function () {
                config.calc_real_col_completed = false;
                utils.calcNavLocation();
            });

            // log
            console.log("init params: ");
            console.log("   { albumCount: " + pointer.albums.length +
                ", pageSize: " + config.page_params.pageSize +
                ", col: " + config.page_params.col +
                ", pageNum: " + config.page_params.pageNum + " }"
            );
            console.log("search params: ");
            var search = "";
            if (config.load_condition) {
                $.each(config.load_condition, function (key, value) {
                    if (value && key != "method" && key != "size" && key != "col" && key != "page" && key != "check") {
                        search += ", " + key + ": " + value;
                    }
                });
                search = "{ " + (search && search.substring(2)) + " }";
                config.search_params = search;
            }
            console.log("   " + search);
        });
    };

    var loadAlbums = function (config, success) {
        config.callback.loadAlbums_callback.call(context, config, success);
    };

    var jumpPage = function (pagenum) {
        config.page_params.pageCount = utils.calcPageCount();
        var albums = pointer.albums,
            pageSize = config.page_params.pageSize;

        pagenum = utils.revisePageNum(pagenum);
        config.page_params.pageNum = pagenum;

        pointer.notify_pageloading = toastr.success("加载中～", "第" + config.page_params.pageNum + "页", {
            "progressBar": false,
            "timeOut": 0,
            "closeButton": false
        });

        // 组装该页的html
        assembleCurrentPageHtml(pagenum);
        $(config.selector.page_nav).find('a').unbind().click(function (e) {
            var _self = e.currentTarget;
            var className = _self.parentNode.className;
            if (className == "page-left") {
                jumpPage(config.page_params.pageNum - 1);
            } else if (className == "page-right") {
                jumpPage(config.page_params.pageNum + 1);
            } else if (className != "separator") {
                jumpPage(_self.getAttribute('jumpPage'))
            }
            config.callback.paginationClick_callback.call(context, _self.parentNode);
            utils.triggerEvent(config.event.pagePaginationClick, _self.parentNode);
            return false;
        });
        $("#" + config.selector.albumsContainer_id + " .album_name").unbind("click").click(function (e) {
            var album = utils.getAlbumByCache(e.currentTarget.parentNode.getAttribute("data-id"));
            config.callback.actionForEditAlbum.call(context, album);
            utils.triggerEvent(config.event.actionForEditAlbum, album);
        });

        $('#' + config.selector.albumsContainer_id).find("img").on("dragstart", function (e) {
            var uid = parseInt(e.currentTarget.parentNode.parentNode.getAttribute("data-uid"));
            var isAuthor = login_handle.equalsLoginUser(uid);
            var tips = isAuthor ? "松开鼠标打开编辑窗口~" : "松开鼠标查看相册信息~";
            pointer.notify_drag = toastr.success(tips, "", {"progressBar": false, "timeOut": 0, "closeButton": false});
        });
        $('#' + config.selector.albumsContainer_id).find("img").on("dragend", function (e) {
            toastr.remove(pointer.notify_drag, true);
            var album = utils.getAlbumByCache(e.currentTarget.parentNode.parentNode.getAttribute("data-id"));
            config.callback.actionForEditAlbum.call(context, album);
            utils.triggerEvent(config.event.actionForEditAlbum, album);
        });
        initWaterfallFlow();

        var params = common_utils.parseURL(document.location.href).params;
        var search = "";
        $.each(params, function (key, value) {
            if (key != "page") {
                search += "&" + key + "=" + value;
            }
        });
        (pagenum != 1) && (search += "&page=" + pagenum);
        search = search ? ("?" + search.substring(1)) : "";
        history.replaceState(
            {"flag": "page"},
            document.title,
            location.pathname + search
        );
        utils.triggerEvent(config.event.pageJumpCompleted, pagenum); // 页码跳转完成事件
    };

    var assembleCurrentPageHtml = function (pagenum) {
        var albums = pointer.albums,
            pageSize = config.page_params.pageSize,
            start = (pagenum - 1) * pageSize,
            end = start + (albums.length - start < pageSize ? albums.length - start - 1 : pageSize - 1),
            pageCount = config.page_params.pageCount,
            fragment = document.createDocumentFragment();

        for (var i = start; i <= end; i++) {
            fragment.appendChild(utils.createAlbumNode(albums[i]));
        }

        var albumsContainer = document.getElementById(config.selector.albumsContainer_id);
        albumsContainer.innerHTML = "";
        albumsContainer.appendChild(fragment);

        // 分页
        var navigator_fragment = document.createDocumentFragment();
        var separator = utils.createNavLiNode("...", false);
        separator.removeAttribute("title");
        separator.className = "separator";
        var half = document.body.clientWidth >= 768 ? 6 : 3;
        if (pagenum != 1 && pageCount > 1) {
            var page_left = utils.createNavLiNode("« ", false);
            page_left.title = "前一页";
            page_left.className = "page-left";
            navigator_fragment.appendChild(page_left);
        }
        if (pagenum - half > 1 + 1) {
            navigator_fragment.appendChild(utils.createNavLiNode(1, false));
            navigator_fragment.appendChild(separator);
        }
        for (var i = (pagenum - half > 1 + 1) ? (pagenum - half) : 1, max = pagenum; i < max; i++) {
            navigator_fragment.appendChild(utils.createNavLiNode(i, false));
        }
        navigator_fragment.appendChild(utils.createNavLiNode(pagenum, true));
        for (var i = (pagenum + 1), max = (pagenum + half < pageCount - 1 ? (pagenum + half) : pageCount); i <= max; i++) {
            navigator_fragment.appendChild(utils.createNavLiNode(i, false));
        }
        if (pagenum + half < pageCount - 1) {
            navigator_fragment.appendChild(separator.cloneNode(true));
            navigator_fragment.appendChild(utils.createNavLiNode(pageCount, false));
        }
        if (pagenum != pageCount && pageCount > 1) {
            var page_right = utils.createNavLiNode(" »", false);
            page_right.title = "后一页";
            page_right.className = "page-right";
            navigator_fragment.appendChild(page_right);
        }
        var page_nav_dom = $(config.selector.page_nav).get(0);
        page_nav_dom.innerHTML = "";
        page_nav_dom.appendChild(navigator_fragment);
        utils.calcNavLocation();
    };

    // 瀑布流
    var initWaterfallFlow = function () {
        var real_col = config.page_params.real_col;
        if (pointer.masonryInstance == null) {
            pointer.masonryInstance = new Macy({
                container: '#' + config.selector.albumsContainer_id, // 图像列表容器id
                trueOrder: false,
                waitForImages: true,
                useOwnImageLoader: false,
                //设计间距
                margin: {
                    x: 20,
                    y: 30
                },
                //设置列数
                columns: real_col["2000"],
                //定义不同分辨率（1200，940，520，400这些是分辨率）
                breakAt: {
                    1800: {
                        columns: real_col["1800"],
                        margin: {
                            x: 20,
                            y: 30
                        }
                    },
                    1600: {
                        columns: real_col["1600"],
                        margin: {
                            x: 20,
                            y: 30
                        }
                    },
                    940: {
                        columns: real_col["940"],
                        margin: {
                            x: 20,
                            y: 20
                        }
                    },
                    720: {
                        columns: real_col["720"],
                        margin: {
                            x: 20,
                            y: 20
                        }
                    }
                }
            });
            pointer.masonryInstance.recalculate(true);
            $.each($('#' + config.selector.albumsContainer_id).children(), function (i, dom) {
                var img = dom.querySelector("img");
                var width = dom.getAttribute("data-width");
                var height = dom.getAttribute("data-height");
                if (!img.naturalHeight && width && height) {
                    var scale = img.offsetWidth / width;
                    img.style.height = (height * scale) + "px";
                }
            });
            pointer.masonryInstance.recalculate(true);
            pointer.masonryInstance.runOnImageLoad(function () {
                var nodes = $('#' + config.selector.albumsContainer_id).children();
                $.each(nodes, function (i, dom) {
                    var img = dom.querySelector("img");
                    if (img && img.style.height) {
                        img.style.height = "";
                    }
                });
                pointer.masonryInstance.recalculate(true);
                console.log('第 ' + config.page_params.pageNum + ' 页加载完成！');
                //pointer.masonryInstance.recalculate(true, true);
                pointer.notify_pageloading && toastr.remove(pointer.notify_pageloading, true);
                config.callback.photosOnLoad_callback.call(context, pointer.masonryInstance, nodes);
                utils.triggerEvent(config.event.pageLoadCompleted, pointer.masonryInstance, nodes);
            });
        } else {
            pointer.masonryInstance.recalculate(true);
            $.each($('#' + config.selector.albumsContainer_id).children(), function (i, dom) {
                var img = dom.querySelector("img");
                var width = dom.getAttribute("data-width");
                var height = dom.getAttribute("data-height");
                if (img && !img.naturalHeight && width && height) {
                    var scale = img.offsetWidth / width;
                    img.style.height = (height * scale) + "px";
                }
            });
            pointer.masonryInstance.recalculate(true);
            pointer.masonryInstance.recalculateOnImageLoad(true);
        }
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
        "createAlbumNode": function (album) {
            var div = document.createElement("div");
            div.id = (config.selector.album_id_prefix + album.album_id);
            div.className = "album";
            // div.setAttribute("data-order", photo.count);
            div.setAttribute("data-id", album.album_id);
            div.setAttribute("data-uid", album.user ? album.user.uid : '');
            div.setAttribute("data-cover", album.cover.path);
            album.cover.width && div.setAttribute("data-width", album.cover.width);
            album.cover.height && div.setAttribute("data-height", album.cover.height);

            var a = document.createElement("a");
            a.target = "_blank";
            a.href = config.album_href_prefix + album.album_id;
            div.appendChild(a);
            var img = document.createElement("img");
            img.setAttribute("src", config.callback.generatePhotoPreviewUrl.call(context, config.path_params.cloudPath + album.cover.path, album.cover.path, config.page_params.real_col[config.hitColKey]));
            //img.className = "img-thumbnail";
            a.appendChild(img);

            var nameDiv = document.createElement("div");
            nameDiv.className = "album_name";
            div.appendChild(nameDiv);
            var span = document.createElement("span");
            span.title = "点击编辑相册信息";
            span.innerText = album.name;
            nameDiv.appendChild(span);

            config.callback.makeupNode_callback.call(context, div, album);
            return div;
        },
        "getAlbumByCache": function (album_id) {
            var album = null;
            $.each(pointer.albums, function (i, value) {
                if (value.album_id == album_id) {
                    album = value;
                    return false;
                }
            });
            return album;
        },
        "appendAlbumToPage": function (album) {
            if (pointer.albums == null || pointer.albums == undefined) {
                pointer.albums = [];
            }
            pointer.albums.push(album);
            utils.updateAlbumCountInPage();
            utils.calcNavLocation();
        },
        "updateAlbumInPage": function (album) {
            var album_source = utils.getAlbumByCache(album.album_id);
            $.extend(album_source, album);
            var dom = utils.getAlbumDom(album.album_id);
            dom.attr("data-cover", album.cover.path).attr("data-width", album.cover.width).attr("data-height", album.cover.height)
                .find("img").attr("src", config.path_params.cloudPath + album.cover.path).attr("title", album.description);
            dom.find(".album_name span").text(album.name);
        },
        "deleteAlbumInPage": function (album_id) {
            utils.getAlbumDom(album_id).remove();
            var albums = pointer.albums;
            var index = albums.indexOf(utils.getAlbumByCache(album_id));
            albums.splice(index, 1);
            utils.updateAlbumCountInPage();
            jumpPage(config.page_params.pageNum);
            utils.calcNavLocation();
        },
        "getAlbumDom": function (album_id) {
            return $("#" + config.selector.album_id_prefix + album_id);
        },
        "createNavLiNode": function (pageNum, isActive) {
            var li = document.createElement("li");
            li.className = isActive ? "current" : "";
            li.title = "第" + pageNum + "页";
            var a = document.createElement("a");
            a.setAttribute("jumpPage", pageNum);
            a.innerHTML = pageNum;
            li.appendChild(a);
            return li;
        },
        "calcNavLocation": function () {
            var right = $(config.selector.page_nav).parent();
            var left = right.prev();
            if (document.body.clientWidth >= 768) {
                left.css("width", "").css("display", "inline-block");
                right.css("width", "").css("display", "inline-block");
                var maxWidth = right.parent().width() - left.width();
                var right_width = right.width();
                right.css("margin-left", (maxWidth - right_width) / 2)
            } else {
                left.css("width", "100%").css("display", "block");
                right.css("margin-left", "").css("width", "100%").css("display", "block");
            }
        },
        "calcRealCol": function () { // 计算每种分辨率下实际的列数
            // 优先级：地址栏指定 > 用户本地设置 > 默认设置
            if (config.calc_real_col_completed == true) {
                return config.hitColKey;
            } else {
                var col = config.page_params.col; // col指定时则强制修改列数
                var default_col = config.page_params.default_col;
                var widthKeys = Object.keys(default_col);
                var w = window.innerWidth;
                widthKeys.sort(function (left, right) { // 降序
                    return parseInt(right) - parseInt(left);
                });
                var real_col = config.page_params.real_col; // 保存实际的列数
                if (!config.page_params.real_col) {
                    real_col = $.extend({}, config.page_params.default_col);
                    config.page_params.real_col = real_col;
                }
                var hitKey = null; // 当前页面宽度命中的key
                for (var i = widthKeys.length - 1; i >= 0; i--) {
                    var widthKey = widthKeys[i];
                    real_col[widthKey] = (col || default_col[widthKey]);
                    if (hitKey == null && w < parseInt(widthKey)) {
                        hitKey = widthKey;
                    }
                }
                if (hitKey == null) {
                    hitKey = widthKeys[0];
                }
                config.hitColKey = hitKey;
                config.calc_real_col_completed = true;
                return hitKey;
            }
        },
        "calcPageCount": function () {
            var hitKey = utils.calcRealCol();
            var hitCol = config.page_params.real_col[hitKey]; // 当前显示的列数
            // 一页照片数量自适应时是：列数 * 10
            config.page_params.pageSize = (config.page_params.default_size == 0 ? (hitCol * 10) : config.page_params.pageSize);
            return Math.ceil(pointer.albums.length / config.page_params.pageSize);
        },
        "updateAlbumCountInPage": function () {
            var albums = pointer.albums;
            pointer.count = albums.length;
            config.page_params.pageCount = utils.calcPageCount();
            $(config.selector.album_count).text(pointer.count);
        },
        "revisePageNum": function (pagenum) {
            if (isNaN(pagenum)) {
                return 1;
            }
            pagenum = parseInt(pagenum);
            var pageCount = config.page_params.pageCount;
            pageCount < pagenum && (pagenum = pageCount);
            0 >= pagenum && (pagenum = 1);
            return pagenum
        },
        "getAlbumPageNum": function (album_id) {
            var pageNum = 1;
            $.each(pointer.albums, function (i, value) {
                if (value.album_id == album_id) {
                    pageNum = Math.ceil((i + 1) / config.page_params.pageSize);
                    return false;
                }
            });
            return pageNum;
        }
    };

    var context = {
        "config": config,
        "pointer": pointer,
        "init": init,
        "loadAlbums": loadAlbums,
        "jumpPage": jumpPage,
        "assembleCurrentPageHtml": assembleCurrentPageHtml,
        "utils": utils,
        "initWaterfallFlow": initWaterfallFlow
    };

    return context;
});