<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ page import="site.imcoder.blog.setting.Config" %>
<%@ page language="java" pageEncoding="UTF-8" %>
<%
    String path = request.getContextPath();
    String hostPath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
    String basePath = Config.get(ConfigConstants.SITE_ADDR);
%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
    <base href="<%=basePath%>" target="_self">
</head>
<body>
<jsp:forward page="/a/list"></jsp:forward>
</body>
</html>
