/**
 * 用户浏览记录页面
 * @author Jeffrey.Deng
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'globals', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, globals, common_utils, login_handle);
    }
})(function ($, bootstrap, domReady, toastr, globals, common_utils, login_handle) {

    const request = globals.extend(globals.request, {
        user_history: {
            "loadUserActionRecords": function (uid, success) {
                let postData = {"user.uid": uid};
                return globals.request.get(globals.api.getUserActionRecords, postData, success, success && '加载访问历史列表失败');
            }
        }
    }).user_history;

    domReady(function () {
        var hostUser = login_handle.getCurrentUserId();
        request.loadUserActionRecords(hostUser, function (data) {
            let article_action_record_count = data.article_action_record_count,
                photo_action_record_count = data.photo_action_record_count,
                video_action_record_count = data.video_action_record_count,
                real_article_action_record_count = 0,
                real_photo_action_record_count = 0,
                real_video_action_record_count = 0,
                article_liked_count = 0,
                photo_liked_count = 0,
                video_liked_count = 0,
                real_article_liked_count = 0,
                real_photo_liked_count = 0,
                real_video_liked_count = 0;
            data.articleActionRecords.forEach(function (ar) {
                let article = ar.creation;
                if (article && article.aid && article.aid != '0') {
                    real_article_action_record_count++;
                    if (ar.liked) {
                        real_article_liked_count++;
                    }
                }
                if (ar.liked) {
                    article_liked_count++;
                }
            });
            data.photoActionRecords.forEach(function (ar) {
                let photo = ar.creation;
                if (photo && photo.photo_id && photo.photo_id != '0') {
                    real_photo_action_record_count++;
                    if (ar.liked) {
                        real_photo_liked_count++;
                    }
                }
                if (ar.liked) {
                    photo_liked_count++
                }
            });
            data.videoActionRecords.forEach(function (ar) {
                let video = ar.creation;
                if (video && video.video_id && video.video_id != '0') {
                    real_video_action_record_count++;
                    if (ar.liked) {
                        real_video_liked_count++;
                    }
                }
                if (ar.liked) {
                    video_liked_count++
                }
            });
            let $user_history_panel = $('#user_history_panel');
            $user_history_panel.find('.user_history_articles a')
                .text('文章：' + real_article_action_record_count).attr('title', '总记录：' + article_action_record_count + '\n可能其中某些你没有权限访问或已被作者删除');
            $user_history_panel.find('.user_history_photos a')
                .text('照片：' + real_photo_action_record_count).attr('title', '总记录：' + photo_action_record_count + '\n可能其中某些你没有权限访问或已被作者删除');
            $user_history_panel.find('.user_history_videos a')
                .text('视频：' + real_video_action_record_count).attr('title', '总记录：' + video_action_record_count + '\n可能其中某些你没有权限访问或已被作者删除');

            let user_likes_panel = $('#user_likes_panel');
            user_likes_panel.find('.user_likes_articles a')
                .text('文章：' + real_article_liked_count).attr('title', '总记录：' + article_liked_count + '\n可能其中某些你没有权限访问或已被作者删除');
            user_likes_panel.find('.user_likes_photos a')
                .text('照片：' + real_photo_liked_count).attr('title', '总记录：' + photo_liked_count + '\n可能其中某些你没有权限访问或已被作者删除');
            user_likes_panel.find('.user_likes_videos a')
                .text('视频：' + real_video_liked_count).attr('title', '总记录：' + video_liked_count + '\n可能其中某些你没有权限访问或已被作者删除');
        });
    });
});
