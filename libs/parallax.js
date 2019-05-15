/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global FULLTILT, window, document, setTimeout, clearTimeout, navigator, IntersectionObserver*/

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.Parallax = factory();
    }
}(typeof self !== "undefined" ? self : this, function () {

    var TRANSFORM_PROP = (function () {

            var el = document.createElement("div"),

                prefixes = ["o", "ms", "moz", "webkit"],

                use = "transform",

                p = prefixes.length - 1, prop;

            for (p; p >= 0; p--) {

                prop = prefixes[p] + "Transform";

                if (el.style[prop] !== undefined) {

                    return prop;
                }
            }

            return use;
        }()),

        TRANSFORM_3D = (function () {

            var el = document.createElement("div");

            el.style[TRANSFORM_PROP] = "translate3d(0,0,0)";

            return !!el.style[TRANSFORM_PROP] && !window.navigator.userAgent.match(/Trident/);
        }()),

        SUPPORTS_TRANSFORM = document.body.style[TRANSFORM_PROP] !== undefined,

        SUPPORTS_INTERSECTION_OBSERVER = !!window.IntersectionObserver,
        SUPPORTS_RESIZE_OBSERVER = !!window.ResizeObserver,

        SUPPORTS_RAF = !!window.requestAnimationFrame;


    var extend = function () {

        var i = 1, key;

        for (i; i < arguments.length; i++) {

            for (key in arguments[i]) {

                if (arguments[i].hasOwnProperty(key)) {

                    arguments[0][key] = arguments[i][key];
                }
            }
        }

        return arguments[0];
    };


    var ParallaxController = (function () {

        var TILT_LIMIT = 67.5,
            FAKE_TILT_REDUCER = 0.35,

            TYPE_TILT = 1,
            TYPE_SCROLL = 2,
            TYPE_FAKE_TILT = 3,

            isMobile = /Mobi/.test(navigator.userAgent),

            initialized = false,
            watchingTilt = false,
            scrollAndFakeTiltEventsActivated = false,

            instanceCounter = 0,
            parallaxInstances = {},

            refreshDebounce = {},

            rafUpdate,
            parallaxesToUpdate = [],

            intersectionObserver,
            intersectingParallaxes = { length: 0 },

            winHeight = 0,
            realWinHeight = 0,
            winWidth = 0,
            winScrollTop = 0,

            initialBeta = null,
            currentTiltX = 0,
            currentTiltY = 0,

            lastTiltWasFake = false,

            updateParallaxesScroll,

            _getRealWinHeight = function () {

                return document.documentElement.clientHeight > window.innerHeight || isMobile ? window.innerHeight : document.documentElement.clientHeight;
            },

            _getScrollTop = function () {

                return (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0);
            },

            getParallaxByEl = function (el) {

                var p;

                for (p in parallaxInstances) {

                    if (parallaxInstances.hasOwnProperty(p) && parallaxInstances[p].elParallax === el) {

                        return parallaxInstances[p];
                    }
                }

                return null;
            },

            updateByRAF = function () {

                if (parallaxesToUpdate.length) {

                    var p;

                    for (p = 0; p < parallaxesToUpdate.length; p++) {

                        parallaxesToUpdate[p].transform(lastTiltWasFake);
                    }

                    parallaxesToUpdate = [];
                }

                rafUpdate = null;
            },

            //v případě, že je sekce vidět, zavolá metodu transform příslušného Parallaxu
            updateParallaxes = function (type, parallaxId, forceIntersectionCheck) {

                winScrollTop = _getScrollTop();

                var parallaxesSource = SUPPORTS_INTERSECTION_OBSERVER ? intersectingParallaxes : parallaxInstances,
                    p, parallax;

                for (p in parallaxesSource) {

                    if (parallaxesSource[p] instanceof window.Parallax) {

                        parallax = parallaxInstances[p];

                        if (parallax.disabled || ~parallaxesToUpdate.indexOf(parallax)) {

                            continue;
                        }

                        if (typeof parallaxId === "string" || typeof parallaxId === "number") {

                            if (parallax.id !== parallaxId) {

                                continue;
                            }
                        }

                        if (type === TYPE_TILT && !parallax.useTilt) {

                            continue;
                        }

                        //použít fake-tilt pouze v případě, že zařízení nepodporuje tilt a tilt má být použit
                        if (type === TYPE_FAKE_TILT && ((watchingTilt && parallax.useFakeTilt) || !parallax.useFakeTilt || !parallax.useTilt)) {

                            continue;
                        }

                        if (SUPPORTS_INTERSECTION_OBSERVER && forceIntersectionCheck !== true) {

                            parallaxesToUpdate.push(parallax);

                            if (!rafUpdate && SUPPORTS_RAF) {

                                rafUpdate = window.requestAnimationFrame(updateByRAF);
                            }

                            continue;
                        }

                        var parallaxOffsetTop = parallax.getOffset(),
                            parallaxBottom = parallaxOffsetTop + parallax.getParallaxHeight(),

                            winBottom = winScrollTop + winHeight;

                        if (winBottom > parallaxOffsetTop && winScrollTop < parallaxBottom) {

                            parallaxesToUpdate.push(parallax);

                            if (!rafUpdate && SUPPORTS_RAF) {

                                rafUpdate = window.requestAnimationFrame(updateByRAF);
                            }
                        }
                    }
                }

                if (!SUPPORTS_RAF) {

                    for (p = 0; p < parallaxesToUpdate.length; p++) {

                        parallaxesToUpdate[p].transform(lastTiltWasFake);
                    }

                    parallaxesToUpdate = [];
                }
            },

            refresh = function (force) {

                if (force !== true && (document.documentElement.clientHeight === winHeight && document.documentElement.clientWidth === winWidth)) {

                    return;
                }

                winHeight = document.documentElement.clientHeight;
                winWidth = document.documentElement.clientWidth;
                winScrollTop = _getScrollTop();
                realWinHeight = _getRealWinHeight();

                initialBeta = null;

                var parallax, p;

                for (p in parallaxInstances) {

                    if (parallaxInstances.hasOwnProperty(p)) {

                        parallax = parallaxInstances[p];

                        if (parallax.options.debounce) {

                            clearTimeout(refreshDebounce[parallax.id]);

                            refreshDebounce[parallax.id] = setTimeout(parallax.refresh.bind(this), parallax.options.debounce);

                        } else {

                            parallax.refresh();
                        }
                    }
                }
            },

            onFakeTilt = function (e) {

                if (watchingTilt) {

                    return;
                }

                lastTiltWasFake = true;

                var x = ((e.clientX || 0) / winWidth) * 2,
                    y = ((e.clientY || 0) / winHeight) * 2;

                x = TILT_LIMIT * (x > 1 ? x - 1 : -1 + x);
                y = TILT_LIMIT * (y > 1 ? y - 1 : -1 + y);

                currentTiltX = x * -1 * FAKE_TILT_REDUCER;
                currentTiltY = y * -1 * FAKE_TILT_REDUCER;

                updateParallaxes.call(this, TYPE_FAKE_TILT);
            },

            onInitFakeTilt = function (event) {

                document.removeEventListener("mouseover", onInitFakeTilt);

                onFakeTilt(event);
            },

            watchTilt = function () {

                if (!window.FULLTILT || !window.Promise || !window.Float32Array) {

                    return;
                }

                var promise = FULLTILT.getDeviceOrientation();

                promise.then(function(orientationControl) {

                    orientationControl.listen(function() {

                        lastTiltWasFake = false;

                        watchingTilt = true;

                        var euler = orientationControl.getScreenAdjustedEuler();

                        // Don't update CSS position if we are close to encountering gimbal lock
                        if (euler.beta > 85 && euler.beta < 95) {

                            return;
                        }

                        var tiltX = euler.gamma;

                        tiltX = tiltX > 0 ? Math.min(tiltX, TILT_LIMIT) : Math.max(tiltX, TILT_LIMIT * -1);

                        if (!initialBeta) {

                            initialBeta = euler.beta;
                        }

                        var tiltY = euler.beta - initialBeta;

                        tiltY = tiltY > 0 ? Math.min(tiltY, TILT_LIMIT) : Math.max(tiltY, TILT_LIMIT * -1);

                        currentTiltX = tiltX;
                        currentTiltY = tiltY;

                        updateParallaxes.call(this, TYPE_TILT);
                    });

                    refresh(true);
                });
            },

            initScrollAndFakeTiltEvents = function () {

                if (scrollAndFakeTiltEventsActivated) {

                    return;
                }

                scrollAndFakeTiltEventsActivated = true;

                window.addEventListener("scroll", updateParallaxesScroll);
                window.addEventListener("mousemove", onFakeTilt);
                document.addEventListener("mouseover", onInitFakeTilt);
            },

            destroyScrollAndFakeTiltEvents = function () {

                if (!scrollAndFakeTiltEventsActivated) {

                    return;
                }

                scrollAndFakeTiltEventsActivated = false;

                window.removeEventListener("scroll", updateParallaxesScroll);
                window.removeEventListener("mousemove", onFakeTilt);
                document.removeEventListener("mouseover", onInitFakeTilt);
            },

            addToIntersectingParallaxes = function (parallax) {

                if (intersectingParallaxes[parallax.id]) {

                    return;
                }

                intersectingParallaxes[parallax.id] = parallax;

                intersectingParallaxes.length += 1;

                parallax.shouldRefreshOffset = true;

                updateParallaxes(TYPE_SCROLL, parallax.id);
            },

            removeFromIntersectingParallaxes = function (parallax) {

                if (!intersectingParallaxes[parallax.id]) {

                    return;
                }

                delete intersectingParallaxes[parallax.id];

                intersectingParallaxes.length -= 1;
            },

            onIntersectionChange = function (entry) {

                var parallax = getParallaxByEl(entry.target);

                if (!parallax) {

                    return;
                }

                if (entry.isIntersecting) {

                    addToIntersectingParallaxes(parallax);

                } else {

                    removeFromIntersectingParallaxes(parallax);
                }

                if (!intersectingParallaxes.length) {

                    destroyScrollAndFakeTiltEvents();

                    return;
                }

                initScrollAndFakeTiltEvents();
            },

            init = function () {

                if (initialized) {

                    return;
                }

                winHeight = document.documentElement.clientHeight;
                winWidth = document.documentElement.clientWidth;
                winScrollTop = _getScrollTop();
                realWinHeight = _getRealWinHeight();

                updateParallaxesScroll = updateParallaxes.bind(this, TYPE_SCROLL);
                onFakeTilt = onFakeTilt.bind(this);

                if (SUPPORTS_INTERSECTION_OBSERVER) {

                    intersectionObserver = new IntersectionObserver(function (entries) {

                        entries.forEach(onIntersectionChange);

                    }, { threshold: 0 });
                }

                if (!SUPPORTS_INTERSECTION_OBSERVER) {

                    initScrollAndFakeTiltEvents();
                }

                window.addEventListener("resize", refresh, false);

                if (!watchingTilt) {

                    watchTilt();
                }

                if (SUPPORTS_RAF) {

                    rafUpdate = window.requestAnimationFrame(updateByRAF);
                }

                initialized = true;
            },

            destroy = function () {

                if (SUPPORTS_RAF) {

                    window.cancelAnimationFrame(rafUpdate);

                    rafUpdate = null;
                }

                destroyScrollAndFakeTiltEvents();

                window.removeEventListener("resize", refresh);

                if (SUPPORTS_INTERSECTION_OBSERVER) {

                    intersectionObserver.disconnect();
                    intersectionObserver = null;

                    intersectingParallaxes = { length: 0 };
                }

                initialized = false;
            },

            add = function (parallax) {

                if (!parallaxInstances[parallax.id]) {

                    instanceCounter++;

                    parallaxInstances[parallax.id] = parallax;

                    setTimeout(updateParallaxes.bind(this, TYPE_SCROLL, parallax.id, true), 0);

                    if (SUPPORTS_INTERSECTION_OBSERVER) {

                        intersectionObserver.observe(parallax.elParallax);
                    }
                }
            },

            remove = function (parallax) {

                if (parallaxInstances[parallax.id]) {

                    instanceCounter--;

                    delete parallaxInstances[parallax.id];

                    if (SUPPORTS_INTERSECTION_OBSERVER) {

                        removeFromIntersectingParallaxes(parallax);

                        intersectionObserver.unobserve(parallax.elParallax);
                    }

                    if (!instanceCounter) {

                        destroy();
                    }
                }
            },

            getRealWinHeight = function () {

                return realWinHeight;
            },

            getWinHeight = function () {

                return winHeight;
            },

            getWinWidth = function () {

                return winWidth;
            },

            getWinScrollTop = function () {

                return winScrollTop;
            },

            getTilt = function () {

                return {
                    x: currentTiltX,
                    y: currentTiltY
                };
            },

            getTiltLimit = function () {

                return TILT_LIMIT;
            };

        return {
            init: init,
            destroy: destroy,
            refresh: refresh,

            add: add,
            remove: remove,

            getTilt: getTilt,
            getTiltLimit: getTiltLimit,
            getWinHeight: getWinHeight,
            getWinWidth: getWinWidth,
            getWinScrollTop: getWinScrollTop,
            getRealWinHeight: getRealWinHeight
        };

    }());

    var Layer = function Layer(el, parallax) {

            this.el = el;

            this.parallax = parallax;

            this.init();
        };

    Layer.prototype.init = function () {

        this.refresh(true);
    };

    Layer.prototype.refresh = function (preserveTransform) {

        var dataReverse = this.el.getAttribute("data-" + Layer.DATA.REVERSE.ATTR);

        this.reverseTilt = dataReverse === Layer.DATA.REVERSE.VAL.TILT || dataReverse === Layer.DATA.REVERSE.VAL.BOTH;
        this.reverseScroll = dataReverse === Layer.DATA.REVERSE.VAL.SCROLL || dataReverse === Layer.DATA.REVERSE.VAL.BOTH;

        this.mode = this.el.getAttribute("data-" + Layer.DATA.MODE.ATTR) || Layer.DATA.MODE.VAL.SCROLL;

        var c,

            CSS = {
                height: ""
            };

        if (!this.parallax.options.preserveStyles) {

            CSS.position = "absolute";
            CSS.top = "50%";
            CSS.left = "50%";
            CSS.bottom = "auto";
            CSS.right = "auto";
            CSS.minWidth = "100%";
            CSS.minHeight = "100%";

            CSS[TRANSFORM_PROP] = TRANSFORM_3D ? "translate3d(-50%, -50%, 0)" : "translate(-50%, -50%)";
        }

        for (c in CSS) {

            if (CSS.hasOwnProperty(c)) {

                this.el.style[c] = CSS[c];
            }
        }

        var rect = this.el.getBoundingClientRect();

        this.layerHeight = rect.height;
        this.layerWidth = rect.width;

        //velikost zvětšení sekce (polovina)
        this.parallaxXExtention = (this.layerWidth - this.parallax.parallaxWidth) / 2;
        this.parallaxYExtention = (this.layerHeight - this.parallax.parallaxHeight) / 2;

        if (this.mode === Layer.DATA.MODE.VAL.FIXED) {

            var fixedHeight = ParallaxController.getRealWinHeight() + (this.parallaxYExtention * 2);

            this.el.style.height = fixedHeight + "px";

            rect = this.el.getBoundingClientRect();

            this.layerHeight = rect.height;
        }

        //šířka je větší jak výška => použít na šířku rozměry výšky, jinak při tiltu bude parallax mimo
        if (this.parallaxXExtention > this.parallaxYExtention) {

            this.parallaxXExtention = this.parallaxYExtention;
        }

        if (this.parallax.useTilt) {

            this.tiltScrollRatio = this.parallaxXExtention / this.parallaxYExtention;

            this.parallaxTiltYExtention = this.parallaxYExtention * this.tiltScrollRatio;
            this.parallaxYExtention = this.parallaxYExtention * (1 - this.tiltScrollRatio);
        }

        this.wasIntersecting = false;

        if (!preserveTransform) {

            this.transform(true);
        }
    };

    Layer.DATA = {};

    Layer.DATA.REVERSE = {
        ATTR: "parallax-reverse",
        VAL: {
            TILT: "tilt",
            SCROLL: "scroll",
            BOTH: "both"
        }
    };

    Layer.DATA.MODE = {
        ATTR: "parallax-mode",
        VAL: {
            FIXED: "fixed",
            SCROLL: "scroll"
        }
    };

    Layer.prototype.transform = (function () {

        if (TRANSFORM_3D) {

            return function (x, y) {

                y = this.mode === Layer.DATA.MODE.VAL.FIXED ? Math.round(y) : y;
                x = this.mode === Layer.DATA.MODE.VAL.FIXED ? Math.round(x) : x;

                this.el.style[TRANSFORM_PROP] = x === true ? "translate3d(-50%, -50%, 0)" : x === false ? "" : "translate3d(" + x + "px, " + y + "px, 0)";
            };
        }

        return function (x, y) {

            y = this.mode === Layer.DATA.MODE.VAL.FIXED ? Math.round(y) : y;
            x = this.mode === Layer.DATA.MODE.VAL.FIXED ? Math.round(x) : x;

            this.el.style[TRANSFORM_PROP] = x === true ? "translate(-50%, -50%)" : x === false ? "" : "translate(" + x + "px, " + y + "px)";
        };
    }());

    var instanceCounter = 0,

        CLASS = {
            parallax: "parallax",
            layer: "parallax__layer"
        },

        DEFAULTS = {
            parallax: "." + CLASS.parallax,
            layers: "." + CLASS.layer,
            useTilt: true,
            fakeTilt: true,
            debounce: 0,
            resizeInterval: 1000,
            removeIfNotSupported: false,
            preserveStyles: false,
            onTransform: null,
            onBeforeTransform: null,
            onFirstIntersection: null
        },

        loadElements = function (options) {

            if (typeof options.parallax === "string") {

                this.elParallax = document.querySelector(options.parallax);

            } else if ((window.HTMLElement && options.parallax instanceof window.HTMLElement) || (window.SVGElement && options.parallax instanceof window.SVGElement)) {

                this.elParallax = options.parallax;

            } else if (options.parallax.jquery) {

                this.elParallax = options.parallax[0];
            }

            if (!options.layers) {

                this.elLayers = [];

                for (var c in this.elParallax.children) {

                    if (this.elParallax.children.hasOwnProperty(c) && !this.elParallax.children[c].tagName.match(/^(no)?script$/i)) {

                        this.elLayers.push(this.elParallax.children[c]);
                    }
                }

            } else if (typeof options.layers === "string") {

                this.elLayers = this.elParallax.querySelectorAll(options.layers);

            } else if (window.HTMLElement && options.layers instanceof window.HTMLElement) {

                this.elLayers = [options.layers];

            } else if (options.layers.jquery) {

                this.elLayers = options.layers.toArray();
            }

            this.elLayers = Array.prototype.slice.call(this.elLayers, 0);
        },

        initResizeParallaxObserver = function () {

            clearTimeout(this.resizeParallaxDebounce);

            if (SUPPORTS_RAF) {

                cancelAnimationFrame(this.resizeParallaxDebounce);
            }

            if (SUPPORTS_RESIZE_OBSERVER) {

                if (this.resizeObserver) {

                    return;
                }

                this.resizeObserver = new ResizeObserver(function (entries) {

                    if (this.parallaxWidth !== entries[0].contentRect.width || this.parallaxHeight !== entries[0].contentRect.height) {

                        if (SUPPORTS_RAF && !this.options.debounce) {

                            this.resizeParallaxDebounce = requestAnimationFrame(this.refresh.bind(this));

                        } else {

                            this.resizeParallaxDebounce = setTimeout(this.refresh.bind(this), this.options.debounce);
                        }
                    }
                }.bind(this));

            } else {

                clearInterval(this.resizeParallaxInterval);

                this.resizeParallaxInterval = setInterval(function () {

                    var currentRect = this.elParallax.getBoundingClientRect();

                    if (this.parallaxWidth !== currentRect.width || this.parallaxHeight !== currentRect.height) {

                        if (this.options.debounce) {

                            this.resizeParallaxDebounce = setTimeout(this.refresh.bind(this), this.options.debounce);

                        } else {

                            this.refresh();
                        }
                    }

                }.bind(this), this.options.resizeInterval);
            }
        },

        Parallax = function Parallax(options) {

            this.id = "Parallax-" + (instanceCounter++);

            this.options = typeof options === "string" ? { parallax: options } : options;

            this.disabled = false;

            this.refresh(this.options || DEFAULTS, true);
        };

    Parallax.prototype.destroy = function () {

        if (this.elLayers) {

            var layer = this.layers.length - 1;

            for (layer; layer >= 0; layer--) {

                this.layers[layer].transform(false);
            }
        }

        clearInterval(this.resizeParallaxInterval);
        clearTimeout(this.resizeParallaxDebounce);

        if (SUPPORTS_RAF) {

            cancelAnimationFrame(this.resizeParallaxDebounce);
        }

        if (this.resizeObserver) {

            this.resizeObserver.unobserve(this.elParallax);

            this.resizeObserver.disconnect();
        }

        this.resizeObserver = null;

        ParallaxController.remove(this);

        this.elParallax = null;
        this.elLayers = null;

        this.layers = [];

        this.initialized = false;
    };

    Parallax.prototype.refresh = function (options, elements) {

        if (this.resizeObserver) {

            this.resizeObserver.unobserve(this.elParallax);
        }

        if (!SUPPORTS_TRANSFORM) {

            options = typeof options === "object" ? extend({}, DEFAULTS, options) : this.options;

            loadElements.call(this, options);

            if (this.options.removeIfNotSupported) {

                this.elLayers.forEach(function (layer) {

                    layer.parentNode.removeChild(layer);
                });

            } else if (!this.options.preserveStyles) {

                this.elLayers.forEach(function (layer) {

                    var parallaxRect = this.elParallax.getBoundingClientRect(),
                        layerRect = layer.getBoundingClientRect();

                    layer.style.top = (layerRect.height - parallaxRect.height) / -2;
                    layer.style.left = (layerRect.width - parallaxRect.width) / -2;

                }.bind(this));
            }

            return;
        }

        options = typeof options === "object" ? extend({}, DEFAULTS, options) : this.options;

        this.options = options;

        this.useTilt = options.useTilt;
        this.useFakeTilt = options.useTilt && options.fakeTilt;

        if (elements || options === true || !this.elParallax || !this.elLayers) {

            loadElements.call(this, options);
        }

        if (!this.elParallax || !this.elLayers.length) {

            return;
        }

        ParallaxController.init();
        ParallaxController.add(this);

        var rect = this.elParallax.getBoundingClientRect();

        this.parallaxHeight = rect.height;
        this.parallaxWidth = rect.width;

        this.getOffset();
        this.shouldRefreshOffset = false;

        //rozsah parallaxu -> kolik pixelů bude efekt viditelný
        this.parallaxXOuterRange = this.parallaxWidth + ParallaxController.getWinWidth();
        this.parallaxYOuterRange = this.parallaxHeight + ParallaxController.getWinHeight();

        if (elements || options === true || !this.layers || !this.layers.length) {

            this.layers = [];

            this.elLayers.forEach(function (el) {

                this.layers.push(new Layer(el, this));

            }.bind(this));

        } else {

            var layer = this.layers.length - 1;

            for (layer; layer >= 0; layer--) {

                this.layers[layer].refresh();
            }
        }

        this.initialized = true;

        this.transform();

        initResizeParallaxObserver.call(this);

        if (this.resizeObserver) {

            this.resizeObserver.observe(this.elParallax);
        }
    };

    Parallax.prototype.getOffset = function () {

        this.offsetTop = this.elParallax.getBoundingClientRect().top + ParallaxController.getWinScrollTop();

        return this.offsetTop;
    };

    Parallax.prototype.transform = function (ignoreTilt) {

        if (!this.initialized) {

            return;
        }

        if (this.shouldRefreshOffset) {

            this.getOffset();

            this.shouldRefreshOffset = false;
        }

        var transform = { x: 0, y: 0 },

            //tilt
            tilt = ParallaxController.getTilt(),

            xPerc = this.useTilt && (!ignoreTilt || this.useFakeTilt) ? tilt.x / ParallaxController.getTiltLimit() : 0,
            yPerc = this.useTilt && (!ignoreTilt || this.useFakeTilt) ? tilt.y / ParallaxController.getTiltLimit() : 0,

            parallaxBottom = this.offsetTop + this.parallaxHeight,

            //kolik procent efektu již bylo provedeno (násobí se dvěma pro následující výpočty)
            parallaxProgression = ((parallaxBottom - ParallaxController.getWinScrollTop()) / this.parallaxYOuterRange) * 2;

        parallaxProgression = isFinite(parallaxProgression) ? parallaxProgression : 0;

        parallaxProgression = Math.max(0, Math.min(parallaxProgression, 2));

        //přepočet "parallaxProgression" od středu na rozsah mezi -1 a 1 (označující o kolik % "parallaxExtention" se má obrázek posunout)
        var progressionFromCenter = parallaxProgression > 1 ? (parallaxProgression - 1) * -1: 1 - parallaxProgression,

            realWinHeight = ParallaxController.getRealWinHeight(),

            l = this.layers.length - 1,

            layer,
            layerProgressionFromCenter,

            layerYPerc,
            layerXPerc;

        for (l; l >= 0; l--) {

            layer = this.layers[l];

            layerYPerc = layer.reverseTilt ? yPerc * -1 : yPerc;
            layerXPerc = layer.reverseTilt ? xPerc * -1 : xPerc;

            layerProgressionFromCenter = layer.reverseScroll ? progressionFromCenter * -1 : progressionFromCenter;

            //tilt
            transform.y = ((layer.parallaxTiltYExtention || 0) * layerYPerc);
            transform.x = ((layer.parallaxXExtention * layerXPerc) - (this.parallaxWidth / 2) - layer.parallaxXExtention);

            //scroll
            //odčítá se (this.parallaxHeight / 2), protože obrázek má top: 50%.

            if (layer.mode === Layer.DATA.MODE.VAL.SCROLL) {

                transform.y = (transform.y + (layer.parallaxYExtention * layerProgressionFromCenter) - (layer.layerHeight / 2));

            } else {

                transform.y = transform.y + (layer.parallaxYExtention * -layerProgressionFromCenter) + (((realWinHeight + this.parallaxHeight) / 2) * (layer.reverseScroll ? -layerProgressionFromCenter : layerProgressionFromCenter)) - (layer.layerHeight / 2);
            }

            if (!layer.wasIntersecting && layerProgressionFromCenter < 1 && layerProgressionFromCenter > -1) {

                layer.wasIntersecting = true;

                if (typeof this.options.onFirstIntersection === "function") {

                    this.options.onFirstIntersection.call(this, layer.$el, layerProgressionFromCenter, layerXPerc, layerYPerc, transform);

                } else if (this.options.onFirstIntersection instanceof Array && this.options.onFirstIntersection[l]) {

                    this.options.onFirstIntersection[l].call(this, layer.$el, layerProgressionFromCenter, layerXPerc, layerYPerc, transform);
                }
            }

            if (typeof this.options.onBeforeTransform === "function") {

                this.options.onBeforeTransform.call(this, layer.el, layerProgressionFromCenter, layerXPerc, layerYPerc, transform);

            } else if (this.options.onBeforeTransform instanceof Array && this.options.onBeforeTransform[l]) {

                this.options.onBeforeTransform[l].call(this, layer.el, layerProgressionFromCenter, layerXPerc, layerYPerc, transform);
            }

            layer.transform(transform.x, transform.y);

            if (typeof this.options.onTransform === "function") {

                this.options.onTransform.call(this, layer.el, layerProgressionFromCenter, layerXPerc, layerYPerc, transform);

            } else if (this.options.onTransform instanceof Array && this.options.onTransform[l]) {

                this.options.onTransform[l].call(this, layer.el, layerProgressionFromCenter, layerXPerc, layerYPerc, transform);
            }
        }
    };

    Parallax.prototype.getParallaxHeight = function () {

        return this.parallaxHeight;
    };

    Parallax.prototype.getParallaxWidth = function () {

        return this.parallaxWidth;
    };

    Parallax.prototype.enable = function () {

        this.disabled = false;
    };

    Parallax.prototype.disable = function () {

        this.disabled = true;
    };

    return Parallax;

}));
