<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
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
    <title>写博客 - ImCoder's 博客</title>
    <!-- 使用url函数转换相关路径 -->
    <!-- <script async="" src="http://www.google-analytics.com/analytics.js"></script> -->

    <!-- 引入文件 -->
    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <%--<link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.min.css<%=urlArgs%>">--%>
    <link rel="stylesheet" href="<%=staticPath%>lib/font-awesome/font-awesome.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>css/style.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/summernote/summernote-bs3.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/summernote/summernote.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/niftymodals/jquery.niftymodals.min.css<%=urlArgs%>"/>
    <style>
        .form-control, .note-editor .form-control {
            padding: 0.42857em;
            height: 2.42857em;
        }

        .form-control, .note-editor .form-control {
            font-size: 1em;
        }

        .note-editor .modal .btn {
            padding: 0.42857em 0.42857em;
        }

        .note-editor .modal .btn {
            font-size: 1em;
        }

        .note-editor img {
            transition: all .2s ease-in-out;
        }

        .modal .modal-footer {
            margin-top: 0px;
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
<body uid="<c:if test="${not empty loginUser}"><s:eval expression="loginUser.uid"/></c:if>">
<div id="first" class="" style="z-index:1000;background-image: url('<%=staticPath%>img/bg-site.png');">
    <div class="carousel-inner">
        <div class="">
            <div class="container">
                <div class="" style="text-align:center">
                    <h1>${loginUser.nickname}</h1>
                    <h3>${loginUser.description}</h3>
                </div>
            </div>
        </div>
    </div>
</div><!-- END COVER -->

<!-- toolbar start -->
<nav id="header" class="navbar navbar-default toolbar" role="navigation">
    <div class="container-fluid">
        <div class="navbar-header">
            <div class="navbar-brand">
                <p><a class="logo" href="<%=basePath%>">ImCoder</a></p>
            </div>
            <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar-collapse" aria-expanded="false">
                <span class="sr-only">Toggle navigation</span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
            </button>
        </div>
        <div class="collapse navbar-collapse hiddenscorll" id="navbar-collapse">
            <ul class="nav navbar-nav">
                <li class="dropdown site-navigation">
                    <a class="dropdown-toggle" data-toggle="dropdown">导航<span class="caret"></span></a>
                    <ul class="dropdown-menu" role="menu">
                        <div class="row">
                            <div class="nav-menu nav-menu-kind">
                                分类
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=0" target="_blank">默认</a>
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=1" target="_blank">开发</a>
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=2" target="_blank">折腾</a>
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=3" target="_blank">资源</a>
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=4" target="_blank">科技</a>
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=5" target="_blank">游戏</a>
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=6" target="_blank">段子</a>
                            </div>
                            <div class="nav-menu">
                                <a href="<%=basePath%>a/list?category.atid=7" target="_blank">杂谈</a>
                            </div>
                        </div>
                        <div class="row">
                            <div class="nav-menu nav-menu-kind">
                                服务
                            </div>
                            <div class="nav-menu more-space">
                                <a class="toolbar-jump-write-article" href="<%=basePath%>a/edit?mark=new" target="_blank">写博客</a>
                            </div>
                            <div class="nav-menu more-space">
                                <a class="toolbar-jump-paste-code" href="http://paste.ubuntu.com" target="_blank">贴代码</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-albums" href="<%=basePath%>p/dashboard" target="_blank">相册</a>
                            </div>
                            <div class="nav-menu" style="padding-left: 5px">
                                <a class="toolbar-jump-cloud" href="<%=cloudPath%>" target="_blank">cloud</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-archives" href="<%=basePath%>a/archives" target="_blank">归档</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-tags" href="<%=basePath%>a/tags" target="_blank">标签</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-user-history" href="<%=basePath%>u/history" target="_blank">历史</a>
                            </div>
                            <c:if test="${(not empty loginUser) && loginUser.userGroup.isManager()}">
                                <div class="nav-menu">
                                    <a class="toolbar-jump-manager" href="<%=basePath%>manager/backstage" target="_blank">管理</a>
                                </div>
                            </c:if>
                        </div>
                        <div class="row">
                            <div class="nav-menu nav-menu-kind">
                                站点
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-login" href="<%=basePath%>auth/login" target="_blank">登录</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-register" href="<%=basePath%>auth/register" target="_blank">注册</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-notice" href="<%=basePath%>notices" target="_blank">公告</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-help" href="<%=basePath%>help" target="_blank">帮助</a>
                            </div>
                            <div class="nav-menu">
                                <a class="toolbar-jump-about" href="<%=basePath%>about" target="_blank">关于</a>
                            </div>
                        </div>
                    </ul>
                </li>
                <li><a href="<%=basePath%>">首页</a></li>
                <li class="active"><a>编辑</a></li>
            </ul>
            <ul class="nav navbar-nav navbar-right">
                <form class="navbar-form navbar-left site-search" role="search">
                    <div class="form-group">
                        <input type="text" class="search-query form-control span3 toolbar-input-search-keyword" name="kw" placeholder="输入关键字搜索">
                    </div>
                    <button type="button" class="btn-search submit toolbar-btn-search-submit">搜索</button>
                </form>
                <c:if test="${not empty loginUser}">
                    <li class="dropdown site-login-user">
                        <a class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
                            <img src="<s:eval expression="loginUser.head_photo"/>"/><span class="caret"></span>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="nav-menu toolbar-jump-user-center" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/center" target="_blank">个人中心</a></li>
                            <li><a class="nav-menu toolbar-jump-user-home" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/home" target="_blank">我的博客</a></li>
                            <li><a class="nav-menu toolbar-jump-user-albums" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/albums" target="_blank">我的相册</a></li>
                            <li><a class="nav-menu toolbar-jump-user-videos" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/videos" target="_blank">我的视频</a></li>
                            <li><a class="nav-menu toolbar-jump-user-history" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/history" target="_blank">我的历史</a></li>
                            <li><a class="nav-menu toolbar-jump-user-messages" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/center/messages" target="_blank">我的消息</a></li>
                            <li><a class="nav-menu toolbar-jump-user-setting" href="<%=basePath%>u/<s:eval expression="loginUser.uid"/>/center/settings" target="_blank">修改设置</a></li>
                            <li><a class="nav-menu toolbar-jump-user-logout" title="点击退出登录">安全退出</a></li>
                        </ul>
                    </li>
                </c:if>
            </ul>
        </div><!-- navbar-collapse end -->
    </div><!-- container-fluid end -->
</nav>
<!-- toolbar end -->

<!-- body start -->
<div id="body">
    <div class="container">
        <div class="row">

            <!-- tips区  start -->
            <div class="col-md-3 col-sm-12 col-xs-12 hidden-xs">

                <article class="post">
                    <p class="ui red ribbon label">Tips 1</p>
                    <p></p>
                    <ul class="tips-list">
                        <li>点击[插入代码]可插入code</li>
                        <li>回车总有代码框时，可在左上角样式选择p消除</li>
                    </ul>
                </article>

                <article class="post">
                    <p class="ui red ribbon label">Tips 2</p>
                    <p></p>
                    <ul class="tips-list">
                        <li>图片可以拖拽到编辑框上传，并可以同时拖拽多张图片</li>
                        <li>点击图片上的重置按钮，可设置为该图片原始大小</li>
                        <li>点击图片上的升级按钮，可将原本引用互联网的图片上传到本站服务器</li>
                        <li>点击图片上的封面按钮，可将图片设置为本文章封面</li>
                    </ul>
                </article>

                <article class="post">
                    <p class="ui red ribbon label">Tips 3</p>
                    <p></p>
                    <ul class="tips-list">
                        <li>点击[源代码]可查看文字的html代码，并直接可修改</li>
                    </ul>
                </article>

                <article class="post">
                    <p class="ui red ribbon label">Tips 4</p>
                    <p></p>
                    <ul class="tips-list">
                        <li>可给文章添加标签，用于分类与用户查找</li>
                    </ul>
                </article>

                <article class="post">
                    <p class="ui red ribbon label">Tips 5</p>
                    <p></p>
                    <ul class="tips-list">
                        <li>可给文章设置权限</li>
                        <li>勾选通知关注你的用户，你发表文章后会以邮件通知</li>
                    </ul>
                </article>

            </div>
            <!-- tips区  end -->

            <!-- 右侧区域  start -->
            <div id="main" class="col-md-9 col-sm-12 col-xs-12" role="main">
                <article class="post" itemscope="" itemtype="http://schema.org/BlogPosting">
                    <div id="article_edit" class="summernote article-edit-detail"></div>
                </article>
                <article class="post" itemscope="" itemtype="http://schema.org/BlogPosting">
                    <section class="post-container">
                        <form id="article_form" method="post" class="form-horizontal form-article-edit">
                            <div class="form-group form-group-article-edit-title">
                                <label class="col-xs-2 col-sm-2 control-label">标题</label>
                                <div class="col-xs-10 col-sm-10">
                                    <input name="title" type="text" class="form-control article-edit-title" requried="requried">
                                </div>
                            </div>
                            <div class="hr-line-dashed"></div>
                            <div class="form-group form-group-article-edit-summary">
                                <label class="col-sm-2 control-label">摘要</label>
                                <div class="col-sm-10">
                                    <div id="article_summary" class="summernote article-edit-summary"></div>
                                    <span class="help-block m-b-none">文章列表里显示的时你的摘要，如果不填，则会默认取你的文章前1000个(html)字符</span>
                                    <span class="help-block m-b-none">如果你比较懒的话，还是建议别填</span>
                                </div>
                            </div>
                            <div class="hr-line-dashed"></div>
                            <div class="form-group form-group-article-edit-category">
                                <label class="col-xs-2 col-sm-2 control-label">分类</label>
                                <div class="col-xs-10 col-sm-3">
                                    <select class="form-control m-b article-edit-category" name="category.atid">
                                        <option value="0" selected="selected">默认</option>
                                        <option value="1">开发</option>
                                        <option value="2">折腾</option>
                                        <option value="3">资源</option>
                                        <option value="4">科技</option>
                                        <option value="5">游戏</option>
                                        <option value="6">段子</option>
                                        <option value="7">杂谈</option>
                                    </select>
                                </div>
                            </div>
                            <div class="hr-line-dashed"></div>
                            <div class="form-group form-group-article-edit-permission">
                                <label class="col-xs-2 col-sm-2 control-label" title="不公开意思是 不会在搜索结果、广场、用户主页中出现">
                                    文章可见性
                                </label>
                                <div class="col-xs-10  col-sm-3">
                                    <select class="form-control m-b article-edit-permission" name="permission">
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
                            <div class="hr-line-dashed"></div>
                            <div class="form-group form-group-article-edit-tags">
                                <label class="col-xs-2 col-sm-2 control-label">标签</label>
                                <div class="col-xs-10 col-sm-10">
                                    <div class="input-group">
                                        <span class="form-control tags-modify article-edit-tags" name="tags">
                                            <input type="text" class="tag-input article-edit-input-tags" title="回车完成输入" placeholder="回车完成输入"/>
                                         </span>
                                        <span class="input-group-addon btn btn-sm article-edit-btn-tags-edit tags-edit-btn">编辑</span>
                                    </div>
                                    <span class="help-block m-b-none">添加标签能让别人更加容易找到你文章</span>
                                </div>
                            </div>
                            <div class="hr-line-dashed"></div>
                            <div class="form-group form-group-article-edit-inform">
                                <label class="col-xs-2 col-sm-2 control-label">通知</label>
                                <div class="col-xs-10 col-sm-10">
                                    <div class="input-group m-b">
                                        <span class="input-group-addon">
                                            <input class="article-edit-inform" name="inform" type="checkbox">
                                        </span>
                                        <lable class="form-control">通知关注你的用户,你发表了文章</lable>
                                    </div>
                                </div>
                            </div>
                            <div class="hr-line-dashed"></div>
                            <div class="form-group form-group-article-edit-save">
                                <div class="col-xs-8 col-xs-offset-2 col-sm-4 col-sm-offset-4">
                                    <button class="btn btn-primary article-edit-btn-submit" type="button">保存内容</button>
                                    <button class="btn btn-white article-edit-btn-cancel" type="button">取消</button>
                                </div>
                            </div>
                        </form>
                    </section>
                </article>
            </div>
            <!-- end #main 右侧 区域  end -->

        </div><!-- end .row -->
    </div>
</div>
<!-- body end -->
<div id="goTop" class="" style="bottom: 70px;">
    <div class="arrow"></div>
    <div class="stick"></div>
</div>

<div class="md-container md-effect-13" id="resultTipsModal">
    <div class="md-content">
        <h3>提示</h3>
        <div>
            <p>你的文章保存成功！</p>
            <ul>
                <li><strong>分享</strong>给你的朋友分享你的文章吧</li>
                <ul>
                    <li style="list-style-type:none;"><strong><a class="copy_article_link_btn" style="color:#fff;cursor: pointer" data-clipboard-text="http://imcoder.site/">点击copy地址</a></strong></li>
                    <li style="list-style-type:none;"><strong><a class="open-article-link" style="color:#fff">点击查看文章</a></strong></li>
                    <li style="float:left;list-style-type:none;"><strong><a class="open-size-home-link" href="<%=basePath%>" style="color:#fff">点击回主页</a></strong></li>
                </ul>
            </ul>
        </div>
    </div>
</div>

<footer id="footer" role="contentinfo" class="card site-footer">
    <span>© 2016 </span><a href="https://imcoder.site" target="_blank">ImCoder</a><span> 博客 ，基于 </span><a>Java</a><span> 语言开发</span>
    <c:if test="${not empty site_icp_record_code}">
        <span>，ICP备案：</span><a class="site-icp-record" href="http://beian.miit.gov.cn/" target="_blank">${site_icp_record_code}</a>
    </c:if>
    <c:if test="${not empty site_police_record_code}">
        <span>，公安备案：</span><img class="police-record-icon" src="<%=staticPath%>img/police_record_icon.png">
        <a class="site-police-record" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=${site_police_record_number}" target="_blank">${site_police_record_code}</a>
    </c:if>
</footer>

<a id="basePath" class="site-path-prefix" href="<%=basePath%>" style="display:none;"></a>
<a id="staticPath" class="site-path-prefix" href="<%=staticPath%>" style="display:none;"></a>
<a id="cloudPath" class="site-path-prefix" href="<%=cloudPath%>" style="display:none;"></a>
<!-- Bootstrap & Plugins core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="article_edit"></script>
<!-- ######################################### -->

<script>
    //    var edit = function () {
    //        $("#eg").addClass("no-padding");
    //        $(".click2edit").summernote({
    //            lang: "zh-CN",
    //            focus: true
    //        })
    //    };
    //    var save = function () {
    //        $("#eg").removeClass("no-padding");
    //        var aHTML = $(".click2edit").code();
    //        $(".click2edit").destroy()
    //    };
</script>

</body>
</html>