/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery*/

(function (ns, $) {

    ns.SectionDisclaimer = (function () {

        var ID = {
                self: "disclaimer"
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

                return ns.SectionText.initForSection(ns.SectionDisclaimer, subsectionId);
            },

            hide = function () {

                return ns.SectionText.hide();
            },

            init = function () {

                ELEMENT.$self = $(SELECTOR.self);

                ns.SectionNavigator.registerSection(ns.SectionDisclaimer);

                if (ns.SectionNavigator.isCurrent(ns.SectionDisclaimer)) {

                    ns.SectionText.initForSection(ns.SectionDisclaimer);
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
