﻿
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
    <title>${article.title} - ImCoder's 博客</title>
    <meta name="keywords" content="imcoder.site看板,公告,关于">
    <meta name="description" content="此site为大学学完Java后，为练习而开发的，后面发现可以用来总结下平时所学的知识，便一直在维护。欢迎一起学习交流！ contact me ~ Jeffrey.c.deng@gmail.com">
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
</head>
<body uid="<c:if test="${not empty loginUser}"><s:eval expression="loginUser.uid"/></c:if>" background="<%=staticPath%>img/bg-site.png">
<!-- <body background="../../img/bg-site.png"> -->
<!-- START THE COVER  background-image: url(img/bg-site.png);" -->
<div id="first" class="" style="z-index:1000;">
    <div class="carousel-inner">
        <div class="">
            <div class="container">
                <div class="" style="text-align:center;">
                    <h1 class="slogan_name" data-user-id="<s:eval expression="article.author.uid"/>" data-article-id="<s:eval expression="article.aid"/>">ImCoder's 博客</h1>
                    <h3 class="slogan_desc">叶落九秋枝未枯兮，水迎孤月遥未有辞，尔胡以有不自平兮，非心之逑兮以为然</h3>
                    <h3>Welcome to my blog</h3>
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
                <li class="active"><a>${article.title}</a></li>
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

<!-- body start -->
<div id="body">
    <div class="container">
        <article class="row">

            <!-- 作者区  start -->
            <aside class="col-md-3 col-sm-12 col-xs-12" style="display:none;">

                <section class="post-author" id="user_rank">
                    <div class="widget-head-color-box navy-bg text-center" style="padding-top:30px;padding-bottom:30px;">
                        <address class="m-b-md">
                            <h2 class="font-bold no-margins author-id" id="h_auid" auid="<s:eval expression="article.author.uid"/>">
                                <a class="author-nickname" style="color:white;" href="<%=basePath%>u/<s:eval expression="article.author.uid"/>/home" target="_blank">${article.author.nickname}</a>
                            </h2>
                            <small class="author-group">${article.author.userGroup.group_name}</small>
                        </address>
                        <img src="<s:eval expression="article.author.head_photo"/>" class="img-circle circle-border m-b-md author-head" alt="profile">
                        <div>
                            <span><a class="author-articleCount" target="_blank" style="color:white;" href="<%=basePath%>u/<s:eval expression="article.author.uid"/>/home">${article.author.userStats.articleCount} 动态</a></span> |
                            <span><a class="author-followingCount" target="_blank" style="color:white;" href="<%=basePath%>u/<s:eval expression="article.author.uid"/>/contact/followings">${article.author.userStats.followingCount} 关注</a></span> |
                            <span><a class="author-followerCount" target="_blank" style="color:white;" href="<%=basePath%>u/<s:eval expression="article.author.uid"/>/contact/followers">${article.author.userStats.followerCount} 关注者</a></span>
                        </div>
                    </div>
                    <div class="widget-text-box">
                        <!-- hide 'follow' button when article's author is loginUser  -->
                        <c:choose>
                            <c:when test="${ !( (!empty loginUser) and (loginUser.uid==article.author.uid) ) }">
                                <div class="text-right">
                                    <a name="follow" followed="false" class="btn btn-xs btn-primary follow"><i class="fa fa-thumbs-up"></i>关注</a>
                                    <a name="letter" class="btn btn-xs btn-white letter"><i class="fa fa-heart"></i>私信</a>
                                </div>
                            </c:when>
                            <c:otherwise>
                                <div class="text-center author-description">
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
                        <li>访问：<span class="article_click_count">${article.click_count}</span>&nbsp;次</li>
                        <li>评论：<span class="article_comment_count">${article.comment_count}</span>&nbsp;次</li>
                        <li>点赞：<span class="article_like_count">0</span>&nbsp;次</li>
                        <li>收藏：<span class="article_collect_count">${article.collect_count}</span>&nbsp;次</li>
                    </ul>
                </section>

                <section class="post hidden-xs" id="article_class">
                    <p class="ui red ribbon label">文章分类</p>
                    <p></p>
                    <ul id="rank_class">
                        <c:forEach items="${categoryCount}" var="category">
                            <li><a href="a/list?category.atid=${ category.atid }">${ category.atname }：(<span>${ category.count }</span>)</a></li>
                        </c:forEach>
                    </ul>
                </section>

                <section class="post hidden-xs" id="article_hot">
                    <p class="ui red ribbon label">
                        <a title="将文章按点击量排序" target="_blank" href="a/list?click_count=-1" style="color:white;text-decoration: none;">热门文章</a>
                    </p>
                    <p></p>
                    <ul id="rank_hot" class="rank-list">
                    </ul>
                </section>

                <section class="post hidden-xs" id="article_hotTag">
                    <p class="ui red ribbon label">
                        <a title="查看所有标签" target="_blank" href="a/tags" style="color:white;text-decoration: none;">热门标签</a>
                    </p>
                    <p></p>
                    <ul id="rank_hotTag" class="rank-list"></ul>
                </section>

                <section class="post hidden-xs" id="article_new">
                    <p class="ui red ribbon label">
                        <a title="查看文章归档" target="_blank" href="a/archives" style="color:white;text-decoration: none;">最新文章</a>
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
                    <h1 class="post-title article-id" itemprop="name headline" id="h_aid" aid="<s:eval expression="article.aid"/>">
                        <a class="article-title" itemtype="url">${article.title}</a>
                    </h1>
                    <p>
                    <ul class="post-meta">
                        <li>
                            <time class="article-time" title="更新时间：<s:eval expression="article.update_time"/>" datetime="${article.create_time}" itemprop="datePublished">
                                <s:eval expression="article.create_time"/>
                            </time>
                        </li>
                        <li>分类: <a class="article-category" href="a/list?category.atid=${article.category.atid}" target="_blank">${article.category.atname}</a></li>
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
                        <p itemprop="keywords" class="tags article-tags">标签:
                            <c:forTokens items="${article.tags}" delims="#" var="tag">
                                &nbsp;&nbsp;&nbsp;<a href="a/list?tags=${tag}" target="_blank">#${tag}#</a>
                            </c:forTokens>
                        </p>
                    </footer>
                    <!-- 标签 end -->
                </article>

                <!-- 评论区 start -->
                <article>
                    <!-- 已有评论 -->
                    <section id="comments">
                    </section>
                    <!-- 评论 input start -->
                    <div class="respond comment-post">
                        <div class="cancel-comment-reply">
                            <a id="cancel-comment-reply-link" href="" rel="nofollow" style="display:none" onclick="return cancelReply();">取消回复</a>
                        </div>
                        <form method="post" action="" id="comment-form" role="form" class="card">
                            <h3 id="response">添加新评论</h3>
                            <p>
                                <label>内容</label>
                                <label class="comment-control checkForCommentUseHtmlTag"><input type="checkbox" id="useInputCommentUseHtmlTag" value="useHtmlTag"/> html注入</label>
                                <label class="comment-control checkForCommentSendAnonymously"><input type="checkbox" id="useSendCommentAnonymously" value="sendAnonymously"/> 匿名评论</label>
                                <button class="comment-control openInsertImageModalBtn btn btn-default btn-sm" id="openInsertImageModalTrigger" title="发送图片"><i class="glyphicon glyphicon-picture"></i></button>
                                <input type="hidden" name="parentId" id="comment_form_parentId" value="0"/>
                                <input type="hidden" name="replyUid" id="comment_form_replyUid" value="<s:eval expression="article.author.uid"/>"/>
                                <textarea rows="4" cols="50" name="content" id="comment_form_content" class="textarea" placeholder=""></textarea>
                            </p>
                            <p>
                                <button type="button" id="comment_form_submit" class="submit ripple"><span>提交评论</span>
                                    <ripple-container></ripple-container>
                                </button>
                            </p>
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
                <h2 class="modal-title" id="loginModalLabel">登录 / <a href="auth/register" target="_blank">注册</a></h2>
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
        <span>，ICP备案：</span><a href="http://beian.miit.gov.cn/" target="_blank">${site_icp_record_code}</a>
    </c:if>
    <c:if test="${not empty site_police_record_code}">
        <span>，公安备案：</span><img class="police-record-icon" src="<%=staticPath%>img/police_record_icon.png"><a href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=${site_police_record_number}" target="_blank">${site_police_record_code}</a>
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