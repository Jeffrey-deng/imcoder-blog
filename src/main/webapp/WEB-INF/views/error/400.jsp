<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ page isErrorPage="true" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
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
<%response.setStatus(400); %>
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>400 - ImCoder's 博客</title>
    <meta name="keywords" content="400 -博客">
    <meta name="description" content="400 -博客">

    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/font-awesome/font-awesome.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.min.css<%=urlArgs%>">
    <style>
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
<div class="middle-box text-center animated fadeInDown">
    <h1>400</h1>
    <h3 class="font-bold">提交参数错误</h3>
    <div class="error-desc">
        请检查参数是否正确：）
        <c:choose>
            <c:when test="${not empty errorInfo}">
                <br/>原因：${errorInfo}
            </c:when>
            <c:otherwise>
                <br/>您可以返回主页看看
            </c:otherwise>
        </c:choose>
        <br/>
        <a href="<%=basePath%>" class="btn btn-primary m-t">主页</a>
    </div>
</div>
</body>
</html>
