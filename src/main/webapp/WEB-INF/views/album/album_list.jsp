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
    <title>${hostUser.nickname}的相册 | ImCoder's 博客</title>
    <meta name="description" content="${hostUser.nickname}的相册列表">
    <meta name="keywords" content="相册,相册列表,${hostUser.nickname},ImCoder's 博客">
    <!-- 使用url函数转换相关路径 -->
    <!-- <script async="" src="http://www.google-analytics.com/analytics.js"></script> -->

    <!-- 引入文件 -->
    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>css/style.css<%=urlArgs%>">
    <style>
        .padding {
            background-color: #f2f2f2;
        }

        .modal-open[style] {
            padding-right: 0px !important;
        }

    </style>
</head>
<body uid="<c:if test="${not empty loginUser}"><s:eval expression="loginUser.uid"/></c:if>">
<!-- <body background="../../img/bg-site.png"> -->
<!-- START THE COVER  background-image: url(img/bg-site.png);" -->
<div id="first" class="" style="z-index:1000;background-image: url(<%=staticPath%>img/bg-site.png);">
    <div class="carousel-inner">
        <div class="">
            <div class="container">
                <div class="" style="text-align:center;">
                    <h1 class="slogan_name" hostUser="<s:eval expression="hostUser.uid"/>">${hostUser.nickname}</h1>
                    <h3 class="slogan_desc">${hostUser.description}</h3>
                    <h3>${hostUser.says}</h3>
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
                <li><a href="u/<s:eval expression="hostUser.uid"/>/home">${hostUser.nickname}</a></li>
                <li class="active"><a>相册</a></li>
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
                            <h4><a class="anav-menu_user toolbar_user_videos" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/videos" target="_blank">我的视频</a></h4>
                            <h4><a class="anav-menu_user toolbar_user_history" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/history" target="_blank">我的历史</a></h4>
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

            <!-- main div start -->
            <article class="col-md-12 col-sm-12 col-xs-12" id="main" role="main">
                <!-- 相册管理  start -->
                <header class="post post-container album_options">
                    <h1 class="post-title" itemprop="name headline">
                        <c:choose>
                            <c:when test="${ not empty loginUser and loginUser.uid == hostUser.uid }">
                                <a class="option_create" itemtype="url" id="createAlbum" author="<s:eval expression="hostUser.uid"/>">创建新相册</a>
                                <a class="option_tag_wrapper_management" itemtype="url" target="_blank" href="p/tags_wrappers?uid=<s:eval expression="hostUser.uid"/>">标签管理</a>
                            </c:when>
                            <c:otherwise>
                                <%--<a>&nbsp;</a>--%>
                                <a class="option_my_albums" itemtype="url" href="u/albums" target="_blank">我的相册</a>
                            </c:otherwise>
                        </c:choose>
                        <a class="option_user_history" itemtype="url" target="_blank" href="u/history">浏览历史</a>
                        <div style="float: right" class="options_right">
                            <c:if test="${ not empty loginUser and loginUser.uid == hostUser.uid }">
                                <a class="option_user_like_photos" itemtype="url" href="u/<s:eval expression="loginUser.uid"/>/likes/photos" target="_blank" title="赞过的图片">喜欢</a>
                                <%--<a class="option_user_access_photos" itemtype="url" href="u/<s:eval expression="loginUser.uid"/>/history/photos" target="_blank" title="访问过的图片">历史</a>--%>
                            </c:if>
                            <a class="option_user_videos" itemtype="url" href="u/<s:eval expression="hostUser.uid"/>/videos" target="_blank">视频</a>
                            <a class="option_time_sort" itemtype="url" href="u/<s:eval expression="hostUser.uid"/>/photos" target="_blank">时间序</a>
                            <a class="option_tags_index" itemtype="url" href="p/tags_square?uid=<s:eval expression="hostUser.uid"/>" target="_blank">标签索引</a>
                            <a class="option_photo_square" itemtype="url" href="p/dashboard?model=photo" target="_blank">照片广场</a>
                        </div>
                    </h1>
                </header>
                <!-- 相册管理  end -->

                <article class="post" style="background-color: #f2f2f2;box-shadow: 0px 0px 1px 0.5px #ddd;">
                    <!-- 相册列表 start -->
                    <section>
                        <div id="masonryContainer" class="" style="margin-top: 20px;margin-left:10px;margin-right: 10px;">
                        </div>
                    </section>
                    <!-- 相册列表 end -->
                </article>

                <!-- 底部区 start -->
                <header class="post post-container row album-footer">
                    <ul class="post-meta footer-left">
                        <li>数量: <a id="album_count">0</a></li>
                    </ul>
                    <ul class="post-meta footer-right">
                        <ol class="page-navigator"></ol>
                    </ul>
                </header>
                <!-- 底部区 end -->

            </article><!-- main div end -->

        </article><!-- end .row -->
    </div>
</div>
<!-- body end -->

<div id="enlargephoto-modal" class="animated pulse" style="display:none; position: fixed;left: 0;top: 0;width: 100%;height: 100%;z-index: 3000;">
    <div class="fog" style="width: 100%;height: 100%;background: #111;opacity: 0.4;filter:alpha(opacity=30); -moz-opacity:0.3; -khtml-opacity:0.3;"></div>
    <div id="photo-content" style="max-width:90%;max-height:90%;position:absolute;background:rgba(0, 0, 0, 0.6);">
        <div class="close" title="Close" style="background: #ddd;width:15px;right: 0;position: absolute;opacity: .8;color:#fff;text-align: center;font-size:15px;font-style: normal;">X</div>
        <img id="photo-content-img" style="border:5px solid #FFFFFF;"/>
    </div>
</div>

<div id="goTop" class="" style="bottom: 70px;">
    <div class="arrow"></div>
    <div class="stick"></div>
</div>

<div class="modal fade in" id="createAlbumModal" aria-hidden="false" tabindex="-1" style="padding-right: 0 !important;">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
                <h4 class="modal-title">New Album</h4></div>
            <div class="modal-body" style="padding-bottom: 5px;">
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
                <div class="form-group" style="display: none;padding-top: 5px;">
                    <label title="一行显示图片的数量">展示列数:</label>
                    <select class="select-inline" name="album_show_col" style="display:inline-block;margin-left: 6px;">
                        <option value="0" selected>遵循默认配置</option>
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
                <div class="form-group" style="padding-top: 5px;">
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
            <div class="modal-body" style="padding-bottom: 0px;">
                <div class="form-group">
                    <label>相册ID：</label>
                    <span name="album_id" class="control-label" style="display:inline-block;width: 50%;margin-left: 15px;"></span>
                </div>
                <div class="form-group">
                    <label>名称：</label>
                    <input class="form-control" type="text" name="album_name">
                </div>
                <div class="form-group">
                    <label>描述：</label>
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
                <div class="form-group" style="padding-top: 5px;">
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
                <div class="form-group">
                    <label>照片数量：</label>
                    <span name="album_size" class="control-label" style="display:inline-block;width: 50%;margin-left: 7px;"></span>
                </div>
                <div class="form-group">
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

<a id="basePath" class="site-path-prefix" href="<%=basePath%>" style="display:none;"></a>
<a id="staticPath" class="site-path-prefix" href="<%=staticPath%>" style="display:none;"></a>
<a id="cloudPath" class="site-path-prefix" href="<%=cloudPath%>" style="display:none;"></a>
<!-- Bootstrap & Plugins core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="album_list"></script>

</body>
</html>