<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%@ page import="com.blog.setting.*" %>
<%@ page isErrorPage="true" %>  
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%
String path = request.getContextPath();
String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
String staticPath = Config.get(ConfigConstants.SITE_CDN_ADDR);
String cloudPath = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
%>
<%response.setStatus(403); %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>403 -博客</title>
    <meta name="keywords" content="403 -博客">
    <meta name="description" content="403 -博客">

    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/font-awesome/font-awesome.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.css">

</head>

<body class="gray-bg" uid="${loginUser.uid}">
    <div class="middle-box text-center animated fadeInDown">
        <h1>403</h1>
        <h3 class="font-bold">权限不足</h3>
        <div class="error-desc">
          	你没有查看此页面的权限! <c:if test="${empty loginUser}">如果您认为您有权限，请<a id="login_btn">登录</a>再试</c:if>
            <br/>
            <a href="<%=basePath%>" class="btn btn-primary m-t">主页</a>
        </div>
    </div>
   <!-- Bootstrap & Plugins core JavaScript
================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script baseUrl="<%=staticPath%>" data-main="<%=staticPath%>js/config.js" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="403"></script>
    <!-- ######################################## -->
    <script>
        var login_btn = document.getElementById('login_btn');
        if (login_btn) {
            var encoderUrl = encodeURIComponent(encodeURIComponent(window.location.href));
            login_btn.href = "user.do?method=jumpLogin&continue=" + encoderUrl;
        }
    </script>
</body>
</html>
