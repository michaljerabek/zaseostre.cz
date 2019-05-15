/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery, window, TweenMax*/

(function (ns, $) {

    ns.SectionText = (function () {

        var CLASS = {
                textCurrent: "section-text__text--current",

                animStared: "anim-started",
                highlight: "highlight"
            },

            SELECTOR = {
                texts: ".section-text__texts",
                text: ".section-text__text",
                textCurrent: "." + CLASS.textCurrent,

                findTextAnimContent: [
                    "h3:not(.visually-hidden)", "p", ".btn"
                ].join(":not(.x-screen):not(.x-js), "),

                findBtn: ".section-text__btn:not(.x-screen):not(.x-js)",

                animStared: "." + CLASS.animStared
            },

            ELEMENT = {
                $textAnimContent: null,

                $texts: null,
                $text: null,
                $textPs: null,

                $btn: null
            },

            STATE = {
                HIDDEN: "HIDDEN",
                DEFAULT: "DEFAULT",
                SHOW_TEXT: "SHOW_TEXT",
                HIDE_TEXT: "HIDE_TEXT",
                HIDE: "HIDE"
            },

            currentState = STATE.HIDDEN,
            currentSection = null,

            hasController = false,

            showTimeline,
            hideTimeline,

            nextTextIdQueue = "",
            nextTextIdQueueUseRedirect = false,

            getFirstTextSubsectionId = function () {

                var id = ELEMENT.$text.first().attr("id");

                return !id ? null: id.split(
                    ns.SectionNavigator.getSubsectionDivider()
                )[1];
            },

            get$TextBySubsectionId = function (subsectionId) {

                return ELEMENT.$text.filter(
                    "#" + ns.SectionNavigator.getFullId(currentSection.getId(), subsectionId)
                );
            },

            get$CurrentText = function () {

                return ELEMENT.$text.filter(SELECTOR.textCurrent);
            },

            showSubsection = function (subsectionId) {

                nextTextIdQueueUseRedirect = false;

                if (!subsectionId) {

                    subsectionId = getFirstTextSubsectionId();
                }

                return showText(subsectionId);
            },

            hide = function () {

                currentState = STATE.HIDE;

                nextTextIdQueue = "";
                nextTextIdQueueUseRedirect = false;

                return ns.Section.hide(currentSection, function () {

                    if (showTimeline) {

                        showTimeline.pause();
                        showTimeline = null;
                    }

                    if (hideTimeline) {

                        hideTimeline.pause();
                        hideTimeline = null;
                    }

                    if (hasController) {

                        ns.Controller.destroy(true);
                    }

                    clearFullContentElements();

                    ELEMENT = {};
                    currentSection = null;

                    currentState = STATE.HIDDEN;
                });
            },

            clearFullContentElements = function () {

                if (ELEMENT.$btn.length) {

                    ns.Tweens.SectionTextShowBtnTween.clear(ELEMENT.$btn);
                }
            },

            getShowTextTween = function (els, isHighlited) {

                var to = {
                        y: "0%",
                        opacity: 1,

                        ease: Power3.easeOut,

                        onStart: function () {

                            this.target.classList.add(CLASS.animStared);
                        }
                    },

                    stagger = {
                        amount: els.length / (isHighlited ? 50: 100),
                        ease: Power0.easeOut
                    };

                return TweenMax.staggerTo(els, 0.95, to, stagger);
            },

            getHideTextTween = function (els, isHighlited) {

                els = els.filter(function (el) {

                    return el.classList.contains(CLASS.animStared);
                });

                var to = {
                        y: "50%",
                        opacity: 0,

                        ease: Power3.easeOut,

                        onComplete: function () {

                            this.target.classList.remove(CLASS.animStared);
                        }
                    },

                    stagger = {
                        amount: els.length / (isHighlited ? 87.5: 175),
                        ease: Power0.easeOut
                    };

                return TweenMax.staggerTo(els, 0.75, to, stagger);
            },

            addHideContentAnims = function ($currentText) {

                var $textCurrentAnimContent = $currentText.find(SELECTOR.findTextAnimContent);

                $textCurrentAnimContent.each(function (index) {

                    if (this.querySelector(SELECTOR.animStared) || this.classList.contains(CLASS.animStared)) {

                        if (ns.$t(this).is(ns.SELECTOR.btn)) {

                            var hideBtnTween = ns.Tweens.SectionTextHideBtnTween.get(this);

                            hideTimeline.add(hideBtnTween, index ? "-=0.6" : "0");

                            return;
                        }

                        var isHighlited = this.classList.contains(CLASS.highlight),

                            els = ns.BreakText.getEls(
                                this, isHighlited ? ns.BreakText.EL.LETTER_SPACE: ns.BreakText.EL.WORD_SPACE
                            );

                        hideTimeline.add(
                            getHideTextTween(els, isHighlited), index ? isHighlited ? "-=0.75" : "-=0.6" : "0"
                        );
                    }
                });
            },

            fixCurrentTextsHeight = function () {

                var height = ELEMENT.$texts.height();

                ELEMENT.$texts.height(height);
            },

            onHideCurrentTextDone = function ($hidingText, $willBeCurrent) {

                currentState = STATE.DEFAULT;

                hideTimeline = null;

                fixCurrentTextsHeight();

                $hidingText
                    .hide()
                    .removeClass(CLASS.textCurrent);

                $hidingText
                    .find(SELECTOR.animStarted)
                    .removeClass(CLASS.animStared);

                if (nextTextIdQueue) {

                    if (nextTextIdQueueUseRedirect) {

                        ns.SectionNavigator.goToSection(nextTextIdQueue);

                        nextTextIdQueue = "";
                        nextTextIdQueueUseRedirect = false;

                        return;
                    }

                    $willBeCurrent = ELEMENT.$text.filter("#" + nextTextIdQueue);

                    nextTextIdQueue = "";
                    nextTextIdQueueUseRedirect = false;
                }

                showCurrentText($willBeCurrent);
            },

            hideCurrentText = function ($willBeCurrent) {

                if (currentState === STATE.HIDDEN || currentState === STATE.HIDE || currentState === STATE.HIDE_TEXT) {

                    return;
                }

                if (currentState === STATE.SHOW_TEXT) {

                    showTimeline.pause();
                    showTimeline = null;
                }

                currentState = STATE.HIDE_TEXT;

                var $currentText = get$CurrentText();

                ns.Section.resetScrollTop(currentSection, true);

                hideTimeline = new TimelineMax();

                addHideContentAnims($currentText);

                hideTimeline.eventCallback("onComplete", function () {

                    onHideCurrentTextDone($currentText, $willBeCurrent);

                    $currentText.attr("aria-live", "polite");
                });
            },

            addTextsHeightAnim = function ($currentText) {

                var padding = ELEMENT.$texts.css([
                        "padding-top",
                        "padding-bottom"
                    ]),
                    paddingSum = parseInt(padding["padding-top"]) + parseInt(padding["padding-bottom"]),
                    height = $currentText.height() + paddingSum;

                showTimeline.add(TweenMax.to(ELEMENT.$texts[0], 1.25, {
                    height: height,

                    ease: Power3.easeOut,

                    clearProps: "all"
                }));
            },

            setControllerBtnState = function (currentTextId) {

                if (hasController) {

                    ns.Controller.setBtnState(currentTextId);
                }
            },

            addShowControls = function () {

                if (ELEMENT.$btn.length && !ns.Tweens.SectionTextShowBtnTween.isVisible(ELEMENT.$btn)) {

                    showTimeline.add(ns.Tweens.SectionTextShowBtnTween.get(ELEMENT.$btn), "-=0.9");
                }

                if (hasController && !ns.Controller.isVisible()) {

                    showTimeline.add(ns.Controller.getShowTween(), "-=0.675");
                }
            },

            addShowContentAnims = function ($currentText, noHeightAnim) {

                var $textNextAnimContent = $currentText.find(SELECTOR.findTextAnimContent),

                    prevWasBtn = false;

                $textNextAnimContent.each(function (index) {

                    if (ns.$t(this).is(ns.SELECTOR.btn)) {

                        ns.Tweens.SectionTextShowBtnTween.clear(this);

                        var showBtnTween = ns.Tweens.SectionTextShowBtnTween.get(this, true);

                        showTimeline.add(showBtnTween,
                            index ?
                                prevWasBtn    ? "-=1.15": "-=0.85":
                                !noHeightAnim ? "-=1.25":   "0"
                        );

                        prevWasBtn = true;

                        return;
                    }

                    var isHighlited = this.classList.contains(CLASS.highlight);

                    ns.BreakText.processElement(this, !isHighlited);

                    var els = ns.BreakText.getEls(
                        this, isHighlited ? ns.BreakText.EL.LETTER_SPACE: ns.BreakText.EL.WORD_SPACE
                    );

                    TweenMax.set(els, {
                        y: "-50%",
                        opacity: 0
                    });

                    showTimeline.add(
                        getShowTextTween(els, isHighlited), index ? "-=0.85" : !noHeightAnim ? "-=1.25" : "0"
                    );

                    prevWasBtn = false;
                });
            },

            showCurrentText = function ($currentText, noHeightAnim) {

                if (currentState === STATE.HIDDEN || currentState === STATE.HIDE || currentState === STATE.SHOW_TEXT) {

                    return;
                }

                currentState = STATE.SHOW_TEXT;

                $currentText
                    .css("display", "")
                    .addClass(CLASS.textCurrent);

                showTimeline = new TimelineMax();

                if (!noHeightAnim) {

                    addTextsHeightAnim($currentText);

                } else {

                    ELEMENT.$texts.css("height", "");
                }

                addShowContentAnims($currentText, noHeightAnim);
                addShowControls();

                setControllerBtnState(
                    $currentText.attr("id")
                );

                showTimeline.eventCallback("onComplete", function () {

                    currentState = STATE.DEFAULT;

                    showTimeline = null;
                });
            },

            showText = function (subsectionId, removeAriaLive) {

                if (currentState === STATE.HIDDEN || currentState === STATE.HIDE) {

                    return;
                }

                if (subsectionId && currentState === STATE.HIDE_TEXT) {

                    nextTextIdQueue = ns.SectionNavigator.getFullId(
                        currentSection.getId(), subsectionId
                    );

                    return;
                }

                if (currentState !== STATE.HIDE_TEXT) {

                    var $willBeCurrent;

                    if (subsectionId) {

                        $willBeCurrent = get$TextBySubsectionId(subsectionId);

                        hideCurrentText($willBeCurrent);

                        return;
                    }

                    $willBeCurrent = get$CurrentText();

                    if (removeAriaLive) {

                        $willBeCurrent.removeAttr("aria-live");
                    }

                    showCurrentText($willBeCurrent, true);
                }
            },

            setSubsectionAsCurrent = function (subsectionId) {

                if (ELEMENT.$text.length) {

                    ELEMENT.$text
                        .removeClass(CLASS.textCurrent);

                    get$TextBySubsectionId(subsectionId)
                        .addClass(CLASS.textCurrent);
                }
            },

            controllerOnPrev = function () {

                var $currentText = get$CurrentText(),
                    currentTextIndex = $currentText.index();

                if (currentTextIndex === 0) {

                    return true;
                }

                var prevTextId = ELEMENT.$text.eq(currentTextIndex - 1).attr("id");

                if (currentState !== STATE.HIDE && currentState !== STATE.HIDDEN) {

                    ns.SectionNavigator.goToSection(prevTextId);

                    return false;
                }

                nextTextIdQueue = prevTextId;
                nextTextIdQueueUseRedirect = true;

                return false;
            },

            controllerOnNext = function () {

                var $currentText = get$CurrentText(),
                    currentTextIndex = $currentText.index();

                if (currentTextIndex === ELEMENT.$text.length - 1) {

                    return true;
                }

                var nextTextId = ELEMENT.$text.eq(currentTextIndex + 1).attr("id");

                if (currentState !== STATE.HIDE && currentState !== STATE.HIDDEN) {

                    ns.SectionNavigator.goToSection(nextTextId);

                    return false;
                }

                nextTextIdQueue = nextTextId;
                nextTextIdQueueUseRedirect = true;

                return false;
            },

            initContent = function () {

                ELEMENT.$text
                    .hide()
                    .attr("aria-live", "polite");

                showText(null, true);
            },

            initElements = function () {

                ELEMENT.$texts = ELEMENT.$self.find(SELECTOR.texts);
                ELEMENT.$text = ELEMENT.$texts.find(SELECTOR.text);

                ELEMENT.$btn = ELEMENT.$self.find(SELECTOR.findBtn);

                hasController = ns.Controller.initForSection(currentSection, controllerOnPrev, controllerOnNext);

                if (hasController) {

                    ns.Controller.hide();
                }
            },

            start = function (subsectionId) {

                initElements();

                subsectionId = subsectionId || getFirstTextSubsectionId();

                if (subsectionId) {

                    setSubsectionAsCurrent(subsectionId);
                }

                clearFullContentElements();

                initContent();

                ns.Section.focusToTarget(currentSection);
            },

            initForSection = function (section, subsectionId) {

                if (currentState !== STATE.HIDDEN) {

                    return;
                }

                var $deferred = $.Deferred();

                currentState = STATE.DEFAULT;
                currentSection = section;

                ELEMENT.$self = section.get$Element();

                ELEMENT.$self.css("display", "");

                ns.Section.resetScrollTop(section);

                start(subsectionId);

                $deferred.resolve();

                return $deferred;
            };

        return {
            initForSection: initForSection,

            hide: hide,
            showSubsection: showSubsection
        };
    }());

}((function (ns) { window[ns] = window[ns] || { toString: function () { return ns; } }; return window[ns]; }("MJNS")), jQuery));
