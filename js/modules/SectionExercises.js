/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery, window, document, TweenMax*/

(function (ns, $) {

    ns.$win = ns.$win || $(window);
    ns.$doc = ns.$doc || $(document);
    ns.$t = ns.$t || (function ($t) { return function (e) { $t[0] = e; return $t; }; }($([null])));

    ns.SectionExercises = (function () {

        var CLASS = {
                hasActiveExercise: "section-exercises--has-active-exercise",

                backgroundImgShow: "section-exercises__background-img--show",

                contentShowShadow: "section-exercises__content--show-shadow",

                itemShow: "section-exercises__item--show",
                itemActive: "section-exercises__item--active",

                overlayAnimate: "section-exercises__toggle-exercise-overlay--animate"
            },

            ID = {
                self: "cviceni"
            },

            SELECTOR = {
                self: "#" + ID.self,
                content: ".section-exercises__content",
                title: ".section-exercises__title",

                item: ".section-exercises__item",
                itemGlow: ".section-exercises__item-glow",
                link: ".section-exercises__link",
                opacityTrigger: ".section-exercises__link-opacity-trigger",

                backgroundImg: ".section-exercises__background-img",
                backgroundToggleExerciseAnim: ".section-exercises__background-toggle-exercise-animation",
                contentToggleExerciseAnim: ".section-exercises__content-toggle-exercise-animation",
                toggleExerciseOverlay: ".section-exercises__toggle-exercise-overlay"
            },

            ELEMENT = {
                $self: null,
                $content: null,

                $title: null,

                $item: null,
                $opacityTrigger: null,

                $backgroundImg: null,
                $toggleExerciseOverlay: null,
                $contentToggleExerciseAnim: null,
                $backgroundToggleExerciseAnim: null
            },

            OPTIONS = {
                MQ_NAV_ITEMS_ONE_COLUMN: "(max-width: 479px)",

                OVERLAY_COLOR: "black"
            },

            STATE = {
                HIDDEN: "HIDDEN",
                SHOW: "SHOW",
                DEFAULT: "DEFAULT",
                NAV_TRANSITION: "NAV_TRANSITION",
                SHOW_OVERLAY: "SHOW_OVERLAY",
                SHOW_EXERCISE: "SHOW_EXERCISE",
                EXERCISE_SHOWN: "EXERCISE_SHOWN",
                HIDE_EXERCISE: "HIDE_EXERCISE",
                HIDE_OVERLAY: "HIDE_OVERLAY",
                HIDE: "HIDE"
            },

            ANIM_POSITION = {
                SHOW_END: "p1",
                SHOW_OVERLAY_END: "p2"
            },

            NO_JS_LINK_PREFIX = /^#_/,

            currentState = STATE.HIDDEN,
            started = false,

            onStartFn = null,

            parallax = null,

            backgroundLoaded = false,
            subsectionsBackgroundsLoaded = false,

            exercises = {},

            currentExerciseId = "",
            nextExerciseIdQueue = "",
            hideExerciseAfterShowExercise = false,

            showTimeline = null,

            $currentShowDeferred = null,
            $currentHideDeferred = null,
            $hideSectionDeferred = null,

            toggleOverlayTransitionTimeout,

            getId = function () {

                return ID.self;
            },

            get$Element = function () {

                return ELEMENT.$self;
            },

            changeLinksForJSVersion = function () {

                ELEMENT.$item.find(SELECTOR.link).each(function () {

                    ns.$t(this).attr("href", ns.$t(this).attr("href").replace(NO_JS_LINK_PREFIX, "#"));
                });
            },

            loadSubsectionsBgs = function () {

                if (!subsectionsBackgroundsLoaded) {

                    $.each(exercises, function (e, exercise) {

                        ns.SectionExercise.loadBackground(exercise);
                    });

                    subsectionsBackgroundsLoaded = true;
                }
            },

            loadImgs = function (loadSubsectionsBackgrounds) {

                if (!backgroundLoaded) {

                    ns.Section.loadImgs(ns.SectionExercises);

                    backgroundLoaded = true;
                }

                if (loadSubsectionsBackgrounds) {

                    loadSubsectionsBgs();
                }
            },

            preloadImgs = function (event, data) {

                if (!backgroundLoaded && data.section === ns.SectionGeneralInfo.getId()) {

                    loadImgs();
                }

                if (!data.subsection && data.section === getId()) {

                    loadImgs();
                    loadSubsectionsBgs();
                }

                if (backgroundLoaded && subsectionsBackgroundsLoaded) {

                    ns.$win.off("SectionNavigator__change.SectionExercises." + ns);
                }
            },

            setOverlayState = function (visible, animateClass) {

                ELEMENT.$toggleExerciseOverlay.css({
                    transform: "scale(" + (visible ? 1 : 0) + ")"
                });

                if (animateClass) {

                    ELEMENT.$toggleExerciseOverlay[visible ? "addClass": "removeClass"](CLASS.overlayAnimate);
                }
            },

            findActiveItem = function () {

                var $item = ELEMENT.$item.filter("." + CLASS.itemActive);

                return {
                    $item: $item,
                    linkEl: $item.find(SELECTOR.link)[0]
                };
            },

            showSubsection = function (subsectionId) {

                var fullId = ns.SectionNavigator.getFullId(getId(), subsectionId);

                if (currentState === STATE.HIDE || currentState === STATE.HIDDEN || fullId === currentExerciseId) {

                    return;
                }

                hideExerciseAfterShowExercise = false;

                nextExerciseIdQueue = null;

                if (subsectionId) {

                    nextExerciseIdQueue = fullId;

                    switch (currentState) {

                        case STATE.NAV_TRANSITION:
                        case STATE.DEFAULT:

                            initShowNextExercise();

                            break;

                        case STATE.EXERCISE_SHOWN:

                            hideCurrentExercise();

                            break;

                        case STATE.SHOW_OVERLAY:

                            switchActiveItemByHref(nextExerciseIdQueue);

                            break;
                    }

                } else if (currentState === STATE.EXERCISE_SHOWN) {

                    hideCurrentExercise();

                } else if (currentState === STATE.NAV_TRANSITION) {

                    ELEMENT.$opacityTrigger.off("transitionend." + ns);
                    ELEMENT.$item.removeClass(CLASS.itemActive);

                    currentState = STATE.DEFAULT;

                } else if (currentState === STATE.SHOW_EXERCISE) {

                    hideExerciseAfterShowExercise = true;
                }
            },

            findNavItemByHref = function (href) {

                var linkEl = ELEMENT.$item.find("[href=\"#" + href + "\"]")[0];

                return {
                    linkEl: linkEl,
                    $item: ns.$t(linkEl).closest(SELECTOR.item)
                };
            },

            switchActiveItemByHref = function (href) {

                var navItem = findNavItemByHref(href);

                ELEMENT.$item.removeClass(CLASS.itemActive);
                navItem.$item.addClass(CLASS.itemActive);
            },

            switchActiveItem = function ($item) {

                ELEMENT.$item.removeClass(CLASS.itemActive);
                $item.addClass(CLASS.itemActive);
            },

            initShowNextExercise = function (onlyShowExercise) {

                if (!nextExerciseIdQueue || !exercises[nextExerciseIdQueue]) {

                    return;
                }

                var navItem = findNavItemByHref(nextExerciseIdQueue);

                switchActiveItem(navItem.$item);

                if (onlyShowExercise) {

                    showExerciseByLinkEl(navItem.linkEl, onlyShowExercise);

                    return;
                }

                var $opacityTrigger = ns.$t(navItem.linkEl).find(SELECTOR.opacityTrigger);

                ELEMENT.$opacityTrigger.off("transitionend." + ns);

                if (parseFloat($opacityTrigger.css("opacity")) === 0) {

                    if (currentState === STATE.DEFAULT) {

                        showExerciseByLinkEl(navItem.linkEl);
                    }

                    return;
                }

                currentState = STATE.NAV_TRANSITION;

                $opacityTrigger.on("transitionend." + ns, function (event) {

                    if (event.originalEvent.target === event.target && event.originalEvent.propertyName === "opacity") {

                        $opacityTrigger.off("transitionend." + ns);

                        if (parseFloat($opacityTrigger.css("opacity")) < 0.99 && currentState === STATE.NAV_TRANSITION) {

                            showExerciseByLinkEl(navItem.linkEl);
                        }
                    }
                });
            },

            show = function (subsectionId) {

                var $deferred = $.Deferred();

                if (currentState !== STATE.HIDE) {

                    currentState = STATE.SHOW;

                    $hideSectionDeferred = null;

                    ELEMENT.$self.css("display", "");

                    ns.Section.resetScrollTop(ns.SectionExercises);

                    if (!started) {

                        start(subsectionId);

                    } else {

                        ns.Controller.initForSection(ns.SectionExercises);

                        initHideExerciseOnESC();

                        showTimeline.restart();

                        ELEMENT.$content.css("display", "");
                        ELEMENT.$backgroundImg.addClass(CLASS.backgroundImgShow);

                        if (subsectionId) {

                            nextExerciseIdQueue = ns.SectionNavigator.getFullId(getId(), subsectionId);

                            showTimeline.seek(ANIM_POSITION.SHOW_END, false);

                            initShowNextExercise(true);

                        } else {

                            parallax.enable();
                        }
                    }
                }

                ns.Section.focusToTarget(ns.SectionExercises);

                $deferred.resolve();

                return $deferred;
            },

            execHideAfterOverlayDone = function () {

                currentState = STATE.HIDE;

                var $deferred = $.Deferred();

                $hideSectionDeferred = $deferred;

                return $deferred;
            },

            execHideViaCurrentExerciseHide = function () {

                currentState = STATE.HIDE;

                var $deferred = $.Deferred();

                $hideSectionDeferred = $deferred;

                hideCurrentExercise();

                return $deferred;
            },

            execHideAfterCurrentExerciseShows = function () {

                currentState = STATE.HIDE;

                var $deferred = $.Deferred();

                $currentShowDeferred.then(function () {

                    hideExerciseAfterShowExercise = false;

                    $hideSectionDeferred = $deferred;

                    hideCurrentExercise();
                });

                return $deferred;
            },

            execHideAfterCurrentExerciseHides = function () {

                currentState = STATE.HIDE;

                var $deferred = $.Deferred();

                $currentHideDeferred.then(function () {

                    execHideSection();

                    $deferred.resolve();
                });

                return $deferred;
            },

            execDefaultHide = function () {

                currentState = STATE.HIDE;

                return ns.Section.hide(ns.SectionExercises, function () {

                    execHideSection();
                });
            },

            execHideSection = function () {

                if (parallax) {

                    parallax.disable();
                }

                if (showTimeline) {

                    showTimeline.stop();
                }

                destroyHideExerciseOnESC();

                ns.Controller.destroy(true);

                ELEMENT.$self.hide();

                ELEMENT.$content.removeClass(CLASS.contentShowShadow);
                ELEMENT.$backgroundImg.removeClass(CLASS.backgroundImgShow);
                ELEMENT.$item.removeClass(CLASS.itemActive)
                    .removeClass(CLASS.itemShow);

                ELEMENT.$contentToggleExerciseAnim.css({
                    transform: ""
                });

                ELEMENT.$toggleExerciseOverlay
                    .off("transitionend." + ns);

                setOverlayState(false, true);

                clearTimeout(toggleOverlayTransitionTimeout);

                currentState = STATE.HIDDEN;
            },

            finishHideWhenOverlayShown = function () {

                execHideSection();

                $hideSectionDeferred.resolve();
            },

            finishHideAfterOverlayHidden = function () {

                execDefaultHide().then(function () {

                    $hideSectionDeferred.resolve();
                });
            },

            isSectionHideDeferred = function () {

                return !!$hideSectionDeferred;
            },

            hide = function () {

                if (currentState === STATE.HIDE || currentState === STATE.HIDDEN) {

                    var $deferred = $.Deferred();

                    $deferred.resolve();

                    if (showTimeline) {

                        showTimeline.stop();
                    }

                    return $deferred;
                }

                nextExerciseIdQueue = null;
                $hideSectionDeferred = null;

                ELEMENT.$opacityTrigger.off("transitionend." + ns);

                switch (currentState) {

                    case STATE.HIDE_EXERCISE:

                        return execHideAfterCurrentExerciseHides();

                    case STATE.SHOW_EXERCISE:

                        return execHideAfterCurrentExerciseShows();

                    case STATE.EXERCISE_SHOWN:

                        return execHideViaCurrentExerciseHide();

                    case STATE.HIDE_OVERLAY:
                    case STATE.SHOW_OVERLAY:

                        return execHideAfterOverlayDone();

                    default:

                        ELEMENT.$item.removeClass(CLASS.itemActive);

                        return execDefaultHide();
                }
            },

            centerContentAnimTransformOrigin = function (contentRect) {

                ELEMENT.$contentToggleExerciseAnim.css({
                    transformOrigin: ((window.innerWidth / 2) - contentRect.left) + "px " + ((window.innerHeight / 2) - contentRect.top) + "px"
                });
            },

            initBackgroundParallax = function (disable) {

                parallax = ns.SectionParallax.add(
                        getId(),
                        get$Element()
                            .find(ns.SectionParallax.getParallaxSelector())
                            .filter(function () {
                                return ns.$t(this).closest(ns.Section.SELECTOR.self).attr("id") === getId();
                            })
                    );

                if (disable) {

                    parallax.disable();
                }
            },

            getRectDataForOverlay = function (linkEl) {

                return {
                    link: $.extend(ns.$t(linkEl).offset(), {
                        width: linkEl.offsetWidth,
                        height: linkEl.offsetHeight
                    }),
                    overlay: ELEMENT.$toggleExerciseOverlay[0].getBoundingClientRect(),
                    content: ELEMENT.$contentToggleExerciseAnim[0].getBoundingClientRect()
                };
            },

            onHideOverlayComplete = function (activeLinkEl) {

                currentState = STATE.DEFAULT;

                if (activeLinkEl) {

                    if (!ns.$t(document.activeElement).closest(SELECTOR.content).length) {

                        activeLinkEl.focus();
                    }

                    ELEMENT.$item.removeClass(CLASS.itemActive);
                }

                if (isSectionHideDeferred()) {

                    finishHideAfterOverlayHidden();

                    return;
                }

                if (nextExerciseIdQueue) {

                    initShowNextExercise();
                }
            },

            setOverlayTransformToNavLink = function (rects) {

                ELEMENT.$toggleExerciseOverlay.css({
                    transform: [
                        "translateX(" + rects.link.left + "px)",
                        "translateY(" + rects.link.top + "px)",
                        "scaleY(" + (rects.link.height / rects.overlay.height) + ")",
                        "scaleX(" + (rects.link.width / rects.overlay.width) + ")"
                    ].join(" ")
                });
            },

            onExerciseHideDone = function () {

                $currentHideDeferred = null;

                if (isSectionHideDeferred()) {

                    finishHideWhenOverlayShown();

                    return;
                }

                if (nextExerciseIdQueue) {

                    currentExerciseId = null;

                    initShowNextExercise(true);

                    return;
                }

                currentState = STATE.HIDE_OVERLAY;

                ELEMENT.$self.addClass(CLASS.hasActiveExercise);
                ELEMENT.$content.css("display", "");
                ELEMENT.$contentToggleExerciseAnim.css({
                    transform: "none",
                    transition: "none"
                });

                setOverlayState(true);

                var activeLinkEl = findActiveItem().linkEl,

                    rects = getRectDataForOverlay(activeLinkEl);

                ELEMENT.$contentToggleExerciseAnim.css("transform", "");

                centerContentAnimTransformOrigin(rects.content);

                //bez tohoto se v Chrome nespustí transition
                ELEMENT.$contentToggleExerciseAnim.css(["transform", "transition"]);

                toggleOverlayTransitionTimeout = setTimeout(function() {

                    ELEMENT.$toggleExerciseOverlay.on("transitionend." + ns, function (event) {

                        if (event.originalEvent.target !== event.target) {

                            return;
                        }

                        ELEMENT.$toggleExerciseOverlay.off("transitionend." + ns);
                        setOverlayState(false, true);

                        onHideOverlayComplete(activeLinkEl);
                    });

                    setOverlayTransformToNavLink(rects);

                    ELEMENT.$toggleExerciseOverlay.addClass(CLASS.overlayAnimate);
                    ELEMENT.$contentToggleExerciseAnim.css("transition", "");
                    ELEMENT.$self.removeClass(CLASS.hasActiveExercise);

                    parallax.enable();
                }, 0);
            },

            hideCurrentExercise = function () {

                if (!currentExerciseId ||
                    (currentState !== STATE.EXERCISE_SHOWN && currentState !== STATE.HIDE)
                ) {

                    return;
                }

                currentState = STATE.HIDE_EXERCISE;

                $currentHideDeferred = exercises[currentExerciseId]
                        .hide()
                        .then(onExerciseHideDone);

                currentExerciseId = null;
            },

            onExerciseShowDone = function () {

                currentState = STATE.EXERCISE_SHOWN;

                $currentShowDeferred = null;

                setOverlayState(true, true);

                if ((nextExerciseIdQueue && nextExerciseIdQueue !== currentExerciseId) || hideExerciseAfterShowExercise) {

                    hideCurrentExercise();
                }

                hideExerciseAfterShowExercise = false;
            },

            onShowOverlayComplete = function () {

                if ($hideSectionDeferred) {

                    finishHideWhenOverlayShown();

                    return;
                }

                if (parallax) {

                    parallax.disable();
                }

                if (hideExerciseAfterShowExercise || !nextExerciseIdQueue) {

                    onExerciseHideDone();

                    return;
                }

                currentState = STATE.SHOW_EXERCISE;

                currentExerciseId = nextExerciseIdQueue;

                $currentShowDeferred = exercises[nextExerciseIdQueue]
                    .show()
                    .then(onExerciseShowDone);

                ELEMENT.$content.hide();

                nextExerciseIdQueue = null;
            },

            showExerciseByLinkEl = function (linkEl, onlyShowExercise) {

                currentState = STATE.SHOW_OVERLAY;

                ELEMENT.$toggleExerciseOverlay.off("transitionend." + ns);

                setOverlayState(true);

                ELEMENT.$self
                    .addClass(CLASS.hasActiveExercise);

                if (onlyShowExercise) {

                    onShowOverlayComplete();

                    return;
                }

                var rects = getRectDataForOverlay(linkEl);

                centerContentAnimTransformOrigin(rects.content);

                setOverlayTransformToNavLink(rects);

                ELEMENT.$toggleExerciseOverlay.on("transitionend." + ns, function (event) {

                    if (event.originalEvent.target !== event.target) {

                        return;
                    }

                    ELEMENT.$toggleExerciseOverlay.off("transitionend." + ns);

                    onShowOverlayComplete();
                });

                toggleOverlayTransitionTimeout = setTimeout(setOverlayState.bind(null, true, true), 0);
            },

            getItemGlowAnimData = function (itemEl, itemGlowEl, mouseClientPos) {

                var glowBgImage = ns.$t(itemGlowEl).css("backgroundImage") || "",
                    glowBgPosData = glowBgImage.match(/[0-9.]+/g) || [57, 57],
                    glowBgPos = {
                        x: +glowBgPosData[0],
                        y: +glowBgPosData[1]
                    },

                    itemRect = itemEl.getBoundingClientRect(),
                    x = mouseClientPos.x - itemRect.left,
                    y = mouseClientPos.y - itemRect.top,

                    hRatio = x / itemRect.width,
                    vRatio = y / itemRect.height,

                    color = ns.$t(itemEl).css("color"),
                    transparent = color.replace(")", ", 0)").replace("rgb", "rgba");

                return {
                    from: glowBgPos,
                    to: {
                        x: 52 + (8 * hRatio),
                        y: 52 + (8 * vRatio)
                    },
                    color: color,
                    transparent: transparent
                };
            },

            animateNavItemGlow = function (event) {

                if (currentState === STATE.HIDE || currentState === STATE.HIDDEN) {

                    return;
                }

                var itemEl = event.originalEvent.currentTarget,
                    itemGlowEl = itemEl.querySelector(SELECTOR.itemGlow),

                    itemGlowData = getItemGlowAnimData(itemEl, itemGlowEl, {
                        x: event.clientX,
                        y: event.clientY
                    }),

                    to = {
                        x: itemGlowData.to.x,
                        y: itemGlowData.to.y,

                        ease: Power1.easeOut,

                        onUpdate: function () {

                            if (currentState === STATE.HIDE || currentState === STATE.HIDDEN) {

                                return;
                            }

                            var x = itemGlowData.from.x + ((this.vars.x - itemGlowData.from.x) * this.ratio),
                                y = itemGlowData.from.y + ((this.vars.y - itemGlowData.from.y) * this.ratio);

                            itemGlowEl.style.background = "radial-gradient(circle at " + x + "% " + y + "%, " + itemGlowData.transparent + " 50%, " + itemGlowData.color + " 100%)";
                        }
                    };

                if (!itemGlowData.color.match(/rgb/)) {

                    return;
                }

                TweenMax.to(itemGlowData.from, 0.5, to);
            },

            hideSubsection = function () {

                if (currentState === STATE.HIDE || currentState === STATE.HIDDEN) {

                    return;
                }

                ns.SectionNavigator.goToSection(getId());
            },

            destroyHideExerciseOnESC = function () {

                ns.$win.off("keyup." + ns);
            },

            initHideExerciseOnESC = function () {

                destroyHideExerciseOnESC();

                ns.$win.on("keyup." + ns, function (event) {

                    if (event.which === 27) { //ESC

                        if (currentState === STATE.EXERCISE_SHOWN || currentState === STATE.SHOW_EXERCISE) {

                            hideSubsection();
                        }
                    }
                });
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

                        ease: Power2.easeOut,
                        delay: 0.35
                    },

                    stagger = {
                        amount: 0.5,
                        ease: Power0.easeIn
                    };

                return TweenMax.staggerFromTo(wordEls, 1.65, from, to, stagger);
            },

            getShowItemsTween = function () {

                var oneColumn = window.matchMedia(OPTIONS.MQ_NAV_ITEMS_ONE_COLUMN),
                    itemsCount = ELEMENT.$item.length,

                    from = {
                        _animValue: 0
                    },

                    to = {
                        _animValue: 1,

                        delay: 1,

                        onStart: function () {

                            this.target.classList.add(CLASS.itemShow);
                        }
                    },

                    stagger = {
                        amount: itemsCount / 10,
                        ease: Power0.easeIn,
                        grid: oneColumn.matches ? [1, itemsCount] : [2, Math.ceil(itemsCount / 2)],
                        from: 0
                    };

                return TweenMax.staggerFromTo(ELEMENT.$item.toArray(), 0.01, from, to, stagger);
            },

            initEvents = function () {

                initHideExerciseOnESC();

                ELEMENT.$item.on("mousemove." + ns, animateNavItemGlow);

                ELEMENT.$self.on("click." + ns, SELECTOR.link, function (event) {

                    event.preventDefault();

                    if (currentState === STATE.HIDE || currentState === STATE.HIDDEN) {

                        return;
                    }

                    ns.SectionNavigator.goToSection(
                        event.currentTarget.href.split("#")[1]
                    );
                });
            },

            initElements = function (startedWithSubsection) {

                loadImgs(!startedWithSubsection);

                ELEMENT.$backgroundImg = ELEMENT.$self.find(SELECTOR.backgroundImg);

                ELEMENT.$content = ELEMENT.$self.find(SELECTOR.content);
                ELEMENT.$title = ELEMENT.$self.find(SELECTOR.title);
                ELEMENT.$item = ELEMENT.$self.find(SELECTOR.item);
                ELEMENT.$opacityTrigger = ELEMENT.$self.find(SELECTOR.opacityTrigger);

                ELEMENT.$backgroundToggleExerciseAnim = ELEMENT.$self.find(SELECTOR.backgroundToggleExerciseAnim);
                ELEMENT.$contentToggleExerciseAnim = ELEMENT.$self.find(SELECTOR.contentToggleExerciseAnim);
                ELEMENT.$toggleExerciseOverlay = ELEMENT.$self.find(SELECTOR.toggleExerciseOverlay);

                changeLinksForJSVersion();

                ns.BreakText.processElement(ELEMENT.$title[0], true);

                ns.Controller.initForSection(ns.SectionExercises);
            },

            initContent = function (skipToEnd) {

                showTimeline = new TimelineMax();

                var showTitleTween = getShowTitleTween(),
                    showItemsTween = getShowItemsTween(),
                    showControllerTween = ns.Controller.getShowTween();

                showTimeline.add(showTitleTween, 0);
                showTimeline.add(showItemsTween, 0);
                showTimeline.add(showControllerTween, "-=0.25");

                ELEMENT.$backgroundImg.addClass(CLASS.backgroundImgShow);

                showTimeline.eventCallback("onStart", function () {

                    ELEMENT.$content.removeClass(CLASS.contentShowShadow);
                });

                showTimeline.eventCallback("onComplete", function () {

                    currentState = STATE.DEFAULT;

                    if (nextExerciseIdQueue) {

                        initShowNextExercise();
                    }

                    ELEMENT.$content.addClass(CLASS.contentShowShadow);
                });

                showTimeline.addLabel(ANIM_POSITION.SHOW_END);

                if (skipToEnd) {

                    showTimeline.seek(ANIM_POSITION.SHOW_END, false);
                }
            },

            start = function (subsectionId) {

                if (started) {

                    return;
                }

                currentState = STATE.SHOW;

                started = true;

                if (onStartFn) {

                    onStartFn();
                }

                initElements(!!subsectionId);
                initEvents();
                initBackgroundParallax(!!subsectionId);
                initContent(!!subsectionId);

                ns.Section.focusToTarget(ns.SectionExercises);

                if (subsectionId) {

                    nextExerciseIdQueue = ns.SectionNavigator.getFullId(getId(), subsectionId);

                    initShowNextExercise(true);
                }
            },

            registerExercise = function (exercise) {

                if (!exercise.getId || !exercise.get$Element || !exercise.show || !exercise.hide) {

                    throw "Implement all required methods: getId, get$Element, show, hide!";
                }

                exercises[exercise.getId()] = exercise;

                exercise.get$Element().hide();
            },

            init = function (onStart) {

                ELEMENT.$self = $(SELECTOR.self);

                onStartFn = onStart;

                ns.SectionNavigator.registerSection(ns.SectionExercises);

                if (ns.SectionNavigator.isCurrent(ns.SectionExercises)) {

                    start(ns.SectionNavigator.getCurrentSubsectionId());
                }

                ns.$win.on("SectionNavigator__change.SectionExercises." + ns, preloadImgs);
            };

        return {
            init: init,

            getId: getId,
            get$Element: get$Element,

            show: show,
            hide: hide,

            showSubsection: showSubsection,
            hideSubsection: hideSubsection,

            registerExercise: registerExercise
        };

    }());

}((function (ns) { window[ns] = window[ns] || { toString: function () { return ns; } }; return window[ns]; }("MJNS")), jQuery));
