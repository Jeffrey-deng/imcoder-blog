(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'globals', 'common_utils', "aliyun-oss-sdk"], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, globals, common_utils, OSS);
    }
})(function ($, bootstrap, domReady, toastr, globals, common_utils, OSS) {

    toastr.options = {
        "closeButton": false,
        "debug": false,
        "progressBar": false,
        "positionClass": "toast-bottom-left",
        "showDuration": "400",
        "hideDuration": "1000",
        "hideOnHover": false,
        "timeOut": "3500",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };

    var appServer = 'http://localhost:3000';
    var bucket = 'imcoder-cloud';
    var region = 'oss-cn-shenzhen';
    var sharepath = '';
    var initpath = '';
    var expires_time = '';

    var urllib = OSS.urllib;
    var Buffer = OSS.Buffer;
    var OSS = OSS.Wrapper;
    var STS = OSS.STS;

    var sts_token = null;
    var client = null;

    // Play without STS. NOT SAFE! Because access key id/secret are
    // exposed in web page.

    // var client = new OSS({
    //   region: 'oss-cn-hangzhou',
    //   accessKeyId: '<access-key-id>',
    //   accessKeySecret: '<access-key-secret>',
    //   bucket: '<bucket-name>'
    // });
    //
    // var applyTokenDo = function (func) {
    //   return func(client);
    // };

    var applyTokenDo = function (func, code) {
        // var url = appServer;
        // return urllib.request(url, {
        //     method: 'GET'
        // }).then(function (result) {
        //     var creds = JSON.parse(result.data);
        //     var client = new OSS({
        //         region: region,
        //         accessKeyId: creds.AccessKeyId,
        //         accessKeySecret: creds.AccessKeySecret,
        //         stsToken: creds.SecurityToken,
        //         bucket: bucket
        //     });
        //     return func(client);
        // });
        if (!code) {
            toastr.error('请输入授权码~');
            return;
        }
        if (code == sts_token) {
            return func(client);
        } else {
            sts_token = code;
            var data = JSON.parse(new Buffer(code, 'base64').toString()); // new Base64().decode(code)
            //console.log('STS Token info: ', data);
            var bucket = data.osspath.match(/^oss:\/\/(.*?)\//)[1];
            client = new OSS({
                region: data.region,
                accessKeyId: data.id,
                accessKeySecret: data.secret,
                stsToken: data.stoken,
                bucket: bucket
            });
            sharepath = data.osspath.replace('oss://' + bucket + '/', '');
            initpath = sharepath;
            expires_time = new Date(data.expiration).getTime();
            var expires_time_str = common_utils.formatDate(expires_time, 'yyyy-MM-dd hh:mm:ss');
            var show_exp_name_node = document.querySelector('.expires-name');
            var show_exp_value_node = document.querySelector('.expires-value');
            show_exp_name_node.style.display = "inline-block";
            show_exp_value_node.style.display = "inline-block";
            if (expires_time > new Date().getTime()) {
                show_exp_value_node.innerHTML = expires_time_str;
                show_exp_value_node.className = "expires-value expires-value-right";
            } else {
                toastr.error(expires_time_str, '授权码已过期');
                show_exp_value_node.innerHTML = "已过期";
                show_exp_value_node.className = "expires-value expires-value-invalid";
                return;
            }
            return func(client);
        }
    };

    var progress = function (p) {
        return function (done) {
            var bar = document.getElementById('progress-bar');
            bar.style.width = Math.floor(p * 100) + '%';
            bar.innerHTML = Math.floor(p * 100) + '%';
            done();
        }
    };

    var uploadFile = function (client) {
        var file = document.getElementById('file').files[0];
        var key = document.getElementById('object-key-file').value.trim() || 'object';
        console.log(file.name + ' => ' + key);

        return client.multipartUpload(key, file, {
            progress: progress
        }).then(function (res) {
            console.log('upload success: %j', res);
            return listFiles(client);
        });
    };

    var uploadContent = function (client) {
        var content = document.getElementById('file-content').value.trim();
        var key = document.getElementById('object-key-content').value.trim() || 'object';
        console.log('content => ' + key);

        return client.put(key, new Buffer(content)).then(function (res) {
            return listFiles(client);
        });
    };

    var openfile = function (e) {
        applyTokenDo(function (client) {
            var path = e.currentTarget.getAttribute('data-path');
            var result = '';
            if (/\.(jpg|png|git|webp)$/i.test(path)) {
                result = client.signatureUrl(path, {
                    response: {
                        'content-type': 'image/jpeg'
                    }
                });
            } else {
                result = client.signatureUrl(path);
            }
            toastr.success(path, '打开文件');
            window.open(result);
        }, document.getElementById('sts-input').value);
    };

    var opendir = function (e) {
        applyTokenDo(function (client) {
            sharepath = e.currentTarget.getAttribute('data-path');
            listFiles(client);
        }, document.getElementById('sts-input').value);
    };

    var listFiles = function (client) {
        var table = document.getElementById('list-files-table');
        globals.notify({
            "progressBar": false,
            "hideDuration": 0,
            "showDuration": 0,
            "timeOut": 0,
            "closeButton": false
        }).success(sharepath, '正在加载列表', 'notify_file_list_loading');
        return client.list({
            prefix: sharepath,
            delimiter: '/',
            'max-keys': 100
        }).then(function (result) {
            var dirinfo = "List files：";
            var dirs = sharepath.replace(initpath.replace(/[^\/]*\/$/, ""), "").replace(/(^\/)|(\/$)/g, '').split('/');
            var currentPath = initpath.replace(/[^\/]*\/$/, '');
            for (var i in dirs) {
                var foldername = dirs[i];
                if (foldername) {
                    currentPath += foldername + '/';
                    dirinfo += '<b class="folder-name' + (i == (dirs.length - 1) ? ' no-line' : '') + '" data-path="' + currentPath + '">' + foldername + '</b> / ';
                }
            }
            document.getElementById('list-files-title').innerHTML = dirinfo;

            var dirnodes = document.querySelectorAll('#list-files-title .folder-name');
            if (dirnodes) {
                for (var i in dirnodes) {
                    dirnodes[i].onclick = opendir;
                }
            }

            var numRows = table.rows.length;
            for (var i = 1; i < numRows; i++) {
                table.deleteRow(table.rows.length - 1);
            }

            if (sharepath != initpath) {
                var lastDir = table.insertRow(1);
                lastDir.setAttribute('data-path', sharepath.replace(/[^\/]*\/$/, ""));
                var lastDirtd = lastDir.insertCell(0);
                lastDirtd.innerHTML = "...";
                lastDirtd.style.color = "#d39f44";
                lastDirtd.setAttribute('colspan', '4');
                lastDir.onclick = opendir;
                lastDir.title = "返回上一级目录";
            }

            var prefixes = result.prefixes;

            if (prefixes) {
                for (var i = 0; i < prefixes.length; i++) {
                    var row = table.insertRow(table.rows.length);
                    row.setAttribute('data-path', prefixes[i]);
                    var td = row.insertCell(0);
                    td.innerHTML = prefixes[i].substring(sharepath.length, prefixes[i].length - 1);
                    td.style.color = "#d39f44";
                    td.setAttribute('colspan', '4');
                    td.title = "进入目录";
                    row.onclick = opendir;
                }
            }

            if (result.objects) {
                var objects = result.objects.sort(function (a, b) {
                    var ta = new Date(a.lastModified);
                    var tb = new Date(b.lastModified);
                    if (ta > tb) return -1;
                    if (ta < tb) return 1;
                    return 0;
                });

                for (var i = 0; i < Math.min(40, objects.length); i++) {
                    if (sharepath != objects[i].name) {
                        var row = table.insertRow(table.rows.length);
                        row.setAttribute('data-path', objects[i].name);
                        row.insertCell(0).innerHTML = objects[i].name.replace(new RegExp('^' + sharepath), '');
                        row.insertCell(1).innerHTML = (Math.round((objects[i].size / 1024) * 100) / 100) + 'K';
                        row.insertCell(2).innerHTML = objects[i].lastModified.replace('T', ' ').replace(/.000Z$/, '');
                        row.insertCell(3).innerHTML = "<a>open</a>";
                        row.onclick = openfile;
                    }
                }

                if (objects.length > 40) {
                    var omitRow = table.insertRow(table.rows.length);
                    var omitTd = omitRow.insertCell(0);
                    omitTd.innerHTML = "文件太多，就不全部显示了~";
                    omitTd.style.color = "#d39f44";
                    omitTd.setAttribute('colspan', '4');
                }
            }
            globals.removeNotify('notify_file_list_loading');
            //console.log("files list result for \"" + sharepath + "\" is: \n", result);
        }).catch(function (e) {
            globals.removeNotify('notify_file_list_loading');
            globals.notify({
                "progressBar": false,
                "hideDuration": 0,
                "showDuration": 0,
                "timeOut": 10000,
                "closeButton": false
            }).error(e.message, e.status, 'notify_no_permission');
        });
    };

    var downloadFile = function (client) {
        var object = document.getElementById('dl-object-key').value.trim();
        var filename = document.getElementById('dl-file-name').value.trim();
        console.log(object + ' => ' + filename);

        var result = client.signatureUrl(object, {
            response: {
                'content-disposition': 'attachment; filename="' + filename + '"'
            }
        });
        window.location = result;

        return result;
    };

    domReady(function () {

        document.getElementById('file-button').onclick = function () {
            applyTokenDo(uploadFile, document.getElementById('sts-input').value);
        };

        document.getElementById('content-button').onclick = function () {
            applyTokenDo(uploadContent, document.getElementById('sts-input').value);
        };

        document.getElementById('list-files-button').onclick = function () {
            var backpath = sharepath;
            applyTokenDo(function (client) {
                sharepath = backpath;
                listFiles(client);
            }, document.getElementById('sts-input').value);
        };

        document.getElementById('dl-button').onclick = function () {
            applyTokenDo(downloadFile, document.getElementById('sts-input').value);
        };

        document.getElementById('sts-input-save').onclick = function () {
            applyTokenDo(listFiles, document.getElementById('sts-input').value);
        }

    });


});