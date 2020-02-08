let pl = null  // player data
let map = null // map data

const tickDelay = Math.floor(1000/60)

window.onresize = resize
resize()

function startGame(lvlName) {
	loadLvl(lvlName).then((data) => {
		map = loadMap(data)
		initPlayer()
		requestFullTileUpdate()
	})
}

let debug = {
	series: [],
	maxSize: 1000,
	show: false,
}

function tick() {
	let t = performance.now()
	processGameTick()
	let engineTime = performance.now() - t
	debug.series.unshift({
		engineTime, renderTime
	})
	renderTime = 0
	screenRendered = false
	if (debug.series.length > debug.maxSize) debug.series.pop()
}

setInterval(tick, tickDelay)
window.requestAnimationFrame(tryRender)

function launchGame() {
	loadRes(() => startGame('lvl1'))
}
