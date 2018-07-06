<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%@ page import="com.blog.setting.*" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jstl/fmt_rt" %>
<%
String path = request.getContextPath();
String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
String staticPath = Config.get(ConfigConstants.SITE_CDN_ADDR);
String cloudPath = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
%>
<!DOCTYPE html>
<html class="no-js">
	<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<meta name="renderer" content="webkit">
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
	<title>用户管理 - Website Administer System</title>
	<meta name="description" content="用户管理 - 博客后台管理中心" >
	<meta name="keywords" content="用户管理 - 博客后台管理中心" >
	<!-- 使用url函数转换相关路径 -->
	<!-- <script async="" src="http://www.google-analytics.com/analytics.js"></script> -->
	
	<!-- 引入文件 -->
	<link rel="icon" href="<%=staticPath%>img/favicon.ico">
	<link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css">
	<link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css">
	<link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.css">
	<link rel="stylesheet" href="<%=staticPath%>css/style.css">
	<link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css">
</head>
<body uid="${loginUser.uid}">
<!-- <body background="../../img/bg-site.png"> -->
	<!-- START THE COVER  background-image: url(img/bg-site.png);" -->
	<div id="first" class="" style="z-index:1000;background-image: url(<%=staticPath%>img/bg-site.png);">
		<div class="carousel-inner">
			<div class="">
				<div class="container">
					<div class="" style="text-align:center">
						<br>
						<h1>Website Administer System</h1>
						<h3 style="color:#444;font-size:16.5px;">用户管理</h3>
					</div>
				</div>
			</div>
		</div><!-- END COVER -->
	</div>

<!-- start #toolbar -->
<nav id="header" class="navbar navbar-default toolbar" role="navigation">
	<div class="container-fluid">
		<div class="navbar-header">
			<div class="navbar-brand">
				<p><a class="logo" style="color: #333;" href="<%=basePath%>">博客Blog</a></p>
			</div>
			<button type="button" class="navbar-toggle collapsed " data-toggle="collapse" data-target="#navbar-collapse" aria-expanded="false">
				<span class="sr-only">Toggle navigation</span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
			</button>
		</div>
		<div class="collapse navbar-collapse hiddenscorll" id="navbar-collapse">
			<ul class="nav navbar-nav">
				<li class="dropdown sitenavigation">
					<a class="dropdown-toggle" data-toggle="dropdown">导航<span class="caret"></span></a>
					<ul class="dropdown-menu " role="menu">
						<div class="row">
							<div class="col-sm-2 rowname">
								<div class="coldesc">分类</div>
							</div>
							<div class="col-sm-1">
								<div class="coldesc"><a href="article.do?method=list&category.atid=0" target="_blank">默认</a></div>
							</div>
							<div class="col-sm-1">
								<div class="coldesc"><a href="article.do?method=list&category.atid=1" target="_blank">开发</a></div>
							</div>
							<div class="col-sm-1">
								<div class="coldesc"><a href="article.do?method=list&category.atid=2" target="_blank">教程</a></div>
							</div>
							<div class="col-sm-1">
								<div class="coldesc"><a href="article.do?method=list&category.atid=3" target="_blank">资源</a></div>
							</div>
							<div class="col-sm-1">
								<div class="coldesc"><a href="article.do?method=list&category.atid=4" target="_blank">科技</a></div>
							</div>
							<div class="col-sm-1">
								<div class="coldesc"><a href="article.do?method=list&category.atid=5" target="_blank">游戏</a></div>
							</div>
							<div class="col-sm-1">
								<div class="coldesc"><a href="article.do?method=list&category.atid=6" target="_blank">段子</a></div>
							</div>
							<div class="col-sm-1">
								<div class="coldesc"><a href="article.do?method=list&category.atid=7" target="_blank">杂谈</a></div>
							</div>
						</div>
						<div class="row">
							<div class="col-sm-2 rowname">
								<div class="coldesc">服务</div>
							</div>
							<div class="col-xs-1	morespace">
								<div class="coldesc"><a class="toolbar_jump_writeblog">写博客</a></div>
							</div>
							<div class="col-xs-1	morespace">
								<div class="coldesc"><a class="toolbar_jump_paste_code" href="http://paste.ubuntu.com" target="_blank">贴代码</a></div>
							</div>
							<div class="col-sm-1	">
								<div class="coldesc"><a class="toolbar_jump_albums" href="<%=basePath%>photo.do?method=user_albums" target="_blank">相册</a></div>
							</div>
							<div class="col-sm-1  ">
								<div class="coldesc"><a class="toolbar_jump_ftp" href="ftp://imcoder.site:21" target="_blank">FTP</a></div>
							</div>
							<div class="col-sm-1">
								<div class="coldesc"><a class="toolbar_jump_login">登录</a></div>
							</div>
							<div class="col-sm-1">
								<div class="coldesc"><a class="toolbar_jump_register" href="user.do?method=toregister" target="_blank">注册</a></div>
							</div>
							<c:if test="${ !empty loginUser && loginUser.userGroup.gid == 1 }">
								<div class="col-sm-1">
									<div class="coldesc"><a class="toolbar_jump_manager" href="manager.do?method=backstage" target="_blank">管理</a></div>
								</div>
							</c:if>
						</div>
						<div class="row">
							<div class="col-sm-2 rowname">
								<div class="coldesc">关于</div>
							</div>
							<div class="col-sm-1">
								<div class="coldesc"><a class="toolbar_jump_notice" target="_blank" href="site.do?method=list">公告</a></div>
							</div>
							<div class="col-sm-1">
								<div class="coldesc"><a class="toolbar_jump_help" target="_blank" href="#">帮助</a></div>
							</div>
							<div class="col-sm-1">
								<div class="coldesc"><a class="toolbar_jump_about" target="_blank" href="<%=basePath%>site.do?method=about">关于</a></div>
							</div>
						</div>
					</ul>
				</li>
				<li><a href="<%=basePath%>">首页</a></li>
				<li class="active"><a>用户管理</a></li>
			</ul>
			<ul class="nav navbar-nav navbar-right">
				<form class="navbar-form navbar-left" role="search">
					<div class="form-group">
						<input type="text" class="search-query form-control span3 toolbar_search_input" style="margin:auto;" name="kw" placeholder="输入关键字搜索">
					</div>
					<button type="button" class="btn-search submit toolbar_search_trigger">搜索</button>
				</form>
				<c:if test="${ !empty loginUser }">
					<li class="dropdown user">
						<a class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
							<img src="<%=staticPath%>${loginUser.head_photo}"/><span class="caret"></span>
						</a>
						<ul class="dropdown-menu">
							<h4><a class="anav-menu_user toolbar_user_profilecenter" href="<%=basePath%>user.do?method=profilecenter" target="_blank">个人中心</a></h4>
							<h4><a class="anav-menu_user toolbar_user_userhome" href="<%=basePath%>user.do?method=home&uid=${loginUser.uid}" target="_blank">我的博客</a></h4>
							<h4><a class="anav-menu_user toolbar_user_albums" href="<%=basePath%>photo.do?method=user_albums&uid=${loginUser.uid}" target="_blank">我的相册</a></h4>
							<h4><a class="anav-menu_user toolbar_user_messages" href="<%=basePath%>user.do?method=profilecenter&action=messages" target="_blank">我的消息</a></h4>
							<h4><a class="anav-menu_user toolbar_user_setting" href="<%=basePath%>user.do?method=profilecenter&action=settings" target="_blank">修改设置</a></h4>
							<h4><a class="anav-menu_user toolbar_user_logout" title="点击退出登录">安全退出</a></h4>
						</ul>
					</li>
				</c:if>
			</ul>
		</div><!-- navbar-collapse end -->
	</div><!-- container-fluid end -->
</nav>
<!-- end #toolbar -->
	
<!-- body start -->
<div id="body">
    <div class="container">
		<div class="row" style=" margin-top: 2em;">

			<div class="col-md-12 col-sm-12 col-xs-12"  >
				<div class="panel panel-primary" id="blog_panel">
					<div class="panel-heading">
						<h3 class="panel-title">用户列表</h3>
					</div>
					<div class="panel-body">
						<p style="margin-left: 3%">目前注册用户有 ${userCount} 位。</p>
					</div>
					<div style="width:100%;overflow:auto;">
						<table class="table table-hover" style="text-align:center;" id="user_tds">
							<thead><tr >
								<th style="text-align:center;">头像</th>
								<th style="text-align:center;">User ID</th>
								<th style="text-align:center;">用户名</th>
								<th style="text-align:center;">用户昵称</th>
								<th style="text-align:center;">注册时间</th>
								<th style="text-align:center;">登录IP</th>
								<th style="text-align:center;">状态</th>
							</tr></thead>
							<c:forEach items="${userList}" var="user" >
								<tbody><tr style="height: 50px;" uid="${user.uid}">
									<td><img src="<%=staticPath%>${user.head_photo}" style="width: 43px;height: 43px;"></td>
									<td><b>${user.uid}</b></td>
									<td>${user.username}</td><td>${user.nickname}</td><td><fmt:formatDate value='${user.register_time}' pattern='yyyy-MM-dd HH:mm'/></td>
									<td>
										<c:if test="${empty  user.loginIP}">暂无IP</c:if>
										<c:if test="${not empty user.loginIP}">${user.loginIP}</c:if>
									</td>
									<td>
										<c:if test="${user.lock_status == 0}">可用</c:if>
										<c:if test="${user.lock_status == 1}"><div style="color:red;">冻结</div></c:if>
									</td>
								</tr></tbody>
							</c:forEach>
						</table>
					</div>
				</div>
			</div>


		</div><!-- end .row -->

    </div>
</div>
<!-- body end -->
<style>
	@media (min-width: 768px){
	#userInfoModal .modal-dialog {
		width:340px;
	}
	}
	@media (max-width:768px){
	#userInfoModal .modal-dialog{
		width:100%;
		margin-left: auto;
		margin-right: auto;
		padding: 10px;
	}
}
</style>
<div class="modal fade" id="userInfoModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel">
	<div class="modal-dialog" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal"
						aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
				<h4 class="modal-title" id="">用户资料</h4>
			</div>
			<div class="modal-body" style="padding-bottom: 10px;">
				<form class="form-horizontal">
					<style>
						#userInfoModal span { text-align:left }
					</style>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label"><img name="head_photo" style="height: 50px;"></label>
						<span class="col-sm-7 col-xs-7 control-label" name="nickname" style="height: 50px;line-height:50px;vertical-align:middle;"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">User ID:</label>
						<span class="col-sm-7 col-xs-7 control-label" name="uid" ></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">用户组:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="usergroup" ></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">用户名:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="username"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">邮箱:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="email"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">性别:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="sex"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">自我介绍:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="description"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">生日:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="birthday"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">地址:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="address"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">手机:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="phone"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">微博:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="weibo"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">QQ:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="qq"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">注册时间:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="register_time"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">文章数:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="articleCount"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">关注数:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="followCount"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">粉丝数:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="fansCount"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">签名:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="says"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">登录IP:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="loginIP"></span>
					</div>
					<div class="form-group">
						<label class="col-sm-4 col-xs-4 control-label">账号状态:</label>
						<span class="col-sm-7 col-xs-7 control-label"  name="lock_status"></span>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>
			</div>
		</div>
	</div>
</div>

<div class="modal fade" tabindex="-1" role="dialog" id="modal_system_status">
	<div class="modal-dialog" role="document" style="margin-top:10%">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				<h4 class="modal-title">重新初始化系统缓存</h4>
			</div>
			<div class="modal-body">
				<p>你确定要从数据库重新加载文章、用户等资料以刷新缓存中的数据吗?</p>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>
				<button type="button" class="btn btn-primary" id="modal_btn_confirm">确定</button>
			</div>
		</div>
	</div>
</div>

	<div id="goTop" class="" style="bottom: 70px;">
		<div class="arrow"></div>
		<div class="stick"></div>
	</div>

<footer id="footer" role="contentinfo" class="card">
	<span>© 2016 </span><a href="https://imcoder.site" target="_blank">博客</a>
	<span>，基于 </span><a>Java</a> / <a href="http://www.cnblogs.com/zyw-205520/p/4771253.html" target="_blank">ssm框架</a><span>&nbsp;&nbsp;技术开发</span>
	<span>，ICP证：</span><a href="http://www.miibeian.gov.cn" target="__blank">湘ICP备17002133号</a>
</footer>

<a id="basePath" href="<%=basePath%>" style="display:none;"></a>
<a id="staticPath" href="<%=staticPath%>" style="display:none;"></a>
<!-- Bootstrap & Plugins core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<script baseUrl="<%=staticPath%>" data-main="<%=staticPath%>js/config.js" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="user_manager"></script>

</body>
</html>