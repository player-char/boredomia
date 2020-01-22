let loader = document.getElementById('loader')
let canv = document.getElementById('c')
let bm = canv.getContext('2d')
let w = 0
let h = 0
let w2 = 0
let h2 = 0
let tsz = 64 // tile size
let tsz2 = Math.round(tsz / 2)
let tsz3 = Math.round(tsz / 3)
let tsz4 = Math.round(tsz / 4)
let camYOffset = -1

let pl = null  // player data
let g = null   // game status data
let map = null // map data

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
            console.log('loaded', imgName)
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

function resize() {
    w = canv.width = 1200//window.innerWidth
    h = canv.height = 800//window.innerHeight
    w2 = w/2
    h2 = h/2
    redraw()
}
//window.onresize = resize
resize()
loadRes()

function redraw() {
    if (g == null) {
        bm.clearRect(0, 0, canv.width, canv.height)
		renderMessage(bm, 'ИДЁТ ЗАЙГРУЗКА...', w2, h2)
        return
    }
	
	renderBlockGrid(bm, pl.x, pl.y + camYOffset)
	if (g.editor) {
		// render some editor gui here
		//renderOrangeC(bm, w2-tsz2, h2+tsz4, tsz, tsz) //
		
		// map bounds
		bm.strokeRect(w2 - pl.x * tsz, h2 - (pl.y + camYOffset) * tsz, map.w * tsz, map.h * tsz)
		
		return
	}
	renderOrangeC(bm, w2-tsz2, h2+tsz4, tsz, tsz)
	
	bm.font = '4vw sans-serif'
	bm.textAlign = 'left'
	bm.textBaseline = 'top'
	bm.strokeStyle = '#000'
	bm.fillStyle = '#fff'
	bm.lineWidth = 4
	strokeFillText(bm, 'Score: ' + g.score, 10, 10)
	
    if (!pl.alive) {
		renderMessage(bm, 'Press F5 to pay respects.', w2, h2 / 2)
    } else if (pl.bored) {
		renderMessage(bm, 'Boring...', w2, h2 / 2)
    }
}

let blockColor = {
	'g': '#532',
	';': '#421',
	's': '#555',
	':': '#333',
	'l': '#e51',
	'|': '#777',
}

function renderBlockGrid(bm, cx, cy) {
    bm.fillStyle = '#adf'
    bm.fillRect(0, 0, canv.width, canv.height)
    let fovw = Math.ceil(w2 / tsz)
    let fovh = Math.ceil(h2 / tsz)
    let ox = cx - Math.floor(cx)
    let oy = cy - Math.floor(cy)
    for (let j = -fovh; j <= fovh; j++) {
        let bj = j + Math.floor(cy)
        let y = Math.round(h2 + (j - oy) * tsz)
        for (let i = -fovw; i <= fovw; i++) {
            let bi = i + Math.floor(cx)
            let x = Math.round(w2 + (i - ox) * tsz)
			renderBlock(bm, bi, bj, x, y)
        }
    }
	
	for (let e of map.tileent) {
        let x = Math.round(w2 + (e.x - cx) * tsz)
        let y = Math.round(h2 + (e.y - cy) * tsz)
		if (e.type == 'food') {
			//bm.fillStyle = '#fa0'
			//bm.fillRect(x, y, tsz, tsz)
			bm.font = tsz * 0.5 + 'px sans-serif'
			bm.textAlign = 'center'
			bm.textBaseline = 'middle'
			bm.fillText(e.sprite, x + tsz2, y + tsz2)
		}
	}
}

function renderBlock(bm, bi, bj, x, y) {
	let b = getBlock(bi, bj)
	if (b != '.' && b != '#') {
		bm.fillStyle = blockColor[b]
		if (b == '|') {
			bm.fillRect(x + tsz4, y, tsz2, tsz)
		} else {
			bm.fillRect(x, y, tsz, tsz)
		}
		let ub = getBlock(bi, bj - 1)
		if (b == 'g' && '.|;:#'.includes(ub)) {
			bm.fillStyle = '.|#'.includes(ub) ? '#5a5' : '#642'
			bm.fillRect(x, y, tsz, tsz3)
		}
		if (b == 's' && '.|;:#'.includes(ub)) {
			bm.fillStyle = '#666'
			bm.fillRect(x, y, tsz, tsz3)
		}
		if (b == 'l' && '.|;:#'.includes(ub)) {
			bm.fillStyle = '#f82'
			bm.fillRect(x, y, tsz, tsz3)
		}
	}
}

function renderOrangeC(bm, x, y, w, h) {
    bm.drawImage(imgs['orangec' + pl.dir], x, y, w, h)
	if (pl.bored) {
		bm.drawImage(imgs['bored' + pl.dir], x, y, w, h)
	}
}

function renderMessage(bm, text, x, y) {
	bm.font = '5vw sans-serif'
	bm.textAlign = 'center'
	bm.textBaseline = 'middle'
	bm.strokeStyle = '#000'
	bm.fillStyle = '#fff'
	bm.lineWidth = 5
	strokeFillText(bm, text, x, y)
}

function strokeFillText(bm, text, x, y) {
	bm.strokeText(text, x, y)
	bm.fillText(text, x, y)
}

function getBlockAt(x, y) {
	return getBlock(Math.floor(x), Math.floor(y))
}

//function getBlockNear(i, j, solid) {
//	for (let [di, dj] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
//		let b = getBlock(i+di, j+dj)
//		if (isSolid(b) == solid) return b
//	}
//	return ':s'[+solid]
//}

function getBlock(i, j) {
    if (j < 0) {
        j = 0
    }
    if (j >= map.h) {
        j = map.h - 1
    }
    if (i < 0) {
        i = 0
    }
    if (i >= map.w) {
        i = map.w - 1
    }
    //if (i < 0 || i >= map.w) {
    //    return '#'
    //}
	
	j = map.h - 1 - j
    return map.data[j][i]
}

function isSolid(b) {
	return '#gs'.includes(b)
}

function startGame() {
    pl = {
        dir: 0,
        x: 4.5,
        y: 9.0,
		vx: 0.0,
		vy: 0.0,
		jumpCooldown: 0,
		ground: true,
		alive: true,
		bored: false,
    }
	
	// there will be lvl name and more long-term data
	g = {
		editor: false,
		score: 0,
	}
	
	map = {}
	map.data = `
		s#............................................................................................................#
		s.............................................................................................................#
		ss..............................................................ssss.....................................gg...#
		ss.................................ggggggg......................|..|.............g.......................gg...#
		ss.................................|.....|..............g.......|..|..sss........ggggg...................;;;..#
		ss:................................|.....|..........g..;;.......|..|..s:;;.......|...|.......gg..........gg;..#
		ss:...g.............g.....g;gg;g...|gg...|....g.g...gg.;;......g;;g|.:s:gggggggggggg.|.......||...ggg...:gg;;.#
		sss...;;......g...ggg;....g;.g;g..g;;;...|..g;;;;;;ggg;;;;..g;;;;;;:::s:ss;ssss:..:s.|.......||...|.|...:gg;;.#
		sssg.;;;...gggglllgggg.g..gg;;;ggggg;;;.gg;;;;;;;;;;;gg;g;;.;;;;;;::::s:::::::::s::sg|.......||...|.|..::ggg;.#
		sssgggggggggggglllsgsggggggggggggggggggggggggg;;;ggg;;gggggggggggggslsssssssssssssssggg.gg;ggllllllllllllgggggg
		ssssgggggggggggsllsgggggggggggggggggggggggggggggggggg;;;;;;;;;;;ggsssssssssssssssssssgggg;;ggllllllllllllgggggg
		ssssgggggggggggslllsggggggggggggggggggggggggggggggggggggggggggggggsssssssssssssssssssggggggggllllllllllllgggggg
	`.trim().split('\n').reverse().map(s => s.trim()),
    map.h = map.data.length
    map.w = map.data[0].length
	map.tileent = [
		{
			type: 'food',
			sprite: '🍌',
			collect: true,
			score: 5,
			x: 6,
			y: 5,
		}
	]
    tick()
}

// physical constants
let PHYS = {
	runa: 0.06,     // running acceleration
	flya: 0.01,     // flying acceleration
	stopv: 0.08,    // stop speed
	jumpv: 0.47,    // jump start speed
	ga: 0.03,       // gravity acceleration
	gammar: 0.8,    // ground non-friction
	gammaf: 0.983,  // air non-friction
	uh: 0.9,        // height of player character
	uw: 0.4,        // half of thickness of player character
	ulw: 0.2,       // landing width
	jumpcd: 20,     // jump cooldown ticks
	edflyv: 0.5   // editor fly speed
}

function processPhysics() {
	// input processing
	if (pl.jumpCooldown) {
		pl.jumpCooldown--
	}
	let inp = getKeyInputs()
	if (g.editor) {
		pl.x += PHYS.edflyv * inp.x
		pl.y -= PHYS.edflyv * inp.y
		return
	}
	if (inp.x) {
		// run
		pl.vx += inp.x * (pl.ground ? PHYS.runa : PHYS.flya)
		pl.dir = +(inp.x > 0)
	}
	if (pl.ground && inp.y > 0 && !pl.jumpCooldown) {
		// jump
		pl.ground = false
		pl.vy = -PHYS.jumpv
		pl.jumpCooldown = PHYS.jumpcd
	}
	
	if (!pl.vx && !pl.vy) {
		// no motion at all
		return
	}
	let newx = pl.x + pl.vx
	let newy = pl.y + pl.vy
	
	// check ceiling
	let crb = getBlockAt(pl.x + PHYS.ulw, newy - PHYS.uh)
	let clb = getBlockAt(pl.x - PHYS.ulw, newy - PHYS.uh)
	if (isSolid(crb) || isSolid(clb)) {
		pl.y = Math.ceil(newy - PHYS.uh) + PHYS.uh + 0.01
		pl.vy = 0.0
	}
	
	// check walls
	let dir = Math.sign(pl.vx)
	for (let dir of [-1.0, 1.0]) {
		let wlb = getBlockAt(newx + PHYS.uw * dir, pl.y - 0.3)
		let wub = getBlockAt(newx + PHYS.uw * dir, pl.y - 0.85)
		if (isSolid(wlb) || isSolid(wub)) {
			pl.vx = 0.0
			if (isSolid(wlb)) {
				pl.x = Math.floor(pl.x) + 0.5 + dir * (0.5 - PHYS.uw - 0.01)
			}
		}
	}
	
	// movement
	pl.x += pl.vx
	if (!pl.ground) {
		pl.y += pl.vy
		pl.vy += PHYS.ga
		
		// landing
		let rb = getBlockAt(pl.x + (inp.x > 0 ? PHYS.uw : PHYS.ulw), pl.y)
		let lb = getBlockAt(pl.x - (inp.x < 0 ? PHYS.uw : PHYS.ulw), pl.y)
		if ('l' == rb || 'l' == lb) {
			pl.alive = false
			pl.bored = true
		}
		if (isSolid(rb) || isSolid(lb)) {
			pl.y = Math.floor(pl.y)
			pl.ground = true
		}
	} else if (pl.vx != 0.0) {
		// fall down
		let rb = getBlockAt(pl.x + PHYS.ulw, pl.y + 0.001)
		let lb = getBlockAt(pl.x - PHYS.ulw, pl.y + 0.001)
		if (!isSolid(rb) && !isSolid(lb)) {
			pl.ground = false
		}
	}
	
	// horizontal movement friction
	if (inp.x == 0 && Math.abs(pl.vx) < PHYS.stopv) {
		pl.vx = 0.0
	} else {
		pl.vx *= pl.ground ? PHYS.gammar : PHYS.gammaf
	}
	pl.vy *= PHYS.gammaf
	
	// tileentity collision
	let te = getTileEntityAt(pl.x, pl.y - PHYS.uh / 2)
	if (te) {
		if (te.collect) {
			g.score += te.score
			map.tileent = map.tileent.filter((z) => (z != te))
		}
	}
}

function getTileEntityAt(x, y) {
	x = Math.floor(x)
	y = Math.floor(y)
	// just brute force all of them
	return map.tileent.find((te) => te.x == x && te.y == y)
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
	if (physT > 5 || drawT > 5) console.log(physT, drawT)
	setTimeout(tick, 20)
}
