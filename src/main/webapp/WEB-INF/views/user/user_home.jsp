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
    <%--<base href="<%=basePath%>" target="_self">--%>
    <title>${hostUser.nickname}的个人博客 | ImCoder's 博客</title>
    <meta name="keywords" content="${hostUser.nickname},主页,个人博客,ImCoder's 博客">
    <meta name="description" content="${hostUser.description}">
    <!-- 引入文件 -->
    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css<%=urlArgs%>">
    <%--<link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.min.css<%=urlArgs%>">--%>
    <link rel="stylesheet" href="<%=staticPath%>css/style.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">

    <!-- 修复某些移动端浏览器设置UA为PC，页面仍显示手机版的问题 -->
    <script>
        if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) && (window.screen.availWidth <= 768 || window.screen.availHeight <= 768) && window.devicePixelRatio >= 2) {
            var viewport = document.querySelector("meta[name=viewport]")
                ,content = viewport.getAttribute('content');
            viewport.setAttribute('content', content.replace(/(initial-scale=).*?(,|$)/, '$1' + (1 / window.devicePixelRatio) + '$2'));
        }
    </script>
</head>
<body uid="<c:if test="${not empty loginUser}"><s:eval expression="loginUser.uid"/></c:if>" style="background-image: url('<%=staticPath%>img/bg-site.png');">
<!-- <body background="../../img/bg-site.png"> -->

<!-- START THE COVER  background-image: url(img/bg-site.png);" -->
<div id="first" class="" style="text-align:center;z-index:1000;">
    <div class="carousel-inner">
        <div class="container">
            <h1 class="slogan-name" data-user-id="<s:eval expression="hostUser.uid"/>">${hostUser.nickname}</h1>
            <h3 class="slogan-desc">${hostUser.description}</h3>
            <!-- hide 'follow' button when hostUser is loginUser  -->
            <c:if test="${ !( (!empty loginUser) and (loginUser.uid==hostUser.uid) ) }">
                <p><a name="follow" data-followed="false" class="btn btn-large btn-success follow" role="button"><b>关注</b></a></p>
            </c:if>
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
                <li class="active"><a href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/home">${hostUser.nickname}</a></li>
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

            <!-- 作者区  start -->
            <aside class="col-md-3 col-sm-12 col-xs-12">

                <section class="post-author" id="user_rank">
                    <div class="widget-profile-box">
                        <div class="head-photo-frosted-bg" style="background-image: url('<s:eval expression="hostUser.head_photo"/>');"></div>
                        <div class="author-nickname-wrapper">
                            <h2 class="author-nickname author-uid" data-author-uid="<s:eval expression="hostUser.uid"/>">
                                <a href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/home">${hostUser.nickname}</a>
                            </h2>
                            <small class="author-user-group">${hostUser.userGroup.group_name}</small>
                        </div>
                        <div class="author-head-photo" style="background-image:url('<s:eval expression="hostUser.head_photo"/>')" alt="head-photo"></div>
                        <div class="author-post-stats">
                            <span><a class="author-articleCount" target="_blank" href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/home">${hostUser.userStats.articleCount} 动态</a></span> |
                            <span><a class="author-followingCount" target="_blank" href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/contact/followings">${hostUser.userStats.followingCount} 关注</a></span> |
                            <span><a class="author-followerCount" target="_blank" href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/contact/followers">${hostUser.userStats.followerCount} 关注者</a></span>
                        </div>
                        <!-- hide when hostUser is loginUser and show in bottom div -->
                        <c:if test="${!((not empty loginUser) and (loginUser.uid == hostUser.uid))}">
                            <div class="author-says">
                                    ${hostUser.says}
                            </div>
                        </c:if>
                    </div>
                    <div class="widget-text-box">
                        <!-- hide 'follow' button when hostUser is loginUser  -->
                        <c:choose>
                            <c:when test="${!((not empty loginUser) and (loginUser.uid == hostUser.uid))}">
                                <div class="widget-handle-box">
                                    <a name="follow" data-followed="false" class="btn btn-xs btn-primary follow" role="button"><i class="fa fa-thumbs-up"></i>关注</a>
                                    <a name="letter" class="btn btn-xs btn-white letter" role="button"><i class="fa fa-heart"></i>私信</a>
                                </div>
                            </c:when>
                            <c:otherwise>
                                <div class="author-says">
                                        ${hostUser.says}
                                </div>
                            </c:otherwise>
                        </c:choose>
                    </div>
                </section>

                <section class="post" id="article_rank">
                    <p class="ui red ribbon label">文章Rank</p>
                    <p></p>
                    <ul>
                        <li>访问：<span>${hostUser.userStats.articleClickCount}</span>&nbsp;次</li>
                        <li>评论：<span>${hostUser.userStats.articleCommentCount}</span>&nbsp;次</li>
                        <li>点赞：<span>0</span>&nbsp;次</li>
                        <li>收藏：<span>${hostUser.userStats.articleCollectCount}</span>&nbsp;次</li>
                    </ul>
                </section>

                <section class="post hidden-xs" id="photos_show">
                    <p class="ui red ribbon label"><a title="点击打开相册" target="_blank" href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/albums" style="color:white;text-decoration: none;">Photos</a></p>
                    <p></p>
                    <div class="photos">
                    </div>
                </section>

                <section class="post" id="article_class">
                    <p class="ui red ribbon label">文章分类</p>
                    <p></p>
                    <ul id="rank_class">
                        <c:forEach items="${hostUser.userStats.articleCateCount}" var="category">
                            <li><a href="<%=basePath%>a/list?category.atid=${category.atid}&author.uid=<s:eval expression="hostUser.uid"/>">${category.atname}：(<span>${category.count}</span>)</a></li>
                        </c:forEach>
                    </ul>
                </section>

                <section class="post" id="article_hot">
                    <p class="ui red ribbon label">
                        <a title="将文章按点击量排序" target="_blank" href="<%=basePath%>a/list?click_count=-1" style="color:white;text-decoration: none;">热门文章</a>
                    </p>
                    <p></p>
                    <ul id="rank_hot" class="rank-list"></ul>
                </section>

                <section class="post" id="article_hotTag">
                    <p class="ui red ribbon label">
                        <a title="查看所有标签" target="_blank" href="<%=basePath%>a/tags" style="color:white;text-decoration: none;">热门标签</a>
                    </p>
                    <p></p>
                    <ul id="rank_hotTag" class="rank-list"></ul>
                </section>

                <section class="post" id="article_newest">
                    <p class="ui red ribbon label">
                        <a title="查看文章归档" target="_blank" href="<%=basePath%>a/archives" style="color:white;text-decoration: none;">最新文章</a>
                    </p>
                    <p></p>
                    <ul id="rank_newest" class="rank-list"></ul>
                </section>

            </aside>
            <!-- 作者区  end -->

            <!-- 右侧区域  start -->
            <article id="main" class="col-md-9 col-sm-12 col-xs-12" role="main">

                <!-- 用户导航头  start -->
                <header class="post post-container">
                    <ul class="post-meta user-data-path" style="margin-top: 0px;margin-bottom: 0px;font-size: 14px;">
                        <li id="btn_user_profile_modal_open" data-uid="<s:eval expression="hostUser.uid"/>"><a>资料</a></li>
                        <li><a href="<%=basePath%>u/<s:eval expression="hostUser.uid"/>/albums" target="_blank">相册</a></li>
                        <li><a href="<%=basePath%>a/archives?uid=<s:eval expression="hostUser.uid"/>" target="_blank">归档</a></li>
                        <li><a href="<%=basePath%>a/tags?uid=<s:eval expression="hostUser.uid"/>" target="_blank">标签</a></li>
                    </ul>
                </header>
                <!-- 用户导航头  end -->

                <c:choose>
                    <c:when test="${not empty articleList}">
                        <c:forEach items="${articleList}" var="article">
                            <!-- 文章项 start -->
                            <article class="post" itemscope itemtype="http://schema.org/Article" itemid="<s:eval expression="article.aid"/>">
                                <header class="post-container">
                                    <!-- 文章标题 -->
                                    <h2 class="post-title" itemprop="name headline">
                                        <a href="<%=basePath%>a/detail/<s:eval expression="article.aid"/>" target="_blank" itemprop="url">
                                                ${article.title}
                                        </a>
                                    </h2>
                                    <!-- 文章meta -->
                                    <ul class="post-meta">
                                        <li>
                                            <time datetime="${article.create_time}" itemprop="datePublished"><s:eval expression="article.create_time"/></time>
                                        </li>
                                        <li>
                                            分类: <a href="<%=basePath%>a/list?category.atid=${article.category.atid}" target="_blank" itemprop="category about">${article.category.atname}</a>
                                        </li>
                                    </ul>
                                    <!-- 文章摘要 -->
                                    <section class="post-content" itemprop="articleBody">
                                        <s:eval expression="article.summary"/>
                                        <p class="more">
                                            <br>
                                            <a href="<%=basePath%>a/detail/<s:eval expression="article.aid"/>" title="${article.title}" target="_blank">- 阅读剩余部分 -</a>
                                        </p>
                                    </section>
                                </header>
                                <!-- 文章尾 -->
                                <footer class="post-footer">
                                    <p>
                                    <span class="tags" itemprop="keywords">标签:
                                        <c:forTokens items="${article.tags}" delims="#" var="tag">
                                            &nbsp;&nbsp;&nbsp;<a href="<%=basePath%>a/list?tags=${tag}" target="_blank">#${tag}#</a>
                                        </c:forTokens>
                                    </span>
                                        <c:choose>
                                            <c:when test="${article.comment_count == 0}">
                                                <a class="post-comments" href="<%=basePath%>a/detail/<s:eval expression="article.aid"/>#addComment" target="_blank" itemprop="discussionUrl">抢占沙发</a>
                                            </c:when>
                                            <c:otherwise>
                                                <a class="post-comments" href="<%=basePath%>a/detail/<s:eval expression="article.aid"/>#comments" target="_blank"><span itemprop="commentCount discussionUrl">${article.comment_count}</span> 条评论</a>
                                            </c:otherwise>
                                        </c:choose>
                                    </p>
                                </footer>
                            </article>
                            <!-- 文章项 end -->
                        </c:forEach>

                        <!-- 分页 start -->
                        <ol class="page-navigator">
                            <c:if test="${ not empty page }">
                                <c:if test="${page.currentPage != 1}">
                                    <li class="prev"><a class="page-trigger" page="${page.currentPage-1}">« 前一页</a></li>
                                </c:if>
                                <c:if test="${page.currentPage-3 >= 1+2}">
                                    <li><a class="page-trigger" page="1">1</a></li>
                                    <li><span>...</span></li>
                                </c:if>
                                <c:forEach begin="${(page.currentPage-3 >= 1+2)?page.currentPage-3:1}" end="${page.currentPage-1}" var="pagenum">
                                    <li><a class="page-trigger" page="${pagenum}">${pagenum}</a></li>
                                </c:forEach>
                                <li class="current"><a class="page-trigger" page="${page.currentPage}">${page.currentPage}</a></li>
                                <c:forEach begin="${page.currentPage+1}" end="${(page.currentPage+3 <= page.pageCount-2)?page.currentPage+3:page.pageCount}" var="pagenum">
                                    <li><a class="page-trigger" page="${pagenum}">${pagenum}</a></li>
                                </c:forEach>
                                <c:if test="${page.currentPage+3 <= page.pageCount-2}">
                                    <li><span>...</span></li>
                                    <li><a class="page-trigger" page="${ page.pageCount}">${ page.pageCount}</a></li>
                                </c:if>
                                <c:if test="${page.currentPage != page.pageCount }">
                                    <li class="next"><a class="page-trigger" page="${page.currentPage+1}">后一页 »</a></li>
                                </c:if>
                            </c:if>
                        </ol>
                        <!-- 分页 end -->
                    </c:when>
                    <c:otherwise>
                        <!-- 如果没发表文章则显示如下 -->
                        <article class="post" itemscope="" itemtype="http://schema.org/BlogPosting">
                            <section class="post-container">
                                <h2 class="post-title" itemprop="name headline">没有发表文章</h2>
                            </section>
                        </article>
                    </c:otherwise>
                </c:choose>

            </article>
            <!-- 右侧区域#main  end -->

        </article><!-- end row -->
    </div>
</div>
<!-- body end -->

<div id="goTop" class="" style="bottom: 70px;">
    <div class="arrow"></div>
    <div class="stick"></div>
</div>

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
                        <label class="col-sm-4 col-xs-4 control-label"><img class="form-user-head-photo" style="height: 50px;"></label>
                        <span class="col-sm-7 col-xs-7 control-label form-user-nickname" style="height: 50px;line-height:50px;vertical-align:middle;"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">用户组:</label>
                        <span class="col-sm-7 col-xs-7 control-label form-user-group"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">性别:</label>
                        <span class="col-sm-7 col-xs-7 control-label form-user-sex"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">自我介绍:</label>
                        <span class="col-sm-7 col-xs-7 control-label form-user-description"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">生日:</label>
                        <span class="col-sm-7 col-xs-7 control-label form-user-birthday"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">地址:</label>
                        <span class="col-sm-7 col-xs-7 control-label form-user-address"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">微博:</label>
                        <span class="col-sm-7 col-xs-7 control-label form-user-weibo"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">主页:</label>
                        <span class="col-sm-7 col-xs-7 control-label form-user-site"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">QQ:</label>
                        <span class="col-sm-7 col-xs-7 control-label form-user-qq"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">文章数:</label>
                        <span class="col-sm-7 col-xs-7 control-label form-user-article-count"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">关注数:</label>
                        <span class="col-sm-7 col-xs-7 control-label form-user-following-count"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">粉丝数:</label>
                        <span class="col-sm-7 col-xs-7 control-label form-user-follower-count"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">签名:</label>
                        <span class="col-sm-7 col-xs-7 control-label form-user-says"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">注册时间:</label>
                        <span class="col-sm-7 col-xs-7 control-label form-user-register-time"></span>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>
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

<script src="<%=staticPath%>lib/highlight/highlight.min.js"></script>
<script>hljs.initHighlightingOnLoad();</script>
<a id="basePath" class="site-path-prefix" href="<%=basePath%>" style="display:none;"></a>
<a id="staticPath" class="site-path-prefix" href="<%=staticPath%>" style="display:none;"></a>
<a id="cloudPath" class="site-path-prefix" href="<%=cloudPath%>" style="display:none;"></a>
<!-- Bootstrap & Plugins core JavaScript -->
<!-- ######################################### -->
<!-- Placed at the end of the document so the pages load faster -->
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="user_home"></script>

</body>
</html>