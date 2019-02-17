<%@ page language="java" import="site.imcoder.blog.common.Utils" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.entity.Video" %>
<%@ page import="site.imcoder.blog.setting.Config" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jstl/fmt_rt" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%
    String path = request.getContextPath();
    String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
    String staticPath = Config.get(ConfigConstants.SITE_CDN_ADDR);
    String cloudPath = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
    String urlArgs = Config.get(ConfigConstants.SITE_CDN_ADDR_ARGS);

    Video video = (Video) request.getAttribute("video");
    if (video != null) {
        String tags = video.getTags();
        if (Utils.isNotBlank(tags)) {
            String[] tagArr = Utils.splitNotEmpty(tags, "#");
            request.setAttribute("tags", tagArr);
        }
        String videoDesc = "<p>" + (Utils.isNotEmpty(video.getDescription()) ? video.getDescription().replace("\n", "</p><p>") : "") + "</p>";
        request.setAttribute("videoDesc", videoDesc);
        request.setAttribute("videoName", Utils.isBlank(video.getName()) ? "在用户空间内查看" : video.getName());
    }
%>
<!DOCTYPE html>
<html class="no-js">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="renderer" content="webkit">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
    <title>${video.name} | ImCoder博客's 视频</title>
    <meta name="description" content="${fn:escapeXml(video.description)}">
    <meta name="keywords" content="相册,相册详情,${video.tags},ImCoder's 博客">
    <!-- 使用url函数转换相关路径 -->
    <!-- <script async="" src="http://www.google-analytics.com/analytics.js"></script> -->

    <!-- 引入文件 -->
    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/animate/animate.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/summernote/summernote-bs3.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/magnific-popup/magnific-popup.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>css/style.css<%=urlArgs%>">
    <style>
        .post {
            margin-top: 1.5em;
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
                    <h2 class="video-name" hostUid="${video.user.uid}" albumId="${video.cover.album_id}">${video.name}</h2>
                    <h3 class="album_name">${video.user.nickname}</h3>
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
                <li><a href="video.do?method=user_videos&uid=${video.user.uid}">${video.user.nickname}</a></li>
                <li class="active"><a>${video.video_id}</a></li>
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

                <article class="post" style="background-color: #f8f8f8;box-shadow: 0px 0px 1px 0.5px #ddd;">
                    <!-- 照片内容区 start -->
                    <section>
                        <div class="video-detail-play">
                            <iframe src="video.do?method=embed&video_id=${video.video_id}" id="show-video"></iframe>
                        </div>
                        <div class="video-detail-info" data-video-id="${video.video_id}">
                            <div class="video-detail-info-inline">
                                <form id="article_form" method="post" class="form-horizontal">
                                    <div class="video-detail-info-header">
                                        <h3 class="video-detail-name">
                                            <a href="video.do?method=user_videos&uid=${video.user.uid}&check=${video.cover.photo_id}" target="_blank" title="${videoName}">${videoName}</a>
                                        </h3>
                                        <div class="video-detail-set-area">
                                            <div class="video-detail-show-size">
                                                显示：<a data-show-size="default">默认⬇</a>
                                            </div>
                                            <div class="video-detail-user-nickname">
                                                上传者：<a data-user-id="${video.user.uid}" href="user.do?method=home&uid=${video.user.uid}" target="_blank">${video.user.nickname}</a>
                                            </div>
                                        </div>
                                    </div>
                                    <hr class="fill-width">
                                    <div class="video-detail-info-main">
                                        <div class="area-set-left">
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">说&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;明</label>
                                                <div class="col-sm-10">
                                                    <span class="help-block video-detail-desc">${videoDesc}</span>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">标&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;签</label>
                                                <div class="col-sm-10">
                                                    <span class="help-block video-detail-tags">
                                                        <c:forEach items="${tags}" var="tag">
                                                            <a target="_blank" href="photo.do?method=dashboard&model=photo&tags=${tag}" data-video-tag="${tag}">#${tag}</a>&nbsp;&nbsp;
                                                        </c:forEach>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="area-set-right">
                                            <div class="form-group">
                                                <label class="col-xs-2 col-sm-2 control-label">相&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;关</label>
                                                <div class="col-xs-9 col-sm-9">
                                                    <span class="help-block video-detail-refer"><a target="_blank" href="${video.refer}">${video.refer}</a></span>
                                                </div>
                                            </div>
                                            <div class="hr-line-dashed"></div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">视频大小</label>
                                                <div class="col-sm-9">
                                                    <span class="help-block video-detail-size">${video.size}MB（${video.width}×${video.height}）</span>
                                                </div>
                                            </div>
                                            <div class="hr-line-dashed"></div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">视频类型</label>
                                                <div class="col-sm-9">
                                                    <span class="help-block video-detail-video-type">${video.video_type}</span>
                                                </div>
                                            </div>
                                            <div class="hr-line-dashed"></div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">上传日期</label>
                                                <div class="col-sm-9">
                                                    <span class="help-block video-detail-upload-time"><fmt:formatDate value="${video.upload_time}" pattern="yyyy-MM-dd HH:mm:ss"/></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <hr class="fill-width">
                                    <div class="video-detail-info-footer">
                                        <div class="area-set-left">
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">所属相册</label>
                                                <div class="col-sm-9">
                                                    <span class="help-block video-detail-album-name">
                                                        <a data-album-id="${video.cover.album_id}" target="_blank" href="photo.do?method=album_detail&id=${video.cover.album_id}">album-${video.cover.album_id}</a>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="area-set-right">
                                            <div class="video-detail-cover" style="display: none;">
                                                <label class="col-sm-2 control-label">相关封面</label>
                                                <div class="col-sm-7">
                                                    <span class="help-block video-detail-cover-name">
                                                        <a target="_blank" href="photo.do?method=album_detail&id="></a>
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="video-detail-handle-area">
                                                <div class="video-detail-like" title="点赞">
                                                    <div class="video-detail-like-btn">👍</div>
                                                    <div class="video-detail-like-count">${video.click}</div>
                                                </div>
                                                <c:if test="${(not empty loginUser) and loginUser.uid == video.user.uid}">
                                                    <label class="control-label video-detail-open-edit">编辑</label>
                                                </c:if>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </section>
                    <!-- 照片内容 end -->

                    <!-- 标签 start -->
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
                                <label for="comment_form_content" class="required">内容</label>
                                <label class="checkForCommentUseHtmlTag"><input type="checkbox" id="useInputCommentUseHtmlTag" value="useHtmlTag"/> html注入</label>
                                <label class="checkForCommentSendAnonymously"><input type="checkbox" id="useSendCommentAnonymously" value="sendAnonymously"/> 匿名评论</label>
                                <input type="hidden" name="parentId" id="comment_form_parentId" value="0"/>
                                <input type="hidden" name="replyUid" id="comment_form_replyUid" value="${article.author.uid}"/>
                                <textarea rows="4" cols="50" name="content" id="comment_form_content" class="textarea" required="" placeholder=""></textarea>
                            </p>
                            <p>
                                <button type="button" id="comment_form_submit" class="submit ripple"><span>提交评论</span>
                                    <ripple-container></ripple-container>
                                </button>
                            </p>
                        </form>
                    </div>
                    <!-- 评论 input end -->
                </article>
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

<div class="note-editor">
    <div class="modal fade in" id="updateVideoModal" aria-hidden="false" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span
                            aria-hidden="true">×</span></button>
                    <h4 class="modal-title">更新视频信息</h4></div>
                <div class="modal-body" style="padding-bottom: 0px;">
                    <div class="form-group">
                        <label class="control-label">视频ID：&nbsp;&nbsp;&nbsp;&nbsp;</label>
                        <a target="_blank" style="color: #666; cursor: pointer" title="在相册中打开">
                            <span name="video_id" class="control-label"></span>
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
                        <input class="note-image-input form-control" type="file" name="video_file" accept="video/mp4,video/webm">
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
                        <input class="note-image-input form-control" name="cover_photo_id" value="0" style="margin-top: 5px;display: none;">
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
                        <a href="photo.do?method=tags_square" target="_blank" style="color: #666; cursor: pointer" title="标签广场">
                            <label>标签：</label>
                        </a>
                        <span class="form-control tags-modify" name="tags">
                            <input type="text" class="tag-input" name="tag_input"/>
                        </span>
                    </div>
                    <div class="form-group " style="padding-top: 7px;">
                        <label class="control-label">视频可见性：</label>
                        <label class="radio-inline" style="margin-left:10px;">
                            <input type="radio" name="video_permission" value="0" checked="checked"> 公开
                        </label>
                        <label class="radio-inline">
                            <input type="radio" name="video_permission" value="1"> 好友可见
                        </label>
                        <label class="radio-inline">
                            <input type="radio" name="video_permission" value="2"> 私有
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label">视频大小：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>
                        <span name="video_size" class="control-label"></span>
                    </div>
                    <div class="form-group">
                        <label class="control-label">上传时间：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>
                        <span name="video_upload_time" class="control-label"></span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-danger" name="deleteVideo_trigger">删除视频</button>
                    <button class="btn btn-primary" name="updateVideo_trigger">更新信息</button>
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
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="video_detail"></script>

</body>
</html>