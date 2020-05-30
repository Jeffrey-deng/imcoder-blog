<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jstl/fmt_rt" %>
<%@ taglib prefix="s" uri="http://www.springframework.org/tags" %>
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
<!DOCTYPE html>
<html class="no-js">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="renderer" content="webkit">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
    <title>用户管理 - Website Administer System</title>
    <meta name="description" content="用户管理 - 博客后台管理中心">
    <meta name="keywords" content="用户管理 - 博客后台管理中心">
    <!-- 使用url函数转换相关路径 -->
    <!-- <script async="" src="http://www.google-analytics.com/analytics.js"></script> -->

    <!-- 引入文件 -->
    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css<%=urlArgs%>">
    <%--<link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.min.css<%=urlArgs%>">--%>
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>css/style.css<%=urlArgs%>">

    <!-- 修复某些移动端浏览器设置UA为PC，页面仍显示手机版的问题 -->
    <script>
        if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) && (window.screen.availWidth <= 768 || window.screen.availHeight <= 768) && window.devicePixelRatio >= 2) {
            var viewport = document.querySelector("meta[name=viewport]")
                ,content = viewport.getAttribute('content');
            viewport.setAttribute('content', content.replace(/(initial-scale=).*?(,|$)/, '$1' + (1 / window.devicePixelRatio) + '$2'));
        }
    </script>
</head>
<body uid="<c:if test="${not empty loginUser}"><s:eval expression="loginUser.uid"/></c:if>">
<!-- <body background="../../img/bg-site.png"> -->
<!-- START THE COVER  background-image: url(img/bg-site.png);" -->
<div id="first" class="" style="z-index:1000;background-image: url('<%=staticPath%>img/bg-site.png');">
    <div class="carousel-inner">
        <div class="">
            <div class="container">
                <div class="" style="text-align:center">
                    <h1>Website Administer System</h1>
                    <h3>用户管理</h3>
                </div>
            </div>
        </div>
    </div><!-- END COVER -->
</div>

<!-- toolbar start -->
<nav id="header" class="navbar navbar-default toolbar" role="navigation">
    <div class="container-fluid">
        <div class="navbar-header">
            <div class="navbar-brand">
                <p><a class="logo" href="<%=basePath%>">ImCoder</a></p>
            </div>
            <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar-collapse" aria-expanded="false">
                <span class="sr-only">Toggle navigation</span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
            </button>
        </div>
        <div class="collapse navbar-collapse hiddenscorll" id="navbar-collapse">
            <ul class="nav navbar-nav">
                <li class="dropdown site-navigation">
                    <a class="dropdown-toggle" data-toggle="dropdown">导航<span class="caret"></span></a>
                    <ul class="dropdown-menu" role="menu">
                        <div class="row">
                            <div class="nav-menu nav-menu-kind">
                                分类
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=0" target="_blank">默认</a>
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=1" target="_blank">开发</a>
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=2" target="_blank">折腾</a>
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=3" target="_blank">资源</a>
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=4" target="_blank">科技</a>
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=5" target="_blank">游戏</a>
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=6" target="_blank">段子</a>
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=7" target="_blank">杂谈</a>
                            </div>
                        </div>
                        <div class="row">
                            <div class="nav-menu nav-menu-kind">
                                服务
                            </div>
                            <div class="nav-menu more-space">
                                <a class="toolbar-jump-write-article" href="<%=basePath%>a/edit?mark=new" target="_blank">写博客</a>
                            </div>
                            <div class="nav-menu more-space">
                                <a class="toolbar-jump-paste-code" href="http://paste.ubuntu.com" target="_blank">贴代码</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-albums" href="<%=basePath%>p/dashboard" target="_blank">相册</a>
                            </div>
                            <div class="nav-menu" style="padding-left: 5px">
                                <a class="toolbar-jump-cloud" href="<%=cloudPath%>" target="_blank">cloud</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-archives" href="<%=basePath%>a/archives" target="_blank">归档</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-tags" href="<%=basePath%>a/tags" target="_blank">标签</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-user-history" href="<%=basePath%>u/history" target="_blank">历史</a>
                            </div>
                            <c:if test="${(not empty loginUser) && loginUser.userGroup.isManager()}">
                                <div class="nav-menu">
                                    <a class="toolbar-jump-manager" href="<%=basePath%>manager/backstage" target="_blank">管理</a>
                                </div>
                            </c:if>
                        </div>
                        <div class="row">
                            <div class="nav-menu nav-menu-kind">
                                站点
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-login" href="<%=basePath%>auth/login" target="_blank">登录</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-register" href="<%=basePath%>auth/register" target="_blank">注册</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-notice" href="<%=basePath%>notices" target="_blank">公告</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-help" href="<%=basePath%>help" target="_blank">帮助</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-about" href="<%=basePath%>about" target="_blank">关于</a>
                            </div>
                        </div>
                    </ul>
                </li>
                <li><a href="<%=basePath%>">首页</a></li>
                <li class="active"><a href="<%=basePath%>manager/user_manager">用户管理</a></li>
            </ul>
            <ul class="nav navbar-nav navbar-right">
                <form class="navbar-form navbar-left site-search" role="search">
                    <div class="form-group">
                        <input type="text" class="search-query form-control span3 toolbar-input-search-keyword" name="kw" placeholder="输入关键字搜索">
                    </div>
                    <button type="button" class="btn-search submit toolbar-btn-search-submit">搜索</button>
                </form>
                <c:if test="${not empty loginUser}">
                    <li class="dropdown site-login-user">
                        <a class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
                            <img src="<s:eval expression="loginUser.head_photo"/>"/><span class="caret"></span>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="nav-menu toolbar-jump-user-center" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/center" target="_blank">个人中心</a></li>
                            <li><a class="nav-menu toolbar-jump-user-home" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/home" target="_blank">我的博客</a></li>
                            <li><a class="nav-menu toolbar-jump-user-albums" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/albums" target="_blank">我的相册</a></li>
                            <li><a class="nav-menu toolbar-jump-user-videos" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/videos" target="_blank">我的视频</a></li>
                            <li><a class="nav-menu toolbar-jump-user-history" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/history" target="_blank">我的历史</a></li>
                            <li><a class="nav-menu toolbar-jump-user-messages" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/center/messages" target="_blank">我的消息</a></li>
                            <li><a class="nav-menu toolbar-jump-user-setting" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/center/settings" target="_blank">修改设置</a></li>
                            <li><a class="nav-menu toolbar-jump-user-logout" title="点击退出登录">安全退出</a></li>
                        </ul>
                    </li>
                </c:if>
            </ul>
        </div><!-- navbar-collapse end -->
    </div><!-- container-fluid end -->
</nav>
<!-- toolbar end -->

<!-- body start -->
<div id="body">
    <div class="container">
        <div class="row" style=" margin-top: 2em;">

            <div class="col-md-12 col-sm-12 col-xs-12">
                <div class="panel panel-primary" id="blog_panel">
                    <div class="panel-heading">
                        <h3 class="panel-title">用户列表</h3>
                    </div>
                    <div class="panel-body">
                        <p style="margin-left: 3%">目前注册用户有 ${userCount} 位。</p>
                    </div>
                    <div style="width:100%;overflow:auto;">
                        <table class="table table-hover" style="text-align:center;" id="user_tds">
                            <thead>
                            <tr>
                                <th style="text-align:center;">头像</th>
                                <th style="text-align:center;">User ID</th>
                                <th style="text-align:center;">用户昵称</th>
                                <th style="text-align:center;">用户组</th>
                                <th style="text-align:center;">最后登录时间</th>
                                <th style="text-align:center;">最后登录IP</th>
                                <th style="text-align:center;">状态</th>
                            </tr>
                            </thead>
                            <c:forEach items="${userList}" var="user">
                                <tbody>
                                <tr class="user-tr" style="height: 50px;" data-uid="<s:eval expression="user.uid"/>">
                                    <td class="user-head-photo"><img src="<s:eval expression="user.head_photo"/>" style="width: 43px;height: 43px;"></td>
                                    <td class="user-uid"><b><s:eval expression="user.uid"/></b></td>
                                    <td class="user-nickname"><a target="_blank" href="<%=basePath%>u/<s:eval expression="user.uid"/>/home">${user.nickname}</a></td>
                                    <td class="user-group-name">${user.userGroup.group_name}</td>
                                    <td class="user-status-last-login-time"><s:eval expression="user.userStatus.last_login_time"/></td>
                                    <td class="user-status-last-login-ip">
                                        <c:if test="${empty  user.userStatus.last_login_ip}">暂无IP</c:if>
                                        <c:if test="${not empty user.userStatus.last_login_ip}">${user.userStatus.last_login_ip}</c:if>
                                    </td>
                                    <td class="user-status-lock">
                                        <c:if test="${user.userStatus.lock_status == 0}">可用</c:if>
                                        <c:if test="${user.userStatus.lock_status == 1}">
                                            <div style="color:red;">冻结</div>
                                        </c:if>
                                    </td>
                                </tr>
                                </tbody>
                            </c:forEach>
                        </table>
                    </div>
                </div>
            </div>


        </div><!-- end .row -->

    </div>
</div>
<!-- body end -->

<div class="modal fade" id="userProfileModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"
                        aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <h4 class="modal-title" id="">用户资料</h4>
            </div>
            <div class="modal-body">
                <form class="form-horizontal">
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label"><img name="head_photo" style="height: 50px;"></label>
                        <span class="col-sm-7 col-xs-7 control-label" name="nickname" style="height: 50px;line-height:50px;vertical-align:middle;"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">User ID:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="uid"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">用户组:</label>
                        <div class="col-sm-4 col-xs-5">
                            <select class="form-control" name="usergroup">
                                <option value="-1">管理员</option>
                                <option value="0">初级会员</option>
                                <option value="1">高级会员</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">邮箱:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="email"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">性别:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="sex"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">自我介绍:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="description"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">生日:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="birthday"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">地址:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="address"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">手机:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="phone"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">主页:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="site"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">微博:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="weibo"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">QQ:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="qq"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">注册时间:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="register_time"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">文章数:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="articleCount"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">关注数:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="followingCount"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">粉丝数:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="followerCount"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">签名:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="says"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">登录IP:</label>
                        <a><span class="col-sm-7 col-xs-7 control-label" name="last_login_ip"></span></a>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">登录时间:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="last_login_time"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">账号状态:</label>
                        <div class="col-sm-4 col-xs-5">
                            <select class="form-control" name="lock_status">
                                <option value="0">可用</option>
                                <option value="1">冻结</option>
                            </select>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" name="updateUser_trigger" style="display: inline-block;">更改</button>
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

<footer id="footer" role="contentinfo" class="card site-footer">
    <span>© 2016 </span><a href="https://imcoder.site" target="_blank">ImCoder</a><span> 博客 ，基于 </span><a>Java</a><span> 语言开发</span>
    <c:if test="${not empty site_icp_record_code}">
        <span>，ICP备案：</span><a class="site-icp-record" href="http://beian.miit.gov.cn/" target="_blank">${site_icp_record_code}</a>
    </c:if>
    <c:if test="${not empty site_police_record_code}">
        <span>，公安备案：</span><img class="police-record-icon" src="<%=staticPath%>img/police_record_icon.png">
        <a class="site-police-record" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=${site_police_record_number}" target="_blank">${site_police_record_code}</a>
    </c:if>
</footer>

<a id="basePath" class="site-path-prefix" href="<%=basePath%>" style="display:none;"></a>
<a id="staticPath" class="site-path-prefix" href="<%=staticPath%>" style="display:none;"></a>
<a id="cloudPath" class="site-path-prefix" href="<%=cloudPath%>" style="display:none;"></a>
<!-- Bootstrap & Plugins core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="user_manager"></script>

</body>
</html>