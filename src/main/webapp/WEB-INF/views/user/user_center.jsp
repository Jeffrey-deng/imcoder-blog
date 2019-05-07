<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jstl/fmt_rt" %>
<%@ taglib prefix="s" uri="http://www.springframework.org/tags" %>
<%
    String path = request.getContextPath();
    String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
    String staticPath = Config.get(ConfigConstants.SITE_CDN_ADDR);
    String cloudPath = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
    String urlArgs = Config.get(ConfigConstants.SITE_CDN_ADDR_ARGS);
    request.setAttribute("site_icp_record_code", Config.get(ConfigConstants.SITE_ICP_RECORD_CODE));
    request.setAttribute("site_police_record_code", Config.get(ConfigConstants.SITE_POLICE_RECORD_CODE));
    request.setAttribute("site_police_record_number", Config.get(ConfigConstants.SITE_POLICE_RECORD_NUMBER));
%>
<!DOCTYPE html>
<html class="no-js">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="renderer" content="webkit">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
    <base href="<%=basePath%>" target="_self">
    <title>${loginUser.nickname}的个人中心 - ImCoder's 博客</title>
    <meta name="description" content="${loginUser.nickname}的个人中心">
    <meta name="keywords" content="个人中心">
    <!-- 引入文件 -->
    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css<%=urlArgs%>">
    <%--<link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.min.css<%=urlArgs%>">--%>
    <link rel="stylesheet" href="<%=staticPath%>lib/font-awesome/font-awesome.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/cropper/cropper.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/cropper/ImgCropping.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>css/style.css<%=urlArgs%>">

    <style>
        @media (min-width: 768px) {
            .help-block {
                margin-top: 0px;
                padding-top: 0.5em;
            }
        }
    </style>
</head>

<body background="<%=staticPath%>img/bg-site.png" uid="<c:if test="${not empty loginUser}"><s:eval expression="loginUser.uid"/></c:if>">

<div id="first" class="" style="z-index:1000;">
    <div class="carousel-inner">
        <div class="">
            <div class="container">
                <div class="" style="text-align:center">
                    <h1 class="slogan_name" data-user-id="<s:eval expression="loginUser.uid"/>">${loginUser.nickname}</h1>
                    <h3 class="slogan_desc">${loginUser.description}</h3>
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
                <p><a class="logo" style="color: #333;" href="<%=basePath%>">ImCoder</a></p>
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
                                <div class="coldesc"><a href="a/list?category.atid=0" target="_blank">默认</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a href="a/list?category.atid=1" target="_blank">开发</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a href="a/list?category.atid=2" target="_blank">折腾</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a href="a/list?category.atid=3" target="_blank">资源</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a href="a/list?category.atid=4" target="_blank">科技</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a href="a/list?category.atid=5" target="_blank">游戏</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a href="a/list?category.atid=6" target="_blank">段子</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a href="a/list?category.atid=7" target="_blank">杂谈</a></div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-sm-2 rowname">
                                <div class="coldesc">服务</div>
                            </div>
                            <div class="col-xs-1 morespace">
                                <div class="coldesc"><a class="toolbar_jump_writeblog">写博客</a></div>
                            </div>
                            <div class="col-xs-1 morespace">
                                <div class="coldesc"><a class="toolbar_jump_paste_code" href="http://paste.ubuntu.com" target="_blank">贴代码</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a class="toolbar_jump_albums" href="<%=basePath%>p/dashboard" target="_blank">相册</a></div>
                            </div>
                            <div class="col-sm-1" style="padding-left: 5px">
                                <div class="coldesc"><a class="toolbar_jump_cloud" href="<%=cloudPath%>" target="_blank">cloud</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a class="toolbar_jump_archives" href="<%=basePath%>a/archives" target="_blank">归档</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a class="toolbar_jump_tags" href="<%=basePath%>a/tags" target="_blank">标签</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a class="toolbar_jump_user_history" href="<%=basePath%>u/history" target="_blank">历史</a></div>
                            </div>
                            <c:if test="${ (!empty loginUser) && loginUser.userGroup.isManager() }">
                                <div class="col-sm-1">
                                    <div class="coldesc"><a class="toolbar_jump_manager" href="manager/backstage" target="_blank">管理</a></div>
                                </div>
                            </c:if>
                        </div>
                        <div class="row">
                            <div class="col-sm-2 rowname">
                                <div class="coldesc">站点</div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a class="toolbar_jump_login">登录</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a class="toolbar_jump_register" href="auth/register" target="_blank">注册</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a class="toolbar_jump_notice" target="_blank" href="notices">公告</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a class="toolbar_jump_help" target="_blank" href="help">帮助</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a class="toolbar_jump_about" target="_blank" href="<%=basePath%>about">关于</a></div>
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
                            <img src="<s:eval expression="loginUser.head_photo"/>"/><span class="caret"></span>
                        </a>
                        <ul class="dropdown-menu">
                            <h4><a class="anav-menu_user toolbar_user_profilecenter" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/center" target="_blank">个人中心</a></h4>
                            <h4><a class="anav-menu_user toolbar_user_userhome" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/home" target="_blank">我的博客</a></h4>
                            <h4><a class="anav-menu_user toolbar_user_albums" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/albums" target="_blank">我的相册</a></h4>
                            <h4><a class="anav-menu_user toolbar_user_videos" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/videos" target="_blank">我的视频</a></h4>
                            <h4><a class="anav-menu_user toolbar_user_messages" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/center/messages" target="_blank">我的消息</a></h4>
                            <h4><a class="anav-menu_user toolbar_user_setting" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/center/settings" target="_blank">修改设置</a></h4>
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
                        <ul class="nav nav-tabs" role="tablist" id="main_tab_ul">
                            <li role="presentation" class="active"><a href="#profile" role="tab" data-toggle="tab">个人资料</a></li>
                            <li role="presentation"><a href="#account" role="tab" data-toggle="tab">账户</a></li>
                            <li role="presentation"><a href="#friends" role="tab" data-toggle="tab">好友</a></li>
                            <li role="presentation"><a href="#followings" role="tab" data-toggle="tab">关注</a></li>
                            <li role="presentation"><a href="#followers" role="tab" data-toggle="tab">粉丝</a></li>
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
                                                <img id="head_photo" data-head-photo="${loginUser.head_photo}" src="<s:eval expression="loginUser.head_photo"/>" class="avatar img-circle profile-head-photo"/>
                                                <div class="profile-head-photo-upload-trigger-area">
                                                    <div class="profile-head-photo-upload-trigger-modal">上传头像</div>
                                                </div>
                                            </div>
                                        </div>
                                        <!-- profile left end -->

                                        <!-- profile right start -->
                                        <div class="col-sm-9 col-xs-12">
                                            <div class="col-sm-10 col-xs-12">

                                                <form id="profile_form" method="post" class="form-horizontal">
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">UID</label>
                                                        <div class="col-sm-10 col-xs-10">
                                                            <span class="help-block m-b-none" id="user-long-id" name="uid" style="display: inline-block;cursor: pointer;" title="长码"><s:eval expression="loginUser.uid"/></span>&nbsp;&nbsp;/&nbsp;&nbsp;
                                                            <span class="help-block m-b-none" id="user-short-id" style="display: inline-block;cursor: pointer;" title="短码"></span>
                                                        </div>
                                                    </div>
                                                    <div class="hr-line-dashed"></div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">昵称</label>
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
                                                    <div class="form-group" id="birthday_group">
                                                        <label class="col-sm-2 col-xs-2 control-label">生日</label>
                                                        <div class="col-sm-8 col-xs-8 ">
                                                            <select class="sel_year select-inline m-b" rel="2000" name="sel_year">
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
                                                    <div class="form-group" id="address_group">
                                                        <label class="col-sm-2 col-xs-2 control-label">地址</label>
                                                        <div class="col-sm-8 col-xs-8">
                                                            <select class="prov select-inline m-b" name="prov">
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
                                                            <input name="phone" type="text" class="form-control">
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
                                                        <label class="col-sm-2 col-xs-2 control-label">主页</label>
                                                        <div class="col-sm-10 col-xs-10 ">
                                                            <input name="site" type="text" class="form-control">
                                                        </div>
                                                    </div>
                                                    <div class="hr-line-dashed"></div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">注册时间</label>
                                                        <div class="col-sm-10 col-xs-10 ">
                                                            <span id="register_time" class="help-block m-b-none"></span>
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
                                    <form id="account_form" method="post" class="form-horizontal">
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
                                            <label class="col-sm-2 col-xs-2 control-label">IP地址</label>
                                            <div class="col-sm-7 col-xs-7">
                                                <span id="login_ip" class="help-block m-b-none"></span>
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
                            <div role="tabpanel" class="tab-pane" id="followings"></div>
                            <div role="tabpanel" class="tab-pane" id="followers"></div>
                            <div role="tabpanel" class="tab-pane" id="collections"></div>

                            <!-- messages tab start -->
                            <div role="tabpanel" class="tab-pane" id="messages">
                                <br>
                                <div class="col-sm-3 col-xs-12">
                                    <div class="ibox float-e-margins">
                                        <div class="ibox-content mailbox-content">
                                            <div class="file-manager">
                                                <a class="btn btn-block btn-primary compose-mail" id="openChatModal">写信</a>
                                                <div class="space-25"></div>
                                                <h5>文件夹</h5>
                                                <ul class="folder-list m-b-md" style="padding: 0">
                                                    <li>
                                                        <a action="listUnreadMsg"> <i class="fa fa-inbox "></i>未读消息 <span id="unReadMsgCount" class="label label-warning pull-right">0</span></a>
                                                    </li>
                                                    <li>
                                                        <a action="listLetters"> <i class="fa fa-envelope-o"></i>私信<span id="letterCount" class="label label-danger pull-right">0</span></a>
                                                    </li>
                                                    <li>
                                                        <a action="listSysMsgs"> <i class="fa fa-certificate"></i>系统通知<span id="sysMsgCount" class="label label-success pull-right">0</span></a>
                                                    </li>
                                                    <li>
                                                        <a action="listNotices"> <i class="fa fa-certificate"></i>公告</a>
                                                    </li>
                                                </ul>
                                                <h5 class="hidden-xs">分类</h5>
                                                <ul class="category-list hidden-xs" style="padding: 0">
                                                    <li>
                                                        <a action=""> <i class="fa fa-circle text-navy"></i> 工作</a>
                                                    </li>
                                                    <li>
                                                        <a action=""> <i class="fa fa-circle text-danger"></i> 文档</a>
                                                    </li>
                                                    <li>
                                                        <a action=""> <i class="fa fa-circle text-primary"></i> 社交</a>
                                                    </li>
                                                    <li>
                                                        <a action=""> <i class="fa fa-circle text-info"></i> 广告</a>
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
                                                <input type="text" class="form-control input-sm" name="search" placeholder="搜索消息标题，正文等">
                                                <div class="input-group-btn">
                                                    <button type="submit" class="btn btn-sm btn-primary">
                                                        搜索
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                        <h2>
                                            收件箱 (<span id="msgBoxSize">0</span>)
                                        </h2>
                                        <div class="mail-tools tooltip-demo m-t-md">
                                            <div class="btn-group pull-right">
                                                <button class="btn btn-white btn-sm"><i class="fa fa-arrow-left"></i></button>
                                                <button class="btn btn-white btn-sm"><i class="fa fa-arrow-right"></i></button>
                                            </div>
                                            <button id="refreshMessageListBtn" class="btn btn-white btn-sm" data-toggle="tooltip" data-placement="left" title="刷新消息列表"><i class="fa fa-refresh"></i> 刷新</button>
                                            <button id="batchClearMessageStatusBtn" class="btn btn-white btn-sm" data-toggle="tooltip" data-placement="top" title="批量标为已读消息"><i class="fa fa-eye"></i></button>
                                            <button id="batchDeleteMessageBtn" class="btn btn-white btn-sm" data-toggle="tooltip" data-placement="top" title="批量删除消息"><i class="fa fa-trash-o"></i></button>
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
                                            <tbody id="messageDashboardMain" style="width:100%">
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>
                            <!-- messages tab end -->

                            <div role="tabpanel" class="tab-pane" id="settings">
                                <div class="tabs-container col-md-12 col-sm-12 col-xs-12 col-sm-offset-0" style="margin-top: 30px;margin-bottom: 30px;">
                                    <div class="tabs-left">
                                        <!-- Nav tabs -->
                                        <ul class="nav nav-tabs" role="tablist">
                                            <li role="presentation" class="active"><a href="#setting_account" role="tab" data-toggle="tab">账号</a></li>
                                            <li role="presentation"><a href="#setting_article" role="tab" data-toggle="tab">文章</a></li>
                                            <li role="presentation"><a href="#setting_login" role="tab" data-toggle="tab">登录</a></li>
                                            <li role="presentation"><a href="#setting_album" role="tab" data-toggle="tab">相册</a></li>
                                        </ul>
                                        <!-- Tab panes -->
                                        <div class="tab-content col-xs-8">
                                            <div role="tabpanel" class="tab-pane active" id="setting_account">
                                                <form id="setting_account_form" method="post" class="form-horizontal">
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">接收通知邮件</label>
                                                        <label class="radio-inline col-sm-1 col-xs-1" style="margin-left:40px;">
                                                            <input type="radio" name="setting_receive_notify_email" value="true" checked="checked"> 接收
                                                        </label>
                                                        <label class="radio-inline col-sm-1 col-xs-1">
                                                            <input type="radio" name="setting_receive_notify_email" value="false"> 拒收
                                                        </label>
                                                    </div>
                                                    <div class="hr-line-dashed"></div>
                                                    <div class="form-group">
                                                        <div class="col-sm-4 col-sm-offset-6">
                                                            <button class="btn btn-primary" type="button" id="submit_setting_account" name="setting_submit">保存内容</button>
                                                            <span>&nbsp;OR&nbsp;</span>
                                                            <input type="reset" id="reset_setting_account" class="btn btn-white reset" value="重置"/>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                            <div role="tabpanel" class="tab-pane" id="setting_article">
                                                <form id="setting_article_form" method="post" class="form-horizontal">
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">详情页侧边栏</label>
                                                        <label class="radio-inline col-sm-1 col-xs-1" style="margin-left:40px;">
                                                            <input type="radio" name="setting_full_screen" value="false" checked="checked"> 显示
                                                        </label>
                                                        <label class="radio-inline col-sm-1 col-xs-1">
                                                            <input type="radio" name="setting_full_screen" value="true"> 隐藏
                                                        </label>
                                                    </div>
                                                    <div class="hr-line-dashed"></div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">全覆盖背景</label>
                                                        <label class="radio-inline col-sm-1 col-xs-1" style="margin-left:40px;">
                                                            <input type="radio" name="setting_full_background_article" value="true" checked="checked"> 全屏
                                                        </label>
                                                        <label class="radio-inline col-sm-1 col-xs-1">
                                                            <input type="radio" name="setting_full_background_article" value="false"> 不全屏
                                                        </label>
                                                    </div>
                                                    <div class="form-group">
                                                        <div class="col-sm-4 col-sm-offset-6">
                                                            <button class="btn btn-primary" type="button" id="submit_setting_article" name="setting_submit">保存内容</button>
                                                            <span>&nbsp;OR&nbsp;</span>
                                                            <input type="reset" id="reset_setting_article" class="btn btn-white reset" value="重置"/>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                            <div role="tabpanel" class="tab-pane" id="setting_login">
                                                <form id="setting_login_form" method="post" class="form-horizontal">
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">默认勾选记住登陆</label>
                                                        <label class="radio-inline col-sm-1 col-xs-1" style="margin-left:40px;">
                                                            <input type="radio" name="setting_remember_default_check" value="true" checked="checked"> 勾选
                                                        </label>
                                                        <label class="radio-inline col-sm-1 col-xs-1">
                                                            <input type="radio" name="setting_remember_default_check" value="false"> 不勾选
                                                        </label>
                                                    </div>
                                                    <div class="hr-line-dashed"></div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">记住登录保存期限</label>
                                                        <div class="col-sm-3 col-xs-4" style="margin-left:20px;">
                                                            <input name="setting_remember_expires" class="col-sm-12 col-xs-12">
                                                        </div>
                                                        <label class="col-sm-2 col-xs-3 control-label inline" style="text-align: left;font-weight: normal;padding-left:0px;">天</label>
                                                    </div>
                                                    <div class="hr-line-dashed"></div>
                                                    <div class="form-group">
                                                        <div class="col-sm-4 col-sm-offset-6">
                                                            <button class="btn btn-primary" type="button" id="submit_setting_login" name="setting_submit">保存内容</button>
                                                            <span>&nbsp;OR&nbsp;</span>
                                                            <input type="reset" id="reset_setting_login" class="btn btn-white reset" value="重置"/>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                            <div role="tabpanel" class="tab-pane" id="setting_album">
                                                <form id="setting_album_form" method="post" class="form-horizontal">
                                                    <div class="form-group">
                                                        <a href="p/dashboard?model=photo" target="_blank" style="color:#444;">
                                                            <label class="col-sm-2 col-xs-2 control-label" style="font-weight: normal;text-decoration:underline;cursor:pointer;">照片页面</label>
                                                        </a>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">全覆盖背景</label>
                                                        <label class="radio-inline col-sm-1 col-xs-1" style="margin-left:40px;">
                                                            <input type="radio" name="setting_full_background_photo" value="true" checked="checked"> 全屏
                                                        </label>
                                                        <label class="radio-inline col-sm-1 col-xs-1">
                                                            <input type="radio" name="setting_full_background_photo" value="false"> 不全屏
                                                        </label>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label" title="打开的照片列表时是否加载压缩的照片">照片预览压缩</label>
                                                        <label class="radio-inline col-sm-1 col-xs-1" style="margin-left:40px;" title="压缩">
                                                            <input type="radio" name="setting_photo_preview_compress" value="true" checked="checked"> 压缩
                                                        </label>
                                                        <label class="radio-inline col-sm-1 col-xs-1" title="显示原图">
                                                            <input type="radio" name="setting_photo_preview_compress" value="false"> 原图
                                                        </label>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">放大镜</label>
                                                        <div class="col-sm-10 col-xs-10">
                                                            <label class="control-label col-sm-1 col-xs-6">宽度</label>
                                                            <input class="inline col-sm-1 col-xs-6" name="setting_blow_up_width">
                                                            <label class="control-label col-sm-1 col-xs-6">高度</label>
                                                            <input class="inline col-sm-1 col-xs-6" name="setting_blow_up_height">
                                                            <label class="control-label col-sm-1 col-xs-6">倍率</label>
                                                            <input class="inline col-sm-1 col-xs-6" name="setting_blow_up_scale">
                                                        </div>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">视频插件加载模式</label>
                                                        <label class="radio-inline col-sm-1 col-xs-4" style="margin-left:40px;">
                                                            <input type="radio" name="setting_video_load_mode" value="lazyLoad" checked="checked"> lazyLoad
                                                        </label>
                                                        <label class="radio-inline col-sm-1 col-xs-4">
                                                            <input type="radio" name="setting_video_load_mode" value="preLoad"> preLoad
                                                        </label>
                                                        <label class="radio-inline col-sm-1 col-xs-4">
                                                            <input type="radio" name="setting_video_load_mode" value="popupLoad"> popupLoad
                                                        </label>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">视频窗口IFrame黑边</label>
                                                        <label class="radio-inline col-sm-1 col-xs-1" style="margin-left:40px;">
                                                            <input type="radio" name="setting_video_iframe_border" value="true" checked="checked"> 保留
                                                        </label>
                                                        <label class="radio-inline col-sm-1 col-xs-1">
                                                            <input type="radio" name="setting_video_iframe_border" value="false"> 去除
                                                        </label>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">视频窗口Video黑边</label>
                                                        <label class="radio-inline col-sm-1 col-xs-1" style="margin-left:40px;">
                                                            <input type="radio" name="setting_video_video_border" value="true" checked="checked"> 保留
                                                        </label>
                                                        <label class="radio-inline col-sm-1 col-xs-1">
                                                            <input type="radio" name="setting_video_video_border" value="false"> 去除
                                                        </label>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label" title="视频窗口上的控件显示模式">视频窗口控件显示</label>
                                                        <label class="radio-inline col-sm-1 col-xs-1" style="margin-left:40px;">
                                                            <input type="radio" name="setting_popup_btn_display" value="inline" checked="checked"> inline
                                                        </label>
                                                        <label class="radio-inline col-sm-1 col-xs-1">
                                                            <input type="radio" name="setting_popup_btn_display" value="block"> block
                                                        </label>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label" title="视频窗口上失焦时控件是否隐藏">视频窗口控件行为</label>
                                                        <label class="radio-inline col-sm-1 col-xs-1" style="margin-left:40px;" title="自动隐藏">
                                                            <input type="radio" name="setting_popup_hide_btn" value="true" checked="checked"> 自动
                                                        </label>
                                                        <label class="radio-inline col-sm-1 col-xs-1" title="保持显示">
                                                            <input type="radio" name="setting_popup_hide_btn" value="false"> 保持
                                                        </label>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">视频窗口高度比例</label>
                                                        <label class="col-sm-1 col-xs-3 control-label inline" style="font-weight: normal;margin-left: 5px;">占窗口</label>
                                                        <div class="col-sm-1 col-xs-4" style="padding-left: 0px;">
                                                            <input name="setting_video_height_scale" class="col-sm-12 col-xs-12">
                                                        </div>
                                                        <label class="col-sm-2 col-xs-2 control-label inline" style="text-align: left;font-weight: normal;padding-left:2px;">(0.0~1.0)</label>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">每行展示照片个数</label>
                                                        <div class="col-sm-10 col-xs-10">
                                                            <label class="control-label col-sm-1 col-xs-5" style="margin-left: 5px;margin-right: 5px;">2000px</label>
                                                            <input class="inline col-sm-1 col-xs-6" name="setting_default_col_photo_2000">
                                                            <label class="control-label col-sm-1 col-xs-5" style="margin-left: 5px;margin-right: 5px;">1800px</label>
                                                            <input class="inline col-sm-1 col-xs-6" name="setting_default_col_photo_1800">
                                                            <label class="control-label col-sm-1 col-xs-5" style="margin-left: 5px;margin-right: 5px;">1600px</label>
                                                            <input class="inline col-sm-1 col-xs-6" name="setting_default_col_photo_1600">
                                                            <label class="control-label col-sm-1 col-xs-5" style="margin-left: 5px;">940px</label>
                                                            <input class="inline col-sm-1 col-xs-6" name="setting_default_col_photo_940">
                                                            <label class="control-label col-sm-1 col-xs-5" style="margin-left: 5px;">720px</label>
                                                            <input class="inline col-sm-1 col-xs-6" name="setting_default_col_photo_720">
                                                        </div>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label" title="设置为0，表示自适应：每页 列数*10 张">每页显示照片个数</label>
                                                        <label class="col-sm-1 col-xs-3 control-label inline" style="font-weight: normal;">每页</label>
                                                        <div class="col-sm-1 col-xs-4" style="padding-left: 0px;">
                                                            <input name="setting_default_size_photo" class="col-sm-12 col-xs-12">
                                                        </div>
                                                        <label class="col-sm-2 col-xs-2 control-label inline" style="text-align: left;font-weight: normal;padding-left:2px;">张</label>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">搜索加载照片个数</label>
                                                        <label class="col-sm-1 col-xs-3 control-label inline" style="font-weight: normal;">加载</label>
                                                        <div class="col-sm-1 col-xs-4" style="padding-left: 0px;">
                                                            <input name="setting_default_query_size" class="col-sm-12 col-xs-12">
                                                        </div>
                                                        <label class="col-sm-2 col-xs-2 control-label inline" style="text-align: left;font-weight: normal;padding-left:2px;">张</label>
                                                    </div>
                                                    <div class="hr-line-dashed"></div>
                                                    <div class="form-group">
                                                        <a href="u/abums" target="_blank" style="color:#444">
                                                            <label class="col-sm-2 col-xs-2 control-label" style="font-weight: normal;text-decoration:underline;cursor:pointer;">相册页面</label>
                                                        </a>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">全覆盖背景</label>
                                                        <label class="radio-inline col-sm-1 col-xs-1" style="margin-left:40px;">
                                                            <input type="radio" name="setting_full_background_album" value="true" checked="checked"> 全屏
                                                        </label>
                                                        <label class="radio-inline col-sm-1 col-xs-1">
                                                            <input type="radio" name="setting_full_background_album" value="false"> 不全屏
                                                        </label>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">每行展示相簿个数</label>
                                                        <div class="col-sm-10 col-xs-10">
                                                            <label class="control-label col-sm-1 col-xs-5" style="margin-left: 5px;margin-right: 5px;">2000px</label>
                                                            <input class="inline col-sm-1 col-xs-6" name="setting_default_col_album_2000">
                                                            <label class="control-label col-sm-1 col-xs-5" style="margin-left: 5px;margin-right: 5px;">1800px</label>
                                                            <input class="inline col-sm-1 col-xs-6" name="setting_default_col_album_1800">
                                                            <label class="control-label col-sm-1 col-xs-5" style="margin-left: 5px;margin-right: 5px;">1600px</label>
                                                            <input class="inline col-sm-1 col-xs-6" name="setting_default_col_album_1600">
                                                            <label class="control-label col-sm-1 col-xs-5" style="margin-left: 5px;">940px</label>
                                                            <input class="inline col-sm-1 col-xs-6" name="setting_default_col_album_940">
                                                            <label class="control-label col-sm-1 col-xs-5" style="margin-left: 5px;">720px</label>
                                                            <input class="inline col-sm-1 col-xs-6" name="setting_default_col_album_720">
                                                        </div>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label" title="设置为0，表示自适应：每页 列数*10 张">每页显示相簿个数</label>
                                                        <label class="col-sm-1 col-xs-3 control-label inline" style="font-weight: normal;">每页</label>
                                                        <div class="col-sm-1 col-xs-4" style="padding-left: 0px;">
                                                            <input name="setting_default_size_album" class="col-sm-12 col-xs-12">
                                                        </div>
                                                        <label class="col-sm-2 col-xs-2 control-label inline" style="text-align: left;font-weight: normal;padding-left:2px;">个</label>
                                                    </div>
                                                    <div class="hr-line-dashed"></div>
                                                    <div class="form-group">
                                                        <a href="u/videos" target="_blank" style="color:#444">
                                                            <label class="col-sm-2 col-xs-2 control-label" style="font-weight: normal;text-decoration:underline;cursor:pointer;">视频页面</label>
                                                        </a>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="col-sm-2 col-xs-2 control-label">video标签播放音频</label>
                                                        <label class="radio-inline col-sm-1 col-xs-1" style="margin-left:40px;" title="设为是则可能会出现音频无法播放的情况">
                                                            <input type="radio" name="setting_audio_use_fake_video" value="true" checked="checked"> 是
                                                        </label>
                                                        <label class="radio-inline col-sm-1 col-xs-1">
                                                            <input type="radio" name="setting_audio_use_fake_video" value="false"> 否
                                                        </label>
                                                    </div>
                                                    <div class="hr-line-dashed"></div>
                                                    <div class="form-group">
                                                        <div class="col-sm-4 col-sm-offset-7">
                                                            <button class="btn btn-primary" type="button" id="submit_setting_album" name="setting_submit">保存内容</button>
                                                            <span>&nbsp;OR&nbsp;</span>
                                                            <input type="reset" id="reset_setting_album" class="btn btn-white reset" value="重置"/>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
    <div style="width:440px;" class="modal-dialog" role="document">
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
                        <input type="text" required="required" class="form-control" disabled="disabled" name="email"/>
                    </div>
                    <div class="form-group">
                        <label class="control-label">验证码:</label>
                        <input type="text" required="required" class="form-control" name="validateCode"/>
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
    <div class="modal-dialog chat-panel" role="document">
        <div class="modal-content animated ">
            <div class="modal-header text-center">
                <b style="font-family: 'Microsoft YaHei';">聊天窗口</b>
                <small class="pull-right text-muted">最新消息：<span id="newestMsgTime">无</span></small>
            </div>
            <div class="modal-body" style="padding-left:12px;padding-right:12px;padding-bottom:0px;padding-top:0px;">
                <!-- content -->
                <div class="ibox chat-view">
                    <div class="ibox-content container-fluid">
                        <div class="row">
                            <div class="col-sm-9 col-xs-12">
                                <div class="chat-discussion" id="currentLetterContent"></div>
                            </div>
                            <div class="col-sm-3 col-xs-12">
                                <div class="chat-users">
                                    <div class="users-list" id="letter_userList"></div>
                                </div>
                            </div>
                        </div>
                        <div class="row" style="padding-top:5px;">
                            <div class="form-group">
                                <div class="col-sm-9 col-xs-12">
                                    <button class="letter-control openInsertImageModalBtn btn btn-sm" id="openInsertImageModalTrigger" title="发送图片"><i class="glyphicon glyphicon-picture"></i></button>
                                    <textarea class="form-control message-input" id="sendLetter_area" name="sendLetter_area" placeholder="输入消息内容，按ctrl+enter发送"></textarea>
                                </div>
                                <div class="col-sm-3 col-xs-5 btngroup">
                                    <button type="button" id="sendLetter_cancel" class="btn btn-default" data-dismiss="modal">关闭</button>
                                    <button id="sendLetter_submit" onclick="" class="btn btn-primary">发送</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- content -->
            </div>
        </div>
    </div>
</div>

<!--图片裁剪框 start-->
<div style="display: none" class="tailoring-container">
    <div class="black-cloth"></div>
    <div class="tailoring-content">
        <div class="tailoring-content-one">
            <label title="上传图片" for="chooseImg" class="crop-btn choose-btn">
                <input type="file" accept="image/jpg,image/jpeg,image/png" name="file" id="chooseImg" class="hidden">
                选择图片
            </label>
            <div class="close-tailoring">×</div>
        </div>
        <div class="tailoring-content-two">
            <div class="tailoring-box-parcel">
                <img id="tailoringImg">
            </div>
            <div class="preview-box-parcel">
                <p>图片预览：</p>
                <div class="square previewImg"></div>
                <div class="circular previewImg"></div>
            </div>
        </div>
        <div class="tailoring-content-three">
            <button class="crop-btn cropper-reset-btn">复位</button>
            <button class="crop-btn cropper-rotate-btn">旋转</button>
            <button class="crop-btn cropper-scaleX-btn">换向</button>
            <button class="crop-btn sureCut" id="sureCut">确定</button>
        </div>
    </div>
</div>
<!--图片裁剪框 end-->

<div class="modal fade in chat-modal" aria-hidden="false" tabindex="-1" role="dialog" aria-label="插入图片" id="messageInsertImageModal">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close" aria-hidden="true">×</button>
                <h4 class="modal-title">插入图片</h4>
            </div>
            <div class="modal-body">
                <div class="form-group note-form-group group-select-from-files">
                    <label>从本地上传</label>
                    <input class="message-image-input form-control" type="file" name="files" accept="image/jpg,image/jpeg,image/webp,image/bmp,image/png,image/gif" multiple="multiple">
                </div>
                <div class="form-group group-image-url" style="overflow:auto;">
                    <label>图片地址</label>
                    <input class="message-image-url form-control col-md-12" type="text">
                </div>
            </div>
            <div class="modal-footer">
                <button type="submit" class="btn btn-primary message-image-submit-btn">插入图片</button>
            </div>
        </div>
    </div>
</div>

<footer id="footer" role="contentinfo" class="card site-footer">
    <span>© 2016 </span><a href="https://imcoder.site" target="_blank">ImCoder</a><span> 博客 ，基于 </span><a>Java</a><span> 语言开发</span>
    <c:if test="${not empty site_icp_record_code}">
        <span>，ICP备案：</span><a href="http://beian.miit.gov.cn/" target="_blank">${site_icp_record_code}</a>
    </c:if>
    <c:if test="${not empty site_police_record_code}">
        <span>，公安备案：</span><img class="police-record-icon" src="<%=staticPath%>img/police_record_icon.png"><a href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=${site_police_record_number}" target="_blank">${site_police_record_code}</a>
    </c:if>
</footer>

<a id="basePath" class="site-path-prefix" href="<%=basePath%>" style="display:none;"></a>
<a id="staticPath" class="site-path-prefix" href="<%=staticPath%>" style="display:none;"></a>
<a id="cloudPath" class="site-path-prefix" href="<%=cloudPath%>" style="display:none;"></a>
<!-- Bootstrap & Plugins core JavaScript -->
<!-- ######################################### -->
<!-- Placed at the end of the document so the pages load faster -->
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="user_center"></script>

</body>
</html>