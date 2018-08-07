<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%
    String path = request.getContextPath();
    String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
    String staticPath = Config.get(ConfigConstants.SITE_CDN_ADDR);
    String cloudPath = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
%>
<%
    Object http_code = request.getAttribute("http_code");
    if (http_code != null) {
        response.setStatus((int) http_code);
    } else {
        response.setStatus(401);
    }
%>
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>重新登录 - ImCODER's 博客</title>
    <meta name="keywords" content="imcoder.site,重新验证密码">
    <meta name="description" content="重新验证密码登录到imcoder.site">

    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/font-awesome/font-awesome.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css">
    <style>
        .toast-success-no-icon {
            background-color: #51A351 !important;
        }

        .toast-error-no-icon {
            background-color: #BD362F !important;
        }

        .toast-info-no-icon {
            background-color: #2F96B4 !important;
        }

        .toast-warning-no-icon {
            background-color: #F89406 !important;
        }
    </style>
</head>

<body class="gray-bg">

<div class="lock-word animated fadeInDown">
</div>
<div class="middle-box text-center lockscreen animated fadeInDown">
    <div>
        <div class="m-b-md">
            <img alt="image" class="img-circle circle-border" src="<%=staticPath%>${user.head_photo}"/>
        </div>
        <h3>${user.username}</h3>
        <p>您需要再次输入密码</p>
        <form id="login_form" method="post" action="user.do?method=login" onsubmit="return false;">
            <div class="form-group">
                <input type="hidden" name="username" value="${user.username}"/>
                <input type="checkbox" name="remember" checked="checked" style="display: none;">
                <input type="password" name="password" class="form-control" placeholder="*****" required="">
            </div>
            <button jumpUrl="<%=basePath%>" type="button" class="btn btn-primary block full-width login_submit">登录到blog</button>
        </form>
    </div>
</div>


<!-- Bootstrap & Plugins core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<script baseUrl="<%=staticPath%>" data-main="<%=staticPath%>js/config.js" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="lockscreen"></script>
</body>
</html>
