<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jstl/fmt_rt" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
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
    <title>${album.name} - ${album.user.nickname}的相册 | ImCoder's 博客</title>
    <meta name="description" content="${fn:escapeXml(album.description)}">
    <meta name="keywords" content="相册,相册详情,${album.name},ImCoder's 博客">
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
        /* button.mfp-arrow {
            opacity: 0;
            top: 20%;
            margin-top: 0px;
            width: 20%;
            height: 60%;
        }

        button.mfp-arrow-left {
            margin-left: 10%;
        }

        button.mfp-arrow-right {
            margin-right: 10%;
        }

        .mfp-arrow:hover, .mfp-arrow:focus {
            opacity: 0;
        }

        .container-fluid {
           !* padding: 20px;*!
        }
        .photo-size {
            width: 25%;
        }
        .photo {
            margin-bottom: 10px;
            !*float: left;*!
        }
        .photo img {
            max-width: 100%
        }*/
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
                    <h1 class="slogan_name album_name" hostUid="<s:eval expression="album.user.uid"/>">${album.name}</h1>
                    <h3 class="slogan_desc album_description">${album.description}</h3>
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
                <li><a href="u/<s:eval expression="album.user.uid"/>/albums">${album.user.nickname}</a></li>
                <li class="active"><a>${album.name}</a></li>
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
                            <c:when test="${ not empty loginUser and loginUser.uid == album.user.uid }">
                                <a class="option_upload_photo" itemtype="url" id="uploadPhoto" albumId="<s:eval expression="album.album_id"/>" author="<s:eval expression="album.user.uid"/>">上传新照片</a>
                                <a class="option_upload_video" itemtype="url" id="uploadVideo" href="u/<s:eval expression="loginUser.uid"/>/videos?cover.album_id=<s:eval expression="album.album_id"/>&from=album_detail&mark=upload" target="_blank">上传新视频</a>
                            </c:when>
                            <c:otherwise>
                                <a class="option_owner_albums" itemtype="url" href="u/<s:eval expression="album.user.uid"/>/albums" target="_blank" title="点击查看Ta的其他相册">${album.user.nickname}</a>
                            </c:otherwise>
                        </c:choose>
                        <div style="float: right" class="options_right">
                            <a class="option_tags_index" itemtype="url" href="p/tags_square?album_id=<s:eval expression="album.album_id"/>&from=album_detail" target="_blank">标签索引</a>
                            <a class="option_blowup" itemtype="url" id="blowup_trigger">放大镜</a>
                        </div>
                    </h1>
                </header>
                <!-- 相册管理  end -->

                <article class="post" style="background-color: #f8f8f8;box-shadow: 0px 0px 1px 0.5px #ddd;">
                    <!-- 文章内容 start -->
                    <section>
                        <div id="masonryContainer" class="" style="margin: 7px 6px 1px 6px">
                            <%--<c:forEach items="${album.photos}" var="photo"  varStatus="status">
                                <div class="photo photo-size"  id="photo_<s:eval expression="photo.photo_id"/>" data-order="${status.index}" photo-id=<s:eval expression="photo.photo_id"/> title="${photo.name}" photo-desc="${photo.description}"
                                    image-width="${photo.width}" image-height="${photo.height}" iscover="${photo.iscover}" photo-origin-path="${photo.path}">
                                    <img  src="<s:eval expression="photo.path"/>" />
                                </div>
                            </c:forEach>--%>
                        </div>
                    </section>
                    <!-- 文章内容 end -->

                    <!-- 标签 start -->
                    <!-- 标签 end -->
                </article>

                <!-- 评论区 start -->
                <header class="post post-container row album-footer">
                    <ul class="post-meta footer-left">
                        <li>数量: <a id="album_size" hostUser="<s:eval expression="album.user.uid"/>" album_id="<s:eval expression="album.album_id"/>">${album.size}</a></li>
                        <li>创建时间：<a id="album_create_time">
                            <time itemprop="datePublished"><s:eval expression="album.create_time"/></time>
                        </a></li>
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

<div class="modal fade in" id="uploadPhotoModal" aria-hidden="false" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span
                        aria-hidden="true">×</span></button>
                <h4 class="modal-title">插入图片</h4></div>
            <div class="modal-body" style="padding-bottom: 5px;">
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
                            <input type="text" class="tag-input" name="tag_input" title="回车完成输入" placeholder="回车完成输入"/>
                        </span>
                        <span class="input-group-addon btn btn-sm tags-edit-btn">编辑</span>
                    </div>
                </div>
                <div class="form-group" style="overflow:auto;">
                    <label>引用：</label>
                    <input class="form-control" type="text" name="photo_refer">
                </div>
                <div class="form-group " style="padding-top: 7px;">
                    <label class="control-label">是否作为封面</label>
                    <label class="radio-inline" style="margin-left:10px;">
                        <input type="radio" name="photo_cover" value="1"> 是
                    </label>
                    <label class="radio-inline">
                        <input type="radio" name="photo_cover" value="0" checked="checked"> 否
                    </label>
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
            <div class="modal-body" style="padding-bottom: 0px;">
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
                            <input type="text" class="tag-input" name="tag_input" title="回车完成输入" placeholder="回车完成输入"/>
                        </span>
                        <span class="input-group-addon btn btn-sm tags-edit-btn">编辑</span>
                    </div>
                </div>
                <div class="form-group">
                    <label class="control-label">图片大小：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>
                    <span name="photo_size" class="control-label"></span>
                </div>
                <div class="form-group">
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
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="album_detail"></script>

</body>
</html>