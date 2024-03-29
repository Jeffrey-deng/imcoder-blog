(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'cityselect', 'birthday', 'globals', 'common_utils', 'login_handle', 'cropper', 'websocket_util'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, null, null, globals, common_utils, login_handle, null, websocket_util);
    }
})(function ($, bootstrap, domReady, toastr, cityselect, birthday, globals, common_utils, login_handle, cropper, websocket_util) {

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
    var cloudPath = $('#cloudPath').attr('href') || basePath;
    var profile = null;

    function initProfileTab(hostUserId) {
        load_profile(hostUserId, function (user) {
            assignToProfileForm(user);
        });
        $.ms_DatePicker({
            YearSelector: "#birthday_group .sel_year",
            MonthSelector: "#birthday_group .sel_month",
            DaySelector: "#birthday_group .sel_day"
        });
        $('#submit_profile').click(function () {
            var profileForm = $('#profile_form');
            var addressGroup = $('#address_group');
            var birthdayGroup = $('#birthday_group');
            var profileInfo = getFormJson(profileForm[0]);
            profileInfo.address = addressGroup.find('.prov').val() + '/' + addressGroup.find('.city').val() + '/' + addressGroup.find('.dist').val();
            profileInfo.birthday = birthdayGroup.find('.sel_year').val() + '/' + birthdayGroup.find('.sel_month').val() + '/' + birthdayGroup.find('.sel_day').val();
            profileInfo.uid = $('#user-long-id').text();
            update_profile(profileInfo);
        });
        $('#reset_profile').click(function () {
            load_profile(hostUserId, function (user) {
                assignToProfileForm(user);
            });
        });
        initCropHeadPhoto();
    }

    function assignToProfileForm(user) {
        var $profileForm = $('#profile_form');
        $('#user-long-id').text(user.uid);
        $('#user-short-id').text(common_utils.convertRadix10to62(user.uid));
        $profileForm.find('input[name="nickname"]').val(user.nickname);
        $profileForm.find('input[name="description"]').val(user.description);
        $profileForm.find('input[name="qq"]').val(user.qq);
        $profileForm.find('input[name="weibo"]').val(user.weibo);
        $profileForm.find('input[name="site"]').val(user.site);
        $profileForm.find('input[name="phone"]').val(user.phone);
        $profileForm.find('textarea[name="description"]').html(user.description);
        $profileForm.find('textarea[name="says"]').html(user.says);
        $profileForm.find("input:radio[name='sex']").each(function () {
            if ($(this).val() == user.sex) {
                $(this).prop('checked', true);
            }
        });
        if (user.birthday) {
            var birthSplit = user.birthday.split('/');
            $profileForm.find('.sel_year').val(birthSplit[0]);
            $profileForm.find('.sel_month').val(birthSplit[1]);
            $profileForm.find('.sel_day').val(birthSplit[2]);
        }
        if (user.address) {
            var addrSplit = user.address.split('/');
            $('#address_group').citySelect({
                prov: addrSplit[0],
                city: addrSplit[1],
                dist: addrSplit[2],
                nodata: "none"
            });
        } else {
            $('#address_group').citySelect({prov: "湖南", city: "长沙", dist: "岳麓区", nodata: "none"});
        }
        $('#login_ip').html(user.userStatus.last_login_ip);
        $('#register_time').text(user.userStatus.register_time);
        getIpLocation(user.userStatus.last_login_ip);
    }

    function load_profile(hostUserId, call) {
        $.ajax({
            url: globals.api.getUser,
            data: {
                'uid': hostUserId
            },
            success: function (response) {
                if (response.status == 200) {
                    profile = response.data.user;
                    call && call(profile);
                } else {
                    toastr.error(response.message, '加载用户信息失败~');
                }
            },
            error: function () {
                console.log('拉取个人资料失败');
            }
        });
    }

    function update_profile(profile) {
        $.ajax({
            url: globals.api.updateUserProfile,
            type: "POST",
            data: profile,
            success: function (response) {
                if (response.status == 200) {
                    profile = response.data.user;
                    toastr.success('更新成功~');
                } else {
                    toastr.error(response.message, '更新失败~');
                    console.warn('Error Code: ' + response.status);
                }
            },
            error: function () {
                toastr.error('更新失败~');
            }
        });
    }

    function getIpLocation(ip) {
        // getIpLocationByTaoBao(ip); https页面不能使用淘宝接口，换成后台Java获取
        $.get(globals.api.getIpLocation, {"ip": ip}, function (response) {
            if (response.status == 200 && response.data.location) {
                $('#login_ip').html(ip + ' , ' + response.data.location);
            } else {
                $('#login_ip').html(ip);
            }
        });
    }

    function getIpLocationByTaoBao(ip) {
        $.get('http://ip.taobao.com/service/getIpInfo.php', {"ip": ip}, function (json) {
            if (json && json.code == 0 && json.data) {
                var data = json.data;
                var location = generateIpLocation(data.country, data.region, data.city, data.isp);
                $('#login_ip').html(ip + ' , ' + location);
            } else {
                $('#login_ip').html(ip);
            }
        }).fail(function () {
            console.warn('淘宝ip接口获取ip失败');
            $('#login_ip').html(ip);
        });
    }

    var municipality = ["北京", "天津", "上海", "重庆"];
    var autonomous = ["内蒙古", "广西", "宁夏", "新疆", "西藏"];

    function generateIpLocation(country, region, city, isp) {
        var location = '';
        if (isp == '内网') {
            location = "局域网";
            return location;
        }
        location += country;
        if (country == '中国') {
            if (municipality.indexOf(region) != -1) {
                location += (region + '市');
            } else if (autonomous.indexOf(region) != -1) {
                location += (region + '自治区');
            } else {
                location += (region + '省');
            }
            if (region != city && city != 'XX') {
                location += (city + '市');
            }
            if (isp != 'XX') {
                location += isp;
            }
        } else if (country == '美国') {
            location += (region + '州');
            if (region != city && city != 'XX') {
                location += (city + '市');
            }
            if (isp != 'XX') {
                location += isp;
            }
        } else {
            if (region != country && region != 'XX') {
                location += region;
            }
            if (region != city && city != 'XX') {
                location += city;
            }
            if (isp != 'XX') {
                location += isp;
            }
        }
        return location;
    }

    var initCropHeadPhoto = function () {
        //弹出框水平垂直居中
        (window.onresize = function () {
            var win_height = $(window).height();
            var win_width = $(window).width();
            if (win_width <= 768) {
                $('.tailoring-content').css({
                    "top": (win_height - $('.tailoring-content').outerHeight()) / 2,
                    "left": 0
                });
            } else {
                $('.tailoring-content').css({
                    "top": (win_height - $('.tailoring-content').outerHeight()) / 2,
                    "left": (win_width - $('.tailoring-content').outerWidth()) / 2
                });
            }
        })();
        // 弹出图片裁剪框
        $('.profile-head-photo-upload-trigger-modal').on('click', function () {
            $('.tailoring-container').toggle();
        });
        $('#head_photo').css('cursor', 'pointer').on('click', function () {
            $('.tailoring-container').toggle();
        });
        // 关闭图片裁剪框
        $('.tailoring-container .close-tailoring').on('click', function () {
            closeTailor();
        });
        $('.tailoring-container .black-cloth').on('click', function () {
            closeTailor();
        });
        // 选择图像
        $('.tailoring-container').find('.choose-btn input').on('change', function () {
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
        $('.cropper-rotate-btn').on('click', function () {
            $('#tailoringImg').cropper('rotate', 45);
        });
        //复位
        $('.cropper-reset-btn').on('click', function () {
            $('#tailoringImg').cropper('reset');
        });
        //换向
        var flagX = true;
        $('.cropper-scaleX-btn').on('click', function () {
            if (flagX) {
                $('#tailoringImg').cropper('scaleX', -1);
                flagX = false;
            } else {
                $('#tailoringImg').cropper('scaleX', 1);
                flagX = true;
            }
            flagX != flagX;
        });
        //裁剪后的处理
        $('#sureCut').on('click', function () {
            if ($('#tailoringImg').attr('src') == null) {
                return false;
            } else {
                var notifyCropHeadPhoto = globals.notify({
                    "closeButton": false,
                    "progressBar": false,
                    "iconClass": "toast-success-no-icon",
                    "timeOut": 0
                }).success('正在截取中~', '', 'notify_crop_head_photo');
                var cas = $('#tailoringImg').cropper('getCroppedCanvas');//获取被裁剪后的canvas
                var base64url = cas.toDataURL('image/png'); //转换为base64地址形式
                notifyCropHeadPhoto.find('.toast-message').text('正在压缩中~');
                common_utils.canvasDataURL(base64url, {width: 250, quality: 1}, function (compressBase64url) {
                    globals.removeNotify('notify_crop_head_photo');
                    updateHeadPhoto(common_utils.convertBase64UrlToBlob(compressBase64url), photoRawFile, function (head_photo, head_photo_cdn_path) {
                        $('.profile-head-photo').prop('src', head_photo_cdn_path).attr('data-head-photo', head_photo_cdn_path);
                        $('#header').find('.navbar-right .site-login-user img').prop('src', staticPath + head_photo);
                        //关闭裁剪框
                        closeTailor();
                    });
                });
            }
        });
        //关闭裁剪框
        function closeTailor() {
            $('.tailoring-container').toggle();
        }

    };

    var updateHeadPhoto = function (photoBlob, photoRawFile, callback) {
        if (!photoBlob) {
            toastr.error('输入的头像数据为空~');
            return;
        }
        globals.notify({
            "progressBar": false,
            "hideDuration": 0,
            "showDuration": 0,
            "timeOut": 0,
            "closeButton": false
        }).success('正在上传头像~', '', 'notify_head_photo_uploading');
        if (typeof photoBlob != 'string') {
            var data = new FormData();
            data.append('imageFile', photoBlob);
            data.append('imageRawFile', photoRawFile);
            $.ajax({
                url: globals.api.updateUserHeadPhoto,
                data: data,
                type: "POST",
                contentType: false,
                cache: false,
                processData: false,
                global: false,
                success: function (response) {
                    globals.removeNotify('notify_head_photo_uploading');
                    if (response.status == 200) {
                        var data = response.data;
                        toastr.success('头像上传成功~');
                        callback && callback(data.head_photo, data.head_photo_cdn_path);
                    } else {
                        toastr.error(response.message, '头像上传失败');
                        console.warn('upload fail, Error Code: ' + response.status);
                    }
                },
                error: function (XHR, TS) {
                    globals.removeNotify('notify_head_photo_uploading');
                    toastr.error(TS, '头像上传失败');
                    console.warn('upload fail, Error Info: ' + TS);
                }
            });
        } else if (typeof photoBlob == 'string') {
            $.post(globals.api.updateUserHeadPhoto, {"head_photo_path": photoBlob}, function (response) {
                globals.removeNotify('notify_head_photo_uploading');
                if (response.status == 200) {
                    var data = response.data;
                    toastr.success('头像上传成功~');
                    callback && callback(data.head_photo, data.head_photo_cdn_path);
                } else {
                    toastr.error(response.message, '头像上传失败');
                    console.warn('upload fail, Error Code: ' + response.status);
                }
            }).fail(function (XHR, TS) {
                globals.removeNotify('notify_head_photo_uploading');
                toastr.error(TS, '头像上传失败');
                console.warn('upload fail, Error Info: ' + TS);
            });
        } else {
            globals.removeNotify('notify_head_photo_uploading');
        }
    };

    /**************** profile end ******************/

    /**************** account start ******************/

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
            $('#submit_account').removeAttr('disabled');
        }
    }

    //保存验证正确的的验证码
    var validateCode;

    function initAccountTab() {

        load_userAuthList(function (userAuths) {
            var username = null;
            var email = null;
            for (var i in userAuths) {
                var userAuth = userAuths[i];
                if (userAuth.identity_type == 1) {
                    username = userAuth.identifier;
                } else if (userAuth.identity_type == 2) {
                    email = userAuth.identifier;
                }
            }
            $('#account_form').find('input[name="username"]').val(username);
            $('#account_form').find('input[name="email"]').val(email);
            $('#validateMailForm').find('input[name="email"]').val(email);
            src_email = email;
            src_username = username;
        });

        $('#submit_account').attr('disabled', 'true');

        //发送验证邮件事件
        $('#sendValidateMailBtn').click(function () {
            var _self = $(this);
            sendValidateMail();
            $('#validateMailModal').modal({backdrop: 'static', keyboard: false});
            _self.attr('disabled', 'true').html('发送验证邮件（30s后可再发送）');
            var num = 30;
            var time_inter = window.setInterval(function () {
                _self.html('发送验证邮件（' + (--num) + 's后可再发送）');
            }, 1000);
            setTimeout(function () {
                window.clearInterval(time_inter);
                _self.removeAttr('disabled').html('发送验证邮件');
            }, 30 * 1000 + 10);
        });
        //检查验证码是否正确事件
        $('#validateMailBtn').click(function () {
            var code = $('#validateMailForm').find('input[name="validateCode"]').eq(0).val().replace(/(^\s*)|(\s*$)/g, '');
            if (code) {
                $.post(globals.api.checkValidateCode, {"code": code}, function (response) {
                    if (response.status == 200) {
                        toastr.success('验证成功！');
                        validateCode = code; // 保存，提交请求时再提交
                        $('#validateMailModal').modal('hide');
                        $('#account_form').find('input').removeAttr('disabled');
                        $('#submit_account').removeAttr('disabled');
                        $('#sendValidateMailBtn').hide();
                    } else {
                        validateCode = null;
                        toastr.error(response.message, response.status);
                        console.warn('Error Code: ' + response.status);
                    }
                });
            } else {
                toastr.error('请输入验证码~');
            }
        });
        //检查email
        $('#account_form').find('input[name="email"]').blur(function () {
            var span = $(this).parent().next().find('span');
            var email = $(this).val();
            if (email != null && email != '') {
                //如果还是原来的email就不检查
                if (email == src_email) {
                    span.html('');
                    mailcheck = true;
                    enableSaveAccountBtn();
                    return;
                }
                if (!globals.re.email.test(email)) {
                    span.css('color', 'red');
                    span.html('输入正确邮箱格式');
                    $('#submit_account').attr('disabled', 'true');
                    return;
                }
                //否则ajax验证
                $.post(globals.api.checkEmailIsAvailable, {"email": email}, function (response) {
                    if (response.status == 200) {
                        var data = response.data;
                        if (data.type == 0) {
                            span.css('color', '#1ab394');
                            span.html('此邮箱可用!');
                            mailcheck = true;
                        } else {
                            span.css('color', 'red');
                            span.html('此邮箱已被使用!');
                            //邮箱地址已占用且所有主不为该用户时，禁用提交按钮
                            $('#submit_account').attr('disabled', 'true');
                            mailcheck = false;
                        }
                    } else {
                        toastr.error(response.message, response.status);
                        console.warn('Error Code: ' + response.status);
                    }
                    //检查是否符合开启按钮条件
                    enableSaveAccountBtn();
                });
            } else {
                span.css('color', 'red');
                span.html('邮箱不能为空!');
                $('#submit_account').attr('disabled', 'true');
                mailcheck = false;
            }
        });

        //验证用户名
        $('#account_form').find('input[name="username"]').blur(function () {
            var span = $(this).parent().next().find('span');
            var username = $(this).val();
            if (username != null && username != '') {
                //如果还是原来的username就不检查
                if (username == src_username) {
                    span.html('');
                    usernamecheck = true;
                    enableSaveAccountBtn();
                    return;
                }
                if (/^[0-9]+$/.test(value)) {
                    span.css('color', 'red');
                    span.html('用户名不能为纯数字');
                    $('#submit_account').attr('disabled', 'true');
                    return;
                } else if (!globals.re.username.test(username)) {
                    span.css('color', 'red');
                    span.html('用户名只能包括字母、数字、横线、下划线、英文句号!且不大于20个字符');
                    $('#submit_account').attr('disabled', 'true');
                    return;
                }
                // 否则ajax验证
                $.post(globals.api.checkUsernameIsAvailable, {"username": username}, function (response) {
                    if (response.status == 200) {
                        var data = response.data;
                        if (data.type == 0) {
                            span.css('color', '#1ab394');
                            span.html('此用户名可用!');
                            usernamecheck = true;
                        } else {
                            span.css('color', 'red');
                            span.html('此用户名已被使用!');
                            //用户名已占用且所有主不为该用户时，禁用提交按钮
                            $('#submit_account').attr('disabled', 'true');
                            usernamecheck = false;
                        }
                    } else {
                        toastr.error(response.message, response.status);
                        console.warn('Error Code: ' + response.status);
                    }
                    //检查是否符合开启按钮条件
                    enableSaveAccountBtn();
                });
            } else {
                span.css('color', 'red');
                span.html('用户名不能为空!');
                $('#submit_account').attr('disabled', 'true');
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
            } else if (newpw != '' || confirmpw != '') {
                span.css('color', 'red');
                span.html('两次密码输入不相同!');
                $('#submit_account').attr('disabled', 'true');
                pwcheck = false;
            }
        });

        $('#submit_account').click(function () {
            updateAccount();
        });
    }

    // 发送验证码邮件
    function sendValidateMail() {
        globals.notify({
            "progressBar": false,
            "hideDuration": 0,
            "showDuration": 0,
            "timeOut": 0,
            "closeButton": false
        }).success('服务器正在发送邮件~', '', 'notify_validate_code_mail_sending');
        $.ajax({
            url: globals.api.sendValidateCode,
            type: "POST",
            success: function (response) {
                globals.removeNotify('notify_validate_code_mail_sending');
                if (response.status == 200) {
                    toastr.success('验证邮件发送成功！');
                } else {
                    toastr.error(response.message, '错误');
                    console.warn('Error Code: ' + response.status);
                }
            },
            error: function (XHR, TS) {
                globals.removeNotify('notify_validate_code_mail_sending');
                toastr.error(TS, '验证邮件发送失败！');
            }
        });
    }

    function load_userAuthList(call) {
        $.get(globals.api.getUserAuthList, function (response) {
            if (response.status == 200) {
                call && call(response.data.userAuths);
            } else {
                toastr.error('账户凭证信息获取失败', response.message);
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
        if (form.find('input[name="confirmpw"]').val() != '') {
            data.password = form.find('input[name="confirmpw"]').val();
        }
        $.ajax({
            url: globals.api.updateUserAccount,
            type: "POST",
            data: data,
            success: function (response) {
                if (response.status == 200) {
                    window.location.href = ('auth/login?identity_type=1&identifier=' + form.find('input[name="username"]').val()).toURL();
                } else {
                    toastr.error(response.message, '保存失败！');
                    console.warn('Error Code: ' + response.status);
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
    var fansList;
    var friendList;

    function initContactTab(query_uid, isLoadFriend) {
        load_followings(query_uid, function (followList) {
            var html = buildContactAreaHtml(followList);
            $('#followings').html(html);
        });
        load_followers(query_uid, function (fansList) {
            var html = buildContactAreaHtml(fansList);
            $('#followers').html(html);
        });
        bindContactAreaEvent($('#followings'));
        bindContactAreaEvent($('#followers'));
        if (isLoadFriend === true) {
            load_friends(function (friendList) {
                var html = buildContactAreaHtml(friendList);
                $('#friends').html(html)
            });
            bindContactAreaEvent($('#friends'));
        }
    }

    function load_followings(query_uid, call) {
        console.log('加载关注列表...');
        $.ajax({
            url: globals.api.getUserFollowings,
            data: {
                'uid': query_uid
            },
            success: function (response) {
                if (response.status == 200) {
                    followList = response.data.users;
                    if (followList != null && followList.length > 0) {
                        call && call(followList);
                    }
                    console.log('加载关注列表成功！');
                } else {
                    toastr.error(response.message, '提示');
                    console.warn('Error Code: ' + response.status);
                }
            },
            error: function () {
                toastr.warn('查询关注列表失败~');
                console.warn('加载关注列表失败~');
            }
        });
    }

    function load_followers(query_uid, call) {
        console.log('加载粉丝列表...');
        $.ajax({
            url: globals.api.getUserFollowers,
            data: {
                'uid': query_uid
            },
            success: function (response) {
                if (response.status == 200) {
                    fansList = response.data.users;
                    if (fansList != null && fansList.length > 0) {
                        call && call(fansList);
                    }
                    console.log('加载粉丝列表成功~');
                } else {
                    toastr.error(response.message, '提示');
                    console.warn('Error Code: ' + response.status);
                }
            },
            error: function () {
                toastr.warn('查询粉丝列表失败~');
                console.warn('加载粉丝列表失败~');
            }
        });
    }

    function load_friends(call) {
        console.log('加载好友列表...');
        $.ajax({
            url: globals.api.getUserFriends,
            success: function (response) {
                if (response.status == 200) {
                    friendList = response.data.users;
                    if (friendList != null && friendList.length > 0) {
                        call && call(friendList);
                    }
                    console.log('加载好友列表成功~');
                } else {
                    toastr.error(response.message, '提示');
                    console.warn('Error Code: ' + response.status);
                }
            },
            error: function () {
                toastr.warn('加载好友列表失败！');
                console.warn('加载好友列表失败！');
            }
        });
    }

    function buildContactAreaHtml(userList) {
        var html = '<div class="wrapper wrapper-content animated fadeInRight">';
        $.each(userList, function (i, user) {
            html += '<div class="col-xs-12 col-sm-6 col-md-4 col-lg-3"><div class="contact-box">';
            html += '<a class="open-user-home-page" target="_blank" href="' + ('u/' + user.uid + '/home').toURL() + '">';
            html += '<div class="col-xs-12 col-sm-4"><div class="text-center">';
            html += '<img alt="image" class="img-circle img-responsive contact-head-photo" src="' + user.head_photo + '">';
            html += '<div class="contact-group-name">' + user.userGroup.group_name + '</div></div></div>';
            html += '<div class="col-xs-12 col-sm-8 contact-info-right"><h3 class="contact-nickname">' + user.nickname + '</h3>';
            html += '<p><i class="fa fa-map-marker"></i><span class="contact-address">' + (user.address || '&nbsp;') + '</span></p>';
            html += '<p><strong class="contact-description" title="' + common_utils.encodeHTML(user.description) + '">' + (user.description || '&nbsp;') + '</strong></p>';
            html += '<p><span class="contact-user-site-label">Site:</span><span class="contact-user-site">' + (user.site || '&nbsp;') + '</span></p>';
            html += '</div><div class="clearfix"></div></a></div></div>';
        });
        html += '</div>';
        return html;
    }

    function animationHover(o, e) {
        o = $(o), o.hover(function () {
            o.addClass('animated ' + e)
        }, function () {
            window.setTimeout(function () {
                o.removeClass('animated ' + e)
            }, 2e3)
        })
    }

    function bindContactAreaEvent(contactTab) {
        contactTab
            .on('click', '.open-user-home-page', function (e) {
                var _self = $(e.target);
                if (_self.hasClass('contact-user-site')) {
                    window.open(_self.text());
                    return false;
                } else {
                    return true;
                }
            })
            .on('mouseenter', '.contact-box', function () {
                $(this).addClass('animated ' + 'pulse');
                // $(this).toggleClass('animated ' + 'pulse');
            }).on('mouseleave', '.contact-box', function () {
            var _self = $(this);
            window.setTimeout(function () {
                _self.removeClass('animated ' + 'pulse')
            }, 2e3);
        });
    }

    /**************** collect start ******************/

    function initCollectionTab() {
        load_collection(function (cletList) {
            var clet_html = buildCollectionAreaHtml(cletList);
            $('#collections').html(clet_html);
        });
        $('#collections').on({
            "click": function (e) {
                var $self = $(this);
                var a = e.target.parentNode;
                if (a && a.className && a.className.indexOf('unCollectArticle_trigger') != -1) {
                    if (confirm('你确定要取消收藏吗？')) {
                        unCollectArticle($self.attr('data-aid'), function () {
                            $self.remove();
                            toastr.success('删除收藏成功~');
                        });
                    }
                } else {
                    window.open(('a/detail/' + this.getAttribute('data-aid')).toURL());
                }
            },
            // "mouseenter": function () {
            //     $(this).addClass('animated ' + 'pulse');
            //     // $(this).toggleClass('animated ' + 'pulse');
            // },
            // "mouseleave": function () {
            //     var _self = $(this);
            //     window.setTimeout(function () {
            //         _self.removeClass('animated ' + 'pulse')
            //     }, 2e3);
            // }
        }, '.collection-box');
    }

    function buildCollectionAreaHtml(cletList) {
        var clet_html = '<br><div class="row"><div class="col-sm-12 col-sm-offset-0 col-xs-12 col-xs-offset-0"><div class="wrapper wrapper-content animated fadeInUp"><ul class="notes">';
        $.each(cletList, function (i, clet) {
            clet_html += '<li><div class="collection-box" style="height: 210px;" data-aid="' + clet.article.aid + '">' +
                '<small>' + clet.clet_time + '</small>' +
                '<h4>' + clet.article.author.nickname + '</h4>' +
                '<p>' + clet.article.title + '</p>' +
                '<a class="unCollectArticle_trigger"><i class="fa fa-trash-o "></i></a>' +
                '</div></li>';
        });
        clet_html += '</ul></div></div></div>';
        return clet_html;
    }

    function load_collection(call) {
        $.get(globals.api.getCollectedArticleList, function (response) {
            if (response.status == 200) {
                var collections = response.data.collections;
                if (collections != null && collections.length > 0) {
                    call && call(collections);
                }
                console.log('加载收藏列表成功~');
            } else {
                console.warn('Error Code: ' + response.status);
            }
        });
    }

    function unCollectArticle(aid, call) {
        // 取消收藏
        $.ajax({
            url: globals.api.uncollectArticle,
            type: "POST",
            data: {"aid": aid},
            success: function (response) {
                if (response.status == 200) {
                    call && call(response.data);
                } else {
                    toastr.error(response.message, '删除收藏失败~');
                    console.warn('Error Code: ' + response.status);
                }
            },
            error: function () {
                toastr.error('删除收藏失败~');
            }
        });
    }

    /**************** collect end ******************/

    /**************** msg start ******************/

    var unreadList = {"letters": [], "sysMsgs": []};
    var letterList = [];
    var formatLetterList = {};
    var sysMsgList = [];
    var clearSysMsgOnOpenRunOnceFlag = false;
    var removeLetterUnReadStyleTimer = null;
    var letterContentScrollBottomTimer = null;
    var site_video_regex = new RegExp('^((?:' + basePath.replace(/:(?=(?:80|443)(?=\/))\d+(?=\/)/, '') + ')?video/)(detail|embed)(/[^?]+(\\?.*)?)$'); // 匹配本站的视频链接，去掉basePath中的80/443端口
    var batch_load_letter_size = 20;
    var lazyMediaObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting || entry.intersectionRatio > 0) {
                let $lazyMediaLink = $(entry.target);
                lazyMediaObserver.unobserve($lazyMediaLink[0]);
                if (!$lazyMediaLink.hasClass('lazy-media-completed')) {
                    $lazyMediaLink.addClass('lazy-media-completed');
                    insertMediaPreviewWidget($lazyMediaLink);
                }
            }
        });
    });
    var stayBottomTimer = null;
    var stayBottomLock = false;

    function initMessageTab(callAfterLoad) {

        bindMessageDashboardEvent();

        bindChatModalEvent();

        // 加载数据
        request.loadUnreadMsgList(function(data) {
            unreadList = data;
            $('#messages').find('.folder-list li a[action="listUnreadMsg"]').trigger('click');
        });
        request.loadLetterList({"read_status": 1}, function(letters) {
            letterList = letters;
            formatLetterList = formatLetter(letterList);
            $('#letterCount').html(letterList.length);
            $('#msgBoxSize').html(letterList.length);
            buildChatUserListHtml();
            callAfterLoad && callAfterLoad();
        });
        request.loadSysMsg({"read_status": 1}, function(sysMsgs) {
            sysMsgList = sysMsgs;
            $('#sysMsgCount').html(sysMsgList.length);
        });

        // 注册监控服务器的未读消息推送
        initWsReceiveServerPush();
    }

    // 消息仪表盘的各种事件
    function bindMessageDashboardEvent() {
        // 消息类型侧边栏点击事件
        $('#messages').find('.folder-list').on('click', 'a[action]', function () {
            var $self = $(this), action = $self.attr('action'), setHash = false;
            // 变色
            $self.parent().css('background-color', '#eee').toggleClass('active-li', true)
                .siblings().css('background-color', "").toggleClass('active-li', false);
            switch (action) {
                case "listUnreadMsg":  // 未读消息
                    if (clearSysMsgOnOpenRunOnceFlag) {
                        var smIds = [];
                        $.each(unreadList.sysMsgs, function (i, sysMsg) {
                            if (sysMsg.status == 0) {
                                smIds.push(sysMsg.smid);
                            }
                        });
                        request.clearSysMsgListStatus(smIds, function () {
                            $.each(sysMsgList, function (i, sysMsg) {
                                if (smIds.indexOf(sysMsg.smid) != -1) {
                                    sysMsg.status = 1;
                                }
                            });
                            console.log('已清除未读的系统消息');
                        });
                        clearSysMsgOnOpenRunOnceFlag = false;
                    }
                    let count = buildUnreadListAreaHtml(unreadList);
                    $('#unReadMsgCount').html(count);
                    $('#batchClearMessageStatusBtn').show();
                    break;
                case "listLetters":    // 私信消息
                    $('#batchClearMessageStatusBtn').hide();
                    buildLetterListAreaHtml(letterList);
                    $('#letterCount').html(letterList.length);
                    $('#msgBoxSize').html(letterList.length);
                    break;
                case "listSysMsgs":    // 系统消息
                    $('#batchClearMessageStatusBtn').hide();
                    buildSysMsgListAreaHtml(sysMsgList);
                    break;
                default:
                    return true;
            }
            if (setHash) {
                document.location.hash = action;
            }
            return false;
        });
        var $messageDashboardMain = $('#messageDashboardMain');
        // 打开该条的私信对应用户的聊天弹窗
        $messageDashboardMain.on('click', '.trigger-show-chat-modal', function () {
            showChatModal(this.getAttribute('data-uid'));
        });
        // 选择该行消息
        $messageDashboardMain.on('click', '.check-mail', function (e) {
            if (e.target.tagName.toLowerCase() == 'td') {
                var checkBox = $(this).find('input');
                if (checkBox.prop('checked')) {
                    checkBox.prop('checked', false);
                } else {
                    checkBox.prop('checked', true);
                }
            }
        });
        // 标记消息为已读按钮
        $('#batchClearMessageStatusBtn').on('click', function () {
            // 系统消息
            var smIds = [];
            $messageDashboardMain.find('.unread-msg.sys-msg-li .check-mail input:checked').each(function (i, checkbox) {
                smIds.push(parseInt(checkbox.parentNode.parentNode.getAttribute('data-smid')));
            });
            request.clearSysMsgListStatus(smIds, function () {
                unreadList.sysMsgs = unreadList.sysMsgs.filter(function (sysMsg) {
                    return smIds.indexOf(sysMsg.smid) == -1;
                });
                $('#messages').find('.folder-list li a[action="listUnreadMsg"]').trigger('click');
                toastr.success('清除未读系统消息成功！');
                $.each(sysMsgList, function (i, sysMsg) {
                    if (smIds.indexOf(sysMsg.smid) !== -1) {
                        sysMsg.status = 1;
                    }
                });
            });
            // 私信消息
            var userIds = [];
            $messageDashboardMain.find('.unread-msg.letter-li .check-mail input:checked').each(function (i, checkbox) {
                userIds.push(checkbox.parentNode.parentNode.getAttribute('data-uid'));
            });
            $.Deferred(function (dfd) {
                var leIds = [], postLeIds = [];
                $.each(userIds, function (i, uid) {
                    var userLetters = formatLetterList[uid];
                    if (userLetters) {
                        $.each(userLetters, function (i, letter) {
                            if (letter.r_uid == $uid) { // 只能清除自己接收的
                                if (letter.status == 0) {   // 提交时只提交未读的
                                    postLeIds.push(letter.leid);
                                }
                                leIds.push(letter.leid);    // 回调时未读已读一起返回
                            }
                        });
                    }
                });
                if (postLeIds.length === 0) {
                    dfd.resolve(leIds);
                    return;
                }
                request.clearLetterListStatus(postLeIds, true).final(function () {
                    dfd.resolve(leIds);
                }, function (status, message, type) {
                    type === -1 && dfd.resolve(leIds);
                });
            }).done(function (leIds) {
                if (leIds.length > 0) {
                    unreadList.letters = unreadList.letters.filter(function (letter) {
                        return leIds.indexOf(letter.leid) == -1;
                    });
                    $.each(letterList, function (i, letter) {
                        if (letter.r_uid == $uid && leIds.indexOf(letter.leid) != -1) {
                            letter.status = 1;
                        }
                    });
                    $('#messages').find('.folder-list li a[action="listUnreadMsg"]').trigger('click');
                    toastr.success('标记私信消息为已读成功！');
                }
            });

            if (smIds.length == 0 && userIds.length == 0) {
                toastr.error('还没有选择，你点什么');
            }
        });
        // 删除系统消息按钮
        $('#batchDeleteMessageBtn').on('click', function () {
                // 系统消息
                var smIds = [];
                $messageDashboardMain.find('.sys-msg-li .check-mail input:checked').each(function (i, checkbox) {
                    smIds.push(parseInt(checkbox.parentNode.parentNode.getAttribute('data-smid')));
                });
                if (smIds.length > 0) {
                    if (window.confirm('确定删除' + smIds.length + '条系统消息吗？')) {
                        request.deleteSysMsgList(smIds, function () {
                            unreadList.sysMsgs = unreadList.sysMsgs.filter(function (sysMsg) {
                                return smIds.indexOf(sysMsg.smid) === -1;
                            });
                            sysMsgList = sysMsgList.filter(function (sysMsg) {
                                return smIds.indexOf(sysMsg.smid) === -1;
                            });
                            $('#messages').find('.folder-list li.active-li a').trigger('click');
                        });
                    }
                } else {
                    toastr.error('（删除私信请到聊天弹窗~）', '请先选择要删除的消息~');
                }
            }
        );
        // 刷新消息列表按钮
        $('#refreshMessageListBtn').on('click', function () {
            globals.notify({
                "closeButton": false,
                "progressBar": false,
                "iconClass": "toast-success-no-icon",
                "timeOut": 0
            }).success('正在拉取数据中~', '', 'notify_refresh_message_list');
            var activeLiName = $('#messages').find('.folder-list li.active-li a').attr('action') || 'listUnreadMsg';
            request.loadUnreadMsgList(function(data) {
                unreadList = data;
                if (activeLiName == 'listUnreadMsg') {
                    globals.removeNotify('notify_refresh_message_list');
                    toastr.success('刷新消息列表成功~');
                    $('#messages').find('.folder-list li a[action="listUnreadMsg"]').trigger('click');
                }
            });
            request.loadLetterList({"read_status": 1}, function(letters) {
                letterList = letters;
                if (activeLiName == 'listLetters') {
                    globals.removeNotify('notify_refresh_message_list');
                    toastr.success('刷新消息列表成功~');
                    $('#messages').find('.folder-list li a[action="listLetters"]').trigger('click');
                } else {
                    formatLetterList = formatLetter(letterList);
                    $('#letterCount').html(letterList.length);
                    $('#msgBoxSize').html(letterList.length);
                }
                buildChatUserListHtml();
                getChatUserLetterUserCard(getCurrentLetterChatUid()).trigger('click');
            });
            request.loadSysMsg({"read_status": 1}, function(sysMsgs) {
                sysMsgList = sysMsgs;
                if (activeLiName == 'listSysMsgs') {
                    globals.removeNotify('notify_refresh_message_list');
                    toastr.success('刷新消息列表成功~');
                    $('#messages').find('.folder-list li a[action="listSysMsgs"]').trigger('click');
                } else {
                    $('#sysMsgCount').html(sysMsgList.length);
                }
            });
        });
    }

    // 私信聊天弹窗的事件
    function bindChatModalEvent() {
        // 打开聊天框
        $('#openChatModal').click(function () {
            showChatModal(null);
        });
        var modalSizeEvent = function() {
            // 聊天框居中
            if (navigator.device.pc()) {
                $('#chat_Modal').find('.modal-dialog').css({
                    "margin-top": $(window).height() / 2 - (835 / 2)
                });
                $('#messageInsertImageModal').find('.modal-dialog').css({
                    "margin-top": $(window).height() / 2 - (520 / 2)
                });
                $('#letter_userList').children().first().css({
                    'visibility': '',
                    'height': ''
                });
            } else {
                $('#chat_Modal').find('.modal-dialog').css({
                    "margin-top": ''
                });
                $('#messageInsertImageModal').find('.modal-dialog').css({
                    "margin-top": ''
                });
                $('#letter_userList').children().first().css({
                    'visibility': 'hidden',
                    'height': '20px'
                });
            }
        };
        modalSizeEvent();
        $(window).resize(modalSizeEvent);

        $('#chat_Modal').on('shown.bs.modal', function () {
            // 聊天内容滚动到底部
            // [0]是从jquery中取得原js对象
            $('#currentLetterContent')[0].scrollTop = $('#currentLetterContent')[0].scrollHeight + 2000;
            // $('#currentLetterContent .chat-discussion-end')[0].scrollIntoView(true);
            // $('#currentLetterContent')[0].scrollTop = 0;

            // 用户列表也滚动到可视区域
            let $userCard = getChatUserLetterUserCard(getCurrentLetterChatUid());
            if ($userCard.length > 0 && ('scrollIntoView' in $userCard[0] || 'scrollIntoViewIfNeeded' in $userCard[0])) {
                if ('scrollIntoViewIfNeeded' in $userCard[0]) {
                    $userCard[0].scrollIntoViewIfNeeded();
                } else {
                    $userCard[0].scrollIntoView({block: 'center'});
                }
            }
            $('#sendLetter_area').focus();
        });
        $('#chat_Modal').on('hidden.bs.modal', function () {
            // 修改地址栏, 去除chatuid
            history.replaceState({"mark": "page"}, document.title, common_utils.removeParamForURL('chatuid').replace('/center/sendLetter', '/center/messages'));
        });
        // 用户列表事件
        $('#letter_userList')
            .on('click', '.trigger-show-chat-user-letter-list', function () {
                var $self = $(this);
                var uid = $self.attr('data-uid');
                buildChatUserLetterListHtml(uid); // 组装当前用户消息列表
                getChatUserLetterUserCard(uid).toggleClass('active', true).siblings('.chat-user').toggleClass('active', false);   // 变色
                // 修改地址栏, 添加chatuid
                history.replaceState({"mark": "chat"}, document.title, common_utils.setParamForURL('chatuid', uid).replace('/center/messages', '/center/sendLetter'));
                // 某位用户的消息点击了就将他的消息全置为已读
                if (!$self.hasClass('has-read-user')) {
                    $.Deferred(function (dfd) {
                        var leIds = [], postLeIds = [];
                        var userLetters = formatLetterList[uid];
                        if (userLetters) {
                            $.each(userLetters, function (i, letter) {
                                if (letter.r_uid == $uid) { // 只能清除自己接收的
                                    if (letter.status == 0) {   // 提交时只提交未读的
                                        postLeIds.push(letter.leid);
                                    }
                                    leIds.push(letter.leid);    // 回调时未读已读一起返回
                                }
                            });
                        }
                        if (postLeIds.length === 0) {
                            dfd.resolve(leIds);
                            return;
                        }
                        request.clearLetterListStatus(postLeIds, true).final(function () {
                            dfd.resolve(leIds);
                        }, function (status, message, type) {
                            type === -1 && dfd.resolve(leIds);
                        });
                    }).done(function (leIds) {
                        if (leIds.length > 0) {
                            $.each(unreadList.letters, function (i, letter) {
                                if (leIds.indexOf(letter.leid) != -1) {
                                    letter.status = 1;
                                }
                            });
                            $.each(letterList, function (i, letter) {
                                if (letter.r_uid == $uid && leIds.indexOf(letter.leid) != -1) {
                                    letter.status = 1;
                                }
                            });
                            console.log('已将来自用户 ' + uid + ' 的消息标记为已读');
                        }
                        $self.toggleClass('has-read-user', true);
                    });
                }
            })
            .on('keydown', '.input-append-new-user-to-chat', function (e) {  // 添加新聊天用户
                var theEvent = e || window.event;
                var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
                if (code == 13) { // keyCode=13是回车键
                    var chatUid = $(this).val().trim();
                    if (!/^[0-9A-Za-z]+$/.test(chatUid)) {
                        toastr.error('用户id格式不对');
                    } else {
                        showChatModal(chatUid);
                        $(this).val('');
                    }
                    // 防止触发表单提交 返回false
                    //  e.preventDefault();
                    return false;
                }
            })
            .on('click', '.chat-user .chat-user-name a', function (e) {
                e.preventDefault();
            });
        // 消息内容区事件
        $('#currentLetterContent')
            .on('mousewheel touchend', function (e) { // 滚动到顶部时懒惰加载更多私信
                let $currentLetterContent = $(e.currentTarget), isCloseTop = false;
                isCloseTop = e.currentTarget.scrollTop <= 30;
                // isCloseTop = e.currentTarget.scrollHeight - (e.currentTarget.scrollTop * -1 + e.currentTarget.clientHeight) <= 30;
                if (isCloseTop && !$currentLetterContent.hasClass('lazy-letter-loading')) {
                    $currentLetterContent.addClass('lazy-letter-loading');
                    let chatUid = getCurrentLetterChatUid();
                    if (chatUid) {
                        $currentLetterContent.toggleClass('lazy-letter-load-completed', false);
                        let letterList = formatLetterList[chatUid] || [],
                            earliest_index = parseInt($currentLetterContent.attr('data-earliest-index') || -1),
                            buildResp;
                        buildResp = buildBatchLetterHtml(letterList, earliest_index + 1, batch_load_letter_size, profile);
                        if (buildResp.size > 0) {
                            let $lastLetter = $currentLetterContent.children('.chat-message');
                            $currentLetterContent.prepend(buildResp.html);
                            // $currentLetterContent.append(buildResp.html);
                            // {block: 'center'}
                            $lastLetter[0].scrollIntoView();
                            // $lastLetter.last()[0].scrollIntoView(); // 防止滑到顶部不触发事件，这个代码至关重要，而且滑动时不会断层显示
                            $currentLetterContent.attr('data-earliest-index', buildResp.end);
                            $currentLetterContent.find('.chat-message .message-content .lazy-media-link:not(.lazy-media-completed)').each(function (i, linkNode) {
                                lazyMediaObserver.observe(linkNode);
                            });
                            if (buildResp.end == letterList.length - 1) {
                                $currentLetterContent.toggleClass('lazy-letter-load-completed', true);
                            }
                        } else {
                            $currentLetterContent.toggleClass('lazy-letter-load-completed', true);
                        }
                    }
                    $currentLetterContent.removeClass('lazy-letter-loading');
                }
            })
            .on('mousewheel touchstart', function(e) {
                if (e.originalEvent && stayBottomTimer) {
                    clearInterval(stayBottomTimer);
                    stayBottomTimer = null;
                }
                stayBottomLock = false;
            })
            .on('click', '.message-del', function () {    // 消息删除按钮
                if (window.confirm('你确定要删除这条私信吗？')) {
                    let letterNode = this.parentNode.parentNode;
                    let leid = letterNode.getAttribute('data-leid');
                    let ismy = letterNode.getAttribute('data-s-uid') == $uid;
                    request.deleteLetter(leid, function () {
                        ismy === undefined && (ismy = true);
                        deleteLetterInLocal(leid) && toastr.success(ismy ? '已删除并撤回你的消息~' : '已删除对方消息');
                    });
                }
            })
            // .on({ // 删除按钮hover效果
            //     "mouseenter": function () {
            //         $(this).find('.message-del').css('visibility', 'visible');
            //     },
            //     "mouseleave": function () {
            //         $(this).find('.message-del').css('visibility', 'hidden');
            //     }
            // }, '.chat-message')
            .on('click', '.message-content .image-widget.protect', function () {
                let $widget = $(this), $img = $widget.find('img');
                if ($widget.closest('a').length === 0 && !$widget.hasClass('protect') && !$img.hasClass('forbidden-download')) {
                    window.open($img.attr('src'));
                }
            })
            .on('click', '.message-content img', function () {
                let $img = $(this);
                if ($img.closest('a').length === 0 && !$img.hasClass('forbidden-download')) {
                    window.open($img.attr('src'));
                }
            })
            .on('contextmenu', '.message-content img.forbidden-download, .message-content .image-widget.protect', function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            })
            .on('dragstart', '.message-content img.forbidden-download, .message-content .image-widget.protect', function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            });
        // 提交消息
        $('#sendLetter_submit').on('click', function () {
            var $self = $(this),
                content = $('#sendLetter_area').val(),
                r_uid = getCurrentLetterChatUid();
            $self.attr('disabled', 'disabled');
            request.sendLetter({
                'content': content,
                'r_uid': r_uid
            }, true).final(function (saveLetter) {
                letterList.unshift(saveLetter); // 追加到放入缓存中
                if (!formatLetterList[r_uid]) {
                    formatLetterList[r_uid] = [];
                }
                // 从头部插入
                formatLetterList[r_uid].unshift(saveLetter);
                appendNewLetter(saveLetter); // 追加显示新的消息
                $('#sendLetter_area').val('');
                toastr.success('发送消息成功！');
            }).always(function () {
                $self.removeAttr('disabled');
            });
        });
        $('#sendLetter_area').on('pasteImage', function (e, files) { // 粘贴图片
            let $modal = $('#messageInsertImageModal');
            $modal.data('images', files);
            $modal.find('.modal-title').text(`已选择 ${files.length} 张图片`);
            $modal.find('.group-message-image-file,.group-message-image-url').hide();
            $modal.modal();
        }).on('pasteExcel', function (e, txt, clearHtml, html, rtf, file) { // 粘贴excel
            this.insertText(clearHtml);
            return false;
        }).on('dropImage', function (e, files) { // 拖拽图片
            let $modal = $('#messageInsertImageModal');
            $modal.data('images', files);
            $modal.find('.modal-title').text(`已选择 ${files.length} 张图片`);
            $modal.find('.group-message-image-file,.group-message-image-url').hide();
            $modal.modal();
        }).on('keydown', function (e) { // 发送快捷键（ctrl + center）
            var theEvent = e || window.event;
            var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
            if (13 == code && theEvent.ctrlKey) {
                $('#sendLetter_submit').trigger('click');
            }
        });

        // 评论贴图按钮
        $('#openInsertImageModalTrigger').on('click', function () {
            let $modal = $('#messageInsertImageModal');
            $modal.removeData('images');
            $modal.find('.modal-title').text('插入图片');
            $modal.find('.group-message-image-file,.group-message-image-url').show();
            $modal.modal();
            return false;
        });

        // 提交贴图按钮
        $('#messageInsertImageModal').on('click', '.message-image-btn-insert-submit', function () {
            let $modal = $('#messageInsertImageModal'),
                imageFiles = $modal.data('images') || $modal.find('.message-image-input-file')[0].files,
                imageUrl = $modal.find('.message-image-input-url').val(),
                imageForbiddenDownload = $modal.find('.message-image-check-forbidden-download').prop('checked');
            if ((!imageFiles || imageFiles.length == 0) && !imageUrl) {
                toastr.error('请选择图片或输入图片地址~');
                return;
            }
            let isUploadFile = imageFiles && imageFiles.length > 0,
                insertCall = function (imageHtml) {
                    let $editor = $('#sendLetter_area');
                    // let content = editor.val();
                    // if (!content || /[\s\S]*\n$/.test(content)) {
                    //     $editor.val(content + imageHtml);
                    // } else {
                    //     $editor.val(content + '\n' + imageHtml);
                    // }
                    $editor[0].insertText(imageHtml);
                    $modal.modal('hide');
                    $modal.find('.message-image-input-file').val('');
                    $modal.find('.message-image-input-url').val('');
                    $editor.focus();
                },
                wrapperWidget = function (imageHtml, imageForbiddenDownload) {
                    return `<div class="image-widget${imageForbiddenDownload ? ' protect' : ''}">${imageHtml}</div>`;
                },
                imageClassNames = 'message-insert-image not-only-img' + (imageForbiddenDownload ? ' forbidden-download' : '');
            if (isUploadFile) {
                common_utils.postImage(imageFiles, imageClassNames, function (imageHtml, imageArr, isAllSuccess) {
                    if (isAllSuccess) {
                        toastr.success('已插入' + imageArr.length + '张图片~');
                    }
                    insertCall(wrapperWidget(imageHtml, imageForbiddenDownload));
                });
            } else {
                let relativePath = null, imageHtml = null;
                if (imageUrl.indexOf(cloudPath) == 0 && imageUrl.length > cloudPath.length) {
                    relativePath = imageUrl.substring(cloudPath.length).replace(/\?.*$/, '');
                    globals.request.get(globals.api.getPhotoList, {"path": relativePath}, false).always(function () {
                        let response = this;
                        if (response.status == 200 && response.data.photos && response.data.photos.length > 0) {
                            let photo = response.data.photos[0];
                            imageHtml = '<img class="' + imageClassNames + '" src="' + imageUrl + '"' +
                                ' data-photo-id="' + photo.photo_id + '" data-raw-width="' + photo.width + '" data-raw-height="' + photo.height + '" data-relative-path="' + relativePath + '">\n';
                        } else {
                            imageHtml = '<img class="' + imageClassNames + '" src="' + imageUrl + '"' + (relativePath ? (' data-relative-path="' + relativePath + '"') : '') + '>\n';
                        }
                        toastr.success('已插入图片~');
                        insertCall(wrapperWidget(imageHtml, imageForbiddenDownload));
                    });
                } else {
                    imageHtml = '<img class="' + imageClassNames + '" src="' + imageUrl + '">\n';
                    toastr.success('已插入图片~');
                    insertCall(wrapperWidget(imageHtml, imageForbiddenDownload));
                }
            }
        });
    }

    /* --------------------- 仪表板区域 的各种消息列表  start -------------------------*/

    // 将私信列表分类 key为chatuser 的id
    function formatLetter(letterList) {
        var formatLetterList = {};
        $.each(letterList, function (i, letter) {
            if (!letter.chatUser) {
                return true;
            }
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
                    if (!arr || arr.length == 0) {
                        return true;
                    }
                    var letter = arr[0];
                    html += '<tr class="unread unread-msg letter-li" data-uid="' + letter.chatUser.uid + '"><td class="check-mail"><input type="checkbox" class="i-checks"></td>';
                    html += '<td class="mail-ontact"><a class="trigger-show-chat-modal" data-uid="' + letter.chatUser.uid + '">' + letter.chatUser.nickname + '</a></td>';
                    html += '<td class="mail-subject trigger-show-chat-modal" data-uid="' + letter.chatUser.uid + '" title="点击打开聊天框">' + replaceMediaTagToWord(letter.content) + '</td>';
                    // html += '<td class=""><i class="fa fa-paperclip"></i></td>';
                    html += '<td class="text-right mail-date">' + letter.send_time + '</td></tr>';
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
                    html += '<td class="mail-subject">' + replaceMediaTagToWord(sysMsg.content) + '</td>';
                    html += '<td class="text-right mail-date">' + sysMsg.send_time + '</td></tr>';
                });
                count += unreadSysMsgList.length;
            } else {
                unreadList.sysMsgs = [];
            }
            $('#messageDashboardMain').html(html).find('.sys-msg-li .mail-subject').each(function () {
                $(this).attr('title', $(this).text());
            }).end().find('a').each(function (i, node) {
                let $node = $(node), href = $node.attr('href');
                href !== undefined && $node.url('href', href);
            });
        }
        return count;
    }

    // 构建面板中私信消息列表的HTML
    function buildLetterListAreaHtml(letterList) {
        formatLetterList = formatLetter(letterList);
        var html = '';
        $.each(formatLetterList, function (key, arr) {
            if (!arr || arr.length == 0) {
                return true;
            }
            var letter = arr[0];
            html += '<tr class="unread full-msg letter-li" data-uid="' + letter.chatUser.uid + '"><td class="check-mail"><input type="checkbox" class="i-checks"></td>';
            html += '<td class="mail-ontact"><a class="trigger-show-chat-modal" data-uid="' + letter.chatUser.uid + '">' + letter.chatUser.nickname + '</a></td>';
            html += '<td class="mail-subject trigger-show-chat-modal" data-uid="' + letter.chatUser.uid + '" title="点击打开聊天框">' + replaceMediaTagToWord(letter.content) + '</td>';
            html += '<td class="text-right mail-date">' + letter.send_time + '</td></tr>';
        });
        $('#messageDashboardMain').html(html);
    }

    // 构建面板中系统消息列表的HTML
    function buildSysMsgListAreaHtml(sysMsgList) {
        var html = '';
        $(sysMsgList).each(function (i, sysMsg) {
            html += '<tr class="unread full-msg sys-msg-li" data-smid="' + sysMsg.smid + '"><td class="check-mail"><input type="checkbox" class="i-checks"></td>';
            html += '<td class="mail-ontact"><a>系统通知</a></td>';
            html += '<td class="mail-subject">' + replaceMediaTagToWord(sysMsg.content) + '</td>';
            html += '<td class="text-right mail-date">' + sysMsg.send_time + '</td></tr>';
        });
        $('#messageDashboardMain').html(html).find('.sys-msg-li .mail-subject').each(function () {
            $(this).prop('title', $(this).text())
        }).end().find('a').each(function (i, node) {
            let $node = $(node), href = $node.attr('href');
            href !== undefined && $node.url('href', href);
        });
    }

    // 替换图片视频等标签为文字
    function replaceMediaTagToWord(content) {
        if (content) {
            return content
                .replace(/<img[\s\S]*?>/g, '[图片]')
                .replace(/class=(["'])[^\1]*?aspect-ratio[^\1]*?\1/gi, "")
                //.replace(/<(iframe|video|embed)[\s\S]*?(?<=\/|<\/\1)>/gi, '[视频]') //火狐不支持前置断言
                .replace(/<(iframe|video|embed)[\s\S]*?(\/|<\/\1)>/gi, '[视频]')
                .replace(/<br>/g, ' ');
        } else {
            return content;
        }
    }

    /* --------------------- 仪表板区域 的各种消息列表  end -------------------------*/

    /* --------------------- 私信聊天模式框 start -------------------------*/

    function showChatModal(uid) {
        if (uid && uid != '0') {
            if (getChatUserLetterUserCard(uid).length <= 0) { // 如果此用户不在聊天用户列表中，则先放入
                appendToChatUserList(uid, function () {
                    getChatUserLetterUserCard(uid).trigger('click');
                });
            } else {
                getChatUserLetterUserCard(uid).trigger('click');
            }
        }
        $('#chat_Modal').modal();
    }

    // 组装聊天用户列表
    function buildChatUserListHtml() {
        if (formatLetterList) {
            let html = '<div class="chat-user" style="background-color: rgb(245, 245, 245);"><input class="input-append-new-user-to-chat" placeholder="输入用户id查找"></div>';
            $.each(formatLetterList, function (key, arr) {
                if (!arr || arr.length == 0) {
                    return true;
                }
                let user = arr[0].chatUser;
                html += buildSingleUserCardHtml(user);
            });
            $('#letter_userList').html(html);
        }
    }

    // 追加新的用户（用户不在聊天用户列表中时）
    var tempChatUser = null;    // 缓存加载的用户
    function appendToChatUserList(chatUid, callback) {
        const dfd = $.Deferred();
        if (!formatLetterList[chatUid] || formatLetterList[chatUid].length == 0) {
            if (!tempChatUser || tempChatUser.uid != chatUid) {
                $.get(globals.api.getUser, {'uid': chatUid}, function (response) {
                    if (response.status == 200) {
                        var chatUser = tempChatUser = response.data.user;
                        dfd.resolve(chatUser);
                        console.log('用户 ' + chatUid + ' 不存在聊天列表中，请求数据加载成功！ ');
                    } else {
                        toastr.error('用户 ：' + chatUid + ' 不存在！ ', '', {"timeOut": 6500});
                    }
                });
            }
        } else {
            let chatUser = formatLetterList[chatUid][0].chatUser;
            dfd.resolve(chatUser);
        }
        dfd.done(function (chatUser) {
            if (getChatUserLetterUserCard(chatUser.uid).length == 0) {
                let html = buildSingleUserCardHtml(chatUser);
                $('#letter_userList').append(html);
                let $userCard = getChatUserLetterUserCard(chatUser.uid);
                if ('scrollIntoViewIfNeeded' in $userCard[0]) {
                    $userCard[0].scrollIntoViewIfNeeded();
                } else if ('scrollIntoView' in $userCard[0]) {
                    $userCard[0].scrollIntoView({block: 'center'});
                }
            }
            callback && callback(chatUser);
        });
    }

    function buildSingleUserCardHtml(chatUser) {
        let html = '';
        html += '<div class="chat-user trigger-show-chat-user-letter-list" id="chat_uid_' + chatUser.uid + '" data-uid="' + chatUser.uid + '" >';
        html += '<div class="chat-avatar" style="background-image:url(' + chatUser.head_photo + ')" title="' + chatUser.nickname + '"></div>';
        html += '<div class="chat-user-name">';
        html += '<a href="' + ('u/' + chatUser.uid + '/home').toURL() + '" target="_blank">' + chatUser.nickname + '</a>';
        html += '</div></div>';
        return html;
    }

    //  组装当前要查看用户的消息列表
    function buildChatUserLetterListHtml(chatUid) {
        let $currentLetterContent = $('#currentLetterContent'),
            before_uid = $currentLetterContent.attr('data-uid'),
            isChangeChatUser = before_uid != chatUid;
        $currentLetterContent.attr('data-uid', chatUid);
        if (formatLetterList) {
            let letterList = formatLetterList[chatUid],
                html = '', new_leids_str = '', before_leids_str = '',
                earliest_index = parseInt($currentLetterContent.attr('data-earliest-index') || -1);
            if (letterList) {
                if (!isChangeChatUser) {
                    earliest_index = earliest_index >= 0 ? earliest_index : (batch_load_letter_size - 1);
                    if (earliest_index > letterList.length - 1) {
                        earliest_index = letterList.length - 1;
                    }
                    // 倒序遍历
                    for (let i = earliest_index; i >= 0; i--) {
                        // for (let i = 0; i <= earliest_index; i++) {
                        let letter = letterList[i];
                        if (!isChangeChatUser && i <= earliest_index) {
                            new_leids_str += '_' + letter.leid;
                        }
                    }
                    if (new_leids_str) {
                        new_leids_str = new_leids_str.substring(1);
                    }
                    before_leids_str = $currentLetterContent.find('.chat-message').map(function () {
                        return this.getAttribute('data-leid');
                    }).toArray().join('_');
                } else {
                    earliest_index = batch_load_letter_size > letterList.length ? (letterList.length - 1) : (batch_load_letter_size - 1);
                    $currentLetterContent.toggleClass('lazy-letter-load-completed', false);
                }
                if (isChangeChatUser || before_leids_str != new_leids_str) {
                    html = buildBatchLetterHtml(letterList, 0, earliest_index + 1, profile).html;
                    html += '<div class="chat-discussion-end" style="height:0px; overflow:hidden"></div>';
                    $currentLetterContent.html(html);
                    if ($currentLetterContent.children('.chat-message').length === letterList.length) {
                        $currentLetterContent.toggleClass('lazy-letter-load-completed', true);
                    }
                    stayBottomTimer && clearInterval(stayBottomTimer);
                    stayBottomLock = true;
                    stayBottomTimer = setInterval(function () {
                        if (stayBottomLock) {
                            $currentLetterContent[0].scrollTop = $currentLetterContent[0].scrollHeight;
                        }
                    }, 500);
                    setTimeout(function () {
                        if (chatUid == getCurrentLetterChatUid()) {
                            stayBottomTimer && clearInterval(stayBottomTimer);
                            stayBottomTimer = null;
                            stayBottomLock = false;
                        }
                    },7000);
                }
                $currentLetterContent.attr('data-earliest-index', earliest_index);

                // 滚动到底部
                $currentLetterContent[0].scrollTop = $currentLetterContent[0].scrollHeight;
                //letterContentScrollBottomTimer && clearTimeout(letterContentScrollBottomTimer);
                removeLetterUnReadStyleTimer && clearTimeout(removeLetterUnReadStyleTimer);
                //letterContentScrollBottomTimer = setTimeout(function () {    // 延迟防止modal未显示时高度未0情况
                //    $currentLetterContent[0].scrollTop = $currentLetterContent[0].scrollHeight + 2000; // 预留图片高度
                //    letterContentScrollBottomTimer = null;
                //}, 900);
                removeLetterUnReadStyleTimer = setTimeout(function () {    // 10秒后移除未读提示
                    $currentLetterContent.find('.chat-message-un-read').each(function (i, li) {
                        $(li).removeClass('chat-message-un-read');
                    });
                    removeLetterUnReadStyleTimer = null;
                }, 10000);
                // $currentLetterContent[0].scrollTop = 0;

                // 绑定视频/图片链接出现在可视区域时替换为视频/图片标签的观察者
                $currentLetterContent.find('.chat-message .message-content .lazy-media-link:not(.lazy-media-completed)').each(function (i, linkNode) {
                    lazyMediaObserver.observe(linkNode);
                });
            } else {
                $currentLetterContent.empty();
                $currentLetterContent.toggleClass('lazy-letter-load-completed', true);
            }
        }
    }

    function buildBatchLetterHtml(letterList, start, size, loginUser) {
        let maxLength = letterList.length, i, end,
            html = '';
        (start > maxLength - 1) && (start = maxLength); // 包含起始
        (start < 0) && (start = 0);
        ((start + size) > maxLength) && (size = (maxLength - 1 - start + 1));
        (size < 0) && (size = 0);
        end = start + size - 1;
        // 倒序遍历
        for (i = end; i >= start; i--) {
            // for (i = start; i <= end; i++) {
            let letter = letterList[i];
            html += buildSingleLetterHtml(letter, loginUser);
        }
        return {
            'html': html,
            'start': start,
            'end': end,
            'size': size,
        };
    }

    function buildSingleLetterHtml(letter, loginUser) {
        let html = '', sendByOther = (letter.s_uid != loginUser.uid),
            isHasLink = /(http:\/\/|https:\/\/)/.test(letter.content);
        html += '<div class="chat-message chat-message-' + (sendByOther ? 'left' : 'right') + (sendByOther && letter.status == 0 ? ' chat-message-un-read' : '') + (isHasLink ? ' chat-message-link' : '') + '" data-leid="' + letter.leid + '" data-s-uid="' + letter.s_uid + '">';
        html += '<div class="message-avatar" style="background-image:url(' + (sendByOther ? letter.chatUser.head_photo : loginUser.head_photo) + ')" alt=""></div>';
        html += '<div class="message">';
        html += '<a class="message-author" target="_blank" href="' + ('u/' + letter.s_uid + '/home').toURL() + '">' + (sendByOther ? letter.chatUser.nickname : loginUser.nickname) + '</a>';
        html += '<span class="message-date">' + letter.send_time + '</span>';
        if (!sendByOther) {
            html += '<span class="message-status" title="对方已阅读你的消息\n同样，如果你已阅读对方的消息，那么对方也会知道你已读">' + (letter.status == 0 ? '未读' : '已读<span class="hidden-xs"> ✔</span>') + '</span>';
        }
        html += '<span class="message-del">' + (sendByOther ? '删除' : '撤回') + '</span>';
        html += '<div class="message-content">' + convertMessageLink(letter.content, site_video_regex) + '</div></div></div>';
        return html;
    }

    function convertMessageLink(content, site_video_regex, site_photo_regex) {
        site_video_regex = site_video_regex || new RegExp('^((?:' + basePath.replace(/:(?=(?:80|443)(?=\/))\d+(?=\/)/, '') + ')?video/)(detail|embed)(/[^?]+(\\?.*)?)$');
        site_photo_regex = site_photo_regex || new RegExp('^((?:' + basePath.replace(/:(?=(?:80|443)(?=\/))\d+(?=\/)/, '') + ')?p/)(detail|embed)(/[^?]+(\\?.*)?)$');
        return common_utils.convertLinkToHtmlTag(content, function (url) {
            let not_hash_url = url.match(/^(.*?)(#.*)?$/) && RegExp.$1, hash = RegExp.$2 || '';
            if (site_video_regex.test(not_hash_url)) {
                const videoPreviewLink = RegExp.$1 + 'embed' + RegExp.$3 + (RegExp.$4 ? '&' : '?') + 'save_access_record=false&disable_embed=true' +
                    (RegExp.$2 === 'embed' ? '&disable_embed_redirect=embed' : '') + hash;
                return `<a class="lazy-media-link lazy-video-link" data-media-preview-link="${videoPreviewLink}" target="_blank" href="${url}">${url}</a>`;
            } else if (site_photo_regex.test(not_hash_url)) {
                const photoPreviewLink = url;
                return `<a class="lazy-media-link lazy-photo-link" data-media-preview-link="${photoPreviewLink}" target="_blank" href="${url}">${url}</a>`;
            } else {
                return `<a target="_blank" href="${url}">${url}</a>`;
            }
        });
    }

    // 视频照片预览
    function insertMediaPreviewWidget($lazyMediaLink) {
        const mediaType = $lazyMediaLink.hasClass('lazy-video-link') ? 'video' : 'photo',
            url = $lazyMediaLink.attr('href');
        switch (mediaType) {
            case 'video':
                const videoPreviewLink = $lazyMediaLink.attr('data-media-preview-link');
                $lazyMediaLink.after('<div class="lazy-media-preview lazy-video-preview">' +
                    `<iframe class="lazy-media-source lazy-media-embed" src="${videoPreviewLink}" data-scale="stay" style="width:100%;"></iframe></div>`);
                break;
            case 'photo':
                let photo_id = /\/p\/detail\/([^?&#]+)$/.test(url) && RegExp.$1;
                if (photo_id) {
                    globals.request.get(globals.api.getPhoto, {
                        "id": photo_id,
                        "loadActionRecord": false
                    }, false, ['photo']).final(function (photo) {
                        const $photoPreviewEmbed = $('<a>', {
                            "href": url,
                            "class": "lazy-media-preview lazy-photo-preview image-widget protect tips-delay",
                            "target": "_blank",
                            "data-photo-id": photo_id
                        }).append($('<img>', {
                            "src": photo.path,
                            "class": 'lazy-media-source',
                            "style": "width:100%;"
                        }));
                        $lazyMediaLink.after($photoPreviewEmbed);
                        setTimeout(function () {
                            $photoPreviewEmbed.removeClass('tips-delay');
                        }, 0);
                    });
                }
                break;
        }
    }

    function appendNewLetter(letter) {
        const $currentLetterContent = $('#currentLetterContent');
        if ($currentLetterContent.find('.chat-message[data-leid="' + letter.leid + '"]').length === 0) {
            $currentLetterContent.find('.chat-discussion-end').before(buildSingleLetterHtml(letter, profile));
            // $currentLetterContent.prepend(buildSingleLetterHtml(letter, profile));
            $currentLetterContent.attr('data-earliest-index', parseInt($currentLetterContent.attr('data-earliest-index') || -1) + 1);
            getChatUserLetterUserCard(letter.chatUser.uid).trigger('click');
        }
        $currentLetterContent[0].scrollTop = $currentLetterContent[0].scrollHeight;
        // $currentLetterContent[0].scrollTop = 0;
    }

    // 当前选中的私信用户
    function getCurrentLetterChatUid() {
        return $('#currentLetterContent').attr('data-uid');
    }

    // 得到用户uid的会话html节点
    function getChatUserLetterUserCard(uid) {
        return $('#chat_uid_' + uid);
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
            let $letter = $('#currentLetterContent').find('.chat-message[data-leid="' + leid + '"]'),
                $currentLetterContent = $('#currentLetterContent');
            if ($letter.length > 0) {
                $letter.remove();
                $currentLetterContent.attr('data-earliest-index', parseInt($currentLetterContent.attr('data-earliest-index') || -1) - 1);
            }
            globals.removeNotify('receive_letter' + '_' + leid); // 通知也删除
            $('#messages').find('.folder-list li.active-li a').trigger('click');
        }
        return isFind;
    }

    /* --------------------- 私信聊天模式框 end -------------------------*/

    /* --------------------- 发送消息与服务器交互请求 start -------------------------*/

    const request = globals.extend(globals.request, {
        user_center: {
            'loadUnreadMsgList': function (success) {   // 从服务器加载未读消息列表
                return globals.request.get(globals.api.getUnreadMsgList, success, success && '获取未读消息失败~');
            },
            'loadLetterList': function (params, success) { // 从服务器加载私信消息列表
                return globals.request.get(globals.api.getLetterList, params, success, ['letters'], success && '加载私信消息失败~');
            },
            'loadSysMsg': function (params, success) { // 从服务加载系统消息列表
                return globals.request.get(globals.api.getSysMsgList, params, success, ['sysMsgs'], success && '加载系统消息失败~');
            },
            'sendLetter': function (letter, success) { // 提交私信到服务器
                let error;
                if (!letter) {
                    error = '私信对象为空';
                } else if (!letter.r_uid) {
                    error = '未指定用户~';
                } else if (!letter.content) {
                    error = '请输入内容~';
                } else {
                    let content = letter.content;
                    // 将图片链接转化为img标签
                    content = common_utils.convertImageLinkToHtmlTag(content.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ''), '', true).replace(/\n$/, '');
                    if (!content) {
                        error = '请输入内容~';
                    } else if (content.length >= 3999) {
                        error = '字数超出~  ' + content.length + '/4000';
                    } else {
                        letter.content = content;
                    }
                }
                if (error) {
                    success && globals.notify().error(error);
                    return globals.request.rejectedResp({
                        'message': error,
                        'type': -1
                    }, false, null, false);
                } else {
                    return globals.request.post(globals.api.sendLetter, letter, success, ['letter'], success && '消息发送失败');
                }
            },
            'deleteLetter': function (leid, success) { // 删除并撤回私信消息
                return globals.request.get(globals.api.deleteLetter, {'leid': leid}, success, null, success && '删除消息失败');
            },
            'clearLetterListStatus': function (leIds, success) { // 清除未读私信消息
                return $.Deferred(function (dfd) {
                    if (!leIds || !Array.isArray(leIds) || leIds.length === 0) {
                        globals.request.rejectedResp({'message': '传入的消息列表为空', 'type': -1}, false, null, false, dfd);
                        return;
                    }
                    globals.request.ajax({
                        type: 'post',
                        dataType: "json"
                    }, globals.api.clearLetterListStatus, {"leids": leIds.join()}, false).always(function () {
                        let resp = this;
                        if (resp.status === 200 || (resp.type === 1 && resp.status === 404)) {
                            globals.request.resolvedResp(resp, success, null, false, dfd);
                        } else {
                            globals.request.rejectedResp(resp, success && '标记系统消息为已读失败', null, false, dfd);
                        }
                    });
                });
            },
            'clearSysMsgListStatus': function (smIds, success) { // 清除未读系统消息
                return $.Deferred(function (dfd) {
                    if (!smIds || !Array.isArray(smIds) || smIds.length === 0) {
                        globals.request.rejectedResp({'message': '传入的消息列表为空', 'type': -1}, false, null, false, dfd);
                        return;
                    }
                    globals.request.ajax({
                        type: 'post',
                        dataType: "json"
                    }, globals.api.clearSysMsgListStatus, {"smids": smIds.join()}, false).always(function () {
                        let resp = this;
                        if (resp.status === 200 || (resp.type === 1 && resp.status === 404)) {
                            globals.request.resolvedResp(resp, success, null, false, dfd);
                        } else {
                            globals.request.rejectedResp(resp, success && '标记系统消息为已读失败', null, false, dfd);
                        }
                    });
                });
            },
            'deleteSysMsgList': function (smIds, success) { // 删除未读系统消息
                return $.Deferred(function (dfd) {
                    if (!smIds || !Array.isArray(smIds) || smIds.length === 0) {
                        globals.request.rejectedResp({'message': '传入的消息列表为空', 'type': -1}, false, null, false, dfd);
                        return;
                    }
                    globals.request.ajax({
                        type: 'post',
                        dataType: "json"
                    }, globals.api.deleteSysMsgList, {"smids": smIds.join()}, false).always(function () {
                        let resp = this;
                        if (resp.status === 200 || (resp.type === 1 && resp.status === 404)) {
                            globals.request.resolvedResp(resp, success, null, false, dfd);
                        } else {
                            globals.request.rejectedResp(resp, success && '删除系统消息失败', null, false, dfd);
                        }
                    });
                });
            },
        }
    }).user_center;

    /* --------------------- 发送消息与服务器交互请求  end -------------------------*/

    // 注册监控服务器的未读消息推送
    function initWsReceiveServerPush() {
        if (login_handle.validateLogin()) {
            var eventPrefix = websocket_util.config.event.messageReceive + '.';
            var notify_ws_opts = {
                "progressBar": false,
                "positionClass": "toast-top-right",
                "iconClass": "toast-success-no-icon",
                "timeOut": 0,
                "onclick": function (e) {
                    if ($(e.target).closest('a').length > 0) {
                        e.preventDefault();
                        window.open(e.target.href);
                        return false;
                    }
                },
                "onShown": function () {
                    $(this).css('opacity', '1');
                },
                "onHidden": function (toastElement, closeType) {
                    if (closeType != 0 && toastElement.hasClass('wsMessage') && !toastElement.hasClass('not-sync-ws-message')) {
                        websocket_util.post({
                            "mapping": "transfer_data_in_tabs",
                            "metadata": {
                                "handle": "remove_ws_message",
                                "ws_message_id": parseInt(toastElement.attr('data-wsid'))
                            }
                        });
                    }
                }
            };
            // 收到新私信，unbind取消login.js中的默认处理
            websocket_util.off(eventPrefix + 'receive_letter').on(eventPrefix + 'receive_letter', function (e, wsMessage, wsEvent) {
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
                    "onclick": function (e) {
                        ($(e.target).closest('a').length > 0) && e.preventDefault();
                        showChatModal(letter.s_uid); // 打开聊天框
                    }
                });
                // 显示通知
                var toastElement = null;
                if (/<(img|iframe|video|embed)[\s\S]*?>/.test(letter.content)) {
                    toastElement = globals.notify(notify_opts).success(letter.content, user.nickname + ' 对你说：', 'receive_letter' + '_' + letter.leid);
                } else {
                    toastElement = globals.notify(notify_opts).success('<b>“' + letter.content + '”</b>', user.nickname + ' 对你说：', 'receive_letter' + '_' + letter.leid);
                }
                toastElement.addClass('wsMessage receive_letter').attr('data-leid', letter.leid).attr('data-wsid', wsMessage.id);
                toastElement.on('contextmenu dragstart', 'img.forbidden-download', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return false;
                });
                // 插入聊天面板
                if (getChatUserLetterUserCard(letter.s_uid).length <= 0) { // 如果此用户不在聊天用户列表中，则先放入
                    appendToChatUserList(letter.s_uid, function () {
                        if (letter.s_uid == getCurrentLetterChatUid()) {
                            appendNewLetter(letter);
                        }
                    });
                } else {
                    getChatUserLetterUserCard(letter.s_uid).removeClass('has-read-user');
                    if (letter.s_uid == getCurrentLetterChatUid()) { // 如果正在查看该用户的消息，则直接插入
                        appendNewLetter(letter);
                    }
                }
                $('#newestMsgTime').html(letter.send_time);
                $('#messages').find('.folder-list li.active-li a').trigger('click');
            }).off(eventPrefix + 'withdraw_letter').onPush('withdraw_letter', function (e, wsMessage, wsEvent) { // 当别的用户撤回消息
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
                        globals.notify(notify_opts)
                            .info(user.nickname + ' 撤回了一条消息.', '', 'withdraw_letter' + '_' + wsMessage.id)
                            .addClass('wsMessage withdraw_letter').attr('data-wsid', wsMessage.id);
                    }
                }
            });
        }
    }

    var loadUserSetting = function (call) {
        $.get(globals.api.getUserSetting, function (response) {
            if (response.status == 200) {
                call(response.data.userSetting);
            }
        });
    };

    var updateUserSetting = function (userSetting, call) {
        $.post(globals.api.updateUserSetting, userSetting, function (response) {
            if (response.status == 200) {
                toastr.success('用户账号配置更新成功~');
                call(response.data.userSetting);
            } else {
                toastr.error(response.message, '更新失败');
                console.warn('Error Code: ' + response.status);
            }
        });
    };

    function initSettingTab() {
        // 账号设置，存于服务器
        var userSetting = null;
        loadUserSetting(function (loadUserSetting) {
            userSetting = loadUserSetting;
            if (userSetting.receiveNotifyEmail == 0) {
                $('#setting_account').find('input[name="setting_receive_notify_email"][value="true"]').prop('checked', true);
            } else {
                $('#setting_account').find('input[name="setting_receive_notify_email"][value="false"]').prop('checked', true);
            }

        });
        $('#submit_setting_account').click(function () {
            var postData = {};
            postData.receiveNotifyEmail = $('#setting_account').find('input[name="setting_receive_notify_email"]:checked').val() == 'true' ? 0 : 1;
            updateUserSetting(postData, function (loadUserSetting) {
                userSetting = loadUserSetting;
            });
        });
        // 页面显示配置，存于客户端
        var articleConfig = globals.getLocalConfig('article', {
            "full_screen": false,
            "full_background": false
        });
        var loginConfig = globals.getLocalConfig('login', {
            "remember_expires": 31104000000,
            "remember_default_check": true
        });
        var albumConfig = globals.getLocalConfig('album', {
            "photo_page": {
                "full_background": true,
                "default_col": {
                    "2000+": 6,
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
                    "popup_btn_display": "block",
                    "popup_height_scale": 0.91,
                    "popup_hide_btn": true
                },
                "blow_up": {
                    "width": 600,
                    "height": 600,
                    "scale": 1.6
                },
                "preview_compress": true
            },
            "album_page": {
                "full_background": false,
                "default_col": {
                    "2000+": 5,
                    "2000": 4,
                    "1800": 4,
                    "1600": 4,
                    "940": 3,
                    "720": 2
                },
                "default_size": 0
            },
            "video_page": {
                'embed': {
                    'audio_use_fake_video': true
                }
            }
        });
        var settingTab = $('#settings');
        // 初始化 article配置
        if (articleConfig.full_screen) {
            settingTab.find('#setting_article_form input[name="setting_full_screen"][value="true"]').prop('checked', true);
        } else {
            settingTab.find('#setting_article_form input[name="setting_full_screen"][value="false"]').prop('checked', true);
        }
        if (articleConfig.full_background) {
            settingTab.find('#setting_article_form input[name="setting_full_background_article"][value="true"]').prop('checked', true);
        } else {
            settingTab.find('#setting_article_form input[name="setting_full_background_article"][value="false"]').prop('checked', true);
        }

        // 初始化登录配置
        settingTab.find('#setting_login_form input[name="setting_remember_expires"]').val(loginConfig.remember_expires / (3600 * 1000 * 24));
        if (loginConfig.remember_default_check) {
            settingTab.find('#setting_login_form input[name="setting_remember_default_check"][value="true"]').prop('checked', true);
        } else {
            settingTab.find('#setting_login_form input[name="setting_remember_default_check"][value="false"]').prop('checked', true);
        }

        // 初始化相册photo_page配置
        if (albumConfig.photo_page.full_background) {
            settingTab.find('#setting_album_form input[name="setting_full_background_photo"][value="true"]').prop('checked', true);
        } else {
            settingTab.find('#setting_album_form input[name="setting_full_background_photo"][value="false"]').prop('checked', true);
        }
        if (albumConfig.photo_page.preview_compress) {
            settingTab.find('#setting_album_form input[name="setting_photo_preview_compress"][value="true"]').prop('checked', true);
        } else {
            settingTab.find('#setting_album_form input[name="setting_photo_preview_compress"][value="false"]').prop('checked', true);
        }
        settingTab.find('#setting_album_form input[name="setting_blow_up_width"]').val(albumConfig.photo_page.blow_up.width);
        settingTab.find('#setting_album_form input[name="setting_blow_up_height"]').val(albumConfig.photo_page.blow_up.height);
        settingTab.find('#setting_album_form input[name="setting_blow_up_scale"]').val(albumConfig.photo_page.blow_up.scale);
        settingTab.find('#setting_album_form input[name="setting_video_load_mode"]').each(function (i, mode) {
            if (mode.value == albumConfig.photo_page.video.load_mode) {
                $(mode).prop('checked', true);
            }
        });
        if (albumConfig.photo_page.video.popup_iframe_border) {
            settingTab.find('#setting_album_form input[name="setting_video_iframe_border"][value="true"]').prop('checked', true);
        } else {
            settingTab.find('#setting_album_form input[name="setting_video_iframe_border"][value="false"]').prop('checked', true);
        }
        if (albumConfig.photo_page.video.popup_video_border) {
            settingTab.find('#setting_album_form input[name="setting_video_video_border"][value="true"]').prop('checked', true);
        } else {
            settingTab.find('#setting_album_form input[name="setting_video_video_border"][value="false"]').prop('checked', true);
        }
        settingTab.find('#setting_album_form input[name="setting_popup_btn_display"]').each(function (i, mode) {
            if (mode.value == albumConfig.photo_page.video.popup_btn_display) {
                $(mode).prop('checked', true);
            }
        });
        if (albumConfig.photo_page.video.popup_hide_btn) {
            settingTab.find('#setting_album_form input[name="setting_popup_hide_btn"][value="true"]').prop('checked', true);
        } else {
            settingTab.find('#setting_album_form input[name="setting_popup_hide_btn"][value="false"]').prop('checked', true);
        }
        settingTab.find('#setting_album_form input[name="setting_video_height_scale"]').val(albumConfig.photo_page.video.popup_height_scale);
        settingTab.find('#setting_album_form input[name="setting_default_col_photo_2000+"]').val(albumConfig.photo_page.default_col["2000+"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_photo_2000"]').val(albumConfig.photo_page.default_col["2000"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_photo_1800"]').val(albumConfig.photo_page.default_col["1800"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_photo_1600"]').val(albumConfig.photo_page.default_col["1600"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_photo_940"]').val(albumConfig.photo_page.default_col["940"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_photo_720"]').val(albumConfig.photo_page.default_col["720"]);
        settingTab.find('#setting_album_form input[name="setting_default_size_photo"]').val(albumConfig.photo_page.default_size);
        settingTab.find('#setting_album_form input[name="setting_default_query_size"]').val(albumConfig.photo_page.default_query_size);

        // 初始化相册album_page配置
        if (albumConfig.album_page.full_background) {
            settingTab.find('#setting_album_form input[name="setting_full_background_album"][value="true"]').prop('checked', true);
        } else {
            settingTab.find('#setting_album_form input[name="setting_full_background_album"][value="false"]').prop('checked', true);
        }
        settingTab.find('#setting_album_form input[name="setting_default_col_album_2000+"]').val(albumConfig.album_page.default_col["2000+"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_album_2000"]').val(albumConfig.album_page.default_col["2000"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_album_1800"]').val(albumConfig.album_page.default_col["1800"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_album_1600"]').val(albumConfig.album_page.default_col["1600"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_album_940"]').val(albumConfig.album_page.default_col["940"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_album_720"]').val(albumConfig.album_page.default_col["720"]);
        settingTab.find('#setting_album_form input[name="setting_default_size_album"]').val(albumConfig.album_page.default_size);

        // 初始化相册video_page配置
        if (albumConfig.video_page.embed.audio_use_fake_video) {
            settingTab.find('#setting_album_form input[name="setting_audio_use_fake_video"][value="true"]').prop('checked', true);
        } else {
            settingTab.find('#setting_album_form input[name="setting_audio_use_fake_video"][value="false"]').prop('checked', true);
        }

        // 点击保存事件
        settingTab.find('#submit_setting_article').click(function () {
            var config = {};
            config.full_screen = settingTab.find('#setting_article_form input[name="setting_full_screen"]:checked').val() == 'true' ? true : false;
            config.full_background = settingTab.find('#setting_article_form input[name="setting_full_background_article"]:checked').val() == 'true' ? true : false;
            globals.setLocalConfig('article', config);
            toastr.success('文章配置保存成功！', '', {"progressBar": false});
        });
        settingTab.find('#submit_setting_login').click(function () {
            var config = {};
            var days = settingTab.find('#setting_login_form input[name="setting_remember_expires"]').val();
            if (days == '') {
                toastr.error('请输入值！', '错误', {"progressBar": false});
                return;
            }
            if (isNaN(days)) {
                toastr.error('请输入数字！', '错误', {"progressBar": false});
                return;
            }
            if (days <= 0) {
                toastr.error('请输入大于0的数字！单位为天', '错误', {"progressBar": false});
                return;
            }
            config.remember_expires = days * (3600 * 1000 * 24);
            config.remember_default_check = settingTab.find('#setting_login_form input[name="setting_remember_default_check"]:checked').val() == 'true' ? true : false;
            globals.setLocalConfig('login', config);
            toastr.success('登录配置保存成功！', '', {"progressBar": false});
        });
        settingTab.find('#submit_setting_album').click(function () {
            var config = {};
            // photo_page
            config.photo_page = {};
            config.photo_page.full_background = settingTab.find('#setting_album_form input[name="setting_full_background_photo"]:checked').val() == 'true' ? true : false;
            config.photo_page.preview_compress = settingTab.find('#setting_album_form input[name="setting_photo_preview_compress"]:checked').val() == 'true' ? true : false;
            config.photo_page.video = {};
            config.photo_page.video.load_mode = settingTab.find('#setting_album_form input[name="setting_video_load_mode"]:checked').val();
            config.photo_page.video.popup_iframe_border = settingTab.find('#setting_album_form input[name="setting_video_iframe_border"]:checked').val() == 'true' ? true : false;
            config.photo_page.video.popup_video_border = settingTab.find('#setting_album_form input[name="setting_video_video_border"]:checked').val() == 'true' ? true : false;
            config.photo_page.video.popup_btn_display = settingTab.find('#setting_album_form input[name="setting_popup_btn_display"]:checked').val();
            config.photo_page.video.popup_hide_btn = settingTab.find('#setting_album_form input[name="setting_popup_hide_btn"]:checked').val() == 'true' ? true : false;
            var height_scale = settingTab.find('#setting_album_form input[name="setting_video_height_scale"]').val();
            if (height_scale == '' || isNaN(height_scale) || height_scale <= 0 || height_scale > 1) {
                toastr.error('宽度比例应在0.0到1.0之间！', '错误', {"progressBar": false});
                return;
            }
            config.photo_page.video.popup_height_scale = parseFloat(height_scale);
            var blow_up_width = settingTab.find('#setting_album_form input[name="setting_blow_up_width"]').val();
            var blow_up_height = settingTab.find('#setting_album_form input[name="setting_blow_up_height"]').val();
            var blow_up_scale = settingTab.find('#setting_album_form input[name="setting_blow_up_scale"]').val();
            if (blow_up_width == '' || isNaN(blow_up_width) || blow_up_width <= 0) {
                toastr.error('放大镜宽度请输入大于0的数字！', '错误', {"progressBar": false});
                return;
            }
            if (blow_up_height == '' || isNaN(blow_up_height) || blow_up_height <= 0) {
                toastr.error('放大镜高度请输入大于0的数字！', '错误', {"progressBar": false});
                return;
            }
            if (blow_up_scale == '' || isNaN(blow_up_scale) || blow_up_scale <= 0) {
                toastr.error('放大镜倍率请输入大于0的数字！', '错误', {"progressBar": false});
                return;
            }
            config.photo_page.blow_up = {};
            config.photo_page.blow_up.width = parseInt(blow_up_width);
            config.photo_page.blow_up.height = parseInt(blow_up_height);
            config.photo_page.blow_up.scale = parseFloat(blow_up_scale);
            config.photo_page.default_col = {};
            config.photo_page.default_col["2000+"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_photo_2000+"]').val());
            config.photo_page.default_col["2000"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_photo_2000"]').val());
            config.photo_page.default_col["1800"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_photo_1800"]').val());
            config.photo_page.default_col["1600"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_photo_1600"]').val());
            config.photo_page.default_col["940"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_photo_940"]').val());
            config.photo_page.default_col["720"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_photo_720"]').val());
            config.photo_page.default_size = parseInt(settingTab.find('#setting_album_form input[name="setting_default_size_photo"]').val());
            config.photo_page.default_query_size = parseInt(settingTab.find('#setting_album_form input[name="setting_default_query_size"]').val());
            // album_page
            config.album_page = {};
            config.album_page.full_background = settingTab.find('#setting_album_form input[name="setting_full_background_album"]:checked').val() == 'true' ? true : false;
            config.album_page.default_col = {};
            config.album_page.default_col["2000+"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_album_2000+"]').val());
            config.album_page.default_col["2000"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_album_2000"]').val());
            config.album_page.default_col["1800"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_album_1800"]').val());
            config.album_page.default_col["1600"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_album_1600"]').val());
            config.album_page.default_col["940"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_album_940"]').val());
            config.album_page.default_col["720"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_album_720"]').val());
            config.album_page.default_size = parseInt(settingTab.find('#setting_album_form input[name="setting_default_size_album"]').val());
            // video_page
            config.video_page = {
                'embed': {
                    'audio_use_fake_video': settingTab.find('#setting_album_form input[name="setting_audio_use_fake_video"]:checked').val() == 'true' ? true : false
                }
            };
            globals.setLocalConfig('album', config);
            toastr.success('相册配置保存成功！', '', {"progressBar": false});
        });
    }

    /**************** msg end ******************/

    domReady(function () {

        var callAfterLoad = null;
        var url = common_utils.parseURL(window.location.href);
        var params = url.params;
        var action = document.location.href.match(/^.*\/u\/\w+\/center\/(\w+)\??.*$/) ? RegExp.$1 : undefined;
        var activeTabName = null;

        if (action == 'sendLetter') {
            activeTabName = "messages";
            var chatuid = params['chatuid'];
            if (chatuid != undefined && chatuid.length > 0) {
                callAfterLoad = function () {
                    showChatModal(chatuid);
                };
            }
        } else if (action) {
            activeTabName = action;
        } else if (url.hash != '' && url.hash != undefined) {
            var isTab = false;
            $.each(["profile", "account", "friends", "followings", "followers", "collections", "messages", "settings"], function (i, value) {
                if (url.hash == value) {
                    isTab = true;
                    return false;
                }
            });
            if (isTab) {
                activeTabName = url.hash;
            }
        }
        if (activeTabName) {
            var activeTab = $('#main_tab_ul').find('a[href="#' + activeTabName + '"]');
            activeTab.tab('show');
            if (activeTabName == 'messages' && !activeTab.hasClass('messages_tab_mark_clicked')) {
                clearSysMsgOnOpenRunOnceFlag = true;
                activeTab.removeClass('messages_tab_mark_clicked').addClass('messages_tab_mark_clicked');
            }
        }

        var hostUserName = document.title.substring(0, document.title.indexOf(' '));
        $('#main_tab_ul a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            // e.target // newly activated tab
            // e.relatedTarget // previous active tab
            // if ( !(action !== undefined && action.length > 0)) {
            var activeTab = $(e.target);
            var activeTabName = activeTab.attr('href').match(/#(.*)$/) ? RegExp.$1 : '';
            history.replaceState(
                null,
                hostUserName + '_' + e.target.innerText + " - ImCoder's 博客",
                location.pathname.replace(/\/center.*$/, '/center/') + activeTabName
            );
            document.title = hostUserName + '_' + e.target.innerText + " - ImCoder's 博客";
            //    document.location.href = $(e.target).attr('href');
            //    //document.body.scrollTop = document.documentElement.scrollTop = 0;
            //    scrollTo(0,0);
            // }
            if (activeTabName == 'messages' && !activeTab.hasClass('messages_tab_mark_clicked')) {
                clearSysMsgOnOpenRunOnceFlag = true;
                $('#messages').find('.folder-list li.active-li a').trigger('click');
                activeTab.toggleClass('messages_tab_mark_clicked', true);
            }
        });

        initProfileTab($uid);

        initMessageTab(callAfterLoad);

        initAccountTab();

        initContactTab($uid, true);

        initCollectionTab();

        initSettingTab();

    });

});