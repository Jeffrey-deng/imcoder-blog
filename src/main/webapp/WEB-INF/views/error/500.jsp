<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ page isErrorPage="true" %>
<%
    String path = request.getContextPath();
    String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
    String staticPath = Config.get(ConfigConstants.SITE_CDN_ADDR);
    String cloudPath = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
%>
<%response.setStatus(500); %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>500 - ImCODER's 博客</title>
    <meta name="keywords" content="500,ImCODER's 博客">
    <meta name="description" content="500,ImCODER's 博客">

    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/font-awesome/font-awesome.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.css">
</head>

<body class="gray-bg">
<div class="middle-box text-center animated fadeInDown">
    <h1>500</h1>
    <h3 class="font-bold">服务器内部错误</h3>

    <div class="error-desc">
        服务器好像出错了...
        <br/>您可以返回主页看看
        <br/>
        <a href="<%=basePath%>" class="btn btn-primary m-t">主页</a>
        <br/><br/>
        <c:if test="${ !empty loginUser && loginUser.userGroup.gid == 1 }">
            <p><code style="white-space: normal;">${pageContext.exception}</code></p>
        </c:if>
    </div>
</div>
</body>
</html>
