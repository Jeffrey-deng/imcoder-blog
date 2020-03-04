/**
 * 注册
 * @author Jeffrey.deng
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'globals', 'common_utils', 'jquery_steps', 'jquery_validate', 'jquery_validate_messages_zh'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, toastr, globals, common_utils);
    }
})(function ($, bootstrap, toastr, globals, common_utils) {

    function register(postData) {
        globals.request.post(globals.api.register, postData, true, '注册失败，代码{code}').final(function (data) {
            let username = $('#username').val(), jumpLoginUrl = ('auth/login?identity_type=1&identifier=' + username).toURL(),
                $jumpModal = $('#registerSuccessModal');
            $jumpModal.find('.user-name').text(username);
            $jumpModal.find('.user-jump-link').url('href', jumpLoginUrl);
            $jumpModal.modal();
            setTimeout(function () {
                window.location.href = jumpLoginUrl;
            }, 2000);
        });
    }

    $(document).ready(function () {

        let $form = $('#form');

        // 自定义验证用户名方法
        $.validator.addMethod('checkUsername', function (value, element, params) {
            let errorMessage = '', available = true;
            if (value.length > 21 || value.length === 0) {
                errorMessage = "长度应在1至20个字符之间";
                available = false;
            } else if (/^[0-9]+$/.test(value)) {
                errorMessage = "用户名不能为纯数字";
                available = false;
            } else if (globals.re.username.test(value)) {
                globals.request.ajax({
                    type: 'post',
                    async: false,
                }, globals.api.checkUsernameIsAvailable, {'username': value}, false, ['type']).final(function (type) {
                    if (type == 0) {
                        available = true;
                    } else {
                        errorMessage = "该用户名已经被使用了";
                        available = false;
                    }
                }, function (status, message, type) {
                    errorMessage = type == 1 ? '参数错误~ 有bug' : message;
                    available = false;
                });
            } else {
                errorMessage = "用户名只能包括字母、数字、横线、下划线、英文句号";
                available = false;
            }
            $.validator.messages.checkUsername = errorMessage;
            return this.optional(element) || available;
        });
        // 自定义验证邮箱方法
        $.validator.addMethod('checkEmail', function (value, element, params) {
            let errorMessage = '', available = true;
            if (value.length > 62) {
                errorMessage = "最多只能有62个字符";
                available = false;
            } else {
                globals.request.ajax({
                    type: 'post',
                    async: false,
                }, globals.api.checkEmailIsAvailable, {'email': value}, false, ['type']).final(function (type) {
                    if (type == 0) {
                        available = true;
                    } else {
                        errorMessage = "该邮箱已经被使用了";
                        available = false;
                    }
                }, function (status, message, type) {
                    errorMessage = type == 1 ? '参数错误~ 有bug' : message;
                    available = false;
                });
            }
            $.validator.messages.checkEmail = errorMessage;
            return this.optional(element) || available;
        });

        // 绑定validate
        $form.validate({
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
            success: function ($label) {
                let labelId = $label.attr('id'), availableNotify;
                if (labelId == 'username-error') {
                    availableNotify = ' 此用户名未被使用 √';
                } else if (labelId == 'email-error') {
                    availableNotify = ' 此邮箱未被使用 √ <i>（邮箱可用来修改密码）</i>';
                }
                if (availableNotify) {
                    $label.html(availableNotify).addClass('valid');
                }
            },
            onfocus: true,
            onkeyup: false //关闭防止提交很多ajax
        });

        // 绑定step
        $form.steps({
            bodyTag: "fieldset",
            onStepChanging: function (event, currentIndex, newIndex) {
                if (currentIndex > newIndex) {
                    return true;
                }
                let $form = $(this);
                if (currentIndex < newIndex) {
                    // 进入下一页前清除掉下一页由于未填写导致的错误信息
                    $(".body:eq(' + newIndex + ') label.error", $form).remove();
                    $(".body:eq(' + newIndex + ') .error", $form).removeClass('error');
                }
                $form.validate().settings.ignore = ":disabled,:hidden";
                return $form.valid();
            },
            onStepChanged: function (event, currentIndex, priorIndex) {
                let $form = $(this);
                if (currentIndex === 2 && priorIndex === 3) {
                    $form.steps('previous');
                }
            },
            onFinishing: function (event, currentIndex) {
                let $form = $(this);
                $form.validate().settings.ignore = ":disabled";
                return $form.valid();
            },
            onFinished: function (event, currentIndex) {
                register($form.serialize());
            }
        });

    });

});
