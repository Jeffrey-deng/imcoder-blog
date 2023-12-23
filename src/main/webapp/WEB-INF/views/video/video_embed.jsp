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

        .plyr.plyr--video-loading {
            cursor: progress;
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

        /* Live Photo */
        .plyr--video.plyr--live-photo .plyr__controls {
            opacity: 0;
            pointer-events: none;
            transform: translateY(100%);
            transition: 0s;
        }

        .plyr--video.plyr--live-photo .plyr__control--overlaid {
            opacity: 0;
            visibility: hidden;
            transition: 0s;
        }

        .plyr--video.plyr--live-photo .plyr__poster {
            cursor: pointer;
        }

        .plyr--video.plyr--live-photo.plyr--video-loading .plyr__poster {
            cursor: progress;
        }

        .plyr--video.plyr--live-photo .plyr__video-wrapper .plyr--live-photo-muted-btn:hover::after {
            animation: 0.5s live-photo-tips-audio infinite;
        }

        .plyr--video.plyr--live-photo .plyr__video-wrapper .plyr--live-photo-muted-btn::after{
            /*display: block;*/
            position: fixed;
            right: 45px;
            top: 10px;
            font-size: 0.9rem;
            width: 80px;
            height: 28px;
            padding: 3px 6px;
            margin: auto;
            border-radius: 6px;
            background-color: #909fac91;
            color: white;
            text-align: center;
            visibility: hidden;
            pointer-events: none;
            z-index: 10;
        }

        .plyr--video.plyr--live-photo .plyr__video-wrapper .plyr--live-photo-muted-btn.muted::after{
            content: '开启声音';
        }

        .plyr--video.plyr--live-photo .plyr__video-wrapper .plyr--live-photo-muted-btn::after{
            content: '点击静音';
        }

        @keyframes live-photo-tips-audio {
            0% {
                visibility: visible;
            }
            100% {
                visibility: visible;
            }
        }

        .voice-message-wrapper .plyr--audio {
            padding: 8px;
        }

        .voice-message-wrapper .plyr--audio .plyr__controls{
            border-radius: 5px;
            /*  border-radius: 10px;
            background: linear-gradient(to left top, #e0f6ffa6, #f5fcff) fixed;
            border: 1px solid #e7eaec8a;*/
        }

    </style>

    <!-- 修复某些移动端浏览器设置UA为PC，页面仍显示手机版的问题 -->
    <script>
        if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) && (window.screen.availWidth <= 768 || window.screen.availHeight <= 768) && window.devicePixelRatio >= 2) {
            var viewport = document.querySelector("meta[name=viewport]")
                ,content = viewport.getAttribute('content');
            viewport.setAttribute('content', content.replace(/(initial-scale=).*?(,|$)/, '$1' + (1 / window.devicePixelRatio) + '$2'));
        }
    </script>
</head>
<body uid="<c:if test="${not empty loginUser}"><s:eval expression="loginUser.uid"/></c:if>" data-is-special-man="${is_special_man}">

<form id="video_info_form">
    <input type="hidden" name="video_id" value="<s:eval expression="video.video_id"/>"/>
</form>
<div id="player-wrapper">
    <video id="site-player" class="video-player" crossorigin playsinline webkit-playsinline></video>
</div>

<svg xmlns="http://www.w3.org/2000/svg" style="display: none">
    <symbol id="live-photo-muted-symbol">
        <g>
            <g style="display: block;">
                <g transform="matrix(1,0,0,1,44,44)" opacity="1">
                    <g opacity="1" transform="matrix(1,0,0,1,0,0)">
                        <path fill="rgb(255,255,255)" fill-opacity="1"
                              d=" M-0.4399999976158142,-25.09600067138672 C-0.15000000596046448,-24.736000061035156 0,-24.29599952697754 0,
                              -23.84600067138672 C0,-23.84600067138672 0,23.833999633789062 0,23.833999633789062 C0,24.93400001525879 -0.8999999761581421,
                              25.833999633789062 -2,25.833999633789062 C-2.450000047683716,25.833999633789062 -2.890000104904175,25.673999786376953 -3.25,
                              25.393999099731445 C-3.25,25.393999099731445 -20,11.994000434875488 -20,11.994000434875488 C-20,11.994000434875488 -24,
                              11.994000434875488 -24,11.994000434875488 C-28.420000076293945,11.994000434875488 -32,8.413999557495117 -32,
                              3.99399995803833 C-32,3.99399995803833 -32,-4.00600004196167 -32,-4.00600004196167 C-32,-8.425999641418457 -28.420000076293945,
                              -12.005999565124512 -24,-12.005999565124512 C-24,-12.005999565124512 -20,-12.005999565124512 -20,
                              -12.005999565124512 C-20,-12.005999565124512 -3.25,-25.4060001373291 -3.25,-25.4060001373291 C-2.390000104904175,
                              -26.09600067138672 -1.1299999952316284,-25.95599937438965 -0.4399999976158142,-25.09600067138672z M13.777999877929688,
                              -28.895999908447266 C24.81800079345703,-23.615999221801758 31.99799919128418,-12.456000328063965 31.99799919128418,
                              -0.006000000052154064 C31.99799919128418,12.454000473022461 24.808000564575195,23.624000549316406 13.748000144958496,
                              28.893999099731445 C11.758000373840332,29.8439998626709 9.368000030517578,29.003999710083008 8.418000221252441,
                              27.003999710083008 C7.4679999351501465,25.013999938964844 8.317999839782715,22.624000549316406 10.307999610900879,
                              21.673999786376953 C18.607999801635742,17.724000930786133 23.99799919128418,9.343999862670898 23.99799919128418,
                              -0.006000000052154064 C23.99799919128418,-9.345999717712402 18.618000030517578,-17.715999603271484 10.338000297546387,
                              -21.676000595092773 C8.338000297546387,-22.625999450683594 7.498000144958496,-25.016000747680664 8.447999954223633,
                              -27.006000518798828 C9.39799976348877,-29.006000518798828 11.788000106811523,-29.84600067138672 13.777999877929688,
                              -28.895999908447266z M8,-13.866000175476074 C12.779999732971191,-11.095999717712402 16,-5.926000118255615 16,
                              -0.006000000052154064 C16,5.914000034332275 12.779999732971191,11.083999633789062 8,13.854000091552734 C8,13.854000091552734 8,
                              -13.866000175476074 8,-13.866000175476074z"></path>
                    </g>
                </g>
            </g>
            <g class="muted-line" transform="matrix(1,0,0,1,41.172000885009766,46.827999114990234)" opacity="1" style="display: block;">
                <g opacity="1" transform="matrix(1,0,0,1,-0.5,-0.5)">
                    <path fill="rgb(255,255,255)" fill-opacity="1"
                          d=" M-33.94157409667969,-28.281574249267578 C-35.50258255004883,-29.84258270263672 -35.50258255004883,
                          -32.377418518066406 -33.94157409667969,-33.93842697143555 C-33.94157409667969,-33.93842697143555 -33.93842697143555,
                          -33.94157409667969 -33.93842697143555,-33.94157409667969 C-32.377418518066406,-35.50258255004883 -29.84258270263672,
                          -35.50258255004883 -28.281574249267578,-33.94157409667969 C-28.281574249267578,-33.94157409667969 33.94157409667969,
                          28.281574249267578 33.94157409667969,28.281574249267578 C35.50258255004883,29.84258270263672 35.50258255004883,
                          32.377418518066406 33.94157409667969,33.93842697143555 C33.94157409667969,33.93842697143555 33.93842697143555,
                          33.94157409667969 33.93842697143555,33.94157409667969 C32.377418518066406,35.50258255004883 29.84258270263672,
                          35.50258255004883 28.281574249267578,33.94157409667969 C28.281574249267578,33.94157409667969 -33.94157409667969,
                          -28.281574249267578 -33.94157409667969,-28.281574249267578z"></path>
                </g>
            </g>
        </g>
    </symbol>
</svg>

<a id="basePath" class="site-path-prefix" href="<%=basePath%>" style="display:none;"></a>
<a id="staticPath" class="site-path-prefix" href="<%=staticPath%>" style="display:none;"></a>
<a id="cloudPath" class="site-path-prefix" href="<%=cloudPath%>" style="display:none;"></a>

<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="video_embed"></script>
</body>
</html>