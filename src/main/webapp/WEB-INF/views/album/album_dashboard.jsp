﻿
<%@ page language="java" import="site.imcoder.blog.common.Utils" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.Config" %>
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
        <c:when test="${isClearUserPage and not empty clear_model and clear_model == 'likes'}">
            <title>${hostUser.nickname}喜欢的照片 | ImCoder博客's 相册</title>
        </c:when>
        <c:when test="${isClearUserPage and not empty clear_model and clear_model == 'history'}">
            <title>${hostUser.nickname}访问过的照片 | ImCoder博客's 相册</title>
        </c:when>
        <c:when test="${isClearUserPage}">
            <title>${hostUser.nickname}的照片 | ImCoder博客's 相册</title>
        </c:when>
        <c:when test="${not empty dashboard_model and dashboard_model eq 'album'}">
            <title>album dashboard | ImCoder博客's 相册</title>
        </c:when>
        <c:otherwise>
            <title>dashboard | ImCoder博客's 相册</title>
        </c:otherwise>
    </c:choose>
    <meta name="description" content="相册看板dashboard">
    <meta name="keywords" content="相册,dashboard,ImCoder's 博客">
    <!-- 使用url函数转换相关路径 -->
    <!-- <script async="" src="http://www.google-analytics.com/analytics.js"></script> -->

    <!-- 引入文件 -->
    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/magnific-popup/magnific-popup.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>css/style.css<%=urlArgs%>">
    <style>
        .comment-list-header {
            color: #fcf8e3ab;
        }

        .comment-list .comment-body.comment-by-author > .comment-author > cite > a::after {
            content: ' (照片作者)';
        }
    </style>
</head>
<body uid="<c:if test="${not empty loginUser}"><s:eval expression="loginUser.uid"/></c:if>">
<!-- <body background="../../img/bg-site.png"> -->
<!-- START THE COVER  background-image: url(img/bg-site.png);" -->
<div id="first" class="" style="z-index:1000;background-image: url('<%=staticPath%>img/bg-site.png');">
    <div class="carousel-inner">
        <div class="">
            <div class="container">
                <div class="" style="text-align:center;">
                    <c:choose>
                        <c:when test="${empty clear_model && not empty album}">
                            <h1 class="slogan-name media-list-name">${album.name}</h1>
                            <h3 class="slogan-desc media-list-desc">${album.user.nickname}</h3>
                        </c:when>
                        <c:when test="${empty clear_model && empty album && not empty hostUser}">
                            <h1 class="slogan-name media-list-name" data-user-id="<s:eval expression="hostUser.uid"/>">${hostUser.nickname}</h1>
                            <h3 class="slogan-desc media-list-desc">dashboard</h3>
                        </c:when>
                        <c:when test="${not empty clear_model && clear_model == 'likes'}">
                            <h1 class="slogan-name media-list-name">${hostUser.nickname}</h1>
                            <h3 class="slogan-desc media-list-desc">赞过的照片</h3>
                        </c:when>
                        <c:when test="${not empty clear_model && clear_model == 'history'}">
                            <h1 class="slogan-name media-list-name">${hostUser.nickname}</h1>
                            <h3 class="slogan-desc media-list-desc">访问过的照片</h3>
                        </c:when>
                        <c:when test="${(not empty clear_model) and clear_model == 'tag' && empty hostUser}">
                            <h1 class="slogan-name media-list-name" data-clear-mode="tag">album dashboard</h1>
                            <h3 class="slogan-desc media-list-desc">${photo_tag}</h3>
                        </c:when>
                        <c:when test="${(not empty clear_model) and clear_model == 'tag' && not empty hostUser}">
                            <h1 class="slogan-name media-list-name" data-clear-mode="tag" data-user-id="<s:eval expression="hostUser.uid"/>">${hostUser.nickname}</h1>
                            <h3 class="slogan-desc media-list-desc">${photo_tag}</h3>
                        </c:when>
                        <c:when test="${(not empty clear_model) and clear_model == 'topic' and empty photo_topic.description}">
                            <h1 class="slogan-name media-list-name" data-clear-mode="topic"
                                data-topic-ptwid="<s:eval expression="photo_topic.ptwid"/>" data-topic-name="${photo_topic.name}" data-user-id="<s:eval expression="photo_topic.uid"/>">Photo Topic</h1>
                            <h3 class="slogan-desc media-list-desc">${photo_topic.name}</h3>
                        </c:when>
                        <c:when test="${(not empty clear_model) and clear_model == 'topic' and not empty photo_topic.description}">
                            <h1 class="slogan-name media-list-name" data-clear-mode="topic"
                                data-topic-ptwid="<s:eval expression="photo_topic.ptwid"/>" data-topic-name="${photo_topic.name}" data-user-id="<s:eval expression="photo_topic.uid"/>">Topic / ${photo_topic.name}</h1>
                            <h3 class="slogan-desc media-list-desc">${photo_topic.description}</h3>
                        </c:when>
                        <c:when test="${not empty dashboard_model and dashboard_model eq 'album'}">
                            <h1 class="slogan-name media-list-name">album dashboard</h1>
                            <h3 class="slogan-desc media-list-desc" style="display: none"></h3>
                        </c:when>
                        <c:otherwise>
                            <h1 class="slogan-name media-list-name">photo dashboard</h1>
                            <h3 class="slogan-desc media-list-desc" style="display: none"></h3>
                        </c:otherwise>
                    </c:choose>
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
                <li class="active">
                    <c:choose>
                        <c:when test="${empty clear_model && not empty album}">
                            <a href="<%=basePath%>p/album/<s:eval expression="album.album_id"/>" target="_blank">${album.name}</a>
                        </c:when>
                        <c:when test="${empty clear_model && empty album && not empty hostUser}">
                            <a href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/home" target="_blank">${hostUser.nickname}</a>
                        </c:when>
                        <c:when test="${not empty clear_model && clear_model == 'likes'}">
                            <a href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/likes/photos" target="_blank">喜欢</a>
                        </c:when>
                        <c:when test="${not empty clear_model && clear_model == 'history'}">
                            <a href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/history/photos" target="_blank">历史</a>
                        </c:when>
                        <c:when test="${(not empty clear_model) and clear_model == 'tag'}">
                            <a href="<%=basePath%>p/tag/<%=Utils.encodeURL((String) request.getAttribute("photo_tag"))%>" target="_blank">${photo_tag}</a>
                        </c:when>
                        <c:when test="${(not empty clear_model) and clear_model == 'topic'}">
                            <a href="<%=basePath%>p/topic/<s:eval expression="photo_topic.ptwid"/>" target="_blank">${photo_topic.name}</a>
                        </c:when>
                        <c:when test="${not empty dashboard_model and dashboard_model eq 'album'}">
                            <a href="<%=basePath%>p/dashboard?model=album" target="_blank">dashboard</a>
                        </c:when>
                        <c:otherwise>
                            <a href="<%=basePath%>p/dashboard?model=photo" target="_blank">dashboard</a>
                        </c:otherwise>
                    </c:choose>
                </li>
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
        <article class="row">

            <!-- main div start -->
            <article class="col-md-12 col-sm-12 col-xs-12" id="main" role="main">

                <!-- 相册管理  start -->
                <header class="post post-container album_options" style="overflow:visible">
                    <h1 class="post-title" itemprop="name headline">
                        <a class="option_my_albums" itemtype="url" href="<%=basePath%>u/albums" target="_blank">我的相册</a>
                        <c:choose>
                            <c:when test="${not empty dashboard_model and dashboard_model eq 'photo' and empty clear_model and !isClearUserPage}">
                                <a class="option_album_square" itemtype="url" href="<%=basePath%>p/dashboard?model=album" target="_blank">相册广场</a>
                                <a class="option_video_square" itemtype="url" href="<%=basePath%>video/dashboard" target="_blank">视频广场</a>
                            </c:when>
                            <c:when test="${not empty dashboard_model and dashboard_model eq 'album' and empty clear_model and !isClearUserPage}">
                                <a class="option_photo_square" itemtype="url" href="<%=basePath%>p/dashboard?model=photo" target="_blank">照片广场</a>
                                <a class="option_video_square" itemtype="url" href="<%=basePath%>video/dashboard" target="_blank">视频广场</a>
                            </c:when>
                            <c:when test="${not empty hostUser and ((empty loginUser) or (not loginUser.uid.equals(hostUser.uid)))}">
                                <a class="option_user_albums" itemtype="url" href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/albums" target="_blank">Ta的相册</a>
                                <c:if test="${isClearUserPage and empty clear_model}">
                                    <a class="option_user_videos" itemtype="url" href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/videos" target="_blank">Ta的视频</a>
                                </c:if>
                            </c:when>
                            <c:when test="${not empty clear_model and clear_model == 'topic' and ((empty loginUser) or (not loginUser.uid.equals(photo_topic.uid)))}">
                                <a class="option_user_albums" itemtype="url" href="<%=basePath%>u/<s:eval expression="photo_topic.uid"/>/albums" target="_blank">Ta的相册</a>
                            </c:when>
                        </c:choose>
                        <c:if test="${not empty clear_model && clear_model == 'likes'}">
                            <a class="option_user_like_videos" itemtype="url" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/likes/videos" target="_blank" title="赞过的视频">喜爱视频</a>
                        </c:if>
                        <c:if test="${not empty clear_model && clear_model == 'history'}">
                            <a class="option_user_history_videos" itemtype="url" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/history/videos" target="_blank" title="访问过的视频">历史视频</a>
                        </c:if>
                        <c:if test="${empty dashboard_model or dashboard_model eq 'photo'}">
                            <a class="option_run_tags_classification" itemtype="url" href="<%=basePath%>p/tags_square" target="_blank" title="对当前结果进行标签分类">标签索引</a>
                            <a class="option_tags_subtag" itemtype="url" href="<%=basePath%>p/tags_square" target="_blank" title="查看该标签的子标签" style="display: none">查看子标签</a>
                            <a class="option_tags_upcasting" itemtype="url" href="<%=basePath%>p/tags_square" target="_blank" title="查看该标签的相似标签" style="display: none">相似标签</a>
                        </c:if>
                        <div style="float: right" class="options_right">
                            <c:if test="${not empty loginUser}">
                                <a class="option_user_history" itemtype="url" target="_blank" href="<%=basePath%>u/history">浏览历史</a>
                            </c:if>
                            <c:choose>
                                <c:when test="${not empty dashboard_model and dashboard_model eq 'album'}">
                                    <a class="option_tags_square" itemtype="url" href="<%=basePath%>p/tags_square" target="_blank">标签广场</a>
                                </c:when>
                                <c:when test="${isClearUserPage or not empty clear_model}">
                                    <a class="option_photo_square" itemtype="url" href="<%=basePath%>p/dashboard?model=photo" target="_blank">照片广场</a>
                                    <a class="option_album_square" itemtype="url" href="<%=basePath%>p/dashboard?model=album" target="_blank">相册广场</a>
                                    <a class="option_tags_square" itemtype="url" href="<%=basePath%>p/tags_square" target="_blank">标签广场</a>
                                    <a class="option_blowup" itemtype="url" id="blowup_trigger">放大镜</a>
                                </c:when>
                                <c:otherwise>
                                    <a class="option_tags_square" itemtype="url" href="<%=basePath%>p/tags_square" target="_blank">标签广场</a>
                                    <a class="option_blowup" itemtype="url" id="blowup_trigger">放大镜</a>
                                </c:otherwise>
                            </c:choose>
                        </div>
                    </h1>
                </header>
                <!-- 相册管理  end -->

                <article class="post" style="background-color: #f8f8f8;box-shadow: 0px 0px 1px 0.5px #ddd;">
                    <style>
                        <c:if test="${not empty dashboard_model and dashboard_model eq 'album'}">
                        #masonryContainer {
                            margin: 20px 10px 0px 10px !important;
                        }

                        </c:if>
                    </style>
                    <!-- 文章内容 start -->
                    <section>
                        <div id="masonryContainer" class="" style="margin: 7px 6px 1px 6px">
                        </div>
                    </section>
                    <!-- 文章内容 end -->

                    <!-- 标签 start -->
                    <!-- 标签 end -->
                </article>

                <!-- album footer start -->
                <header class="post post-container row album-footer">
                    <ul class="post-meta footer-left">
                        <c:choose>
                            <c:when test="${not empty dashboard_model and dashboard_model eq 'album'}">
                                <li>数量：<a id="album_count">0</a></li>
                            </c:when>
                            <c:otherwise>
                                <li>数量：<a id="album_size">0</a></li>
                            </c:otherwise>
                        </c:choose>
                    </ul>
                    <ul class="post-meta footer-right">
                        <ol class="page-navigator"></ol>
                    </ul>
                </header>
                <!-- album footer end -->

                <!-- 评论区 start -->
                <article style="display: none">
                    <!-- 已有评论 -->
                    <section id="comments" class="comment-list-wrapper"></section>
                    <!-- 评论 input start -->
                    <div class="comment-respond comment-post">
                        <div class="comment-btn-reply-cancel">
                            <a data-action-type="cancel" rel="button">取消回复</a>
                        </div>
                        <form id="comment-form" class="comment-form card" method="post" action="" role="form">
                            <h3 id="response">添加新评论</h3>
                            <div class="comment-form-group comment-control-group">
                                <label class="comment-control comment-check-user-html-tag"><input type="checkbox" id="useInputCommentUseHtmlTag" value="useHtmlTag"/> html注入</label>
                                <label class="comment-control comment-check-send-anonymously"><input type="checkbox" id="useSendCommentAnonymously" value="sendAnonymously"/> 匿名评论</label>
                                <button class="comment-control comment-btn-insert-image-modal-open btn btn-default btn-sm" id="openInsertImageModalTrigger" title="发送图片"><i class="glyphicon glyphicon-picture"></i></button>
                            </div>
                            <div class="comment-form-group">
                                <input type="hidden" name="parentId" id="comment_form_parent_id" value="0"/>
                                <input type="hidden" name="replyUid" id="comment_form_reply_uid" value="0"/>
                                <textarea rows="4" cols="50" name="content" id="comment_form_content" class="textarea comment-input-content" placeholder=""></textarea>
                            </div>
                            <div class="comment-form-group">
                                <button type="button" id="comment_form_submit" class="comment-btn-send-submit ripple"><span>提交评论</span>
                                    <ripple-container></ripple-container>
                                </button>
                            </div>
                        </form>
                    </div>
                    <!-- 评论 input end -->
                    <div class="modal fade in" aria-hidden="false" tabindex="-1" role="dialog" aria-label="插入图片" id="messageInsertImageModal">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" aria-hidden="true">×</button>
                                    <h4 class="modal-title">插入图片</h4>
                                </div>
                                <div class="modal-body">
                                    <div class="form-group group-message-image-file">
                                        <label>从本地上传</label>
                                        <input class="message-image-input-file form-control" type="file" name="files" accept="image/jpg,image/jpeg,image/webp,image/bmp,image/png,image/gif" multiple="multiple">
                                    </div>
                                    <div class="form-group group-message-image-url" style="overflow:auto;">
                                        <label>图片地址</label>
                                        <input class="form-control message-image-input-url" type="text">
                                    </div>
                                    <div class="form-group group-message-image-forbidden-download">
                                        <div class="checkbox" style="padding-left:0px;margin-top:0px;margin-bottom:0px;">
                                            <label><input class="message-image-check-forbidden-download" role="checkbox" type="checkbox">禁止下载</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="submit" class="btn btn-primary message-image-btn-insert-submit">插入图片</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
                <!-- 评论区 end -->

            </article><!-- main div end -->

        </article><!-- end .row -->
    </div>
</div>
<!-- body end -->

<div id="enlargephoto-modal" class="animated pulse" style="display:none; position: fixed;left: 0;top: 0;width: 100%;height: 100%;z-index: 3000;">
    <div class="fog" style="width: 100%;height: 100%;background: #111;opacity: 0.4;filter:alpha(opacity=30); -moz-opacity:0.3; -khtml-opacity:0.3;"></div>
    <div id="photo-content" style="max-width:99%;max-height:99%;position:absolute;background:rgba(0, 0, 0, 0.6);">
        <div class="close" title="Close" style="background: #ddd;width:15px;right: 0;position: absolute;opacity: .8;color:#fff;text-align: center;font-size:15px;font-style: normal;">X</div>
        <img id="photo-content-img" style="border:5px solid #FFFFFF;"/>
    </div>
</div>

<div id="goTop" class="" style="bottom: 70px;">
    <div class="arrow"></div>
    <div class="stick"></div>
</div>


<c:choose>
    <c:when test="${not empty dashboard_model and dashboard_model eq 'album'}">
        <div class="modal fade in" id="createAlbumModal" aria-hidden="false" tabindex="-1" style="padding-right: 0 !important;">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
                        <h4 class="modal-title">New Album</h4></div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>相册名:</label>
                            <input class="form-control" type="text" name="album_name">
                        </div>
                        <div class="form-group">
                            <label>相册描述:</label>
                            <textarea class="form-control" type="text" name="album_desc"></textarea>
                        </div>
                        <div class="form-group">
                            <label>自动挂载：</label>
                            <input class="form-control" type="text" name="album_mount" placeholder="tagWrapper.name 或 photo.tags，自动挂载的照片不支持搜索">
                        </div>
                        <div class="form-group" style="padding-top: 5px;">
                            <label title="一行显示图片的数量">展示列数:</label>
                            <select class="select-inline" name="album_show_col" style="display:inline-block;margin-left: 6px;">
                                <option value="0">遵循默认配置</option>
                                <option value="1">显示1列</option>
                                <option value="2">显示2列</option>
                                <option value="3">显示3列</option>
                                <option value="4">显示4列</option>
                                <option value="5">显示5列</option>
                                <option value="6">显示6列</option>
                                <option value="7">显示7列</option>
                                <option value="8">显示8列</option>
                                <option value="9">显示9列</option>
                                <option value="10">显示10列</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label title="不公开意思是 不会在搜索结果、广场、用户主页中出现">相册权限：</label>
                            <select class="form-control" name="album_permission">
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
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-default" data-dismiss="modal">取消</button>
                        <button class="btn btn-primary" name="createAlbum_trigger">创建</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade in" id="updateAlbumModal" aria-hidden="false" tabindex="-1" style="padding-right: 0 !important;">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span
                                aria-hidden="true">×</span></button>
                        <h4 class="modal-title">更新相册信息</h4></div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>相册ID：</label>
                            <span name="album_id" class="control-label" style="display:inline-block;width: 50%;margin-left: 15px;"></span>
                        </div>
                        <div class="form-group">
                            <label>相册名称：</label>
                            <input class="form-control" type="text" name="album_name">
                        </div>
                        <div class="form-group">
                            <label>相册描述：</label>
                            <textarea class="form-control" type="text" name="album_desc"></textarea>
                        </div>
                        <div class="form-group">
                            <label>自动挂载：</label>
                            <input class="form-control" type="text" name="album_mount" placeholder="tagWrapper.name 或 photo.tags，自动挂载的照片不支持搜索">
                        </div>
                        <div class="form-group">
                            <a target="_blank"><label style="color: #666;cursor: pointer;">封面地址：</label></a>
                            <div class="input-group">
                                <input class="form-control" type="text" name="album_cover_path" placeholder="置空则使用默认封面"/>
                                <span class="input-group-addon btn btn-sm open-album-cover">访问</span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label title="不公开意思是 不会在搜索结果、广场、用户主页中出现">相册权限：</label>
                            <select class="form-control" name="album_permission">
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
                        <div class="form-group" style="padding-top: 5px;">
                            <label title="一行显示图片的数量">展示列数：</label>
                            <select class="select-inline" name="album_show_col" style="display:inline-block;margin-left: 6px;">
                                <option value="0">遵循默认配置</option>
                                <option value="1">显示1列</option>
                                <option value="2">显示2列</option>
                                <option value="3">显示3列</option>
                                <option value="4">显示4列</option>
                                <option value="5">显示5列</option>
                                <option value="6">显示6列</option>
                                <option value="7">显示7列</option>
                                <option value="8">显示8列</option>
                                <option value="9">显示9列</option>
                                <option value="10">显示10列</option>
                            </select>
                        </div>
                        <div class="form-group inline-group">
                            <label>照片数量：</label>
                            <span name="album_size" class="control-label" style="display:inline-block;width: 50%;margin-left: 7px;"></span>
                        </div>
                        <div class="form-group inline-group">
                            <label>创建时间：</label>
                            <span name="album_create_time" class="control-label" style="display:inline-block;width: 50%;margin-left: 7px;"></span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-danger" name="deleteAlbum_trigger">删除相册</button>
                        <button class="btn btn-primary" name="updateAlbum_trigger">更新信息</button>
                        <button class="btn btn-default" name="cancelBtn" data-dismiss="modal">关闭</button>
                    </div>
                </div>
            </div>
        </div>
    </c:when>
    <c:otherwise>
        <div class="modal fade in" id="uploadPhotoModal" aria-hidden="false" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span
                                aria-hidden="true">×</span></button>
                        <h4 class="modal-title">插入图片</h4></div>
                    <div class="modal-body">
                        <div class="form-group note-group-select-from-files">
                            <label>从本地上传</label>
                            <input class="note-image-input form-control" type="file" name="photos" accept="image/jpg,image/jpeg,image/webp,image/bmp,image/png,image/gif" multiple="multiple">
                        </div>
                        <div class="form-group">
                            <label>合集名称 / 权限：</label>
                            <div style="width: 100%">
                                <select name="topic" class="form-control topic-select" style="width: 50%;display: inline-block;">
                                    <option value="0" class="default-topic empty-topic" style="color: #d07a01">不设置</option>
                                </select>
                                <select name="topic-permission" class="form-control topic-permission-select" style="width: 49%;display: inline-block;">
                                    <option value="0" class="permission-follow-album default-permission" style="color: #d07a01">跟随当前相册</option>
                                    <option value="0" class="permission-no-follow">游客可见，不跟随</option>
                                    <option value="1" class="permission-no-follow" title="不会在搜索结果、广场、用户主页中出现">游客可见但不公开，不跟随</option>
                                    <option value="2" class="permission-no-follow">登陆可见，不跟随</option>
                                    <option value="3" class="permission-no-follow">登陆可见但不公开，不跟随</option>
                                    <option value="4" class="permission-no-follow" title="关注你的用户可见">粉丝可见，不跟随</option>
                                    <option value="5" class="permission-no-follow">粉丝可见但不公开，不跟随</option>
                                    <option value="6" class="permission-no-follow" title="你关注的用户可见">关注的用户可见，不跟随</option>
                                    <option value="7" class="permission-no-follow">关注的用户可见但不公开，不跟随</option>
                                    <option value="8" class="permission-no-follow">好友可见，不跟随</option>
                                    <option value="9" class="permission-no-follow">好友可见但不公开，不跟随</option>
                                    <option value="10" class="permission-no-follow">私有，不跟随</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group" style="overflow:auto;">
                            <label>名称：</label>
                            <input class="form-control" type="text" name="photo_name">
                        </div>
                        <div class="form-group" style="overflow:auto;">
                            <label>描述：</label>
                            <textarea class="form-control" type="text" name="photo_desc"></textarea>
                        </div>
                        <div class="form-group">
                            <label title="双击编辑所有标签" style="cursor: pointer">标签：</label>
                            <div class="input-group">
                                <span class="form-control tags-modify" name="tags">
                                    <input type="text" class="tag-input" name="tag_input"/>
                                </span>
                                <span class="input-group-addon btn btn-sm tags-edit-btn">编辑</span>
                            </div>
                        </div>
                        <div class="form-group" style="overflow:auto;">
                            <label>引用：</label>
                            <input class="form-control" type="text" name="photo_refer">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" name="uploadPhoto_trigger">插入图片</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade in" id="updatePhotoModal" aria-hidden="false" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span
                                aria-hidden="true">×</span></button>
                        <h4 class="modal-title">更新图片信息</h4></div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="control-label">图片ID：&nbsp;&nbsp;&nbsp;&nbsp;</label>
                            <a target="_blank" style="color: #666; cursor: pointer" title="打开照片详情页">
                                <span name="photo_id" class="control-label"></span>
                            </a>
                        </div>
                        <div class="form-group">
                            <label>
                                <div class="update-convert-photo-url" style="font-weight: bold;display: inline;">图片地址</div>
                                /
                                <div class="update-convert-photo-refer" style="font-weight: normal;display: inline;">图片相关</div>
                            </label>
                            <div class="update-photo-url" style="display: block">
                                <div class="input-group">
                                    <input class="form-control copy-input" type="text" value="http://imcoder.site/"/>
                                    <span class="input-group-addon btn btn-sm open-update-photo-url">访问</span>
                                </div>
                                <span class="control-label">
                                    <a class="copyPhotoUrl_btn" data-clipboard-target=".copy-input" style="cursor: pointer">点击复制</a>
                                    <a name="photo_path" style="cursor: pointer">点击下载</a>
                                </span>
                            </div>
                            <div class="update-photo-refer" style="display: none">
                                <div class="input-group">
                                    <input class="form-control" type="text" name="photo_refer">
                                    <span class="input-group-addon btn btn-sm open-update-photo-refer">访问</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group note-group-select-from-files">
                            <label title="不选择则不更新">更新图片文件</label>
                            <input class="note-image-input form-control" type="file" name="photo_file" accept="image/jpg,image/jpeg,image/webp,image/bmp,image/png,image/gif">
                        </div>
                        <div class="form-group">
                            <label>合集名称 / 权限：</label>
                            <div style="width: 100%">
                                <select name="topic" class="form-control topic-select" style="width: 50%;display: inline-block;">
                                    <option value="0" class="default-topic empty-topic" style="color: #d07a01">不设置</option>
                                </select>
                                <select name="topic-permission" class="form-control topic-permission-select" style="width: 49%;display: inline-block;">
                                    <option value="0" class="permission-follow-album default-permission" style="color: #d07a01">跟随当前相册</option>
                                    <option value="0" class="permission-no-follow">游客可见，不跟随</option>
                                    <option value="1" class="permission-no-follow" title="不会在搜索结果、广场、用户主页中出现">游客可见但不公开，不跟随</option>
                                    <option value="2" class="permission-no-follow">登陆可见，不跟随</option>
                                    <option value="3" class="permission-no-follow">登陆可见但不公开，不跟随</option>
                                    <option value="4" class="permission-no-follow" title="关注你的用户可见">粉丝可见，不跟随</option>
                                    <option value="5" class="permission-no-follow">粉丝可见但不公开，不跟随</option>
                                    <option value="6" class="permission-no-follow" title="你关注的用户可见">关注的用户可见，不跟随</option>
                                    <option value="7" class="permission-no-follow">关注的用户可见但不公开，不跟随</option>
                                    <option value="8" class="permission-no-follow">好友可见，不跟随</option>
                                    <option value="9" class="permission-no-follow">好友可见但不公开，不跟随</option>
                                    <option value="10" class="permission-no-follow">私有，不跟随</option>
                                </select>
                            </div>
                            <a target="_blank" style="color: #666; cursor: pointer" title="查看合集">
                                <span name="topic" class="control-label topic-name" style="display:inline-block;width: 50%;margin-left: 5px;"></span>
                            </a>
                        </div>
                        <div class="form-group">
                            <label>名称：</label>
                            <input class="form-control" type="text" name="photo_name">
                        </div>
                        <div class="form-group">
                            <label>描述：</label>
                            <textarea class="form-control" type="text" name="photo_desc"></textarea>
                        </div>
                        <div class="form-group">
                            <label title="双击编辑所有标签" style="cursor: pointer">标签：</label>
                            <div class="input-group">
                                <span class="form-control tags-modify" name="tags">
                                    <input type="text" class="tag-input" name="tag_input"/>
                                </span>
                                <span class="input-group-addon btn btn-sm tags-edit-btn">编辑</span>
                            </div>
                        </div>
                        <div class="form-group inline-group" style="padding-top: 7px">
                            <label class="control-label">图片大小：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>
                            <span name="photo_size" class="control-label"></span>
                        </div>
                        <div class="form-group inline-group">
                            <label class="control-label">上传时间：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>
                            <span name="photo_upload_time" class="control-label"></span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-danger" name="deletePhoto_trigger">删除图片</button>
                        <button class="btn btn-primary" name="updatePhoto_trigger">更新信息</button>
                        <button class="btn btn-default" name="cancelBtn" data-dismiss="modal">关闭</button>
                    </div>
                </div>
            </div>
        </div>
    </c:otherwise>
</c:choose>

<!-- login modal start -->
<div class="modal fade" id="login_Modal" tabindex="-1" role="dialog" aria-labelledby="loginModalLabel">
    <div class="modal-dialog" role="document">
        <div class="modal-content animated flipInY">
            <div class="modal-header text-center">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h2 class="modal-title" id="loginModalLabel">登录 / <a href="<%=basePath%>auth/register" target="_blank">注册</a></h2>
            </div>
            <form role="form" id="login_form">
                <div class="modal-body">
                    <div class="form-group">
                        <label>用户名</label>
                        <input type="email" name="identifier" class="form-control" placeholder="输入用户名/email">
                    </div>
                    <div class="form-group">
                        <label>密码</label>
                        <input type="password" name="credential" class="form-control" placeholder="输入密码">
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
<c:choose>
    <c:when test="${not empty dashboard_model and dashboard_model eq 'album'}">
        <script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="album_dashboard"></script>
    </c:when>
    <c:otherwise>
        <script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="album_photo_dashboard"></script>
    </c:otherwise>
</c:choose>
</body>
</html>