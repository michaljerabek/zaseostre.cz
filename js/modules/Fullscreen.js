/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery, window, document*/

(function (ns, $) {

    ns.$doc = ns.$doc || $(document);

    ns.Fullscreen = (function () {

        var CLASS = {
                active: "ui__fullscreen--active",
                visible: "ui__fullscreen--visible"
            },

            SELECTOR = {
                self: ".ui__fullscreen"
            },

            ELEMENT = {
                $self: null
            },

            API = {
                ELEMENT: [
                    "fullscreenElement",
                    "webkitCurrentFullScreenElement",
                    "mozFullScreenElement",
                    "msFullscreenElement"
                ],
                CHANGE: [
                    "fullscreenchange",
                    "webkitfullscreenchange",
                    "mozfullscreenchange",
                    "MSFullscreenChange"
                ],
                REQUEST: [
                    "requestFullscreen",
                    "mozRequestFullScreen",
                    "webkitRequestFullscreen",
                    "msRequestFullscreen"
                ]
            },

            SUPPORTED = API.REQUEST.some(function (method) {
                return !!document.documentElement[method];
            }),

            shouldShowFullscreenBtn = function () {

                return document.documentElement.scrollHeight !== window.innerHeight || document.body.scrollHeight !== window.innerHeight;
            },

            hasFullscreenElement = function () {

                return !API.ELEMENT.every(function (prop) {
                    return !document[prop];
                });
            },

            requestFullscreen = function (event) {

                event.preventDefault();

                if (ELEMENT.$self.hasClass(CLASS.active)) {

                    return;
                }

                API.REQUEST.some(function (method) {

                    if (document.documentElement[method]) {

                        document.documentElement[method]();

                        return true;
                    }
                });
            },

            initEvents = function () {

                ELEMENT.$self.on("click." + ns, requestFullscreen);

                ns.$doc.on(API.CHANGE.join("." + ns + " ") + "." + ns, function () {

                    if (!hasFullscreenElement()) {

                        ELEMENT.$self.removeClass(CLASS.active);

                    } else {

                        ELEMENT.$self.addClass(CLASS.active);
                    }
                });
            },

            init = function () {

                if (SUPPORTED) {

                    document.documentElement.className = document.documentElement.className.replace("no-fullscreen", "fullscreen");

                    if (shouldShowFullscreenBtn()) {

                        ELEMENT.$self = $(SELECTOR.self);

                        ELEMENT.$self.addClass(CLASS.visible);

                        initEvents();
                    }
                }
            };

        return {
            init: init
        };
    }());

}((function (ns) { window[ns] = window[ns] || { toString: function () { return ns; } }; return window[ns]; }("MJNS")), jQuery));
