/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery, window, TweenMax*/

(function (ns, $) {

    ns.$t = ns.$t || (function ($t) { return function (e) { $t[0] = e; return $t; }; }($([null])));

    ns.Tweens = ns.Tweens || {};

    ns.Tweens.SectionTextHideBtnTween = (function () {

        var CLASS = {
                btnShow: "section-text__btn--show"
            },

            isVisible = function ($btn) {

                $btn = $btn.jquery ? $btn : ns.$t($btn);

                return $btn.hasClass(CLASS.btnShow);
            },

            clear = function ($btn) {

                $btn = $btn.jquery ? $btn : ns.$t($btn);

                var underlineEl = $btn.find(ns.SELECTOR.findBtnUnderline)[0];

                TweenMax.set(underlineEl, {
                    clearProps: "all"
                });

                $btn.removeClass(CLASS.btnShow);
            },

            get = function ($btn) {

                $btn = $btn.jquery ? $btn : ns.$t($btn);

                var $btnText = $btn.find(ns.SELECTOR.findBtnText),

                    underlineEl = $btn.find(ns.SELECTOR.findBtnUnderline)[0],

                    btnTextEls = ns.BreakText.getEls($btnText[0], ns.BreakText.EL.LETTER_SPACE),

                    textTo = {
                        y: "50%",
                        opacity: 0,

                        ease: Power3.easeOut,
                        delay: 0
                    },

                    textStagger = {
                        amount: 0.15
                    },

                    underlineTo = {
                        y: (parseFloat($btnText.css("font-size")) * 0.4) + "px",
                        opacity: 0,

                        ease: Power3.easeOut,
                        delay: 0.1,

                        clearProps: "all"
                    };

                return [
                    TweenMax.staggerTo(btnTextEls, 0.75, textTo, textStagger),
                    TweenMax.to(underlineEl, 0.75, underlineTo)
                ];
            };

        return {
            get: get,
            clear: clear,
            isVisible: isVisible
        };

    }());

}((function (ns) { window[ns] = window[ns] || { toString: function () { return ns; } }; return window[ns]; }("MJNS")), jQuery));
