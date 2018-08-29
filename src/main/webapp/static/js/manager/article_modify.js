(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'clipboard', 'niftymodals', 'edit_tool', 'common_utils', 'login_handle', 'toolbar'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, Clipboard, null, null, common_utils, login_handle, toolbar);
    }
})(function ($, bootstrap, domReady, toastr, Clipboard, niftymodals, edit_tool, common_utils, login_handle, toolbar) {

    //是否已经保存
    var isSaveFlag = false;

    function save() {
        if (validate() == true) {
            var labels = $("#tags").find('label');
            var detail = $('#article_edit').summernote('code');
            var summary = $('#article_summary').summernote('code');

            //var data = $('#article_form').serialize();
            // 因为文章中含有& 所有不能用serialize 生成键值对 采用下面方法拼成json格式
            var data = getFormJson($('#article_form'));

            var tags = "";
            $(labels).each(function () {
                tags += $(this).html();
            });

            data.tags = tags;

            //如果没有填写摘要  则取detail前1000(html)字符
            if (summary == "<p><br></p>" || summary == "") {
                if (detail.length >= 1000) {
                    var step1 = detail.substring(0, 1000);
                    var step2 = step1.substring(0, step1.lastIndexOf(">"));
                    //利用浏览器来补全标签
                    var div_temp = document.createElement("div");
                    $(div_temp).html(step2);
                    summary = $(div_temp).html();
                } else {
                    summary = detail;
                }
            }

            //下面方法失效 文章中含有&
            //data += "&tags="+tags+"&detail="+detail+"&summary="+summary;

            data.detail = detail;
            data.summary = summary;

            data.permission = $('#article_form input:radio[name="permission"]:checked').val();

            data.aid = article.aid;

            $.ajax({
                url: "manager.do?method=article_modify_save",
                type: 'post',
                data: data,
                dataType: 'json',
                success: function (data) {
                    if (data.flag == 200) {
                        isSaveFlag = true;
                        toastr.success("保存成功!", "提示");
                        $('#btn_save').attr("disabled", "disabled");
                        $('#btn_cancle').attr("disabled", "disabled");
                        var detail_url = "article.do?method=detail&aid=" + article.aid;
                        $('#a_checkDeatil').attr("href", detail_url);
                        //显示结果框
                        $('#ResultTipsModal').niftyModal();
                        //window.location.href = "article.do?method=detail&aid="+data.aid ;
                    } else if (data.flag == 401) {
                        login_handle.runOnLogin(function (isSuccess) {
                            if (isSuccess) {
                                toastr.clear();
                                toastr.success("登录状态失效，现已重新登录！");
                                save();
                            } else {
                                toastr.error("保存失败！", "提示");
                                toastr.error('由于您编辑时间过长导致Session过期了，您可以点击下面链接进行登录后，再返回此页面进行保存操作！' +
                                    '<br><br>' +
                                    '<a style="color:blue;">点击这里登录.</a>', "提示",
                                    {
                                        "timeOut": 0,
                                        onclick: function () {
                                            window.open("user.do?method=jumpLogin&uid=" + $("body").attr('uid'));
                                        }
                                    });
                            }

                        }, true);
                        console.warn("Error Code: " + data.flag);
                    } else {
                        toastr.error(data.info, "保存失败！");
                        console.warn("Error Code: " + data.flag);
                    }
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    toastr.error("服务器连接异常，保存失败！", "提示");
                },
                complete: function (XMLHttpRequest, textStatus) {
                    /*var reg = /Column 'UID' cannot be null/ig;
                     if (XMLHttpRequest.responseText.search(reg) != -1) {

                     }*/
                }
            });
        }
    }

    //验证
    function validate() {
        var isOK = true;
        if (!login_handle.validateLogin()) {
            isOK = false;
            toastr.error("你未登陆！", "提示");
        }
        if ($('#article_edit').summernote('isEmpty')) {
            isOK = false;
            toastr.error("文章内容不能为空！", "提示");
        }
        if ($('#article_summary').summernote('code').length > 1000) {
            isOK = false;
            toastr.error("文章摘要内容过长！", "提示");
        }
        if ($("#article_form input[name='title']").val() == "") {
            isOK = false;
            toastr.error("文章标题不能为空！", "提示");
        }
        return isOK;
    }

    //添加标签
    function addTag() {
        var tag = $.trim($('#text_addTag').val());
        if (tag == "") {
            toastr.error("没输入点添加干什么  :)");
            $('#text_addTag').focus();
            return;
        }
        if (tag.length > 15) {
            toastr.error("标签太长哦");
            return;
        }
        $("#tags").append("<ui style='float:left;margin-left:-20px;text-align:center;'>" +
            "<ul><label class='tag'>#" + tag + "</label></ul>" +
            "<ul><a class='remove_tag_trigger'>删除</a></ul>" +
            "</ui>"
        );
        $("#tags").find(".remove_tag_trigger").unbind().click(function () {
            remove_tag(this);
        });
        toastr.success("标签添加成功！");
        $('#text_addTag').val("");
    }

    //移除标签
    function remove_tag(tag) {
        $(tag).parent().parent().remove();
        toastr.success("标签移除成功！");
    }

    //将表单中的参数拼装成可用json格式  serialize方式不能应付‘&’字符这种
    function getFormJson(form) {
        var params = {};
        //序列化成[{"name"="a","value"="1"},{"name"="b","value"="2"}]
        var a = $(form).serializeArray();
        $.each(a, function () {
            if (params[this.name] !== undefined) {
                if (!params[this.name].push) {
                    params[this.name] = [params[this.name]];
                }
                params[this.name].push(this.value || '');
            } else {
                params[this.name] = this.value || '';
            }
        });
        //转化为 {"a"="1","b"="2"}
        return params;
    }

    // 更新

    var article = null;

    /**
     * 初始化更新页面
     * @param aid
     */
    function updateInit(aid) {
        $.post("article.do?method=getArticle&aid=" + aid, function (data) {
            if (data.flag == 200 && data.article) {
                article = data.article;
                //editor.insertText
                $('#article_edit').summernote('code', article.detail);
                $("#article_summary").summernote('code', article.summary);
                $("#article_form input[name='title']").val(article.title);
                $("#article_form select[name='atid']").val(article.category.atid);
                $("#article_form input:radio[name='permission']").each(function () {
                    if ($(this).val() == article.permission) {
                        $(this).prop("checked", true);
                    }
                });
                var tags = article.tags.split("#");
                $(tags).each(function (i, tag) {
                    if (i == 0) {
                        return;
                    }
                    $("#tags").append("<ui style='float:left;margin-left:-20px;text-align:center;'>" +
                        "<ul><label class='tag'>#" + tag + "</label></ul>" +
                        "<ul><a class='remove_tag_trigger'>删除</a></ul>" +
                        "</ui>"
                    );
                    $("#tags").find(".remove_tag_trigger").unbind().click(function () {
                        remove_tag(this);
                    });
                });
                toastr.success("已加载！");
            } else {
                toastr.error(data.info, "错误");
                console.warn("Error Code: " + data.flag);
            }
        }, "json")
    }

    // 管理 manager

    function changeImgCdnPath() {
        var cdnHost = $("#input_article_img_cdnHost").val();
        if (cdnHost != null && article != null && article != undefined) {
            var div_temp_edit = document.createElement("div");
            $(div_temp_edit).html($('#article_edit').summernote('code'));
            $(div_temp_edit).find('img').each(function (i, image) {
                if ($(image).attr("internetImage") == "false") {
                    var relativepath = $(image).attr("data-relativepath");
                    if (relativepath == undefined || relativepath == "") {
                        $(image).attr("data-relativepath", $(image).attr("src"));
                        $(image).attr("src", cdnHost + $(image).attr("src"));
                    } else {
                        $(image).attr("src", cdnHost + relativepath);
                    }
                }
            });
            $('#article_edit').summernote('code', $(div_temp_edit).html());

            var div_temp_summary = document.createElement("div");
            $(div_temp_summary).html($('#article_summary').summernote('code'));
            $(div_temp_summary).find('img').each(function (i, image) {
                if ($(image).attr("internetImage") == "false") {
                    var relativepath = $(image).attr("data-relativepath");
                    if (relativepath == undefined || relativepath == "") {
                        $(image).attr("data-relativepath", $(image).attr("src"));
                        $(image).attr("src", cdnHost + $(image).attr("src"));
                    } else {
                        $(image).attr("src", cdnHost + relativepath);
                    }
                }
            });
            $('#article_summary').summernote('code', $(div_temp_summary).html());

            $('#inputCdnHostModal').modal('hide');
            toastr.success("修改完成，请查看！");
        }
    }

    function restoreImgRelativePath() {
        if (article != null && article != undefined) {
            var div_temp_edit = document.createElement("div");
            $(div_temp_edit).html($('#article_edit').summernote('code'));
            $(div_temp_edit).find('img').each(function (i, image) {
                if ($(image).attr("internetImage") == "false") {
                    var relativepath = $(image).attr("data-relativepath");
                    if (relativepath == undefined || relativepath == "") {
                        $(image).attr("data-relativepath", $(image).attr("src"));
                    } else {
                        $(image).attr("src", relativepath);
                    }
                }
            });
            $('#article_edit').summernote('code', $(div_temp_edit).html());

            var article_summary = document.createElement("div");
            $(article_summary).html($('#article_summary').summernote('code'));
            $(article_summary).find('img').each(function (i, image) {
                if ($(image).attr("internetImage") == "false") {
                    var relativepath = $(image).attr("data-relativepath");
                    if (relativepath == undefined || relativepath == "") {
                        $(image).attr("data-relativepath", $(image).attr("src"));
                    } else {
                        $(image).attr("src", relativepath);
                    }
                }
            });
            $('#article_summary').summernote('code', $(article_summary).html());

            toastr.success("修改完成，请查看！");
        }
    }

    function formatImgShow() {
        var div_temp_edit = document.createElement("div");
        $(div_temp_edit).html($('#article_edit').summernote('code'));

        $(div_temp_edit).find('img').each(function (i, image) {
            image.className = "img-thumbnail";
            image.outerHTML = "<p>" + image.outerHTML + "</p>";
        });

        $('#article_edit').summernote('code', div_temp_edit.innerHTML);

        toastr.success("修改完成，请查看！");
    }

    function restoreFormatImgShow() {
        var div_temp_edit = document.createElement("div");
        $(div_temp_edit).html($('#article_edit').summernote('code'));

        $(div_temp_edit).find('img').each(function (i, image) {
            image.removeAttribute("class");
            $(image).parent()[0].outerHTML = image.outerHTML;
        });

        $('#article_edit').summernote('code', div_temp_edit.innerHTML);

        toastr.success("还原完成，请查看！");
    }

    domReady(function () {
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "progressBar": false,
            "positionClass": "toast-bottom-left",
            "showDuration": "400",
            "hideDuration": "1000",
            "timeOut": 4500,
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };

        //添加标签事件
        $('#btn_addTag').click(function () {
            addTag();
        });
        //保存事件
        $('#btn_save').click(function () {
            save();
        });

        //如果有文章id，则请求该文章JOSN
        var params = common_utils.parseURL(window.location.href).params;
        if (params['aid'] != undefined) {
            updateInit(params['aid']);
            $('#input_article_id').val(params['aid']);
        }

        /**
         * 监听页面刷新或关闭事件
         */
        //body onbeforeunload="return checkUnsave();"
        $(window).bind('beforeunload', function () {
            if (!isSaveFlag) {
                return "文章未保存，若关闭或刷新，则该数据将丢失！";
            }
        });

        $("#btn_article_img_cdnTrigger").click(function () {
            $('#inputCdnHostModal').modal({backdrop: 'static', keyboard: false});
        });

        $("#input_article_img_submit").click(function () {
            changeImgCdnPath();
        });

        $("#btn_article_img_relative").click(function () {
            restoreImgRelativePath();
        });

        $("#btn_article_query").click(function () {
            if (!isNaN($("#input_article_id").val())) {
                updateInit($("#input_article_id").val());
            } else {
                toastr.error("请输入数字！");
            }
        });

        $('#btn_article_img_format').click(function () {
            if ($(this).attr('hasFormat') != "true") {
                formatImgShow();
                $(this).attr("hasFormat", "true");
                $(this).val("还原修改");
            } else {
                restoreFormatImgShow();
                $(this).attr("hasFormat", "false");
                $(this).val("格式化图片展示");
            }
        });

        // 关闭搜索快捷键
        toolbar.rewriteSearch({"searchHotKey": false});

    });

});