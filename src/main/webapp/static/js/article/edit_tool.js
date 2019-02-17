(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'summernote', 'store2', 'common_utils', 'login_handle', 'edit_tool_plugin'], factory);
    } else {
        // Browser globals
        window.edit_tool = factory(window.jQuery, null, $(document).ready, toastr, null, store, common_utils, login_handle, null);
    }
})(function ($, bootstrap, domReady, toastr, summernote, store, common_utils, login_handle, edit_tool_plugin) {

    var config = {
        maxUploadSize: 5 * 1024 * 1024
    };

    $(document).ajaxError(function () {
        toastr.error("An error occurred!", "执行Ajax请求时发生错误");
    });

    $.extend(true, $.summernote.lang, {
        'zh-CN': {
            font: {
                bold: '粗体',
                italic: '斜体',
                underline: '下划线',
                strikethrough: '删除线',
                clear: '清除格式',
                height: '行高',
                name: '字体',
                size: '字号'
            },
            image: {
                image: '图片',
                insert: '插入图片',
                resizeFull: '调整至 100%',
                resizeHalf: '调整至 50%',
                resizeQuarter: '调整至 25%',
                floatLeft: '左浮动',
                floatRight: '右浮动',
                floatNone: '不浮动',
                remove: '移除图片',
                dragImageHere: '将图片拖至此处',
                selectFromFiles: '从本地上传',
                url: '图片地址'
            },
            link: {
                link: '链接',
                insert: '插入链接',
                unlink: '去除链接',
                edit: '编辑链接',
                textToDisplay: '显示文本',
                url: '链接地址',
                openInNewWindow: '在新窗口打开'
            },
            video: {
                video: '视频',
                videoLink: '视频链接',
                insert: '插入视频',
                url: '视频地址',
                providers: '(优酷, Instagram, DailyMotion, Youtube等)'
            },
            table: {
                table: '表格'
            },
            hr: {
                insert: '水平线'
            },
            style: {
                style: '样式',
                normal: '普通',
                blockquote: '引用',
                pre: '代码',
                h1: '标题 1',
                h2: '标题 2',
                h3: '标题 3',
                h4: '标题 4',
                h5: '标题 5',
                h6: '标题 6'
            },
            lists: {
                unordered: '无序列表',
                ordered: '有序列表'
            },
            options: {
                help: '帮助',
                fullscreen: '全屏',
                codeview: '源代码'
            },
            paragraph: {
                paragraph: '段落',
                outdent: '减少缩进',
                indent: '增加缩进',
                left: '左对齐',
                center: '居中对齐',
                right: '右对齐',
                justify: '两端对齐'
            },
            color: {
                recent: '最近使用',
                more: '更多',
                background: '背景',
                foreground: '前景',
                transparent: '透明',
                setTransparent: '透明',
                reset: '重置',
                resetToDefault: '默认'
            },
            shortcut: {
                shortcuts: '快捷键',
                close: '关闭',
                textFormatting: '文本格式',
                action: '动作',
                paragraphFormatting: '段落格式',
                documentStyle: '文档样式'
            },
            history: {
                undo: '撤销',
                redo: '重做'
            }
        }
    });

    /**
     * my code
     */
    domReady(function () {

        /**  定义的插入代码按钮 start   */
        var insertcode = function (context) {
            var ui = $.summernote.ui;
            // create button
            var button = ui.button({
                contents: '<i class="glyphicon glyphicon-list-alt"/> 插入代码',
                tooltip: '插入代码',
                click: function () {
                    context.invoke('saveRange');
                    $('#code_editModal').modal();
                    //context.invoke('editor.insertText', );
                }
            });
            return button.render();   // return button as jquery object
        };

        //完成code插入点击事件
        $("#btn_insertcode").click(function () {
            var code_edit_area = $("#code_edit_area");
            //创建节点
            var pre = document.createElement('pre');
            pre.className = "user-defined-code";
            pre.setAttribute("style", "word-wrap:normal");
            var code = document.createElement('code');
            code.setAttribute("style", "white-space:pre;overflow-x:auto;word-wrap:normal");
            //得到编辑区的值 并转义
            code.innerHTML = common_utils.encodeHTML(code_edit_area.val());
            pre.appendChild(code);

            //
            var fragment = document.createDocumentFragment();
            fragment.appendChild(document.createElement("br"));
            fragment.appendChild(pre);
            fragment.appendChild(document.createElement("br"));

            //插入节点
            $('#article_edit').summernote('restoreRange');
            $('#article_edit').summernote('insertNode', fragment);

            //关闭
            $('#code_editModal').modal('hide');
            //toastr.info("代码在编辑区可能会变形，这不是最终的显示效果", "提示");
            code_edit_area.val('');
        });
        /**  定义的插入代码按钮 stop   */


            //定义的重置图片大小按钮
        var resetImgSize = function (context) {
                var ui = $.summernote.ui;
                var layoutInfo = context.layoutInfo;
                var $editable = layoutInfo.editable;
                return ui.button({
                    contents: '<span class="note-fontsize-10">重置</span>',
                    tooltip: "重置图片原始大小",
                    click: function () {
                        var $image = $($editable.data('target'));
                        if ($image.attr('internetImage') == "false") {
                            $image.attr("width", "");
                            $image.attr("height", "");
                            if ($image.width() < 1800) {
                                $image.css({
                                    width: $image.attr('data-rawwidth'),
                                    height: ''
                                });
                            } else {
                                $image.css({
                                    width: 1800,
                                    height: ''
                                });
                                toastr.info("图片过大，所以宽度调整为1800px");
                            }
                        }
                    }
                }).render();
            };

        //互联网图片本地化
        var localimage = function (context) {
            var layoutInfo = context.layoutInfo;
            var $editor = layoutInfo.editor;
            var $editable = layoutInfo.editable;
            var ui = $.summernote.ui;
            var button = ui.button({
                contents: '<span class="note-fontsize-10">升级</span>',
                tooltip: '将互联网图片上传到本站服务器',
                click: function () {
                    var $image = $($editable.data('target'));
                    if ($image.attr('internetImage') != 'false') {
                        localImage($image);
                    } else {
                        toastr.info("已经是本站服务器图片了，无须本地化！");
                        /*
                         var index = $image.attr('src').indexOf('upload');
                         $image.attr('src', $image.attr('src').substring(index) );
                         */
                    }

                }
            });
            this.$button = button.render();
            return this.$button;
        };

        //设置图片为封面
        var coverimage = function (context) {
            var layoutInfo = context.layoutInfo;
            var $editable = layoutInfo.editable;
            var ui = $.summernote.ui;
            var button = ui.button({
                contents: '<span class="note-fontsize-10">封面</span>',
                tooltip: '设为文章封面',
                click: function () {
                    var image = $editable.data('target');
                    image.setAttribute('cover', 'true');
                    //cover = image;
                    $('#article_summary').summernote('code', image.outerHTML);
                }
            });
            this.$button = button.render();
            return this.$button;
        };

        // 从Cloud相册中插入图片
        var insertAlbumPhotos = function (context) {
            var layoutInfo = context.layoutInfo;
            var $editable = layoutInfo.editable;
            var ui = $.summernote.ui;
            var button = ui.button({
                contents: '<i class="fa fa-cloud" />插入相册',
                tooltip: '从您的Cloud相册中插入图片',
                click: function () {
                    context.invoke('saveRange');
                    var uid = $('body').attr('uid');
                    if (uid == undefined || uid == "") {
                        uid = 0;
                    }
                    $.get("photo.do?method=albumListByAjax", {"user.uid": uid}, function (data) {
                        if (data.flag == 200) {
                            var options_str = '';
                            if (data.albums == null || data.albums.length == 0) {
                                options_str = '<option value="0">无相册</option>';
                            } else {
                                $.each(data.albums, function (index, album) {
                                    options_str += '<option value="' + album.album_id + '">' + album.name + '</option>';
                                });
                            }
                            $('#insertAlbumPhotos_albumSelect').html(options_str);
                            $('#insertAlbumPhotos_modal').modal();
                        } else {
                            toastr.error("读取相册列表失败");
                            toastr.error(data.info);
                        }
                    });
                }
            });
            this.$button = button.render();
            return this.$button;
        };

        $('#insertAlbumPhotos_confirmBtn').click(function () {
            var album_id = $('#insertAlbumPhotos_albumSelect').val();
            if (album_id == 0) {
                toastr.info("无相册，无法插入");
            } else {
                insertPhotosFromCloud(album_id);
            }
        });

        // 新建一行
        var nextLine = function (context) {
            var layoutInfo = context.layoutInfo;
            var $editable = layoutInfo.editable;
            var ui = $.summernote.ui;
            var button = ui.button({
                contents: '新建一行',
                tooltip: '从底部插入一行',
                click: function () {
                    var detail = $("#article_edit").summernote('code');
                    $("#article_edit").summernote('code', detail + "<br>Next Line");
                    //$('#article_edit').summernote('insertText', 'hello world');
                    toastr.success("Next Line Ready");
                }
            });
            this.$button = button.render();
            return this.$button;
        };

        //自定义的编辑器
        $("#article_edit").summernote({
            lang: "zh-CN",
            height: 450,
            nugget: {
                list: [ // list of your nuggets
                    '[[code nugget 1]]',
                    '[[code nugget 2]]',
                    '[[code nugget 2]]'
                ]
            },
            imageTitle: {
                icon: '<span class="note-fontsize-10">标题</span>',
                specificAltField: true,
            },
            imageAttributes: {
                icon: '<i class="note-icon-pencil"/>',
                removeEmpty: true, // true = remove attributes | false = leave empty if present
                disableUpload: true // true = don't display Upload Options | Display Upload Options
            },
            cleaner: {
                action: 'button', // both|button|paste 'button' only cleans via toolbar button, 'paste' only clean when pasting content, both does both options.
                newline: '<br>', // Summernote's default is to use '<p><br></p>'
                notStyle: 'position:absolute;top:0;left:0;right:0', // Position of Notification
                icon: '<i class="note-icon"></i>清除标签',
                keepHtml: false, // Remove all Html formats
                keepOnlyTags: ['<p>', '<br>', '<ul>', '<li>', '<b>', '<strong>', '<i>', '<a>'], // If keepHtml is true, remove all tags except these
                keepClasses: false, // Remove Classes
                badTags: ['style', 'script', 'applet', 'embed', 'noframes', 'noscript', 'html'], // Remove full tags with contents
                badAttributes: ['style', 'start'], // Remove attributes from remaining tags
                limitChars: false, // 0/false | # (0/false disables option)
                limitDisplay: 'both', // text|html|both
                limitStop: false // true/false
            },
            /*uploadcare: {
             // button name (default is Uploadcare)
             buttonLabel: '',//'Image / file',
             // font-awesome icon name (you need to include font awesome on the page)
             buttonIcon: 'cloud',//'picture-o',
             // text which will be shown in button tooltip
             tooltipText: 'Upload files or video or something',

             // uploadcare widget options, see https://uploadcare.com/documentation/widget/#configuration
             publicKey: '2b1b893903c8005f279e', // set your API key
             crop: 'free',
             tabs: 'all',
             multiple: true
             },*/
            toolbar: [
                //[groupname, [button list]]
                ['style', ['style', 'paperSize']],
                ['fontstyle', ['bold', 'italic', 'clear',]],
                ['sp', ['underline', 'strikethrough', 'superscript', 'subscript']],
                ['font', ['fontname']],
                ['fontsize', ['fontsize']],
                ['height', ['height']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['insert', ['hr', 'link', 'picture', 'video']],
                ['table', ['table']],
                ['Misc', ['fullscreen', 'codeview', 'undo', 'redo', 'help']],
                ['ud_group_1', ['insertcode', 'insertAlbumPhotos']],
                ['ud_group_2', ['nextLine', 'cleaner']],
                ['ud_group_3', ['sDraftsLoad', 'sDraftsSave']],
            ],
            buttons: {
                'insertcode': insertcode,
                'resetImgSize': resetImgSize,
                'localimage': localimage,
                'coverimage': coverimage,
                'insertAlbumPhotos': insertAlbumPhotos,
                'nextLine': nextLine
            },
            popover: {
                image: [
                    ['custom', ['imageTitle', 'imageAttributes', 'imageShapes']],
                    ['imagesize', ['resetImgSize', 'imageSize100', 'imageSize50', 'imageSize25']],
                    ['float', ['floatLeft', 'floatRight', 'floatNone']],
                    ['remove', ['localimage', 'coverimage', 'removeMedia']]
                ],
                link: [
                    ['link', ['linkDialogShow', 'unlink']]
                ],
                air: [
                    ['color', ['color']],
                    ['font', ['bold', 'underline', 'clear']],
                    ['para', ['ul', 'paragraph']],
                    ['table', ['table']],
                    ['insert', ['link', 'picture']]
                ]
            },
            placeholder: 'write here...',
            fontNames: ['Open Sans', 'Microsoft YaHei', 'Helvetica', 'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Merriweather'],
            fontNamesIgnoreCheck: ['Open Sans', 'Microsoft YaHei', 'Arial'],
            fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36'],
            dialogsInBody: false,
            dialogsFade: true,
            callbacks: {
                onImageUpload: function (filesJson) {
                    var files = [];
                    $.each(filesJson, function (index, file) {
                        files.push(file);
                    });
                    // 可以同时上传多个图片
                    files.sort(SortLikeWin);
                    sendFile(files);
                },
                onMediaDelete: function ($target, $editable) {
                    // 删除图片
                    var image = $editable.data('target');
                    deleteFile(image);
                },
                onDialogShown: function () {
                    /*
                     toastr.info("点击选择图片时可能会卡住，要等一下，不要重复点！" +
                     "当连续弹出来或其他bug刷新一下页面.","提示",{"timeOut" : 10000});
                     */
                }
            }
        });

        $('#article_edit').on('summernote.change', function (we, contents, $editable) {
            //console.log('summernote\'s content is changed.');
        });

        $("#article_summary").summernote({
            lang: "zh-CN",
            cleaner: {
                action: 'button', // both|button|paste 'button' only cleans via toolbar button, 'paste' only clean when pasting content, both does both options.
                newline: '<br>', // Summernote's default is to use '<p><br></p>'
                notStyle: 'position:absolute;top:0;left:0;right:0', // Position of Notification
                icon: '<i class="note-icon"></i>清除标签',
                keepHtml: false, // Remove all Html formats
                keepOnlyTags: ['<p>', '<br>', '<ul>', '<li>', '<b>', '<strong>', '<i>', '<a>'], // If keepHtml is true, remove all tags except these
                keepClasses: false, // Remove Classes
                badTags: ['style', 'script', 'applet', 'embed', 'noframes', 'noscript', 'html'], // Remove full tags with contents
                badAttributes: ['style', 'start'], // Remove attributes from remaining tags
                limitChars: false, // 0/false | # (0/false disables option)
                limitDisplay: 'both', // text|html|both
                limitStop: false // true/false
            }
        });

    });


    //上传图片
    function sendFile(files, index) {
        index = index || 0;

        if (files.length === 0) {
            toastr.error("图片数量为0！", "", {progressBar: false});
            return;
        }
        var file = files[index];
        //检查大小
        if (config.maxUploadSize != -1 && file.size > config.maxUploadSize) {
            toastr.error(file['name'] + " 换个小的，最大" + (config.maxUploadSize / (1024 * 1024)) + "M", "别丢个这么大的图片给我a", {
                timeOut: 0,
                progressBar: false
            });
            return;
        }

        var filename = false;
        try {
            filename = file['name'];
        } catch (e) {
            filename = false;
        }
        //以上防止在图片在编辑器内拖拽引发第二次上传导致的提示错误
        var ext = filename.substr(filename.lastIndexOf("."));
        //ext = ext.toUpperCase();
        var timestamp = new Date().getTime();
        var name = timestamp + "_" + $('body').attr('uid') + "_" + "article" + ext;

        var data = new FormData();
        data.append("file", file);
        data.append("fileName", name);
        data.append("isImage", "true");
        //name是文件名，自己随意定义
        file['name'] = name;

        var notify_uploading = toastr.info("正在上传图片" + ( (index === 0 && files.length === 1) ? "" : "第" + (index + 1) + "张" ), "提示", {
            "progressBar": false,
            "hideDuration": 0,
            "timeOut": 0,
            "closeButton": false
        });
        $.ajax({
            data: data,
            type: "POST",
            url: "article.do?method=uploadAttachment", //图片上传出来的url，返回的是图片上传后的路径，http格式
            contentType: false,
            dataType: "json",
            cache: false,
            processData: false,
            success: function (data) {
                //data是返回的hash,key之类的值，key是定义的文件名
                //把图片放到编辑框中。editor.insertImage 是参数
                toastr.remove(notify_uploading, true);
                if (data.flag == 200) {
                    index++;
                    if (index > files.length - 1) {
                        toastr.success("上传服务器成功,正在加载", "提示", {"progressBar": true});
                    }
                    var imgLoadUrl = $("#staticPath").attr("href") + (data.image_url).toString();

                    //插入节点
                    $('#article_edit').summernote('editor.insertImage', imgLoadUrl, function ($image) {
                        $image.css('width', "100%");
                        $image.attr('data-filename', name);
                        $image.attr('data-relativepath', (data.image_url).toString());
                        //设置后台计算的图片实际尺寸
                        //用于用户可能还原要图片上传前的尺寸
                        $image.attr('data-rawwidth', "" + data.width);
                        $image.attr('data-rawheight', "" + data.height);
                        //添加不是网络引用图片标记
                        $image.attr('internetImage', "false");

                        //继续上传下一张
                        //写这个回调方法里面会在图片加载完再执行
                        //当然也可以 判断 img.complete 或 img.onload = function(){};
                        //删除第0个元素 files.shift();
                        if (index < files.length) {
                            sendFile(files, index);
                        }
                    });
                } else {
                    toastr.error(data.info, "上传失败", {timeOut: 0});
                    console.warn("Error Code: " + data.flag);
                }
            },
            error: function () {
                toastr.remove(notify_uploading, true);
                toastr.error("上传失败,我不背锅", "未知错误", {timeOut: 0});
            }
        });
    }

    //互联网图片本地化
    function localImage($image) {
        var originalImageUrl = $image.attr('src');

        var internet_url = $image.attr('src');
        if (internet_url.substr(0, 1) == "/") {
            internet_url = window.location.protocol + "//" + window.location.host + internet_url;
        }
        //internet_url = encodeURIComponent(internet_url);

        var ext = internet_url.substr(internet_url.lastIndexOf("."));
        //ext = ext.toUpperCase();
        var timestamp = new Date().getTime();
        var name = timestamp + "_" + $('body').attr('uid') + "_" + "article" + ext;

        var notify_downloading = toastr.info("服务器正在下载图片", "提示", {
            "progressBar": false,
            "hideDuration": 0,
            "timeOut": 0,
            "closeButton": false
        });
        $.ajax({
            data: {"fileName": name, "url": internet_url},
            type: "POST",
            url: "article.do?method=localImage",
            dataType: "json",
            success: function (data) {
                toastr.remove(notify_downloading, true);
                if (data.flag == 200) {
                    toastr.success("服务器下载成功,正在加载", "提示", {"progressBar": true});
                    //修改节点
                    var imgLoadUrl = $("#staticPath").attr("href") + (data.image_url).toString();
                    $image.attr('src', imgLoadUrl);
                    $image.attr('data-relativepath', (data.image_url).toString());
                    $image.attr('data-filename', name);
                    $image.attr('data-rawwidth', "" + data.width);
                    $image.attr('data-rawheight', "" + data.height);
                    //添加不是网络引用图片标记
                    $image.attr('internetImage', "false");

                    restoreImage($image, originalImageUrl);
                } else {
                    toastr.error(data.info, "下载失败");
                    console.warn("Error Code: " + data.flag);
                }
            },
            error: function () {
                toastr.remove(notify_downloading, true);
                toastr.error("服务器错误");
            }
        });
    }

    function restoreImage($image, originalImageUrl) {
        setTimeout(function () {
            if (!window.confirm("点确认完成修改，点取消还原为网络图片")) {
                deleteFile($image);
                $image.attr('internetImage', "true");
                $image.attr('src', originalImageUrl);
            }
        }, 2000);
    }

    //删除文件
    function deleteFile(image) {
        var coverSrc = $($('#article_summary').summernote('code')).find('img').attr('src');
        //此图片为封面图片则一起把摘要清空
        //$image.getAttribute('cover') === "true"
        if (coverSrc == $(image).attr("src")) {
            $('#article_summary').summernote('code', "");
        }

        //网络引用图片则不提交
        if ($(image).attr('internetImage') == 'false') {

            //如果是引用的相册图片 直接返回
            if ($(image).attr("cloudImage") == "true") {
                toastr.success("相册引用图片删除成功！");
                toastr.success("如需完全删除，请至相册！");
                return;
            }

            //得到图片url
            var image_url = $(image).attr('src');
            //image_url = encodeURIComponent(image_url);
            $.ajax({
                url: "article.do?method=deleteAttachment",
                data: {"file_url": image_url, "isImage": true},
                type: "POST",
                dataType: 'json',
                success: function (data) {
                    if (data.flag == 200) {
                        toastr.success("图片服务器删除成功！");
                    } else if (data.flag == 404) {
                        toastr.success("网络引用图片删除成功！");
                    } else {
                        toastr.error(data.info, "删除失败！");
                        console.warn("Error Code: " + data.flag);
                    }
                },
                error: function () {
                    toastr.error("图片服务器删除失败！ :)");
                }
            });
        } else {
            toastr.success("网络引用图片删除成功！");
        }
    }

    /**
     * 从用户Cloud相册中插入图片
     * @param album_id
     */
    function insertPhotosFromCloud(album_id) {
        $.get("photo.do?method=albumByAjax", {"id": album_id, "mount": true}, function (data) {
            if (data.flag == 200) {
                var editor = $('#article_edit');
                var photos = data.album.photos;
                var cloudHost = $('#cloudPath').attr('href');
                var imgs_str = '';
                $(photos).each(function (index, photo) {
                    imgs_str += '<img src="' + cloudHost + photo.path + '" ';
                    imgs_str += 'data-filename="' + photo.path.substring(photo.path.lastIndexOf('/') + 1) + '" ';
                    imgs_str += 'data-relativepath="' + photo.path + '" ';
                    imgs_str += 'data-rawwidth="' + photo.width + '" ';
                    imgs_str += 'data-rawheight="' + photo.height + '" ';
                    imgs_str += 'photo-id="' + photo.photo_id + '" ';
                    imgs_str += 'album-id="' + photo.album_id + '" ';
                    imgs_str += 'title="' + photo.name + '/' + photo.description + '" ';
                    imgs_str += 'internetImage="false" ';
                    imgs_str += 'cloudImage="true" ';
                    imgs_str += 'style="width: 100%" />';
                });
                var div = document.createElement("div");
                div.className = "album_photos";
                div.innerHTML = imgs_str;
                editor.summernote('restoreRange');
                editor.summernote('insertNode', div);
                $('#insertAlbumPhotos_modal').modal("hide");
                toastr.success("共插入" + photos.length + "张图片", "插入成功")
            } else {
                toastr.error(data.info, "加载错误");
                console.warn("Error Code: " + data.flag);
            }
        });
    }

    /**
     * 模仿windows文件按名称排序效果
     * @param v1
     * @param v2
     * @returns {number}
     * @constructor
     */
    function SortLikeWin(v1, v2) {
        var a = v1.name;
        var b = v2.name;
        var reg = /[0-9]+/g;
        var lista = a.match(reg);
        var listb = b.match(reg);
        if (!lista || !listb) {
            return a.localeCompare(b);
        }
        for (var i = 0, minLen = Math.min(lista.length, listb.length); i < minLen; i++) {
            //数字所在位置序号
            var indexa = a.indexOf(lista[i]);
            var indexb = b.indexOf(listb[i]);
            //数字前面的前缀
            var prefixa = a.substring(0, indexa);
            var prefixb = a.substring(0, indexb);
            //数字的string
            var stra = lista[i];
            var strb = listb[i];
            //数字的值
            var numa = parseInt(stra);
            var numb = parseInt(strb);
            //如果数字的序号不等或前缀不等，属于前缀不同的情况，直接比较
            if (indexa != indexb || prefixa != prefixb) {
                return a.localeCompare(b);
            }
            else {
                //数字的string全等
                if (stra === strb) {
                    //如果是最后一个数字，比较数字的后缀
                    if (i == minLen - 1) {
                        return a.substring(indexa).localeCompare(b.substring(indexb));
                    }
                    //如果不是最后一个数字，则循环跳转到下一个数字，并去掉前面相同的部分
                    else {
                        a = a.substring(indexa + stra.length);
                        b = b.substring(indexa + stra.length);
                    }
                }
                //如果数字的string不全等，但值相等
                else if (numa == numb) {
                    //直接比较数字前缀0的个数，多的更小
                    return strb.lastIndexOf(numb + '') - stra.lastIndexOf(numa + '');
                }
                else {
                    //如果数字不等，直接比较数字大小
                    return numa - numb;
                }
            }
        }
    }

    var context = {
        "config": config
    }

    return context;
});

