<%@ page language="java" import="site.imcoder.blog.common.Utils" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.entity.Photo" %>
<%@ page import="site.imcoder.blog.setting.Config" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ page import="site.imcoder.blog.common.id.IdUtil" %>
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

    Photo photo = (Photo) request.getAttribute("photo");
    if (photo != null) {
        String tags = photo.getTags();
        if (Utils.isNotBlank(tags)) {
            String[] tagArr = Utils.splitNotEmpty(tags, "#");
            request.setAttribute("tags", tagArr);
        }
        // String photoDesc = "<p>" + (Utils.isNotEmpty(photo.getDescription()) ? photo.getDescription().replace("\n", "</p><p>") : "") + "</p>";
        String photoDesc = photo.getDescription();
        String shortId = IdUtil.convertToShortPrimaryKey(photo.getPhoto_id());
        request.setAttribute("photoDesc", photoDesc);
        request.setAttribute("photoName", Utils.isBlank(photo.getName()) ? ("photo_" + shortId) : photo.getName());
        request.setAttribute("photoTitle", Utils.isBlank(photo.getName()) ? ("photo_" + shortId) : (shortId + "_" + photo.getName()));
    }
    // request.setAttribute("randomLikeCount", 10 + (int) (Math.random() * 120));
%>
<!DOCTYPE html>
<html class="no-js">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="renderer" content="webkit">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
    <base href="<%=basePath%>" target="_self">
    <title>${photoTitle} - ${album.user.nickname} | ImCoder博客's 相册</title>
    <meta name="description" content="${fn:escapeXml(photo.description)}">
    <meta name="keywords" content="相册,相册详情,${photo.tags},ImCoder's 博客">
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
        .post {
            margin-top: 1.5em;
        }

        .mfp-arrow {
            margin-top: -84px;
        }

        .mfp-arrow:active {
            margin-top: -84px;
        }

        .mfp-arrow-left {
            left: 30px;
        }

        .mfp-arrow-right {
            right: 30px;
        }

        button.topic-arrow:focus {
            opacity: 1;
        }

        button.topic-arrow {
            opacity: 1;
            display: none;
        }

        .comment-list li.comment-by-author > .comment-author > cite > a::after {
            content: ' (照片作者)';
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
                    <h2 class="slogan_name photo-name" hostUid="<s:eval expression="album.user.uid"/>" albumId="<s:eval expression="album.album_id"/>">${photoTitle}</h2>
                    <h3 class="slogan_desc album_name">${album.name}</h3>
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
                <li class="active"><a><s:eval expression="photo.photo_id"/></a></li>
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

                <article class="post" style="background-color: #f8f8f8;box-shadow: 0px 0px 1px 0.5px #ddd;">
                    <!-- 照片内容区 start -->
                    <section>
                        <div class="photo-detail-img">
                            <button title="上一张" type="button" class="topic-arrow-left topic-arrow mfp-arrow mfp-arrow-left mfp-prevent-close"></button>
                            <button title="下一张" type="button" class="topic-arrow-right topic-arrow mfp-arrow mfp-arrow-right mfp-prevent-close"></button>
                            <img id="show-img" src="<s:eval expression="photo.path"/>" title="点击`平铺`显示"/>
                        </div>
                        <div class="photo-detail-info" data-photo-id="<s:eval expression="photo.photo_id"/>">
                            <div class="photo-detail-info-inline">
                                <form id="photo_form" method="post" class="form-horizontal">
                                    <div class="photo-detail-info-header">
                                        <h3 class="photo-detail-name">
                                            <a href="p/detail/<s:eval expression="photo.photo_id"/>" target="_blank" title="${photoName}">${photoName}</a>
                                        </h3>
                                        <div class="photo-detail-set-area">
                                            <div class="photo-detail-click-count" title="点击量"><span class="glyphicon glyphicon-eye-open"></span><em class="photo-detail-click-count-value">${photo.click_count}</em></div>
                                            <div class="photo-detail-show-size">显示：<a data-show-size="fit" title="点击`平铺`显示">适应⬇</a></div>
                                            <div class="photo-detail-user-nickname">
                                                上传者：
                                                <a data-user-id="<s:eval expression="album.user.uid"/>" href="u/<s:eval expression="album.user.uid"/>/home" target="_blank">
                                                    <img class="photo-detail-user-head-photo" src="<%=staticPath%>${album.user.head_photo}">
                                                    <span class="photo-detail-user-nickname-value">${album.user.nickname}</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <hr class="fill-width">
                                    <div class="photo-detail-info-main">
                                        <div class="area-set-left">
                                            <div class="form-group">
                                                <label class="col-xs-2 col-sm-2 control-label">说&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;明</label>
                                                <div class="col-xs-10 col-sm-10">
                                                    <span class="help-block photo-detail-desc">${photoDesc}</span>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-xs-2 col-sm-2 control-label">标&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;签</label>
                                                <div class="col-xs-10 col-sm-10">
                                                    <span class="help-block photo-detail-tags">
                                                        <c:forEach items="${tags}" var="tag">
                                                            <a target="_blank" href="p/tag/${tag}" data-photo-tag="${tag}">#${tag}#</a>&nbsp;&nbsp;
                                                        </c:forEach>
                                                    </span>
                                                </div>
                                            </div>
                                            <c:if test="${(not empty photo.topic) and (not empty photo.topic.name)}">
                                                <div class="form-group">
                                                    <label class="col-xs-2 col-sm-2 control-label">合&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;集</label>
                                                    <div class="col-xs-10 col-sm-10">
                                                    <span class="help-block photo-detail-topic">
                                                        <a target="_blank" href="p/topic/<s:eval expression="photo.topic.ptwid"/>" title="${photo.topic.description}">#${photo.topic.name}#</a>&nbsp;&nbsp;
                                                    </span>
                                                    </div>
                                                </div>
                                            </c:if>
                                        </div>
                                        <div class="area-set-right">
                                            <div class="form-group">
                                                <label class="col-xs-2 col-sm-2 control-label">相&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;关</label>
                                                <div class="col-xs-9 col-sm-9">
                                                    <span class="help-block photo-detail-refer"><a target="_blank" href="${photo.refer}">${photo.refer}</a></span>
                                                </div>
                                            </div>
                                            <div class="hr-line-dashed"></div>
                                            <div class="form-group">
                                                <label class="col-xs-2 col-sm-2 control-label">图片大小</label>
                                                <div class="col-xs-9 col-sm-9">
                                                    <span class="help-block photo-detail-size">${photo.size}KB（${photo.width}×${photo.height}）</span>
                                                </div>
                                            </div>
                                            <div class="hr-line-dashed"></div>
                                            <div class="form-group">
                                                <label class="col-xs-2 col-sm-2 control-label">图片类型</label>
                                                <div class="col-xs-9 col-sm-9">
                                                    <span class="help-block photo-detail-image-type">${photo.image_type}</span>
                                                </div>
                                            </div>
                                            <div class="hr-line-dashed"></div>
                                            <div class="form-group">
                                                <label class="col-xs-2 col-sm-2 control-label">上传日期</label>
                                                <div class="col-xs-9 col-sm-9">
                                                    <span class="help-block photo-detail-upload-time"><s:eval expression="photo.upload_time"/></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <hr class="fill-width">
                                    <div class="photo-detail-info-footer">
                                        <div class="area-set-left">
                                            <div class="form-group">
                                                <label class="col-xs-2 col-sm-2 control-label">所属相册</label>
                                                <div class="col-xs-9 col-sm-9">
                                                    <span class="help-block photo-detail-album-name">
                                                        <a class="photo-source-album" data-album-id="<s:eval expression="album.album_id"/>" data-album-name="${album.name}" target="_blank"
                                                           href="p/album/<s:eval expression="album.album_id"/>?check=<s:eval expression="photo.photo_id"/>"
                                                           title="${album.name}">${album.name}</a>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="area-set-right">
                                            <div class="photo-detail-video" style="display: none;">
                                                <label class="col-xs-2 col-sm-2 control-label">相关视频</label>
                                                <div class="col-xs-7 col-sm-7">
                                                    <span class="help-block photo-detail-video-name">
                                                        <a target="_blank" href="u/0/videos"></a>
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="photo-detail-handle-area">
                                                <div class="like-btn-wrapper photo-detail-like<c:if test="${photo.liked}"> photo-has-liked like-wrapper-has-liked</c:if>" title="点赞">
                                                    <svg class="like-btn photo-detail-like-btn" viewBox="0 0 24 24">
                                                        <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" class="style-scope yt-icon"></path>
                                                    </svg>
                                                    <div class="photo-detail-like-count">${photo.like_count}</div>
                                                </div>
                                                <c:if test="${(not empty loginUser) and loginUser.uid == photo.uid}">
                                                    <label class="control-label photo-detail-open-edit">编辑</label>
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
                                <label>内容</label>
                                <label class="comment-control checkForCommentUseHtmlTag"><input type="checkbox" id="useInputCommentUseHtmlTag" value="useHtmlTag"/> html注入</label>
                                <label class="comment-control checkForCommentSendAnonymously"><input type="checkbox" id="useSendCommentAnonymously" value="sendAnonymously"/> 匿名评论</label>
                                <button class="comment-control openInsertImageModalBtn btn btn-default btn-sm" id="openInsertImageModalTrigger" title="发送图片"><i class="glyphicon glyphicon-picture"></i></button>
                                <input type="hidden" name="parentId" id="comment_form_parentId" value="0"/>
                                <input type="hidden" name="replyUid" id="comment_form_replyUid" value=""/>
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
                    <label>合集名称/权限：</label>
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
                            <input type="text" class="tag-input" name="tag_input"/>
                        </span>
                        <span class="input-group-addon btn btn-sm tags-edit-btn">编辑</span>
                    </div>
                </div>
                <div class="form-group" style="overflow:auto;">
                    <label>引用：</label>
                    <input class="form-control" type="text" name="photo_refer">
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
                            <input type="text" class="tag-input" name="tag_input"/>
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
                    <input class="form-control" type="text" name="album_cover_path" placeholder="置空则使用默认封面"/>
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
                <div class="form-group">
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
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="photo_detail"></script>

</body>
</html>