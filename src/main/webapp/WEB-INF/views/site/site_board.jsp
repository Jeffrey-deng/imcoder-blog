﻿
<%@ page language="java" import="site.imcoder.blog.entity.Article" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.Config" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ page import="java.util.regex.Matcher" %>
<%@ page import="java.util.regex.Pattern" %>
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
    String cover = "";
    Matcher matcher = Pattern.compile("src=\"([^\"]+?)\"").matcher(((Article) request.getAttribute("article")).getSummary());
    if (matcher.find()) {
        cover = matcher.group(1);
    }
    request.setAttribute("article_cover", cover);
%>
<!DOCTYPE html>
<html class="no-js">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="renderer" content="webkit">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
    <title>${article.title} - ImCoder's 博客</title>
    <meta name="keywords" content="imcoder.site看板,公告,关于">
    <meta name="description" content="此site为大学学完Java后，为练习而开发的，后面发现可以用来总结下平时所学的知识，便一直在维护。欢迎一起学习交流！ contact me ~ Jeffrey.c.deng@gmail.com">
    <meta property="og:title" content="${article.title} - ${article.author.nickname}"/>
    <meta property="og:site_name" content="ImCoder's 博客">
    <meta property="og:description" content="<%=((Article)request.getAttribute("article")).getTags().replace("##", "# #")%>">
    <meta property="og:type" content="article"/>
    <meta property="og:image" content="${article_cover}"/>
    <!-- 使用url函数转换相关路径 -->
    <!-- <script async="" src="http://www.google-analytics.com/analytics.js"></script> -->

    <!-- 引入文件 -->
    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css<%=urlArgs%>">
    <%--<link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.min.css<%=urlArgs%>">--%>
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/magnific-popup/magnific-popup.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>css/style.css<%=urlArgs%>">

    <style>

        .comment-list-header {
            color: #e7eaec;
        }

        .comment-list-header .dropdown-menu li {
            color: #666;
        }

        .comment-list-header, a.comment-add-new {
            color: rgba(204, 204, 204, 0.8);
        }

        a.comment-add-new:hover, a.comment-add-new:focus {
            color: #337ab7;
        }

        a.comment-add-new:active {
            color: rgba(204, 204, 204, 0.8);
        }
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
<body uid="<c:if test="${not empty loginUser}"><s:eval expression="loginUser.uid"/></c:if>" <%--background="<%=staticPath%>img/bg-site.png"--%>>
<!-- <body background="../../img/bg-site.png"> -->
<!-- START THE COVER  background-image: url(img/bg-site.png);" -->
<div id="first" class="" style="z-index:1000;">
    <div class="carousel-inner">
        <div class="">
            <div class="container">
                <div class="" style="text-align:center;">
                    <h1 class="slogan-name" data-user-id="<s:eval expression="article.author.uid"/>" data-article-id="<s:eval expression="article.aid"/>">ImCoder's 博客</h1>
                    <h3 class="slogan-desc">叶落九秋枝未枯兮，水迎孤月遥未有辞，尔胡以有不自平兮，非心之逑兮以为然</h3>
                    <h3>Welcome to my blog</h3>
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
                <li class="active"><a>${article.title}</a></li>
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
        <article class="row" itemscope itemtype="http://schema.org/Article" itemid="<s:eval expression="article.aid"/>">

            <!-- 作者区  start -->
            <aside class="col-md-3 col-sm-12 col-xs-12" style="display:none;">

                <section class="post-author" id="user_rank" itemprop="author" itemscope itemtype="http://schema.org/Organization" itemid="<s:eval expression="article.author.uid"/>">
                    <div class="widget-profile-box">
                        <div class="head-photo-frosted-bg" style="background-image: url('<s:eval expression="article.author.head_photo"/>');"></div>
                        <div class="author-nickname-wrapper">
                            <h2 class="author-nickname author-uid" data-author-uid="<s:eval expression="article.author.uid"/>" itemprop="nickname name">
                                <a href="<%=basePath%>u/<s:eval expression="article.author.uid"/>/home" itemprop="url">${article.author.nickname}</a>
                            </h2>
                            <small class="author-user-group" itemprop="memberOf">${article.author.userGroup.group_name}</small>
                        </div>
                        <img class="author-head-photo" src="<s:eval expression="article.author.head_photo"/>" alt="head-photo" itemprop="image">
                        <div class="author-post-stats">
                            <span><a class="author-articleCount" target="_blank" href="<%=basePath%>u/<s:eval expression="article.author.uid"/>/home" itemprop="articleCount">${article.author.userStats.articleCount} 动态</a></span> |
                            <span><a class="author-followingCount" target="_blank" href="<%=basePath%>u/<s:eval expression="article.author.uid"/>/contact/followings" itemprop="followingCount">${article.author.userStats.followingCount} 关注</a></span> |
                            <span><a class="author-followerCount" target="_blank" href="<%=basePath%>u/<s:eval expression="article.author.uid"/>/contact/followers" itemprop="followerCount">${article.author.userStats.followerCount} 关注者</a></span>
                        </div>
                    </div>
                    <div class="widget-text-box">
                        <!-- hide 'follow' button when article's author is loginUser  -->
                        <c:choose>
                            <c:when test="${!((not empty loginUser) and (loginUser.uid == article.author.uid))}">
                                <div class="widget-handle-box">
                                    <a name="follow" data-followed="false" class="btn btn-xs btn-primary follow" role="button"><i class="fa fa-thumbs-up"></i>关注</a>
                                    <a name="letter" class="btn btn-xs btn-white letter"><i class="fa fa-heart" role="button"></i>私信</a>
                                </div>
                            </c:when>
                            <c:otherwise>
                                <div class="author-description" itemprop="description">
                                        ${article.author.description}
                                </div>
                            </c:otherwise>
                        </c:choose>
                    </div>
                </section>

                <section class="post" id="article_rank">
                    <p class="ui red ribbon label">文章Rank</p>
                    <p></p>
                    <ul>
                        <li>访问：<span class="article_click_count" itemprop="clickCount">${article.click_count}</span>&nbsp;次</li>
                        <li>评论：<span class="article_comment_count" itemprop="commentCount">${article.comment_count}</span>&nbsp;次</li>
                        <li>点赞：<span class="article_like_count" itemprop="likeCount">0</span>&nbsp;次</li>
                        <li>收藏：<span class="article_collect_count" itemprop="collectCount">${article.collect_count}</span>&nbsp;次</li>
                    </ul>
                </section>

                <section class="post hidden-xs" id="article_class">
                    <p class="ui red ribbon label">文章分类</p>
                    <p></p>
                    <ul id="rank_class">
                        <c:forEach items="${categoryCount}" var="category">
                            <li><a href="<%=basePath%>a/list?category.atid=${ category.atid }">${ category.atname }：(<span>${ category.count }</span>)</a></li>
                        </c:forEach>
                    </ul>
                </section>

                <section class="post hidden-xs" id="article_hot">
                    <p class="ui red ribbon label">
                        <a title="将文章按点击量排序" target="_blank" href="<%=basePath%>a/list?click_count=-1" style="color:white;text-decoration: none;">热门文章</a>
                    </p>
                    <p></p>
                    <ul id="rank_hot" class="rank-list">
                    </ul>
                </section>

                <section class="post hidden-xs" id="article_hotTag">
                    <p class="ui red ribbon label">
                        <a title="查看所有标签" target="_blank" href="<%=basePath%>a/tags" style="color:white;text-decoration: none;">热门标签</a>
                    </p>
                    <p></p>
                    <ul id="rank_hotTag" class="rank-list"></ul>
                </section>

                <section class="post hidden-xs" id="article_new">
                    <p class="ui red ribbon label">
                        <a title="查看文章归档" target="_blank" href="<%=basePath%>a/archives" style="color:white;text-decoration: none;">最新文章</a>
                    </p>
                    <p></p>
                    <ul id="rank_newest" class="rank-list">
                    </ul>
                </section>

            </aside>
            <!-- 作者区  end -->

            <!-- main div start -->
            <article class="col-md-12 col-sm-12 col-xs-12" id="main" role="main">

                <!-- 文章头  start -->
                <header class="post post-container article-header" style="overflow:visible">
                    <h1 class="post-title article-id" data-aid="<s:eval expression="article.aid"/>" itemprop="name headline">
                        <a class="article-title" itemprop="url">${article.title}</a>
                    </h1>
                    <p>
                    <ul class="post-meta">
                        <li>
                            <time class="article-time" title="更新时间：<s:eval expression="article.update_time"/>" datetime="${article.create_time}" itemprop="datePublished">
                                <s:eval expression="article.create_time"/>
                            </time>
                        </li>
                        <li>分类: <a class="article-category" href="<%=basePath%>a/list?category.atid=${article.category.atid}" target="_blank" itemprop="category about">${article.category.atname}</a></li>
                    </ul>
                    </p>
                </header>
                <!-- 文章头  end -->

                <article class="post">
                    <!-- 文章内容 start -->
                    <section class="post-container">
                        <div class="post-content article-detail" itemprop="articleBody">
                            <s:eval expression="article.detail"/>
                        </div>
                    </section>
                    <!-- 文章内容 end -->

                    <!-- 标签 start -->
                    <footer class="post-footer">
                        <p class="tags article-tags" itemprop="keywords">标签:
                            <c:forTokens items="${article.tags}" delims="#" var="tag">
                                &nbsp;&nbsp;&nbsp;<a href="<%=basePath%>a/list?tags=${tag}" target="_blank">#${tag}#</a>
                            </c:forTokens>
                        </p>
                    </footer>
                    <!-- 标签 end -->
                </article>

                <!-- 评论区 start -->
                <article>
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
<div id="goTop" class="" style="bottom: 70px;">
    <div class="arrow"></div>
    <div class="stick"></div>
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

<div id="site_background_wrap" class="site-background-wrap">
    <div class="site-background">
        <div class="site-background-canvas">
            <div class="site-background-canvas-image" style="background-image: url('<%=staticPath%>img/site_background_canvas_image.webp');"></div>
            <div class="site-background-canvas-video-wrap">
                <video class="site-background-canvas-video" role="presentation" preload="auto" playsinline="" loop="" muted="" autoplay="true"></video>
            </div>
            <div class="site-background-canvas-overlay" style="background-image: url('<%=staticPath%>img/site_background_canvas_overlay.png');"></div>
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

<script src="<%=staticPath%>lib/highlight/highlight.min.js"></script>
<script>hljs.initHighlightingOnLoad();</script>
<a id="basePath" class="site-path-prefix" href="<%=basePath%>" style="display:none;"></a>
<a id="staticPath" class="site-path-prefix" href="<%=staticPath%>" style="display:none;"></a>
<a id="cloudPath" class="site-path-prefix" href="<%=cloudPath%>" style="display:none;"></a>
<!-- Bootstrap & Plugins core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="site_board"></script>

<!-- ######################################### -->
</body>
</html>