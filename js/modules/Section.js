/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery, window, TweenMax, CustomEase*/

(function (ns, $) {

    ns.$t = ns.$t || (function ($t) { return function (e) { $t[0] = e; return $t; }; }($([null])));

    $.easing.easeOutCubic = function (x) {
        return 1 - Math.pow(1 - x, 3);
    };

    ns.Section = (function () {

        var CLASS = {
                hideTarget: "section__hide-target",
                hide2Target: "section__hide-2-target",

                contentHideScrollbar: "section__content--hide-scrollbar"
            },

            SELECTOR = {
                self: ".section",
                content: ".section__content",
                focusTarget: ".section__focus-target",

                hideTarget: ".section__hide-target",
                hide2Target: ".section__hide-2-target",

                imgToLoad: ".section__img-to-load"
            },

            EASE = {
                hideTarget: CustomEase.create("SectionHideTarget", ".74, .3, .51, .82"),
                hide2Target: CustomEase.create("SectionHide2Target", ".81, .07, .55, .9")
            },

            focusToTarget = function (section) {

                var $target = section.get$Element()
                    .find(SELECTOR.focusTarget)
                    .filter(function () {
                        return ns.$t(this).closest(SELECTOR.self).attr("id") === section.getId();
                    });

                if (typeof $target.attr("tabindex") === "undefined") {

                    $target.attr("tabindex", "-1");
                }

                $target.focus();
            },

            loadImgs = function (section, nested) {

                var $imgs = section.get$Element().find(SELECTOR.imgToLoad);

                if (!nested) {

                    $imgs = $imgs.filter(function () {

                        return ns.$t(this).closest(SELECTOR.self)[0] === section.get$Element()[0];
                    });
                }

                $imgs.each(function () {

                    var $img = ns.$t(this);

                    $img.after($img.text()).remove();
                });

                return $imgs;
            },

            resetScrollTop = function (section, animate, customScrollTop) {

                if (section) {

                    var $content = section.get$Element()
                        .find(SELECTOR.content);

                    if (animate) {

                        var currentScrollTop = $content.scrollTop(),

                            duration = Math.max(500, Math.min(currentScrollTop * 2.5, 1250)),

                            done = function () {

                                $content.css("scroll-behavior", "");
                            };

                        $content.stop()
                            .css("scroll-behavior", "auto")
                            .animate({
                                scrollTop: customScrollTop || 0
                            }, duration, "easeOutCubic", done);

                        return;
                    }

                    $content.stop()
                        .css("scroll-behavior", "auto")
                        .scrollTop(0);

                    $content.css("scroll-behavior", "");
                }
            },

            show = function () {

                var $deferred = $.Deferred();

                $deferred.resolve();

                return $deferred;
            },

            hide = function (section, done) {

                var $deferred = $.Deferred(),

                    $sectionElement = section.get$Element(),
                    $hideTarget = $sectionElement.find(SELECTOR.hideTarget),
                    $hide2Target = $sectionElement.find(SELECTOR.hide2Target),
                    $content = $sectionElement.find(SELECTOR.content),

                    onComplete = function () {

                        $sectionElement.hide();
                        $content.removeClass(CLASS.contentHideScrollbar);

                        if (typeof done === "function") {

                            done();
                        }

                        $hideTarget.css({
                            opacity: "",
                            transform: "",
                            transition: ""
                        });

                        $hide2Target.css({
                            opacity: "",
                            transform: "",
                            transition: ""
                        });

                        $deferred.resolve();
                    };

                if ($hideTarget.length) {

                    var hideTargetRect = $hideTarget[0].getBoundingClientRect(),

                        from = {
                            scale: 1,
                            transformOrigin: ((window.innerWidth / 2) - hideTargetRect.left) + "px " + ((window.innerHeight / 2) - hideTargetRect.top) + "px"
                        },

                        to = {
                            scale: 0.8725,
                            opacity: 0,

                            ease: EASE.hideTarget,

                            onComplete: $hide2Target.length ? null: onComplete
                        };

                    $hideTarget.css({
                        transition: "none"
                    });

                    TweenMax.fromTo($hideTarget[0], 1, from, to);
                }

                if ($hide2Target.length) {

                    var hide2TargetRect = $hide2Target[0] ? $hide2Target[0].getBoundingClientRect() : null,

                        from2  = {
                            scale: 1,
                            transformOrigin: ((window.innerWidth / 2) - hide2TargetRect.left) + "px " + ((window.innerHeight / 2) - hide2TargetRect.top) + "px"
                        },

                        to2 = {
                            scale: 0.8725,
                            opacity: 0,

                            ease: EASE.hide2Target,

                            onComplete: onComplete
                        };

                    TweenMax.fromTo($hide2Target[0], 1.1, from2, to2);
                }

                $content.addClass(CLASS.contentHideScrollbar);

                if (!$hideTarget.length && !$hide2Target.length) {

                    onComplete();
                }

                return $deferred;
            };

        return {
            CLASS: CLASS,
            SELECTOR: SELECTOR,

            focusToTarget: focusToTarget,

            resetScrollTop: resetScrollTop,

            hide: hide,
            show: show,

            loadImgs: loadImgs
        };
    }());

}((function (ns) { window[ns] = window[ns] || { toString: function () { return ns; } }; return window[ns]; }("MJNS")), jQuery));
