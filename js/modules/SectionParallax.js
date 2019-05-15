/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery, window, document, Parallax*/

(function (ns, $) {

    ns.$win = ns.$win || $(window);
    ns.$doc = ns.$doc || $(document);
    ns.$t = ns.$t || (function ($t) { return function (e) { $t[0] = e; return $t; }; }($([null])));

    ns.SectionParallax = (function () {

        var SELECTOR = {
                parallax: ".section__background",
                layer: ".section__background-layer--parallax"
            },

            parallaxes = {},

            add = function (sectionId, $element, options) {

                if (window.Parallax && sectionId && $element) {

                    parallaxes[sectionId] = parallaxes[sectionId] || [];

                    var parallax = new Parallax($.extend({}, {
                        parallax: $element[0],
                        layers: SELECTOR.layer,

                        fakeTilt: false
                    }, options || null));

                    parallaxes[sectionId].push(parallax);

                    return parallax;
                }

                return null;
            },

            remove = function (sectionId, $element) {

                if (sectionId && parallaxes[sectionId]) {

                    parallaxes[sectionId].forEach(function (parallax) {

                        if ($element) {

                            if ($element[0] === parallax.elParallax) {

                                parallax.destroy();
                            }

                            return;
                        }

                        parallax.destroy();
                    });

                    if (!$element) {

                        delete parallaxes[sectionId];
                    }
                }
            },

            get = function (sectionOrSectionId, filterSelector) {

                if (sectionOrSectionId) {

                    var sectionId = typeof sectionOrSectionId === "string" ? sectionOrSectionId: sectionOrSectionId.getId(),
                        sectionParallaxes = parallaxes[sectionId] || [];

                    if (sectionParallaxes.length && filterSelector) {

                        return sectionParallaxes.filter(function (parallax) {
                            return ns.$t(parallax.elParallax).is(filterSelector);
                        });
                    }

                    return sectionParallaxes;
                }

                return [];
            };

        return {
            add: add,
            remove: remove,

            get: get,

            getParallaxSelector: function () {
                return SELECTOR.parallax;
            }
        };

    }());

}((function (ns) { window[ns] = window[ns] || { toString: function () { return ns; } }; return window[ns]; }("MJNS")), jQuery));
