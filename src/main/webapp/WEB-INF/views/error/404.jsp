<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%@ page import="com.blog.setting.*" %>
<%@ page isErrorPage="true" %>  
<%
String path = request.getContextPath();
String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
String staticPath = Config.get(ConfigConstants.SITE_CDN_ADDR);
String cloudPath = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
%>
<%response.setStatus(404); %>
<!DOCTYPE html>
<html>
<head>

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">


    <title>404 -博客</title>
    <meta name="keywords" content="404 -博客">
    <meta name="description" content="404 -博客">

    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/font-awesome/font-awesome.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.css">
</head>

<body class="gray-bg">
    <div class="middle-box text-center animated fadeInDown">
        <h1>404</h1>
        <h3 class="font-bold">页面未找到！</h3>

        <div class="error-desc">
            	抱歉，页面好像去火星了~
            <form class="form-inline m-t" role="form" method="get" action="<%=basePath%>article.do">
                <div class="form-group">
					<input name="method" type="hidden" value="list">
                    <input name="title" type="text" class="form-control" placeholder="请输入您需要查找的内容 …">
                </div>
                <button type="submit" class="btn btn-primary">搜索</button>
            </form>
        </div>
    </div>
</body>
</html>
