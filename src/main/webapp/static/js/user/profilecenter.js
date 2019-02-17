(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'cityselect', 'birthday', 'common_utils', 'login_handle', 'cropper', 'websocket_util'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, null, null, common_utils, login_handle, null, websocket_util);
    }
})(function ($, bootstrap, domReady, toastr, cityselect, birthday, common_utils, login_handle, cropper, websocket_util) {

    //将表单中的参数拼装成可用json格式  serialize方式不能应付‘&’字符这种
    window.getFormJson = function (form) {
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
    };

    /**************** profile start ******************/

    var $uid = $('body').attr('uid');
    var basePath = $('#basePath').attr('href');
    var staticPath = $('#staticPath').attr('href') || basePath;
    var profile = null;

    function initProfileForm() {
        $.ms_DatePicker({
            YearSelector: ".sel_year",
            MonthSelector: ".sel_month",
            DaySelector: ".sel_day"
        });
        $('#submit_profile').click(function () {
            update_profile();
        });
        $('#reset_profile').click(function () {
            load_profile();
        });
        initCropHeadPhoto();
    }

    function load_profile() {
        $.ajax({
            url: 'user.do?method=profile',
            data: {
                'uid': $uid
            },
            success: function (user) {
                if (user != null) {
                    profile = user;
                    $('input[name="nickname"]').val(user.nickname);
                    $('input[name="description"]').val(user.description);
                    $('input[name="qq"]').val(user.qq);
                    $('input[name="weibo"]').val(user.weibo);
                    $('input[name="site"]').val(user.site);
                    $('input[name="phone"]').val(user.phone);
                    $('#register_time').html(user.register_time);
                    $('textarea[name="description"]').html(user.description);
                    $('textarea[name="says"]').html(user.says);
                    $("input:radio[name='sex']").each(function () {
                        if ($(this).val() == user.sex) {
                            $(this).prop("checked", true);
                        }
                    });
                    if (user.birthday) {
                        var arr_brith = ( user.birthday ).split("/");
                        $('.sel_year').val(arr_brith[0]);
                        $('.sel_month').val(arr_brith[1]);
                        $('.sel_day').val(arr_brith[2]);
                    }
                    if (user.address) {
                        var arr_addr = ( user.address ).split('/');
                        $("#addresssel").citySelect({
                            prov: arr_addr[0],
                            city: arr_addr[1],
                            dist: arr_addr[2],
                            nodata: "none"
                        });
                    } else {
                        $("#addresssel").citySelect({prov: "湖南", city: "长沙", dist: "岳麓区", nodata: "none"});
                    }
                    $('#login_ip').html(user.userStatus.last_login_ip);
                    getIpLocation(user.userStatus.last_login_ip);
                    $("#register_time").text(user.userStatus.register_time);
                }
            },
            error: function () {
                console.log("拉取个人资料失败");
            }
        });
    }

    function getIpLocation(ip) {
        // getIpLocationByTaoBao(ip); https页面不能使用淘宝接口，换成后台Java获取
        $.get("site.do?method=ipLocation", {"ip": ip}, function (data) {
            if (data && data.flag == 200 && data.location) {
                $("#login_ip").html(ip + " , " + data.location);
            } else {
                $("#login_ip").html(ip);
            }
        });
    }

    function getIpLocationByTaoBao(ip) {
        $.get("http://ip.taobao.com/service/getIpInfo.php", {"ip": ip}, function (json) {
            if (json && json.code == 0 && json.data) {
                var data = json.data;
                var location = generateIpLocation(data.country, data.region, data.city, data.isp);
                $("#login_ip").html(ip + " , " + location);
            } else {
                $("#login_ip").html(ip);
            }
        }).fail(function () {
            console.warn("淘宝ip接口获取ip失败");
            $("#login_ip").html(ip);
        });
    }

    var municipality = ["北京", "天津", "上海", "重庆"];
    var autonomous = ["内蒙古", "广西", "宁夏", "新疆", "西藏"];

    function generateIpLocation(country, region, city, isp) {
        var location = "";
        if (isp == "内网") {
            location = "局域网";
            return location;
        }
        location += country;
        if (country == "中国") {
            if (municipality.indexOf(region) != -1) {
                location += (region + "市");
            } else if (autonomous.indexOf(region) != -1) {
                location += (region + "自治区");
            } else {
                location += (region + "省");
            }
            if (region != city && city != "XX") {
                location += (city + "市");
            }
            if (isp != "XX") {
                location += isp;
            }
        } else if (country == "美国") {
            location += (region + "州");
            if (region != city && city != "XX") {
                location += (city + "市");
            }
            if (isp != "XX") {
                location += isp;
            }
        } else {
            if (region != country && region != "XX") {
                location += region;
            }
            if (region != city && city != "XX") {
                location += city;
            }
            if (isp != "XX") {
                location += isp;
            }
        }
        return location;
    }

    function update_profile() {
        var data = getFormJson(document.getElementById('profile_form'));
        data.address = $('.prov').val() + '/' + $('.city').val() + '/' + $('.dist').val();
        data.birthday = $('.sel_year').val() + '/' + $('.sel_month').val() + '/' + $('.sel_day').val();
        $.ajax({
            url: 'user.do?method=saveProfile',
            type: "POST",
            data: data,
            success: function (data) {
                if (data.flag == 200) {
                    toastr.success('更新成功！');
                } else {
                    toastr.error(data.info, "更新失败！");
                    console.warn("Error Code: " + data.flag);
                }
            },
            error: function () {
                toastr.error('更新失败！');
            }
        });
    }

    var updateHeadPhoto = function (photoBlob, photoRawFile, callback) {
        if (!photoBlob) {
            toastr.error("输入的头像数据为空~");
            return;
        }
        common_utils.notify({
            "progressBar": false,
            "hideDuration": 0,
            "timeOut": 0,
            "closeButton": false
        }).success("正在上传头像~", "", "notify_head_photo_uploading");
        if (typeof photoBlob != "string") {
            var data = new FormData();
            data.append("imageFile", photoBlob);
            data.append("imageRawFile", photoRawFile);
            $.ajax({
                url: "user.do?method=updateHeadPhoto",
                data: data,
                type: "POST",
                contentType: false,
                cache: false,
                processData: false,
                global: false,
                success: function (data) {
                    common_utils.removeNotify("notify_head_photo_uploading");
                    if (data.flag == 200) {
                        toastr.success("头像上传成功~");
                        callback && callback(data.head_photo);
                    } else {
                        toastr.error(data.info, "头像上传失败");
                        console.warn("upload fail, Error Code: " + data.flag);
                    }
                },
                error: function (XHR, TS) {
                    common_utils.removeNotify("notify_head_photo_uploading");
                    toastr.error(TS, "头像上传失败");
                    console.warn("upload fail, Error Info: " + TS);
                }
            });
        } else if (typeof photoBlob == "string") {
            $.post("user.do?method=updateHeadPhoto", {"head_photo_path": photoBlob}, function (data) {
                common_utils.removeNotify("notify_head_photo_uploading");
                if (data.flag == 200) {
                    toastr.success("头像上传成功~");
                    callback && callback(data.head_photo);
                } else {
                    toastr.error(data.info, "头像上传失败");
                    console.warn("upload fail, Error Code: " + data.flag);
                }
            }).fail(function (XHR, TS) {
                common_utils.removeNotify("notify_head_photo_uploading");
                toastr.error(TS, "头像上传失败");
                console.warn("upload fail, Error Info: " + TS);
            });
        } else {
            common_utils.removeNotify("notify_head_photo_uploading");
        }
    };

    var initCropHeadPhoto = function () {
        //弹出框水平垂直居中
        (window.onresize = function () {
            var win_height = $(window).height();
            var win_width = $(window).width();
            if (win_width <= 768) {
                $(".tailoring-content").css({
                    "top": (win_height - $(".tailoring-content").outerHeight()) / 2,
                    "left": 0
                });
            } else {
                $(".tailoring-content").css({
                    "top": (win_height - $(".tailoring-content").outerHeight()) / 2,
                    "left": (win_width - $(".tailoring-content").outerWidth()) / 2
                });
            }
        })();
        // 弹出图片裁剪框
        $(".profile-head-photo-upload-trigger-modal").on("click", function () {
            $(".tailoring-container").toggle();
        });
        $("#head_photo").css("cursor", "pointer").on("click", function () {
            $(".tailoring-container").toggle();
        });
        // 关闭图片裁剪框
        $(".tailoring-container .close-tailoring").on("click", function () {
            closeTailor();
        });
        $(".tailoring-container .black-cloth").on("click", function () {
            closeTailor();
        });
        // 选择图像
        $(".tailoring-container").find(".choose-btn input").on("change", function () {
            selectImg(this);
        });
        var photoRawFile = null;

        function selectImg(file) {
            if (!file.files || !file.files[0]) {
                photoRawFile = null;
                return;
            }
            var reader = new FileReader();
            reader.onload = function (evt) {
                var replaceSrc = evt.target.result;
                //更换cropper的图片
                $('#tailoringImg').cropper('replace', replaceSrc, false); // 默认false，适应高度，不失真
            };
            photoRawFile = file.files[0];
            reader.readAsDataURL(photoRawFile);
        }

        //cropper图片裁剪
        $('#tailoringImg').cropper({
            aspectRatio: 1 / 1,//默认比例
            preview: '.previewImg',//预览视图
            guides: false,  //裁剪框的虚线(九宫格)
            autoCropArea: 0.5,  //0-1之间的数值，定义自动剪裁区域的大小，默认0.8
            movable: false, //是否允许移动图片
            dragCrop: true,  //是否允许移除当前的剪裁框，并通过拖动来新建一个剪裁框区域
            movable: true,  //是否允许移动剪裁框
            resizable: true,  //是否允许改变裁剪框的大小
            zoomable: false,  //是否允许缩放图片大小
            mouseWheelZoom: false,  //是否允许通过鼠标滚轮来缩放图片
            touchDragZoom: true,  //是否允许通过触摸移动来缩放图片
            rotatable: true,  //是否允许旋转图片
            crop: function (e) {
                // 输出结果数据裁剪图像。
            }
        });
        //旋转
        $(".cropper-rotate-btn").on("click", function () {
            $('#tailoringImg').cropper("rotate", 45);
        });
        //复位
        $(".cropper-reset-btn").on("click", function () {
            $('#tailoringImg').cropper("reset");
        });
        //换向
        var flagX = true;
        $(".cropper-scaleX-btn").on("click", function () {
            if (flagX) {
                $('#tailoringImg').cropper("scaleX", -1);
                flagX = false;
            } else {
                $('#tailoringImg').cropper("scaleX", 1);
                flagX = true;
            }
            flagX != flagX;
        });
        //裁剪后的处理
        $("#sureCut").on("click", function () {
            if ($("#tailoringImg").attr("src") == null) {
                return false;
            } else {
                var notifyCropHeadPhoto = common_utils.notify({
                    "closeButton": false,
                    "progressBar": false,
                    "iconClass": "toast-success-no-icon",
                    "timeOut": 0
                }).success("正在截取中~", "", "notify_crop_head_photo");
                var cas = $('#tailoringImg').cropper('getCroppedCanvas');//获取被裁剪后的canvas
                var base64url = cas.toDataURL('image/png'); //转换为base64地址形式
                notifyCropHeadPhoto.find(".toast-message").text("正在压缩中~");
                common_utils.canvasDataURL(base64url, {width: 250, quality: 1}, function (compressBase64url) {
                    common_utils.removeNotify("notify_crop_head_photo");
                    updateHeadPhoto(common_utils.convertBase64UrlToBlob(compressBase64url), photoRawFile, function (head_photo) {
                        $(".profile-head-photo").prop("src", staticPath + head_photo).attr("data-head-photo", head_photo);
                        $("#header").find(".navbar-right .user img").prop("src", staticPath + head_photo);
                        //关闭裁剪框
                        closeTailor();
                    });
                });
            }
        });
        //关闭裁剪框
        function closeTailor() {
            $(".tailoring-container").toggle();
        }

    };

    /**************** profile end ******************/

    /**************** account start ******************/

    function load_userAuthList() {
        $.get("auth.do?method=getUserAuthList", function (data) {
            if (data.flag == 200) {
                var username = null;
                var email = null;
                for (var i in data.userAuths) {
                    var userAuth = data.userAuths[i];
                    if (userAuth.identity_type == 1) {
                        username = userAuth.identifier;
                    } else if (userAuth.identity_type == 2) {
                        email = userAuth.identifier;
                    }
                }
                $('input[name="username"]').val(username);
                $('input[name="email"]').val(email);
                $('#validateMailForm').find('input[name="email"]').val(email);
                src_email = email;
                src_username = username;
            } else {
                toastr.error("账户凭证信息获取失败", data.info);
            }
        });
    }

    //用来保存每项检查的结果
    var mailcheck = true;
    var usernamecheck = true;
    var pwcheck = true;
    //保存原来的email与username
    var src_email;
    var src_username;
    //如果都通过就启用提交按钮
    function enableSaveAccountBtn() {
        if (mailcheck == true && usernamecheck == true && pwcheck == true) {
            $('#submit_account').removeAttr("disabled");
        }
    }

    //保存验证正确的的验证码
    var validateCode;

    function initAccountForm() {

        load_userAuthList();

        $('#submit_account').attr('disabled', "true");

        //发送验证邮件事件
        $('#sendValidateMailBtn').click(function () {
            var _self = $(this);
            sendValidateMail();
            $('#validateMailModal').modal({backdrop: 'static', keyboard: false});
            _self.attr('disabled', "true").html("发送验证邮件（30s后可再发送）");
            var num = 30;
            var time_inter = window.setInterval(function () {
                _self.html("发送验证邮件（" + (--num) + "s后可再发送）");
            }, 1000);
            setTimeout(function () {
                window.clearInterval(time_inter);
                _self.removeAttr("disabled").html("发送验证邮件");
            }, 30 * 1000 + 10);
        });
        //检查验证码是否正确事件
        $('#validateMailBtn').click(function () {
            var code = $('#validateMailForm').find('input[name="validateCode"]').eq(0).val().replace(/(^\s*)|(\s*$)/g, '');
            if (code) {
                $.get("site.do?method=checkValidateCode", {"code": code}, function (data) {
                    if (data.flag == 200) {
                        toastr.success('验证成功！');
                        validateCode = code; // 保存，提交请求时再提交
                        $('#validateMailModal').modal('hide');
                        $('#account_form').find("input").removeAttr("disabled");
                        $('#submit_account').removeAttr("disabled");
                        $('#sendValidateMailBtn').hide();
                    } else {
                        validateCode = null;
                        toastr.error(data.info, data.flag);
                        console.warn("Error Code: " + data.flag);
                    }
                });
            } else {
                toastr.error("请输入验证码~");
            }
        });
        //检查email
        $('#account_form').find('input[name="email"]').blur(function () {
            var span = $(this).parent().next().find('span');
            var email = $(this).val();
            if (email != null && email != "") {
                //如果还是原来的email就不检查
                if (email == src_email) {
                    span.html('');
                    mailcheck = true;
                    enableSaveAccountBtn();
                    return;
                }
                var reg = /^([a-zA-Z0-9]+[_|_|.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|_|.]?)*[a-zA-Z0-9]+.[a-zA-Z]{2,5}$/;
                if (!reg.test(email)) {
                    span.css('color', 'red');
                    span.html('输入正确邮箱格式');
                    $('#submit_account').attr('disabled', "true");
                    return;
                }
                //否则ajax验证
                $.get("auth.do?method=checkEmail&email=" + email, function (data) {
                    if (data.flag == 404) {
                        span.css('color', '#1ab394');
                        span.html('此邮箱可用!');
                        mailcheck = true;
                    } else {
                        span.css('color', 'red');
                        span.html('此邮箱已被使用!');
                        //邮箱地址已占用且所有主不为该用户时，禁用提交按钮
                        $('#submit_account').attr('disabled', "true");
                        mailcheck = false;
                    }
                    //检查是否符合开启按钮条件
                    enableSaveAccountBtn();
                });
            } else {
                span.css('color', 'red');
                span.html('邮箱不能为空!');
                $('#submit_account').attr('disabled', "true");
                mailcheck = false;
            }
        });

        //验证用户名
        $('#account_form').find('input[name="username"]').blur(function () {
            var span = $(this).parent().next().find('span');
            var username = $(this).val();
            if (username != null && username != "") {
                //如果还是原来的username就不检查
                if (username == src_username) {
                    span.html('');
                    usernamecheck = true;
                    enableSaveAccountBtn();
                    return;
                }
                var reg = /^[a-zA-Z\d][\w\.-]{0,20}$/;
                if (!reg.test(username)) {
                    span.css('color', 'red');
                    span.html('用户名只能包括字母、数字、横线、下划线、英文句号!且不大于20个字符');
                    $('#submit_account').attr('disabled', "true");
                    return;
                }
                //否则ajax验证
                $.get("auth.do?method=checkUsername&username=" + username, function (data) {
                    if (data.flag == 404) {
                        span.css('color', '#1ab394');
                        span.html('此用户名可用!');
                        usernamecheck = true;
                    } else {
                        span.css('color', 'red');
                        span.html('此用户名已被使用!');
                        //用户名已占用且所有主不为该用户时，禁用提交按钮
                        $('#submit_account').attr('disabled', "true");
                        usernamecheck = false;
                    }
                    //检查是否符合开启按钮条件
                    enableSaveAccountBtn();
                });
            } else {
                span.css('color', 'red');
                span.html('用户名不能为空!');
                $('#submit_account').attr('disabled', "true");
                usernamecheck = false;
            }
        });

        //验证密码
        $('#account_form').find(':password').blur(function () {
            var span = $('input[name="confirmpw"]').parent().next().find('span');
            var newpw = $('#account_form').find('input[name="newpw"]').val();
            var confirmpw = $('#account_form').find('input[name="confirmpw"]').val();
            if (newpw == confirmpw) {
                span.css('color', '#1ab394');
                span.html('');
                pwcheck = true;
                enableSaveAccountBtn();
            } else if (newpw != "" || confirmpw != "") {
                span.css('color', 'red');
                span.html('两次密码输入不相同!');
                $('#submit_account').attr('disabled', "true");
                pwcheck = false;
            }
        });

        $('#submit_account').click(function () {
            updateAccount();
        });
    }

    //发送验证码邮件
    function sendValidateMail() {
        common_utils.notify({
            "progressBar": false,
            "hideDuration": 0,
            "timeOut": 0,
            "closeButton": false
        }).success("服务器正在发送邮件~", "", "notify_validate_code_mail_sending");
        $.ajax({
            url: 'site.do?method=sendValidateCode',
            type: "POST",
            success: function (data) {
                common_utils.removeNotify("notify_validate_code_mail_sending");
                if (data.flag == 200) {
                    toastr.success("验证邮件发送成功！");
                } else {
                    toastr.error(data.info, "错误");
                    console.warn("Error Code: " + data.flag);
                }
            },
            error: function (XHR, TS) {
                common_utils.removeNotify("notify_validate_code_mail_sending");
                toastr.error(TS, '验证邮件发送失败！');
            }
        });
    }

    function updateAccount() {
        var form = $('#account_form');
        var data = {};
        //服务端再与Session中的验证码验证，防止修改html手动触发发送
        data.validateCode = validateCode;
        data.email = form.find('input[name="email"]').val();
        data.username = form.find('input[name="username"]').val();
        if (form.find('input[name="confirmpw"]').val() != "") {
            data.password = form.find('input[name="confirmpw"]').val();
        }
        $.ajax({
            url: "auth.do?method=updateAccount",
            type: "POST",
            data: data,
            success: function (data) {
                if (data.flag == 200) {
                    window.location.href = "auth.do?method=jumpLogin&identity_type=1&identifier=" + form.find('input[name="username"]').val();
                } else {
                    toastr.error(data.info, "保存失败！");
                    console.warn("Error Code: " + data.flag);
                }
            },
            error: function () {
                toastr.error('保存失败！');
                console.warn('修改账号信息失败！');
            }
        });
    }

    /**************** account end ******************/

    var followList;

    function load_follows(query_uid) {
        console.log('加载关注列表...');
        $.ajax({
            url: 'user.do?method=listFollows',
            data: {
                'uid': query_uid
            },
            success: function (data) {
                followList = data;
                if (data != null && data.length > 0) {
                    var html = '<div class="wrapper wrapper-content animated fadeInRight">';
                    $(data).each(function (i, user) {
                        html += '<div class="col-sm-4"><div class="contact-box">';
                        html += '<a target="_blank" href="user.do?method=home&uid=' + user.uid + '">';
                        html += '<div class="col-sm-4"><div class="text-center">';
                        html += '<img alt="image" class="img-circle m-t-xs img-responsive" src="' + staticPath + user.head_photo + '">';
                        html += '<div class="m-t-xs font-bold">' + user.userGroup.group_name + '</div></div></div><div class="col-sm-8">';
                        html += '<h3><strong>' + user.nickname + '</strong></h3>';
                        html += '<p><i class="fa fa-map-marker"></i>' + user.address + '</p><address>';
                        html += '<strong>' + user.description + '</strong><br>';
                        html += 'Weibo:<a target="_blank" href="' + user.weibo + '">' + user.weibo + '</a><br>';
                        html += '</address></div><div class="clearfix"></div></a></div></div>';
                    });
                    html += '</div>';
                    $('#follows').html(html);
                    $(".contact-box").each(function () {
                        animationHover(this, "pulse")
                    });
                }
                console.log('加载关注列表成功！');
            },
            error: function () {
                toastr.info('查询关注列表失败！');
                console.log('加载关注列表失败！');
            }
        });
    }

    var fansList;

    function load_fans(query_uid) {
        console.log('加载粉丝列表...');
        $.ajax({
            url: 'user.do?method=listFans',
            data: {
                'uid': query_uid
            },
            success: function (data) {
                fansList = data;
                if (data != null && data.length > 0) {
                    var html = '<div class="wrapper wrapper-content animated fadeInRight">';
                    $(data).each(function (i, user) {
                        html += '<div class="col-sm-4"><div class="contact-box">';
                        html += '<a target="_blank" href="user.do?method=home&uid=' + user.uid + '">';
                        html += '<div class="col-sm-4"><div class="text-center">';
                        html += '<img alt="image" class="img-circle m-t-xs img-responsive" src="' + staticPath + user.head_photo + '">';
                        html += '<div class="m-t-xs font-bold">' + user.userGroup.group_name + '</div></div></div><div class="col-sm-8">';
                        html += '<h3><strong>' + user.nickname + '</strong></h3>';
                        html += '<p><i class="fa fa-map-marker"></i>' + user.address + '</p><address>';
                        html += '<strong>' + user.description + '</strong><br>';
                        html += 'Weibo:<a target="_blank" href="' + user.weibo + '">' + user.weibo + '</a><br>';
                        html += '</address></div><div class="clearfix"></div></a></div></div>';
                    });
                    html += '</div>';
                    $('#fans').html(html);
                    $(".contact-box").each(function () {
                        animationHover(this, "pulse")
                    });
                }
                console.log('加载粉丝列表成功！');
            },
            error: function () {
                toastr.info('查询粉丝列表失败！');
                console.log('加载粉丝列表失败！');
            }
        });
    }

    var friendList;

    function load_friends() {
        console.log('加载好友列表...');
        $.ajax({
            url: 'user.do?method=listFriends',
            success: function (data) {
                friendList = data;
                if (data != null && data.length > 0) {
                    var html = '<div class="wrapper wrapper-content animated fadeInRight">';
                    $(data).each(function (i, user) {
                        html += '<div class="col-sm-4"><div class="contact-box">';
                        html += '<a target="_blank" href="user.do?method=home&uid=' + user.uid + '">';
                        html += '<div class="col-sm-4"><div class="text-center">';
                        html += '<img alt="image" class="img-circle m-t-xs img-responsive" src="' + staticPath + user.head_photo + '">';
                        html += '<div class="m-t-xs font-bold">' + user.userGroup.group_name + '</div></div></div><div class="col-sm-8">';
                        html += '<h3><strong>' + user.nickname + '</strong></h3>';
                        html += '<p><i class="fa fa-map-marker"></i>' + user.address + '</p><address>';
                        html += '<strong>' + user.description + '</strong><br>';
                        html += 'Weibo:<a target="_blank" href="' + user.weibo + '">' + user.weibo + '</a><br>';
                        html += '</address></div><div class="clearfix"></div></a></div></div>';
                    });
                    html += '</div>';
                    $('#friends').html(html);
                    $(".contact-box").each(function () {
                        animationHover(this, "pulse")
                    });
                }
                console.log('加载好友列表成功！');
            },
            error: function () {
                toastr.info('加载好友列表失败！');
                console.log('加载好友列表失败！');
            }
        });
    }

    function animationHover(o, e) {
        o = $(o), o.hover(function () {
            o.addClass("animated " + e)
        }, function () {
            window.setTimeout(function () {
                o.removeClass("animated " + e)
            }, 2e3)
        })
    }

    /**************** collect start ******************/
    function load_collection() {
        $.get("user.do?method=listCollections", function (data) {
            if (data != null && data.length > 0) {
                var clet_html = '<br><div class="row"><div class="col-sm-12 col-sm-offset-0 col-xs-12 col-xs-offset-0"><div class="wrapper wrapper-content animated fadeInUp"><ul class="notes">';
                $(data).each(function (i, clet) {
                    var click = 'onclick=\"window.open(\'article.do?method=detail&aid=' + clet.article_aid + '\')\"';
                    clet_html += '<li><div style="height: 210px;">' +
                        '<small ' + click + '>' + clet.clet_time + '</small>' +
                        '<h4 ' + click + ' >' + clet.author_nickname + '</h4>' +
                        '<p ' + click + '>' + clet.article_title + '</p>' +
                        '<a class="unCollectArticle_trigger" aid="' + clet.article_aid + '" ><i class="fa fa-trash-o "></i></a>' +
                        '</div></li>';
                });
                clet_html += '</ul></div></div></div>';
                $('#collections').html(clet_html);

                $('#collections .unCollectArticle_trigger').click(function () {
                    unCollectArticle(this.getAttribute('aid'), this);
                });
            }
            console.log('加载收藏列表成功！');
        });
    }

    function unCollectArticle(aid, a) {
        if (!confirm("你确定要取消收藏吗？")) return;
        //取消收藏
        $.ajax({
            url: "user.do?method=unCollectArticle",
            type: "POST",
            data: {'aid': aid},
            success: function (data) {
                if (data.flag == 200) {
                    $(a).parent().parent().remove();
                    toastr.success("删除收藏成功！");
                } else {
                    toastr.error(data.info, "删除收藏失败！");
                    console.warn("Error Code: " + data.flag);
                }
            },
            error: function () {
                toastr.error("删除收藏失败！");
            }
        });
    }

    /**************** collect end ******************/

    /**************** msg start ******************/

    var unreadList = {"letters": [], "sysMsgs": []};
    var letterList = [];
    var formatLetterList = {};
    var sysMsgList = [];
    var clearSysMsgOnOpenRunOnceFlag = true;

    function initMsgForm(callAfterLoad) {

        bindMessageDashboardEvent();

        bindChatModalEvent();

        // 加载数据
        load_unread(function (data) {
            unreadList = data;
            $("#messages").find('.folder-list li a[href="#listUnreadMsg"]').click();
        });
        load_letter(function (data) {
            letterList = data;
            formatLetterList = formatLetter(letterList);
            $("#letterCount").html(letterList.length);
            $("#msgBoxSize").html(letterList.length);
            asbChatUserList();
            callAfterLoad && callAfterLoad();
        });
        load_sysMsg(function (data) {
            sysMsgList = data;
            $("#sysMsgCount").html(sysMsgList.length);
        });

        // 注册监控服务器的未读消息推送
        initWsReceiveServerPush();
    }

    // 消息仪表盘的各种事件
    function bindMessageDashboardEvent() {
        // 消息类型侧边栏点击事件
        $("#messages").find(".folder-list").on("click", "a", function () {
            $("#messages").find(".folder-list li").css("background-color", "").removeClass("active-li");
            $(this).parent().css("background-color", "#eee").addClass("active-li"); // 变色
            var hash = $(this).attr("href");
            switch (hash) {
                case "#listUnreadMsg":  // 未读消息
                    if (clearSysMsgOnOpenRunOnceFlag) {
                        var smids = [];
                        $.each(unreadList.sysMsgs, function (i, sysMsg) {
                            if (sysMsg.status == 0) {
                                smids.push(sysMsg.smid);
                            }
                        });
                        clearSysMsgListStatus(smids, function () {
                            console.log("已清除未读的系统消息");
                        });
                        clearSysMsgOnOpenRunOnceFlag = false;
                    }
                    var count = buildUnreadListAreaHtml(unreadList);
                    $("#unReadMsgCount").html(count);
                    $("#batchClearMessageStatusBtn").show();
                    break;
                case "#listLetters":    // 私信消息
                    $("#batchClearMessageStatusBtn").hide();
                    buildLetterListAreaHtml(letterList);
                    $("#letterCount").html(letterList.length);
                    $("#msgBoxSize").html(letterList.length);
                    break;
                case "#listSysMsgs":    // 系统消息
                    $("#batchClearMessageStatusBtn").hide();
                    buildSysMsgListAreaHtml(sysMsgList);
                    break;
                default:
                    return true;
            }
            return false;
        });
        var messageDashboardMain = $("#messageDashboardMain");
        // 打开该条的私信对应用户的聊天弹窗
        messageDashboardMain.on("click", ".showChatModal_trigger", function () {
            showChatModal(this.getAttribute("uid"));
        });
        // 选择该行消息
        messageDashboardMain.on("click", ".check-mail", function (e) {
            if (e.target.tagName.toLowerCase() == "td") {
                var checkBox = $(this).find("input");
                if (checkBox.prop("checked")) {
                    checkBox.prop("checked", false);
                } else {
                    checkBox.prop("checked", true);
                }
            }
        });
        // 标记消息为已读按钮
        $("#batchClearMessageStatusBtn").on("click", function () {
            // 系统消息
            var smIds = [];
            messageDashboardMain.find(".unread-msg.sys-msg-li .check-mail input:checked").each(function (i, checkbox) {
                smIds.push(parseInt(checkbox.parentNode.parentNode.getAttribute("data-smid")));
            });
            clearSysMsgListStatus(smIds, function (smIds) {
                unreadList.sysMsgs = unreadList.sysMsgs.filter(function (sysMsg) {
                    return smIds.indexOf(sysMsg.smid) == -1;
                });
                $("#messages").find('.folder-list li a[href="#listUnreadMsg"]').click();
                toastr.success("清除未读系统消息成功！");
            });
            // 私信消息
            var userIds = [];
            messageDashboardMain.find(".unread-msg.letter-li .check-mail input:checked").each(function (i, checkbox) {
                userIds.push(parseInt(checkbox.parentNode.parentNode.getAttribute("data-uid")));
            });
            var leIds = [];
            $.each(userIds, function (i, uid) {
                var userLetters = formatLetterList[uid];
                if (userLetters) {
                    $.each(userLetters, function (i, letter) {
                        if (letter.status == 0) {
                            leIds.push(letter.leid);
                        }
                    });
                }
            });
            clearLetterListStatus(leIds, function (leIds) {
                unreadList.letters = unreadList.letters.filter(function (letter) {
                    return leIds.indexOf(letter.leid) == -1;
                });
                $("#messages").find('.folder-list li a[href="#listUnreadMsg"]').click();
            });
            if (smIds.length == 0 && userIds.length == 0) {
                toastr.error("还没有选择，你点什么");
            }
        });
        // 删除系统消息按钮
        $("#batchDeleteMessageBtn").on("click", function () {
                // 系统消息
                var smIds = [];
                messageDashboardMain.find(".sys-msg-li .check-mail input:checked").each(function (i, checkbox) {
                    smIds.push(parseInt(checkbox.parentNode.parentNode.getAttribute("data-smid")));
                });
                if (smIds.length > 0) {
                    if (window.confirm("确定删除" + smIds.length + "条系统消息吗？")) {
                        deleteSysMsgList(smIds, function (smIds) {
                            unreadList.sysMsgs = unreadList.sysMsgs.filter(function (sysMsg) {
                                return smIds.indexOf(sysMsg.smid) == -1;
                            });
                            sysMsgList = sysMsgList.filter(function (sysMsg) {
                                return smIds.indexOf(sysMsg.smid) == -1;
                            });
                            $("#messages").find(".folder-list li.active-li a").click();
                        });
                    }
                } else {
                    toastr.error("（删除私信请到聊天弹窗~）", "请先选择要删除的消息~");
                }
            }
        );
        // 刷新消息列表按钮
        $("#refreshMessageListBtn").on("click", function () {
            common_utils.notify({
                "closeButton": false,
                "progressBar": false,
                "iconClass": "toast-success-no-icon",
                "timeOut": 0
            }).success("正在拉取数据中~", "", "notify_refresh_message_list");
            var activeLiName = $("#messages").find(".folder-list li.active-li a").attr("href") || "#listUnreadMsg";
            load_unread(function (data) {
                unreadList = data;
                if (activeLiName == "#listUnreadMsg") {
                    common_utils.removeNotify("notify_refresh_message_list");
                    toastr.success("刷新消息列表成功~");
                    $("#messages").find('.folder-list li a[href="#listUnreadMsg"]').click();
                }
            });
            load_letter(function (data) {
                letterList = data;
                if (activeLiName == "#listLetters") {
                    common_utils.removeNotify("notify_refresh_message_list");
                    toastr.success("刷新消息列表成功~");
                    $("#messages").find('.folder-list li a[href="#listLetters"]').click();
                } else {
                    formatLetterList = formatLetter(letterList);
                    $("#letterCount").html(letterList.length);
                    $("#msgBoxSize").html(letterList.length);
                    asbChatUserList();
                }
            });
            load_sysMsg(function (data) {
                sysMsgList = data;
                if (activeLiName == "#listSysMsgs") {
                    common_utils.removeNotify("notify_refresh_message_list");
                    toastr.success("刷新消息列表成功~");
                    $("#messages").find('.folder-list li a[href="#listSysMsgs"]').click();
                } else {
                    $("#sysMsgCount").html(sysMsgList.length);
                }

            });
        });
    }

    // 私信聊天弹窗的事件
    function bindChatModalEvent() {
        // 提交消息
        $("#sendLetter_submit").click(function () {
            sendLetter();
        });
        // 打开聊天框
        $("#openChatModal").click(function () {
            showChatModal(null);
        });
        // 滚动
        $("#chat_Modal").on("shown.bs.modal", function () {
            //滚动到底部
            //[0]是从jquery中取得原js对象
            $("#currentLetterContent")[0].scrollTop = $("#currentLetterContent")[0].scrollHeight + 2000;
            //$("#currentLetterContent .chat-discussion-end")[0].scrollIntoView(true);
            $("#sendLetter_area").focus();
        });

        if ($(window).width() > 768) {
            $("#chat_Modal").find(".modal-dialog").css({
                "margin-top": $(window).height() / 2 - (805 / 2)
            });
        }
    }

    /* --------------------- 仪表板区域 的各种消息列表  start -------------------------*/

    // 将私信列表分类 key为chatuser 的id
    function formatLetter(letterList) {
        var formatLetterList = {};
        $.each(letterList, function (i, letter) {
            if (!(formatLetterList.hasOwnProperty(letter.chatUser.uid))) {
                formatLetterList[letter.chatUser.uid] = [];
                formatLetterList[letter.chatUser.uid].push(letter);
            } else {
                formatLetterList[letter.chatUser.uid].push(letter);
            }
        });
        return formatLetterList;
    }

    // 构建面板中未读消息列表的HTML
    function buildUnreadListAreaHtml(unreadData) {
        var count = 0;
        if (unreadData != null) {
            var unreadLetterList = unreadData.letters;
            var unreadSysMsgList = unreadData.sysMsgs;
            var html = '';
            if (unreadLetterList) {
                var formatLetterList = formatLetter(unreadLetterList);
                $.each(formatLetterList, function (key, arr) {
                    html += '<tr class="unread unread-msg letter-li" data-uid="' + arr[0].chatUser.uid + '"><td class="check-mail"><input type="checkbox" class="i-checks"></td>';
                    html += '<td class="mail-ontact"><a class="showChatModal_trigger" uid="' + arr[0].chatUser.uid + '">' + arr[0].chatUser.nickname + '</a></td>';
                    html += ' <td class="mail-subject showChatModal_trigger" uid="' + arr[0].chatUser.uid + '"><a>' +
                        arr[0].content
                            .replace(/<img.*?>/g, "[图片]")
                            .replace(/class=(["'])[^\1]*?aspect-ratio[^\1]*?\1/gi, "")
                            //.replace(/<(iframe|video|embed).*?(?<=\/|<\/\1)>/gi, "[视频]") //火狐不支持前置断言
                            .replace(/<(iframe|video|embed).*?(\/|<\/\1)>/gi, "[视频]")
                        + '</a></td>';
                    // html += '<td class=""><i class="fa fa-paperclip"></i></td>';
                    html += '<td class="text-right mail-date">' + arr[0].send_time + '</td></tr>';
                });
                if (unreadLetterList && unreadLetterList.length > 0) {
                    $('#newestMsgTime').html(unreadLetterList[0].send_time);
                }
                count += unreadLetterList.length;
            } else {
                unreadList.letters = [];
            }
            if (unreadSysMsgList) {
                $(unreadSysMsgList).each(function (i, sysMsg) {
                    html += '<tr class="unread unread-msg sys-msg-li" data-smid="' + sysMsg.smid + '"><td class="check-mail"><input type="checkbox" class="i-checks"></td>';
                    html += '<td class="mail-ontact"><a>系统通知</a></td>';
                    html += ' <td class="mail-subject">' +
                        sysMsg.content
                            .replace(/<img.*?>/g, "[图片]")
                            .replace(/class=(["'])[^\1]*?aspect-ratio[^\1]*?\1/gi, "")
                            //.replace(/<(iframe|video|embed).*?(?<=\/|<\/\1)>/gi, "[视频]") //火狐不支持前置断言
                            .replace(/<(iframe|video|embed).*?(\/|<\/\1)>/gi, "[视频]")
                        + '</td>';
                    html += '<td class="text-right mail-date">' + sysMsg.send_time + '</td></tr>';
                });
                count += unreadSysMsgList.length;
            } else {
                unreadList.sysMsgs = [];
            }
            $("#messageDashboardMain").html(html);
        }
        return count;
    }

    // 构建面板中私信消息列表的HTML
    function buildLetterListAreaHtml(letterList) {
        formatLetterList = formatLetter(letterList);
        var html = '';
        $.each(formatLetterList, function (key, arr) {
            html += '<tr class="unread full-msg letter-li" data-uid="' + arr[0].chatUser.uid + '"><td class="check-mail"><input type="checkbox" class="i-checks"></td>';
            html += '<td class="mail-ontact"><a class="showChatModal_trigger" uid="' + arr[0].chatUser.uid + '">' + arr[0].chatUser.nickname + '</a></td>';
            html += ' <td class="mail-subject showChatModal_trigger" uid="' + arr[0].chatUser.uid + '"><a>' +
                arr[0].content
                    .replace(/<img.*?>/g, "[图片]")
                    .replace(/class=(["'])[^\1]*?aspect-ratio[^\1]*?\1/gi, "")
                    //.replace(/<(iframe|video|embed).*?(?<=\/|<\/\1)>/gi, "[视频]") //火狐不支持前置断言
                    .replace(/<(iframe|video|embed).*?(\/|<\/\1)>/gi, "[视频]")
                + '</a></td>';
            html += '<td class="text-right mail-date">' + arr[0].send_time + '</td></tr>';
        });
        $("#messageDashboardMain").html(html);
    }

    // 构建面板中系统消息列表的HTML
    function buildSysMsgListAreaHtml(sysMsgList) {
        var html = '';
        $(sysMsgList).each(function (i, sysMsg) {
            html += '<tr class="unread full-msg sys-msg-li" data-smid="' + sysMsg.smid + '"><td class="check-mail"><input type="checkbox" class="i-checks"></td>';
            html += '<td class="mail-ontact"><a>系统通知</a></td>';
            html += ' <td class="mail-subject"><a>' +
                sysMsg.content
                    .replace(/<img.*?>/g, "[图片]")
                    .replace(/class=(["'])[^\1]*?aspect-ratio[^\1]*?\1/gi, "")
                    //.replace(/<(iframe|video|embed).*?(?<=\/|<\/\1)>/gi, "[视频]") //火狐不支持前置断言
                    .replace(/<(iframe|video|embed).*?(\/|<\/\1)>/gi, "[视频]")
                + '</a></td>';
            html += '<td class="text-right mail-date">' + sysMsg.send_time + '</td></tr>';
        });
        $("#messageDashboardMain").html(html);
    }

    function removeUnreadSysMsgListInPage(smids) {

    }

    function removeUnreadLetterListInPage(leids) {

    }

    function removeSysMsgListInPage(smids) {

    }

    function removeLetterListInPage(leids) {

    }

    /* --------------------- 仪表板区域 的各种消息列表  end -------------------------*/

    /* --------------------- 私信聊天模式框 start -------------------------*/

    function showChatModal(uid) {
        if (uid && !isNaN(uid) && parseInt(uid) > 0) {
            if ($('#chat_uid_' + uid).length <= 0) { // 如果此用户不在聊天用户列表中，则先放入
                appendToChatUserList(uid, function () {
                    $('#chat_uid_' + uid).click();
                });
            } else {
                $('#chat_uid_' + uid).click();
            }
        }
        $('#chat_Modal').modal();
    }

    // 组装聊天用户列表
    function asbChatUserList() {
        if (formatLetterList) {
            var html = '<div class="chat-user" style="background-color: rgb(245, 245, 245);"><input class="appendNewUserToChat" placeholder="输入用户id查找"></div>';
            $.each(formatLetterList, function (key, arr) {
                if (!arr || arr.length == 0) {
                    return;
                }
                html += '<div class="chat-user asbChatUserLetterList_trigger" id="chat_uid_' + arr[0].chatUser.uid + '" uid="' + arr[0].chatUser.uid + '">';
                html += '<img class="chat-avatar" src="' + staticPath + arr[0].chatUser.head_photo + '" alt="">';
                html += '<div class="chat-user-name">';
                html += '<a >' + arr[0].chatUser.nickname + '</a>';
                html += '</div></div>';
            });
            var userListArea = $('#letter_userList');
            userListArea.html(html);
            userListArea.on("click", ".asbChatUserLetterList_trigger", function () {    // 变色
                var uid = this.getAttribute('uid');
                asbChatUserLetterList(uid);
                setAsbChatColor(uid);
            });
            userListArea.find(".appendNewUserToChat").on("keydown", function (e) {  // 添加新聊天用户
                e.defaultPrevented;
                var theEvent = e || window.event;
                var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
                if (code == 13) { // keyCode=13是回车键
                    var chatUid = $(this).val().trim();
                    if (!/^\d+$/.test(chatUid)) {
                        toastr.error("用户id格式不对");
                    } else {
                        showChatModal(chatUid);
                        $(this).val("");
                    }
                    // 防止触发表单提交 返回false
                    return false;
                }
            });
        }
    }

    // 追加新的用户（用户不在聊天用户列表中时）
    var tempChatUser = null;    // 缓存加载的用户
    function appendToChatUserList(chatUid, callback) {
        if ($("#chat_uid_" + chatUid).length > 0) {
            return;
        }
        if (!formatLetterList[chatUid] || formatLetterList[chatUid].length == 0) {
            if (!tempChatUser || tempChatUser.uid != chatUid) {
                $.get("user.do?method=profile&uid=" + chatUid, function (chatUser) {
                    if (chatUser) {
                        tempChatUser = chatUser;
                        var html = "";
                        html += '<div class="chat-user asbChatUserLetterList_trigger" id="chat_uid_' + chatUser.uid + '" uid="' + chatUser.uid + '" >';
                        html += '<img class="chat-avatar" src="' + staticPath + chatUser.head_photo + '" title="' + chatUser.nickname + '">';
                        html += '<div class="chat-user-name">';
                        html += '<a >' + chatUser.nickname + '</a>';
                        html += ' </div></div>';
                        $('#letter_userList').append(html);
                        $('#chat_uid_' + chatUser.uid).click(function () {
                            var uid = this.getAttribute('uid');
                            asbChatUserLetterList(uid);
                            setAsbChatColor(uid);
                        });
                        callback && callback();
                        console.log("用户 " + chatUid + " 不存在聊天列表中，请求数据加载成功！ ");
                    } else {
                        toastr.error("用户 ：" + chatUid + " 不存在！ ", '提示', {"timeOut": 6500});
                    }
                });
            }
        } else {
            var chatUser = formatLetterList[chatUid][0].chatUser;
            var html = "";
            html += '<div class="chat-user asbChatUserLetterList_trigger" id="chat_uid_' + chatUser.uid + '" uid="' + chatUser.uid + '" >';
            html += '<img class="chat-avatar" src="' + staticPath + chatUser.head_photo + '" title="' + chatUser.nickname + '">';
            html += '<div class="chat-user-name">';
            html += '<a >' + chatUser.nickname + '</a>';
            html += ' </div></div>';
            $('#letter_userList').append(html);
            $('#chat_uid_' + chatUser.uid).click(function () {
                var uid = this.getAttribute('uid');
                asbChatUserLetterList(uid);
                setAsbChatColor(uid);
            });
            callback && callback();
        }
    }

    //  组装当前要查看用户的消息列表
    function asbChatUserLetterList(chatUid) {
        $('#currentLetterContent').attr("uid", chatUid);
        if (formatLetterList) {
            var letterList = formatLetterList[chatUid];
            var html = '';
            if (letterList) {
                var loginUserHeadPath = $('#head_photo').attr('src');
                var loginUserNickname = $('input[name="nickname"]').val();
                //倒序遍历
                for (var i = letterList.length - 1; i >= 0; i--) {
                    var letter = letterList[i];
                    html += '<div class="chat-message-' + (letter.s_uid == $uid ? "right" : "left") + '" data-leid="' + letter.leid + '" data-s-uid="' + letter.s_uid + '">';
                    html += '<img class="message-avatar" src="' + (letter.s_uid == $uid ? loginUserHeadPath : (staticPath + letter.chatUser.head_photo) ) + '" alt="">';
                    html += '<div class="message">';
                    html += ' <a class="message-author" target="_blank" href="user.do?method=home&uid=' + letter.s_uid + '">' + (letter.s_uid == $uid ? loginUserNickname : letter.chatUser.nickname) + '</a>';
                    html += '<span class="message-date" >' + letter.send_time + '</span>';
                    html += '<span class="message-del">' + (letter.s_uid == $uid ? "撤回" : "删除") + '</span>';
                    html += '<span class="message-content" >' + letter.content + '</span></div></div>';
                }
                html += '<div class="chat-discussion-end" style="height:0px; overflow:hidden"></div>';
                $('#currentLetterContent').html(html);

                //滚动到底部
                $("#currentLetterContent")[0].scrollTop = $("#currentLetterContent")[0].scrollHeight;
                setTimeout(function () {    // 延迟防止modal未显示时高度未0情况
                    $("#currentLetterContent")[0].scrollTop = $("#currentLetterContent")[0].scrollHeight + 2000; // 预留图片高度
                }, 300);

                $('#currentLetterContent').find(".message-del").click(function () {
                    if (window.confirm("你确定要删除这条私信吗？")) {
                        var letterNode = this.parentNode.parentNode;
                        var leid = parseInt(letterNode.getAttribute("data-leid"));
                        var ismy = letterNode.getAttribute("data-s-uid") == $uid;
                        deleteLetter(leid, ismy);
                    }
                })
                $('#currentLetterContent').find(".chat-message-right, .chat-message-left").hover(function () {
                    $(this).find(".message-del").css("visibility", "visible");
                }, function () {
                    $(this).find(".message-del").css("visibility", "hidden");
                });
            } else {
                $('#currentLetterContent').html("");
            }
        }
    }

    //聊天用户列表 点击变色
    function setAsbChatColor(id) {
        $(".chat-user").css('background-color', '#f5f5f5');
        $("#chat_uid_" + id).css('background-color', '#1ab394');
    }

    // 从本地内存中删除该私信消息
    function deleteLetterInLocal(leid) {
        var isFind = false;
        // 从letterList中删除
        var filterArr = letterList.filter(function (letter) {
            return letter.leid == leid;
        });
        if (filterArr.length > 0) {
            letterList.splice(letterList.indexOf(filterArr[0]), 1);
            // 从formatLetterList中删除
            var formatKey = (filterArr[0].s_uid == $uid ? filterArr[0].r_uid : filterArr[0].s_uid);
            var chatUserLetterList = formatLetterList[formatKey];
            if (chatUserLetterList) {
                var formatArrIndex = -1;
                $.each(chatUserLetterList, function (i, letter) {
                    if (letter.leid == leid) {
                        formatArrIndex = i;
                        return false;
                    }
                });
                if (formatArrIndex != -1) {
                    chatUserLetterList.splice(formatArrIndex, 1);
                }
            }
            isFind = true;
        }
        // 从unreadList.letters中删除
        if (unreadList && unreadList.letters) {
            var unreadArrIndex = -1;
            $.each(unreadList.letters, function (i, letter) {
                if (letter.leid == leid) {
                    unreadArrIndex = i;
                    return false;
                }
            });
            if (unreadArrIndex != -1) {
                unreadList.letters.splice(unreadArrIndex, 1);
            }
        }
        if (isFind) {
            $('#currentLetterContent').find('[data-leid="' + leid + '"]').remove();
            common_utils.removeNotify("receive_letter" + "_" + leid);
            $("#messages").find(".folder-list li.active-li a").click();
        }
        return isFind;
    }

    /* --------------------- 私信聊天模式框 end -------------------------*/

    /* --------------------- 发送消息与服务器交互请求 start -------------------------*/

    // 从服务器加载未读消息列表
    function load_unread(call) {
        $.ajax({
            url: 'message.do?method=listUnreadMsg',
            success: function (data) {
                call && call(data);
            },
            error: function () {
                console.log('加载未读消息失败！');
            }
        });
    }

    // 从服务器加载私信消息列表
    function load_letter(call) {
        console.log('加载私信消息...');
        $.ajax({
            url: "message.do?method=listLetter",
            data: {
                "read_status": 1
            },
            success: function (data) {
                if (data != null) {
                    call && call(data);
                }
                console.log('加载私信消息成功！');
            },
            error: function () {
                console.log('加载私信消息失败！');
            }
        });
    }

    // 从服务加载系统消息列表
    function load_sysMsg(call) {
        console.log('加载系统消息中...');
        $.ajax({
            url: "message.do?method=listSysMsg",
            data: {
                "read_status": 1
            },
            success: function (data) {
                if (data != null) {
                    call && call(data);
                }
                console.log('加载系统消息成功！');
            },
            error: function () {
                console.log('加载系统消息失败！');
            }
        });
    }

    /**
     * 提交私信到服务器
     */
    function sendLetter() {
        var content = $('#sendLetter_area').val();
        var r_uid = $('#currentLetterContent').attr('uid');
        var send_time = new Date().getTime();
        if (!r_uid) {
            toastr.error('未指定用户~');
        } else if (content) {
            // 将图片链接转化为img标签
            var reMap = {};
            var replacementIndex = 0;
            content = content.replace(/<img.*?>/gi, function (match) {
                var key = "【$RE_(*&$_MATCH_^_REPACEMENT_%$_" + (replacementIndex++) + "】"; // 首尾中文符号，避开[\x21-\x7e]更合适
                reMap[key] = match;
                return key;
            });
            content = content.replace(/(https?:\/\/[a-z0-9\.]+\/[\x21-\x7e]*\.(gif|jpe?g|png|bmp|svg|ico)(\?[\x21-\x7e]*)?)/gi, function (match, url) {
                if (content != url) {
                    return '<img src="' + match + '" style="padding-bottom: 6px;padding-top: 6px;">';
                } else {
                    return '<img src="' + match + '">';
                }
            });
            for (var reKey in reMap) {
                content = content.replace(reKey, reMap[reKey]);
            }
            $.ajax({
                url: "message.do?method=sendLetter",
                type: "POST",
                data: {
                    'content': content,
                    'send_time': send_time,
                    'r_uid': $('#currentLetterContent').attr('uid')
                },
                success: function (data) {
                    if (data.flag == 200) {
                        var letter = data.letter;
                        letterList.unshift(letter); // 追加到放入缓存中
                        if (!formatLetterList[r_uid]) {
                            formatLetterList[r_uid] = [];
                        }
                        //从头部插入
                        formatLetterList[r_uid].unshift(letter);
                        $('#chat_uid_' + r_uid).click(); // 追加显示新的消息
                        $('#sendLetter_area').val("");
                        toastr.success('发送消息成功！');
                    } else {
                        toastr.error(data.info, "消息发送失败！");
                        console.warn("Error Code: " + data.flag);
                    }
                },
                error: function () {
                    toastr.error('发送消息失败！');
                }
            });
        } else {
            toastr.error('请输入内容！');
        }
    }

    /**
     * 清除未读私信消息
     * @param leids
     */
    function clearLetterListStatus(leids, call) {
        if (!leids || !(leids instanceof Array)) {
            return;
        }
        if (leids.length > 0) {
            $.ajax({
                type: "POST",
                url: "message.do?method=clearLetterListStatus",
                data: {"leids": leids.join()},
                dataType: "json",
                success: function (data) {
                    if (data.flag == 200 || data.flag == 404) {
                        call && call(leids);
                        toastr.success("标记私信消息为已读成功！");
                    } else {
                        toastr.error("标记私信消息为已读失败！", data.info);
                        console.warn("Error Code: " + data.flag);
                    }
                },
                error: function (xhr, ts) {
                    toastr.error("标记私信消息为已读失败！Error Info: " + ts);
                    console.log("Clear letter status found error, Error Code: " + ts);
                }
            });
        }
    }

    /**
     * 删除并撤回私信消息
     * @param leid
     */
    function deleteLetter(leid, ismy) {
        if (!leid) {
            return;
        }
        ismy === undefined && (ismy = true);
        $.post("message.do?method=deleteLetter", {"leid": leid}, function (data) {
            if (data.flag == 200) {
                deleteLetterInLocal(leid) && toastr.success(ismy ? "已删除并撤回你的消息~" : "已删除对方消息");
            } else {
                toastr.error(data.info, (ismy ? "撤回消息失败~" : "删除消息失败~"));
                console.warn("Error Code: " + data.flag);
            }
        });
    }

    /**
     * 清除未读系统消息
     * @param smids
     */
    function clearSysMsgListStatus(smids, call) {
        if (!smids || !(smids instanceof Array)) {
            return;
        }
        if (smids.length > 0) {
            $.ajax({
                type: "POST",
                url: "message.do?method=clearSysMsgListStatus",
                data: {"smids": smids.join()},
                dataType: "json",
                success: function (data) {
                    if (data.flag == 200 || data.flag == 404) {
                        call && call(smids);
                    } else {
                        toastr.error("标记系统消息为已读失败！", data.info);
                        console.warn("Error Code: " + data.flag);
                    }
                },
                error: function (xhr, ts) {
                    toastr.error("标记系统消息为已读失败！Error Info: " + ts);
                    console.log("Clear msg status found error, Error Code: " + ts);
                }
            });
        }
    }

    /**
     * 删除系统消息
     * @param smids
     */
    function deleteSysMsgList(smids, call) {
        if (!smids || !(smids instanceof Array)) {
            return;
        }
        if (smids.length > 0) {
            $.ajax({
                type: "POST",
                url: "message.do?method=deleteSysMsgList",
                data: {"smids": smids.join()},
                dataType: "json",
                success: function (data) {
                    if (data.flag == 200 || data.flag == 404) {
                        call && call(smids);
                        toastr.success("删除系统消息成功！");
                    } else {
                        toastr.error("删除系统消息失败！" + data.info);
                        console.warn("Error Code: " + data.flag);
                    }
                },
                error: function (xhr, ts) {
                    toastr.error("删除系统消息失败！Error Info: " + ts);
                    console.log("Delete msg status found error, Error Code: " + ts);
                }
            });
        }
    }

    /* --------------------- 发送消息与服务器交互请求  end -------------------------*/

    // 注册监控服务器的未读消息推送
    function initWsReceiveServerPush() {
        if (login_handle.validateLogin()) {
            var eventPrefix = websocket_util.config.event.messageReceive + ".";
            var notify_ws_opts = {
                "progressBar": false,
                "positionClass": "toast-top-right",
                "iconClass": "toast-success-no-icon",
                "timeOut": 0,
                "onclick": function () {

                },
                "onShown": function () {
                    $(this).css("opacity", "1");
                }
            };
            // 收到新私信，unbind取消login.js中的默认处理
            websocket_util.unbind(eventPrefix + "receive_letter").bind(eventPrefix + "receive_letter", function (e, wsMessage, wsEvent) {
                var user = wsMessage.metadata.user;
                var letter = wsMessage.metadata.letter; // 新私信
                if (!letter) {
                    return;
                }
                // 追加到放入缓存中
                if (!letterList) {  // 放入到全部消息中
                    letterList = [];
                }
                if (!formatLetterList) {
                    formatLetterList = {};
                }
                letterList.unshift(letter);
                if (!formatLetterList[letter.s_uid]) {
                    formatLetterList[letter.s_uid] = [];
                }
                formatLetterList[letter.s_uid].unshift(letter);
                if (!unreadList) {  // 放入到未读消息中
                    unreadList = {};
                }
                if (!unreadList.letters) {
                    unreadList.letters = [];
                }
                unreadList.letters.unshift(letter);
                // 显示
                var notify_opts = $.extend({}, notify_ws_opts, {
                    "timeOut": 0,
                    "hideOnHover": false,
                    "onclick": function () {
                        showChatModal(letter.s_uid); // 打开聊天框
                    }
                });
                // 显示通知
                var toastrElement = null;
                if (/<(img|iframe|video|embed).*?>/.test(letter.content)) {
                    toastrElement = common_utils.notify(notify_opts).success(letter.content, user.nickname + " 对你说：", "receive_letter" + "_" + letter.leid);
                } else {
                    toastrElement = common_utils.notify(notify_opts).success("<b>“" + letter.content + "”</b>", user.nickname + " 对你说：", "receive_letter" + "_" + letter.leid);
                }
                toastrElement.addClass("receive_letter").attr("data-leid", letter.leid).attr("data-wsid", wsMessage.id);
                // 插入聊天面板
                if ($('#chat_uid_' + letter.s_uid).length <= 0) { // 如果此用户不在聊天用户列表中，则先放入
                    appendToChatUserList(letter.s_uid, function () {
                        if (letter.s_uid == $('#currentLetterContent').attr("uid")) {
                            $('#chat_uid_' + letter.s_uid).click();
                        }
                    });
                } else {
                    if (letter.s_uid == $('#currentLetterContent').attr("uid")) { // 如果正在查看该用户的消息，则直接插入
                        $('#chat_uid_' + letter.s_uid).click();
                    }
                }
                $('#newestMsgTime').html(letter.send_time);
            }).unbind(eventPrefix + "withdraw_letter").onPush("withdraw_letter", function (e, wsMessage, wsEvent) { // 当别的用户撤回消息
                var user = wsMessage.metadata.user;
                var letter = wsMessage.metadata.letter; // 被撤回的私信
                if (letter) {
                    if (deleteLetterInLocal(letter.leid)) {
                        var notify_opts = $.extend({}, notify_ws_opts, {
                            "timeOut": 10000,
                            "hideOnHover": false,
                            "onclick": function () {
                                showChatModal(letter.s_uid); // 打开聊天框
                            }
                        });
                        common_utils.notify(notify_opts)
                            .info(user.nickname + " 撤回了一条消息.", "", "withdraw_letter" + "_" + wsMessage.id)
                            .addClass("wsMessage withdraw_letter").attr("data-wsid", wsMessage.id);
                    }
                }
            });
        }
    }

    var loadUserSetting = function (call) {
        $.get("user.do?method=getUserSetting", function (data) {
            if (data.flag == 200) {
                call(data.userSetting);
            }
        });
    };

    var updateUserSetting = function (userSetting, call) {
        $.post("user.do?method=updateUserSetting", userSetting, function (data) {
            if (data.flag == 200) {
                toastr.success("用户账号配置更新成功~");
                call(data.userSetting);
            } else {
                toastr.error(data.info, "更新失败");
                console.warn("Error Code: " + data.flag);
            }
        });
    };

    function init_setting() {
        // 账号设置，存于服务器
        var userSetting = null;
        loadUserSetting(function (loadUserSetting) {
            userSetting = loadUserSetting;
            if (userSetting.receiveNotifyEmail == 0) {
                $("#setting_account").find('input[name="setting_receive_notify_email"][value="true"]').prop("checked", true);
            } else {
                $("#setting_account").find('input[name="setting_receive_notify_email"][value="false"]').prop("checked", true);
            }

        });
        $("#submit_setting_account").click(function () {
            var postData = {};
            postData.receiveNotifyEmail = $("#setting_account").find('input[name="setting_receive_notify_email"]:checked').val() == "true" ? 0 : 1;
            updateUserSetting(postData, function (loadUserSetting) {
                userSetting = loadUserSetting;
            });
        });
        // 页面显示配置，存于客户端
        var articleConfig = common_utils.getLocalConfig("article", {
            "full_screen": false,
            "full_background": false
        });
        var loginConfig = common_utils.getLocalConfig("login", {
            "remember_expires": 31104000000,
            "remember_default_check": true
        });
        var albumConfig = common_utils.getLocalConfig("album", {
            "photo_page": {
                "full_background": false,
                "default_col": {
                    "2000": 6,
                    "1800": 5,
                    "1600": 4,
                    "940": 3,
                    "720": 2
                },
                "default_size": 0,
                "default_query_size": 600,
                "video": {
                    "load_mode": "popupLoad",
                    "popup_iframe_border": true,
                    "popup_video_border": false,
                    "popup_btn_display": "inline",
                    "popup_height_scale": 0.91,
                    "popup_hide_btn": true
                },
                "blow_up": {
                    "width": 500,
                    "height": 500,
                    "scale": 1.6
                },
                "preview_compress": true
            },
            "album_page": {
                "full_background": false,
                "default_col": {
                    "2000": 4,
                    "1800": 4,
                    "1600": 4,
                    "940": 3,
                    "720": 2
                },
                "default_size": 40
            }
        });
        var settingTab = $("#settings");
        // 初始化 article配置
        if (articleConfig.full_screen) {
            settingTab.find('#setting_article_form input[name="setting_full_screen"][value="true"]').prop("checked", true);
        } else {
            settingTab.find('#setting_article_form input[name="setting_full_screen"][value="false"]').prop("checked", true);
        }
        if (articleConfig.full_background) {
            settingTab.find('#setting_article_form input[name="setting_full_background_article"][value="true"]').prop("checked", true);
        } else {
            settingTab.find('#setting_article_form input[name="setting_full_background_article"][value="false"]').prop("checked", true);
        }

        // 初始化登录配置
        settingTab.find('#setting_login_form input[name="setting_remember_expires"]').val(loginConfig.remember_expires / (3600 * 1000 * 24));
        if (loginConfig.remember_default_check) {
            settingTab.find('#setting_login_form input[name="setting_remember_default_check"][value="true"]').prop("checked", true);
        } else {
            settingTab.find('#setting_login_form input[name="setting_remember_default_check"][value="false"]').prop("checked", true);
        }

        // 初始化相册photo_page配置
        if (albumConfig.photo_page.full_background) {
            settingTab.find('#setting_album_form input[name="setting_full_background_photo"][value="true"]').prop("checked", true);
        } else {
            settingTab.find('#setting_album_form input[name="setting_full_background_photo"][value="false"]').prop("checked", true);
        }
        if (albumConfig.photo_page.preview_compress) {
            settingTab.find('#setting_album_form input[name="setting_photo_preview_compress"][value="true"]').prop("checked", true);
        } else {
            settingTab.find('#setting_album_form input[name="setting_photo_preview_compress"][value="false"]').prop("checked", true);
        }
        settingTab.find('#setting_album_form input[name="setting_blow_up_width"]').val(albumConfig.photo_page.blow_up.width);
        settingTab.find('#setting_album_form input[name="setting_blow_up_height"]').val(albumConfig.photo_page.blow_up.height);
        settingTab.find('#setting_album_form input[name="setting_blow_up_scale"]').val(albumConfig.photo_page.blow_up.scale);
        settingTab.find('#setting_album_form input[name="setting_video_load_mode"]').each(function (i, mode) {
            if (mode.value == albumConfig.photo_page.video.load_mode) {
                $(mode).prop("checked", true);
            }
        });
        if (albumConfig.photo_page.video.popup_iframe_border) {
            settingTab.find('#setting_album_form input[name="setting_video_iframe_border"][value="true"]').prop("checked", true);
        } else {
            settingTab.find('#setting_album_form input[name="setting_video_iframe_border"][value="false"]').prop("checked", true);
        }
        if (albumConfig.photo_page.video.popup_video_border) {
            settingTab.find('#setting_album_form input[name="setting_video_video_border"][value="true"]').prop("checked", true);
        } else {
            settingTab.find('#setting_album_form input[name="setting_video_video_border"][value="false"]').prop("checked", true);
        }
        settingTab.find('#setting_album_form input[name="setting_popup_btn_display"]').each(function (i, mode) {
            if (mode.value == albumConfig.photo_page.video.popup_btn_display) {
                $(mode).prop("checked", true);
            }
        });
        if (albumConfig.photo_page.video.popup_hide_btn) {
            settingTab.find('#setting_album_form input[name="setting_popup_hide_btn"][value="true"]').prop("checked", true);
        } else {
            settingTab.find('#setting_album_form input[name="setting_popup_hide_btn"][value="false"]').prop("checked", true);
        }
        settingTab.find('#setting_album_form input[name="setting_video_height_scale"]').val(albumConfig.photo_page.video.popup_height_scale);
        settingTab.find('#setting_album_form input[name="setting_default_col_photo_2000"]').val(albumConfig.photo_page.default_col["2000"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_photo_1800"]').val(albumConfig.photo_page.default_col["1800"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_photo_1600"]').val(albumConfig.photo_page.default_col["1600"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_photo_940"]').val(albumConfig.photo_page.default_col["940"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_photo_720"]').val(albumConfig.photo_page.default_col["720"]);
        settingTab.find('#setting_album_form input[name="setting_default_size_photo"]').val(albumConfig.photo_page.default_size);
        settingTab.find('#setting_album_form input[name="setting_default_query_size"]').val(albumConfig.photo_page.default_query_size);

        // 初始化相册album_page配置
        if (albumConfig.album_page.full_background) {
            settingTab.find('#setting_album_form input[name="setting_full_background_album"][value="true"]').prop("checked", true);
        } else {
            settingTab.find('#setting_album_form input[name="setting_full_background_album"][value="false"]').prop("checked", true);
        }
        settingTab.find('#setting_album_form input[name="setting_default_col_album_2000"]').val(albumConfig.album_page.default_col["2000"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_album_1800"]').val(albumConfig.album_page.default_col["1800"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_album_1600"]').val(albumConfig.album_page.default_col["1600"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_album_940"]').val(albumConfig.album_page.default_col["940"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_album_720"]').val(albumConfig.album_page.default_col["720"]);
        settingTab.find('#setting_album_form input[name="setting_default_size_album"]').val(albumConfig.album_page.default_size);

        // 点击保存事件
        settingTab.find("#submit_setting_article").click(function () {
            var config = {};
            config.full_screen = settingTab.find('#setting_article_form input[name="setting_full_screen"]:checked').val() == "true" ? true : false;
            config.full_background = settingTab.find('#setting_article_form input[name="setting_full_background_article"]:checked').val() == "true" ? true : false;
            common_utils.setLocalConfig("article", config);
            toastr.success("文章配置保存成功！", "", {"progressBar": false});
        });
        settingTab.find("#submit_setting_login").click(function () {
            var config = {};
            var days = settingTab.find('#setting_login_form input[name="setting_remember_expires"]').val();
            if (days == "") {
                toastr.error("请输入值！", "错误", {"progressBar": false});
                return;
            }
            if (isNaN(days)) {
                toastr.error("请输入数字！", "错误", {"progressBar": false});
                return;
            }
            if (days <= 0) {
                toastr.error("请输入大于0的数字！单位为天", "错误", {"progressBar": false});
                return;
            }
            config.remember_expires = days * (3600 * 1000 * 24);
            config.remember_default_check = settingTab.find('#setting_login_form input[name="setting_remember_default_check"]:checked').val() == "true" ? true : false;
            common_utils.setLocalConfig("login", config);
            toastr.success("登录配置保存成功！", "", {"progressBar": false});
        });
        settingTab.find("#submit_setting_album").click(function () {
            var config = {};
            // photo_page
            config.photo_page = {};
            config.photo_page.full_background = settingTab.find('#setting_album_form input[name="setting_full_background_photo"]:checked').val() == "true" ? true : false;
            config.photo_page.preview_compress = settingTab.find('#setting_album_form input[name="setting_photo_preview_compress"]:checked').val() == "true" ? true : false;
            config.photo_page.video = {};
            config.photo_page.video.load_mode = settingTab.find('#setting_album_form input[name="setting_video_load_mode"]:checked').val();
            config.photo_page.video.popup_iframe_border = settingTab.find('#setting_album_form input[name="setting_video_iframe_border"]:checked').val() == "true" ? true : false;
            config.photo_page.video.popup_video_border = settingTab.find('#setting_album_form input[name="setting_video_video_border"]:checked').val() == "true" ? true : false;
            config.photo_page.video.popup_btn_display = settingTab.find('#setting_album_form input[name="setting_popup_btn_display"]:checked').val();
            config.photo_page.video.popup_hide_btn = settingTab.find('#setting_album_form input[name="setting_popup_hide_btn"]:checked').val() == "true" ? true : false;
            var height_scale = settingTab.find('#setting_album_form input[name="setting_video_height_scale"]').val();
            if (height_scale == "" || isNaN(height_scale) || height_scale <= 0 || height_scale > 1) {
                toastr.error("宽度比例应在0.0到1.0之间！", "错误", {"progressBar": false});
                return;
            }
            config.photo_page.video.popup_height_scale = parseFloat(height_scale);
            var blow_up_width = settingTab.find('#setting_album_form input[name="setting_blow_up_width"]').val();
            var blow_up_height = settingTab.find('#setting_album_form input[name="setting_blow_up_height"]').val();
            var blow_up_scale = settingTab.find('#setting_album_form input[name="setting_blow_up_scale"]').val();
            if (blow_up_width == "" || isNaN(blow_up_width) || blow_up_width <= 0) {
                toastr.error("放大镜宽度请输入大于0的数字！", "错误", {"progressBar": false});
                return;
            }
            if (blow_up_height == "" || isNaN(blow_up_height) || blow_up_height <= 0) {
                toastr.error("放大镜高度请输入大于0的数字！", "错误", {"progressBar": false});
                return;
            }
            if (blow_up_scale == "" || isNaN(blow_up_scale) || blow_up_scale <= 0) {
                toastr.error("放大镜倍率请输入大于0的数字！", "错误", {"progressBar": false});
                return;
            }
            config.photo_page.blow_up = {};
            config.photo_page.blow_up.width = parseInt(blow_up_width);
            config.photo_page.blow_up.height = parseInt(blow_up_height);
            config.photo_page.blow_up.scale = parseFloat(blow_up_scale);
            config.photo_page.default_col = {};
            config.photo_page.default_col["2000"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_photo_2000"]').val());
            config.photo_page.default_col["1800"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_photo_1800"]').val());
            config.photo_page.default_col["1600"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_photo_1600"]').val());
            config.photo_page.default_col["940"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_photo_940"]').val());
            config.photo_page.default_col["720"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_photo_720"]').val());
            config.photo_page.default_size = parseInt(settingTab.find('#setting_album_form input[name="setting_default_size_photo"]').val());
            config.photo_page.default_query_size = parseInt(settingTab.find('#setting_album_form input[name="setting_default_query_size"]').val());
            // album_page
            config.album_page = {};
            config.album_page.full_background = settingTab.find('#setting_album_form input[name="setting_full_background_album"]:checked').val() == "true" ? true : false;
            config.album_page.default_col = {};
            config.album_page.default_col["2000"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_album_2000"]').val());
            config.album_page.default_col["1800"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_album_1800"]').val());
            config.album_page.default_col["1600"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_album_1600"]').val());
            config.album_page.default_col["940"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_album_940"]').val());
            config.album_page.default_col["720"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_album_720"]').val());
            config.album_page.default_size = parseInt(settingTab.find('#setting_album_form input[name="setting_default_size_album"]').val());
            common_utils.setLocalConfig("album", config);
            toastr.success("相册配置保存成功！", "", {"progressBar": false});
        });
    }

    /**************** msg end ******************/

    domReady(function () {
        var callAfterLoad = null;
        var url = common_utils.parseURL(window.location.href);
        var params = url.params;
        var action = params['action'];
        if (action == "sendLetter") {
            var chatuid = params['chatuid'];
            if (chatuid != undefined && chatuid.length > 0) {
                $('a[href="#messages"]').tab('show');
                callAfterLoad = function () {
                    showChatModal(chatuid);
                };
            } else {
                $('a[href="#messages"]').tab('show');
            }
        } else if (action !== undefined && action.length > 0) {
            $('a[href="#' + action + '"]').tab('show');
        } else if (url.hash != "" && url.hash != undefined) {
            var isTab = false;
            $.each(["profile", "account", "friends", "follows", "fans", "collections", "messages", "settings"], function (i, value) {
                if (url.hash == value)
                    isTab = true;
            });
            if (isTab) {
                $("#main_tab_ul").find('a[href="#' + url.hash + '"]').tab('show');
            }
        }

        var hostUserName = document.title.substring(0, document.title.indexOf(" "));
        $('#main_tab_ul a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            // e.target // newly activated tab
            // e.relatedTarget // previous active tab
            // if ( !(action !== undefined && action.length > 0)) {
            history.replaceState(
                null,
                hostUserName + "_" + e.target.innerText + " - ImCoder's 博客",
                location.pathname + "?method=profilecenter&action=" + $(e.target).attr('href').substring(1));
            document.title = hostUserName + "_" + e.target.innerText + " - ImCoder's 博客";
            //    document.location.href = $(e.target).attr('href');
            //    //document.body.scrollTop = document.documentElement.scrollTop = 0;
            //    scrollTo(0,0);
            // }
        });

        load_profile();

        load_follows($uid);
        load_fans($uid);
        load_friends();

        load_collection();

        initProfileForm();

        initMsgForm(callAfterLoad);

        initAccountForm();

        init_setting();
    });

});