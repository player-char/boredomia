const canv = document.getElementById('c', {alpha: false})
const bm = canv.getContext('2d')

// width and height of main canvas
let w = 0
let h = 0
let w2 = 0
let h2 = 0
// tile size
let tsz = 0
let tsz2 = 0
let tsz3 = 0
let tsz4 = 0

let tileCache = null

const tszInitial = 64
const camYOffset = -1
const diagSize = 1500

function resize() {
	w = window.innerWidth * devicePixelRatio
	h = window.innerHeight * devicePixelRatio
	let k = diagSize / Math.hypot(w, h)
	tsz = tszInitial
	
	// increase quality
	while (k < 1) {
		tsz *= 2
		k *= 2
	}
	
	tsz2 = Math.round(tsz / 2)
	tsz3 = Math.round(tsz / 3)
	tsz4 = Math.round(tsz / 4)
	w = Math.floor(w * k / 2) * 2
	h = Math.floor(h * k / 2) * 2
    w2 = w/2
    h2 = h/2
    canv.width = w
    canv.height = h
	tileCache = null // invalidate cache
    redraw()
}


function redraw() {
    if (g == null) {
		bm.fillStyle = '#ccc'
        bm.fillRect(0, 0, canv.width, canv.height)
		renderMessage(bm, 'ИДЁТ ЗАЙГРУЗКА...', w2, h2)
        return
    }
	
	renderTileGrid(bm, pl.x, pl.y + camYOffset)
	if (g.editor) {
		// render some editor gui here
		
		// map bounds
		canv.strokeRect(w2 - Math.floor(pl.x * tsz), h2 - Math.floor((pl.y + camYOffset) * tsz), map.w * tsz, map.h * tsz)
		
		return
	}
	renderOrangeC(bm, w2-tsz2, h2+tsz4, tsz, tsz)
	
	bm.font = tsz2 + 'px sans-serif'
	bm.textAlign = 'left'
	bm.textBaseline = 'top'
	bm.strokeStyle = '#000'
	bm.fillStyle = '#fff'
	bm.lineWidth = Math.ceil(tsz4 * 0.2)
	strokeFillText(bm, 'Score: ' + g.score, 10, 10)
	
    if (!pl.alive) {
		renderMessage(bm, 'Press F5 to pay respects.', w2, h2 / 2)
    } else if (pl.bored) {
		renderMessage(bm, 'Boring...', w2, h2 / 2)
    }
}

let blockColor = {
	'.': '#adf',
	'#': '#adf',
	'g': '#532',
	'd': '#532',
	';': '#421',
	's': '#555',
	':': '#333',
	'l': '#e51',
	'|': '#777',
}
let blockTopColor = {
	'g': '#5a5',
	'd': '#642',
	's': '#666',
	'l': '#f82',
}

function renderTileGrid(bm, cx, cy) {
	let fcx = Math.floor(cx)
	let fcy = Math.floor(cy)
	
	let tcw2 = Math.ceil(w2 / tsz)
	let tch2 = Math.ceil(h2 / tsz)
	if (!tileCache) {
		tileCache = {tcw2, tch2, fcx, fcy}
		tileCache.canv = document.createElement('canvas')
		tileCache.bm = tileCache.canv.getContext('2d', {alpha: false})
		tileCache.canv.width = (2 * tcw2 + 1) * tsz
		tileCache.canv.height = (2 * tch2 + 1) * tsz
		
		for (let j = -tch2; j <= tch2; j++) {
			for (let i = -tcw2; i <= tcw2; i++) {
				renderTile(i, j)
			}
		}
	}
	
	if (tileCache.fcx != fcx || tileCache.fcy != fcy) {
		tileCache.bm.drawImage(tileCache.canv, (tileCache.fcx - fcx) * tsz, (tileCache.fcy - fcy) * tsz)
		let ofcx = tileCache.fcx
		let ofcy = tileCache.fcy
		tileCache.fcx = fcx
		tileCache.fcy = fcy
		while (ofcx < fcx) {
			let i = tcw2
			for (let j = -tch2; j <= tch2; j++) renderTile(i, j)
			ofcx++
		}
		while (ofcx > fcx) {
			let i = -tcw2
			for (let j = -tch2; j <= tch2; j++) renderTile(i, j)
			ofcx--
		}
		while (ofcy < fcy) {
			let j = tch2
			for (let i = -tcw2; i <= tcw2; i++) renderTile(i, j)
			ofcy++
		}
		while (ofcy > fcy) {
			let j = -tch2
			for (let i = -tcw2; i <= tcw2; i++) renderTile(i, j)
			ofcy--
		}
	}
	
	let x = Math.round(w2 - (cx - fcx + tcw2) * tsz)
	let y = Math.round(h2 - (cy - fcy + tch2) * tsz)
	bm.drawImage(tileCache.canv, x, y)
}

function renderTileGlobal(bi, bj) {
	renderTile(bi - tileCache.fcx, bj - tileCache.fcy)
}

function renderTile(i, j) {
	let bm = tileCache.bm
	let bi = i + tileCache.fcx
	let bj = j + tileCache.fcy
	let b = getBlock(bi, bj)
	let x = (i + tileCache.tcw2) * tsz
	let y = (j + tileCache.tch2) * tsz
	
	if (b == '|') {
		bm.fillStyle = blockColor['.']
		bm.fillRect(x, y, tsz, tsz)
		bm.fillStyle = blockColor[b]
		bm.fillRect(x + tsz4, y, tsz2, tsz)
	} else {
		bm.fillStyle = blockColor[b]
		bm.fillRect(x, y, tsz, tsz)
	}
	
	if (blockTopColor[b]) {
		let ub = getBlock(bi, bj - 1)
		if (!blockTopColor[ub]) {
			bm.fillStyle = blockTopColor[b]
			bm.fillRect(x, y, tsz, tsz3)
		}
	}
	
	// render tile entities
	let te = getTileEntityAt(bi, bj)
	if (te) {
		if (te.type == 'food') {
			bm.font = tsz2 + 'px sans-serif'
			bm.textAlign = 'center'
			bm.textBaseline = 'middle'
			bm.fillText(te.sprite, x + tsz2, y + tsz2)
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
	bm.font = tsz2 + 'px sans-serif'
	bm.textAlign = 'center'
	bm.textBaseline = 'middle'
	bm.strokeStyle = '#000'
	bm.fillStyle = '#fff'
	bm.lineWidth = Math.ceil(tsz4 * 0.2)
	strokeFillText(bm, text, x, y)
}

function strokeFillText(bm, text, x, y) {
	bm.strokeText(text, x, y)
	bm.fillText(text, x, y)
}