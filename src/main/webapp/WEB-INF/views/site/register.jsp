<%@ page language="java" import="java.util.*" pageEncoding="UTF-8" %>
<%@ page import="com.blog.setting.*" %>
<%
    String path = request.getContextPath();
    String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
    String staticPath = Config.get(ConfigConstants.SITE_CDN_ADDR);
    String cloudPath = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
%>
<!DOCTYPE html>
<html>
<head>

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">


    <title>博客注册</title>
    <meta name="keywords" content="imcoder.site博客注册">
    <meta name="description" content="简单几步就可以创建一个imcoder.site账号.账户信息->个人资料->条款->提交">

    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/font-awesome/font-awesome.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/iCheck/custom.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/steps/jquery.steps.css">

</head>

<body class="gray-bg">
<div class="wrapper wrapper-content animated fadeInRight">
    <div class="row">
        <div class="col-sm-12">
            <div class="ibox">
                <div class="ibox-title" align="center">
                    <h3><a href="/">主页</a></h3>
                </div>
                <div class="ibox-content" style="height:500px;">
                    <h2>注册</h2>
                    <p>简单几步就可以创建一个账号</p>

                    <form id="form" action="" class="wizard-big" style="height:500px;">
                        <h1>账户</h1>
                        <fieldset>
                            <h2>账户信息</h2>
                            <div class="row">
                                <div class="col-sm-8">
                                    <div class="form-group">
                                        <label>用户名 *</label>
                                        <input id="username" name="username" type="text" class="form-control required">
                                    </div>
                                    <div class="form-group">
                                        <label>密码 *</label>
                                        <input id="password" name="password" type="password"
                                               class="form-control required">
                                    </div>
                                    <div class="form-group">
                                        <label>确认密码 *</label>
                                        <input id="confirm" name="confirm" type="password"
                                               class="form-control required">
                                    </div>
                                </div>
                                <div class="col-sm-4">
                                    <div class="text-center">
                                        <div style="margin-top: 20px">
                                            <i class="fa fa-sign-in" style="font-size: 180px;color: #e5e5e5 "></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </fieldset>
                        <h1>个人资料</h1>
                        <fieldset style="overflow-y:auto;overflow-x:hidden;height:350px;">
                            <h2>个人资料信息(不带*的可以不填写)</h2>
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <label>Email *</label>
                                        <input id="email" name="email" type="text" class="form-control required email">
                                    </div>
                                    <div class="form-group">
                                        <label>昵称</label>
                                        <input id="nickname" name="nickname" type="text" class="form-control required">
                                    </div>
                                    <div class="form-group">
                                        <label class="" style="margin-bottom:20px;">性别</label><br>
                                        <label class="radio-inline">
                                            <input id="sex_man" checked name="sex" type="radio" value="男" class=""/> 男
                                        </label>
                                        <label class="radio-inline">
                                            <input id="sex_woman" name="sex" type="radio" value="女" class="">女
                                        </label>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <label>qq</label>
                                        <input id="qq" name="qq" type="text" class="form-control">
                                    </div>
                                    <div class="form-group">
                                        <label>自我标语</label>
                                        <input id="description" name="description" type="text" class="form-control">
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        <h1>警告</h1>
                        <fieldset>
                            <div class="text-center" style="margin-top: 120px">
                                <h2>printf("Hello World!\n");</h2>
                            </div>
                        </fieldset>

                        <h1>完成</h1>
                        <fieldset>
                            <h2>条款</h2>
                            <input id="acceptTerms" name="acceptTerms" type="checkbox" class="required">
                            <label for="acceptTerms">我同意注册条款</label>
                        </fieldset>
                    </form>
                </div>
            </div>
        </div>

    </div>
</div>


<!-- Small modal start 成功提示框 -->
<div style="margin-top:170px;" class="modal fade" id="TipsModal" tabindex="-1" role="dialog"
     aria-labelledby="exampleModalLabel">
    <div style="width:400px;" class="modal-dialog" role="document">
        <div class="modal-content animated bounceInRight">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span
                        aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="exampleModalLabel">系统提示</h4>
            </div>
            <div class="modal-body" style="text-align:center;">
                <h3>【<span id="span_username"></span>】,你成功注册了账号!</h3><br>
                <h3>正在跳转...</h3>
            </div>
            <div class="modal-footer">
                <a id="a_jump" href="#" class="btn btn-primary">手动跳转</a>
            </div>
        </div>
    </div>
</div>
<!-- Small modal end -->


<script src="<%=staticPath%>lib/jquery/jquery.min.js"></script>
<script src="<%=staticPath%>lib/bootstrap/bootstrap.min.js"></script>
<script src="<%=staticPath%>lib/toastr/toastr.min.js"></script>
<script src="<%=staticPath%>lib/steps/jquery.steps.min.js"></script>
<script src="<%=staticPath%>lib/validate/jquery.validate.min.js"></script>
<script src="<%=staticPath%>lib/validate/messages_zh.min.js"></script>

<style>
    .wizard > .content > .body label.valid {
        color: #1bb394;
    }
</style>
<script>

    $(document).ready(function () {

        //自定义验证用户名方法
        $.validator.addMethod("checkUsername", function (value, element, params) {
            var errormsg = '';
            var result = true;
            var reg = /^[a-zA-Z\d][\w-]{0,20}$/;//正则
            if (value.length > 22 || value.length === 0) {
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
                errormsg = "用户名只能包括字母、数字、横线、下划线";
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
</script>
</body>


</html>
