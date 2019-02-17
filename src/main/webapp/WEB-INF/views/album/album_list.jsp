<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jstl/fmt_rt" %>
<%
    String path = request.getContextPath();
    String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
    String staticPath = Config.get(ConfigConstants.SITE_CDN_ADDR);
    String cloudPath = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
    String urlArgs = Config.get(ConfigConstants.SITE_CDN_ADDR_ARGS);
%>
<!DOCTYPE html>
<html class="no-js">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="renderer" content="webkit">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
    <title>${hostUser.nickname}的相册 | ImCoder's 博客</title>
    <meta name="description" content="${hostUser.nickname}的相册列表">
    <meta name="keywords" content="相册,相册列表,${hostUser.nickname},ImCoder's 博客">
    <!-- 使用url函数转换相关路径 -->
    <!-- <script async="" src="http://www.google-analytics.com/analytics.js"></script> -->

    <!-- 引入文件 -->
    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/summernote/summernote-bs3.min.css<%=urlArgs%>">
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
<body uid="${loginUser.uid}">
<!-- <body background="../../img/bg-site.png"> -->
<!-- START THE COVER  background-image: url(img/bg-site.png);" -->
<div id="first" class="" style="z-index:1000;background-image: url(<%=staticPath%>img/bg-site.png);">
    <div class="carousel-inner">
        <div class="">
            <div class="container">
                <div class="" style="text-align:center;">
                    <h1 hostUser="${hostUser.uid}">${hostUser.nickname}</h1>
                    <h3>${hostUser.description}</h3>
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
                            <c:if test="${ (!empty loginUser) && loginUser.userGroup.isManager() }">
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
                <li><a href="<%=basePath%>">首页</a></li>
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
                            <img src="<%=staticPath%>${loginUser.head_photo}"/><span class="caret"></span>
                        </a>
                        <ul class="dropdown-menu">
                            <h4><a class="anav-menu_user toolbar_user_profilecenter" href="<%=basePath%>user.do?method=profilecenter" target="_blank">个人中心</a></h4>
                            <h4><a class="anav-menu_user toolbar_user_userhome" href="<%=basePath%>user.do?method=home&uid=${loginUser.uid}" target="_blank">我的博客</a></h4>
                            <h4><a class="anav-menu_user toolbar_user_albums" href="<%=basePath%>photo.do?method=user_albums&uid=${loginUser.uid}" target="_blank">我的相册</a></h4>
                            <h4><a class="anav-menu_user toolbar_user_videos" href="<%=basePath%>video.do?method=user_videos&uid=${loginUser.uid}" target="_blank">我的视频</a></h4>
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

            <!-- main div start -->
            <article class="col-md-12 col-sm-12 col-xs-12" id="main" role="main">
                <!-- 相册管理  start -->
                <header class="post post-container album_options">
                    <h1 class="post-title" itemprop="name headline">
                        <c:choose>
                            <c:when test="${ not empty loginUser and loginUser.uid == hostUser.uid }">
                                <a class="option_create" itemtype="url" id="createAlbum" author="${hostUser.uid}">创建新相册</a>
                            </c:when>
                            <c:otherwise>
                                <a>&nbsp;</a>
                            </c:otherwise>
                        </c:choose>
                        <div style="float: right" class="options_right">
                            <a class="option_time_sort" itemtype="url" href="photo.do?method=dashboard&model=photo&uid=${hostUser.uid}" target="_blank">时间序</a>
                            <a class="option_tags_index" itemtype="url" href="photo.do?method=tags_square&uid=${hostUser.uid}" target="_blank">标签索引</a>
                            <a class="option_photo_square" itemtype="url" href="photo.do?method=dashboard&model=photo" target="_blank">照片广场</a>
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

<div class="note-editor">
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
                        <label>相册说明:</label>
                        <textarea class="form-control" type="text" name="album_desc"></textarea>
                    </div>
                    <div class="form-group" style="display: none;">
                        <label title="一行显示图片的数量">展示列数:</label>
                        <select class="select-inline m-b" name="album_show_col" style="display:inline-block;margin-left: 6px;">
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
                        <label>相册权限:</label>
                        <label class="radio-inline" style="margin-left:10px;">
                            <input type="radio" name="album_permission" value="0" checked="checked"> 公开
                        </label>
                        <label class="radio-inline">
                            <input type="radio" name="album_permission" value="1"> 好友
                        </label>
                        <label class="radio-inline">
                            <input type="radio" name="album_permission" value="2"> 私有
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" data-dismiss="modal">取消</button>
                    <button class="btn btn-primary" name="createAlbum_trigger">创建</button>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="note-editor">
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
                        <label>封面地址：</label>
                        <input class="form-control" type="text" name="album_cover_path" placeholder="置空则使用默认封面"/>
                    </div>
                    <div class="form-group" style="padding-top: 5px;">
                        <label>相册权限：</label>
                        <label class="radio-inline" style="margin-left:7px;">
                            <input type="radio" name="album_permission" value="0" checked="checked"> 公开
                        </label>
                        <label class="radio-inline">
                            <input type="radio" name="album_permission" value="1"> 好友
                        </label>
                        <label class="radio-inline">
                            <input type="radio" name="album_permission" value="2"> 私有
                        </label>
                    </div>
                    <div class="form-group">
                        <label title="一行显示图片的数量">展示列数：</label>
                        <select class="select-inline m-b" name="album_show_col" style="display:inline-block;margin-left: 6px;">
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

<footer id="footer" role="contentinfo" class="card">
    <span>© 2016 </span><a href="https://imcoder.site" target="_blank">ImCoder</a>
    <span>博客 ，基于 </span><a>Java</a><span> 语言开发</span>
    <span>，ICP备案：</span><a href="http://www.miibeian.gov.cn" target="__blank">湘ICP备17002133号</a>
</footer>

<a id="basePath" href="<%=basePath%>" style="display:none;"></a>
<a id="staticPath" href="<%=staticPath%>" style="display:none;"></a>
<a id="cloudPath" href="<%=cloudPath%>" style="display:none;"></a>
<!-- Bootstrap & Plugins core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->

<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="album_list"></script>

</body>
</html>