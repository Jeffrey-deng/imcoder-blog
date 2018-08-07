<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
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

    <title>注册 - ImCODER's 博客</title>
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

    <style>
        .wizard > .content > .body label.valid {
            color: #1bb394;
        }
    </style>

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

<script baseUrl="<%=staticPath%>" data-main="<%=staticPath%>js/config.js" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="register"></script>

</body>


</html>
