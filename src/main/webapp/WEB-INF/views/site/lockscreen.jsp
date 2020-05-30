<%@ taglib prefix="s" uri="http://www.springframework.org/tags" %>
<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%
    String path = request.getContextPath();
    String hostPath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
    String basePath = Config.get(ConfigConstants.SITE_ADDR);
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
    <title>重新登录 - ImCoder's 博客</title>
    <meta name="keywords" content="imcoder.site,重新验证密码">
    <meta name="description" content="重新验证密码登录到imcoder.site">

    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/font-awesome/font-awesome.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">
    <style>

        /* site-background start */
        .site-background-wrap {
            position: relative;
            z-index: -1;
        }

        .site-background {
            top: 0px;
        }

        .site-background-canvas {
            position: fixed;
            width: 100%;
            height: 100%;
            top: 0px;
            background-color: rgb(0, 0, 0);
        }

        .site-background-canvas-image {
            position: absolute;
            background-size: cover;
            background-position: center center;
            background-repeat: no-repeat;
            top: 0px;
            width: 100%;
            height: 100%;
            opacity: 1;
        }

        .site-background-canvas-video-wrap {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
        }

        .site-background-canvas-video-wrap video {
            position: absolute;
            opacity: 1;
            left: 0px;
            top: -66px;
        }

        .site-background-canvas-video-poster-wrap {
            position: absolute;
            width: 100%;
            height: 100%;
            opacity: 0;
            top: 0px;
            left: 0px;
        }

        .site-background-canvas-video-poster-wrap img {
            object-position: 50% 50%;
            object-fit: cover;
        }

        .site-background-canvas-overlay {
            position: absolute;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(38, 94, 118, 0.15);
        }

        /* site-background end */

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

    <!-- 修复某些移动端浏览器设置UA为PC，页面仍显示手机版的问题 -->
    <script>
        if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) && (window.screen.availWidth <= 768 || window.screen.availHeight <= 768) && window.devicePixelRatio >= 2) {
            var viewport = document.querySelector("meta[name=viewport]")
                ,content = viewport.getAttribute('content');
            viewport.setAttribute('content', content.replace(/(initial-scale=).*?(,|$)/, '$1' + (1 / window.devicePixelRatio) + '$2'));
        }
    </script>
</head>

<body class="gray-bg">

<div class="lock-word animated fadeInDown">
</div>
<div class="middle-box text-center lockscreen animated fadeInDown">
    <div>
        <div class="m-b-md">
            <img alt="image" class="img-circle circle-border" src="<s:eval expression="user.head_photo"/>"/>
        </div>
        <h3>${userAuth.identifier}</h3>
        <p>您需要再次输入密码</p>
        <form id="login_form" method="post" onsubmit="return false;">
            <div class="form-group">
                <input type="hidden" name="identifier" value="${userAuth.identifier}"/>
                <input type="checkbox" name="remember" checked="checked" style="display: none;">
                <input type="password" name="credential" class="form-control" placeholder="*****" required="">
            </div>
            <button jumpUrl="<%=basePath%>" type="button" class="btn btn-primary block full-width login_submit">登录到blog</button>
        </form>
    </div>
</div>

<div id="site_background_wrap" class="site-background-wrap">
    <div class="site-background">
        <div class="site-background-canvas">
            <div class="site-background-canvas-image" style="background-image: url('<%=staticPath%>img/site_background_canvas_image.webp');"></div>
            <div class="site-background-canvas-video-wrap">
                <video class="site-background-canvas-video" src="<%=staticPath%>media/site_background_canvas_video.mp4" role="presentation" preload="auto" playsinline="" loop="" muted="" autoplay="true"></video>
            </div>
            <div class="site-background-canvas-overlay" style="background-image: url('<%=staticPath%>img/site_background_canvas_overlay.png');"></div>
        </div>
    </div>
</div>

<a id="basePath" class="site-path-prefix" href="<%=basePath%>" style="display:none;"></a>
<a id="staticPath" class="site-path-prefix" href="<%=staticPath%>" style="display:none;"></a>
<a id="cloudPath" class="site-path-prefix" href="<%=cloudPath%>" style="display:none;"></a>
<!-- Bootstrap & Plugins core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="lockscreen"></script>
</body>
</html>
