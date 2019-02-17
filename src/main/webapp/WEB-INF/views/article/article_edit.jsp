<%@ page language="java" import="site.imcoder.blog.setting.Config" pageEncoding="UTF-8" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
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
    <title>写博客 - ImCoder's 博客</title>
    <!-- 使用url函数转换相关路径 -->
    <!-- <script async="" src="http://www.google-analytics.com/analytics.js"></script> -->

    <!-- 引入文件 -->
    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/css/style.hplus.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/font-awesome/font-awesome.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>css/style.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/summernote/summernote-bs3.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/summernote/summernote.min.css<%=urlArgs%>">
    <link rel="stylesheet" href="<%=staticPath%>lib/niftymodals/jquery.niftymodals.min.css<%=urlArgs%>"/>
</head>
<body uid="${loginUser.uid}">
<div id="first" class="" style="z-index:1000;background-image: url(<%=staticPath%>img/bg-site.png);">
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
                <li class="active"><a>编辑</a></li>
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
        <div class="row">

            <!-- tips区  start -->
            <div class="col-md-3 col-sm-12 col-xs-12 hidden-xs">

                <article class="post">
                    <p class="ui red ribbon label">Tips 1</p>
                    <p>
                    <ul class="tips-list">
                        <li>点击[插入代码]可插入code</li>
                        <li>回车总有代码框时，可在左上角样式选择p消除</li>
                    </ul>
                </article>

                <article class="post">
                    <p class="ui red ribbon label">Tips 2</p>
                    <p>
                    <ul class="tips-list">
                        <li>图片可以拖拽到编辑框上传，并可以同时拖拽多张图片</li>
                        <li>点击图片上的重置按钮，可设置为该图片原始大小</li>
                        <li>点击图片上的升级按钮，可将原本引用互联网的图片上传到本站服务器</li>
                        <li>点击图片上的封面按钮，可将图片设置为本文章封面</li>
                    </ul>
                </article>

                <article class="post">
                    <p class="ui red ribbon label">Tips 3</p>
                    <p>
                    <ul class="tips-list">
                        <li>点击[源代码]可查看文字的html代码，并直接可修改</li>
                    </ul>
                </article>

                <article class="post">
                    <p class="ui red ribbon label">Tips 4</p>
                    <p>
                    <ul class="tips-list">
                        <li>可给文章添加标签，用于分类与用户查找</li>
                    </ul>
                </article>

                <article class="post">
                    <p class="ui red ribbon label">Tips 5</p>
                    <p>
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
                    <div class="summernote" id="article_edit">
                    </div>
                </article>

                <article class="post" itemscope="" itemtype="http://schema.org/BlogPosting">
                    <section class="post-container">
                        <form id="article_form" method="post" class="form-horizontal">
                            <div class="form-group">
                                <label class="col-xs-2 col-sm-2 control-label">标题</label>
                                <div class="col-xs-10 col-sm-10">
                                    <input name="title" type="text" class="form-control" requried="requried">
                                </div>
                            </div>
                            <div class="hr-line-dashed"></div>
                            <div class="form-group">
                                <label class="col-sm-2 control-label">摘要</label>
                                <div class="col-sm-10">
                                    <div class="summernote" id="article_summary"></div>
                                    <span class="help-block m-b-none">文章列表里显示的时你的摘要，如果不填，则会默认取你的文章前1000个(html)字符</span>
                                    <span class="help-block m-b-none">如果你比较懒的话，还是建议别填</span>
                                </div>
                            </div>
                            <div class="hr-line-dashed"></div>
                            <div class="form-group">
                                <label class="col-xs-2 col-sm-2 control-label">分类</label>

                                <div class="col-xs-10 col-sm-2">
                                    <select class="form-control m-b" name="atid">
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
                            <div class="form-group">
                                <label class="col-xs-2 col-sm-2 control-label">
                                    文章可见性
                                </label>
                                <div class="col-xs-10  col-sm-10">
                                    <div class="radio">
                                        <label><input type="radio" checked="" value="0" id="permission_public" name="permission">公开</label>
                                    </div>
                                    <div class="radio">
                                        <label><input type="radio" value="1" id="permission_friends" name="permission">对好友可见</label>
                                    </div>
                                    <div class="radio">
                                        <label><input type="radio" value="2" id="permission_private" name="permission">私有</label>
                                    </div>
                                </div>
                            </div>
                            <div class="hr-line-dashed"></div>
                            <div class="form-group">
                                <label class="col-xs-2 col-sm-2 control-label">标签</label>

                                <div class="col-xs-10 col-sm-10">
                                    <div class="row" id="tags" style=''>
                                    </div>
                                    <br>
                                    <div class="row">
                                        <div class="col-xs-7 col-md-4">
                                            <input id="text_addTag" type="text" placeholder="输入标签" class="m-b" name="input_Tag">
                                        </div>
                                        <button type="button" id="btn_addTag" class="btn btn-xs btn-primary">添加</button>
                                    </div>
                                    <span class="help-block m-b-none">添加标签能让别人更加容易找到你文章</span>
                                </div>
                            </div>
                            <div class="hr-line-dashed"></div>
                            <div class="form-group">
                                <label class="col-xs-2 col-sm-2 control-label">通知</label>

                                <div class="col-xs-10 col-sm-10">
                                    <div class="input-group m-b">
                                        <span class="input-group-addon"><input name="inform" value="inform" type="checkbox"> </span>
                                        <lable class="form-control">通知关注你的用户,你发表了文章</lable>
                                    </div>
                                </div>
                            </div>
                            <div class="hr-line-dashed"></div>
                            <div class="form-group">
                                <div class="col-xs-8 col-xs-offset-2 col-sm-4 col-sm-offset-4">
                                    <button class="btn btn-primary" type="button" id="btn_save">保存内容</button>
                                    <button class="btn btn-white" type="button" id="btn_cancle">取消</button>
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
<!-- code modal start 代码编辑框 -->
<div class="note-editor">
    <div class="modal fade in" id="code_editModal" aria-hidden="false" tabindex="-1" style="padding-right: 5px;">
        <div class="modal-dialog insert-code-panel" style="margin-top:80px;">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
                    <h4 class="modal-title">插入代码块</h4>
                </div>
                <div class="modal-body" style="padding-bottom: 5px;">
                    <div class="form-group note-group-image-url" style="overflow:auto;">
                        <textarea style="overflow-x:auto;" wrap="off" rows="12" class="modal-body" id="code_edit_area"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default note-image-btn" data-dismiss="modal" id="btn_cancleinsertcode">取消</button>
                    <button class="btn btn-primary note-image-btn" id="btn_insertcode">插入代码</button>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- code modal end 代码编辑框 -->

<div class="note-editor">
    <div class="modal fade in" id="insertAlbumPhotos_modal" aria-hidden="false" tabindex="-1" style="padding-right: 5px;">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
                    <h4 class="modal-title">插入相册</h4>
                </div>
                <div class="modal-body" style="padding-bottom: 10px;">
                    <div class="form-group">
                        <label>名称:</label>
                        <select class="form-control col-md-12" id="insertAlbumPhotos_albumSelect">
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" data-dismiss="modal">取消</button>
                    <button class="btn btn-primary" id="insertAlbumPhotos_confirmBtn">插入图片</button>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="md-container md-effect-13" id="ResultTipsModal">
    <div class="md-content">
        <h3>提示</h3>
        <div>
            <p>你的文章保存成功！</p>
            <ul>
                <li><strong>分享</strong>给你的朋友分享你的文章吧</li>
                <ul>
                    <li style="list-style-type:none;"><strong id=""><a id="copy_btn" style="color:#fff" data-clipboard-text="http://imcoder.site/">点击copy地址</a></strong></li>
                    <li style="list-style-type:none;"><strong><a id="a_checkDeatil" href="#" style="color:#fff">点击查看文章</a></strong></li>
                    <li style="float:left;list-style-type:none;"><strong><a id="a_checkIndex" href="<%=basePath%>article.do?method=list" style="color:#fff">点击回主页</a></strong></li>
                </ul>
            </ul>
        </div>
    </div>
</div>

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
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true" async="true" id="require_node" page="article_edit"></script>
<!-- ######################################### -->

<script>
    /* var edit = function() {
     $("#eg").addClass("no-padding");
     $(".click2edit").summernote({
     lang : "zh-CN",
     focus : true
     })
     };
     var save = function() {
     $("#eg").removeClass("no-padding");
     var aHTML = $(".click2edit").code();
     $(".click2edit").destroy()
     }; */
</script>


</body>
</html>