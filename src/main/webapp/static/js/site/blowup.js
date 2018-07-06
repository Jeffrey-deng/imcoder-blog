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
            scale: 1
        };

        // Update defaults with custom attributes
        var $options = $.extend(defaults, attributes);

        var $elements = $($options.selector);

        // If the target element is not an image
        /*if (!$elements.is("img")) {
         console.log("%c Blowup.js Error: " + "%cTarget element is not an image.",
         "background: #FCEBB6; color: #F07818; font-size: 17px; font-weight: bold;",
         "background: #FCEBB6; color: #F07818; font-size: 17px;");
         return;
         }*/

        // Modify target image
        //$elements.css("cursor", $options.cursor ? "crosshair" : "none");

        // Create magnification lens element
        var lens = document.createElement("div");
        lens.id = "BlowupLens";

        // Attack the element to the body
        document.getElementById("BlowupLens") || $("body").append(lens);

        // Updates styles
        var $blowupLens = $("#BlowupLens");

        $blowupLens.css({
            "position": "absolute",
            "visibility": "hidden",
            "pointer-events": "none",
            "zIndex": $options.zIndex,
            "width": $options.width,
            "height": $options.height,
            "border": $options.border,
            "background": $options.background,
            "border-radius": $options.round ? "50%" : "none",
            "box-shadow": $options.shadow,
            "background-repeat": "no-repeat",
        });


        var $IMAGE_URL  = "";
        var NATIVE_IMG  = new Image();

        // Show magnification lens
        var mouseenter_handler = function (e) {
            $blowupLens.css("visibility", "visible");
            NATIVE_IMG.src = e.target.src;
            $IMAGE_URL = e.target.src;
        };

        // Mouse motion on image
        // Mouse motion on image
        var mousemove_handler = function (e) {
            e = e ? e : window.event;
            var obj = e.srcElement ? e.srcElement : e.target;
            var _this = $(obj);
            // Lens position coordinates
            var lensX = e.pageX - $options.width / 2;
            var lensY = e.pageY - $options.height / 2;

            // Relative coordinates of image
            var relX = e.pageX - _this.offset().left;
            var relY = e.pageY - _this.offset().top;

            // Zoomed image coordinates
            var zoomX = -Math.floor(relX / _this.width() * (NATIVE_IMG.width * $options.scale) - $options.width / 2);
            var zoomY = -Math.floor(relY / _this.height() * (NATIVE_IMG.height * $options.scale) - $options.height / 2);

            var backPos = zoomX + "px " + zoomY + "px";
            var backgroundSize = NATIVE_IMG.width * $options.scale + "px " + NATIVE_IMG.height * $options.scale + "px";

            // Apply styles to lens
            $blowupLens.css({
                left                  : lensX,
                top                   : lensY,
                "background-image"    : "url(" + $IMAGE_URL + ")",
                "background-size"     : backgroundSize,
                "background-position" : backPos
            });
        };

        // Hide magnification lens
        var mouseleave_handler= function (e) {
            $blowupLens.css("visibility", "hidden");
            //NATIVE_IMG = null;
        };

        var removeHandler = (function() {
            if (window.removeEventListener) {// 标准浏览器
                return function(elem, type, handler) {
                    elem.removeEventListener(type, handler, false);

                }
            } else if (window.detachEvent) {// IE浏览器
                return function(elem, type, handler) {
                    elem.detachEvent("on" + type, handler);
                }
            }
        })();

        var addHandler = (function() {
            if (window.addEventListener) {// 标准浏览器
                return function(elem, type, handler) {
                    elem.addEventListener(type, handler, false);

                }
            } else if (window.detachEvent) {// IE浏览器
                return function(elem, type, handler) {
                    elem.attachEvent("on" + type, handler);
                }
            }
        })();

        $elements.each(function (i, elem) {
            addHandler(elem, "mouseenter", mouseenter_handler);
            addHandler(elem, "mousemove", mousemove_handler);
            addHandler(elem, "mouseleave", mouseleave_handler);
        });

        var destroy = function () {
            $elements.each(function (i, elem) {
                removeHandler(elem, "mouseenter", mouseenter_handler);
                removeHandler(elem, "mousemove", mousemove_handler);
                removeHandler(elem, "mouseleave", mouseleave_handler);
            });
            document.body.removeChild(document.getElementById("BlowupLens"));
            NATIVE_IMG = null;
        };

        return {
            "destroy": destroy
        };
    }

});
