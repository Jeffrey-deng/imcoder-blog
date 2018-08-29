(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'cityselect', 'birthday', 'common_utils'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, null, null, common_utils);
    }
})(function ($, bootstrap, domReady, toastr, cityselect, birthday, common_utils) {

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
    }

    function load_profile() {
        $.ajax({
            url: 'user.do?method=profile',
            data: {
                'uid': $uid
            },
            success: function (user) {
                if (user != null) {
                    $('input[name="nickname"]').val(user.nickname);
                    $('input[name="description"]').val(user.description);
                    $('input[name="qq"]').val(user.qq);
                    $('input[name="weibo"]').val(user.weibo);
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

                    $('input[name="username"]').val(user.username);
                    $('input[name="email"]').val(user.email);
                    $('#login_ip').html(user.loginIP);
                    getIpLocation(user.loginIP);
                    $('#validateMailForm').find('input[name="email"]').val(user.email);
                    src_email = user.email;
                    src_username = user.username;
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
        data.head_photo = $('#head_photo').attr('db_src');
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
            $('#submit_account').removeAttr("disabled");
        }
    }

    function initAccountForm() {

        $('#submit_account').attr('disabled', "true");

        //发送验证邮件事件
        $('#sendValidateMailBtn').click(function () {
            sendValidateMail();
            $('#validateMailModal').modal({backdrop: 'static', keyboard: false});
            $('#sendValidateMailBtn').attr('disabled', "true").html("发送验证邮件（30s后可再发送）");
            setTimeout(function () {
                $('#sendValidateMailBtn').removeAttr("disabled").html("发送验证邮件");
            }, 30 * 1000);
        });
        //检查验证码是否正确事件
        $('#validateMailBtn').click(function () {
            var code = $('#validateMailForm').find('input[name="validateCode"]').eq(0).val().replace(/(^\s*)|(\s*$)/g, '');
            if (code.toLowerCase() == validateCode.toLowerCase()) {
                toastr.success('验证成功！');
                $('#validateMailModal').modal('hide');
                $('#account_form').find("input").removeAttr("disabled");
                $('#sendValidateMailBtn').hide();
                $('#submit_account').removeAttr("disabled");
            } else {
                toastr.error('验证码错误！');
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
                $.get("user.do?method=checkEmail&email=" + email, function (data) {
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
                $.get("user.do?method=checkUsername&username=" + username, function (data) {
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

    //保存返回的验证码
    var validateCode;
    //发送验证码邮件
    function sendValidateMail() {
        $.ajax({
            url: 'site.do?method=sendValidateMail',
            type: "POST",
            success: function (data) {
                if (data) {
                    validateCode = data;
                    toastr.success('已发送验证邮件！');
                } else {
                    toastr.error('验证邮件发送失败！');
                }
            },
            error: function () {
                toastr.error('验证邮件发送失败！');
            }
        });
    }

    function updateAccount() {
        var data = {};
        //服务端再与Session中的验证码验证，防止修改html破解
        data['validateCode'] = validateCode;
        data['email'] = $('#account_form').find('input[name="email"]').val();
        data['username'] = $('#account_form').find('input[name="username"]').val();
        if ($('#account_form').find('input[name="confirmpw"]').val() != "") {
            data['password'] = $('#account_form').find('input[name="confirmpw"]').val()
        }
        $.ajax({
            url: "user.do?method=updateAccount",
            type: "POST",
            data: data,
            success: function (data) {
                if (data.flag == 200) {
                    window.location.href = "user.do?method=jumpLogin&username=" + $('#account_form').find('input[name="username"]').val();
                } else {
                    toastr.error(data.info, "保存失败！");
                    console.warn("Error Code: " + data.flag);
                }
            },
            error: function () {
                toastr.error('保存失败！');
                console.log('修改账号信息失败！');
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

    function initMsgForm() {
        $('.folder-list').find('a').click(function () {
            var action = $(this).attr('href');
            action = action.substring(action.lastIndexOf('#'));
            switch (action) {
                case "#unReadMsg":
                    $('#mainForShowMsg').html(temp_unreadHtml);
                    $('#mainForShowMsg').find('.showChatModal_trigger').click(function () {
                        showChatModal(this.getAttribute('uid'));
                    });
                    return true;
                case "#listLetters":
                    $('#mainForShowMsg').html(temp_letterHtml);
                    $('#mainForShowMsg').find('.showChatModal_trigger').click(function () {
                        showChatModal(this.getAttribute('uid'));
                    });
                    break;
                case "#listSysMsgs":
                    $('#mainForShowMsg').html(temp_sysMsgHtml);
                    break;
                default:
                    return true;
            }
        });

        $('#sendLetter_submit').click(function () {
            sendLetter();
        });

        $('#openChatModal').click(function () {
            showChatModal(null);
        });

        setTimeout(function () {
            $('#mainForShowMsg').html(temp_unreadHtml);
            $('#mainForShowMsg').find('.showChatModal_trigger').click(function () {
                showChatModal(this.getAttribute('uid'));
            });
        }, 1200);

        $('#chat_Modal').on("shown.bs.modal", function () {
            //滚动到底部
            //[0]是从jquery中取得原js对象
            $("#currentLetterContent")[0].scrollTop = $("#currentLetterContent")[0].scrollHeight + $("#currentLetterContent").height();
            //$('#currentLetterContent .chat-discussion-end').scrollIntoView(true);
        });

        if ($(window).width() > 768) {
            $('#chat_Modal').find('.modal-dialog').css({
                'margin-top': $(window).height() / 2 - 604 / 2
            });
        }

        $('a[href="#messages"]').click(function () {
            clearSysMsgStatus();
        });

        $('a[href="#listSysMsgs"]').click(function () {
            clearSysMsgStatus();
        });
    }

    var unreadList;
    var temp_unreadHtml;

    function load_unread() {
        $.ajax({
            url: 'user.do?method=listUnreadMsg',
            success: function (data) {
                unreadList = data;
                if (data != null) {
                    var html = '';
                    var count = 0;
                    if (data.letters != null) {
                        var formatLetterList = formatLetter(data.letters);
                        $.each(formatLetterList, function (key, arr) {
                            html += '<tr class="unread"><td class="check-mail"><input type="checkbox" class="i-checks"></td>';
                            html += '<td class="mail-ontact"><a class="showChatModal_trigger" uid="' + arr[0].chatUser.uid + '">' + arr[0].chatUser.nickname + '</a></td>';
                            html += ' <td class="mail-subject"><a>' + arr[0].content.replace(/<img.*?>/g, "[图片]") + '</a></td>';
                            html += '<td class=""><i class="fa fa-paperclip"></i></td>';
                            html += '<td class="text-right mail-date">' + arr[0].send_time + '</td></tr>';

                            $('#newestMsgTime').html(arr[0].send_time);
                        });
                        count += data.letters.length;
                    }
                    if (data.sysMsgs != null) {
                        $(data.sysMsgs).each(function (i, sysMsg) {
                            html += '<tr class="unread"><td class="check-mail"><input type="checkbox" class="i-checks"></td>';
                            html += '<td class="mail-ontact"><a>系统通知</a></td>';
                            html += ' <td class="mail-subject">' + sysMsg.content + '</td>';
                            html += '<td class=""><i class="fa fa-paperclip"></i></td>';
                            html += '<td class="text-right mail-date">' + sysMsg.send_time + '</td></tr>';
                        });
                        count += data.sysMsgs.length;
                    }
                    temp_unreadHtml = html;
                    $('#unReadMsgCount').html(count);
                }
            },
            error: function () {
                console.log('加载未读消息失败！');
            }
        });
    }

    var letterList = [];
    var formatLetterList = {};
    var temp_letterHtml;

    function load_letter() {
        console.log('加载私信消息...');
        $.ajax({
            url: 'user.do?method=listLetters',
            data: {
                'read_status': 1
            },
            success: function (data) {
                LetterList = data;
                if (data != null) {
                    formatLetterList = formatLetter(data);
                    var html = '';
                    $.each(formatLetterList, function (key, arr) {
                        html += '<tr class="unread"><td class="check-mail"><input type="checkbox" class="i-checks"></td>';
                        html += '<td class="mail-ontact"><a class="showChatModal_trigger" uid="' + arr[0].chatUser.uid + '">' + arr[0].chatUser.nickname + '</a></td>';
                        html += ' <td class="mail-subject"><a>' + arr[0].content.replace(/<img.*?>/g, "[图片]") + '</a></td>';
                        html += '<td class=""><i class="fa fa-paperclip"></i></td>';
                        html += '<td class="text-right mail-date">' + arr[0].send_time + '</td></tr>';
                    });
                    temp_letterHtml = html;
                    $('#lettersCount').html(data.length);
                    $('#msgBoxSize').html(data.length);
                }
                console.log('加载私信消息成功！');
                asbChatUserList();
            },
            error: function () {
                console.log('加载私信消息失败！');
            }
        });
    }

    var sysMsgList = [];
    var temp_sysMsgHtml;

    function load_sysMsg() {
        console.log('加载系统消息中...');
        $.ajax({
            url: 'user.do?method=listSysMsgs',
            data: {
                'read_status': 1
            },
            success: function (data) {
                sysMsgList = data;
                if (data != null) {
                    var html = '';
                    $(data).each(function (i, sysMsg) {
                        html += '<tr class="unread"><td class="check-mail"><input type="checkbox" class="i-checks"></td>';
                        html += '<td class="mail-ontact"><a>系统通知</a></td>';
                        html += ' <td class="mail-subject"><a>' + sysMsg.content.replace(/<img.*?>/g, "[图片]") + '</a></td>';
                        html += '<td class=""><i class="fa fa-paperclip"></i></td>';
                        html += '<td class="text-right mail-date">' + sysMsg.send_time + '</td></tr>';
                    });
                    temp_sysMsgHtml = html;
                }
                console.log('加载系统消息成功！');
            },
            error: function () {
                console.log('加载系统消息失败！');
            }
        });
    }

    //将私信列表分类 key为chatuser 的id
    function formatLetter(letterList) {
        var formatLetterList = {};
        $(letterList).each(function (i, letter) {
            if (!(formatLetterList.hasOwnProperty(letter.chatUser.uid))) {
                formatLetterList[letter.chatUser.uid] = [];
                formatLetterList[letter.chatUser.uid].push(letter);
            } else {
                formatLetterList[letter.chatUser.uid].push(letter);
            }
        });
        return formatLetterList;
    }

    function showChatModal(uid) {
        if (uid && !isNaN(uid) && parseInt(uid) > 0) {
            //没有此用户则先加载
            if ($('#chat_uid_' + uid).length <= 0) {
                asbChatUserLetterList(uid);
            } else {
                $('#chat_uid_' + uid).click();
            }
        }
        $('#chat_Modal').modal();
    }

    //组装聊天用户列表
    function asbChatUserList() {
        if (formatLetterList != null) {
            var html = '';
            $.each(formatLetterList, function (key, arr) {
                html += '<div class="chat-user asbChatUserLetterList_trigger" id="chat_uid_' + arr[0].chatUser.uid + '" uid="' + arr[0].chatUser.uid + '">';
                html += '<img class="chat-avatar" src="' + staticPath + arr[0].chatUser.head_photo + '" alt="">';
                html += '<div class="chat-user-name">';
                html += '<a >' + arr[0].chatUser.nickname + '</a>';
                html += ' </div></div>';
            });
            $('#letter_userList').html(html);
            $('#letter_userList').find('.asbChatUserLetterList_trigger').click(function () {
                var uid = this.getAttribute('uid');
                asbChatUserLetterList(uid);
                setAsbChatColor(uid);
            });
        }
    }

    var tempChatUser = null;
    //组装当前消息列表
    function asbChatUserLetterList(chatUid) {
        $('#currentLetterContent').attr("uid", chatUid);
        if (formatLetterList != null) {
            var letterList = formatLetterList[chatUid];
            var html = '';
            if (letterList) {
                var loginUserHeadPath = $('#head_photo').attr('src');
                var loginUserNickname = $('input[name="nickname"]').val();
                //倒序遍历
                for (var i = letterList.length - 1; i >= 0; i--) {
                    var letter = letterList[i];
                    html += '<div class="chat-message-' + (letter.s_uid == $uid ? "right" : "left") + '">';
                    html += '<img class="message-avatar" src="' + (letter.s_uid == $uid ? loginUserHeadPath : (staticPath + letter.chatUser.head_photo) ) + '" alt="">';
                    html += '<div class="message">';
                    html += ' <a class="message-author" target="_blank" href="user.do?method=home&uid=' + letter.s_uid + '">' + (letter.s_uid == $uid ? loginUserNickname : letter.chatUser.nickname) + '</a>';
                    html += '<span class="message-date" >' + letter.send_time + '</span>';
                    html += '<span class="message-content" >' + letter.content + '</span> </div></div>';
                }
                html += '<div class="chat-discussion-end" style="height:0px; overflow:hidden"></div>';
                $('#currentLetterContent').html(html);
                //滚动到底部
                $("#currentLetterContent")[0].scrollTop = $("#currentLetterContent")[0].scrollHeight + $("#currentLetterContent").height();
            } else {
                $('#currentLetterContent').html("");
            }
        }
        if (formatLetterList[chatUid] == undefined && tempChatUser == null) {
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
                    $('#letter_userList').find('.asbChatUserLetterList_trigger').unbind().click(function () {
                        var uid = this.getAttribute('uid');
                        asbChatUserLetterList(uid);
                        setAsbChatColor(uid);
                    });
                    $('#chat_uid_' + chatUser.uid).click();
                    console.log("用户 " + chatUid + " 不存在聊天列表中，请求数据加载成功！ ");
                } else {
                    toastr.error("用户 ：" + chatUid + " 不存在！ ", '提示', {"timeOut": 0});
                }
            });
        }
    }

    //聊天用户列表 点击变色
    function setAsbChatColor(id) {
        $(".chat-user").css('background-color', '#f5f5f5');
        $("#chat_uid_" + id).css('background-color', '#1ab394');
    }

    function sendLetter() {
        var content = $('#sendLetter_area').val();
        var r_uid = $('#currentLetterContent').attr('uid');
        var send_time = ( new Date() ).getTime();
        if (content.length > 0 && r_uid != undefined && r_uid != '') {
            $.ajax({
                url: 'user.do?method=sendLetter',
                type: "POST",
                data: {
                    'content': content,
                    'send_time': send_time,
                    'r_uid': $('#currentLetterContent').attr('uid')
                },
                success: function (data) {
                    if (data.flag == 200) {
                        var letter = {};
                        letter['s_uid'] = $uid;
                        letter['content'] = content;
                        letter['send_time'] = send_time;
                        if (!formatLetterList[r_uid]) {
                            formatLetterList[r_uid] = [];
                        }
                        //从头部插入
                        formatLetterList[r_uid].unshift(letter);
                        $('#chat_uid_' + r_uid).click();
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

    function clearSysMsgStatus() {
        var smids = [];
        $.each(unreadList.sysMsgs, function (i, sysMsg) {
            if (sysMsg.status == 0) {
                smids.push(sysMsg.smid);
            }
        });
        if (smids.length > 0) {
            $.ajax({
                type: "POST",
                url: "site.do?method=clearSysMsgStatus",
                data: {"smids": smids.join()},
                dataType: "json",
                success: function (data) {
                    if (data.flag == 200) {
                        console.log("清除未读系统消息成功！");
                    } else {
                        console.warn("清除未读系统消息失败！" + data.info);
                        console.warn("Error Code: " + data.flag);
                    }
                },
                error: function (xhr, ts) {
                    console.log("Clear msg status found error, Error Code: " + ts);
                }
            });
        }
    }

    function init_setting() {
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
                "blow_up": {
                    "width": 500,
                    "height": 500,
                    "scale": 1.6
                },
                "full_background": false,
                "video_load_mode": "lazyLoad",
                "default_col": {
                    "1200": 4,
                    "940": 3,
                    "520": 3,
                    "400": 2
                },
                "default_size": 40,
                "default_query_size": 520
            },
            "album_page": {
                "full_background": false,
                "default_col": {
                    "1200": 4,
                    "940": 3,
                    "520": 3,
                    "400": 2
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
        settingTab.find('#setting_album_form input[name="setting_blow_up_width"]').val(albumConfig.photo_page.blow_up.width);
        settingTab.find('#setting_album_form input[name="setting_blow_up_height"]').val(albumConfig.photo_page.blow_up.height);
        settingTab.find('#setting_album_form input[name="setting_blow_up_scale"]').val(albumConfig.photo_page.blow_up.scale);
        settingTab.find('#setting_album_form input[name="setting_video_load_mode"]').each(function (i, mode) {
            if (mode.value == albumConfig.photo_page.video_load_mode) {
                $(mode).prop("checked", true);
            }
        });
        settingTab.find('#setting_album_form input[name="setting_default_col_photo_1200"]').val(albumConfig.photo_page.default_col["1200"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_photo_940"]').val(albumConfig.photo_page.default_col["940"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_photo_520"]').val(albumConfig.photo_page.default_col["520"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_photo_400"]').val(albumConfig.photo_page.default_col["400"]);
        settingTab.find('#setting_album_form input[name="setting_default_size_photo"]').val(albumConfig.photo_page.default_size);
        settingTab.find('#setting_album_form input[name="setting_default_query_size"]').val(albumConfig.photo_page.default_query_size);

        // 初始化相册album_page配置
        if (albumConfig.album_page.full_background) {
            settingTab.find('#setting_album_form input[name="setting_full_background_album"][value="true"]').prop("checked", true);
        } else {
            settingTab.find('#setting_album_form input[name="setting_full_background_album"][value="false"]').prop("checked", true);
        }
        settingTab.find('#setting_album_form input[name="setting_default_col_album_1200"]').val(albumConfig.album_page.default_col["1200"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_album_940"]').val(albumConfig.album_page.default_col["940"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_album_520"]').val(albumConfig.album_page.default_col["520"]);
        settingTab.find('#setting_album_form input[name="setting_default_col_album_400"]').val(albumConfig.album_page.default_col["400"]);
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
            config.photo_page.video_load_mode = settingTab.find('#setting_album_form input[name="setting_video_load_mode"]:checked').val();
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
            config.photo_page.default_col["1200"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_photo_1200"]').val());
            config.photo_page.default_col["940"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_photo_940"]').val());
            config.photo_page.default_col["520"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_photo_520"]').val());
            config.photo_page.default_col["400"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_photo_400"]').val());
            config.photo_page.default_size = parseInt(settingTab.find('#setting_album_form input[name="setting_default_size_photo"]').val());
            config.photo_page.default_query_size = parseInt(settingTab.find('#setting_album_form input[name="setting_default_query_size"]').val());
            // album_page
            config.album_page = {};
            config.album_page.full_background = settingTab.find('#setting_album_form input[name="setting_full_background_album"]:checked').val() == "true" ? true : false;
            config.album_page.default_col = {};
            config.album_page.default_col["1200"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_album_1200"]').val());
            config.album_page.default_col["940"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_album_940"]').val());
            config.album_page.default_col["520"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_album_520"]').val());
            config.album_page.default_col["400"] = parseInt(settingTab.find('#setting_album_form input[name="setting_default_col_album_400"]').val());
            config.album_page.default_size = parseInt(settingTab.find('#setting_album_form input[name="setting_default_size_album"]').val());
            common_utils.setLocalConfig("album", config);
            toastr.success("相册配置保存成功！", "", {"progressBar": false});
        });
    }

    /**************** msg end ******************/

    domReady(function () {

        var url = common_utils.parseURL(window.location.href);
        var params = url.params;
        var action = params['action'];
        if (action == "sendLetter") {
            var chatuid = params['chatuid'];
            if (chatuid != undefined && chatuid.length > 0) {
                $('a[href="#messages"]').tab('show');
                setTimeout(function () {
                    showChatModal(chatuid);
                }, 800);
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
                $('a[href="#' + url.hash + '"]').tab('show');
            }
        }

        var hostUserName = document.title.substring(0, document.title.indexOf(" "));
        $('#main_tab_ul a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            // e.target // newly activated tab
            //e.relatedTarget // previous active tab
            //if ( !(action !== undefined && action.length > 0)) {

            history.replaceState(
                null,
                hostUserName + "_" + e.target.innerText + " - ImCODER's 博客",
                location.pathname + "?method=profilecenter&action=" + $(e.target).attr('href').substring(1));
            document.title = hostUserName + "_" + e.target.innerText + " - ImCODER's 博客";
            /*document.location.href = $(e.target).attr('href');
             //document.body.scrollTop = document.documentElement.scrollTop = 0;
             scrollTo(0,0);*/
            //}
        });

        load_profile();

        load_follows($uid);
        load_fans($uid);
        load_friends();

        load_letter();
        load_sysMsg();
        load_unread();

        load_collection();

        initProfileForm();
        initMsgForm();

        initAccountForm();

        init_setting();
    });

});