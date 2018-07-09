/*! jQuery Validation Plugin - v1.13.1 - 10/14/2014
 * http://jqueryvalidation.org/
 * Copyright (c) 2014 Jörn Zaefferer; Licensed MIT */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'jquery_validate'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, $.validate);
    }
})(function ($) {
    var icon = "<i class='fa fa-times-circle'></i>  ";
    $.extend($.validator.messages, {
        required: icon + "必填",
        remote: icon + "请修正此栏位",
        email: icon + "请输入有效的电子邮件",
        url: icon + "请输入有效的网址",
        date: icon + "请输入有效的日期",
        dateISO: icon + "请输入有效的日期 (YYYY-MM-DD)",
        number: icon + "请输入正确的数字",
        digits: icon + "只能输入数字",
        creditcard: icon + "请输入有效的信用卡号码",
        equalTo: icon + "你的输入不相同",
        extension: icon + "请输入有效的后缀",
        maxlength: $.validator.format(icon + "最多 {0} 个字"),
        minlength: $.validator.format(icon + "最少 {0} 个字"),
        rangelength: $.validator.format(icon + "请输入长度为 {0} 至 {1} 之间的字串"),
        range: $.validator.format(icon + "请输入 {0} 至 {1} 之间的数值"),
        max: $.validator.format(icon + "请输入不大于 {0} 的数值"),
        min: $.validator.format(icon + "请输入不小于 {0} 的数值")
    })
});
