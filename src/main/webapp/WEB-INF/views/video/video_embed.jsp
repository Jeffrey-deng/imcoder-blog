<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jstl/fmt_rt" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
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
    <title>${video.name} - ${video.user.nickname} | ImCoder博客's 视频</title>
    <meta name="description" content="${fn:escapeXml(video.description)}">
    <meta name="keywords" content="${video.tags},ImCoder's 博客,视频">
    <!-- 使用url函数转换相关路径 -->
    <!-- <script async="" src="http://www.google-analytics.com/analytics.js"></script> -->

    <!-- 引入文件 -->
    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/plyr/plyr.css<%=urlArgs%>">
    <style>
        body {
            position: absolute;
            width: 100%;
            height: 100%;
            margin: 0px;
            padding: 0px;
            overflow: hidden;
        }

        #player-wrapper video, #player-wrapper iframe, #player-wrapper embed {
            height: 100vh;
            width: 100vw;
            margin: 0 auto;
            display: block;
        }

        #player-wrapper .audio-player.video-player + .plyr__poster {
            opacity: 1 !important;
        }

        .plyr__captions {
            z-index: 1;
        }

        .plyr__controls .plyr__time--current {
            margin-left: 6px;
        }

        .plyr__controls .plyr__time--duration {
            margin-left: 0px;
        }

        .plyr__time + .plyr__time::before {
            margin-right: 5px;
        }

        .plyr__controls .plyr__volume {
            margin-left: 0px;
        }

        #player-wrapper .audio-wrapper {
            display: block;
            position: relative;
            background-color: #000;
            height: 100vh;
            width: 100vw;
            margin: auto;
            cursor: pointer;
        }

        #player-wrapper .audio-wrapper img.audio-cover {
            display: block;
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            max-height: 100%;
            max-width: 100%;
            margin: auto;
        }

        #player-wrapper .audio-wrapper .audio-cover {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #000;
            background-position: 50% 50%;
            background-repeat: no-repeat;
            background-size: contain;
            opacity: 1;
            transition: opacity .2s ease;
        }

        #player-wrapper .audio-wrapper > :last-child {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: unset;
            transition: opacity .3s ease-in-out, transform .3s ease-in-out;
        }

        #player-wrapper .audio-wrapper .audio-play-btn {
            display: block;
            position: absolute;
            left: 50%;
            top: 50%;
            padding: 15px;
            border: 0;
            border-radius: 100%;
            background: rgba(26, 175, 255, .8);
            box-shadow: 0 1px 1px rgba(0, 0, 0, .15);
            color: #fff;
            flex-shrink: 0;
            overflow: visible;
            z-index: 2;
            transform: translate(-50%, -50%);
            transition: all .3s ease;
            cursor: pointer;
        }

        #player-wrapper .audio-wrapper .audio-play-btn:focus {
            outline: 0;
            box-shadow: 0 0 0 5px rgba(26, 175, 255, .5);
        }

        #player-wrapper .audio-wrapper .audio-play-btn svg {
            display: block;
            position: relative;
            height: 18px;
            width: 18px;
            left: 2px;
            pointer-events: none;
            fill: currentColor;
        }

        #player-wrapper .audio-wrapper .audio-play-btn span {
            clip: rect(1px, 1px, 1px, 1px);
            overflow: hidden;
            border: 0 !important;
            height: 1px !important;
            padding: 0 !important;
            position: absolute !important;
            width: 1px !important;
            color: #fff;
            cursor: pointer;
        }

        #player-wrapper .audio-wrapper .plyr--audio .plyr__controls {
            color: #fff;
            background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, .7));
        }

        #video_info_form {
            display: none;
        }

        .plyr__video-embed-disable .plyr__video-wrapper.plyr__video-embed, .plyr__video-embed-disable .plyr__video-wrapper.plyr__video-wrapper--fixed-ratio {
            padding-bottom: unset !important;
            height: unset;
        }

        .plyr__video-embed-disable .plyr__video-embed iframe, .plyr__video-embed-disable .plyr__video-wrapper--fixed-ratio iframe {
            border: unset;
            left: unset;
            position: unset;
            top: unset;
        }

        .plyr--paused.plyr__poster-enabled .plyr__video-embed .plyr__poster {
            display: none;
        }

        .plyr--stopped.plyr__poster-enabled .plyr__video-embed .plyr__poster {
            display: unset;
        }

    </style>
</head>
<body uid="<c:if test="${not empty loginUser}"><s:eval expression="loginUser.uid"/></c:if>" data-is-special-man="${is_special_man}">

<form id="video_info_form">
    <input type="hidden" name="video_id" value="<s:eval expression="video.video_id"/>"/>
</form>
<div id="player-wrapper">
    <video id="site-player" class="video-player" crossorigin></video>
</div>

<a id="basePath" class="site-path-prefix" href="<%=basePath%>" style="display:none;"></a>
<a id="staticPath" class="site-path-prefix" href="<%=staticPath%>" style="display:none;"></a>
<a id="cloudPath" class="site-path-prefix" href="<%=cloudPath%>" style="display:none;"></a>

<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="video_embed"></script>
</body>
</html>