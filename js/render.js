const canv = document.getElementById('c', {alpha: false})
const bm = canv.getContext('2d')

// to remove text spikes
bm.miterLimit = 1

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

const tszInitial = 16
const camYOffset = -1
const diagSize = 375

let renderQuality = 5

function resize() {
	w = window.innerWidth * devicePixelRatio
	h = window.innerHeight * devicePixelRatio
	let k = diagSize / Math.hypot(w, h)
	tsz = tszInitial
	
	// increase quality
	for (let i = 0; i < renderQuality; i++) {
		if (k >= 1) {
			break
		}
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
    if (!g || !pl) {
		bm.fillStyle = '#ccc'
        bm.fillRect(0, 0, canv.width, canv.height)
		renderMessage(bm, 'ИДЁТ ЗАЙГРУЗКА...', w2, h2)
        return
    }
	
	let cx = pl.x
	let cy = pl.y + camYOffset
	
	renderTileGrid(bm, cx, cy)
	if (g.editor) {
		// render some editor gui here
		
		// map bounds
		bm.lineWidth = Math.ceil(tsz4 * 0.25)
		bm.strokeStyle = '#000'
		bm.strokeRect(w2 - Math.floor(cx * tsz), h2 - Math.floor(cy * tsz), map.w * tsz, map.h * tsz)
		
		let xPlayerOffset = (map.defaultPlayerPos.x - pl.x) * tsz
		let yPlayerOffset = (map.defaultPlayerPos.y - pl.y) * tsz
		renderOrangeC(bm, xPlayerOffset + w2-tsz2, yPlayerOffset + h2+tsz4, tsz, tsz, map.defaultPlayerPos.dir, false)
		
		return
	}
	renderOrangeC(bm, w2-tsz2, h2+tsz4, tsz, tsz, pl.dir, pl.bored)
	
	bm.font = tsz2 + 'px sans-serif'
	bm.textAlign = 'left'
	bm.textBaseline = 'top'
	bm.strokeStyle = '#000'
	bm.fillStyle = '#fff'
	bm.lineWidth = Math.ceil(tsz4 * 0.2)
	strokeFillText(bm, 'Score: ' + pl.score, 10, 10)
	
    if (!pl.alive) {
		renderMessage(bm, 'Press F5 to pay respects.', w2, h2 / 2)
    } else if (pl.bored) {
		renderMessage(bm, 'Boring...', w2, h2 / 2)
    }
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
	if (!tileCache) return
	let i = bi - tileCache.fcx
	let j = bj - tileCache.fcy
	if (Math.abs(i) <= tileCache.tcw2 && Math.abs(j) <= tileCache.tch2) renderTile(i, j)
	if (blockSolid[getBlock(bi, bj + 1)]) {
		j += 1
		if (Math.abs(i) <= tileCache.tcw2 && Math.abs(j) <= tileCache.tch2) renderTile(i, j)
	}
}

function renderTile(i, j) {
	let bm = tileCache.bm
	let bi = i + tileCache.fcx
	let bj = j + tileCache.fcy
	let bpos = getValidIndex(bi, bj)
	let x = (i + tileCache.tcw2) * tsz
	let y = (j + tileCache.tch2) * tsz
	
	let b = g.editor ? map.blData[bpos] : map.fgDataCurr[bpos] || map.blData[bpos]
	let color = blockColor[b]
	
	if (b === 0 || b === 1) {
		// draw background
		bg = map.bgData[bpos]
		color = blockBGColor[bg]
		
		if (bg === 12) {
			bm.fillStyle = blockSkyColor
			bm.fillRect(x, y, tsz, tsz)
			bm.fillStyle = color
			bm.fillRect(x + tsz4, y, tsz2, tsz)
		} else {
			// draw full bg block
			bm.fillStyle = color
			bm.fillRect(x, y, tsz, tsz)
		}
		
		// render tile entity
		let te = getTileEntity(bi, bj)
		if (te) {
			renderTileEntity(bm, x, y, te)
		}
		
		if (b === 1 && g.editor) {
			renderTileFrame(bm, x, y, 5, 5, '#a00')
		}
	} else {
		// draw solid block
		bm.fillStyle = color
		bm.fillRect(x, y, tsz, tsz)
		
		// draw block top
		if (blockTopColor[b]) {
			let ubpos = getValidIndex(bi, bj - 1)
			let ub = map.blData[ubpos]
			if (!blockTopColor[ub] && (map.fgDataCurr[ubpos] == 0 || g.editor)) {
				bm.fillStyle = blockTopColor[b]
				bm.fillRect(x, y, tsz, tsz3)
			}
		}
	}
	
	if (g.editor) {
		let b = map.fgData[bpos]
		if (b !== 0) {
			// render fg for editor
			bm.globalAlpha = 0.5
			bm.fillStyle = blockColor[b]
			bm.fillRect(x, y, tsz, tsz)
			
			// draw block top
			if (blockTopColor[b]) {
				let ubpos = getValidIndex(bi, bj - 1)
				let ub = map.blData[ubpos]
				if (!blockTopColor[ub] && map.fgData[ubpos] == 0) {
					bm.fillStyle = blockTopColor[b]
					bm.fillRect(x, y, tsz, tsz3)
				}
			}
			bm.globalAlpha = 1
			renderTileFrame(bm, x, y, 1, 3, '#222')
		}
	}
}

function renderTileEntity(bm, x, y, te) {
	let mode = ''
	let data = ''
	if (te.sprite) {
		let tsz6 = Math.round(tsz / 6)
		let tsz23 = Math.round(2 * tsz / 3)
		let tsz34 = Math.round(3 * tsz / 4)
		switch (te.sprite) {
			case 'woodendoor':
				bm.fillStyle = '#863'
				bm.fillRect(x + tsz6, y, tsz23, tsz)
				return
			break
			case 'cavedoor':
				bm.fillStyle = '#000'
				bm.fillRect(x, y + tsz4, tsz, tsz34)
				bm.fillRect(x + tsz4, y, tsz2, tsz)
				return
			break
			case 'warp':
				bm.fillStyle = '#508'
				bm.fillRect(x, y + tsz2, tsz2, tsz4)
				bm.fillRect(x + tsz4, y, tsz4, tsz2)
				bm.fillRect(x + tsz2, y + tsz4, tsz2, tsz4)
				bm.fillRect(x + tsz2, y + tsz2, tsz4, tsz2)
				return
			break
			case 'signpost':
				bm.fillStyle = '#752'
				bm.fillRect(x + tsz2 - tsz6 / 2, y + tsz6, tsz6, tsz - tsz6)
				bm.fillStyle = '#863'
				bm.fillRect(x + tsz6, y + tsz4, tsz23, tsz2)
			break
			case 'signwall':
				bm.fillStyle = '#863'
				bm.fillRect(x + tsz6, y + tsz4, tsz23, tsz2)
			break
			case 'signrock':
				bm.fillStyle = '#444'
				bm.fillRect(x + tsz6, y + tsz4, tsz23, tsz34)
				bm.fillRect(x + tsz6 / 2, y + tsz2, tsz - tsz6, tsz2)
			break
			default:
				// emoji or chars
				mode = 'text'
				data = te.sprite
			break
		}
		if (te.sprite.startsWith('sign')) {
			bm.fillStyle = '#000'
			for (let k = 0; k < 3; k++) {
				bm.fillRect(x + tsz4, y + tsz3 + tsz4 / 2 * k, tsz2, tsz6 / 3)
			}
			return
		}
	}
	if (!mode) {
		// unknown tile entity, render as a '?'
		mode = 'text'
		data = String.fromCharCode(0xFFFD)
	}
	
	if (mode == 'text') {
		bm.font = tsz2 + 'px sans-serif'
		bm.textAlign = 'center'
		bm.textBaseline = 'middle'
		bm.fillStyle = '#000'
		bm.fillText(data, x + tsz2, y + tsz2)
	}
}

function renderTileFrame(bm, x, y, d, lw, color) {
	d += 0.5
	bm.lineWidth = lw
	bm.strokeStyle = color
	bm.strokeRect(x + d, y + d, tsz - 2 * d, tsz - 2 * d)
	bm.globalAlpha = 1
}

function renderOrangeC(bm, x, y, w, h, dir, bored) {
    bm.drawImage(imgs['orangec' + dir], x, y, w, h)
	if (bored) {
		bm.drawImage(imgs['bored' + dir], x, y, w, h)
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

function renderDebug(debug) {
	let latW = Math.floor(w / 2)
	let latH = Math.floor(h / 5)
	let latY = h - 20
	
	bm.fillStyle = '#fff'
	bm.globalAlpha = 0.1
	bm.fillRect(0, latY - latH, latW, latH)
	bm.globalAlpha = 1
	
	bm.lineWidth = 1
	for (let [prop, color] of [['renderT', '#f00'], ['engineT', '#00f']]) {
		bm.strokeStyle = color
		bm.beginPath()
		for (let i = 0; i < debug.series.length; i++) {
			let t = debug.series[i][prop]
			bm.lineTo(latW * i / debug.maxSize, latY - latH * t / tickDelay)
		}
		bm.stroke()
	}
	
	// max time
	bm.strokeStyle = '#ff0'
	bm.beginPath()
	bm.moveTo(0, latY - latH)
	bm.lineTo(latW, latY - latH)
	bm.moveTo(0, latY - latH / 4)
	bm.lineTo(latW, latY - latH / 4)
	bm.stroke()
	
	// coords
	bm.font = tsz3 + 'px monospace'
	bm.textAlign = 'left'
	bm.textBaseline = 'top'
	bm.strokeStyle = '#000'
	bm.fillStyle = '#fff'
	bm.lineWidth = Math.ceil(tsz4 * 0.2)
	let i = 0
	for (let prop of ['x', 'y', 'vx', 'vy', 'ground']) {
		let x = 10
		let y = 30 + (++i) * tsz3
		let value = pl[prop]
		if (typeof(value) == 'number') value = value.toFixed(3)
		strokeFillText(bm, prop + ': ' + value, x, y)
	}
}