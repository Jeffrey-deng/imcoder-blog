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
	<title>${loginUser.nickname}的个人中心&nbsp;-博客</title>
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
                    <h1>${loginUser.nickname}</h1>
                    <p>${loginUser.description}</p>
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
                <li class="active"><a>个人中心</a></li>
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

	<article class="post">
		<section class="post-container">
		
   <!-- Nav tabs -->
	<ul class="nav nav-tabs" role="tablist">
		<li role="presentation" class="active" ><a href="#profile" role="tab" data-toggle="tab">个人资料</a></li>
		<li role="presentation"><a href="#account" role="tab" data-toggle="tab">账户</a></li>
		<li role="presentation"><a href="#friends" role="tab" data-toggle="tab">好友</a></li>
		<li role="presentation"><a href="#follows" role="tab" data-toggle="tab">关注</a></li>
        <li role="presentation"><a href="#fans" role="tab" data-toggle="tab">粉丝</a></li>
		<li role="presentation"><a href="#collections" role="tab" data-toggle="tab">收藏</a></li>
		<li role="presentation"><a href="#messages" role="tab" data-toggle="tab">消息</a></li>
		<li role="presentation"><a href="#settings" role="tab" data-toggle="tab">设置</a></li>
	</ul>

	<!-- Tab panes -->
	<div class="tab-content">
	
	  <!-- profile start -->
	  <div role="tabpanel" class="tab-pane active" id="profile">
	  
        <div class="container-fluid">
        	<br><br>
            <div id="pad-wrapper" class="row">
                <!-- profile left start -->
                <div class="col-sm-3 col-xs-12" style="margin:0 auto;">
                	<h3>头像</h3>
                    <div style="width:100%">
                        <img id='head_photo' db_src="${loginUser.head_photo}" src="<%=staticPath%>${loginUser.head_photo}" style="margin:0px auto;height:200px;width:200px;" class="avatar img-circle" />
                        <input style="margin:0px auto;padding-top:20px;padding-bottom:20px;"type="file" name="file" id="file"/>
                    </div>
                </div>
                <!-- profile left end -->
                
                <!-- profile right start -->
                <div class="col-sm-9 col-xs-12" >
                 <div class="col-sm-10 col-xs-12" >
                 
                	<form  id="profile_form" method="post" class="form-horizontal">
                	   <input type='hidden' id='uid' value='${loginUser.uid }' />
		               <div class="form-group">
		                   <label class="col-sm-2 col-xs-2 control-label">昵称 *</label>
		                   <div class="col-sm-10 col-xs-10">
		                       <input name="nickname" type="text" class="form-control" requried="requried">
		                   </div>
		               </div>
		               <div class="hr-line-dashed"></div>
		               <div class="form-group">
		                   <label class="col-sm-2 col-xs-2 control-label">自我介绍</label>
		                   <div class="col-sm-10 col-xs-10">
		                       <textarea name="description" class="form-control"></textarea>
		                       <span class="help-block m-b-none">显示在个人主页的上端</span>
		                   </div>
		               </div>
		               <div class="hr-line-dashed"></div>
		               <div class="form-group">
		                   <label class="col-sm-2 col-xs-2 control-label">签名</label>
		                   <div class="col-sm-10 col-xs-10">
		                       <textarea name="says" type="text" class="form-control" requried="requried"></textarea>
		                   </div>
		               </div>
		               <div class="hr-line-dashed"></div>
		               <div class="form-group">
		                    <label class="col-sm-2 col-xs-2 control-label">性别</label>
							<label class="radio-inline" style="margin-left:10px;">
							  <input type="radio" name="sex" id="man" value="男" checked="checked"> 男
							</label>
							<label class="radio-inline">
							  <input type="radio" name="sex" id="women" value="女"> 女
							</label>
		               </div>
		               <div class="hr-line-dashed"></div>
		               <div class="form-group">
		               	   <label class="col-sm-2 col-xs-2 control-label">生日</label>
		                   <div class="col-sm-8 col-xs-8 ">
		                       <select class="sel_year select-inline m-b"  rel="2000" name="sel_year">
		                       </select>
		                       <label>年</label>
		                        <select class="sel_month select-inline m-b" rel="1" name="sel_month">
		                       </select>
		                       <label>月</label>
		                       <select class="sel_day select-inline m-b" rel="1" name="sel_day">
		                       </select>
		                       <label>日</label>
		                   </div>
		               </div>
		               <div class="hr-line-dashed"></div>
		               <div class="form-group" id='addresssel'>
		               	   <label class="col-sm-2 col-xs-2 control-label">地址</label>
		                   <div class="col-sm-8 col-xs-8">
		                       <select class="prov select-inline m-b"  name="prov">
		                       </select>
		                       <label>省</label>
		                        <select class="city select-inline m-b" name="city">
		                       </select>
		                       <label>市</label>
		                       <select class="dist select-inline m-b" name="dist">
		                       </select>
		                       <label></label>
		                   </div>
		               </div>
		               <div class="hr-line-dashed"></div>
		               <div class="form-group">
		                   <label class="col-sm-2 col-xs-2 control-label">手机</label>
		                   <div class="col-sm-10 col-xs-10">
		                       <input name="phone" type="text" class="form-control" >
		                   </div>
		               </div>
		               <div class="hr-line-dashed"></div>
		               <div class="form-group">
		                   <label class="col-sm-2 col-xs-2 control-label">QQ</label>
		                   <div class="col-sm-10 col-xs-10">
		                       <input name="qq" type="text" class="form-control">
		                   </div>
		               </div>
		                <div class="hr-line-dashed"></div>
		               <div class="form-group">
		                   <label class="col-sm-2 col-xs-2 control-label">微博</label>
		                   <div class="col-sm-10 col-xs-10 ">
		                       <input name="weibo" type="text" class="form-control">
		                   </div>
		               </div>
		               <div class="hr-line-dashed"></div>
		               <div class="form-group">
		                   <label class="col-sm-2 col-xs-2 control-label">注册时间</label>
		                   <div class="col-sm-10 col-xs-10 ">
		                   	   <span id="register_time" class="help-block m-b-none">2015-2-9 5：25：55</span>
		                   </div>
		               </div>
              
		               <div class="hr-line-dashed"></div>
		               <div class="form-group">
		                   <div class="col-sm-4 pull-right">
		                       <button class="btn btn-primary" type="button" id="submit_profile">保存内容</button>
		                       <span>&nbsp;OR&nbsp;</span>
                               <input type="reset" id="reset_profile" class="btn btn-white reset" value="重置"/>
		                   </div>
		               </div>
           		    </form>
           		    
           		</div>
 			   </div>
               <!-- profile right end -->
	        </div>
	    </div>
	</div>
 	<!-- profile tab end -->
 	
 	<!-- account tab start -->
 	<div role="tabpanel" class="tab-pane" id="account">
		<br><br>
        <div class="col-md-6 col-sm-offset-3">
          	<form  id="account_form" method="post" class="form-horizontal">
            <div class="form-group">
               <label class="col-sm-2 col-xs-2 control-label">邮箱</label>
               <div class="col-sm-7 col-xs-7">
                   <input name="email" type="text" class="form-control" disabled="disabled">
               </div>
               <div class="col-sm-3 col-xs-3">
               	   <span style=""></span>
                   <button class="btn btn-primary" type="button" id="sendValidateMailBtn">发送验证邮件</button>
               </div>
           </div>
           <div class="form-group">
           		<label class="col-sm-2 col-xs-2 control-label">&nbsp;</label>
           		<i class="col-sm-7 col-xs-7">验证邮箱验证码后才能修改</i>
           	</div>
           <div class="hr-line-dashed"></div>
           <div class="form-group">
               <label class="col-sm-2 col-xs-2 control-label">用户名</label>
               <div class="col-sm-7 col-xs-7">
                   <input name="username" type="text" class="form-control" requried="requried" disabled="disabled">
               </div>
                <div class="col-sm-3 col-xs-3">
               	   <span style=""></span>
               </div>
           </div>
            <div class="hr-line-dashed"></div>
           <div class="form-group">
               <label class="col-sm-2 col-xs-2 control-label">新密码</label>
               <div class="col-sm-7 col-xs-7">
                   <input name="newpw" type="password" class="form-control" disabled="disabled">
               </div>
               <div class="col-sm-3 col-xs-3">
               	   <span style=""></span>
               </div>
           </div>
           <div class="hr-line-dashed"></div>
           <div class="form-group">
               <label class="col-sm-2 col-xs-2 control-label">确认密码</label>
               <div class="col-sm-7 col-xs-7">
               	   <input name="confirmpw" type="password" class="form-control" disabled="disabled">
               </div>
               <div class="col-sm-3 col-xs-3">
               	   <span style=""></span>
               </div>
           </div>
        
           <div class="hr-line-dashed"></div>
           <div class="form-group">
               <div class="col-sm-4 col-sm-offset-4 col-xs-8 col-xs-offset-2">
                   <button class="btn btn-primary" type="button" id="submit_account">保存内容</button>
                   <span>&nbsp;OR&nbsp;</span>
                   <input type="reset" id="reset_account" class="btn btn-white reset" value="重置"/>
               </div>
           </div>
           </form>
	    </div>
 	</div>
 	<!-- account tab end -->

	<div role="tabpanel" class="tab-pane" id="friends"></div>
    <div role="tabpanel" class="tab-pane" id="follows"></div>
    <div role="tabpanel" class="tab-pane" id="fans"></div>
    <div role="tabpanel" class="tab-pane" id="collections"></div>

    <!-- messages tab start -->
    <div role="tabpanel" class="tab-pane" id="messages">
    <br>
    <div class="col-sm-3 col-xs-12">
        <div class="ibox float-e-margins">
            <div class="ibox-content mailbox-content">
                <div class="file-manager">
                    <a class="btn btn-block btn-primary compose-mail" href="#" >写信</a>
                    <div class="space-25"></div>
                    <h5>文件夹</h5>
                    <ul class="folder-list m-b-md" style="padding: 0">
                        <li>
                            <a href="#unReadMsg"> <i class="fa fa-inbox "></i>未读消息 <span id="unReadMsgCount" class="label label-warning pull-right">0</span></a>
                        </li>
                        <li>
                            <a href="#listLetters"> <i class="fa fa-envelope-o"></i>私信<span id="lettersCount" class="label label-danger pull-right">0</span></a>
                        </li>
                        <li>
                            <a href="#listSysMsgs"> <i class="fa fa-certificate"></i>系统通知</a>
                        </li>
                        <li>
                            <a href="#listNotices"> <i class="fa fa-certificate"></i>公告</a>
                        </li>
                    </ul>
                    <h5 class="hidden-xs">分类</h5>
                    <ul class="category-list hidden-xs" style="padding: 0">
                        <li>
                            <a href="#"> <i class="fa fa-circle text-navy"></i> 工作</a>
                        </li>
                        <li>
                            <a href="#"> <i class="fa fa-circle text-danger"></i> 文档</a>
                        </li>
                        <li>
                            <a href="#"> <i class="fa fa-circle text-primary"></i> 社交</a>
                        </li>
                        <li>
                            <a href="#"> <i class="fa fa-circle text-info"></i> 广告</a>
                        </li>
                    </ul>

                    <div class="clearfix"></div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-9 col-xs-12 animated fadeInRight">
        <div class="mail-box-header hidden-xs">

            <form method="get" class="pull-right mail-search">
                <div class="input-group">
                    <input type="text" class="form-control input-sm" name="search" placeholder="搜索邮件标题，正文等">
                    <div class="input-group-btn">
                        <button type="submit" class="btn btn-sm btn-primary">
                            搜索
                        </button>
                    </div>
                </div>
            </form>
            <h2>
                收件箱 (<span id="msgBoxSize" >0</span>)
            </h2>
            <div class="mail-tools tooltip-demo m-t-md">
                <div class="btn-group pull-right">
                    <button class="btn btn-white btn-sm"><i class="fa fa-arrow-left"></i>
                    </button>
                    <button class="btn btn-white btn-sm"><i class="fa fa-arrow-right"></i>
                    </button>

                </div>
                <button class="btn btn-white btn-sm" data-toggle="tooltip" data-placement="left" title="刷新邮件列表"><i class="fa fa-refresh"></i> 刷新</button>
                <button class="btn btn-white btn-sm" data-toggle="tooltip" data-placement="top" title="标为已读"><i class="fa fa-eye"></i>
                </button>
                <button class="btn btn-white btn-sm" data-toggle="tooltip" data-placement="top" title="标为重要"><i class="fa fa-exclamation"></i>
                </button>
                <button class="btn btn-white btn-sm" data-toggle="tooltip" data-placement="top" title="标为垃圾邮件"><i class="fa fa-trash-o"></i>
                </button>

            </div>
        </div>
        <div class="mail-box">
            <table class="table table-hover table-mail">
                <%--<style>
                @media (min-width:768px){
                    #mainForShowMsg td {
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                    }}
                </style>--%>
                <tbody id="mainForShowMsg" style="width:100%">
                </tbody>
            </table>
        </div>
     </div>

    </div>
    <!-- messages tab end -->

	  <div role="tabpanel" class="tab-pane" id="settings">...</div>
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
	
	<!--validateMailModal start -->
	<div class="modal fade" id="validateMailModal" tabindex="-1" role="dialog" aria-labelledby="validateMailModalLabel">
		<div style="width:340px;margin-top:180px;" class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
					</button>
					<h4 class="modal-title" id="validateMailModalLabel">验证邮箱</h4>
				</div>
				<div class="modal-body">
					<form method="post" id="validateMailForm" onsubmit="return false;">
						<div class="form-group">
							<label class="control-label">邮箱:(已发送)</label>
							<input type="text" required="required" class="form-control" disabled="disabled" name="email" />
						</div>
						<div class="form-group">
							<label class="control-label">验证码:</label>
							<input type="text" required="required" class="form-control" name="validateCode" />
						</div>
					</form>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-default" data-dismiss="modal">取消</button>
					<button type="submit" id="validateMailBtn" form="validateMailForm" class="btn btn-primary">验证</button>
				</div>
			</div>
		</div>
	</div>
	<!-- validateMailModal end -->
	
	<div class="modal fade" id="chat_Modal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel">
		<div  class="modal-dialog chatpanel" role="document">
			<div class="modal-content animated ">
				<div class="modal-header text-center">
                     <b style="font-family: 'Microsoft YaHei';">聊天窗口</b>
                     <small class="pull-right text-muted">最新消息：<span id="newestMsgTime">无</span></small>
		      	</div>
				<div class="modal-body" style="padding-left:12px;padding-right:12px;padding-bottom:0px;padding-top:0px;">
					<!-- content -->
	                <div class="ibox chat-view"><div class="ibox-content container-fluid">
	                        <div class="row">
	                            <div class="col-sm-9 col-xs-12" >
	                                <div class="chat-discussion" id="currentLetterContent"></div>
	                            </div>
	                            <div class="col-sm-3 col-xs-12" >
	                                <div class="chat-users">
	                                	 <div class="users-list" id="letter_userList"></div>
	                                </div>
	                            </div>
	                 		</div>
	                  		<div class="row" style="padding-top:5px;">
		                      	<div class="form-group">
		                          <div class="col-sm-9 col-xs-12">
		                              <textarea class="form-control message-input" id="sendLetter_area" name="sendLetter_area" placeholder="输入消息内容"></textarea>
		                          </div>
		                          <div class="col-sm-3 col-xs-5 btngroup">
		                              <button type="button" id="sendLetter_cancle" class="btn btn-default" data-dismiss="modal">关闭</button>
								  	  <a id="sendLetter_submit" onclick="" class="btn btn-primary">发送</a>
		                          </div>
			               		</div>
			           		</div>
	               </div></div>
	       		   <!-- content -->
    			</div>
			</div>
		</div>
	</div>


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
<script baseUrl="<%=staticPath%>" data-main="<%=staticPath%>js/config.js" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="profilecenter"></script>

</body></html>