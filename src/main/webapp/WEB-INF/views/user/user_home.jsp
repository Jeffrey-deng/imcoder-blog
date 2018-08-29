<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jstl/fmt_rt" %>
<%
    String path = request.getContextPath();
    String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
    String staticPath = Config.get(ConfigConstants.SITE_CDN_ADDR);
    String cloudPath = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
%>
<!DOCTYPE html>
<html class="no-js">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="renderer" content="webkit">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <title>${hostUser.nickname}的个人博客 | ImCODER's 博客</title>
    <meta name="keywords" content="${hostUser.nickname},主页,个人博客,ImCODER's 博客">
    <meta name="description" content="${hostUser.description}">
    <!-- 引入文件 -->
    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.css">
    <link rel="stylesheet" href="<%=staticPath%>css/style.css">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css">
</head>
<body uid="${loginUser.uid}" style="background-image: url(<%=staticPath%>img/bg-site.png);">
<!-- <body background="../../img/bg-site.png"> -->

<!-- START THE COVER  background-image: url(img/bg-site.png);" -->
<div id="first" class="" style="text-align:center;z-index:1000;">
    <div class="carousel-inner">
        <div class="container">
            <br>
            <h1>${hostUser.nickname}</h1>
            <p>${hostUser.description}</p>
            <br>
            <!-- hide 'follow' button when hostUser is loginUser  -->
            <c:if test="${ !( (!empty loginUser) and (loginUser.uid==hostUser.uid) ) }">
                <p><a name="follow" followed="false" class="btn btn-large btn-success follow"><b>关注</b></a></p>
            </c:if>
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
                                <div class="coldesc"><a href="article.do?method=list&category.atid=2" target="_blank">教程</a></div>
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
                            <div class="col-xs-1	morespace">
                                <div class="coldesc"><a class="toolbar_jump_writeblog">写博客</a></div>
                            </div>
                            <div class="col-xs-1	morespace">
                                <div class="coldesc"><a class="toolbar_jump_paste_code" href="http://paste.ubuntu.com" target="_blank">贴代码</a></div>
                            </div>
                            <div class="col-sm-1	">
                                <div class="coldesc"><a class="toolbar_jump_albums" href="<%=basePath%>photo.do?method=user_albums" target="_blank">相册</a></div>
                            </div>
                            <div class="col-sm-1  ">
                                <div class="coldesc"><a class="toolbar_jump_ftp" href="ftp://imcoder.site:21" target="_blank">FTP</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a class="toolbar_jump_login">登录</a></div>
                            </div>
                            <div class="col-sm-1">
                                <div class="coldesc"><a class="toolbar_jump_register" href="user.do?method=toregister" target="_blank">注册</a></div>
                            </div>
                            <c:if test="${ !empty loginUser && loginUser.userGroup.gid == 1 }">
                                <div class="col-sm-1">
                                    <div class="coldesc"><a class="toolbar_jump_manager" href="manager.do?method=backstage" target="_blank">管理</a></div>
                                </div>
                            </c:if>
                        </div>
                        <div class="row">
                            <div class="col-sm-2 rowname">
                                <div class="coldesc">关于</div>
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
                <li><a href="<%=basePath%>">首页</a></li>
                <li class="active"><a>${hostUser.nickname}</a></li>
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

<!-- body start -->
<div id="body">
    <div class="container">
        <article class="row">

            <!-- 作者区  start -->
            <aside class="col-md-3 col-sm-12 col-xs-12">

                <section class="post-author" id="user_rank">
                    <div class="widget-head-color-box navy-bg text-center" style="padding-top:30px;padding-bottom:30px;">
                        <div class="m-b-md">
                            <h2 class="font-bold no-margins" id="h_auid" auid="${hostUser.uid}">
                                <a style="color:white;" href="<%=basePath%>user.do?method=home&uid=${hostUser.uid}">${hostUser.nickname}</a>
                            </h2>
                            <small>${hostUser.userGroup.group_name}</small>
                        </div>
                        <img src="<%=staticPath%>${hostUser.head_photo}" class="img-circle circle-border m-b-md" style="width:120px;height:120px;" alt="profile">
                        <div>
                            <span><a target="_blank" style="color:white;" href="<%=basePath%>user.do?method=home&uid=${hostUser.uid}">${hostUser.articleCount} 动态</a></span> |
                            <span><a target="_blank" style="color:white;" href="<%=basePath%>user.do?method=contact&action=follows&query_uid=${hostUser.uid}">${hostUser.followCount} 关注</a></span> |
                            <span><a target="_blank" style="color:white;" href="<%=basePath%>user.do?method=contact&action=fans&query_uid=${hostUser.uid}">${hostUser.fansCount} 关注者</a></span>
                        </div>
                        <!-- hide when hostUser is loginUser and show in bottom div -->
                        <c:if test="${ !( (!empty loginUser) and (loginUser.uid==hostUser.uid) ) }">
                            <div class="text-center" style="padding-top:15px;margin-bottom:-15px;">
                                    ${hostUser.says}
                            </div>
                        </c:if>
                    </div>
                    <div class="widget-text-box">
                        <!-- hide 'follow' button when hostUser is loginUser  -->
                        <c:choose>
                            <c:when test="${ !( (!empty loginUser) and (loginUser.uid==hostUser.uid) ) }">
                                <div class="text-right">
                                    <a name="follow" followed="false" class="btn btn-xs btn-primary follow"><i class="fa fa-thumbs-up"></i> 关注 </a>
                                    <a name="letter" class="btn btn-xs btn-white letter"><i class="fa fa-heart"></i> 私信</a>
                                </div>
                            </c:when>
                            <c:otherwise>
                                <div class="text-center">
                                        ${hostUser.says}
                                </div>
                            </c:otherwise>
                        </c:choose>
                    </div>
                </section>

                <section class="post" id="article_rank">
                    <p class="ui red ribbon label">文章Rank</p>
                    <p>
                    <ul>
                        <li>访问：<span>1693</span>&nbsp;次</li>
                        <li>评论：<span>35</span>&nbsp;次</li>
                        <li>点赞：<span>0</span>&nbsp;次</li>
                        <li>收藏：<span>22</span>&nbsp;次</li>
                    </ul>
                </section>

                <section class="post hidden-xs" id="photos_show">
                    <p class="ui red ribbon label"><a title="点击打开相册" target="_blank" href="photo.do?method=user_albums&uid=${hostUser.uid}" style="color:white;text-decoration: none;">Photos</a></p>
                    <p></p>
                    <div class="photos">
                    </div>
                </section>

                <section class="post" id="article_class">
                    <p class="ui red ribbon label">文章分类</p>
                    <p>
                    <ul id="rank_class">
                        <c:forEach items="${categoryCount}" var="category">
                            <li><a href="article.do?method=list&category.atid=${ category.atid }">${ category.atname }：(<span>${ category.count }</span>)</a></li>
                        </c:forEach>
                    </ul>
                </section>

                <section class="post" id="article_hot">
                    <p class="ui red ribbon label">热门文章</p>
                    <p>
                    <ul id="rank_hot"></ul>
                </section>

                <section class="post" id="article_newest">
                    <p class="ui red ribbon label">最新文章</p>
                    <p>
                    <ul id="rank_newest"></ul>
                </section>

            </aside>
            <!-- 作者区  end -->

            <!-- 右侧区域  start -->
            <article id="main" class="col-md-9 col-sm-12 col-xs-12" role="main">

                <!-- 用户导航头  start -->
                <header class="post post-container">
                    <ul class="post-meta" style="margin-top: 0px;margin-bottom: 0px;font-size: 14px;">
                        <li id="userInfo_trigger" uid="${hostUser.uid}"><a>资料</a></li>
                        <li><a href="photo.do?method=user_albums&uid=${hostUser.uid}" target="_blank">相册</a></li>
                    </ul>
                </header>
                <!-- 用户导航头  end -->


                <c:choose>
                    <c:when test="${ !empty articleList }">
                        <!-- 文章项 start -->
                        <c:forEach items="${articleList}" var="article">
                            <article class="post" itemscope="" itemtype="http://schema.org/BlogPosting">
                                <header class="post-container">
                                    <h2 class="post-title" itemprop="name headline">
                                        <a itemtype="url" href="article.do?method=detail&aid=${article.aid}">
                                                ${article.title}</a>
                                    </h2>
                                    <ul class="post-meta">
                                        <li>
                                            <time datetime="2016-01-02T04:33:00-07:00"
                                                  itemprop="datePublished">
                                                <fmt:formatDate value="${article.create_time}" pattern="yyyy-MM-dd	HH:mm"/>
                                            </time>
                                        </li>
                                        <li>
                                            分类: <a href="article.do?method=list&category.atid=${article.category.atid}">${article.category.atname}</a>
                                        </li>
                                    </ul>
                                    <section class="post-content" itemprop="articleBody">
                                            ${article.summary}
                                        <p class="more">
                                            <br>
                                            <a href="article.do?method=detail&aid=${article.aid}"
                                               title="${article.title}">- 阅读剩余部分 -</a>
                                        </p>
                                    </section>
                                </header>

                                <footer class="post-footer">
                                    <p>
                            <span itemprop="keywords" class="tags">标签:
                                <c:forTokens items="${article.tags}" delims="#" var="tag">
                                    &nbsp;&nbsp;&nbsp;<a href="article.do?method=list&tags=${tag}">#${tag}</a>
                                </c:forTokens>
                            </span>
                                        <a class="post-comments" itemprop="discussionUrl"
                                           href="article.do?method=detail&aid=${article.aid}#comments">${article.comment} 条评论</a>
                                    </p>
                                </footer>
                            </article>

                        </c:forEach>
                        <!-- 文章项 end -->

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

<style>
    @media (min-width: 768px) {
        #userInfoModal .modal-dialog {
            width: 340px;
        }
    }

    @media (max-width: 768px) {
        #userInfoModal .modal-dialog {
            width: 100%;
            margin: 0px;
        }
    }
</style>
<div class="modal fade" id="userInfoModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"
                        aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <h4 class="modal-title" id="">用户资料</h4>
            </div>
            <div class="modal-body" style="padding-bottom: 10px;">
                <form class="form-horizontal">
                    <style>
                        #userInfoModal span {
                            text-align: left
                        }
                    </style>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label"><img name="head_photo" style="height: 50px;"></label>
                        <span class="col-sm-7 col-xs-7 control-label" name="nickname" style="height: 50px;line-height:50px;vertical-align:middle;"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">用户组:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="usergroup"></span>
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
                        <label class="col-sm-4 col-xs-4 control-label">微博:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="weibo"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">QQ:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="qq"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">文章数:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="articleCount"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">关注数:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="followCount"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">粉丝数:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="fansCount"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">签名:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="says"></span>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 col-xs-4 control-label">注册时间:</label>
                        <span class="col-sm-7 col-xs-7 control-label" name="register_time"></span>
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
<div style="margin-top:100px;" class="modal fade" id="login_Modal" tabindex="-1" role="dialog" aria-labelledby="loginModalLabel">
    <div style="width: 350px;" class="modal-dialog" role="document">
        <div class="modal-content animated flipInY">
            <div class="modal-header text-center">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h2 class="modal-title" id="loginModalLabel">登录/<a href="user.do?method=toregister" target="_blank">注册</a></h2>
            </div>
            <form role="form" id="login_form">
                <div class="modal-body" style="height:200px;">
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
<script baseUrl="<%=staticPath%>" data-main="<%=staticPath%>js/config.js" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="user_home"></script>

</body>
</html>