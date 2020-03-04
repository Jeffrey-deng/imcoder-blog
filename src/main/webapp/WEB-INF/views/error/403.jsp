<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ page isErrorPage="true" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib prefix="s" uri="http://www.springframework.org/tags" %>
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
<%response.setStatus(403);%>
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>403 - ImCoder's 博客</title>
    <meta name="keywords" content="403,ImCoder's 博客">
    <meta name="description" content="403,ImCoder's 博客">

    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/font-awesome/font-awesome.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">
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

            .middle-box {
                max-width: 30.76923em;
                padding-top: 3.0769em;
            }

            .middle-box h1 {
                font-size: 13.076923em;
                margin-top: 0.094117647em;
                margin-bottom: 0.04705882em;
            }

            h3 {
                font-size: 1.231em;
                margin-top: 7px;
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
<body class="gray-bg" uid="<c:if test="${not empty loginUser}"><s:eval expression="loginUser.uid"/></c:if>">
<div class="middle-box text-center animated fadeInDown">
    <h1>403</h1>
    <h3 class="font-bold">权限不足</h3>
    <div class="error-desc">
        你没有查看此页面的权限! <c:if test="${empty loginUser}">如果您认为您有权限，请<a id="login_btn">登录</a>再试</c:if>
        <c:if test="${not empty errorInfo}">
            <br/>原因：${errorInfo}
        </c:if>
        <br/>
        <a href="<%=basePath%>" class="btn btn-primary m-t">主页</a>
    </div>
</div>
<a id="basePath" class="site-path-prefix" href="<%=basePath%>" style="display:none;"></a>
<a id="staticPath" class="site-path-prefix" href="<%=staticPath%>" style="display:none;"></a>
<a id="cloudPath" class="site-path-prefix" href="<%=cloudPath%>" style="display:none;"></a>
<!-- Bootstrap & Plugins core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="403"></script>
<!-- ######################################## -->
<script>
    if (window.frameElement) {
        if (!(window.frameElement.className && window.frameElement.className.indexOf('take-over-css') != -1)) {
            if (document.readyState == "complete") {
                window.frameElement.style.height = document.body.scrollHeight + 110 + "px";
            } else {
                window.onload = function () {
                    setTimeout(function () {
                        window.frameElement.style.height = document.body.scrollHeight + 110 + "px";
                    }, 500);
                }
            }
        }
    }
    var login_btn = document.getElementById('login_btn');
    if (login_btn) {
        var encoderUrl = encodeURIComponent(encodeURIComponent(window.location.href));
        login_btn.href = "<%=basePath%>auth/login?continue=" + encoderUrl;
    }
</script>
</body>
</html>
