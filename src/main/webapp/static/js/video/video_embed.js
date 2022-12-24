/**
 * 用户视频IFrame分享引用
 * @author Jeffrey.Deng
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'Plyr', 'toastr', 'globals', 'common_utils'], factory);
    } else {
        // Browser globals
        factory(jQuery, Plyr, toastr, globals, common_utils);
    }
})(function ($, Plyr, toastr, globals, common_utils) {

    var currentVideo = null;
    var currentPlayer = null;
    var config = {
        path_params: globals.path_params,
        callback: {
            "activity_change_calls": [],
            "ratio_change_calls": [],
            "video_page_ready_calls": [],
            "video_dom_ready_calls": [],
            "video_has_played_calls": [],
            "video_play_status_change_calls": [],
        },
        status: {
            videoPageReady: false,
            videoDomReady: false,
            videoHasPlayed: false,
            videoPlayStatus: "pause",
            userActivity: true,
            videoRotate: 0,
            videoFlip: ["0"]
        },
        isEmbedWindow: window.top != window.self
    };

    var videoPageReady = function () {
        if (!config.status.videoPageReady) {
            $.each(config.callback.video_page_ready_calls, function (i, call) {
                try {
                    call.call(currentVideo, currentPlayer);
                } catch (e) {

                }
            });
        }
        config.status.videoPageReady = true;
    };

    var videoDomReady = function () {
        if (!config.status.videoDomReady) {
            $.each(config.callback.video_dom_ready_calls, function (i, call) {
                try {
                    call.call(currentVideo, currentPlayer);
                } catch (e) {

                }
            });
        }
        config.status.videoDomReady = true;
    };

    var videoHasPlayed = function () {
        if (!config.status.videoHasPlayed) {
            $.each(config.callback.video_has_played_calls, function (i, call) {
                try {
                    call.call(currentVideo, currentPlayer);
                } catch (e) {

                }
            });
        }
        config.status.videoHasPlayed = true;
    };

    var videoPlayStatusChange = function (playStatus) {
        $.each(config.callback.video_play_status_change_calls, function (i, call) {
            try {
                call.call(currentVideo, playStatus);
            } catch (e) {

            }
        });
        config.status.videoPlayStatus = playStatus;
    };

    var activityChange = function (isActive) {
        $.each(config.callback.activity_change_calls, function (i, call) {
            try {
                call.call(currentVideo, isActive, currentPlayer);
            } catch (e) {

            }
        });
        config.status.userActivity = isActive;
    };

    var ratioChange = function (eyeRawWidth, eyeRawHeight, angle) {
        $.each(config.callback.ratio_change_calls, function (i, call) {
            try {
                call.call(currentVideo, eyeRawWidth, eyeRawHeight, angle, currentPlayer);
            } catch (e) {
            }
        });
        config.status.videoRotate = angle;
    };

    const request = globals.extend(globals.request, {
        video_embed: {
            'loadVideo': function (video_id, success) {
                let postData = typeof video_id === 'object' ? video_id : {"video_id": video_id};
                return globals.request.get(globals.api.getVideo, postData, success, ['video'], '加载视频出错');
            },
            'saveVideoHasPlayed': function (video_id, success) {
                let postData = typeof video_id === 'object' ? video_id : {"video_id": video_id};
                postData.deep = 1;
                postData.first_access_referer = document.referrer;
                postData.first_access_path = document.location.href;
                // if (window.frameElement) { // 只有同源才能获取
                //     postData.first_access_referer = window.parent.document.referrer;
                //     postData.first_access_path = window.parent.document.location.href;
                // }
                return globals.request.post(globals.api.triggerVideoAccess, postData, success, ['video'], false);
            },
        }
    }).video_embed;

    // 根据比例设置元素宽高，算法以填充宽度优先, box_height为undefined时表示不限制高度
    var calcVideoPix = function ($video, whichCalcFirst, box_width, box_height, scale_width, scale_height) {
        if (whichCalcFirst == 'w') { // 当宽度优先时
            var need_height = box_width / scale_width * scale_height; // 设定height的值
            if (box_height && need_height > box_height) {   // 当没`显示设置`值（为undefined）时
                $video.css('height', box_height + 'px');
                $video.css('width', '');
                // 高度不够时，设置最大高度，同时寻找合适宽度
                var need_width = ((box_height) / scale_height) * scale_width;
                if (need_width <= box_width) {
                    $video.css('width', need_width + 'px');
                }
            } else {
                $video.css('height', need_height + 'px');
            }
        } else { // 当高度优先时
            var need_width = box_height / scale_height * scale_width; // 设定width的值
            if (box_width && need_width > box_width) {
                $video.css('width', box_width + 'px');
                $video.css('height', '');
                // 宽度不够时，设置最大宽度，同时寻找合适高度
                var need_height = (box_width / scale_width) * scale_height;
                if (need_height <= box_height) {
                    $video.css('height', need_height + 'px');
                }
            } else {
                $video.css('width', need_width + 'px');
            }
        }
    };

    // 根据引用iframe的属性值来初始化video
    var initIframeSettingInParentPage = function (player, video) {
        var $video_iframe_in_top = window.frameElement ? $(window.frameElement) : null;
        if ($video_iframe_in_top) {
            var isNeedRunScale = true;
            var user_set_width = null;
            var user_set_height = null;
            var whichCalcFirst = "w";
            var setIframeSize = function () {
                if (player.set_iframe_size_running_lock || player.web_fullscreen || player.fullscreen.active) {
                    return;
                }
                player.set_iframe_size_running_lock = true; // 锁
                let scale_type = $video_iframe_in_top.attr('data-scale');   // 保持的比例方式
                let scale_stay_in_rotate = $video_iframe_in_top.attr('data-stay-in-rotate') == 'true';
                let style = $video_iframe_in_top.prop('style');
                let scale_w, scale_h, clearIframeWidth, clearIframeHeight;
                switch (true) {
                    case "stay" == scale_type:
                        if (scale_stay_in_rotate && (player.rotate == 90 || player.rotate == 270)) {
                            scale_w = video.height;
                            scale_h = video.width;
                        } else {
                            scale_w = video.width;
                            scale_h = video.height;
                        }
                    case /^(\d+):(\d+)$/.test(scale_type):
                        if (scale_type != 'stay') {
                            scale_w = parseInt(RegExp.$1);
                            scale_h = parseInt(RegExp.$2);
                        }
                        if (user_set_height === null) {
                            if (style.height.indexOf('%') != -1) {
                                user_set_height = NaN;
                            } else if (style.height.indexOf('em') != -1) {
                                user_set_height = NaN;
                            } else {
                                user_set_height = parseInt(style.height) || undefined;
                            }
                            if (user_set_height !== undefined) {
                                whichCalcFirst = "h";
                            }
                        }
                        if (user_set_width === null) {
                            if (style.width.indexOf('%') != -1) {
                                user_set_width = NaN;
                            } else if (style.width.indexOf('em') != -1) {
                                user_set_width = NaN;
                            } else {
                                user_set_width = parseInt(style.width) || undefined;
                            }
                            if (user_set_width !== undefined) {
                                whichCalcFirst = "w";
                            }
                        }
                        // 当没`显示设置`值（为undefined）时，另外处理
                        // user_set_width 设置了具体的px值时也要重新获取，因为有的情况css_width值并不代表实际width，例如同时设置width和max-width，且width小于max-width时
                        let precisionSize = (user_set_width !== undefined || user_set_height !== undefined) && common_utils.getElemRealPrecisionSize($video_iframe_in_top);
                        clearIframeWidth = user_set_width === undefined ? user_set_width : precisionSize.width;
                        clearIframeHeight = user_set_height === undefined ? user_set_height : precisionSize.height;
                        calcVideoPix($video_iframe_in_top, whichCalcFirst, clearIframeWidth, clearIframeHeight, scale_w, scale_h);
                        break;
                    default:
                        user_set_width = null;
                        user_set_height = null;
                        isNeedRunScale = false;
                }
                player.set_iframe_size_running_lock = false;
            };
            setIframeSize();
            if (true) {
                $($video_iframe_in_top.prop('contentWindow')).resize(setIframeSize);
            }
            var set_autoplay = $video_iframe_in_top.attr('data-autoplay');  // 是否自动播放
            if (set_autoplay) {
                player.autoplay = set_autoplay == 'true';
            }
            var set_start = $video_iframe_in_top.attr('data-start'); // seek到一个播放时间，单位秒
            if (!isNaN(set_start)) {
                player.start_time = parseFloat(set_start);
            }
            $video_iframe_in_top.attr('allowfullscreen', 'true')[0].allowFullscreen = true;
        }
    };

    // 视频控制栏显示控制
    var bindVideoControlEvent = function ($playerWrapper, player, video) {
        var isAudio = config.isAudio;
        onActivityChange(function (isActive, player) {
            if (player && isAudio) {
                if (isActive) {
                    $(player.elements.container).css('transform', '');
                    if (player.paused) { // 暂停时
                        $playerWrapper.find('.audio-play-btn').show(0);
                    }
                } else {
                    if (!player.paused) { // 播放时
                        $(player.elements.container).css('transform', 'translateY(100%)');
                        $playerWrapper.find('.audio-play-btn').hide(0);
                    }
                }
            }
        });
        initLivePhotoEvent(player, video);
        // 这些回调方法在父window中无效，需使用我新创建的API
        // Triggered when the instance is ready for API calls.
        player.on('ready', function (event) {
            if (video.video_type === 'video/mp3') {
                $(player.media).addClass('audio-player');
            }
            // var instance = event.detail.plyr; // player
            // this equals player.elements.container
            var $self = $(this);
            $self.toggleClass('plyr--video-loading', true);
            if (!player.isEmbed) {
                // add the removed poster in new version
                $self.addClass(player.config.classNames.posterEnabled);
                $('<div>', {
                    'class': player.config.classNames.poster,
                    'style': 'background-image: url(\'' + player.config.poster + '\');'
                }).appendTo(player.elements.wrapper);
            }
            if (!config.disable_embed && !config.isYoutube) { // 赋值source
                let qualityValue = getQualityValue(video);
                // generateVideoSignatureUrl(video.video_id, 4000, false)
                $(`<source src="${video.path}" size="${qualityValue}">`).prependTo(player.media);
            }
            if (!isAudio) {
                // for popup hide control btn when mouse not moving.
                $self.on('mousemove', function (e) {
                    activityChange(true);
                });
            } else {
                let isMouseMove = true;
                let mouse_timer = null;
                $playerWrapper.on('mousemove', '.audio-wrapper', function (e) {
                    activityChange(true);
                    isMouseMove = true;
                }).on('mouseenter', '.audio-wrapper', function (e) {
                    mouse_timer && window.clearInterval(mouse_timer);
                    activityChange(true);
                    mouse_timer = window.setInterval(function () {  // 定时器隐藏控制条
                        if (!isMouseMove) {
                            activityChange(false);
                        }
                        isMouseMove = false;
                    }, 5000);
                    isMouseMove = true;
                }).on('mouseleave', '.audio-wrapper', function (e) {
                    mouse_timer && window.clearInterval(mouse_timer);
                    activityChange(false);
                    isMouseMove = false;
                }).on('click', '.audio-wrapper', function (e) {
                    let $target = $(e.target);
                    if ($target.hasClass('audio-cover') || $target.hasClass('audio-wrapper')) {
                        player.togglePlay();
                    }
                }).on('click', '.audio-play-btn', function () {
                    player.togglePlay();
                });
            }
            if (!isAudio) {
                // 强制打开字幕，默认即使有字幕也会因为语言不符合而关闭
                if (video.subtitles && video.subtitles.length > 0) {
                    player.toggleCaptions(true);
                }
                $(player.elements.settings.panels.quality).find('button[value="-1"]').remove();
            } else {
                // add new button
                $playerWrapper.find('.audio-play-btn').show();
            }
            initLoopControlHtml(player, player.enable_loop);
            initRotateControlHtml(player, player.rotate);
            initFlipControlHtml(player);
            initOpenInSiteControlHtml(player, video);
            initWebFullscreenControlHtml(player, video);
            videoDomReady();
        });
        // The media's metadata has finished loading; all attributes now contain as much useful information as they're going to.
        player.on('loadedmetadata', function (event) {
            video.live_photo !== 1 && $(this).toggleClass('plyr--video-loading', false);
            // fixed bug
            $(player.elements.controls).find('.plyr__volume').removeAttr('hidden');
            if (player.autoplay) {
                player.play();
            }
            if (player.start_time > 0) {
                player.currentTime = player.start_time;
            }
        });
        player.on('playing', function (event) {
            // fixed bug
            $(player.elements.controls).find('.plyr__volume').removeAttr('hidden');
            activityChange(false);
            videoHasPlayed();
            videoPlayStatusChange('playing');
        });
        player.on('pause', function () {
            activityChange(true);
            videoPlayStatusChange('pause');
        });
        player.on('ended', function () {
            videoPlayStatusChange('ended');
        });
        // document.addEventListener('visibilitychange', function () {
        //     // 解决chrome下后台标签会延迟加载视频从而导致签名过期的问题
        //     if (!config.disable_embed && !config.isYoutube && !config.isPageActiveAtBegin && player.buffered == 0 && !config.retryLoad && document['visibilityState'] == 'visible') {
        //         let $media = $(player.media), $source = $media.find('source'), qualityValue = getQualityValue(video),
        //             newSourceHtml = `<source src="${generateVideoSignatureUrl(video.video_id, 4000, false)}" size="${qualityValue}">`;
        //         if ($source.hasValue()) {
        //             $source.replaceWith(newSourceHtml);
        //         } else {
        //             $media.prepend(newSourceHtml);
        //         }
        //         player.media.load();
        //         config.retryLoad = true;
        //     }
        // }, false);
    };

    // 添加LivePhoto风格支持
    var initLivePhotoEvent = function (player, video) {
        if (video.live_photo !== 1) {
            return;
        }
        player.muted = true;
        player.isUserHasInteract = false;
        let touchTimer = null;
        player.on('ready', function (event) {
            let $playerContainer = $(this);
            $playerContainer.toggleClass('plyr--live-photo', true);
            $playerContainer.on({
                'mouseenter': function () {
                    player.play();
                },
                'mousemove': function () {
                    if (!player.playing) {
                        player.play();
                    }
                },
                'mouseleave': function () {
                    player.stop();
                },
                'touchstart': function (e) {
                    //e.preventDefault();
                    //.stopPropagation();
                    touchTimer = setTimeout(function () {
                        player.play();
                    }, 200);//这里设置长按响应时间
                },
                'touchend': function (e) {
                    //e.preventDefault();
                    //e.stopPropagation();
                    player.stop();
                    touchTimer && clearTimeout(touchTimer);
                    touchTimer = null;
                },
            });
            $playerContainer.find('.plyr__video-wrapper').append(
                '<span class="plyr--live-photo-muted-btn muted" style="position: absolute;width: 30px;height: 30px;top: 8px;right: 8px;z-index: 10;cursor: pointer">' +
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88" width="88" height="88" preserveAspectRatio="xMidYMid meet "' +
                'style="width: 100%;height: 100%;">' +
                '<use xlink:href="#live-photo-muted-symbol"></use>\n' +
                '</svg></span>');
            $playerContainer.on('click', '.plyr--live-photo-muted-btn', function (e) {
                if (player.muted) {
                    $('#live-photo-muted-symbol').find('.muted-line').attr('opacity', '0');
                } else {
                    $('#live-photo-muted-symbol').find('.muted-line').attr('opacity', '1');
                }
                $(this).toggleClass('muted', !player.muted);
                player.muted = !player.muted;
                e.preventDefault();
                e.stopPropagation();
            });
            $playerContainer.on('click',function (e) {
                if (e.originalEvent && !player.isUserHasInteract) {
                    if (player.muted) {
                        $('#live-photo-muted-symbol').find('.muted-line').attr('opacity', '0');
                        $playerContainer.find('.plyr--live-photo-muted-btn').toggleClass('muted', !player.muted);
                    }
                    player.muted = false;
                    player.isUserHasInteract = true;
                    player.play();
                }
            });
        });
        player.on('loadedmetadata', function (event) {
            player.play();
        });
        player.on('playing', function (event) {
            $(this).toggleClass('plyr--video-loading', false);
        });
        var $video_iframe_in_top = window.frameElement ? $(window.frameElement) : null;
        if ($video_iframe_in_top) {
            $video_iframe_in_top.addClass('video-live-photo');
        }
    };

    // 视频循环按钮
    var initLoopControlHtml = function (player, initLoop) {
        var loop_button_html =
            '<button data-plyr="settings" type="button" class="plyr__control plyr__control--forward" role="menuitem" aria-haspopup="true">' +
            '<span>循环<span class="plyr__menu__value">off</span></span>' +
            '</button>';
        var loop_panel_html =
            '<div id="plyr-settings-' + player.id + '-loop" hidden>' +
            '<button type="button" class="plyr__control plyr__control--back"><span aria-hidden="true">循环</span><span class="plyr__sr-only">Go back to previous menu</span></button>' +
            '<div role="menu">' +
            '<button data-plyr="loop" type="button" role="menuitemradio" class="plyr__control plyr__tab-focus" aria-checked="true" value="off"><span>off</span></button>' +
            '<button data-plyr="loop" type="button" role="menuitemradio" class="plyr__control" aria-checked="false" value="on"><span>on</span></button>' +
            '</div></div>';
        var $loop_button = $($.parseHTML(loop_button_html));
        var $loop_panel = $($.parseHTML(loop_panel_html));
        player.elements.settings.buttons.loop = $loop_button[0];
        player.elements.settings.panels.home.firstElementChild.appendChild(player.elements.settings.buttons.loop);
        player.elements.settings.panels.loop = $loop_panel[0];
        player.elements.settings.popup.firstElementChild.appendChild(player.elements.settings.panels.loop);
        $loop_button.on('click', function () {
            player.elements.settings.panels.home.setAttribute('hidden', '');
            $loop_panel.removeAttr('hidden');
        });
        // player.config.classNames.control
        $loop_panel.on('click', 'button', function () {
            var $self = $(this);
            if ($self.attr('role') == 'menuitemradio') {
                var loopValue = $self.attr('value');
                var loopText = $self.text();
                $loop_panel.find('[role="menuitemradio"]').attr('aria-checked', 'false');
                $self.attr('aria-checked', 'true');
                $loop_button.find('.plyr__menu__value').text(loopText);
                // set value
                player.loop = loopValue == 'on' ? true : false;
            }
            $loop_panel.attr('hidden', '');
            player.elements.settings.panels.home.removeAttribute('hidden');
        });
        if (initLoop) {
            $loop_panel.find('[role="menuitemradio"][value="on"]').trigger('click');
        }
    };

    // 旋转视频
    var rotateVideo = function (player, angle) {
        angle = parseInt(angle) % 360;
        var $realVideoDom = config.isAudio ? $('#player-wrapper').find('.audio-cover') : (player.isEmbed ? $(player.elements.wrapper).find('iframe') : $(player.media));
        if (!config.isAudio && ((currentVideo.width > currentVideo.height) === (currentVideo.cover.width > currentVideo.cover.height))) {
            // $.fn.add函数返回新对象，不修改原来的
            $realVideoDom = $realVideoDom.add('.plyr__poster');
        }
        var clientHeight = document.documentElement.clientHeight;
        var clientWidth = document.documentElement.clientWidth;
        var transform_value, width_value, height_value, margin_top_value, margin_left_value, parent_height_value;
        var eyeRawWidth, eyeRawHeight; // 用户实际看到的宽高
        switch (angle) {
            case 0:
            case 180:
                eyeRawWidth = currentVideo.width;
                eyeRawHeight = currentVideo.height;
                width_value = '';
                height_value = '';
                margin_top_value = '';
                margin_left_value = '';
                parent_height_value = '';
                break;
            case 90:
            case 270:
                eyeRawWidth = currentVideo.height;
                eyeRawHeight = currentVideo.width;
                var newHeight = clientHeight;
                var newWidth = eyeRawWidth / eyeRawHeight * newHeight;
                var newMarginTop;
                var newMarginLeft;
                if (newWidth > clientWidth) {
                    newWidth = clientWidth;
                    newHeight = eyeRawHeight / eyeRawWidth * newWidth;
                    newMarginTop = ((clientHeight - newHeight) / 2) - ((newWidth - newHeight) / 2);
                    newMarginLeft = 0 - ((newHeight - clientWidth) / 2);
                } else {
                    newMarginTop = 0 - ((newWidth - newHeight) / 2);
                    newMarginLeft = (clientWidth - newHeight) / 2;
                }
                width_value = newHeight + 'px';
                height_value = newWidth + 'px';
                margin_top_value = newMarginTop + 'px';
                margin_left_value = newMarginLeft + 'px';
                parent_height_value = clientHeight + 'px';
                break;
        }
        transform_value = (angle == '0' ? '' : ('rotate(' + angle + 'deg)'));
        var before_css_transform_value = $realVideoDom[0].style.transform;
        before_css_transform_value = before_css_transform_value && before_css_transform_value.replace(/\s*rotate\([^)]*\)\s*/g, '');
        if (before_css_transform_value) {
            transform_value = (transform_value ? (transform_value + ' ') : '') + before_css_transform_value;
        }
        $realVideoDom.css({
            "transform": transform_value,
            "width": width_value,
            "height": height_value,
            "margin-top": margin_top_value,
            "margin-left": margin_left_value
        });
        $realVideoDom.parent().css('height', parent_height_value);
        if (angle != config.status.videoRotate) {
            ratioChange(eyeRawWidth, eyeRawHeight, angle);
        }
    };

    // 旋转视频按钮
    var initRotateControlHtml = function (player, initAngle) {
        var rotate_button_html =
            '<button data-plyr="settings" type="button" class="plyr__control plyr__control--forward" role="menuitem" aria-haspopup="true">' +
            '<span>旋转<span class="plyr__menu__value">off</span></span>' +
            '</button>';
        var rotate_panel_html =
            '<div id="plyr-settings-' + player.id + '-rotate" hidden>' +
            '<button type="button" class="plyr__control plyr__control--back"><span aria-hidden="true">旋转</span><span class="plyr__sr-only">Go back to previous menu</span></button>' +
            '<div role="menu">' +
            '<button data-plyr="rotate" type="button" role="menuitemradio" class="plyr__control plyr__tab-focus" aria-checked="true" value="0"><span>off</span></button>' +
            '<button data-plyr="rotate" type="button" role="menuitemradio" class="plyr__control" aria-checked="false" value="90"><span>90°</span></button>' +
            '<button data-plyr="rotate" type="button" role="menuitemradio" class="plyr__control" aria-checked="false" value="180"><span>180°</span></button>' +
            '<button data-plyr="rotate" type="button" role="menuitemradio" class="plyr__control" aria-checked="false" value="270"><span>270°</span></button>' +
            '</div></div>';
        var $rotate_button = $($.parseHTML(rotate_button_html));
        var $rotate_panel = $($.parseHTML(rotate_panel_html));
        player.elements.settings.buttons.rotate = $rotate_button[0];
        player.elements.settings.panels.home.firstElementChild.appendChild(player.elements.settings.buttons.rotate);
        player.elements.settings.panels.rotate = $rotate_panel[0];
        player.elements.settings.popup.firstElementChild.appendChild(player.elements.settings.panels.rotate);
        $rotate_button.on('click', function () {
            player.elements.settings.panels.home.setAttribute('hidden', '');
            $rotate_panel.removeAttr('hidden');
        });
        // player.config.classNames.control
        $rotate_panel.on('click', 'button', function () {
            var $self = $(this);
            if ($self.attr('role') == 'menuitemradio') {
                var angle = $self.attr('value');
                var angleText = $self.text();
                $rotate_panel.find('[role="menuitemradio"]').attr('aria-checked', 'false');
                $self.attr('aria-checked', 'true');
                $rotate_button.find('.plyr__menu__value').text(angleText);
                rotateVideo(player, angle);
            }
            $rotate_panel.attr('hidden', '');
            player.elements.settings.panels.home.removeAttribute('hidden');
        });
        $(window).resize(function () {
            if (config.status.videoRotate == 90 || config.status.videoRotate == 270) {
                rotateVideo(player, config.status.videoRotate);
            }
        });
        if (initAngle && initAngle != 0) {
            $rotate_panel.find('[role="menuitemradio"][value="' + initAngle + '"]').trigger('click');
        }
    };

    // 翻转视频
    var flipVideo = function (player, flip_directions) {
        var $realVideoDom = config.isAudio ? $('#player-wrapper').find('.audio-cover') : (player.isEmbed ? $(player.elements.wrapper).find('iframe') : $(player.media));
        if (!config.isAudio && ((currentVideo.width > currentVideo.height) === (currentVideo.cover.width > currentVideo.cover.height))) {
            // $.fn.add函数返回新对象，不修改原来的
            $realVideoDom = $realVideoDom.add('.plyr__poster');
        }
        var css_transform_value = $realVideoDom[0].style.transform ? $realVideoDom[0].style.transform.replace(/\s*rotate[XY]\([^)]*\)\s*/g, '') : '';
        if (flip_directions) {
            for (let i in flip_directions) {
                if (flip_directions[i] == 'h') {
                    css_transform_value += ' rotateY(180deg)'; // scaleX(-1)
                } else if (flip_directions[i] == 'v') {
                    css_transform_value += ' rotateX(180deg)'; // scaleY(-1)
                }
            }
        }
        $realVideoDom.css('transform', css_transform_value);
        config.status.videoFlip = flip_directions;
    };

    // 翻转视频按钮
    var initFlipControlHtml = function (player) {
        var flip_button_html =
            '<button data-plyr="settings" type="button" class="plyr__control plyr__control--forward" role="menuitem" aria-haspopup="true">' +
            '<span>镜像<span class="plyr__menu__value">off</span></span>' +
            '</button>';
        var flip_panel_html =
            '<div id="plyr-settings-' + player.id + '-flip" hidden>' +
            '<button type="button" class="plyr__control plyr__control--back"><span aria-hidden="true">镜像</span><span class="plyr__sr-only">Go back to previous menu</span></button>' +
            '<div role="menu">' +
            '<button data-plyr="flip" type="button" role="menuitemradio" class="plyr__control plyr__tab-focus default-value" aria-checked="true" value="0"><span>off</span></button>' +
            '<button data-plyr="flip" type="button" role="menuitemradio" class="plyr__control available-value" aria-checked="false" value="h"><span>水平</span></button>' +
            '<button data-plyr="flip" type="button" role="menuitemradio" class="plyr__control available-value" aria-checked="false" value="v"><span>垂直</span></button>' +
            '</div></div>';
        var $flip_button = $($.parseHTML(flip_button_html));
        var $flip_panel = $($.parseHTML(flip_panel_html));
        player.elements.settings.buttons.flip = $flip_button[0];
        player.elements.settings.panels.home.firstElementChild.appendChild(player.elements.settings.buttons.flip);
        player.elements.settings.panels.flip = $flip_panel[0];
        player.elements.settings.popup.firstElementChild.appendChild(player.elements.settings.panels.flip);
        $flip_button.on('click', function () {
            player.elements.settings.panels.home.setAttribute('hidden', '');
            $flip_panel.removeAttr('hidden');
        });
        // player.config.classNames.control
        $flip_panel.on('click', 'button', function () {
            var $self = $(this);
            if ($self.attr('role') == 'menuitemradio') {
                var filp_direction = $self.attr('value');
                var filp_text = $self.text();
                if (filp_direction == '0') {
                    $flip_panel.find('[role="menuitemradio"]').attr('aria-checked', 'false');
                    $self.attr('aria-checked', 'true');
                } else {
                    if ($self.attr('aria-checked') == 'true') {
                        $self.attr('aria-checked', 'false');
                        var $selectAvailable = $flip_panel.find('[role="menuitemradio"][aria-checked="true"].available-value');
                        if ($selectAvailable.length == 0) {
                            filp_text = $flip_panel.find('[role="menuitemradio"][value="0"]').attr('aria-checked', 'true').text();
                        } else {
                            filp_text = $selectAvailable.eq(0).text();
                        }
                    } else {
                        $flip_panel.find('[role="menuitemradio"][value="0"]').attr('aria-checked', 'false');
                        $self.attr('aria-checked', 'true');
                    }
                }
                $flip_button.find('.plyr__menu__value').text(filp_text);
                var filp_directions = [];
                $flip_panel.find('[role="menuitemradio"][aria-checked="true"]').each(function (i, option) {
                    filp_directions.push(option.getAttribute('value'));
                });
                flipVideo(player, filp_directions, config.status.videoRotate);
            }
            $flip_panel.attr('hidden', '');
            player.elements.settings.panels.home.removeAttribute('hidden');
        });
    };

    // 站内打开视频详情页按钮
    var initOpenInSiteControlHtml = function (player, video) {
        var $pip_button = $(player.elements.buttons.pip);
        // ($('#sprite-plyr').length == 0 ? player.config.iconUrl : '');
        var pip_icon_url_prefix = player.config.iconUrl.indexOf(globals.path_params.basePath) == 0 ? player.config.iconUrl : '';
        $pip_button.find('svg > use').attr('href', pip_icon_url_prefix + '#plyr-logo-youtube');
        var open_in_site_html = '<button type="button" class="plyr__control" data-plyr="open_in_site">' +
            '<svg role="presentation" focusable="false"><use xlink:href="' + pip_icon_url_prefix + '#plyr-pip' + '"></use></svg>' +
            '<span class="plyr__tooltip">站内打开视频详情页</span></button>';
        var $open_in_site_button = $($.parseHTML(open_in_site_html));
        player.elements.buttons.open_in_site = $open_in_site_button[0];
        player.elements.settings.menu.after(player.elements.buttons.open_in_site);
        $(player.elements.controls).on('click', '[data-plyr="open_in_site"]', function () {
            window.open(('video/detail/' + video.video_id).toURL());
        });
    };

    // 切换网页全屏
    var switchWebFullscreen = function (player, video, isSwitchToOn) {
        if (config.isEmbedWindow) {
            let $video_iframe_in_top = window.frameElement ? $(window.frameElement) : null, $body_iframe_in_top;
            if (!$video_iframe_in_top) {
                return;
            }
            $body_iframe_in_top = $(window.parent.document.body);
            if (isSwitchToOn) {
                player.web_fullscreen = true;
                player.backIframeCss = $video_iframe_in_top.attr('style');
                player.backTopBodyCss = $body_iframe_in_top[0].style.overflow || '';
                $body_iframe_in_top.css('overflow', 'hidden');
                $video_iframe_in_top.toggleClass("player-web-fullscreen", true);
                $video_iframe_in_top.css({
                    "position": "fixed",
                    "top": "0",
                    "left": "0",
                    "width": "100%",
                    "height": "100%",
                    "padding": "0px",
                    "margin": "0px",
                    "z-index": "10000"
                });
                if (player.fullscreen.enabled && player.fullscreen.active) {
                    player.fullscreen.exit();
                }
            } else {
                $body_iframe_in_top.css('overflow', player.backTopBodyCss);
                $video_iframe_in_top.css({
                    "position": "",
                    "top": "",
                    "left": "",
                    "width": "",
                    "height": "",
                    "padding": "",
                    "margin": "",
                    "z-index": "",
                });
                setTimeout(function () {
                    $video_iframe_in_top.toggleClass("player-web-fullscreen", false);
                }, 250);
                player.backIframeCss && $video_iframe_in_top.attr('style', player.backIframeCss);
                player.web_fullscreen = false;
            }
        } else if (!isSwitchToOn) {
            document.location.href = ('video/detail/' + video.video_id).toURL();
        }
    };

    // 切换网页全屏按钮
    var initWebFullscreenControlHtml = function (player, video) {
        var web_fullscreen_html = '<button type="button" class="plyr__control" data-plyr="web_fullscreen">' +
            '<svg class="icon--not-pressed player-web-fullscreen-on" role="presentation" focusable="false" viewBox="2 2 17 17">' +
            '<path d="M18 4H4a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM8 15.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-' +
            '3a.5.5 0 01.5-.5h1a.5.5 0 01.5.5V14h1.5a.5.5 0 01.5.5v1zm0-8a.5.5 0 01-.5.5H6v1.5a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-3a.5.5 ' +
            '0 01.5-.5h3a.5.5 0 01.5.5v1zm10 8a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5H16v-1.5a.5.5 0 01.5-.5h1a.5.5 0 01.' +
            '5.5v3zm0-6a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5V8h-1.5a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v3z"></path>' +
            '</svg>' +
            '<svg class="icon--pressed player-web-fullscreen-off" role="presentation" focusable="false" viewBox="2 2 17 17">' +
            '<path d="M18 4H4a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM8 15.5a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5V14H4' +
            '.5a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v3zm0-6a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5H6V6.5a.5.5 ' +
            '0 01.5-.5h1a.5.5 0 01.5.5v3zm10 4a.5.5 0 01-.5.5H16v1.5a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1z' +
            'm0-4a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5h1a.5.5 0 01.5.5V8h1.5a.5.5 0 01.5.5v1z"></path>' +
            '</svg>' +
            '<span class="label--not-pressed plyr__tooltip player-web-fullscreen-on-tooltip">打开网页全屏</span>' +
            '<span class="label--pressed plyr__tooltip player-web-fullscreen-off-tooltip">退出网页全屏</span>' +
            '</button>';
        var $web_fullscreen_button = $($.parseHTML(web_fullscreen_html));
        player.elements.buttons.web_fullscreen = $web_fullscreen_button[0];
        if (!config.isAudio) {
            $(player.elements.buttons.fullscreen).before(player.elements.buttons.web_fullscreen);
        } else {
            $(player.elements.controls).append(player.elements.buttons.web_fullscreen);
        }
        $(player.elements.controls).on('click', '[data-plyr="web_fullscreen"]', function () {
            var isSwitchToOn = $web_fullscreen_button.find('.player-web-fullscreen-on').attr('class').indexOf('icon--not-pressed') != -1;
            switchWebFullscreen(player, video, isSwitchToOn);
            if (isSwitchToOn) {
                $web_fullscreen_button.find('.player-web-fullscreen-on').attr('class', 'icon--pressed player-web-fullscreen-on');
                $web_fullscreen_button.find('.player-web-fullscreen-off').attr('class', 'icon--not-pressed player-web-fullscreen-off');
                $web_fullscreen_button.find('.player-web-fullscreen-on-tooltip').removeClass('label--not-pressed').addClass('label--pressed');
                $web_fullscreen_button.find('.player-web-fullscreen-off-tooltip').removeClass('label--pressed').addClass('label--not-pressed');
            } else {
                $web_fullscreen_button.find('.player-web-fullscreen-on').attr('class', 'icon--not-pressed player-web-fullscreen-on');
                $web_fullscreen_button.find('.player-web-fullscreen-off').attr('class', 'icon--pressed player-web-fullscreen-off');
                $web_fullscreen_button.find('.player-web-fullscreen-on-tooltip').removeClass('label--pressed').addClass('label--not-pressed');
                $web_fullscreen_button.find('.player-web-fullscreen-off-tooltip').removeClass('label--not-pressed').addClass('label--pressed');
            }
        });
        if (!config.isEmbedWindow) {
            $web_fullscreen_button.trigger('click');
        }
    };

    // Localisation
    var getPlayerI18n = function () {
        let i18n, navLang = navigator.language || navigator.userLanguage, lang = navLang.substr(0, 2);
        if (lang == 'zh') {
            i18n = {
                restart: '重新播放',
                rewind: '后退 {seektime}s',
                play: '播放',
                pause: '暂停',
                fastForward: '前进 {seektime}s',
                seek: '跳到',
                seekLabel: '{currentTime} of {duration}',
                played: '播放完毕',
                buffered: '缓存完毕',
                currentTime: '当前时间点',
                duration: '总时长',
                volume: '声音',
                mute: '静音',
                unmute: '取消静音',
                enableCaptions: '开启字幕',
                disableCaptions: '关闭字幕',
                download: '下载',
                enterFullscreen: '进入全屏',
                exitFullscreen: '退出全屏',
                frameTitle: 'Player for {title}',
                captions: '字幕',
                settings: '设置',
                pip: 'PIP',
                menuBack: '返回上级菜单',
                speed: '速度',
                normal: '正常',
                quality: '质量',
                loop: '循环',
                start: '起始点',
                end: '终止点',
                all: '全部',
                reset: '重置',
                disabled: '关闭',
                enabled: '开启',
                advertisement: '广告',
                qualityBadge: {
                    4320: '8K',
                    2880: '5K',
                    2160: '4K',
                    1440: 'HD',
                    1080: 'HD',
                    720: 'HD',
                    576: 'SD',
                    480: 'SD',
                },
            };
        } else {
            i18n = Plyr.defaults.i18n;
        }
        return i18n;
    };

    var getQualityValue = function (video) {
        const maxPixel = Math.max(video.width, video.height),
            minPixel = Math.min(video.width, video.height),
            options = [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240];
        let qualityValue = options[options.length - 1];
        $.each(options, function (k, v) {
            if (minPixel >= v || maxPixel >= (v / 9 * 16)) {
                qualityValue = v;
                return false;
            }
        });
        return qualityValue;
    };

    var generateVideoSignatureUrl = function (video_id, allowAge, check) {
        let ul, vl, t, et, at, signature, expires, age;
        ul = parseInt(common_utils.cookieUtil.get('identifier') || common_utils.cookieUtil.get('guest_identifier'));
        vl = common_utils.convertRadix62to10(video_id);
        t = new Date().getTime();
        et = t + allowAge;
        signature = common_utils.convertRadix10to62(t - ul);
        expires = common_utils.convertRadix10to62(et - vl);
        at = Math.abs(vl - ul) + allowAge;
        if ((check && at % 2 !== 0) || (!check && at % 2 !== 1)) {
            at++;
        }
        age = common_utils.convertRadix10to62(at);
        return `video.api?method=downloadVideo&video_id=${video_id}&signature=${signature}&expires=${expires}&age=${age}`.toURL();
    };

    var localVideoConfig = globals.getLocalConfig('album', {
        'video_page': {
            'embed': {
                'audio_use_fake_video': true
            }
        }
    }).video_page;
    request.loadVideo($('#video_info_form').find('input[name="video_id"]').val(), function (video) {
        currentVideo = video;
        var $playerWrapper = $('#player-wrapper');
        var initParams = common_utils.parseURL(document.location.href).params;
        var isEmbedWindow = config.isEmbedWindow;
        // 获取是否关闭embed
        var disable_embed = video.setting.disable_embed;
        var disable_embed_redirect = 'detail';
        if (!disable_embed && initParams.hasOwnProperty('disable_embed')) {
            disable_embed = initParams['disable_embed'] == 'true';
            disable_embed_redirect = initParams['disable_embed_redirect'] == 'embed' ? 'embed' : 'detail';
            if (video.live_photo === 1) {
                disable_embed = false;
            }
        }
        if (disable_embed && isEmbedWindow && window.top.document
            && common_utils.parseURL(document.location.href).host === window.top.document.location.hostname
            && /\/video\/detail\/[^?]+/.test(window.top.document.location.href)) {
            disable_embed = false;
        }
        if (disable_embed && isEmbedWindow) { // 关闭embed
            let redirect_url = common_utils.removeParamForURL('save_access_record', (common_utils.removeParamForURL('disable_embed_redirect', common_utils.removeParamForURL('disable_embed'))))
                .replace('/video/embed/', '/video/' + disable_embed_redirect + '/');
            $('<a>', {
                'href': redirect_url,
                'target': '_blank',
                'title': video.name || ('video_' + video.video_id),
                'style': 'position: absolute;height: 100%;width: 100%;left: 0;top: 0;opacity: 0; background-color: transparent; z-index: 10000000;',
            }).appendTo('body');
            config.disable_embed = true;
        }
        let isYoutube = false, youtubeVideoUrl, youtubeVideoId; // 采用plyr播放youtube
        if (video.source_type == 2 && /(https?:\/\/(?:www\.)?youtube\.com\/embed\/([A-Za-z0-9]+)(\?[^"]+)?)/.test(video.code)) {
            youtubeVideoUrl = RegExp.$1;
            youtubeVideoId = RegExp.$2;
            if (!(disable_embed && isEmbedWindow)) {
                $('<div>', {
                    'id': 'site-player',
                    'data-plyr-provider': 'youtube',
                    'data-plyr-embed-id': youtubeVideoUrl
                }).appendTo($playerWrapper.empty());
            }
            isYoutube = true;
        }
        config.isYoutube = isYoutube;
        config.isPageActiveAtBegin = !document.hidden;
        if (video.source_type != 2 || isYoutube) {   // 类型为链接
            config.isEmbed = false;
            let player = null;
            let isAudio;
            if (localVideoConfig.embed.audio_use_fake_video) {  // 是否用video标签播放audio
                isAudio = false;
            } else {
                isAudio = (video.video_type == 'video/mp3');
            }
            config.isAudio = isAudio;
            // 字幕
            let tracksHtml = '', defaultTrackLang = "auto", videoHasSubtitle = (video.subtitles && video.subtitles.length > 0);
            if (videoHasSubtitle) {
                video.subtitles.forEach(function (subtitle, i) {
                    tracksHtml += '<track kind="subtitles" label="' + subtitle.name + '" src="' + subtitle.path + '" srclang="' + subtitle.lang + '"/>';
                    if (i == 0) {
                        defaultTrackLang = subtitle.lang;
                    }
                });
            }
            // 构建Plyr-player
            if (!isAudio) {  // 视频
                let $video_player = $('#site-player');
                // calcVideoPix($video_player);  // 发现并不需要计算，因为我在外面计算好了，100vh, 100vw即可
                $video_player.attr('poster', video.cover.path);
                if (tracksHtml) {
                    $video_player.append(tracksHtml);
                }
                let video_controls = ["play-large", "play", "progress", "current-time", "duration", "volume", "captions", "settings", "pip", "airplay", "fullscreen"];
                if (!video.setting.disable_download || $('body').attr('data-is-special-man') == 'true') {
                    video_controls.splice(-1, 0, 'download');
                }
                let qualityValue = getQualityValue(video);
                player = currentPlayer = new Plyr($video_player, {
                    title: video.name,
                    poster: video.cover.path,
                    iconUrl: config.path_params.staticPath + "lib/plyr/plyr.svg",
                    blankVideo: config.path_params.staticPath + "lib/plyr/blank.mp4",
                    disableContextMenu: true,
                    controls: video_controls,
                    // settings: ['captions', 'quality', 'speed', 'loop'],
                    tooltips: {"controls": true, "seek": true},
                    ratio: isYoutube ? (video.width + ':' + video.height) : null,
                    invertTime: false,
                    resetOnEnd: true,
                    quality: {'default': qualityValue, 'selected': qualityValue, forced: true, options: [qualityValue, -1]},
                    captions: {"active": videoHasSubtitle, "language": defaultTrackLang, "update": false},
                    storage: {"enabled": video.live_photo !== 1, "key": 'plyr' },
                    i18n: getPlayerI18n(),
                    urls: {
                        "download": isYoutube ? undefined : generateVideoSignatureUrl(video.video_id, 10800000, true)
                    },
                    fullscreen: {"iosNative": true} // iosNative: whether to use native iOS fullscreen when entering fullscreen (no custom controls).
                });
                if (isYoutube) {
                    $(player.elements.container).addClass('plyr__video-embed-disable');
                }
                // $(window).resize(function () {
                //     calcVideoPix($('#site-player'));
                // });
            } else {    // 音频
                $playerWrapper.html('<div class="audio-wrapper">' +
                    '<div class="audio-cover" style="background-image: url(' + (video.cover.path) + ');"></div>' +
                    '<button type="button" class="audio-play-btn">' +
                    '<svg width="100%" height="100%"><path d="M15.562 8.1L3.87.225c-.818-.562-1.87 0-1.87.9v15.75c0 .9 1.052 1.462 1.87.9L15.563 9.9c.584-.45.584-1.35 0-1.8z"></path></svg>' +
                    '<span>Play</span></button>' +
                    '<audio class="audio-player" id="site-player">' + tracksHtml + '</audio></div>');
                let audio_controls = ["play-large", "play", "progress", "current-time", "duration", "volume", "captions", "settings", "pip", "airplay"];
                if (!video.setting.disable_download || $('body').attr('data-is-special-man') == 'true') {
                    audio_controls.push('download');
                }
                player = currentPlayer = new Plyr($('#site-player'), {
                    title: video.name,
                    iconUrl: config.path_params.staticPath + "lib/plyr/plyr.svg",
                    blankVideo: config.path_params.staticPath + "lib/plyr/blank.mp4",
                    disableContextMenu: true,
                    controls: audio_controls,
                    // settings: ['captions', 'quality', 'speed', 'loop'],
                    tooltips: {"controls": true, "seek": true},
                    invertTime: false,
                    captions: {"active": videoHasSubtitle, "language": defaultTrackLang, "update": false},
                    i18n: getPlayerI18n(),
                    urls: {
                        "download": generateVideoSignatureUrl(video.video_id, 10800000, false)
                    }
                });
            }
            // 根据设置和url初始化一些参数
            player.enable_loop = video.setting.enable_loop;
            player.rotate = video.setting.rotate;
            player.autoplay = initParams['autoplay'] == 'true';
            if (!isNaN(initParams['start'])) {
                player.start_time = parseFloat(initParams['start']);
            }
            if (initParams.hasOwnProperty('loop')) {
                player.enable_loop = initParams['loop'] == 'true';
            }
            if (!isNaN(initParams['rotate'])) {
                player.rotate = (parseInt(initParams['rotate']) + 360) % 360;
            }
            initIframeSettingInParentPage(player, video);
            bindVideoControlEvent($playerWrapper, player, video);
        } else {    // 类型为嵌入
            config.isEmbed = true;
            $playerWrapper.html(video.code);
            let $iframeNode = $playerWrapper.children().eq(0);
            if ($iframeNode && $iframeNode.length > 0) {
                $iframeNode.attr('id', 'site-player');
                $iframeNode.attr('allowfullscreen', 'true')[0].allowFullscreen = true;
                let videoHasClickedFunc = function (contentDocument) {
                    if (contentDocument) {
                        $(contentDocument.body).on('click', function () {
                            videoHasPlayed();
                        });
                    }
                };
                if ($iframeNode.prop('contentDocument') && $iframeNode.prop('contentDocument').readyState == 'complete') {
                    videoHasClickedFunc($iframeNode.prop('contentDocument'));
                } else {
                    $iframeNode.load(function () { // 等子iframe加载完毕
                        videoHasClickedFunc(this.contentDocument);
                    });
                }
            }
            videoDomReady();
            // 去黑边
            // calcVideoPix($playerWrapper.children(0));
            // $(window).resize(function () {
            //     calcVideoPix($('#player-wrapper').children(0));
            // });
        }
        // document.title = video.name + document.title;
        // $('head meta[name="description"]').attr('content', video.description);
        // $('head meta[name="keywords"]').attr('content', video.tags + $('head meta[name="keywords"]').attr('content'));
        videoPageReady();
        onVideoHasPlayed(function () {
            request.saveVideoHasPlayed(currentVideo.video_id);
        });
    });

    // 视频页面加载完毕
    window.onVideoPageReady = function (call) {
        config.callback.video_page_ready_calls.push(call);
        if (config.status.videoPageReady) {
            call.call(currentVideo, currentPlayer);
        }
        return window;
    };

    // 视频控件、大小加载完毕
    window.onVideoDomReady = function (call) {
        config.callback.video_dom_ready_calls.push(call);
        if (config.status.videoDomReady) {
            call.call(currentVideo, currentPlayer);
        }
        return window;
    };

    // 视频被播放过
    window.onVideoHasPlayed = function (call) {
        config.callback.video_has_played_calls.push(call);
        if (config.status.videoHasPlayed) {
            call.call(currentVideo, currentPlayer);
        }
        return window;
    };

    // 播放状态状态改变 - playing / pause / ended
    window.onVideoPlayStatusChange = function (call) {
        config.callback.video_play_status_change_calls.push(call);
        if (config.status.videoPlayStatus != 'pause') {
            call.call(currentVideo, config.status.videoPlayStatus);
        }
        return window;
    };

    // 活跃状态改变
    window.onActivityChange = function (call) {
        config.callback.activity_change_calls.push(call);
        if (config.status.userActivity == false) {
            call.call(currentVideo, config.status.userActivity, currentPlayer);
        }
        return window;
    };

    // 视频显示比例改变
    window.onRatioChange = function (call) {
        config.callback.ratio_change_calls.push(call);
        if (config.status.videoRotate && config.status.videoRotate != 0 && currentPlayer) {
            var eyeRawWidth, eyeRawHeight;
            switch (config.status.videoRotate) {
                case 0:
                case 180:
                    eyeRawWidth = currentVideo.width;
                    eyeRawHeight = currentVideo.height;
                    break;
                case 90:
                case 270:
                    eyeRawWidth = currentVideo.height;
                    eyeRawHeight = currentVideo.width;
            }
            call.call(currentVideo, eyeRawWidth, eyeRawHeight, config.status.videoRotate, currentPlayer);
        }
        return window;
    };

});