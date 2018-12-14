<%--
  User: Jeffrey.Deng
  Date: 2018/12/17
  Time: 5:36
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="site.imcoder.blog.setting.Config" %>
<%@ page import="site.imcoder.blog.setting.ConfigConstants" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%
    String path = request.getContextPath();
    String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
    String staticPath = Config.get(ConfigConstants.SITE_CDN_ADDR);
    String cloudPath = Config.get(ConfigConstants.SITE_CLOUD_ADDR);
    String urlArgs = Config.get(ConfigConstants.SITE_CDN_ADDR_ARGS);
%>
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Cloud - ImCODER</title>
    <meta name="keywords" content="Cloud,ImCODER,ImCODER's 博客,blog">
    <meta name="description" content="Cloud,ImCODER,ImCODER's 博客,blog">
    <link rel="icon" href="<%=staticPath%>img/favicon.ico">
    <link rel="stylesheet" href="<%=staticPath%>lib/bootstrap/bootstrap.min.css<%=urlArgs%>"/>
    <link rel="stylesheet" href="<%=staticPath%>lib/toastr/toastr.min.css<%=urlArgs%>">

    <style>

        body {
            /*text-align: center;*/
            font-size: 14px;
        }

        @media (min-width: 1700px) {
            body {
                font-size: 17.5px;
            }
        }

        #main {
            text-align: left;
            width: 1000px;
            margin: 0 auto;
        }

        table tr td > div {
            width: 480px;
            height: 300px;
            margin: 10px;
        }

        table tr td > div > div.panel-body {
            margin-left: 5px;
            margin-right: 5px;
        }

        tr {
            cursor: pointer;
        }

        .folder-name {
            text-decoration-line: underline;
        }

        .folder-name.no-line {
            text-decoration-line: none;
        }

        a.site-home:hover, a.site-home:visited, a.site-home:link, a.site-home:active {
            text-decoration: none;
            color: #333;
        }

        .expries-name {
            display: none;
            margin-left: 15px;
            color: #3c763d;
            font-size: 90%;
        }

        .expries-value {
            display: none;
            font-size: 90%;
        }

        .expries-value-right {
            color: #3c763d;
        }

        .expries-value-invalid {
            color: #a94442;
        }

    </style>
</head>
<body>
<div id="main" style="padding-bottom: 6px;">
    <div class="page-header">
        <h1>Share
            <small>in</small>
            <a class="site-home" href="<%=basePath%>" target="_blank">ImCoder</a></h1>
    </div>

    <table style="width: 100%;">
        <tr>
            <td colspan="2">
                <div class="panel panel-success" style="height: auto;overflow-x: auto;width: 100%;">
                    <div class="panel-heading">输入 Jeffrey 提供的授权码</div>
                    <div class="panel-body">
                        <form action="" class="form-horizontal">
                            <div class="form-group">
                                <label style="margin-left: 5px;">sts-token</label>
                                <textarea class="form-control" id="sts-input" rows="5" placeholder="授权码"></textarea>
                            </div>
                            <div class="form-group">
                                <input type="button" class="btn btn-primary" id="sts-input-save" value="Open" style="margin-left: 15px;">
                                <small class="expries-name">有效期至</small>
                                <small class="expries-value"></small>
                            </div>
                        </form>
                    </div>
                </div>
            </td>
        </tr>
        <tr style="display: none;">
            <td>
                <div class="panel panel-primary">
                    <div class="panel-heading">Upload file</div>
                    <div class="panel-body">
                        <form action="" class="form-horizontal">
                            <div class="form-group">
                                <label>Select file</label>
                                <input type="file" id="file"/>
                            </div>
                            <div class="form-group">
                                <label>Store as</label>
                                <input type="text" class="form-control" id="object-key-file" value="object"/>
                            </div>
                            <div class="form-group">
                                <input type="button" class="btn btn-primary" id="file-button" value="Upload"/>
                            </div>
                        </form>
                        <br/>
                        <div class="progress">
                            <div id="progress-bar"
                                 class="progress-bar"
                                 role="progressbar"
                                 aria-valuenow="0"
                                 aria-valuemin="0"
                                 aria-valuemax="100" style="min-width: 2em;">
                                0%
                            </div>
                        </div>
                    </div>
                </div>
            </td>
            <td>
                <div class="panel panel-success">
                    <div class="panel-heading">Upload content</div>
                    <div class="panel-body">
                        <form action="" class="form-horizontal">
                            <div class="form-group">
                                <label>Content</label>
                                <textarea class="form-control" id="file-content" rows="3">Hello, OSS!</textarea>
                            </div>
                            <div class="form-group">
                                <label>Store as</label>
                                <input type="text" class="form-control" id="object-key-content" value="object"/>
                            </div>
                            <div class="form-group">
                                <input type="button" class="btn btn-primary" id="content-button" value="Save"/>
                            </div>
                        </form>
                    </div>
                </div>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <div class="panel panel-info" style="height: auto;overflow-x: auto;width: 100%;">
                    <div class="panel-heading" id="list-files-title">List files</div>
                    <div class="panel-body">
                        <table class="table table-striped" id="list-files-table">
                            <tr>
                                <th>Key</th>
                                <th>Size</th>
                                <th>LastModified</th>
                                <th>Handle</th>
                            </tr>
                        </table>
                        <input type="button" class="btn btn-primary" id="list-files-button" value="Refresh"/>
                    </div>
                </div>
            </td>
        </tr>
        <tr style="display: none;">
            <td colspan="2">
                <div class="panel panel-warning" style="height: auto;overflow-x: auto;width: 100%;">
                    <div class="panel-heading">Download file</div>
                    <div class="panel-body">
                        <form action="" class="form-horizontal">
                            <div class="form-group">
                                <label>Object key</label>
                                <input type="text" class="form-control" id="dl-object-key" value="object"/>
                            </div>
                            <div class="form-group">
                                <label>Save as</label>
                                <input type="text" class="form-control" id="dl-file-name" value="filename"/>
                            </div>
                            <div class="form-group">
                                <input type="button" class="btn btn-primary" id="dl-button" value="Download"/>
                            </div>
                        </form>
                    </div>
                </div>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                Powered by
                <a href="<%=basePath%>" target="_blank">ImCoder</a> &
                <a href="https://www.aliyun.com/product/oss" target="_blank">OSS</a> &
                <a href="https://github.com/ali-sdk/ali-oss" target="_blank">ali-oss</a></td>
        </tr>
    </table>
</div>

<a id="basePath" href="<%=basePath%>" style="display:none;"></a>
<a id="staticPath" href="<%=staticPath%>" style="display:none;"></a>
<a id="cloudPath" href="<%=cloudPath%>" style="display:none;"></a>
<div style="display: none" id="require_modules">["jquery", "bootstrap", "domReady", "toastr", "common_utils", "aliyun-oss-sdk", "cloud_share"]</div>
<script baseUrl="<%=staticPath%>" urlArgs="<%=urlArgs%>" data-main="<%=staticPath%>js/config.js<%=urlArgs%>" src="<%=staticPath%>lib/requirejs/require.min.js" defer="true"
        async="true" id="require_node" page="cloud_share"></script>

</body>
</html>

