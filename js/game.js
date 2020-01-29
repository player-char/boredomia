let pl = null  // player data
let g = null   // game status data
let map = null // map data

const tickDelay = 20

window.onresize = resize
resize()
loadRes()

function startGame(lvlName) {
	loadLvl(lvlName).then(() => {
		g = {
			editor: false,
			lvlName: lvlName,
		}
		loadMap(lvls[lvlName])
		initPlayer()
	})
}

function initPlayer() {
    pl = {
        dir: map.defaultPlayerPos.dir || 0,
        x: map.defaultPlayerPos.x,
		y: map.defaultPlayerPos.y,
		vx: 0.0,
		vy: 0.0,
		jumpCooldown: 0,
		ground: true,
		alive: true,
		bored: false,
		score: 0,
    }
}

function processGameLogic() {
	if (pl.x > map.w - 2) {
		pl.bored = true
	}
}

let debug = {
	series: [],
	maxSize: 1000,
	show: false,
}

function tick() {
	let t = performance.now()
	if (g && pl && pl.alive) {
		processPhysics()
		processGameLogic()
	}
	let engineT = performance.now() - t
	t = performance.now()
	redraw()
	let renderT = performance.now() - t
	debug.series.unshift({
		engineT, renderT
	})
	if (debug.series.length > debug.maxSize) debug.series.pop()
	if (engineT > 5 || renderT > 5) console.log('Takes too long:', engineT, renderT)
	if (debug.show) renderDebug(debug)
}

setInterval(tick, tickDelay)
