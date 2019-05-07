<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ taglib prefix="s" uri="http://www.springframework.org/tags" %>
<%
    String path = request.getContextPath();
    String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
    String staticPath = Config.get(ConfigConstants.SITE_CDN_ADDR);
    String cloudPath = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
    String urlArgs = Config.get(ConfigConstants.SITE_CDN_ADDR_ARGS);
    request.setAttribute("site_icp_record_code", Config.get(ConfigConstants.SITE_ICP_RECORD_CODE));
    request.setAttribute("site_police_record_code", Config.get(ConfigConstants.SITE_POLICE_RECORD_CODE));
    request.setAttribute("site_police_record_number", Config.get(ConfigConstants.SITE_POLICE_RECORD_NUMBER));
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
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="<%=basePath%>" target="_self">
    <title>登录 - ImCoder's 博客</title>
    <meta name="keywords" content="imcoder.site,登录,ImCoder's 博客">
    <meta name="description" content="登录，输入账号密码登录到imcoder.site">

    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/font-awesome/font-awesome.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">
    <%--<link rel="stylesheet" href="<%=staticPath%>css/style.css<%=urlArgs%>">--%>
    <style>
        #toast-container > div {
            opacity: 0.9;
        }

        .toast-message {
            white-space: pre-wrap;
            word-break: break-all;
            line-height: 1.5;
        }

        .toast-message a:hover {
            color: #f8ac59;
            text-decoration: none;
        }

        #toast-container > .toast-success-no-icon {
            background-color: #51A351 !important;
            padding-left: 1.428571em;
        }

        #toast-container > .toast-error-no-icon {
            background-color: #BD362F !important;
            padding-left: 1.428571em;
        }

        #toast-container > .toast-info-no-icon {
            background-color: #2F96B4 !important;
            padding-left: 1.428571em;
        }

        #toast-container > .toast-warning-no-icon {
            background-color: #F89406 !important;
            padding-left: 1.428571em;
        }

        .toast-message img {
            width: 100%;
            margin: 3px 0px;
        }

        /* only-child对text-node不生效 */
        .toast-success-no-icon img:only-child, .toast-error-no-icon img:only-child, .toast-info-no-icon img:only-child, .toast-warning-no-icon img:only-child {
            width: calc(100% + 1.11429em);
            margin: 0.45714em 0 -0.28571em -0.8286em;
        }

        .toast-message img.not-only-img {
            width: 100%;
            margin: 5px 0;
        }

        .toast iframe, .toast video, .toast embed {
            width: 100%;
            margin: 3px 0px;
        }

        @media (min-width: 1537px) {
            body {
                font-size: 14.3px;
            }

            .logo-name {
                letter-spacing: -13px;
            }

            .loginscreen.middle-box {
                width: 300px;
                width: 23.0769231em;
            }

            .middle-box {
                max-width: 30.769em;
                padding-top: 3.0769em;
            }

            .form-control, .single-line {
                font-size: 1.0769em;
            }

            .form-control {
                height: 2.6153em;
            }

            .btn {
                font-size: 1.0769em;
                padding: 0.4615em 0.923em;
            }

            h3.welcome {
                font-size: 1.231em;
            }

            .m-t {
                margin-top: 1.15385em;
            }
        }

        @media (min-width: 1750px) {
            body {
                font-size: 16.25px;
            }
        }

        .form-control:focus,.single-line:focus {
            border-color: #1ab394!important
        }
    </style>
</head>

<body class="gray-bg">

<div class="middle-box text-center loginscreen  animated fadeInDown">
    <div>
        <div>
            <br><br><br>
            <a href="<%=basePath%>" target="_blank"><h1 class="logo-name" style="font-size:1000%;">博客</h1></a>
            <br>
        </div>
        <h3 class="welcome">欢迎使用 blog</h3>

        <form class="m-t" role="form" id="login_form">
            <div class="form-group">
                <!--  <input type="email" class="form-control" placeholder="用户名" required=""> -->
                <input name="identifier" type="text" class="form-control" placeholder="用户名" required="">
            </div>
            <div class="form-group">
                <input name="credential" type="password" class="form-control" placeholder="密码" required="">
                <input name="remember" type="checkbox" checked="checked" style="display: none;">
            </div>
            <button type="button" jumpUrl="<%=basePath%>" class="btn btn-primary block full-width m-b login_submit">登 录</button>
            <p class="text-muted text-center"><a href="#">忘记密码了？</a> | <a href="auth/register">注册一个新账号</a></p>
        </form>
    </div>
</div>

<!-- Bootstrap & Plugins core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="login"></script>
<script>
    if (window.frameElement) {
        if (document.readyState == "complete") {
            window.frameElement.style.height = document.body.scrollHeight + 130 + "px";
        } else {
            window.onload = function () {
                setTimeout(function () {
                    window.frameElement.style.height = document.body.scrollHeight + 130 + "px";
                }, 500);
            }
        }
    }
</script>
</body>
</html>
