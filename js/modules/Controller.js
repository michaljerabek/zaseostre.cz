/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery, window, TweenMax*/

(function (ns, $) {

    ns.$t = ns.$t || (function ($t) { return function (e) { $t[0] = e; return $t; }; }($([null])));

    ns.Controller = (function () {

        var CLASS = {
                showBtns: "controller--show-btns"
            },

            DATA = {
                prevSection: "controller-prev-section",
                nextSection: "controller-next-section",
                disableAt: "controller-disable-at"
            },

            SELECTOR = {
                self: ".controller",

                prevBtn: ".controller__btn--prev",
                nextBtn: ".controller__btn--next"
            },

            ELEMENT = {
                $self: null,

                $prevBtn: null,
                $nextBtn: null
            },

            onPrevFn = null,
            onNextFn = null,

            isVisible = function () {

                return ELEMENT.$self.hasClass(ns.Controller.CLASS.showBtns);
            },

            getShowTween = function () {

                var useEl = ELEMENT.$self[0],

                    from = {
                        prop: 0
                    },

                    to = {
                        prop: 1,

                        onStart: function () {

                            ns.$t(useEl).addClass(ns.Controller.CLASS.showBtns);
                        }
                    };

                return TweenMax.to(from, 0.01, to);
            },

            hide = function () {

                ELEMENT.$self.removeClass(ns.Controller.CLASS.showBtns);
            },

            addFocus = function () {

                if (ELEMENT.$self.length) {

                    ELEMENT.$self
                        .attr("tabindex", "-1")
                        .focus();
                }
            },

            disablePrev = function () {

                if (ELEMENT.$prevBtn[0] === document.activeElement) {

                    ELEMENT.$nextBtn.focus();
                }

                ELEMENT.$prevBtn
                    .attr("aria-hidden", true)
                    .prop("disabled", true);
            },

            disableNext = function () {

                if (ELEMENT.$nextBtn[0] === document.activeElement) {

                    ELEMENT.$prevBtn.focus();
                }

                ELEMENT.$nextBtn
                    .attr("aria-hidden", true)
                    .prop("disabled", true);
            },

            enablePrev = function () {

                ELEMENT.$prevBtn
                    .attr("aria-hidden", false)
                    .prop("disabled", false);
            },

            enableNext = function () {

                ELEMENT.$nextBtn
                    .attr("aria-hidden", false)
                    .prop("disabled", false);
            },

            setBtnState = function (disableAt) {

                ns.Controller[ELEMENT.$prevBtn.data(DATA.disableAt) === disableAt ? "disablePrev": "enablePrev"]();
                ns.Controller[ELEMENT.$nextBtn.data(DATA.disableAt) === disableAt ? "disableNext": "enableNext"]();
            },

            clearEvents = function () {

                onPrevFn = null;
                onNextFn = null;

                if (ELEMENT.$self && ELEMENT.$self.length) {

                    ELEMENT.$prevBtn.off("click." + ns);
                    ELEMENT.$nextBtn.off("click." + ns);
                }
            },

            destroy = function(hideBtns) {

                clearEvents();

                if (hideBtns) {

                    hide();
                }
            },

            initEvents = function ()  {

                ELEMENT.$prevBtn.off("click." + ns)
                    .on("click." + ns, function (event) {

                        event.preventDefault();

                        if (onPrevFn && onPrevFn() === false) {

                            return;
                        }

                        var prevNav = ELEMENT.$prevBtn.attr("data-" + DATA.prevSection);

                        ns.SectionNavigator.goToSection(prevNav);
                    });

                ELEMENT.$nextBtn.off("click." + ns)
                    .on("click." + ns, function (event) {

                        event.preventDefault();

                        if (onNextFn && onNextFn() === false) {

                            return;
                        }

                        var nextNav = ELEMENT.$nextBtn.attr("data-" + DATA.nextSection);

                        ns.SectionNavigator.goToSection(nextNav);
                    });
            },

            initElements = function (section, focus) {

                ELEMENT.$self = section.get$Element()
                    .find(SELECTOR.self);

                if (focus) {

                    addFocus();
                }

                if (ELEMENT.$self.length) {

                    ELEMENT.$prevBtn = ELEMENT.$self.find(SELECTOR.prevBtn);
                    ELEMENT.$nextBtn = ELEMENT.$self.find(SELECTOR.nextBtn);
                }
            },

            initForSection = function (section, onPrev, onNext, focus) {

                clearEvents();

                onPrevFn = onPrev;
                onNextFn = onNext;

                initElements(section, focus);

                if (ELEMENT.$self.length) {

                    initEvents();
                }

                return ELEMENT.$self.length;
            };

        return {
            CLASS: CLASS,

            initForSection: initForSection,
            destroy: destroy,

            getShowTween: getShowTween,
            hide: hide,
            focus: addFocus,
            isVisible: isVisible,

            disablePrev: disablePrev,
            disableNext: disableNext,
            enablePrev: enablePrev,
            enableNext: enableNext,
            setBtnState: setBtnState
        };
    }());

}((function (ns) { window[ns] = window[ns] || { toString: function () { return ns; } }; return window[ns]; }("MJNS")), jQuery));
