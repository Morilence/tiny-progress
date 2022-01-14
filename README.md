# Tiny Progress

A progress bar component implemented with native JS.

## Example

```js
const tprogress = new TinyProgress(".progress", {
    height: "8px",
    thumbDiam: "16px",
});
tprogress.on("seek", logger);
tprogress.on("slidingstart", logger);
tprogress.on("sliding", logger);
tprogress.on("slidingend", logger);

// init
tprogress.setLoaded(0.15);
tprogress.setPlayed(1);

// logger
function logger(evt) {
    console.log(`%c${(evt.percentage * 100).toFixed(2)}%. %c[${evt.type}]`, "color: greenyellow;", "color: blueviolet");
}
```

## Preview

[https://morilence.github.io/tiny-progress/](https://morilence.github.io/tiny-progress/)
