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
        <c:when test="${not empty clear_model and clear_model eq 'likes'}">
            <title>${hostUser.nickname}喜欢的视频 - ImCoder博客's 相册</title>
            <meta name="description" content="${hostUser.nickname}喜欢的视频列表">
            <meta name="keywords" content="${hostUser.nickname},喜欢,ImCoder's 博客,视频,视频列表,">
        </c:when>
        <c:when test="${not empty clear_model and clear_model eq 'history'}">
            <title>${hostUser.nickname}访问过的视频 - ImCoder博客's 相册</title>
            <meta name="description" content="${hostUser.nickname}访问过的视频列表">
            <meta name="keywords" content="${hostUser.nickname},访问历史,ImCoder's 博客,视频,视频列表,">
        </c:when>
        <c:when test="${not empty dashboard_model and dashboard_model eq 'video'}">
            <title>video dashboard - ImCoder博客's 相册</title>
            <meta name="description" content="视频看板dashboard">
            <meta name="keywords" content="视频,相册,dashboard,ImCoder's 博客">
        </c:when>
        <c:otherwise>
            <title>${hostUser.nickname}的视频 - ImCoder's 博客</title>
            <meta name="description" content="${hostUser.nickname}的视频列表">
            <meta name="keywords" content="${hostUser.nickname},ImCoder's 博客,视频,视频列表,">
        </c:otherwise>
    </c:choose>
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
    </style>

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
                <div class="" style="text-align:center;">
                    <c:choose>
                        <c:when test="${not empty clear_model and clear_model eq 'likes'}">
                            <h1 class="slogan-name" data-dashboard-model="video" data-clear-model="likes">${hostUser.nickname}</h1>
                            <h3 class="slogan-desc">赞过的视频</h3>
                        </c:when>
                        <c:when test="${not empty clear_model and clear_model eq 'history'}">
                            <h1 class="slogan-name" data-dashboard-model="video" data-clear-model="history">${hostUser.nickname}</h1>
                            <h3 class="slogan-desc">访问过的视频</h3>
                        </c:when>
                        <c:when test="${not empty dashboard_model and dashboard_model eq 'video'}">
                            <h1 class="slogan-name" data-dashboard-model="video">video dashboard</h1>
                            <h3 class="slogan-desc"></h3>
                        </c:when>
                        <c:otherwise>
                            <h1 class="slogan-name" hostUser="<s:eval expression="hostUser.uid"/>">${hostUser.nickname}</h1>
                            <h3 class="slogan-desc">${hostUser.description}</h3>
                            <h3>${hostUser.says}</h3>
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
                <c:choose>
                    <c:when test="${not empty dashboard_model and dashboard_model eq 'video'}">
                        <li class="active"><a href="<%=basePath%>video/dashboard">dashboard</a></li>
                    </c:when>
                    <c:when test="${not empty clear_model and clear_model eq 'likes'}">
                        <li class="active"><a href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/videos">/likes/videos">喜欢</a></li>
                    </c:when>
                    <c:when test="${not empty clear_model and clear_model eq 'history'}">
                        <li class="active"><a href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/videos">/history/videos">历史</a></li>
                    </c:when>
                    <c:otherwise>
                        <li><a href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/videos">${hostUser.nickname}</a></li>
                        <li class="active"><a>视频列表</a></li>
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
        <article class="row">

            <!-- main div start -->
            <article class="col-md-12 col-sm-12 col-xs-12" id="main" role="main">

                <!-- 视频管理  start -->
                <header class="post post-container video_options">
                    <h1 class="post-title" itemprop="name headline">
                        <style>
                            .post-title a:hover {
                                text-decoration: none;
                            }

                            .post-title a {
                                cursor: pointer
                            }
                        </style>
                        <c:choose>
                            <c:when test="${not empty dashboard_model and dashboard_model eq 'video'}">
                                <c:if test="${not empty loginUser}">
                                    <a class="option_user_videos" itemtype="url" target="_blank" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/videos">我的视频</a>
                                    <a class="option_user_albums" itemtype="url" target="_blank" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/albums">我的相册</a>
                                    <a class="option_run_tags_classification" itemtype="url" href="<%=basePath%>p/tags_square?image_type=video" target="_blank">标签索引</a>
                                </c:if>
                                <c:if test="${not empty clear_model && clear_model == 'likes'}">
                                    <a class="option_user_like_photos" itemtype="url" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/likes/photos" target="_blank" title="赞过的图片">喜爱图片</a>
                                </c:if>
                                <c:if test="${not empty clear_model && clear_model == 'history'}">
                                    <a class="option_user_history_photos" itemtype="url" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/history/photos" target="_blank" title="访问过的图片">历史图片</a>
                                </c:if>
                                <div style="float: right" class="options_right">
                                    <c:if test="${not empty loginUser}">
                                        <a class="option_user_history" itemtype="url" target="_blank" href="<%=basePath%>u/history">浏览历史</a>
                                    </c:if>
                                    <a class="option_video_square" itemtype="url" href="<%=basePath%>video/dashboard" target="_blank">视频广场</a>
                                    <a class="option_photo_square" itemtype="url" href="<%=basePath%>p/dashboard?model=photo" target="_blank">照片广场</a>
                                    <a class="option_album_square" itemtype="url" href="<%=basePath%>p/dashboard?model=album" target="_blank">相册广场</a>
                                </div>
                            </c:when>
                            <c:otherwise>
                                <c:choose>
                                    <c:when test="${ not empty loginUser and loginUser.uid == hostUser.uid }">
                                        <a class="option_upload" itemtype="url" id="uploadVideo" author="<s:eval expression="hostUser.uid"/>">上传新视频</a>
                                        <a class="option_user_albums" itemtype="url" target="_blank" href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/albums">我的相册</a>
                                    </c:when>
                                    <c:otherwise>
                                        <a class="option_user_albums" itemtype="url" target="_blank" href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/albums">Ta的相册</a>
                                    </c:otherwise>
                                </c:choose>
                                <div style="float: right" class="options_right">
                                    <c:if test="${not empty loginUser}">
                                        <a class="option_user_history" itemtype="url" target="_blank" href="<%=basePath%>u/history">浏览历史</a>
                                    </c:if>
                                    <a class="option_time_sort" itemtype="url" href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/videos?query_start=0" target="_blank">时间序</a>
                                    <a class="option_tags_index" itemtype="url" href="<%=basePath%>p/tags_square?uid=<s:eval expression="hostUser.uid"/>&image_type=video" target="_blank">标签索引</a>
                                    <a class="option_video_square" itemtype="url" href="<%=basePath%>video/dashboard" target="_blank">视频广场</a>
                                    <a class="option_photo_square" itemtype="url" href="<%=basePath%>p/dashboard?model=photo" target="_blank">照片广场</a>
                                </div>
                            </c:otherwise>
                        </c:choose>
                    </h1>
                </header>
                <!-- 视频管理  end -->

                <article class="post" style="background-color: #f8f8f8;box-shadow: 0px 0px 1px 0.5px #ddd;">
                    <section>
                        <div id="masonryContainer" class="" style="margin: 7px 6px 1px 6px">

                        </div>
                    </section>

                    <!-- 标签 start -->
                    <!-- 标签 end -->
                </article>

                <!-- 评论区 start -->
                <header class="post post-container row album-footer">
                    <ul class="post-meta footer-left">
                        <li>数量：<a id="video_count">0</a></li>
                    </ul>
                    <ul class="post-meta footer-right">
                        <ol class="page-navigator"></ol>
                    </ul>
                </header>
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

<div class="modal fade in" id="uploadVideoModal" aria-hidden="false" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span
                        aria-hidden="true">×</span></button>
                <h4 class="modal-title">上传视频</h4></div>
            <div class="modal-body">
                <div class="form-group">
                    <label>选择视频类型</label>
                    <select class="form-control" name="video_source_type">
                        <option value="0">上传本地文件</option>
                        <option value="1">引用视频链接</option>
                        <option value="2">引用代码块（IFrame）</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>选择视频</label>
                    <input class="note-image-input form-control" type="file" name="video_file" accept="video/mp4,video/webm,audio/mp3">
                </div>
                <div class="form-group" style="overflow:auto;display: none">
                    <label>代码块/链接：</label>
                    <textarea class="form-control" type="text" name="video_code"></textarea>
                </div>
                <div class="form-group">
                    <label>选择相册</label>
                    <select class="form-control" name="cover_album_id">

                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <div class="convert-upload-cover" style="font-weight: bold;display: inline;">上传封面</div>
                        /
                        <div class="convert-select-cover" style="font-weight: normal;display: inline;" title="选取已上传的照片ID">选择封面</div>
                    </label>
                    <input class="note-image-input form-control" type="file" name="cover_file" accept="image/jpg,image/jpeg,image/webp,image/bmp,image/png,image/gif">
                    <div class="input-group" style="margin-top: 5px;display: none;">
                        <input class="note-image-input form-control" name="cover_photo_id" value="0">
                        <span class="input-group-addon btn btn-sm open-upload-video-cover">访问</span>
                    </div>
                </div>
                <div class="form-group" style="overflow:auto;">
                    <label>名称：</label>
                    <input class="form-control" type="text" name="video_name">
                </div>
                <div class="form-group" style="overflow:auto;">
                    <label>描述：</label>
                    <textarea class="form-control" type="text" name="video_desc"></textarea>
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
                <div class="form-group">
                    <label>相关：</label>
                    <input class="form-control" type="text" name="video_refer">
                </div>
                <div class="form-group">
                    <label title="不公开意思是 不会在搜索结果、广场、用户主页中出现">视频可见性：</label>
                    <select class="form-control" name="video_permission">
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
                <div class="form-group inline-group" style="padding-top: 7px;">
                    <label class="control-label" title="是否作为LivePhoto播放">LivePhoto：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input type="radio" name="video_live_photo" value="0" checked="checked"> 否 </label>
                    <label class="radio-inline"><input type="radio" name="video_live_photo" value="1"> 是 </label>
                </div>
                <div class="form-group inline-group" style="padding-top: 7px;">
                    <label class="control-label" title="是否是语音消息" style="padding-right: 9px;">语音消息：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input type="radio" name="video_voice_message" value="0" checked="checked"> 否 </label>
                    <label class="radio-inline"><input type="radio" name="video_voice_message" value="1"> 是 </label>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" name="uploadVideo_trigger">插入视频</button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade in" id="updateVideoModal" aria-hidden="false" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span
                        aria-hidden="true">×</span></button>
                <h4 class="modal-title">更新视频信息</h4></div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="control-label">视频ID：&nbsp;&nbsp;&nbsp;&nbsp;</label>
                    <a target="_blank" style="color: #666; cursor: pointer" title="在详情页打开">
                        <span name="video_id" class="control-label"></span>
                    </a>
                </div>
                <div class="form-group">
                    <label class="control-label">所有者：&nbsp;&nbsp;&nbsp;&nbsp;</label>
                    <a target="_blank" style="color: #666; cursor: pointer" title="点击查看用户主页" href="">
                        <span name="user_id" class="control-label"></span>
                    </a>
                </div>
                <div class="form-group">
                    <label>选择视频类型</label>
                    <select class="form-control" name="video_source_type">
                        <option value="0">上传本地文件</option>
                        <option value="1">引用视频链接</option>
                        <option value="2">引用代码块（IFrame）</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>视频地址&nbsp;&nbsp;</label>
                    <input class="form-control copy-input" type="text" value="http://imcoder.site/"/>
                    <span class="control-label">
                        <a class="copyVideoUrl_btn" data-clipboard-target=".copy-input" style="cursor: pointer">点击复制</a>
                        <a name="video_path" style="cursor: pointer">点击下载</a>
                    </span>
                </div>
                <div class="form-group">
                    <label>选择视频</label>
                    <input class="note-image-input form-control" type="file" name="video_file" accept="video/mp4,video/webm,audio/mp3">
                </div>
                <div class="form-group" style="overflow:auto;display: none">
                    <label>代码块/链接：</label>
                    <textarea class="form-control" type="text" name="video_code"></textarea>
                </div>
                <div class="form-group">
                    <label>选择相册</label>
                    <select class="form-control" name="cover_album_id">
                        <option value="0">无相册</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <div class="convert-select-cover" style="font-weight: bold;display: inline;" title="选取已上传的照片ID">选择封面</div>
                        /
                        <div class="convert-upload-cover" style="font-weight: normal;display: inline;">上传封面</div>
                    </label>
                    <input class="note-image-input form-control" type="file" name="cover_file" accept="image/jpg,image/jpeg,image/webp,image/bmp,image/png,image/gif">
                    <div class="input-group" style="margin-top: 5px;display: none;">
                        <input class="note-image-input form-control" name="cover_photo_id" value="0">
                        <span class="input-group-addon btn btn-sm open-update-video-cover">访问</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>相关：</label>
                    <div class="input-group">
                        <input class="form-control" type="text" name="video_refer">
                        <span class="input-group-addon btn btn-sm open-update-video-refer">访问</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>名称：</label>
                    <input class="form-control" type="text" name="video_name">
                </div>
                <div class="form-group">
                    <label>描述：</label>
                    <textarea class="form-control" type="text" name="video_desc"></textarea>
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
                <div class="form-group">
                    <label title="不公开意思是 不会在搜索结果、广场、用户主页中出现">视频可见性：</label>
                    <select class="form-control" name="video_permission">
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
                <div class="form-group inline-group" style="padding-top: 7px;">
                    <label class="control-label" title="是否作为LivePhoto播放">LivePhoto：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input type="radio" name="video_live_photo" value="0" checked="checked"> 否 </label>
                    <label class="radio-inline"><input type="radio" name="video_live_photo" value="1"> 是 </label>
                </div>
                <div class="form-group inline-group" style="padding-top: 7px;">
                    <label class="control-label" title="是否是语音消息" style="padding-right: 9px;">语音消息：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input type="radio" name="video_voice_message" value="0" checked="checked"> 否 </label>
                    <label class="radio-inline"><input type="radio" name="video_voice_message" value="1"> 是 </label>
                </div>
                <div class="form-group inline-group">
                    <label class="control-label">视频大小：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>
                    <span name="video_size" class="control-label"></span>
                </div>
                <div class="form-group inline-group">
                    <label class="control-label">上传时间：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>
                    <span name="video_upload_time" class="control-label"></span>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-danger" name="deleteVideo_trigger">删除视频</button>
                <button class="btn btn-info form-btn-upload-subtitle-modal-open">上传字幕</button>
                <button class="btn form-btn-update-video-setting-modal-open" style="background-color:rgba(222, 160, 91, 0.98);color:#ffffff;">更新设置</button>
                <button class="btn btn-primary" name="updateVideo_trigger">更新信息</button>
                <button class="btn btn-default" name="cancelBtn" data-dismiss="modal">关闭</button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade in" id="uploadSubtitleModal" aria-hidden="false" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span
                        aria-hidden="true">×</span></button>
                <h4 class="modal-title">上传视频字幕</h4></div>
            <div class="modal-body">
                <div class="form-group form-group-subtitle-video-id">
                    <label class="control-label">视频ID：&nbsp;&nbsp;&nbsp;&nbsp;</label>
                    <a target="_blank" style="color: #666; cursor: pointer" title="在详情页打开">
                        <span class="form-subtitle-video-id" data-video-id="" class="control-label"></span>
                    </a>
                </div>
                <div class="form-group form-group-subtitle-file">
                    <label>选择字幕</label>
                    <input class="form-control form-subtitle-file" type="file" accept="text/vtt,application/ttml+xml">
                </div>
                <div class="form-group form-group-subtitle-name">
                    <label>名称：</label>
                    <input class="form-control form-subtitle-name" type="text">
                </div>
                <div class="form-group form-group-subtitle-lang">
                    <label>语言：</label>
                    <input class="form-control form-subtitle-lang" type="text">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-default form-btn-upload-subtitle-cancel" data-dismiss="modal">关闭</button>
                <button class="btn btn-primary form-btn-upload-subtitle-submit" type="button">上传</button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade in" id="updateVideoSettingModal" aria-hidden="false" tabindex="-1">
    <div class="modal-dialog" style="width:550px;">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span
                        aria-hidden="true">×</span></button>
                <h4 class="modal-title">更新视频设置</h4></div>
            <div class="modal-body">
                <div class="form-group form-group-subtitle-video-id">
                    <label class="control-label">视频ID：&nbsp;&nbsp;&nbsp;&nbsp;</label>
                    <a target="_blank" style="color: #666; cursor: pointer" title="在详情页打开">
                        <span class="form-vs-video-id" data-video-id="" class="control-label"></span>
                    </a>
                </div>
                <div class="form-group form-group-vs-disable-view">
                    <label class="control-label" title="其他人无论有没有权限是否可以查看（打开）">视频激活：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input type="radio" name="video_setting_disable_view" value="0"> 关闭 </label>
                    <label class="radio-inline"><input type="radio" name="video_setting_disable_view" value="1" checked="checked"> 开启 </label>
                </div>
                <div class="form-group form-group-vs-disable-send-comment">
                    <label class="control-label" title="用户发送评论">发送评论：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input type="radio" name="video_setting_disable_send_comment" value="0" checked="checked"> 关闭 </label>
                    <label class="radio-inline"><input type="radio" name="video_setting_disable_send_comment" value="1"> 开启 </label>
                </div>
                <div class="form-group form-group-vs-disable-list-comment">
                    <label class="control-label" title="用户查看评论">查看评论：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input type="radio" name="video_setting_disable_list_comment" value="0" checked="checked"> 关闭 </label>
                    <label class="radio-inline"><input type="radio" name="video_setting_disable_list_comment" value="1"> 开启 </label>
                </div>
                <div class="form-group form-group-vs-disable-embed">
                    <label class="control-label" title="支持embed嵌入">支持嵌入：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input type="radio" name="video_setting_disable_embed" value="0"> 关闭 </label>
                    <label class="radio-inline"><input type="radio" name="video_setting_disable_embed" value="1" checked="checked"> 开启 </label>
                </div>
                <div class="form-group form-group-vs-enable-loop">
                    <label class="control-label" title="开启循环播放">循环播放：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input type="radio" name="video_setting_enable_loop" value="0" checked="checked"> 关闭 </label>
                    <label class="radio-inline"><input type="radio" name="video_setting_enable_loop" value="1"> 开启 </label>
                </div>
                <div class="form-group form-group-vs-disable-download">
                    <label class="control-label" title="支持用户下载">支持下载：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input type="radio" name="video_setting_disable_download" value="0"> 关闭 </label>
                    <label class="radio-inline"><input type="radio" name="video_setting_disable_download" value="1" checked="checked"> 开启 </label>
                </div>
                <div class="form-group form-group-vs-rotate">
                    <label class="control-label" title="选择使用旋转角度">旋转角度：</label>
                    <label class="radio-inline" style="margin-left:10px;"><input type="radio" name="video_setting_rotate" value="0" checked="checked"> 0° </label>
                    <label class="radio-inline"><input type="radio" name="video_setting_rotate" value="90"> 90° </label>
                    <label class="radio-inline"><input type="radio" name="video_setting_rotate" value="180"> 180° </label>
                    <label class="radio-inline"><input type="radio" name="video_setting_rotate" value="270"> 270° </label>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-default form-btn-update-video-setting-cancel" data-dismiss="modal">关闭</button>
                <button class="btn btn-primary form-btn-update-video-setting-submit" type="button">修改</button>
            </div>
        </div>
    </div>
</div>

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
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="video_list"></script>

</body>
</html>