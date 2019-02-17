<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%
    String path = request.getContextPath();
    String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
    String staticPath = Config.get(ConfigConstants.SITE_CDN_ADDR);
    String cloudPath = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
    String urlArgs = Config.get(ConfigConstants.SITE_CDN_ADDR_ARGS);
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
    <title>重新登录 - ImCoder's 博客</title>
    <meta name="keywords" content="imcoder.site,重新验证密码">
    <meta name="description" content="重新验证密码登录到imcoder.site">

    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/font-awesome/font-awesome.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">
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

        img.img-circle {
            width: 10.15385em;
            height: 10.15385em;
            border-width: 0.4615em;
        }

        @media (min-width: 1537px) {
            body {
                font-size: 14.3px;
            }

            .lock-word {
                top: 8.46154em;
                margin-left: -36.1539em;
            }

            .lockscreen.middle-box {
                width: 15.38461em;
                padding-top: 8.46154em;
            }

            .middle-box {
                max-width: 30.76923em;
            }

            .m-b-md {
                margin-bottom: 1.53846em;
            }

            .form-group {
                margin-bottom: 1.153847em;
            }

            h3 {
                font-size: 1.230769em;
            }

            p {
                margin: 0 0 0.76923em;
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
        }

        @media (min-width: 1750px) {
            body {
                font-size: 16.25px;
            }
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
        <h3>${userAuth.identifier}</h3>
        <p>您需要再次输入密码</p>
        <form id="login_form" method="post" action="user.do?method=login" onsubmit="return false;">
            <div class="form-group">
                <input type="hidden" name="identifier" value="${userAuth.identifier}"/>
                <input type="checkbox" name="remember" checked="checked" style="display: none;">
                <input type="password" name="credential" class="form-control" placeholder="*****" required="">
            </div>
            <button jumpUrl="<%=basePath%>" type="button" class="btn btn-primary block full-width login_submit">登录到blog</button>
        </form>
    </div>
</div>


<!-- Bootstrap & Plugins core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="lockscreen"></script>
</body>
</html>
