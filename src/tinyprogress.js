(function (window) {
    const CLASSNAME = {
        WRAPPER: "tp__wrapper",
        LOADED: "tp__loaded",
        PLAYED: "tp__played",
        THUMB: "tp__thumb",
    };

    const COMP = {
        Wrapper: function () {
            return this.ROOT.querySelector(`.${CLASSNAME.WRAPPER}`);
        },
        Loaded: function () {
            return this.ROOT.querySelector(`.${CLASSNAME.LOADED}`);
        },
        Played: function () {
            return this.ROOT.querySelector(`.${CLASSNAME.PLAYED}`);
        },
        Thumb: function () {
            return this.ROOT.querySelector(`.${CLASSNAME.THUMB}`);
        },
    };

    const HANDLER = {
        // enable thumb
        ThumbMouseDown: function () {
            if (!this.state.isThumbEnabled) {
                this._emit({ type: "slidingstart", percentage: this.state.played });
                this.state.isThumbEnabled = true;
            }
        },
        // seek
        WrapperClick: function (evt) {
            if (evt.target == COMP.Wrapper.bind(this)()) {
                const wrapperWidth = Number(getComputedStyle(COMP.Wrapper.bind(this)()).width.slice(0, -2));
                this._emit({ type: "seek", percentage: evt.offsetX / wrapperWidth });
                this.state.played = evt.offsetX / wrapperWidth;
            }
        },
        // slide
        WindowMouseMove: function (evt) {
            if (this.state.isThumbEnabled) {
                const wrapperWidth = Number(getComputedStyle(COMP.Wrapper.bind(this)()).width.slice(0, -2));
                let distance = evt.clientX - COMP.Wrapper.bind(this)().getBoundingClientRect().left;
                if (distance < 0) {
                    distance = 0;
                } else if (distance > wrapperWidth) {
                    distance = wrapperWidth;
                }
                this._emit({ type: "sliding", percentage: distance / wrapperWidth });
                this.state.played = distance / wrapperWidth;
            }
        },
        // disable thumb
        WindowMouseUp: function () {
            if (this.state.isThumbEnabled) {
                this._emit({ type: "slidingend", percentage: this.state.played });
                this.state.played = Number(this.state.played);
                this.state.isThumbEnabled = false;
            }
        },
    };

    const UTIL = {
        isString: function (o) {
            return Object.prototype.toString.call(o) == "[object String]";
        },
        isArray: function (o) {
            return Object.prototype.toString.call(o) == "[object Array]";
        },
        isDom: function (o) {
            return typeof HTMLElement === "object"
                ? o instanceof HTMLElement
                : o && typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string";
        },
        toDom: function (o) {
            if (this.isDom(o)) {
                return o;
            } else if (this.isString(o)) {
                return document.querySelector(o);
            }
            return null;
        },
    };

    class TinyProgress {
        constructor(el, cfg = {}) {
            // self reference
            const _this = this;

            // private
            this._listeners = {};

            // render
            this.ROOT = UTIL.toDom(el);
            if (!this.ROOT.classList.contains("tiny-progress")) {
                this.ROOT.classList.add("tiny-progress");
            }
            this.ROOT.innerHTML = `
                <div class="${CLASSNAME.WRAPPER}">
                    <div class="${CLASSNAME.LOADED}"></div>
                    <div class="${CLASSNAME.PLAYED}">
                        <div class="${CLASSNAME.THUMB}"></div>
                    </div>
                </div>
            `;

            // config
            this.CONFIG = {
                width: "100%",
                height: "5px",
                borderWidth: "0px",
                borderColor: "transparent",
                borderRadius: "5px",
                innerColor: "white",
                loadedColor: "rgba(0, 0, 0, 0.15)",
                playedColor: "greenyellow",
                thumbDiam: "12px",
                thumbColor: "greenyellow",
            };
            this.setup(cfg);

            // state
            this.state = { isThumbEnabled: false };
            Object.defineProperty(this.state, "loaded", {
                get: function () {
                    const wrapperWidth = Number(getComputedStyle(COMP.Wrapper.bind(_this)()).width.slice(0, -2));
                    const loadedWidth = Number(getComputedStyle(COMP.Loaded.bind(_this)()).width.slice(0, -2));
                    return loadedWidth / wrapperWidth;
                },
                set: function (percentage) {
                    _this._emit({ type: "loadedchange", percentage });
                    COMP.Loaded.bind(_this)().style.width = `${percentage * 100}%`;
                },
            });
            Object.defineProperty(this.state, "played", {
                get: function () {
                    const wrapperWidth = Number(getComputedStyle(COMP.Wrapper.bind(_this)()).width.slice(0, -2));
                    const playedWidth = Number(getComputedStyle(COMP.Played.bind(_this)()).width.slice(0, -2));
                    return playedWidth / wrapperWidth;
                },
                set: function (percentage) {
                    _this._emit({ type: "playedchange", percentage });
                    COMP.Played.bind(_this)().style.width = `${percentage * 100}%`;
                },
            });

            // install listeners
            COMP.Wrapper.bind(this)().addEventListener("click", HANDLER.WrapperClick.bind(this));
            COMP.Thumb.bind(this)().addEventListener("mousedown", HANDLER.ThumbMouseDown.bind(this));
            window.addEventListener("mouseup", HANDLER.WindowMouseUp.bind(this));
            window.addEventListener("mousemove", HANDLER.WindowMouseMove.bind(this));
        }

        setup(cfg) {
            Object.assign(this.CONFIG, cfg);
            this.ROOT.style.setProperty("--tp_width", this.CONFIG.width);
            this.ROOT.style.setProperty("--tp_height", this.CONFIG.height);
            this.ROOT.style.setProperty("--tp_border_width", this.CONFIG.borderWidth);
            this.ROOT.style.setProperty("--tp_border_radius", this.CONFIG.borderRadius);
            this.ROOT.style.setProperty("--tp_border_color", this.CONFIG.borderColor);
            this.ROOT.style.setProperty("--tp_inner_color", this.CONFIG.innerColor);
            this.ROOT.style.setProperty("--tp_loaded_color", this.CONFIG.loadedColor);
            this.ROOT.style.setProperty("--tp_played_color", this.CONFIG.playedColor);
            this.ROOT.style.setProperty("--tp_thumb_diam", this.CONFIG.thumbDiam);
            this.ROOT.style.setProperty("--tp_thumb_color", this.CONFIG.thumbColor);
        }

        on(type, callback) {
            if (!(type in this._listeners)) {
                this._listeners[type] = [];
            }
            this._listeners[type].push(callback);
        }

        off(type, callback) {
            if (!(type in this._listeners)) {
                return;
            }
            let stack = this._listeners[type];
            for (let i = 0; i < stack.length; i++) {
                if (stack[i] === callback) {
                    stack.splice(i, 1);
                    return this.off(type, callback);
                }
            }
        }

        setLoaded(percentage) {
            this.state.loaded = percentage;
        }

        setPlayed(percentage) {
            this.state.played = percentage;
        }

        destroy() {
            // uninstall listeners
            COMP.Wrapper.bind(this)().removeEventListener("click", HANDLER.WrapperClick.bind(this));
            COMP.Thumb.bind(this)().removeEventListener("mousedown", HANDLER.ThumbMouseDown.bind(this));
            window.removeEventListener("mouseup", HANDLER.WindowMouseUp.bind(this));
            window.removeEventListener("mousemove", HANDLER.WindowMouseMove.bind(this));
        }

        // private methods
        _emit(evt) {
            if (!(evt.type in this._listeners)) {
                return;
            }
            let stack = this._listeners[evt.type];
            for (let i = 0; i < stack.length; i++) {
                stack[i].call(this, evt);
            }
        }
    }

    // export
    window.TinyProgress = TinyProgress;
})(window);
