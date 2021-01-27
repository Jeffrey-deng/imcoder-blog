/**
 * 照片页面处理插件
 * @author Jeffery.deng
 * @date 2018/3/29
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'macy', 'magnificPopup', 'jszip', 'globals', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.album_photo_page_handle = factory(window.jQuery, null, toastr, Macy, null, JSZip, globals, common_utils, login_handle);
    }
})(function ($, bootstrap, toastr, Macy, magnificPopup, JSZip, globals, common_utils, login_handle) {

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
    //         $('#photo-content-img').css('height', '100%')
    //         $('#photo-content-img').css('width', '');
    //     }
    //
    //     $('#enlargephoto-modal').css('display', 'block');
    //
    //     if ($('#photo-content-img').height() > br_height) {	//处理电脑端特殊情况
    //         $('#photo-content').css('height', br_height - 5 + 'px');
    //         $('#photo-content').css('width', '');
    //         $('#photo-content-img').css('height', '100%');
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
                let condition = {}, context = this;
                condition.logic_conn = "or";
                condition.query_size = 500;
                return globals.request.get(globals.api.getPhotoList, condition, true, '加载相册信息失败').final(function (data) {
                    let album = {};
                    album.photos = data.photos;
                    album.size = data.photos ? data.photos.length : 0;
                    album.show_col = 0;
                    data.album = album;
                    success.call(context, data);
                });
            },
            "generatePhotoPreviewUrl": function (source, hitCol) { // 生成预览图片url的函数
                return source;
            },
            "parsePhotosZipName": function (config) {   // 生成打包下载照片压缩包的名字
                var zipName = 'pack_' + new Date().getTime();
                return zipName;
            },
            "beforeZipPhotos": function (options) { // 打包下载前可修改下载参数
                return;
            },
            "makeupNode_callback": function (photo_node, photo) {   // 每个照片节点构建时
                return;
            },
            "actionForEditPhoto": function (photo, triggerType) {    // 用户触发编辑事件时
                //var $photoNode = this.utils.getPhotoImageDom(photo.photo_id);
                return;
            },
            "paginationClick_callback": function (paginationNode) { // 页码被点击
                return;
            },
            "pageJumpCompleted_callback": function (pageNum) { // 页面跳转完成
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
        path_params: globals.path_params,
        selector: {
            "photosContainer_id": "masonryContainer",
            "page_nav": ".page-navigator",
            "photo_id_prefix": "photo_",
            "photo_node": ".photo",
            "album_size": "#album_size"
        },
        page_params: {
            "pageSize": 0, // 设置0为自适应：列数 * 10
            "pageCount": 0,
            "pageNum": 1,
            "col": undefined,
            "default_col": {
                "2000+": 6,
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
        photoNodeLinkUsePhotoDetail: true,
        zipPhoto_groupWithAlbum: false,
        zipPhoto_groupWithMirrorPath: false,
        allowZipPhotos: false,
        img_load_error_default: "res/img/img_load_error_default.jpg",
        protect_attr_regexp: /#protect@(\w+)#/i
    };
    var init = function (options) {
        $.extendNotNull(true, config, options);
        loadAlbumWithPhotos(config, function (data) {
            pointer.album = data.album;
            if (pointer.album.photos != null) {
                if (config.page_params.pageSize == 0) {
                    config.page_params.default_size = 0;
                }
                config.page_params.pageCount = utils.calcPageCount();
                config.page_params.col && (config.use_album_col = false);

                $(config.selector.page_nav).on('click', 'a', function (e) {
                    var _self = e.currentTarget;
                    var className = _self.parentNode.className;
                    if (className == 'page-left') {
                        jumpPage(config.page_params.pageNum - 1);
                    } else if (className == 'page-right') {
                        jumpPage(config.page_params.pageNum + 1);
                    } else if (className != 'separator') {
                        jumpPage(_self.getAttribute('jumpPage'))
                    }
                    config.callback.paginationClick_callback.call(context, _self.parentNode);
                    context.trigger(config.event.pagePaginationClick, _self.parentNode);
                    return false;
                });

                $('#' + config.selector.photosContainer_id)
                    .on({
                        "dragstart": function (e) {
                            var uid = $(e.currentTarget).closest(config.selector.photo_node).attr('data-uid'),
                                isAuthor = login_handle.equalsLoginUser(uid),
                                tips = isAuthor ? '松开鼠标打开编辑窗口~' : '松开鼠标查看图片信息~';
                            globals.notify({
                                "progressBar": false,
                                "timeOut": 0,
                                "closeButton": false
                            }).success(tips, '', 'notify_drag');
                        },
                        "dragend": function (e) {
                            globals.removeNotify('notify_drag');
                            var photo = utils.getPhotoByCache($(e.currentTarget).closest(config.selector.photo_node).attr('data-id'));
                            config.callback.actionForEditPhoto.call(context, photo, 'drag');
                            context.trigger(config.event.actionForEditPhoto, photo, 'drag');
                        }
                    }, 'a')
                    .on('click', config.selector.photo_node + ' .photo-detail-link', function (e) {
                        e.preventDefault();
                    }).on('click', config.selector.photo_node + ' .photo-detail-link.image-widget.protect', function (e) {
                        e.target === this && $(this).find('img').trigger('click');
                    });

                initClickEnlarge();

                initWaterfallFlow();

                bindPopstate();

                if (config.checkPhotoId) {
                    jumpPage(utils.getPhotoPageNum(config.checkPhotoId));
                    var params = common_utils.parseURL(window.location.href).params;
                    var search = '';
                    $.each(params, function (key, value) {
                        if (key != 'method' && key != 'check') {
                            search += '&' + key + '=' + value;
                        }
                    });
                    search = (search ? ('?' + search.substring(1)) : '');
                    history.replaceState(
                        {"mark": "page"},
                        document.title,
                        location.pathname + search
                    );
                    utils.openPhotoPopup(config.checkPhotoId);
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
            console.log('init params: ');
            console.log('   { albumSize: ' + pointer.album.photos.length +
                ", pageSize: " + config.page_params.pageSize +
                ", col: " + (config.page_params.col || pointer.album.show_col) +
                ", pageNum: " + config.page_params.pageNum +
                (config.checkPhotoId ? (', checkPhotoId: ' + config.checkPhotoId + ' }') : ' }')
            );
            console.log('search params: ');
            var search = '';
            if (config.load_condition) {
                $.each(config.load_condition, function (key, value) {
                    if (value && key != 'method' && key != 'size' && key != 'col' && key != 'page' && key != 'check') {
                        search += ', ' + key + ': ' + value;
                    }
                });
                search = '{ method: ' + config.page_method_address + search + ' }';
                config.search_params = search;
            }
            console.log('   ' + search);

            // 打包下载
            $(config.selector.album_size).click(function () {
                var zipName = config.callback.parsePhotosZipName.call(context, config);
                zipName !== false && utils.zipPhotosAndDownload(zipName);
            });
            // 触发服务器未统计的在相册内图片访问事件
            context.on(config.event.popupChanged, function (e, photo_id) {
                if (photo_id) {
                    if (!utils.getPhotoImageDom(photo_id).hasClass('has-trigger-photo-access')) {
                        setTimeout(function () {
                            request.triggerPhotoAccess(photo_id, function (photo) {
                                utils.getPhotoImageDom(photo_id).addClass('has-trigger-photo-access');
                            });
                        }, 100);
                    }
                }
            })
        });
    };
    var loadAlbumWithPhotos = function (config, success) {
        config.callback.loadPhotos_callback.call(context, config, success);
    };
    const request = globals.extend(globals.request, {
        album_photo_page_handle: {
            'likePhoto': function (photo_id, undo, success) {
                let postData = {"photo_id": photo_id, 'undo': undo};
                return globals.request.post(globals.api.likePhoto, postData, success, ['photo', 'type'], success && '点赞失败');
            },
            'triggerPhotoAccess': function (photo_id, success) {
                let postData = typeof photo_id === 'object' ? {"photo_id": photo_id.photo_id} : {"photo_id": photo_id};
                postData.deep = 0;
                postData.first_access_referer = document.referrer;
                postData.first_access_path = document.location.href;
                return globals.request.post(globals.api.triggerPhotoAccess, postData, success, ['photo'], false);
            },
        }
    }).album_photo_page_handle;
    var jumpPage = function (pageNum) {
        config.page_params.pageCount = utils.calcPageCount();
        var photos = pointer.album.photos,
            pageSize = config.page_params.pageSize;

        pageNum = utils.revisePageNum(pageNum);
        config.page_params.pageNum = pageNum;

        globals.removeNotify('notify_pageLoading');
        globals.notify({
            "progressBar": false,
            "hideDuration": 0,
            "showDuration": 0,
            "timeOut": 0,
            "closeButton": false
        }).success('加载中～', '第' + config.page_params.pageNum + '页', 'notify_pageLoading');

        // 组装该页的html
        assembleCurrentPageHtml(pageNum);

        // 瀑布流重新计算
        pointer.masonryInstance.recalculate(true);
        $.each($('#' + config.selector.photosContainer_id).children(), function (i, dom) {
            var img = dom.querySelector('img');
            if (img && !img.naturalHeight) {
                var scale = img.offsetWidth / dom.getAttribute('data-width');
                img.style.height = (dom.getAttribute('data-height') * scale) + 'px';
            }
        });
        pointer.masonryInstance.recalculate(true);
        pointer.masonryInstance.recalculateOnImageLoad(true);

        var params = common_utils.parseURL(window.location.href).params;
        var search = '';
        $.each(params, function (key, value) {
            if (key != 'method' && key != 'page') {
                search += '&' + key + '=' + value;
            }
        });
        (pageNum != 1) && (search += '&page=' + pageNum);
        search = (search ? ('?' + search.substring(1)) : '');
        if (window.location.hash && window.location.hash != '#') {
            search += window.location.hash
        }
        history.replaceState(
            {"mark": "page"},
            document.title,
            location.pathname + search
        );
        config.callback.pageJumpCompleted_callback.call(context, pageNum); // 页码跳转完成事件
        context.trigger(config.event.pageJumpCompleted, pageNum);
    };
    var assembleCurrentPageHtml = function (pageNum) {
        let photos = pointer.album.photos,
            pageSize = config.page_params.pageSize,
            start = (pageNum - 1) * pageSize,
            end = start + (photos.length - start < pageSize ? photos.length - start - 1 : pageSize - 1),
            pageCount = config.page_params.pageCount,
            fragment = document.createDocumentFragment();

        for (let i = start; i <= end; i++) {
            fragment.appendChild(utils.createPhotoNode(photos[i]));
        }

        let $photosContainer = $('#' + config.selector.photosContainer_id);
        // empty()会移除子元素上的所有事件和数据data
        // 只用 photosContainer.innerHTML = ''; 会有内存泄露，因为数据还在JQuery里存着
        $photosContainer.empty().append(fragment);
        common_utils.bindImgErrorHandler($photosContainer.find('img'), config.path_params.cloudPath + config.img_load_error_default);

        // 分页
        let navigator_fragment = document.createDocumentFragment();
        let separator = utils.createNavLiNode('...', false);
        separator.removeAttribute('title');
        separator.className = "separator";
        let half = document.body.clientWidth >= 768 ? 6 : 3;
        if (pageNum != 1 && pageCount > 1) {
            let page_left = utils.createNavLiNode('« ', false);
            page_left.title = "前一页";
            page_left.className = "page-left";
            navigator_fragment.appendChild(page_left);
        }
        if (pageNum - half > 1 + 1) {
            navigator_fragment.appendChild(utils.createNavLiNode(1, false));
            navigator_fragment.appendChild(separator);
        }
        for (let i = (pageNum - half > 1 + 1) ? (pageNum - half) : 1, max = pageNum; i < max; i++) {
            navigator_fragment.appendChild(utils.createNavLiNode(i, false));
        }
        navigator_fragment.appendChild(utils.createNavLiNode(pageNum, true));
        for (let i = (pageNum + 1), max = (pageNum + half < pageCount - 1 ? (pageNum + half) : pageCount); i <= max; i++) {
            navigator_fragment.appendChild(utils.createNavLiNode(i, false));
        }
        if (pageNum + half < pageCount - 1) {
            navigator_fragment.appendChild(separator.cloneNode(true));
            navigator_fragment.appendChild(utils.createNavLiNode(pageCount, false));
        }
        if (pageNum != pageCount && pageCount > 1) {
            let page_right = utils.createNavLiNode(' »', false);
            page_right.title = "后一页";
            page_right.className = "page-right";
            navigator_fragment.appendChild(page_right);
        }
        let $page_nav_dom = $(config.selector.page_nav);
        $page_nav_dom.html(navigator_fragment);
        utils.calcNavLocation();
    };
    var utils = {
        "createPhotoNode": function (photo) {
            var div = document.createElement('div'),
                protectAttr = config.protect_attr_regexp.test(photo.tags) && (RegExp.$1 || 'all');
            div.id = config.selector.photo_id_prefix + photo.photo_id;
            div.className = "photo";
            div.title = (protectAttr != 'all' && protectAttr != 'name') ? photo.name : '';
            //div.setAttribute('data-order', photo.photo_id);
            div.setAttribute('data-id', photo.photo_id);
            div.setAttribute('data-uid', photo.uid);
            div.setAttribute('data-name', photo.name);
            div.setAttribute('data-desc', photo.description);
            div.setAttribute('data-width', photo.width);
            div.setAttribute('data-height', photo.height);
            div.setAttribute('data-origin-path', photo.path);
            var a = document.createElement('a');
            a.target = '_blank';
            if (config.photoNodeLinkUsePhotoDetail) {
                a.href = ('p/detail/' + photo.photo_id).toURL();
            } else {
                a.href = photo.path;
            }
            a.className = 'photo-detail-link image-widget protect';
            div.appendChild(a);
            var img = document.createElement('img');
            img.setAttribute('src', config.callback.generatePhotoPreviewUrl.call(context, photo.path, config.page_params.real_col[config.hitColKey]));
            //img.className = "img-thumbnail";
            a.appendChild(img);
            div.appendChild(a);
            $(div).data('photo', photo);
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
                globals.notify().error('未在缓存中找到照片 ' + photo_id, 'error', 'error-not-found-photo');
            }
            return photo;
        },
        "appendPhotoToPage": function (photo) {
            if (pointer.album.photos == null || pointer.album.photos == undefined) {
                pointer.album.photos = [];
            }
            if (photo.topic && photo.topic.ptwid) {
                var update_ptwid = photo.topic.ptwid;
                var update_scope = photo.topic.scope;
                var update_permission = photo.topic.permission;
                $.each(pointer.album.photos, function (i, p) {
                    if (p.topic && p.topic.ptwid && p.topic.ptwid == update_ptwid && (p.topic.scope != update_scope || p.topic.permission != update_permission)) {
                        p.topic = $.extend({}, photo.topic);
                    }
                });
            }
            pointer.album.photos.push(photo);
            utils.updateAlbumSizeInPage();
            utils.calcNavLocation();
        },
        "updatePhotoInPage": function (photo) {
            var photo_source = utils.getPhotoByCache(photo.photo_id);
            if (photo.topic && photo.topic.ptwid) {
                var isTopicPermissionUpdate = (!photo_source.topic || !photo_source.topic.ptwid || photo_source.topic.ptwid != photo.topic.ptwid ||
                (photo_source.topic.scope != photo.topic.scope || photo_source.topic.permission != photo.topic.permission));
                if (isTopicPermissionUpdate) {
                    var update_ptwid = photo.topic.ptwid;
                    $.each(pointer.album.photos, function (i, p) {
                        if (p.topic && p.topic.ptwid && p.topic.ptwid == update_ptwid) {
                            p.topic = $.extend({}, photo.topic);
                        }
                    });
                }
            }
            $.extendNotNull(photo_source, photo);
            if (!photo.topic || photo.topic.ptwid == null) {
                photo_source.topic = photo.topic;
            }
            $('#' + config.selector.photo_id_prefix + photo.photo_id).attr('data-name', photo.name).attr('title', photo.name)
                .attr('data-desc', photo.description).attr('data-origin-path', photo.path);
        },
        "deletePhotoInPage": function (photo_id) {
            $('#' + config.selector.photo_id_prefix + photo_id).remove();
            var album = pointer.album;
            var index = album.photos.indexOf(utils.getPhotoByCache(photo_id));
            album.photos.splice(index, 1);
            utils.updateAlbumSizeInPage();
            jumpPage(config.page_params.pageNum);
            utils.calcNavLocation();
        },
        "getPhotoImageDom": function (photo_id) {
            return $('#' + config.selector.photo_id_prefix + photo_id);
        },
        "createNavLiNode": function (pageNum, isActive) {
            var li = document.createElement('li');
            li.className = isActive ? 'current' : '';
            li.title = '第' + pageNum + '页';
            var a = document.createElement('a');
            a.setAttribute('jumpPage', pageNum);
            a.innerHTML = pageNum;
            li.appendChild(a);
            return li;
        },
        "calcNavLocation": function () {
            var right = $(config.selector.page_nav).parent();
            var left = right.prev();
            if (document.body.clientWidth >= 768) {
                left.css('width', "").css('display', 'inline-block');
                right.css('width', "").css('display', 'inline-block');
                var maxWidth = right.parent().width() - left.width();
                var right_width = right.width();
                right.css('margin-left', (maxWidth - right_width) / 2)
            } else {
                left.css('width', '100%').css('display', 'block');
                right.css('margin-left', "").css('width', '100%').css('display', 'block');
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
                debugger;
                widthKeys.sort(function (left, right) { // 降序
                    left = String(left).indexOf('+') !== -1 ? (parseInt(left) + 1) : left;
                    right = String(right).indexOf('+') !== -1 ? (parseInt(right) + 1) : right;
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
                    if (String(widthKey).indexOf('+') === -1) {
                        if (hitKey == null && w < parseInt(widthKey)) {
                            hitKey = widthKey;
                        }
                    } else {
                        if (w >= parseInt(widthKey)) {
                            hitKey = widthKey;
                        }
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
                        // // options.photos.slice(0)
                        // var photo_arr = [];
                        //  $.each(options.album.photos, function (i, photo_src) {
                        //  var photo = $.extend(true, {}, photo_src);
                        //  photo.url = options.cloudPath + photo.path;
                        //  photo.location = "photos";
                        //  photo_arr.push(photo);
                        //  });
                        var groupWithAlbum = config.zipPhoto_groupWithAlbum;
                        var groupWithMirrorPath = config.zipPhoto_groupWithMirrorPath;
                        var getSavePathRegex = /(user\/[^/]+\/photos\/[^/]+)/;
                        var photo_arr = options.album.photos;
                        $.each(photo_arr, function (i, photo) {
                            photo.url = photo.path;
                            photo.location = 'photos' + (groupWithAlbum ? ('/' + photo.album_id) : '') + (groupWithMirrorPath ? ('/' + photo.path.match(getSavePathRegex)[1]) : '');
                        });
                        return photo_arr;
                    },
                    "makeNames_callback": function (photos, location_info, options) {
                        var names = {};
                        names.zipName = fileName;
                        names.folderName = names.zipName;
                        names.prefix = '';
                        names.suffix = null;
                        return names;
                    },
                    "beforeFilesDownload_callback": function (photos, names, location_info, options, zip, main_folder) {
                        main_folder.file('photos_info.json', JSON.stringify(options.album));
                        main_folder.file('photos_info_format.txt', common_utils.formatJson(options.album));
                        var page_info = 'url: ' + decodeURIComponent(decodeURIComponent(location_info.source)) + '\r\n' + 'title: ' + document.title + '\r\n' + 'search params: ' + options.key;
                        main_folder.file('page_info.txt', page_info);
                        options.failFiles = undefined;
                    },
                    "eachFileOnload_callback": function (blob, photo, location_info, options, zipFileLength, zip, main_folder, folder) {
                        var fileName = photo.path.substring(photo.path.lastIndexOf('/') + 1);
                        photo.fileName = fileName;
                        if (blob == null) {
                            if (!options.failFiles) {
                                options.failFiles = [];
                            }
                            options.failFiles.push(photo);
                        }
                        return true;
                    },
                    "allFilesOnload_callback": function (files, names, location_info, options, zip, main_folder) {
                        if (options.failFiles && options.failFiles.length > 0) {
                            toastr.error('共 ' + options.failFiles.length + ' 张下载失败，已记录在photos_fail_list.txt！', '', {
                                "progressBar": false,
                                timeOut: 0
                            });
                            let failPhotoListStr = '';
                            for (let i in options.failFiles) {
                                let failFile = options.failFiles[i];
                                failPhotoListStr += (failFile.location + '/' + failFile.fileName + '\t' + failFile.url + '\r\n');
                            }
                            main_folder.file('photos_fail_list.txt', failPhotoListStr);
                        }
                    }
                }
            };
            config.callback.beforeZipPhotos.call(context, options);
            common_utils.zipRemoteFilesAndDownload(JSZip, options);
        },
        "openPhotoPopup": function (checkPhotoId) {
            utils.getPhotoImageDom(checkPhotoId).find('img').click();
        },
        "closePhotoPopup": function () {
            $.magnificPopup.close();
        }
    };
    // 瀑布流
    var initWaterfallFlow = function () {
        // // -------------mpmansory----------------
        // $('#masonry').mpmansory({
        //     childrenClass: 'photo', // default is a div
        //     columnClasses: 'padding', //add classes to items
        //     breakpoints: {
        //         lg: 3,
        //         md: 4,
        //         sm: 6,
        //         xs: 6
        //     },
        //     distributeBy: {order: false, height: false, attr: 'data-order', attrOrder: 'asc'},
        //     onload: function (items) {
        //         //make somthing with items
        //     }
        // });
        // // ---------------masonry-----------------
        // var $grid = $('#masonry').masonry({
        //     // set itemSelector so .grid-sizer is not used in layout
        //     itemSelector: '.box',
        //     // use element for option
        //     columnWidth: ".box-size",
        //     //percentPosition: true,
        //     fitWidth: true,
        //     gutter: 10
        // });
        //
        // $grid.imagesLoaded().progress(function () {
        //     $grid.masonry('layout');
        // });
        var real_col = config.page_params.real_col;
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
            columns: real_col["2000+"],
            //定义不同分辨率（1200，940，520，400这些是分辨率）
            breakAt: {
                2000: { // 2000px以下显示
                    columns: real_col["2000"],
                    margin: {
                        x: 7.5,
                        y: 7.5
                    }
                },
                1800: { // 1800px以下显示
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
        pointer.masonryInstance.runOnImageLoad(function (e) {
            var breakCnt = 2; // 跳过第一次运行时默认的complete和load
            if (config.masonry_recalculate_mark !== null) {
                if (!config.hasOwnProperty('masonry_recalculate_mark')) {
                    config.masonry_recalculate_mark = 1;
                }
                if (config.masonry_recalculate_mark <= breakCnt) {
                    config.masonry_recalculate_mark = config.masonry_recalculate_mark + 1;
                    return;
                } else {
                    config.masonry_recalculate_mark = null;
                }
            }
            var nodes = $('#' + config.selector.photosContainer_id).children();
            $.each(nodes, function (i, dom) {
                var img = dom.querySelector('img');
                if (img && img.style.height) {
                    img.style.height = '';
                }
            });
            pointer.masonryInstance.recalculate(true);
            console.log('第 ' + config.page_params.pageNum + ' 页加载完成~');
            // pointer.masonryInstance.recalculate(true, true); 刷新所有（无视完成标记） / 添加完成标记
            globals.removeNotify('notify_pageLoading');
            config.callback.photosOnLoad_callback.call(context, pointer.masonryInstance, nodes);
            context.trigger(config.event.pageLoadCompleted, pointer.masonryInstance, nodes);
        });
    };
    var bindPopstate = function () {
        window.addEventListener('popstate', function (e) {
            var data = e.state;
            //console.log(data);
            if (data == null) {
                return;
            }
            var params = common_utils.parseURL(window.location.href).params, page = params.page || 1;
            if (data.mark == 'page') {
                // 转到列表界面时，当灯箱未关闭时运行（即只有当点击浏览器返回按钮时运行）
                if (config.isMagnificPopupOpen) {
                    $.magnificPopup.close();
                }
                if (page != config.page_params.pageNum) {
                    jumpPage(config.isMagnificPopupOpen ? page : config.page_params.pageNum);
                }
            } else if (data.mark == 'check' && !config.isMagnificPopupOpen) { // 转到详情界面时，当灯箱未开启时运行（即只有当点击浏览器前进按钮时运行）
                var photo_id = params.check, realPage;
                if (photo_id && photo_id != '0') {
                    realPage = utils.getPhotoPageNum(photo_id);
                    if (realPage != config.page_params.pageNum) {
                        jumpPage(realPage);
                    }
                    utils.openPhotoPopup(photo_id);
                }
            }
        });
    };

    var initClickEnlarge = function () {
        // 图片查看modal
        $('#' + config.selector.photosContainer_id).magnificPopup({
            delegate: config.selector.photo_node + ' img', // child items selector, by clicking on it popup will open
            type: 'image',
            //tLoading: null,
            callbacks: {
                elementParse: function (item) {
                    // Function will fire for each target element
                    // "item.el" is a target DOM element (if present)
                    // "item.src" is a source that you may modify
                    var $el = item.$el = $(item.el[0]), $photoNode = $el.closest(config.selector.photo_node);
                    item.photo = $photoNode.data('photo');
                    if (!item.photo) {
                        item.photo_id = $photoNode.attr('data-id');
                        item.photo = utils.getPhotoByCache(item.photo_id);
                        $photoNode.data('photo', item.photo);
                    }
                    item.src = item.photo.path;
                },
                markupParse: function (template, values, item) {
                    // Triggers each time when content of popup changes
                    // console.log('Parsing:', template, values, item);
                    var mfp = this;
                    var photo = item.photo;
                    var isAuthor = login_handle.equalsLoginUser(photo.uid);
                    var photo_id = photo.photo_id;
                    var liked = photo.liked;
                    var photoDetailLink = ('p/detail/' + photo_id).toURL();
                    if (config.photoNodeLinkUsePhotoDetail) {
                        template.find('.photo-detail-link').url('href', photoDetailLink);
                    } else {
                        template.find('.photo-detail-link').url('href', photo.path);
                    }
                    var trigger = '<a style="margin-right: 7px;" class="btn-like-photo' + (liked ? ' photo-has-liked' : '') + '" ' +
                        'data-photo-id=' + photo_id + ' title="添加到喜欢" href="' + ('u/likes/photos').toURL() + '" target="_blank" role="button">' + (liked ? '已赞' : '赞') + '</a>' +
                        '<a class="btn-open-photo-detail" ' +
                        'data-photo-id=' + photo_id + ' title="点击打开图片详情页" href="' + photoDetailLink + '#comments" target="_blank" role="button">评论</a>';
                    if (isAuthor) {
                        trigger += '<a class="btn-open-update-modal" data-photo-id=' + photo_id + ' href="' + photoDetailLink + '?mark=edit" target="_blank" title="点击编辑图片信息" role="button">编辑</a>'
                    } else {
                        trigger += '<a class="btn-open-update-modal" data-photo-id=' + photo_id + ' href="' + photoDetailLink + '?mark=meta" target="_blank" title="点击查看图片信息" role="button">属性</a>'
                    }
                    // 修复只有一张图片时不显示 counter 的BUG
                    var pagePhotoOnlyOne = (config.page_params.pageSize == 1) || ((config.page_params.pageNum == config.page_params.pageCount) && ((pointer.album.photos.length - 1) % config.page_params.pageSize === 0));
                    if (pagePhotoOnlyOne) {
                        values.counter = '{updateModalTrigger}&nbsp; 1 of 1';
                        // .mfp-bottom-bar .mfp-counter
                    }
                    values.counter = values.counter.replace(/\{updateModalTrigger\}/, trigger);
                },
                change: function () {
                    // console.log(this.content); // Direct reference to your popup element
                    // utils.replaceLoadErrorImgToDefault(this.content);
                    var mfp = this;
                    mfp.content.css({   // 切换时去掉旋转样式
                        'width': '',
                        'height': '',
                        'padding-top': '',
                        'padding-bottom': '',
                        'overflow': ''
                    });
                    mfp.content.off('click.once').on('click.once', '.btn-open-update-modal', function (e) {
                        e.preventDefault();
                        var photo = utils.getPhotoByCache(mfp.currItem.photo.photo_id);
                        config.callback.actionForEditPhoto.call(context, photo, 'btn');
                        context.trigger(config.event.actionForEditPhoto, photo, 'btn');
                    }).on('click.once', '.btn-like-photo', function (e) {
                        e.preventDefault();
                        var $likeBtn = $(this);
                        var photo = mfp.currItem.photo;
                        var undo = $likeBtn.hasClass('photo-has-liked');
                        request.likePhoto(photo.photo_id, undo, function (newPhoto, type) {
                            var newValue = newPhoto.like_count, response = this;
                            if (type == 1) {
                                if (undo) {
                                    toastr.success('已移除赞~');
                                } else {
                                    if (login_handle.validateLogin()) {
                                        toastr.success('点击查看赞过的列表', "已添加到赞", {
                                            "timeOut": 12000,
                                            "onclick": function () {
                                                window.open('u/likes/photos'.toURL());
                                            }
                                        });
                                    }
                                }
                            } else {
                                toastr.success(response.message);
                            }
                            $likeBtn.toggleClass('photo-has-liked', !undo).text(!undo ? '已赞' : '赞');
                            photo.like_count = newValue;
                            photo.liked = !undo;
                        });
                    }).on('click.once', '.photo-detail-link', function (e) {
                        e.preventDefault();
                    }).on('click.once', '.photo-detail-link.image-widget.protect', function (e) {
                        e.target === this && $(this).find('img').trigger('click');
                    });
                    // 修改地址栏, 改变check, 在切换图片的时候
                    if (config.isMagnificPopupOpen) { // 灯箱打开的时候不替换，切换的时候替换, 回调markupParse,change在open之前运行
                        var params = common_utils.parseURL(document.location.href).params;
                        var search = '';
                        $.each(params, function (key, value) {
                            if (key != 'method' && key != 'check') {
                                search += '&' + key + '=' + value;
                            }
                        });
                        search += '&check=' + mfp.currItem.photo.photo_id;
                        search = (search ? ('?' + search.substring(1)) : '');
                        if (document.location.hash && document.location.hash != '#') {
                            search += document.location.hash
                        }
                        history.replaceState(
                            {"mark": "check"},
                            document.title,
                            location.pathname + search
                        );
                    }
                    context.trigger(config.event.popupChanged, mfp.currItem.photo.photo_id);
                },
                open: function () {
                    // Will fire when this exact popup is opened
                    // this - is Magnific Popup object
                    // 修改地址栏, 增加check, 在打开图片的时候
                    var mfp = this;
                    config.isMagnificPopupOpen = true;
                    // 图片变形快捷键事件
                    $(document).off('keydown.img.transform').on('keydown.img.transform', function (e) {
                        var theEvent = e || window.event;
                        var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
                        var tagName = e.target.tagName;
                        if (!e.target.isContentEditable && tagName !== 'INPUT' && tagName !== 'TEXTAREA') { // S键或F键
                            if (config.isMagnificPopupOpen) {
                                var $img;
                                switch (code) {
                                    case 81:    // Q键 - 向左旋转90°
                                    case 69:    // E键 - 向右旋转90°
                                        $img = mfp.content.find('img');
                                        var before_angle = parseInt($img.attr('data-rotate') || '0'),
                                            switch_angle = before_angle;
                                        if (code === 81) {
                                            switch_angle = before_angle - 90; // Math.abs(before_angle + 270) % 360;
                                        } else {
                                            switch_angle = before_angle + 90; // Math.abs(before_angle + 90) % 360;
                                        }
                                        mfp.st.callbacks['rotatePhoto'].call(mfp, switch_angle);
                                        break;
                                    case 72:    // H键 - 左右镜像
                                    case 86:    // V键 - 上下镜像
                                        $img = mfp.content.find('img');
                                        var before_horizontal = ($img.attr('data-flip-horizontal') || 'false') === 'true' ? true : false,
                                            before_vertical = ($img.attr('data-flip-vertical') || 'false') === 'true' ? true : false,
                                            switch_horizontal = before_horizontal, switch_vertical = before_vertical;
                                        if (code == 72) {
                                            switch_horizontal = !before_horizontal;
                                        } else {
                                            switch_vertical = !before_vertical;
                                        }
                                        mfp.st.callbacks['flipPhoto'].call(mfp, switch_horizontal, switch_vertical);
                                        break;
                                }
                            }
                        }
                    });
                    var params = common_utils.parseURL(window.location.href).params;
                    var check = params.check;
                    if (!check) { // 当已经到详情页，就不运行
                        var search = '';
                        $.each(params, function (key, value) {
                            if (key != 'method' && key != 'check') {
                                search += '&' + key + '=' + value;
                            }
                        });
                        check = mfp.currItem.photo.photo_id;
                        search += '&check=' + check;
                        search = (search ? ('?' + search.substring(1)) : '');
                        if (document.location.hash && document.location.hash != '#') {
                            search += document.location.hash
                        }
                        history.pushState(
                            {"mark": "check"},
                            document.title,
                            location.pathname + search
                        );
                    }
                    context.trigger(config.event.popupOpened, check);
                },
                resize: function (winHeight) {
                    var mfp = this;
                    if (mfp.isOpen && !winHeight) {
                        var $img = mfp.content.find('img'),
                            before_angle = parseInt($img.attr('data-rotate') || '0');
                        if ((Math.abs(before_angle) % 360) != 0) {
                            mfp.st.callbacks['rotatePhoto'].call(mfp, 0);
                            setTimeout(function () {
                                mfp.st.callbacks['rotatePhoto'].call(mfp, before_angle);
                            }, 300);
                        }
                    }
                },
                rotatePhoto: function (switch_angle) {
                    var balance_angle = Math.abs(switch_angle) % 360,
                        mfp = $.magnificPopup.instance,
                        $img = mfp.content.find('img'),
                        photo = mfp.currItem.photo,
                        computedStyle = getComputedStyle($img[0]),
                        paddingTop = parseFloat(computedStyle.paddingTop),
                        paddingBottom = parseFloat(computedStyle.paddingBottom),
                        boxWidth = mfp.container.width(),
                        boxHeight = document.documentElement.clientHeight - paddingTop - paddingBottom;
                    var css = common_utils.calcElementRotateStyle(switch_angle, photo.width, photo.height, boxWidth, boxHeight, false, $img.prop('style').transform);
                    // delete css['margin-left'];
                    if (balance_angle == 90 || balance_angle == 270) {
                        css['padding'] = '0px 0px';
                        css['max-height'] = '';
                        css['margin-right'] = 'unset';
                        mfp.content.css({
                            'width': css.height,
                            'height': parseFloat(css.width) + (paddingTop + paddingBottom) + 'px',
                            'padding-top': paddingTop + 'px',
                            'padding-bottom': paddingBottom + 'px',
                            'overflow': 'hidden'
                        });
                    } else {
                        css['padding'] = '';
                        css['max-height'] = document.documentElement.clientHeight + 'px';
                        css['margin-right'] = '';
                        mfp.content.css({
                            'width': '',
                            'height': '',
                            'padding-top': '',
                            'padding-bottom': '',
                            'overflow': ''
                        });
                    }
                    $img.css(css);
                    $img.attr('data-rotate', switch_angle);
                },
                flipPhoto: function (switch_horizontal, switch_vertical) {
                    var mfp = $.magnificPopup.instance,
                        $img = mfp.content.find('img'),
                        css_transform_value = $img.prop('style').transform ? $img.prop('style').transform.replace(/\s*rotate[XY]\([^)]*\)\s*/g, "") : '';
                    if (switch_horizontal) {
                        css_transform_value += ' rotateY(180deg)'; // scaleX(-1)
                    }
                    if (switch_vertical) {
                        css_transform_value += ' rotateX(180deg)'; // scaleY(-1)
                    }
                    $img.css('transform', css_transform_value);
                    $img.attr('data-flip-horizontal', switch_horizontal).attr('data-flip-vertical', switch_vertical);
                },
                close: function () {
                    // Will fire when popup is closed
                    // 修改地址栏, 去掉check, 在关闭图片的时候
                    config.isMagnificPopupOpen = false;
                    $(document).off('keydown.img.transform');
                    var params = common_utils.parseURL(document.location.href).params;
                    var check = params.check;
                    if (check) { // 当已经到列表页就不运行
                        history.back();
                    } else {
                        check = this.currItem.photo.photo_id;
                    }
                    context.trigger(config.event.popupClosed, check);
                    var $checkOriginNode = utils.getPhotoImageDom(check);
                    if ($checkOriginNode.length > 0 && !common_utils.isOnScreen($checkOriginNode.get(0), 150, 150)) {
                        $('html, body').animate({
                            scrollTop: $checkOriginNode.offset().top - ($(window).height() / 2 - 300)
                        }, 260);
                    }
                },
                updateStatus: function (data) {
                    // console.log('Status changed', data);
                    // "data" is an object that has two properties:
                    // "data.status" - current status type, can be "loading", "error", "ready"
                    // "data.text" - text that will be displayed (e.g. "Loading...")
                    // you may modify this properties to change current status or its text dynamically
                    if (data.status == 'error') {
                        data.status = "loading";
                        this.contentContainer.find('.mfp-img')
                            .attr('src', config.path_params.cloudPath + config.img_load_error_default)
                            .attr('title', '该图片加载失败~');
                    }
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
            fixedContentPos: true, // true: 弹窗不能滚动，false: 弹窗可滚动，初始位于元素的上方，
            fixedBgPos: true,
            autoFocusLast: true,
            closeBtnInside: true,
            image: {
                markup: '<div class="mfp-figure">' +
                '<div class="mfp-close"></div>' +
                '<a class="photo-detail-link image-widget protect"><div class="mfp-img"></div></a>' +
                '<div class="mfp-bottom-bar">' +
                '<div class="mfp-title"></div>' +
                '<div class="mfp-counter"></div>' +
                '</div>' +
                '</div>', // Popup HTML markup. `.mfp-img` div will be replaced with img tag, `.mfp-close` by close button
                cursor: 'mfp-zoom-out-cur', // Class that adds zoom cursor, will be added to body. Set to null to disable zoom out cursor.
                titleSrc: function (item) {
                    var photo = item.photo;
                    var name = photo.name;
                    var desc = photo.description;
                    var m;
                    if (photo.tags && (m = photo.tags.match(config.protect_attr_regexp)) && !login_handle.equalsLoginUser(photo.uid)) {
                        switch (m[1]) {
                            case 'name':
                                name = '';
                                break;
                            case 'desc':
                            case 'description':
                                desc = '';
                                break;
                            case 'album':
                            case 'topic':
                            case 'tag':
                            case 'tags':
                            case 'refer':
                                break;
                            default:
                                name = desc = ''
                        }
                    }
                    var photoDetailUrl = ('p/detail/' + photo.photo_id).toURL();
                    if ((!name) && desc) {
                        name = desc;
                        desc = '';
                    }
                    return '<a href="' + photoDetailUrl + '" target="_blank" title="点击新标签打开图片">' + common_utils.encodeHTML(name).replace(/&amp;(?=#\d+;)/g, '&') + '</a>' +
                        '<small>' + common_utils.encodeHTML(desc).replace(/&amp;(?=#\d+;)/g, '&') + '</small>';
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
        // $('#enlargephoto-modal .close').click(function () {
        //     $('#enlargephoto-modal').css('display', 'none');
        // });
        //
        // $('#enlargephoto-modal .fog').click(function () {
        //     $('#enlargephoto-modal').css('display', 'none');
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
        "initWaterfallFlow": initWaterfallFlow,
        "on": globals.on,
        "once": globals.once,
        "trigger": globals.trigger,
        "off": globals.off
    };

    return context;
});
