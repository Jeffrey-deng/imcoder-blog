/**
 * Created by Jeffrey.Deng on 2018/3/29.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'macy', 'magnificPopup', 'jszip', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.album_photo_page_handle = factory(window.jQuery, null, toastr, Macy, null, JSZip, common_utils, login_handle);
    }
})(function ($, bootstrap, toastr, Macy, magnificPopup, JSZip, common_utils, login_handle) {

    // function enlargephoto(img) {
    //     $('#photo-content-img').attr('src', $(img).attr('src'))
    //     $('#photo-content-img').attr('title', $(img).parent().attr('photo-desc'))
    //
    //     var br_height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    //     var br_width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    //
    //     if (img.naturalWidth >= img.naturalHeight) {
    //         $('#photo-content').css('width', img.naturalWidth > br_width ? br_width - 10 : img.naturalWidth + 'px')
    //         $('#photo-content').css('height', '');
    //         $('#photo-content-img').css('width', '100%');
    //         $('#photo-content-img').css('height', '');
    //     } else {
    //         $('#photo-content').css('height', img.naturalHeight > br_height ? br_height - 10 : img.naturalHeight + 'px')
    //         $('#photo-content').css('width', '');
    //         $('#photo-content-img').css('height', "100%")
    //         $('#photo-content-img').css('width', '');
    //     }
    //
    //     $('#enlargephoto-modal').css("display", "block");
    //
    //     if ($('#photo-content-img').height() > br_height) {	//处理电脑端特殊情况
    //         $('#photo-content').css('height', br_height - 5 + 'px');
    //         $('#photo-content').css('width', '');
    //         $('#photo-content-img').css('height', "100%");
    //         $('#photo-content-img').css('width', '');
    //     } else if ($('#photo-content-img').width() > br_width) {	//处理手机端特殊情况
    //         $('#photo-content').css('width', br_width - 5 + 'px');
    //         $('#photo-content').css('height', '');
    //         $('#photo-content-img').css('width', '100%');
    //         $('#photo-content-img').css('height', '');
    //     }
    //
    //     $('#photo-content').css('top', '50%');
    //     $('#photo-content').css('left', '50%');
    //     $('#photo-content').css('margin-left', '-' + $('#photo-content').width() / 2 + 'px');
    //     $('#photo-content').css('margin-top', '-' + $('#photo-content').height() / 2 + 'px');
    // }

    var pointer = {
        album: null,
        masonryInstance: null,
        magnificPopup: null
    };
    var config = {
        callback: {
            "loadPhotos_callback": function (config, success) { // 加载图片列表的回调
                var object = {};
                object.logic_conn = "or";
                object.query_size = 500;
                $.get("photo.do?method=photoListByAjax", object, function (data) {
                    if (data.flag == 200) {
                        var album = {};
                        album.photos = data.photos;
                        album.size = data.photos ? data.photos.length : 0;
                        album.show_col = 0;
                        data.album = album;
                        success(data);
                    } else {
                        toastr.error(data.info, "加载相册信息失败!");
                        console.warn("Error Code: " + data.flag);
                    }
                });
            },
            "generatePhotoPreviewUrl": function (source, relativePath, hitCol) { // 生成预览图片url的函数
                return source;
            },
            "parsePhotosZipName": function (config) {   // 生成打包下载照片压缩包的名字
                var zipName = "pack_" + new Date().getTime();
                return zipName;
            },
            "beforeZipPhotos": function (options) { // 打包下载前可修改下载参数
                return;
            },
            "makeupNode_callback": function (photo_node, photo) {   // 每个照片节点构建时
                return;
            },
            "actionForEditPhoto": function (photo) {    // 用户触发编辑事件时
                //var PhotoImageDom = this.utils.getPhotoImageDom(photo.photo_id);
                return;
            },
            "paginationClick_callback": function (paginationNode) { // 页码被点击
                return;
            },
            "photosOnLoad_callback": function (masonryInstance) {   // 页面加载完成
                return;
            }
        },
        event: { // 以事件方式添加回调，以便支持多个回调，这时定义的是事件名
            "actionForEditPhoto": "photo.edit",
            "pagePaginationClick": "page.jump.click",
            "pageJumpCompleted": "page.jump.completed",
            "pageLoadCompleted": "page.load.completed",
            "popupOpened": "popup.open",
            "popupClosed": "popup.close",
            "popupChanged": "popup.change"
        },
        path_params: {
            "basePath": "https://imcoder.site/",
            "cloudPath": "https://cloud.imcoder.site/",
            "staticPath": "https://static.imcoder.site/"
        },
        selector: {
            "photosContainer_id": "masonryContainer",
            "page_nav": ".page-navigator",
            "photo_id_prefix": "photo_",
            "album_size": "#album_size"
        },
        page_params: {
            "pageSize": 0, // 设置0为自适应：列数 * 10
            "pageCount": 0,
            "pageNum": 1,
            "col": undefined,
            "default_col": {
                "2000": 6,
                "1800": 5,
                "1600": 4,
                "940": 3,
                "720": 2
            }
        },
        isMagnificPopupOpen: false,
        use_album_col: true,
        page_method_address: "dashboard",
        load_condition: null,
        checkPhotoId: 0,
        zipPhoto_groupWithAlbum: false
    };
    var init = function (options) {
        $.extend(true, config, options);
        loadAlbumWithPhotos(config, function (data) {
            pointer.album = data.album;
            if (pointer.album.photos != null) {
                if (config.page_params.pageSize == 0) {
                    config.page_params.default_size = 0;
                }
                config.page_params.pageCount = utils.calcPageCount();
                config.page_params.col && (config.use_album_col = false);
                bindPopstate();
                if (config.checkPhotoId > 0) {
                    jumpPage(utils.getPhotoPageNum(config.checkPhotoId));
                    var params = common_utils.parseURL(window.location.href).params;
                    var search = "?method=" + config.page_method_address;
                    $.each(params, function (key, value) {
                        if (key != "method" && key != "check") {
                            search += "&" + key + "=" + value;
                        }
                    });
                    history.replaceState(
                        {"flag": "page"},
                        document.title,
                        location.pathname + search
                    );
                    $("#" + config.selector.photo_id_prefix + config.checkPhotoId).find("img").click();
                } else {
                    jumpPage(config.page_params.pageNum);
                }
            } else {
                pointer.album.photos = [];
            }

            utils.updateAlbumSizeInPage();
            $(window).resize(function () {
                config.calc_real_col_completed = false;
                utils.calcNavLocation();
            });

            // log
            console.log("init params: ");
            console.log("   { albumSize: " + pointer.album.photos.length +
                ", pageSize: " + config.page_params.pageSize +
                ", col: " + (config.page_params.col || pointer.album.show_col) +
                ", pageNum: " + config.page_params.pageNum +
                (config.checkPhotoId ? (", checkPhotoId: " + config.checkPhotoId + " }") : " }")
            );
            console.log("search params: ");
            var search = "";
            if (config.load_condition) {
                $.each(config.load_condition, function (key, value) {
                    if (value && key != "method" && key != "size" && key != "col" && key != "page" && key != "check") {
                        search += ", " + key + ": " + value;
                    }
                });
                search = "{ method: " + config.page_method_address + search + " }";
                config.search_params = search;
            }
            console.log("   " + search);

            // 打包下载
            $(config.selector.album_size).click(function () {
                var zipName = config.callback.parsePhotosZipName.call(context, config);
                zipName !== false && utils.zipPhotosAndDownload(zipName);
            });
        });
    };
    var loadAlbumWithPhotos = function (config, success) {
        config.callback.loadPhotos_callback.call(context, config, success);
    };
    var jumpPage = function (pagenum) {
        config.page_params.pageCount = utils.calcPageCount();
        var photos = pointer.album.photos,
            pageSize = config.page_params.pageSize;

        pagenum = utils.revisePageNum(pagenum);
        config.page_params.pageNum = pagenum;

        common_utils.removeNotify("notify_pageLoading");
        common_utils.notify({
            "progressBar": false,
            "timeOut": 0,
            "closeButton": false
        }).success("加载中～", "第" + config.page_params.pageNum + "页", "notify_pageLoading");

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

        $('#' + config.selector.photosContainer_id).find("img").on("dragstart", function (e) {
            var uid = parseInt(e.currentTarget.parentNode.getAttribute("data-uid"));
            var isAuthor = login_handle.equalsLoginUser(uid);
            var tips = isAuthor ? "松开鼠标打开编辑窗口~" : "松开鼠标查看图片信息~";
            common_utils.notify({
                "progressBar": false,
                "timeOut": 0,
                "closeButton": false
            }).success(tips, "", "notify_drag");
        });
        $('#' + config.selector.photosContainer_id).find("img").on("dragend", function (e) {
            common_utils.removeNotify("notify_drag");
            var photo = utils.getPhotoByCache(e.currentTarget.parentNode.getAttribute("data-id"));
            config.callback.actionForEditPhoto.call(context, photo);
            utils.triggerEvent(config.event.actionForEditPhoto, photo);
        });

        initWaterfallFlow();

        initClickEnlarge();
        /*$(window).resize(function () {
         initClickEnlarge();
         });*/

        var params = common_utils.parseURL(window.location.href).params;
        var search = "?method=" + config.page_method_address;
        $.each(params, function (key, value) {
            if (key != "method" && key != "page") {
                search += "&" + key + "=" + value;
            }
        });
        (pagenum != 1) && (search += "&page=" + pagenum);
        history.replaceState(
            {"flag": "page"},
            document.title,
            location.pathname + search
        );
        utils.triggerEvent(config.event.pageJumpCompleted, pagenum); // 页码跳转完成事件
    };
    var assembleCurrentPageHtml = function (pagenum) {
        var photos = pointer.album.photos,
            pageSize = config.page_params.pageSize,
            start = (pagenum - 1) * pageSize,
            end = start + (photos.length - start < pageSize ? photos.length - start - 1 : pageSize - 1),
            pageCount = config.page_params.pageCount,
            fragment = document.createDocumentFragment();

        for (var i = start; i <= end; i++) {
            fragment.appendChild(utils.createPhotoNode(photos[i]));
        }

        var photosContainer = document.getElementById(config.selector.photosContainer_id);
        photosContainer.innerHTML = "";
        photosContainer.appendChild(fragment);

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
        "createPhotoNode": function (photo) {
            var div = document.createElement("div");
            div.id = config.selector.photo_id_prefix + photo.photo_id;
            div.className = "photo";
            div.title = photo.name;
            //div.setAttribute("data-order", photo.photo_id);
            div.setAttribute("data-id", photo.photo_id);
            div.setAttribute("data-uid", photo.uid);
            div.setAttribute("data-name", photo.name);
            div.setAttribute("data-desc", photo.description);
            div.setAttribute("data-width", photo.width);
            div.setAttribute("data-height", photo.height);
            div.setAttribute("data-iscover", photo.iscover);
            div.setAttribute("data-path", photo.path);
            var img = document.createElement("img");
            img.setAttribute("src", config.callback.generatePhotoPreviewUrl.call(context, (config.path_params.cloudPath + photo.path), photo.path, config.page_params.real_col[config.hitColKey]));
            //img.className = "img-thumbnail";
            div.appendChild(img);
            config.callback.makeupNode_callback.call(context, div, photo);
            return div;
        },
        "getPhotoByCache": function (photo_id) {
            var photo = null;
            $.each(pointer.album.photos, function (i, value) {
                if (value.photo_id == photo_id) {
                    photo = value;
                    return false;
                }
            });
            if (!photo) {
                common_utils.notify().error("未在缓存中找到照片 " + photo_id, "error", "error-not-found-photo");
            }
            return photo;
        },
        "appendPhotoToPage": function (photo) {
            if (pointer.album.photos == null || pointer.album.photos == undefined) {
                pointer.album.photos = [];
            }
            pointer.album.photos.push(photo);
            utils.updateAlbumSizeInPage();
            utils.calcNavLocation();
        },
        "updatePhotoInPage": function (photo) {
            var photo_source = utils.getPhotoByCache(photo.photo_id);
            if (photo.iscover == 1) {
                $.each(pointer.album.photos, function (i, value) {
                    if (photo_source.album_id == value.album_id && value.iscover == 1) {
                        value.iscover = 0;
                        $("#" + config.selector.photo_id_prefix + value.photo_id).attr("data-iscover", 0);
                    }
                });
            }
            $.extend(photo_source, photo);
            $("#" + config.selector.photo_id_prefix + photo.photo_id).attr("data-name", photo.name).attr("title", photo.name)
                .attr("data-desc", photo.description).attr("data-iscover", photo.iscover);
        },
        "deletePhotoInPage": function (photo_id) {
            $("#" + config.selector.photo_id_prefix + photo_id).remove();
            var album = pointer.album;
            var index = album.photos.indexOf(utils.getPhotoByCache(photo_id));
            album.photos.splice(index, 1);
            utils.updateAlbumSizeInPage();
            jumpPage(config.page_params.pageNum);
            utils.calcNavLocation();
        },
        "getPhotoImageDom": function (photo_id) {
            return $("#" + config.selector.photo_id_prefix + photo_id);
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
            // 优先级：地址栏指定 > 相册属性指定 > 用户本地设置 > 默认设置
            if (config.calc_real_col_completed == true) {
                return config.hitColKey;
            } else {
                var use_album_col = config.use_album_col;
                var col = config.page_params.col; // col指定时则强制修改列数
                var default_col = config.page_params.default_col;
                var user_defined_col = pointer.album.show_col; // 用户定义的该相册的列数
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
                    if (parseInt(widthKey) > 940) { // 大于940的不限制最大列数
                        real_col[widthKey] = (col || (user_defined_col == 0 ? default_col[widthKey] : user_defined_col));
                    } else {
                        real_col[widthKey] = (col || (user_defined_col == 0 ? default_col[widthKey] : (user_defined_col < default_col[widthKey] ? user_defined_col : default_col[widthKey])));
                    }
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
            return Math.ceil(pointer.album.photos.length / config.page_params.pageSize);
        },
        "updateAlbumSizeInPage": function () {
            var album = pointer.album;
            album.size = album.photos.length;
            config.page_params.pageCount = utils.calcPageCount();
            $(config.selector.album_size).text(album.size);
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
        "getPhotoPageNum": function (photo_id) {
            var pageNum = 1;
            $.each(pointer.album.photos, function (i, value) {
                if (value.photo_id == photo_id) {
                    pageNum = Math.ceil((i + 1) / config.page_params.pageSize);
                    return false;
                }
            });
            return pageNum;
        },
        "zipPhotosAndDownload": function (fileName) {
            var options = {
                cloudPath: config.path_params.cloudPath,
                album: pointer.album,
                key: config.search_params,
                callback: {
                    "parseFiles_callback": function (location_info, options) {
                        // options.photos.slice(0)
                        /*var photo_arr = [];
                         $.each(options.album.photos, function (i, photo_src) {
                         var photo = $.extend(true, {}, photo_src);
                         photo.url = options.cloudPath + photo.path;
                         photo.location = "photos";
                         photo_arr.push(photo);
                         });*/
                        var groupWithAlbum = config.zipPhoto_groupWithAlbum;
                        var photo_arr = options.album.photos;
                        $.each(photo_arr, function (i, photo) {
                            photo.url = options.cloudPath + photo.path;
                            photo.location = "photos" + (groupWithAlbum ? ("/" + photo.album_id) : "");
                        });
                        return photo_arr;
                    },
                    "makeNames_callback": function (photos, location_info, options) {
                        var names = {};
                        names.zipName = fileName;
                        names.folderName = names.zipName;
                        names.prefix = "";
                        names.suffix = null;
                        return names;
                    },
                    "beforeFileDownload_callback": function (photos, names, location_info, options, zip, main_folder) {
                        main_folder.file("photos_info.json", JSON.stringify(options.album));
                        main_folder.file("photos_info_format.txt", common_utils.formatJson(options.album));
                        var page_info = "url: " + decodeURIComponent(decodeURIComponent(location_info.source)) + "\r\n" + "title: " + document.title + "\r\n" + "search params: " + options.key;
                        main_folder.file("page_info.txt", page_info);
                    },
                    "eachFileOnload_callback": function (blob, photo, location_info, options, zipFileLength, zip, main_folder, folder) {
                        var fileName = photo.path.substring(photo.path.lastIndexOf('/') + 1);
                        photo.fileName = fileName;
                        if (blob == null) {
                            toastr.error("照片" + photo.photo_id + "打包失败，已单独下载！", "", {"progressBar": false, timeOut: 0});
                            common_utils.downloadUrlFile(photo.url, fileName);
                        }
                        return true;
                    }
                }
            };
            config.callback.beforeZipPhotos.call(context, options);
            common_utils.zipRemoteFilesAndDownload(JSZip, options);
        },
        "closePhotoPopup": function () {
            $.magnificPopup.close();
        }
    };
    // 瀑布流
    var initWaterfallFlow = function () {
        /*$("#masonry").mpmansory(
         {
         childrenClass: 'photo', // default is a div
         columnClasses: 'padding', //add classes to items
         breakpoints: {
         lg: 3,
         md: 4,
         sm: 6,
         xs: 6
         },
         distributeBy: {order: false, height: false, attr: 'data-order', attrOrder: 'asc'},
         onload: function (items) {
         //make somthing with items
         }
         }
         );*/
        /*
         var $grid = $('#masonry').masonry({
         // set itemSelector so .grid-sizer is not used in layout
         itemSelector: '.box',
         // use element for option
         columnWidth: ".box-size",
         //percentPosition: true,
         fitWidth: true,
         gutter: 10
         });

         $grid.imagesLoaded().progress( function() {
         $grid.masonry('layout');
         });*/
        var real_col = config.page_params.real_col;
        if (pointer.masonryInstance == null) {
            pointer.masonryInstance = new Macy({
                container: '#' + config.selector.photosContainer_id, // 图像列表容器id
                trueOrder: false,
                waitForImages: true,
                useOwnImageLoader: false,
                //设计间距
                margin: {
                    x: 7.5,
                    y: 7.5
                },
                //设置列数
                columns: real_col["2000"],
                //定义不同分辨率（1200，940，520，400这些是分辨率）
                breakAt: {
                    1800: { // 1600px以下显示
                        columns: real_col["1800"],
                        margin: {
                            x: 7.5,
                            y: 7.5
                        }
                    },
                    1600: { // 1600px以下显示
                        columns: real_col["1600"],
                        margin: {
                            x: 7.5,
                            y: 7.5
                        }
                    },
                    940: {
                        columns: real_col["940"],
                        margin: {
                            x: 10,
                            y: 10
                        }
                    },
                    720: {
                        columns: real_col["720"],
                        margin: {
                            x: 7,
                            y: 7
                        }
                    }
                }
            });
            pointer.masonryInstance.recalculate(true);
            $.each($('#' + config.selector.photosContainer_id).children(), function (i, dom) {
                var img = dom.querySelector("img");
                if (!img.naturalHeight) {
                    var scale = img.offsetWidth / dom.getAttribute("data-width");
                    img.style.height = (dom.getAttribute("data-height") * scale) + "px";
                }
            });
            pointer.masonryInstance.recalculate(true);
            pointer.masonryInstance.runOnImageLoad(function () {
                var nodes = $('#' + config.selector.photosContainer_id).children();
                $.each(nodes, function (i, dom) {
                    var img = dom.querySelector("img");
                    if (img && img.style.height) {
                        img.style.height = "";
                    }
                });
                pointer.masonryInstance.recalculate(true);
                console.log('第 ' + config.page_params.pageNum + ' 页加载完成！');
                //pointer.masonryInstance.recalculate(true, true); 刷新所有（无视完成标记） / 添加完成标记
                common_utils.removeNotify("notify_pageLoading");
                config.callback.photosOnLoad_callback.call(context, pointer.masonryInstance, nodes);
                utils.triggerEvent(config.event.pageLoadCompleted, pointer.masonryInstance, nodes);
            });
        } else {
            pointer.masonryInstance.recalculate(true);
            $.each($('#' + config.selector.photosContainer_id).children(), function (i, dom) {
                var img = dom.querySelector("img");
                if (img && !img.naturalHeight) {
                    var scale = img.offsetWidth / dom.getAttribute("data-width");
                    img.style.height = (dom.getAttribute("data-height") * scale) + "px";
                }
            });
            pointer.masonryInstance.recalculate(true);
            pointer.masonryInstance.recalculateOnImageLoad(true);
        }
    };
    var bindPopstate = function () {
        window.addEventListener('popstate', function (e) {
            var data = e.state;
            //console.log(data);
            if (data == null) {
                return;
            } else if (data.flag == "page" && config.isMagnificPopupOpen) { // 转到列表界面时，当灯箱未关闭时运行（即只有当点击浏览器返回按钮时运行）
                $.magnificPopup.close();
            } else if (data.flag == "check" && !config.isMagnificPopupOpen) { // 转到详情界面时，当灯箱未开启时运行（即只有当点击浏览器前进按钮时运行）
                var params = common_utils.parseURL(window.location.href).params;
                var photo_id = params.check;
                if (photo_id) {
                    $("#photo_" + photo_id).children().click();
                }
            }
        });
    };
    var initClickEnlarge = function () {
        //图片查看modal
        $('.photo').magnificPopup({
            delegate: 'img', // child items selector, by clicking on it popup will open
            type: 'image',
            //tLoading: null,
            callbacks: {
                elementParse: function (item) {
                    // Function will fire for each target element
                    // "item.el" is a target DOM element (if present)
                    // "item.src" is a source that you may modify
                    item.src = config.path_params.cloudPath + item.el[0].parentNode.getAttribute("data-path");
                    item.photo_id = item.el[0].parentNode.getAttribute("data-id");
                },
                markupParse: function (template, values, item) {
                    // Triggers each time when content of popup changes
                    // console.log('Parsing:', template, values, item);
                    var photo_node = item.el[0].parentNode;
                    var isAuthor = login_handle.equalsLoginUser(parseInt(photo_node.getAttribute("data-uid")));
                    var photo_id = photo_node.getAttribute("data-id");
                    var trigger = '<a style="color:white;cursor: pointer;margin-right: 5px" class="openPhotoDetailPage" photo-id=' + photo_id + ' title="点击打开图片详情页"' +
                        ' href="photo.do?method=detail&id=' + photo_id + '" target="_blank"' +
                        '>评论</a>';
                    if (isAuthor) {
                        trigger += '<a style="color:white;cursor: pointer;" class="openUpdateModal" photo-id=' + photo_id + ' title="点击编辑图片信息">编辑</a>'
                    } else {
                        trigger += '<a style="color:white;cursor: pointer;" class="openUpdateModal" photo-id=' + photo_id + ' title="点击查看图片信息">属性</a>'
                    }
                    // 修复只有一张图片时不显示 counter 的BUG
                    var pagePhotoOnlyOne = (config.page_params.pageSize == 1) || ((config.page_params.pageNum == config.page_params.pageCount) && ((pointer.album.photos.length - 1) % config.page_params.pageSize === 0));
                    if (pagePhotoOnlyOne) {
                        values.counter = '{updateModalTrigger}&nbsp; 1 of 1';
                        // .mfp-bottom-bar .mfp-counter
                    }
                    values.counter = values.counter.replace(/\{updateModalTrigger\}/, trigger);

                    //template.find(".mfp-title").width("calc(100% - 40px)");
                },
                change: function () {
                    //console.log(this.content); // Direct reference to your popup element
                    $(this.content).find(".openUpdateModal").unbind("click").click(function () {
                        var photo = utils.getPhotoByCache(this.getAttribute("photo-id"));
                        config.callback.actionForEditPhoto.call(context, photo);
                        utils.triggerEvent(config.event.actionForEditPhoto, photo);
                    });
                    // 修改地址栏, 改变check, 在切换图片的时候
                    if (config.isMagnificPopupOpen) { // 灯箱打开的时候不替换，切换的时候替换, 回调markupParse,change在open之前运行
                        var params = common_utils.parseURL(document.location.href).params;
                        var search = "?method=" + config.page_method_address;
                        $.each(params, function (key, value) {
                            if (key != "method" && key != "check") {
                                search += "&" + key + "=" + value;
                            }
                        });
                        search += "&check=" + this.currItem.photo_id;
                        history.replaceState(
                            {"flag": "check"},
                            document.title,
                            location.pathname + search
                        );
                    }
                    utils.triggerEvent(config.event.popupChanged, this.currItem.photo_id);
                },
                open: function () {
                    // Will fire when this exact popup is opened
                    // this - is Magnific Popup object
                    // 修改地址栏, 增加check, 在打开图片的时候
                    config.isMagnificPopupOpen = true;
                    var params = common_utils.parseURL(window.location.href).params;
                    var check = params.check;
                    if (!check) { // 当已经到详情页，就不运行
                        var search = "?method=" + config.page_method_address;
                        $.each(params, function (key, value) {
                            if (key != "method" && key != "check") {
                                search += "&" + key + "=" + value;
                            }
                        });
                        check = $.magnificPopup.instance.currItem.photo_id;
                        search += "&check=" + check;
                        history.pushState(
                            {"flag": "check"},
                            document.title,
                            location.pathname + search
                        );
                    }
                    utils.triggerEvent(config.event.popupOpened, check);
                },
                close: function () {
                    // Will fire when popup is closed
                    // 修改地址栏, 去掉check, 在关闭图片的时候
                    config.isMagnificPopupOpen = false;
                    var params = common_utils.parseURL(document.location.href).params;
                    var check = params.check;
                    if (check) { // 当已经到列表页就不运行
                        history.back();
                    } else {
                        check = this.currItem.photo_id;
                    }
                    utils.triggerEvent(config.event.popupClosed, check);
                }
            },
            gallery: {
                enabled: true, // set to true to enable gallery
                navigateByImgClick: true,
                arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>', // markup of an arrow button
                tPrev: '上一张', // title for left button,'Previous (Left arrow key)
                tNext: '下一张', // title for right button,Next (Right arrow key)
                tCounter: '{updateModalTrigger}&nbsp; %curr% of %total%' // markup of counter
            },
            removalDelay: 300,
            mainClass: 'mfp-with-zoom',
            fixedContentPos: true,
            fixedBgPos: true,
            autoFocusLast: true,
            closeBtnInside: true,
            image: {
                cursor: 'mfp-zoom-out-cur', // Class that adds zoom cursor, will be added to body. Set to null to disable zoom out cursor.
                titleSrc: function (item) {
                    var photoNode = item.el[0].parentNode;
                    var name = photoNode.getAttribute('data-name');
                    var desc = photoNode.getAttribute('data-desc');
                    var src = config.path_params.cloudPath + photoNode.getAttribute("data-path");
                    var photoDetailUrl = "photo.do?method=detail&id=" + item.photo_id;
                    if ((!desc) && name) {
                        desc = name;
                        name = "";
                    }
                    return '<a style="color:white;cursor: pointer;" href="' + photoDetailUrl + '" target="_blank" title="点击新标签打开图片">' + desc + '</a><small>' + name + '</small>';
                },
                verticalFit: true, // Fits image in area vertically
                tError: '<a href="%url%" target="_blank">此图片</a> 不能加载.' // Error message
            },
            zoom: {
                enabled: true, // By default it's false, so don't forget to enable it
                duration: 350, // duration of the effect, in milliseconds
                easing: 'ease-in-out', // CSS transition easing function
                // The "opener" function should return the element from which popup will be zoomed in
                // and to which popup will be scaled down
                // By defailt it looks for an image tag:
                opener: function (openerElement) {
                    // openerElement is the element on which popup was initialized, in this case its <a> tag
                    // you don't need to add "opener" option if this code matches your needs, it's defailt one.
                    return openerElement.is('img') ? openerElement : openerElement.find('img');
                }
            }
        });

        pointer.magnificPopup = $.magnificPopup.instance;

        // $('.photo img').click(function () {
        //     enlargephoto(this)
        // });
        //
        // $(window).resize(function () {
        //     $('.photo img').click(function () {
        //         enlargephoto(this)
        //     });
        // });
        //
        // $('#enlargephoto-modal .close').click(function () {
        //     $('#enlargephoto-modal').css("display", "none");
        // });
        //
        // $('#enlargephoto-modal .fog').click(function () {
        //     $('#enlargephoto-modal').css("display", "none");
        // });
    };

    var context = {
        "config": config,
        "pointer": pointer,
        "init": init,
        "loadAlbumWithPhotos": loadAlbumWithPhotos,
        "jumpPage": jumpPage,
        "assembleCurrentPageHtml": assembleCurrentPageHtml,
        "utils": utils,
        "initWaterfallFlow": initWaterfallFlow
    };

    return context;
});
