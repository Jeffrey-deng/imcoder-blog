<%@ page language="java" import="site.imcoder.blog.common.PageUtil" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.entity.Article" %>
<%@ page import="site.imcoder.blog.setting.Config" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ page import="java.util.ArrayList" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jstl/fmt_rt" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%
    String path = request.getContextPath();
    String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
    String staticPath = Config.get(ConfigConstants.SITE_CDN_ADDR);
    String cloudPath = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
    String urlArgs = Config.get(ConfigConstants.SITE_CDN_ADDR_ARGS);
%>
<%
    Article condition = (Article) request.getAttribute("condition");
    PageUtil pageUtil = (PageUtil) request.getAttribute("page");
    String description = "";
    String title = null;
    int rowCount = pageUtil == null ? 0 : pageUtil.getRowCount();
    if (condition.getCategory() != null) {
        description += "分类为 '" + condition.getCategory().getAtname() + "' 的文章共" + rowCount + "篇。";
        title = condition.getCategory().getAtname();
    } else if (condition.getTags() != null) {
        description += "贴有标签为 '" + condition.getTags() + "' 的文章共有" + rowCount + "篇。";
        title = condition.getTags();
    } else if (condition.getTitle() != null) {
        description += "文章标题为 '" + condition.getTitle() + "' 的搜索结果如下，共" + rowCount + "篇。";
        title = condition.getTitle();
    }
    if (rowCount > 0 && (pageUtil.getCurrentPage() > 1 || !description.equals(""))) {
        description += "第" + pageUtil.getCurrentPage() + "页：";
        for (Article article : ((ArrayList<Article>) (request.getAttribute("articleList")))) {
            description += article.getTitle() + "、";
        }
    } else if (description.equals("") && rowCount > 0) {
        description = "此site为大学学完Java后，为练习而开发的，后面发现可以用来总结下平时所学的知识，便一直在维护。欢迎一起学习交流！ contact me ~ Jeffrey.c.deng@gmail.com";
    }

    if (title == null) {
        title = "ImCODER's 博客";
    } else {
        title = title + " - ImCODER's 博客";
    }
    request.setAttribute("description", description);
    request.setAttribute("title", title);
%>
<!DOCTYPE html>
<html class="no-js">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="renderer" content="webkit">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="ImCODER's 博客,CODER 博客,程序员,码农,JAVA,大数据">
    <!-- 使用url函数转换相关路径 -->
    <!-- <script async="" src="http://www.google-analytics.com/analytics.js"></script> -->

    <!-- 引入文件 -->
    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>css/style.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">
</head>

<body background="<%=staticPath%>img/bg-site.png" uid="${loginUser.uid}">

<div id="first" class="" style="z-index:1000;">
    <div class="carousel-inner">
        <div class="">
            <div class="container">
                <div class="" style="text-align:center;">
                    <h1>ImCODER's 博客</h1>
                    <h3>对于攀登者来说，失掉往昔的足迹并不可惜，迷失了继续前进时的方向却很危险。</h3>
                    <h3>A coder's journal</h3>
                    <p>
                        <a class="btn btn-large btn-success loginModal_trigger"><b>
                            <c:if test="${ empty loginUser }">登录 or 注册</c:if>
                            <c:if test="${ !empty loginUser }">已登录</c:if>
                        </b></a>
                    </p>
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
                                <div class="coldesc"><a href="article.do?method=list&category.atid=2" target="_blank">折腾</a></div>
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
                            <div class="col-xs-1 morespace">
                                <div class="coldesc"><a class="toolbar_jump_writeblog">写博客</a></div>
                            </div>
                            <div class="col-xs-1 morespace">
                                <div class="coldesc"><a class="toolbar_jump_paste_code" href="http://paste.ubuntu.com" target="_blank">贴代码</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a class="toolbar_jump_albums" href="<%=basePath%>photo.do?method=user_albums" target="_blank">相册</a></div>
                            </div>
                            <div class="col-sm-1" style="padding-left: 5px">
                                <div class="coldesc"><a class="toolbar_jump_cloud" href="<%=cloudPath%>" target="_blank">cloud</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a class="toolbar_jump_archives" href="<%=basePath%>article.do?method=archives" target="_blank">归档</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a class="toolbar_jump_tags" href="<%=basePath%>article.do?method=tags" target="_blank">标签</a></div>
                            </div>
                            <c:if test="${ !empty loginUser && loginUser.userGroup.gid == 1 }">
                                <div class="col-sm-1">
                                    <div class="coldesc"><a class="toolbar_jump_manager" href="manager.do?method=backstage" target="_blank">管理</a></div>
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
                                <div class="coldesc"><a class="toolbar_jump_register" href="user.do?method=toregister" target="_blank">注册</a></div>
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
                <li class="active"><a href="<%=basePath%>">首页</a></li>
                <li>
                    <a>
                        <c:if test="${not empty condition }">
                            <c:if test="${ not empty condition.title }">
                                标题='${condition.title}'&nbsp;
                            </c:if>
                            <c:if test="${ not empty condition.category.atid }">
                                分类='${condition.category.atname}'&nbsp;
                            </c:if>
                            <c:if test="${ not empty condition.tags }">
                                标签='${condition.tags}'&nbsp;
                            </c:if>
                        </c:if>
                    </a>
                </li>
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
        <article class="row">

            <!-- 左侧区域  start -->
            <article id="main" class="col-md-9 col-sm-12 col-xs-12" role="main">
                <!-- 推荐区 start -->
                <article class="post" id="top" style="display:none;">
                    <section class="post-container">
                        <div class="tabs-container" style="">
                            <div class="tabs-right">
                                <ul class="nav nav-tabs" id="top_nav" style="width: 10%;">
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
                                <a itemtype="url" href="article.do?method=detail&aid=${article.aid}" target="_blank">
                                        ${article.title}
                                </a>
                            </h2>
                            <!-- 文章头 -->
                            <ul class="post-meta">
                                <li>
                                    作者: <a href="user.do?method=home&uid=${article.author.uid}" target="_blank">${article.author.nickname}</a>
                                </li>
                                <li>
                                    分类: <a href="article.do?method=list&category.atid=${article.category.atid}" target="_blank">${article.category.atname}</a>
                                </li>
                                <li>
                                    <time datetime="2016-01-02T04:33:00-07:00" itemprop="datePublished">
                                        <fmt:formatDate value="${article.create_time}" pattern="yyyy-MM-dd	HH:mm"/>
                                    </time>
                                </li>
                            </ul>
                            <!-- 文章摘要 -->
                            <section class="post-content" itemprop="articleBody">
                                    ${article.summary}
                                <p class="more">
                                    <br>
                                    <a href="article.do?method=detail&aid=${article.aid}" title="${article.title}" target="_blank">- 阅读剩余部分 -</a>
                                </p>
                            </section>
                        </header>
                        <!-- 文章尾 -->
                        <footer class="post-footer">
                            <p>
                                <span itemprop="keywords" class="tags">标签:
                                    <c:forTokens items="${article.tags}" delims="#" var="tag">
                                        &nbsp;&nbsp;&nbsp;<a href="article.do?method=list&tags=${tag}" target="_blank">#${tag}</a>
                                    </c:forTokens>
                                </span>
                                <c:choose>
                                    <c:when test="${article.comment == 0 }">
                                        <a class="post-comments" itemprop="discussionUrl" href="article.do?method=detail&aid=${article.aid}#addcomment" target="_blank">抢占沙发</a>
                                    </c:when>
                                    <c:otherwise>
                                        <a class="post-comments" itemprop="discussionUrl" href="article.do?method=detail&aid=${article.aid}#comments" target="_blank">${article.comment} 条评论</a>
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

            <!-- 右侧区域  start -->
            <aside class="col-md-3 col-sm-12 col-xs-12">

                <c:if test="${ !empty loginUser }">
                    <section class="post-author" id="user_rank">
                        <div class="widget-head-color-box navy-bg p-lg text-center">
                            <div class="m-b-md">
                                <h2 class="font-bold no-margins">
                                    <a target="_blank" style="color:white;" href="<%=basePath%>user.do?method=home&uid=${loginUser.uid}">${loginUser.nickname}</a>
                                </h2>
                                <small>${loginUser.userGroup.group_name}</small>
                            </div>
                            <img src="<%=staticPath%>${loginUser.head_photo}" class="img-circle circle-border m-b-md author-head" alt="profile">
                            <div>
                                <span><a class="author-articleCount" target="_blank" style="color:white;" href="<%=basePath%>user.do?method=home&uid=${loginUser.uid}">${loginUser.articleCount} 动态</a></span>
                                |
                                <span><a class="author-followCount" target="_blank" style="color:white;" href="<%=basePath%>user.do?method=profilecenter&action=follows">${loginUser.followCount} 关注</a></span>
                                |
                                <span><a class="author-fansCount" target="_blank" style="color:white;" href="<%=basePath%>user.do?method=profilecenter&action=fans">${loginUser.fansCount} 关注者</a></span>
                            </div>
                        </div>
                        <div class="widget-text-box">
                            <div class="text-center author-description">${loginUser.description}</div>
                        </div>
                    </section>
                </c:if>

                <section class="post" id="article_index" style="box-shadow: 0 0px 3px #ddd;">
                    <ul id="list_article_index" class="post-meta" style="margin: 0 auto;text-align: center;color: #555;padding: 11px 0;font-weight: bold;">
                        <li><a href="article.do?method=archives" target="_blank">文章归档</a></li>
                        <li><a href="article.do?method=tags" target="_blank">文章标签</a></li>
                    </ul>
                </section>

                <section class="post" id="article_class">
                    <p class="ui red ribbon label">文章分类</p>
                    <p>
                    <ul id="rank_class">
                        <c:forEach items="${categoryCount}" var="category">
                            <li>
                                <a href="article.do?method=list&category.atid=${ category.atid }">${ category.atname }：(<span>${ category.count }</span>)</a>
                            </li>
                        </c:forEach>
                    </ul>
                </section>

                <section class="post" id="article_hot">
                    <p class="ui red ribbon label">
                        <a title="将文章按点击量排序" target="_blank" href="article.do?method=list&click=-1" style="color:white;text-decoration: none;">热门文章</a>
                    </p>
                    <p>
                    <ul id="rank_hot" class="rank-list"></ul>
                </section>

                <section class="post" id="article_hotTag">
                    <p class="ui red ribbon label">
                        <a title="查看所有标签" target="_blank" href="article.do?method=tags" style="color:white;text-decoration: none;">热门标签</a>
                    </p>
                    <p>
                    <ul id="rank_hotTag" class="rank-list"></ul>
                </section>

                <section class="post" id="article_newest">
                    <p class="ui red ribbon label">
                        <a title="查看文章归档" target="_blank" href="article.do?method=archives" style="color:white;text-decoration: none;">最新文章</a>
                    </p>
                    <p>
                    <ul id="rank_newest" class="rank-list"></ul>
                </section>

                <section class="post" id="photos_show">
                    <p class="ui red ribbon label"><a title="点击打开相册广场" target="_blank" href="photo.do?method=dashboard&model=album" style="color:white;text-decoration: none;">Photos</a></p>
                    <p></p>
                    <div class="photos">
                    </div>
                </section>

            </aside>
            <!-- 右侧区域  end -->

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
                <h2 class="modal-title" id="loginModalLabel">登录/<a href="user.do?method=toregister" target="_blank">注册</a></h2>
            </div>
            <form role="form" id="login_form">
                <div class="modal-body">
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
    <span>© 2016 </span><a href="https://imcoder.site" target="_blank">ImCoder</a>
    <span>博客 ，基于 </span><a>Java</a><span> 语言开发</span>
    <span>，ICP备案：</span><a href="http://www.miibeian.gov.cn" target="__blank">湘ICP备17002133号</a>
</footer>

<script src="<%=staticPath%>lib/highlight/highlight.min.js"></script>
<script>hljs.initHighlightingOnLoad();</script>
<a id="basePath" href="<%=basePath%>" style="display:none;"></a>
<a id="staticPath" href="<%=staticPath%>" style="display:none;"></a>
<a id="cloudPath" href="<%=cloudPath%>" style="display:none;"></a>

<!-- Bootstrap & Plugins core JavaScript -->
<!-- ######################################### -->
<!-- Placed at the end of the document so the pages load faster -->
<div style="display: none" id="require_modules">["jquery", "bootstrap", "domReady", "toastr", "stickUp", "common_utils", "login_handle", "toolbar", "index", "sideCol"]</div>
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="index"></script>

</body>
</html>