/**
 * Created by Jeffrey.Deng on 2018/7/10.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'jquery_steps', 'jquery_validate', 'jquery_validate_messages_zh'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, toastr, $.fn.steps, $.validate, null);
    }
})(function ($, bootstrap, toastr) {

    function register() {
        var data = $('#form').serialize();
        $.ajax({
            url: 'user.do?method=register',
            type: 'POST',
            data: data,
            success: function (data) {
                if (data.flag == 200) {
                    var username = $('#username').val();
                    var a_login = "user.do?method=jumpLogin&username=" + username;
                    $("#span_username").html(username);
                    $('#a_jump').attr("href", a_login);
                    $('#TipsModal').modal();
                    setTimeout(function () {
                        window.location.href = a_login;
                    }, 2000);
                } else {
                    toastr.error(data.info, '注册错误');
                    console.log("Error Code: " + data.flag);
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                toastr.error("注册错误,可能服务器出问题了！", "提示");
            }
        });
    }

    $(document).ready(function () {

        //自定义验证用户名方法
        $.validator.addMethod("checkUsername", function (value, element, params) {
            var errormsg = '';
            var result = true;
            var reg = /^[a-zA-Z\d][\w\.-]{0,20}$/;//正则
            if (value.length > 21 || value.length === 0) {
                errormsg = "长度应在1至20个字符之间";
                result = false;
            } else if (reg.test(value)) {
                $.ajax({
                    url: "user.do?method=checkUsername",
                    async: false,
                    data: {"username": value},
                    success: function (data) {
                        if (data.flag == 200) {
                            errormsg = "该用户名已经被使用了";
                            result = false;
                        } else {
                            result = true;
                        }
                    },
                    error: function () {
                        errormsg = "服务器错误";
                        result = false;
                    }
                });
            } else {
                errormsg = "用户名只能包括字母、数字、横线、下划线、英文句号";
                result = false;
            }
            $.validator.messages.checkUsername = errormsg;
            return this.optional(element) || result;
        });
        //自定义验证邮箱方法
        $.validator.addMethod("checkEmail", function (value, element, params) {
            var errormsg = '';
            var result = true;
            if (value.length > 62) {
                errormsg = "最多只能有62个字符";
                result = false;
            } else {
                $.ajax({
                    url: "user.do?method=checkEmail",
                    async: false,
                    data: {"email": value},
                    success: function (data) {
                        if (data.flag == 200) {
                            errormsg = "该邮箱已经被使用了";
                            result = false;
                        } else {
                            result = true;
                        }
                    },
                    error: function () {
                        errormsg = "服务器错误";
                        result = false;
                    }
                });
            }
            $.validator.messages.checkEmail = errormsg;
            return this.optional(element) || result;
        });
        //初始化
        $("#form").validate({
            errorPlacement: function (error, element) {
                element.before(error);
            },
            rules: {
                username: {
                    required: true,
                    checkUsername: true
                },
                password: {
                    required: true,
                    maxlength: 25
                },
                email: {
                    required: true,
                    email: true,
                    checkEmail: true
                },
                confirm: {
                    equalTo: "#password"
                },
                nickname: {
                    required: true,
                    maxlength: 30
                },
                description: {
                    maxlength: 200
                }
            },
            success: function (label) {
                if ($(label).attr("id") == "username-error")
                    label.html(" 此用户名未被使用 √").addClass("valid");
                if ($(label).attr("id") == "email-error")
                    label.html(" 此邮箱未被使用 √ <i>（邮箱可用来修改密码）</i>").addClass("valid");
            },
            onfocus: true,
            onkeyup: false //关闭防止提交很多ajax
        });
        //step
        $("#form").steps({
            bodyTag: "fieldset",
            onStepChanging: function (event, currentIndex, newIndex) {
                if (currentIndex > newIndex) {
                    return true;
                }
                var form = $(this);
                if (currentIndex < newIndex) {
                    //进入下一页前清除掉下一页由于未填写导致的错误信息
                    $(".body:eq(" + newIndex + ") label.error", form).remove();
                    $(".body:eq(" + newIndex + ") .error", form).removeClass("error");
                }
                form.validate().settings.ignore = ":disabled,:hidden";
                return form.valid();
            },
            onStepChanged: function (event, currentIndex, priorIndex) {
                if (currentIndex === 2 && priorIndex === 3) {
                    $(this).steps("previous");
                }
            },
            onFinishing: function (event, currentIndex) {
                var form = $(this);
                form.validate().settings.ignore = ":disabled";
                return form.valid();
            },
            onFinished: function (event, currentIndex) {
                register();
            }

        });

    });

});
