/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery, window*/

(function (ns, $) {

    ns.SectionExerciseAccommodation = (function () {

        var ID = {
                self: "cviceni__cviceni-akomodace"
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

            show = function () {

                return ns.SectionExercise.show(ns.SectionExerciseAccommodation);
            },

            hide = function () {

                return ns.SectionExercise.hide(ns.SectionExerciseAccommodation);
            },

            init = function () {

                ELEMENT.$self = $(SELECTOR.self);

                ns.SectionExercises.registerExercise(ns.SectionExerciseAccommodation);
            };

        return {
            init: init,

            hide: hide,
            show: show,

            getId: getId,
            get$Element: get$Element
        };
    }());

}((function (ns) { window[ns] = window[ns] || { toString: function () { return ns; } }; return window[ns]; }("MJNS")), jQuery));
