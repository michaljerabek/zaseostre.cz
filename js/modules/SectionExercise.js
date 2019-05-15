/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery, window*/

(function (ns, $) {

    ns.SectionExercise = (function () {

        var CLASS = {
                current: "section-exercise--current",

                closeShow: "section-exercise__close--show",
                backgroundShow: "section-exercise__background--show",
                backgroundImgShow: "section-exercise__background-img--show",
                contentBackgroundShow: "section-exercise__content-background--show"
            },

            SELECTOR = {
                close: ".section-exercise__close",

                title: ".section-exercise__title",
                animContentWrapper: ".section-exercise__content-wrapper",
                findAnimContent: "h4, h5, h6, p, li, .btn",

                background: ".section-exercise__background",
                backgroundImg: ".section-exercise__background-img",
                contentBackground: ".section-exercise__content-background"
            },

            ELEMENT = {
                $close: null,

                $title: null,
                $animContentWrapper: null,
                $animContent: null,

                $background: null,
                $backgroundImg: null,
                $contentBackground: null
            },

            backgroundLoaded = {},

            showTimeline = null,

            destroyBackgroundParallax = function (exercise) {

                ns.SectionParallax.remove(exercise.getId());
            },

            loadBackground = function (exercise) {

                if (!backgroundLoaded[exercise.getId()]) {

                    ns.Section.loadImgs(exercise);

                    backgroundLoaded[exercise.getId()] = true;
                }
            },

            getShowContentTween = function () {

                var from = {
                        _animValue: 0
                    },

                    to = {
                        _animValue: 1,

                        ease: Power2.easeOut,
                        delay: 0.5,

                        onStart: function () {

                            this.target.classList.add(ns.CLASS.animStared);
                        }
                    },

                    stagger = {
                        amount: ELEMENT.$animContent.length / 15,
                        ease: Power0.easeIn
                    };

                return TweenMax.staggerFromTo(ELEMENT.$animContent.toArray(), 1.25, from, to, stagger);
            },

            getShowTitleTween = function () {

                var wordEls = ns.BreakText.getEls(ELEMENT.$title[0], ns.BreakText.EL.WORD);

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

                        ease: Power3.easeOut,
                        delay: 0
                    },

                    stagger = {
                        amount: wordEls.length / 10,
                        ease: Power0.easeIn
                    };

                return TweenMax.staggerFromTo(wordEls, 2.5, from, to, stagger);
            },

            createShowTimeline = function () {

                if (ELEMENT.$animContent.length || ELEMENT.$title.length) {

                    showTimeline = new TimelineMax();

                    if (ELEMENT.$animContent.length) {

                        var showContentTween = getShowContentTween();

                        showTimeline.add(showContentTween, 0.5);
                    }

                    if (ELEMENT.$title.length) {

                        var showTitleTween = getShowTitleTween();

                        showTimeline.add(showTitleTween, 0.5);
                    }
                }
            },

            initBackgroundParallax = function (exercise) {

                ns.SectionParallax.add(
                    exercise.getId(),
                    exercise.get$Element()
                        .find(ns.SectionParallax.getParallaxSelector())
                );
            },

            initElements = function (exercise) {

                ELEMENT.$close = exercise.get$Element().find(SELECTOR.close);

                ELEMENT.$title = exercise.get$Element().find(SELECTOR.title);
                ELEMENT.$animContentWrapper = exercise.get$Element().find(SELECTOR.animContentWrapper);
                ELEMENT.$animContent = ELEMENT.$animContentWrapper.find(SELECTOR.findAnimContent);
                ELEMENT.$contentBackground = exercise.get$Element().find(SELECTOR.contentBackground);

                loadBackground(exercise);
                ELEMENT.$background = exercise.get$Element().find(SELECTOR.background);
                ELEMENT.$backgroundImg = ELEMENT.$background.find(SELECTOR.backgroundImg);

                if (ELEMENT.$title.length) {

                    ns.BreakText.processElement(ELEMENT.$title[0], true);
                }
            },

            initEvents = function () {

                ELEMENT.$close.on("click." + ns, function (event) {

                    event.preventDefault();

                    ns.SectionExercises.hideSubsection();
                });
            },

            show = function (exercise, customAnim) {

                var $deferred = $.Deferred();

                initElements(exercise);
                initEvents();

                exercise.get$Element()
                    .css("display", "")
                    .addClass(CLASS.current);

                initBackgroundParallax(exercise);

                if (!customAnim) {

                    createShowTimeline();
                }

                ns.Section.resetScrollTop(exercise);

                ELEMENT.$close.addClass(CLASS.closeShow);
                ELEMENT.$background.addClass(CLASS.backgroundShow);
                ELEMENT.$backgroundImg.addClass(CLASS.backgroundImgShow);

                if (!customAnim) {

                    ELEMENT.$contentBackground.addClass(CLASS.contentBackgroundShow);
                    ELEMENT.$animContent.removeClass(ns.CLASS.animStared);
                }

                ns.Section.focusToTarget(exercise);

                $deferred.resolve();

                return $deferred;
            },

            hide = function (exercise, onDone) {

                ELEMENT.$close.off("click." + ns);

                return ns.Section.hide(exercise, function () {

                    if (showTimeline) {

                        showTimeline.pause();
                    }

                    destroyBackgroundParallax(exercise);

                    ELEMENT.$close.removeClass(CLASS.closeShow);
                    ELEMENT.$background.removeClass(CLASS.backgroundShow);
                    ELEMENT.$backgroundImg.removeClass(CLASS.backgroundImgShow);

                    if (ELEMENT.$contentBackground.length) {

                        ELEMENT.$contentBackground.removeClass(CLASS.contentBackgroundShow);
                    }

                    if (onDone) {

                        onDone();
                    }

                    exercise.get$Element()
                        .hide()
                        .removeClass(CLASS.current);
                });
            };

        return {
            hide: hide,
            show: show,

            loadBackground: loadBackground,

            CLASS: CLASS
        };
    }());

}((function (ns) { window[ns] = window[ns] || { toString: function () { return ns; } }; return window[ns]; }("MJNS")), jQuery));
