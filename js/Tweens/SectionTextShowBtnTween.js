/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery, window, TweenMax, CustomEase*/

(function (ns, $) {

    ns.$t = ns.$t || (function ($t) { return function (e) { $t[0] = e; return $t; }; }($([null])));

    ns.Tweens = ns.Tweens || {};

    ns.Tweens.SectionTextShowBtnTween = (function () {

        var CLASS = {
                btnShow: "section-text__btn--show"
            },

            EASE = {
                showUnderline: CustomEase.create("BtnShowUnderline", ".1, .2, .12, .98")
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

                $btn.find("." + ns.CLASS.animStared)
                    .removeClass(ns.CLASS.animStared);
            },

            get = function ($btn, animStartedClass) {

                $btn = $btn.jquery ? $btn : ns.$t($btn);

                var $btnText = $btn.find(ns.SELECTOR.findBtnText),

                    underlineEl = $btn.find(ns.SELECTOR.findBtnUnderline)[0];

                if (!ns.BreakText.isBroken($btnText[0])) {

                    ns.BreakText.processElement($btnText[0]);
                }

                var btnTextEls = ns.BreakText.getEls($btnText[0], ns.BreakText.EL.LETTER_SPACE),

                    textFrom = {
                        y: "-100%",
                        opacity: 0
                    },

                    textTo = {
                        y: "0%",
                        opacity: 1,

                        ease: Power4.easeOut,

                        onStart: function () {

                            $btn = $btn.jquery ? $btn : ns.$t($btn);

                            $btn.addClass(CLASS.btnShow);

                            if (animStartedClass) {

                                this.target.classList.add(ns.CLASS.animStared);
                            }
                        }
                    },

                    textStagger = {
                        amount: 0.325
                    },

                    underlineTo = {
                        y: 0,
                        opacity: 1,

                        ease: EASE.showUnderline,
                        delay: 0.2,

                        onStart: function () {

                            if (animStartedClass) {

                                this.target.classList.add(ns.CLASS.animStared);
                            }
                        }
                    };

                return [
                    TweenMax.staggerFromTo(btnTextEls, 1.4, textFrom, textTo, textStagger),
                    TweenMax.to(underlineEl, 1.4, underlineTo)
                ];
            };

        return {
            get: get,
            clear: clear,
            isVisible: isVisible
        };

    }());

}((function (ns) { window[ns] = window[ns] || { toString: function () { return ns; } }; return window[ns]; }("MJNS")), jQuery));
