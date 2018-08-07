<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ page isErrorPage="true" %>
<%
    String path = request.getContextPath();
    String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
    String staticPath = Config.get(ConfigConstants.SITE_CDN_ADDR);
    String cloudPath = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
%>
<%response.setStatus(400); %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>400 - ImCODER's 博客</title>
    <meta name="keywords" content="400 -博客">
    <meta name="description" content="400 -博客">

    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/font-awesome/font-awesome.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.css">

</head>

<body class="gray-bg">
<div class="middle-box text-center animated fadeInDown">
    <h1>400</h1>
    <h3 class="font-bold">提交参数错误</h3>

    <div class="error-desc">
        请检查参数是否正确：）
        <br/>您可以返回主页看看
        <br/>
        <a href="<%=basePath%>" class="btn btn-primary m-t">主页</a>
    </div>
</div>
</body>
</html>
