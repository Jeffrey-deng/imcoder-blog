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
    <c:choose>
        <c:when test="${not empty clear_model and clear_model == 'topics'}">
            <title>Topics - ${hostUser.nickname} | ImCoder's 博客</title>
        </c:when>
        <c:otherwise>
            <title>Photo Tag Wrappers - ${hostUser.nickname} | ImCoder's 博客</title>
        </c:otherwise>
    </c:choose>
    <meta name="description" content="文章归档,archives,ImCoder's 博客">
    <meta name="keywords" content="文章归档,archives,ImCoder's 博客">
    <!-- 使用url函数转换相关路径 -->
    <!-- <script async="" src="http://www.google-analytics.com/analytics.js"></script> -->

    <!-- 引入文件 -->
    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>css/style.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">

    <style>

        .hr-title {
            text-align: center;
            /* margin-top: 0.8163em; */
            /* margin-bottom: 0.8163em; */
            font-weight: bold;
            font-size: 1.15em;
        }

        .hr-left {
            display: inline-block;
            border: 1px solid #E9E9E9;
            border-width: 2px 0 0 0;
            width: 200px;
            margin-right: 60px;
            margin-bottom: 5px;
            text-align: right;
        }

        .hr-right {
            display: inline-block;
            border: 1px solid #E9E9E9;
            border-width: 2px 0 0 0;
            width: 200px;
            margin-left: 60px;
            margin-bottom: 5px;
            text-align: left;
        }

        .table {
            margin-bottom: 0px;
        }

        table th, table td {
            text-align: left;
        }

        .table > tbody > tr > td, .table > thead > tr > th {
            padding-left: 20px;
        }

        table tr {
            cursor: pointer;
        }

        <c:if test="${not empty clear_model and clear_model == 'topics'}">
        #mark_wrappers_panel table tr *:nth-child(4) {
            display: none;
        }

        </c:if>

    </style>


</head>
<body uid="<c:if test="${not empty loginUser}"><s:eval expression="loginUser.uid"/></c:if>" style="background-image: url('<%=staticPath%>img/bg-site.png');">
<!-- <body background="../../img/bg-site.png"> -->
<!-- START THE COVER  background-image: url(img/bg-site.png);" -->
<div id="first" class="" style="z-index:1000;">
    <div class="carousel-inner">
        <div class="">
            <div class="container">
                <div class="" style="text-align:center">
                    <h2 class="slogan-name" data-user-id="<s:eval expression="hostUser.uid"/>">${hostUser.nickname}</h2>
                    <h3 class="slogan-desc">${hostUser.description}</h3>
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
                <c:choose>
                    <c:when test="${not empty clear_model and clear_model == 'topics'}">
                        <li class="active"><a>topics</a></li>
                    </c:when>
                    <c:otherwise>
                        <li class="active"><a>TagWrapper</a></li>
                    </c:otherwise>
                </c:choose>
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
        <div class="row">
            <div class="col-md-12 col-sm-12 col-xs-12">

                <!-- 标签wrapper管理  start -->
                <header class="post post-container tag_wrapper_options">
                    <h1 class="post-title" itemprop="name headline">
                        <c:choose>
                            <c:when test="${not empty loginUser and not empty hostUser and loginUser.uid.equals(hostUser.uid)}">
                                <a class="option_create_tag_wrapper" itemtype="url" id="create_tag_wrapper">创建新标签</a>
                            </c:when>
                            <c:otherwise>
                                <a>&nbsp;&nbsp;</a>
                            </c:otherwise>
                        </c:choose>
                        <div style="float: right" class="options_right">
                            <a class="option_tags_index" itemtype="url" href="<%=basePath%>p/tags_square?uid=<s:eval expression="hostUser.uid"/>" target="_blank">标签索引</a>
                        </div>
                    </h1>
                </header>
                <!-- 标签wrapper管理  end -->

                <div class="post">
                    <div class="post-container">
                        <div class="post-content tag-wrappers-container" id="tag-wrappers-container">
                            <!-- common tag wrappers -->
                            <div class="hr-line-dashed"></div>
                            <div class="panel panel-primary" id="common_wrappers_panel">
                                <div class="panel-heading">
                                    <div class="hr-title">
                                        <label class="hr-left"></label>公共标签<label class="hr-right"></label>
                                    </div>
                                </div>
                                <div style="width:100%;overflow:auto;">
                                    <table class="table table-hover" style="text-align:center;">

                                    </table>
                                </div>
                            </div>
                            <!-- search tag wrappers -->
                            <div class="hr-line-dashed"></div>
                            <div class="panel panel-primary" id="search_wrappers_panel">
                                <div class="panel-heading">
                                    <div class="hr-title">
                                        <label class="hr-left"></label>搜索标签<label class="hr-right"></label>
                                    </div>
                                </div>
                                <div style="width:100%;overflow:auto;">
                                    <table class="table table-hover" style="text-align:center;">

                                    </table>
                                </div>
                            </div>
                            <!-- mark tag wrappers -->
                            <div class="hr-line-dashed"></div>
                            <div class="panel panel-primary" id="mark_wrappers_panel">
                                <div class="panel-heading">
                                    <div class="hr-title">
                                        <label class="hr-left"></label>标识标签<label class="hr-right"></label>
                                    </div>
                                </div>
                                <div style="width:100%;overflow:auto;">
                                    <table class="table table-hover" style="text-align:center;">

                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div><!-- end .row -->
    </div>
</div>
<!-- body end -->

<div id="goTop" class="" style="bottom: 70px;">
    <div class="arrow"></div>
    <div class="stick"></div>
</div>

<div class="modal fade in" id="createTagWrapperModal" aria-hidden="false" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
                <h4 class="modal-title">新建标签</h4></div>
            <div class="modal-body">
                <div class="form-group tag-wrapper-type-group">
                    <label>选择标签类型</label>
                    <select class="form-control tag-wrapper-type">
                        <option value="0">标识标签</option>
                        <option value="1">搜索标签</option>
                    </select>
                </div>
                <div class="form-group tag-wrapper-name-group">
                    <label>标签名称：</label>
                    <input class="form-control tag-wrapper-name" type="text">
                </div>
                <div class="form-group tag-wrapper-match-mode-group" style="padding-top: 7px;">
                    <label title="搜索时匹配模式">匹配模式：</label>
                    <select class="form-control tag-wrapper-match-mode">
                        <option value="0">全等匹配</option>
                        <option value="1">前缀匹配</option>
                        <option value="2">后缀匹配</option>
                        <option value="3">正则匹配</option>
                        <option value="4">包含匹配</option>
                        <option value="5" title="同时包含多个tag, 支持正则，正则间以 && 或 空格 隔开">同时包含匹配</option>
                    </select>
                </div>
                <div class="form-group tag-wrapper-pattern-group">
                    <label>匹配内容：</label>
                    <input class="form-control tag-wrapper-pattern" type="text">
                </div>
                <div class="form-group tag-wrapper-action-group" padding-top: 7px;>
                    <label class="control-label">响应方式：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input class="tag-wrapper-action" type="radio" name="tag_wrapper_action" value="0"> continue </label>
                    <label class="radio-inline"><input class="tag-wrapper-action" type="radio" name="tag_wrapper_action" value="1"> break </label>
                </div>
                <div class="form-group tag-wrapper-extra-group">
                    <label class="control-label" title="作为一个独立组显示，因为可能该name未被你作为过tag">额外显示：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input class="tag-wrapper-extra" type="radio" name="tag_wrapper_extra" value="0"> 否 </label>
                    <label class="radio-inline"><input class="tag-wrapper-extra" type="radio" name="tag_wrapper_extra" value="1"> 组 </label>
                </div>
                <div class="form-group tag-wrapper-weight-group">
                    <label>标签权重：</label>
                    <input class="form-control tag-wrapper-weight" type="text">
                </div>
                <div class="form-group tag-wrapper-scope-group">
                    <label>作用域：</label>
                    <select class="form-control tag-wrapper-scope">
                        <option value="0">全局</option>
                    </select>
                </div>
                <div class="form-group tag-wrapper-permission-group" style="padding-top: 7px;">
                    <label title="不公开意思是 不会在搜索结果、广场、用户主页中出现">标签权限：</label>
                    <select class="form-control tag-wrapper-permission">
                        <option value="0">游客可见</option>
                        <option value="1" title="不会在搜索结果、广场、用户主页中出现">游客可见，但不公开</option>
                        <option value="2">登陆可见</option>
                        <option value="3">登陆可见，但不公开</option>
                        <option value="4" title="关注你的用户可见">粉丝可见</option>
                        <option value="5">粉丝可见，但不公开</option>
                        <option value="6" title="你关注的用户可见">关注的用户可见</option>
                        <option value="7">关注的用户可见，但不公开</option>
                        <option value="8">好友可见</option>
                        <option value="9">好友可见，但不公开</option>
                        <option value="10">私有</option>
                    </select>
                </div>
                <div class="form-group tag-wrapper-desc-group">
                    <label>标签描述：</label>
                    <textarea class="form-control tag-wrapper-desc" type="text"></textarea>
                </div>
                <div class="form-group tag-wrapper-common-value-group inline-group">
                    <label class="control-label" title="是否作为公共标签，供所有用户使用，仅管理员可设置">公共标签：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input class="tag-wrapper-common-value" type="radio" name="tag_wrapper_common_value" value="0"> 否 </label>
                    <label class="radio-inline"><input class="tag-wrapper-common-value" type="radio" name="tag_wrapper_common_value" value="1"> 是 </label>
                </div>
                <div class="form-group tag-wrapper-topic-group inline-group">
                    <label class="control-label" title="是否作为一些照片的主题">照片主题：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input class="tag-wrapper-topic" type="radio" name="tag_wrapper_topic" value="0"> 普通 </label>
                    <label class="radio-inline"><input class="tag-wrapper-topic" type="radio" name="tag_wrapper_topic" value="1"> 主题 </label>
                </div>
                <div class="form-group sync-topic-to-photos-group inline-group">
                    <label class="control-label" title="将topicId同步到包含该标签的照片">同步照片：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input class="sync-topic-to-photos" type="radio" name="sync_topic_to_photos" value="0"> 关闭 </label>
                    <label class="radio-inline"><input class="sync-topic-to-photos" type="radio" name="sync_topic_to_photos" value="1"> 同步 </label>
                </div>
                <div class="form-group sync-topic-to-photos-mode-group inline-group">
                    <label class="control-label" title="同步到照片的模式">同步模式：</label>
                    <label class="radio-inline" style="margin-left:10px;" title="跳过已设置topic的照片"><input class="sync-topic-to-photos-mode" type="radio" name="sync_topic_to_photos_mode" value="0"> 合并 </label>
                    <label class="radio-inline" title="覆盖已设置topic的照片"><input class="sync-topic-to-photos-mode" type="radio" name="sync_topic_to_photos_mode" value="1"> 覆盖 </label>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-danger delete-tag-wrapper-trigger">删除标签</button>
                <button class="btn btn-primary create-tag-wrapper-trigger">创建标签</button>
                <button class="btn btn-default" name="cancelBtn" data-dismiss="modal">关闭</button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade in" id="updateTagWrapperModal" aria-hidden="false" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
                <h4 class="modal-title">更新标签信息</h4></div>
            <div class="modal-body">
                <div class="form-group tag-wrapper-id-group">
                    <label class="control-label">标签ID：&nbsp;&nbsp;&nbsp;&nbsp;</label>
                    <a target="_blank" style="color: #666; cursor: pointer" title="打开标签">
                        <span class="tag-wrapper-id" class="control-label"></span>
                    </a>
                </div>
                <div class="form-group tag-wrapper-type-group">
                    <label>选择标签类型</label>
                    <select class="form-control tag-wrapper-type">
                        <option value="0">标识标签</option>
                        <option value="1">搜索标签</option>
                    </select>
                </div>
                <div class="form-group tag-wrapper-name-group">
                    <label>标签名称：</label>
                    <input class="form-control tag-wrapper-name" type="text">
                </div>
                <div class="form-group tag-wrapper-match-mode-group" style="padding-top: 7px;">
                    <label title="搜索时匹配模式">匹配模式：</label>
                    <select class="form-control tag-wrapper-match-mode">
                        <option value="0">全等匹配</option>
                        <option value="1">前缀匹配</option>
                        <option value="2">后缀匹配</option>
                        <option value="3">正则匹配</option>
                        <option value="4">包含匹配</option>
                        <option value="5" title="同时包含多个tag, 支持正则，正则间以 && 或 空格 隔开">同时包含匹配</option>
                    </select>
                </div>
                <div class="form-group tag-wrapper-pattern-group">
                    <label>匹配内容：</label>
                    <input class="form-control tag-wrapper-pattern" type="text">
                </div>
                <div class="form-group tag-wrapper-action-group" padding-top: 7px;>
                    <label class="control-label">响应方式：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input class="tag-wrapper-action" type="radio" name="tag_wrapper_action" value="0"> continue </label>
                    <label class="radio-inline"><input class="tag-wrapper-action" type="radio" name="tag_wrapper_action" value="1"> break </label>
                </div>
                <div class="form-group tag-wrapper-extra-group">
                    <label class="control-label" title="作为一个独立组显示，因为可能该name未被你作为过tag">额外显示：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input class="tag-wrapper-extra" type="radio" name="tag_wrapper_extra" value="0"> 否 </label>
                    <label class="radio-inline"><input class="tag-wrapper-extra" type="radio" name="tag_wrapper_extra" value="1"> 组 </label>
                </div>
                <div class="form-group tag-wrapper-weight-group">
                    <label>标签权重：</label>
                    <input class="form-control tag-wrapper-weight" type="text">
                </div>
                <div class="form-group tag-wrapper-scope-group">
                    <label>作用域：</label>
                    <select class="form-control tag-wrapper-scope">
                        <option value="0">全局</option>
                    </select>
                </div>
                <div class="form-group tag-wrapper-permission-group" style="padding-top: 7px;">
                    <label title="不公开意思是 不会在搜索结果、广场、用户主页中出现">标签权限：</label>
                    <select class="form-control tag-wrapper-permission">
                        <option value="0">游客可见</option>
                        <option value="1" title="不会在搜索结果、广场、用户主页中出现">游客可见，但不公开</option>
                        <option value="2">登陆可见</option>
                        <option value="3">登陆可见，但不公开</option>
                        <option value="4" title="关注你的用户可见">粉丝可见</option>
                        <option value="5">粉丝可见，但不公开</option>
                        <option value="6" title="你关注的用户可见">关注的用户可见</option>
                        <option value="7">关注的用户可见，但不公开</option>
                        <option value="8">好友可见</option>
                        <option value="9">好友可见，但不公开</option>
                        <option value="10">私有</option>
                    </select>
                </div>
                <div class="form-group tag-wrapper-desc-group">
                    <label>标签描述：</label>
                    <textarea class="form-control tag-wrapper-desc" type="text"></textarea>
                </div>
                <div class="form-group tag-wrapper-common-value-group inline-group">
                    <label class="control-label" title="是否作为公共标签，供所有用户使用，仅管理员可设置">公共标签：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input class="tag-wrapper-common-value" type="radio" name="tag_wrapper_common_value" value="0"> 否 </label>
                    <label class="radio-inline"><input class="tag-wrapper-common-value" type="radio" name="tag_wrapper_common_value" value="1"> 是 </label>
                </div>
                <div class="form-group tag-wrapper-topic-group inline-group">
                    <label class="control-label" title="是否作为一些照片的主题">照片主题：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input class="tag-wrapper-topic" type="radio" name="tag_wrapper_topic" value="0"> 普通 </label>
                    <label class="radio-inline"><input class="tag-wrapper-topic" type="radio" name="tag_wrapper_topic" value="1"> 主题 </label>
                </div>
                <div class="form-group sync-topic-to-photos-group inline-group">
                    <label class="control-label" title="将 'topicId' 和 'topicName的修改' 同步到包含该标签名称的照片">同步照片：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input class="sync-topic-to-photos" type="radio" name="sync_topic_to_photos" value="0"> 关闭 </label>
                    <label class="radio-inline"><input class="sync-topic-to-photos" type="radio" name="sync_topic_to_photos" value="1"> 同步 </label>
                </div>
                <div class="form-group sync-topic-to-photos-mode-group inline-group">
                    <label class="control-label" title="同步到照片的模式">同步模式：</label>
                    <label class="radio-inline" style="margin-left:10px;" title="跳过已设置topic的照片"><input class="sync-topic-to-photos-mode" type="radio" name="sync_topic_to_photos_mode" value="0"> 合并 </label>
                    <label class="radio-inline" title="覆盖已设置topic的照片"><input class="sync-topic-to-photos-mode" type="radio" name="sync_topic_to_photos_mode" value="1"> 覆盖 </label>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-danger delete-tag-wrapper-trigger">删除标签</button>
                <button class="btn btn-primary update-tag-wrapper-trigger">更新信息</button>
                <button class="btn btn-default" name="cancelBtn" data-dismiss="modal">关闭</button>
            </div>
        </div>
    </div>
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
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="photo_tag_wrappers"></script>
</body>
</html>