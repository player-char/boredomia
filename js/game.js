let pl = null  // player data
let g = null   // game status data
let map = null // map data


let loader = document.getElementById('loader')
let imgs = {
    'orangec0': null,
    'orangec1': null,
    'boring': null,
    'bored0': null,
    'bored1': null,
}

function loadRes() {
    let imgsRequired = Object.keys(imgs).length

    for (let imgName in imgs) {
        let i = document.createElement('img')
        i.onload = () => {
            //console.log('loaded', imgName)
            if (--imgsRequired == 0) {
                startGame()
            }
        }
        i.onerror = () => alert('Потрачено, релоадните страницу')
        i.src = './img/' + imgName + '.png'
        imgs[imgName] = i
        loader.appendChild(i)
    }
}

window.onresize = resize
resize()
loadRes()

function startGame() {
	// there will be lvl name and more long-term data
	g = {
		editor: false,
		score: 0,
	}
	
	loadMap()
	tileCache = null
	
	setInterval(tick, 20)
}

function processGameLogic() {
	if (pl.x > map.w - 2) {
		pl.bored = true
	}
}

function tick() {
	let t = performance.now()
	if (g && pl.alive) {
		processPhysics()
		processGameLogic()
	}
	let physT = performance.now() - t
	t = performance.now()
	redraw()
	let drawT = performance.now() - t
	if (physT > 5 || drawT > 5) console.log('Takes too long:', physT, drawT)
}
