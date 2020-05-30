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
    <title>公告 - ImCoder's 博客</title>
    <meta name="keywords" content="imcoder.site,公告,ImCoder's 博客公告">
    <meta name="description" content="共有${page.rowCount}个公告，<c:forEach items="${articleList}" var="article">${article.title}，</c:forEach>...">
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
<body background="<%=staticPath%>img/bg-site.png" uid="<c:if test="${not empty loginUser}"><s:eval expression="loginUser.uid"/></c:if>">

<div id="first" class="" style="z-index:1000;">
    <div class="carousel-inner">
        <div class="">
            <div class="container">
                <div class="" style="text-align:center;">
                    <h1>ImCoder's 博客</h1>
                    <h3>对于攀登者来说，失掉往昔的足迹并不可惜，迷失了继续前时的方向却很危险。</h3>
                    <h3>Welcome to my blog</h3>
                    <p><a class="btn btn-large btn-success loginModal_trigger"><b>
                        <c:if test="${ empty loginUser }">登录 or 注册</c:if><c:if test="${ !empty loginUser }">已登录</c:if>
                    </b></a></p>
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
                <li class="active"><a href="<%=basePath%>notices">公告</a></li>
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

<div id="body">
    <div class="container">
        <article class="row">

            <!-- 左侧区域  start -->
            <article id="main" class="col-md-12 col-sm-12 col-xs-12" role="main">
                <!-- 推荐区 start -->
                <article class="post" id="top" style="display:none;">
                    <section class="post-container">
                        <div class="tabs-container" style="">
                            <div class="tabs-right">
                                <ul class="nav nav-tabs" id="top_nav">
                                </ul>
                                <div class="tab-content" id="top_content">
                                </div>
                            </div>
                        </div>
                    </section>
                </article>
                <!-- 推荐区  end -->

                <c:forEach items="${articleList}" var="article">
                    <!-- 文章项 start -->
                    <article class="post" itemscope="" itemtype="http://schema.org/BlogPosting">
                        <header class="post-container">
                            <!-- 文章标题 -->
                            <h2 class="post-title" itemprop="name headline">
                                <a itemtype="url" href="<%=basePath%>notice/<s:eval expression="article.aid"/>" target="_blank">${article.title}</a>
                            </h2>
                            <!-- 文章头 -->
                            <ul class="post-meta">
                                <li>
                                    作者: <a href="<%=basePath%>u/<s:eval expression="article.author.uid"/>/home" target="_blank">${article.author.nickname}</a>
                                </li>
                                <li>
                                    分类: <a href="<%=basePath%>a/list?category.atid=${article.category.atid}" target="_blank">${article.category.atname}</a>
                                </li>
                                <li>
                                    <time datetime="${article.create_time}" itemprop="datePublished">
                                        <s:eval expression="article.create_time"/>
                                    </time>
                                </li>
                            </ul>
                            <!-- 文章摘要 -->
                            <section class="post-content" itemprop="articleBody">
                                <s:eval expression="article.summary"/>
                                <p class="more">
                                    <br><a href="<%=basePath%>notice/<s:eval expression="article.aid"/>" title="${article.title}" target="_blank">- 阅读剩余部分 -</a>
                                </p>
                            </section>
                        </header>
                        <!-- 文章尾 -->
                        <footer class="post-footer">
                            <p>
                                <span itemprop="keywords" class="tags">标签:
                                    <c:forTokens items="${article.tags}" delims="#" var="tag">
                                        &nbsp;&nbsp;&nbsp;<a href="<%=basePath%>a/list?tags=${tag}" target="_blank">#${tag}</a>
                                    </c:forTokens>
                                </span>
                                <c:choose>
                                    <c:when test="${article.comment_count == 0 }">
                                        <a class="post-comments" itemprop="discussionUrl" href="<%=basePath%>notice/<s:eval expression="article.aid"/>#addComment" target="_blank">抢占沙发</a>
                                    </c:when>
                                    <c:otherwise>
                                        <a class="post-comments" itemprop="discussionUrl" href="<%=basePath%>notice/<s:eval expression="article.aid"/>#comments" target="_blank">${article.comment_count} 条评论</a>
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

            </article>
            <!-- 左侧区域#main  end -->

        </article><!-- end .row -->
    </div>
</div><!-- end #body -->

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

<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="notices"></script>

</body>
</html>