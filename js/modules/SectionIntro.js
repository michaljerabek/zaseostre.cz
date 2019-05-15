/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery, window, document, TweenMax, TimelineMax, Power2, Power0, CustomEase*/

(function (ns, $) {

    ns.$win = ns.$win || $(window);
    ns.$doc = ns.$doc || $(document);
    ns.$t = ns.$t || (function ($t) { return function (e) { $t[0] = e; return $t; }; }($([null])));

    ns.SectionIntro = (function () {

        var CLASS = {
                dropShadow: "section-intro--drop-shadow",

                backgroundImgShow: "section-intro__background-img--show",

                claimUnblur: "section-intro__claim--unblur",
                claim2Show: "section-intro__claim--2-show",
                claim2BtnShown: "section-intro__claim--2-btn-shown",
                btnHidden: "section-intro__btn--hidden"
            },

            ID = {
                self: "uvod"
            },

            SELECTOR = {
                self: "#" + ID.self,

                backgroundImg: ".section-intro__background-img",

                content: ".section-intro__content",
                claim1: ".section-intro__claim--1",
                claim2: ".section-intro__claim--2",
                btn: ".section-intro__btn"
            },

            ELEMENT = {
                $self: null,

                $backgroundImg: null,

                $content: null,
                $claim1: null,
                $claim2: null,
                $btn: null,
                $btnText: null,
                $btnUnderline: null
            },

            ANIM_POSITION = {
                BEFORE_CLAIM1: "p1",
                AFTER_CLAIM1: "p2",
                AFTER_CLAIM1_HIDDEN: "p3",
                BEFORE_CLAIM2: "p4",
                AFTER_CLAIM2: "p5",
                BEFORE_FULL_CONTENT: "p6",
                AFTER_FULL_CONTENT: "p7"
            },

            EASE = {
                showClaim1: CustomEase.create("SectionIntroShowClaim1", ".2, .2, 0, 1"),
                showBtn: CustomEase.create("SectionIntroShowBtn", ".17, .83, .65, .98")
            },

            started = false,

            showTimeline,
            parallax,

            getId = function () {

                return ID.self;
            },

            get$Element = function () {

                return ELEMENT.$self;
            },

            show = function () {

                var $deferred = $.Deferred();

                ELEMENT.$self.css("display", "");

                ns.Section.resetScrollTop(ns.SectionIntro);

                if (parallax) {

                    parallax.enable();
                }

                if (!started) {

                    start();
                }

                if (started && showTimeline) {

                    clearFullContentElements();

                    showTimeline.seek(ANIM_POSITION.BEFORE_FULL_CONTENT, false);
                }

                var from = {
                        opacity: 0
                    },

                    to = {
                        opacity: 1,

                        ease: Power2.easeOut,

                        onComplete: function () {

                            if (started && showTimeline) {

                                showTimeline.play();
                            }

                            $deferred.resolve();
                        }
                    };

                TweenMax.fromTo(ELEMENT.$self[0], 1, from, to);

                ns.Section.focusToTarget(ns.SectionIntro);

                return $deferred;
            },

            hide = function () {

                return ns.Section.hide(ns.SectionIntro, function () {

                    if (parallax) {

                        parallax.disable();
                    }

                    if (showTimeline) {

                        showTimeline.pause();
                    }

                    ELEMENT.$backgroundImg
                        .removeClass(CLASS.backgroundImgShow);
                });
            },

            initElements = function () {

                ELEMENT.$backgroundImg = ELEMENT.$self.find(SELECTOR.backgroundImg);

                ELEMENT.$content = ELEMENT.$self.find(SELECTOR.content);

                ELEMENT.$claim1 = ELEMENT.$content.find(SELECTOR.claim1);
                ELEMENT.$claim2 = ELEMENT.$content.find(SELECTOR.claim2);

                ELEMENT.$btn = ELEMENT.$content.find(SELECTOR.btn);
                ELEMENT.$btnText = ELEMENT.$btn.find(ns.SELECTOR.findBtnText);
                ELEMENT.$btnUnderline = ELEMENT.$btn.find(ns.SELECTOR.findBtnUnderline);

                ns.BreakText.processElement(ELEMENT.$claim1[0]);
                ns.BreakText.processElement(ELEMENT.$claim2[0], true);
                ns.BreakText.processElement(ELEMENT.$btnText[0]);
            },

            initBackgroundParallax = function () {

                var options = {
                        onBeforeTransform: function (layerEl, fromCenter, x, y) {

                            var transformOrigin = (40 + (20 * (x + 0.5))) + "% " + (40 + (20 * (y + 0.5))) + "%";

                            ELEMENT.$backgroundImg.css({
                                transformOrigin: transformOrigin
                            });
                        }
                    };

                parallax = ns.SectionParallax.add(
                        getId(),
                        get$Element()
                            .find(ns.SectionParallax.getParallaxSelector()),
                        options
                    );
            },

            getShowFullContentTween = function () {

                var btnTextEls = ns.BreakText.getEls(ELEMENT.$btnText[0], ns.BreakText.EL.LETTER_SPACE),
                    btnUnderlineEl = ELEMENT.$btn.find(ns.SELECTOR.findBtnUnderline)[0],

                    textFrom = {
                        y: "-100%",
                        opacity: 0
                    },

                    textTo = {
                        y: "0%",
                        opacity: 1,

                        ease: EASE.showBtn,

                        onStart: function () {

                            ELEMENT.$backgroundImg
                                .css("transition", "")
                                .addClass(CLASS.backgroundImgShow);

                            ELEMENT.$claim2
                                .css("transition", "")
                                .addClass(CLASS.claim2BtnShown);
                        }
                    },

                    textStagger = {
                        amount: 0.9
                    },

                    textDone = function () {

                        ELEMENT.$self.addClass(CLASS.dropShadow);
                    },

                    underlineTo = {
                        y: 0,
                        opacity: 1,

                        ease: EASE.showBtn,
                        delay: 0.3
                    };

                return [
                    TweenMax.staggerFromTo(btnTextEls, 2.5, textFrom, textTo, textStagger, textDone),
                    TweenMax.to(btnUnderlineEl, 2.5, underlineTo)
                ];
            },

            clearFullContentElements = function () {

                ELEMENT.$backgroundImg
                    .css("transition", "none")
                    .removeClass(CLASS.backgroundImgShow);

                ELEMENT.$claim2
                    .css("transition", "none")
                    .removeClass(CLASS.claim2BtnShown);

                ELEMENT.$self.removeClass(CLASS.dropShadow);
            },

            getShowClaim2Tween = function () {

                var wordEls = ns.BreakText.getEls(ELEMENT.$claim2[0], ns.BreakText.EL.WORD);

                wordEls = wordEls.map(function (word) {

                    word.innerHTML = "<span>" + word.innerHTML + "</span>";

                    return word.firstChild;
                });

                var from = {
                        y: "175%",
                        opacity: 0
                    },

                    to = {
                        y: "0%",
                        opacity: 1,

                        ease: Power2.easeOut,

                        onStart: function () {

                            clearFullContentElements();

                            ELEMENT.$claim1.hide();
                            ELEMENT.$claim2.addClass(CLASS.claim2Show);
                            ELEMENT.$btn.removeClass(CLASS.btnHidden);
                        }
                    },

                    stagger = function (index) {

                        if (!index) {

                            return 0;
                        }

                        var prevText = wordEls.slice(0, index - 1).map(function (el) {
                            return el.textContent;
                        }).join("");

                        return prevText.length / 28;
                    };

                return TweenMax.staggerFromTo(wordEls, 1.7, from, to, stagger);
            },

            getHideClaim1Tweens = function () {

                var letterEls = ns.BreakText.getEls(ELEMENT.$claim1[0], ns.BreakText.EL.LETTER_SPACE),

                    from = {
                        transformOrigin: "50% 85%"
                    },

                    to = {
                        y: "65%",
                        rotationX: -135,
                        opacity: 0,

                        ease: Power2.easeIn
                    },

                    stagger = {
                        amount: 0.45,
                        ease: Power0.easeOut
                    },

                    done = function () {

                        ELEMENT.$claim1.hide();
                    };

                return TweenMax.staggerFromTo(letterEls, 0.8, from, to, stagger, done);
            },

            getShowClaim1Tweens = function () {

                var to1 = {
                        opacity: 1,

                        ease: EASE.showClaim1,

                        onStart: function () {

                            ELEMENT.$claim1.addClass(CLASS.claimUnblur);
                        }
                    },

                    to2 = {
                        scale: 1,

                        ease: EASE.showClaim1
                    };

                return [
                    TweenMax.to(ELEMENT.$claim1[0], 5, to1),
                    TweenMax.to(ELEMENT.$claim1[0], 6, to2)
                ];
            },

            initContent = function () {

                ELEMENT.$self.focus();

                showTimeline = new TimelineMax();

                var showClaim1Tweens = getShowClaim1Tweens(),
                    hideClaim1Tween = getHideClaim1Tweens(),
                    showClaim2Tween = getShowClaim2Tween(),
                    showFullContentTween = getShowFullContentTween();

                showTimeline.addLabel(ANIM_POSITION.BEFORE_CLAIM1);

                showTimeline.add(showClaim1Tweens, ANIM_POSITION.BEFORE_CLAIM1);

                showTimeline.addLabel(ANIM_POSITION.AFTER_CLAIM1);

                showTimeline.add(hideClaim1Tween, ANIM_POSITION.AFTER_CLAIM1 + "-=0.5");

                showTimeline.addLabel(ANIM_POSITION.AFTER_CLAIM1_HIDDEN);
                showTimeline.addLabel(ANIM_POSITION.BEFORE_CLAIM2);

                showTimeline.add(showClaim2Tween, ANIM_POSITION.BEFORE_CLAIM2);

                showTimeline.addLabel(ANIM_POSITION.AFTER_CLAIM2);
                showTimeline.addLabel(ANIM_POSITION.BEFORE_FULL_CONTENT);

                showTimeline.add(showFullContentTween, ANIM_POSITION.BEFORE_FULL_CONTENT + "+=1.1");

                showTimeline.addLabel(ANIM_POSITION.AFTER_FULL_CONTENT);
            },

            start = function () {

                started = true;

                initElements();
                initBackgroundParallax();
                initContent();

                ns.Section.focusToTarget(ns.SectionIntro);
            },

            init = function () {

                ELEMENT.$self = $(SELECTOR.self);

                ns.SectionNavigator.registerSection(ns.SectionIntro);

                if (!ns.SectionNavigator.isCurrent(ns.SectionIntro)) {

                    return;
                }

                if (!document.hidden) {

                    start();

                } else {

                    document.addEventListener("visibilitychange", function thisFn() {

                        if (!document.hidden) {

                            start();

                            document.removeEventListener("visibilitychange", thisFn);
                        }
                    });
                }
            };

        return {
            init: init,

            getId: getId,
            get$Element: get$Element,

            show: show,
            hide: hide
        };

    }());

}((function (ns) { window[ns] = window[ns] || { toString: function () { return ns; } }; return window[ns]; }("MJNS")), jQuery));
