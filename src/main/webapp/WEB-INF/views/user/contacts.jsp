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
	<title>联系人页 &nbsp;-CODER's 博客</title>
	<meta name="description" content="" >
	<meta name="keywords" content="" >
	<!-- 引入文件 -->
	<link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/font-awesome/font-awesome.min.css">
    <link rel="stylesheet" href="<%=staticPath%>css/style.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css">
	
</head>

<body background="<%=staticPath%>img/bg-site.png" uid="${loginUser.uid}">
    <div id="first" class="" style="z-index:1000;">
        <div class="carousel-inner">
            <div class="">
                <div class="container">
                    <div class="" style="text-align:center">
                        <br>
                        <h1>**</h1>
                        <p>**</p>
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
                     <li class="active"><a>联系人</a></li>
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
	
<div id="body">
    <div class="container">
        <div class="row">

<!-- 左侧区域  start -->
<div id="main" class="col-md-12 col-sm-12 col-xs-12" role="main">
	<!--  start -->
	<article class="post">
		<section class="post-container">
		
           <!-- Nav tabs -->
            <ul class="nav nav-tabs" role="tablist">
                <li role="presentation"><a href="#follows" role="tab" data-toggle="tab">关注</a></li>
                <li role="presentation"><a href="#fans" role="tab" data-toggle="tab">粉丝</a></li>
                <li role="presentation"><a href="#friends" role="tab" data-toggle="tab">好友</a></li>
            </ul>

            <!-- Tab panes -->
            <div class="tab-content">
                <div role="tabpanel" class="tab-pane" id="follows"></div>
                <div role="tabpanel" class="tab-pane" id="fans"></div>
                <div role="tabpanel" class="tab-pane" id="friends"></div>
            </div>
		
		</section>
	</article>
	
</div><!-- end #main-->
<!-- 左侧 区域  end -->
		</div><!-- end .row -->
    </div>
</div><!-- end #body -->
	
	<div id="goTop" class="" style="bottom: 70px;">
		<div class="arrow"></div>
		<div class="stick"></div>
	</div>

    <!-- login modal start -->
    <div style="margin-top:100px;" class="modal fade" id="login_Modal" tabindex="-1" role="dialog" aria-labelledby="loginModalLabel">
        <div style="width: 350px;" class="modal-dialog" role="document">
            <div class="modal-content animated flipInY">
                <div class="modal-header text-center">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h2 class="modal-title" id="loginModalLabel">登录/<a href="user.do?method=toregister" target="_blank">注册</a></h2>
                </div>
                <form role="form" id="login_form">
                    <div class="modal-body" style="height:200px;">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="email" name="username" class="form-control" placeholder="输入用户名/email">
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" name="password" class="form-control" placeholder="输入密码">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" name="remember">记住我
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>
                        <a class="btn btn-primary login_submit">登录</a>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <!-- login modal end -->

    <footer id="footer" role="contentinfo" class="card">
        <span>© 2016 </span><a href="https://imcoder.site" target="_blank">博客</a>
        <span>，基于 </span><a>Java</a> / <a href="http://www.cnblogs.com/zyw-205520/p/4771253.html" target="_blank">ssm框架</a><span>&nbsp;&nbsp;技术开发</span>
        <span>，ICP证：</span><a href="http://www.miibeian.gov.cn" target="__blank">湘ICP备17002133号</a>
    </footer>
<a id="basePath" href="<%=basePath%>" style="display:none;"></a>
<a id="staticPath" href="<%=staticPath%>" style="display:none;"></a>
<!-- Bootstrap & Plugins core JavaScript -->
<!-- ######################################### -->
<!-- Placed at the end of the document so the pages load faster -->
<script baseUrl="<%=staticPath%>" data-main="<%=staticPath%>js/config.js" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="contact"></script>
<!-- ######################################### -->

<!-- ######################################## -->

</body></html>