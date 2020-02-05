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

function processGameLogic() {
	//if (pl.x > map.w - 2) {
	//	pl.bored = true
	//}
}

let debug = {
	series: [],
	maxSize: 1000,
	show: false,
}

function tick() {
	let t = performance.now()
	if (pl && pl.alive && !pl.paused) {
		let inputs = getKeyInputs()
		processPhysics(inputs)
		//processGameLogic()
	}
	let engineTime = performance.now() - t
	debug.series.unshift({
		engineTime, renderTime
	})
	renderTime = 0
	screenRendered = false
	if (debug.series.length > debug.maxSize) debug.series.pop()
	//if (engineTime > 5 || renderTime > 5) console.log('Takes too long:', engineT, renderT)
	//if (debug.show) renderDebug(debug)
}

setInterval(tick, tickDelay)
window.requestAnimationFrame(tryRender)

function launchGame() {
	loadRes(() => startGame('lvl1'))
}
