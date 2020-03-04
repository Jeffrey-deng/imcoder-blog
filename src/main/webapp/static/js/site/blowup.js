/**
 * blowup.js
 * Customizable magnification lens.
 * @Jeffrey.Deng
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals
        factory(window.jQuery);
    }
})(function ($) {

    $.blowup = function (attributes) {

        // Default attributes
        var defaults = {
            selector: 'img',
            round: true,
            width: 200,
            height: 200,
            background: "#FFF",
            shadow: "0 8px 17px 0 rgba(0, 0, 0, 0.2)",
            border: "6px solid #FFF",
            cursor: true,
            zIndex: 999999,
            scale: 1,
            bindEventByJquery: true
        };

        // Update defaults with custom attributes
        var options = $.extend(defaults, attributes);

        var $elements = $(options.selector);

        // If the target element is not an image
        // if (!$elements.is('img')) {
        //     console.log('%c Blowup.js Error: ' + "%cTarget element is not an image.",
        //         "background: #FCEBB6; color: #F07818; font-size: 17px; font-weight: bold;",
        //         "background: #FCEBB6; color: #F07818; font-size: 17px;");
        //     return;
        // }

        // Modify target image
        // $elements.css('cursor', $options.cursor ? 'crosshair' : 'none');

        // Create magnification lens element
        var lens = document.createElement('div');
        lens.id = "blowupCanvas";

        // Attack the element to the body
        document.getElementById('blowupCanvas') || $('body').append(lens);

        // Updates styles
        var $blowupCanvas = $('#blowupCanvas');

        $blowupCanvas.css({
            'position': "absolute",
            "visibility": "hidden",
            'pointer-events': "none",
            'z-index': options.zIndex,
            'width': options.width,
            'height': options.height,
            'border': options.border,
            'background': options.background,
            'border-radius': options.round ? '50%' : 'none',
            'box-shadow': options.shadow,
            'background-repeat': 'no-repeat',
        });


        var $IMAGE_URL = '', NATIVE_IMG = new Image(), $el = null, el_pageX, el_pageY;

        // Show magnification lens
        var mouseenter_handler = function (e) {
            $blowupCanvas.css('visibility', 'visible');
            NATIVE_IMG.src = $IMAGE_URL = e.target.src;
            $el = $(e.target);
        };

        // Mouse motion on image
        var mousemove_handler = function (e) {
            e = e ? e : window.event;
            var obj = e.srcElement ? e.srcElement : e.target;
            if (NATIVE_IMG.src != obj.src) {
                NATIVE_IMG.src = $IMAGE_URL = obj.src;
            }
            $el = $(obj);
            el_pageX = e.pageX;
            el_pageY = e.pageY;
            drawImageToCanvas();
        };

        // Hide magnification lens
        var mouseleave_handler = function (e) {
            $blowupCanvas.css('visibility', 'hidden');
            // NATIVE_IMG = null;
            $el = null;
            el_pageX = null;
            el_pageY = null;
        };

        var drawImageToCanvas = function () {
            // Lens position coordinates
            var lensX = el_pageX - options.width / 2;
            var lensY = el_pageY - options.height / 2;

            // Relative coordinates of image
            var relX = el_pageX - $el.offset().left;
            var relY = el_pageY - $el.offset().top;

            // Zoomed image coordinates
            var zoomX = -Math.floor(relX / $el.width() * (NATIVE_IMG.width * options.scale) - options.width / 2);
            var zoomY = -Math.floor(relY / $el.height() * (NATIVE_IMG.height * options.scale) - options.height / 2);

            var backPos = zoomX + 'px ' + zoomY + 'px';
            var backgroundSize = NATIVE_IMG.width * options.scale + 'px ' + NATIVE_IMG.height * options.scale + 'px';

            // Apply styles to lens
            $blowupCanvas.css({
                left: lensX,
                top: lensY,
                'background-image': 'url(\'' + $IMAGE_URL + '\')',
                'background-size': backgroundSize,
                'background-position': backPos,
                'visibility': 'visible'
            });
        };

        var removeHandler = (function () {
            if (window.removeEventListener) {   // 标准浏览器
                return function (elem, type, handler) {
                    elem.removeEventListener(type, handler, false);

                }
            } else if (window.detachEvent) {    // IE浏览器
                return function (elem, type, handler) {
                    elem.detachEvent('on' + type, handler);
                }
            }
        })();

        var addHandler = (function () {
            if (window.addEventListener) {  // 标准浏览器
                return function (elem, type, handler) {
                    elem.addEventListener(type, handler, false);

                }
            } else if (window.detachEvent) {    // IE浏览器
                return function (elem, type, handler) {
                    elem.attachEvent('on' + type, handler);
                }
            }
        })();

        if (options.bindEventByJquery) {
            $elements.on({
                'mouseenter.img.blowup': mouseenter_handler,
                'mousemove.img.blowup': mousemove_handler,
                'mouseleave.img.blowup': mouseleave_handler,
            });
        } else {
            $elements.each(function (i, elem) {
                addHandler(elem, 'mouseenter', mouseenter_handler);
                addHandler(elem, 'mousemove', mousemove_handler);
                addHandler(elem, 'mouseleave', mouseleave_handler);
            });
        }


        var destroy = function () {
            if (options.bindEventByJquery) {
                $elements.off({
                    'mouseenter.img.blowup': mouseenter_handler,
                    'mousemove.img.blowup': mousemove_handler,
                    'mouseleave.img.blowup': mouseleave_handler,
                });
            } else {
                $elements.each(function (i, elem) {
                    removeHandler(elem, 'mouseenter', mouseenter_handler);
                    removeHandler(elem, 'mousemove', mousemove_handler);
                    removeHandler(elem, 'mouseleave', mouseleave_handler);
                });
            }
            $blowupCanvas.remove();
            NATIVE_IMG = null;
            $IMAGE_URL = '';
        };

        var refresh = function () {
            if ($el && $blowupCanvas && $blowupCanvas.length > 0) {
                drawImageToCanvas();
            }
        };

        var getBlowupElData = function () {
            if ($el) {
                return {
                    '$el': $el,
                    'el_pageX': el_pageX,
                    'el_pageY': el_pageY
                }
            } else {
                return null;
            }
        };

        return {
            "destroy": destroy,
            "options": options,
            "items": $elements,
            "canvas": $blowupCanvas,
            "getBlowupElData": getBlowupElData,
            "refresh": refresh
        };
    }

});
