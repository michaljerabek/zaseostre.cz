/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery, window, document*/

(function (ns, $) {

    ns.$win = ns.$win || $(window);
    ns.$doc = ns.$doc || $(document);
    ns.$t = ns.$t || (function ($t) { return function (e) { $t[0] = e; return $t; }; }($([null])));

    ns.SectionGeneralInfo = (function () {

        var ID = {
                self: "obecne-informace"
            },

            SELECTOR = {
                self: "#" + ID.self
            },

            ELEMENT = {
                $self: null
            },

            getId = function () {

                return ID.self;
            },

            get$Element = function () {

                return ELEMENT.$self;
            },

            showSubsection = function (subsectionId) {

                return ns.SectionText.showSubsection(subsectionId);
            },

            show = function (subsectionId) {

                return ns.SectionText.initForSection(ns.SectionGeneralInfo, subsectionId);
            },

            hide = function () {

                return ns.SectionText.hide();
            },

            init = function () {

                ELEMENT.$self = $(SELECTOR.self);

                ns.SectionNavigator.registerSection(ns.SectionGeneralInfo);

                if (ns.SectionNavigator.isCurrent(ns.SectionGeneralInfo)) {

                    ns.SectionText.initForSection(ns.SectionGeneralInfo);
                }
            };

        return {
            init: init,

            getId: getId,
            get$Element: get$Element,

            show: show,
            hide: hide,

            showSubsection: showSubsection
        };

    }());

}((function (ns) { window[ns] = window[ns] || { toString: function () { return ns; } }; return window[ns]; }("MJNS")), jQuery));
