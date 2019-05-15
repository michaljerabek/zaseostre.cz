/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery, window, TweenMax, CustomEase, lottie*/

(function (ns, $) {

    ns.$t = ns.$t || (function ($t) { return function (e) { $t[0] = e; return $t; }; }($([null])));

    ns.SectionExerciseEyeExercises = (function () {

        var CLASS = {
                currentExercise: "section-exercise-eye-exercises__exercise--current",
                animationDataPreloaded: "section-exercise-eye-exercises__exercise-animation--data-preloaded",

                showAnim: "anim-show",
                hideAnim: "anim-hide"
            },

            ID = {
                self: "cviceni__ocni-cviceni"
            },

            DATA = {
                lottieFile: "lottie-file"
            },

            SELECTOR = {
                self: "#" + ID.self,

                contentBox: ".section-exercise-eye-exercises__content-box",
                exercises: ".section-exercise-eye-exercises__exercises",
                exercise: ".section-exercise-eye-exercises__exercise",
                currentExercise: "." + CLASS.currentExercise,

                findLottieAnimContainer: ".section-exercise-eye-exercises__exercise-animation",
                findSwitchAnimation1Target: ".section-exercise-eye-exercises__switch-animation-1-target",
                findSwitchAnimation2Target: ".section-exercise-eye-exercises__switch-animation-2-target"
            },

            ELEMENT = {
                $self: null,
                $content: null,
                $contentBox: null,

                $exercises: null,
                $exercise: null
            },

            EASE = {
                showShort: CustomEase.create("EyeExercisesShowShort", ".29, .42, .38, .99"),
                showLong: CustomEase.create("EyeExercisesShowLong", ".39, .44, .39, 1"),
                hideShort: CustomEase.create("EyeExercisesHideShort", ".38, .16, .6, .9"),
                hideLong: CustomEase.create("EyeExercisesHideLong", ".45, .04, .65, .95"),

                showContent: CustomEase.create("SectionExerciseEyeExercisesShow", "0.31, 0.66, 0.17, 1")
            },

            PRELOAD_DELAY = 500,

            lotties = {},

            currentExerciseIndex = 0,

            showTimeline = null,

            tweenMaxExercisesHeight,
            timelineExerciseHide,
            timelineExerciseShow,

            hasExerciseAnimationPreloads = false,

            getId = function () {

                return ID.self;
            },

            get$Element = function () {

                return ELEMENT.$self;
            },

            getExerciseAnimationLottieFile = function ($animation) {

                return $animation.data(DATA.lottieFile);
            },

            insertExerciseAnimationPreload = function ($animation, html) {

                document.head.insertAdjacentHTML("beforeend", html);

                document.head.lastChild.addEventListener("load", function () {

                    $animation.addClass(CLASS.animationDataPreloaded);
                });
            },

            insertExerciseAnimationPreloads = function () {

                var data = {
                    animEls$: [],
                    html: []
                };

                ELEMENT.$exercise.each(function () {

                    var $animation = ns.$t(this).find(SELECTOR.findLottieAnimContainer),

                        lottieFile = getExerciseAnimationLottieFile($animation);

                    if (lottieFile) {

                        data.html.push(
                            "<link href=\"" + lottieFile + "\" rel=\"preload\" as=\"fetch\" type=\"application/json\" crossorigin=\"anonymous\"/>"
                        );

                        data.animEls$.push($animation);
                    }
                });

                if (data.animEls$.length) {

                    insertExerciseAnimationPreload(data.animEls$.shift(), data.html.shift());

                    data.html.forEach(function (preloadLink, i) {

                        setTimeout(function() {

                            insertExerciseAnimationPreload(data.animEls$[i], preloadLink);

                        }, PRELOAD_DELAY * (i + 1));
                    });
                }

                hasExerciseAnimationPreloads = true;
            },

            initElements = function () {

                ELEMENT.$content = ELEMENT.$self.find(ns.Section.SELECTOR.content);
                ELEMENT.$contentBox = ELEMENT.$content.find(SELECTOR.contentBox);
                ELEMENT.$exercises = ELEMENT.$contentBox.find(SELECTOR.exercises);
                ELEMENT.$exercise = ELEMENT.$exercises.find(SELECTOR.exercise);

                ELEMENT.$exercise.hide();

                if (!hasExerciseAnimationPreloads) {

                    insertExerciseAnimationPreloads();
                }
            },

            createShowExerciseAnimation = function ($exercise, index, forwards) {

                $exercise.css("display", "");

                var $switchAnimation1Target = $exercise.find(SELECTOR.findSwitchAnimation1Target),
                    $switchAnimation2Target = $exercise.find(SELECTOR.findSwitchAnimation2Target),

                    exerciseHeight = $exercise.outerHeight(),

                    target1Top = $switchAnimation1Target.position().top,
                    target2Top = $switchAnimation2Target.position().top,

                    target1To = {
                        scale: 1,
                        opacity: 1,

                        ease: forwards ? EASE.showShort: EASE.showLong,
                        delay: 0.4,

                        overwrite: "all",

                        onStart: function () {

                            ns.Section.resetScrollTop(ns.SectionExerciseEyeExercises, true);
                        }
                    },

                    target2To = {
                        scale: 1,
                        opacity: 1,

                        ease: forwards ? EASE.showLong: EASE.showShort,
                        delay: 0.4,

                        overwrite: "all"
                    };

                TweenMax.set($switchAnimation1Target[0], {
                    transformOrigin: "50% " + ((exerciseHeight / 2) - target1Top) + "px"
                });

                TweenMax.set($switchAnimation2Target[0], {
                    transformOrigin: "50% " + ((exerciseHeight / 2) - target2Top) + "px"
                });

                $exercise.removeClass(CLASS.hideAnim);
                $exercise.addClass(CLASS.showAnim);

                timelineExerciseShow = new TimelineMax();

                var showAnimation1TargetTween = TweenMax.to($switchAnimation1Target[0], forwards ? 0.85 : 0.9, target1To),
                    showAnimation2TargetTween = TweenMax.to($switchAnimation2Target[0], forwards ? 0.9 : 0.85, target2To);

                timelineExerciseShow.add(showAnimation1TargetTween, 0);
                timelineExerciseShow.add(showAnimation2TargetTween, 0);

                createExerciseAnimation(index);

                timelineExerciseShow.eventCallback("onComplete", function () {

                    $exercise.removeClass(CLASS.showAnim);
                });
            },

            createHideExerciseAnimation = function ($exercise, index, forwards) {

                var $switchAnimation1Target = $exercise.find(SELECTOR.findSwitchAnimation1Target),
                    $switchAnimation2Target = $exercise.find(SELECTOR.findSwitchAnimation2Target),

                    exerciseHeight = $exercise.outerHeight(),

                    target1Top = $switchAnimation1Target.position().top,
                    target2Top = $switchAnimation2Target.position().top,

                    target1To = {
                        scale: forwards ? 0.8 : 1.1666,
                        opacity: 0,

                        ease: forwards ? EASE.hideShort: EASE.hideLong,

                        overwrite: "all"
                    },

                    target2To = {
                        scale: forwards ? 0.8 : 1.1666,
                        opacity: 0,

                        ease: forwards ? EASE.hideLong: EASE.hideShort,

                        overwrite: "all"
                    };

                TweenMax.set($switchAnimation1Target[0], {
                    transformOrigin: "50% " + ((exerciseHeight / 2) - target1Top) + "px"
                });

                TweenMax.set($switchAnimation2Target[0], {
                    transformOrigin: "50% " + ((exerciseHeight / 2) - target2Top) + "px"
                });

                $exercise.removeClass(CLASS.showAnim);
                $exercise.addClass(CLASS.hideAnim);

                timelineExerciseHide = new TimelineMax();

                var hideAnimation1TargetTween = TweenMax.to($switchAnimation1Target[0], forwards ? 0.75: 0.8, target1To),
                    hideAnimation2TargetTween = TweenMax.to($switchAnimation2Target[0], forwards ? 0.8: 0.75, target2To);

                timelineExerciseHide.add(hideAnimation1TargetTween, 0);
                timelineExerciseHide.add(hideAnimation2TargetTween, 0);

                timelineExerciseHide.eventCallback("onComplete", function () {

                    $exercise.removeClass(CLASS.hideAnim);

                    if (!$exercise.hasClass(CLASS.currentExercise)) {

                        destroyExerciseAnimation(index);

                        $exercise.hide();
                    }

                    if (index === 0) {

                        $exercise.attr("aria-live", "polite");
                    }
                });
            },

            createExercisesHeightAnimation = function ($nextExercise) {

                TweenMax.set(ELEMENT.$exercises[0], {
                    height: ELEMENT.$exercises.outerHeight()
                });

                var exercisesTo = {
                    height: $nextExercise.outerHeight(),

                    ease: Power2.easeInOut,

                    overwrite: "all"
                };

                tweenMaxExercisesHeight = TweenMax.to(ELEMENT.$exercises[0], 1, exercisesTo);
            },

            createSwitchExerciseAnimation = function ($prevExercise, $nextExercise) {

                var prevIndex = $prevExercise.index(),
                    nextIndex = $nextExercise.index(),

                    forwards = prevIndex < nextIndex;

                if (!$prevExercise.hasClass(CLASS.hideAnim)) {

                    createHideExerciseAnimation($prevExercise, prevIndex, forwards);
                }

                if (!$nextExercise.hasClass(CLASS.showAnim)) {

                    createShowExerciseAnimation($nextExercise, nextIndex, forwards);
                }

                $prevExercise
                    .removeClass(CLASS.currentExercise);

                $nextExercise
                    .addClass(CLASS.currentExercise);

                createExercisesHeightAnimation($nextExercise);
            },

            switchExercise = function (animate) {

                var $prevExercise = ELEMENT.$exercise.filter("." + CLASS.currentExercise),
                    $nextExercise = ELEMENT.$exercise.eq(currentExerciseIndex);

                if (animate) {

                    createSwitchExerciseAnimation($prevExercise, $nextExercise);

                } else {

                    if ($prevExercise.length) {

                        ns.Section.resetScrollTop(ns.SectionExerciseEyeExercises, true);
                    }

                    var $switchAnimationTargets = $nextExercise.find([
                            SELECTOR.findSwitchAnimation1Target,
                            SELECTOR.findSwitchAnimation2Target
                        ].join(","));

                    $prevExercise
                        .removeClass(CLASS.currentExercise)
                        .hide();

                    $nextExercise.css("display", "")
                        .addClass(CLASS.currentExercise);

                    TweenMax.set(ELEMENT.$exercises[0], {
                        height: $nextExercise.outerHeight()
                    });

                    TweenMax.set($switchAnimationTargets.toArray(), {
                        scale: 1,
                        opacity: 1
                    });
                }

                return true;
            },

            onPrev = function () {

                currentExerciseIndex = Math.max(0, currentExerciseIndex - 1);

                ns.Controller.enableNext();

                if (currentExerciseIndex === 0) {

                    ns.Controller.disablePrev();
                }

                switchExercise(true);

                return false;
            },

            onNext = function () {

                currentExerciseIndex = Math.min(ELEMENT.$exercise.length - 1, currentExerciseIndex + 1);

                ns.Controller.enablePrev();

                if (currentExerciseIndex === ELEMENT.$exercise.length - 1) {

                    ns.Controller.disableNext();
                }

                switchExercise(true);

                return false;
            },

            createExerciseAnimation = function (index) {

                if (lotties[index]) {

                    lotties[index].play();

                    return;
                }

                var $animation = ELEMENT.$exercise
                        .eq(index)
                        .find(SELECTOR.findLottieAnimContainer),

                    containerEl = $animation[0],

                    animationPath = getExerciseAnimationLottieFile($animation);

                if (!containerEl || !animationPath) {

                    return;
                }

                lotties[index] = lottie.loadAnimation({
                    container: containerEl,
                    renderer: "svg",
                    loop: true,
                    autoplay: true,
                    path: animationPath
                });
            },

            destroyExerciseAnimation = function (index) {

                if (!lotties[index]) {

                    return;
                }

                lotties[index].stop();
            },

            resetExercisesElHeight = function () {

                TweenMax.set(ELEMENT.$exercises[0], {
                    height: ELEMENT.$exercise.eq(currentExerciseIndex).outerHeight()
                });
            },

            initEvents = function () {

                ns.Controller.initForSection(ns.SectionExerciseEyeExercises, onPrev, onNext);

                ns.$win.on("resize." + ns + ".SectionExerciseEyeExercises", resetExercisesElHeight);
            },

            getShowContentTween = function () {

                var from = {
                        scale: 1.1666,
                        opacity: 0
                    },

                    to = {
                        scale: 1,
                        opacity: 1,

                        ease: EASE.showContent
                    };

                return TweenMax.fromTo(ELEMENT.$contentBox[0], 1.95, from, to);
            },

            show = function () {

                currentExerciseIndex = 0;

                ELEMENT.$self
                    .css("display", "")
                    .addClass(ns.SectionExercise.CLASS.current);

                initElements();
                switchExercise();
                createExerciseAnimation(currentExerciseIndex);
                initEvents();

                ns.Controller.disablePrev();
                ns.Controller.enableNext();

                if (showTimeline) {

                    showTimeline.seek(0, false);
                    showTimeline.play();

                } else {

                    showTimeline = new TimelineMax();

                    var showContentTween = getShowContentTween();

                    showTimeline.add(showContentTween, 0.55);
                    showTimeline.add(ns.Controller.getShowTween(), 1.35);
                }

                return ns.SectionExercise.show(ns.SectionExerciseEyeExercises, true);
            },

            destroyEvents = function () {

                ns.Controller.initForSection(ns.SectionExercises);

                ns.$win.off("resize." + ns + ".SectionExerciseEyeExercises");
            },

            destroyAnimations = function () {

                $.each(lotties, function (l, lottie) {

                    if (lottie) {

                        lottie.destroy();
                    }
                });

                lotties = {};

                if (showTimeline) {

                    showTimeline.pause();
                }

                if (timelineExerciseHide) {

                    timelineExerciseHide.kill();
                }

                if (timelineExerciseShow) {

                    timelineExerciseShow.kill();
                }

                if (tweenMaxExercisesHeight) {

                    tweenMaxExercisesHeight.kill();
                }
            },

            resetElements = function () {

                var resetEls = ELEMENT.$exercise.find([
                        SELECTOR.findSwitchAnimation1Target,
                        SELECTOR.findSwitchAnimation2Target
                    ].join(",")).toArray();

                TweenMax.set(resetEls, {
                    scale: 1.1666,
                    opacity: 0
                });

                ELEMENT.$exercise
                    .removeClass(CLASS.showAnim)
                    .removeClass(CLASS.hideAnim)
                    .hide();

                ns.Controller.hide();
            },

            hide = function () {

                return ns.SectionExercise.hide(ns.SectionExerciseEyeExercises, function () {

                    destroyAnimations();
                    resetElements();
                    destroyEvents();
                });
            },

            init = function () {

                ELEMENT.$self = $(SELECTOR.self);

                ns.SectionExercises.registerExercise(ns.SectionExerciseEyeExercises);
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
