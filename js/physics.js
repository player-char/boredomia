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
		portalImmune: false,
		editor: false,
		progress: {},
		save: null,
    }
	savePlayer()
}

function savePlayer() {
	pl.save = JSON.stringify(pl, (key, value) => key == 'save' ? null : value)
}

function resetPlayer() {
	let save = pl.save
	pl = JSON.parse(save)
	pl.save = save
	map = loadMap(getLvl(map.name), pl.progress)
	requestFullTileUpdate()
}


// the speed of physics (must be <= 1)
let timeFactor = 0.6875
// physical constants
const PHYS = {
	ga:       0.03   * (timeFactor**2) , // gravity acceleration
	runa:     0.06   * (timeFactor**2) , // running acceleration
	flya:     0.01   * (timeFactor**2) , // flying acceleration
	stopv:    0.08   * timeFactor      , // stop speed
	jumpv:    0.47   * timeFactor      , // jump start speed
	maxvx:    0.5    * timeFactor      , // max horizontal speed
	maxvy:    0.9375 * timeFactor      , // max vertical speed
	gammar:   0.8   ** timeFactor      , // ground non-friction
	gammaf:   0.983 ** timeFactor      , // air non-friction
	uh:       0.65                     , // height of player character
	uw:       0.4                      , // half of thickness of player character
	ulw:      0.2                      , // landing width
	jumpcd:   20     / timeFactor  | 0 , // jump cooldown ticks
	edflyv:   0.5    * timeFactor      , // editor fly speed
	zoombase: 1.1                      , // editor zoom base
	zoommin:  1                        , // editor zoom limit
	zoommax:  4                        , // editor zoom limit
	eps:      0.01                     , // epsilon, a small number for offsets
}

function isSolid(b) {
	return blockSolid[b]
}

function isDeadly(b) {
	return b === 10
}

function processPhysics(inputs) {
	// editor physics
	if (pl.editor) {
		pl.x += PHYS.edflyv * inputs.x
		pl.y -= PHYS.edflyv * inputs.y
		
		if (inputs.zoom) {
			zoom *= PHYS.zoombase ** inputs.zoom
			zoom = Math.min(Math.max(PHYS.zoommin, zoom), PHYS.zoommax)
			resize()
		}
		
		return
	}
	// game physics
	if (pl.jumpCooldown) {
		pl.jumpCooldown--
	}
	if (inputs.x) {
		// run
		pl.vx += inputs.x * (pl.ground ? PHYS.runa : PHYS.flya)
		if (pl.vx > PHYS.maxvy) pl.vy = PHYS.maxvy
		if (pl.vx < -PHYS.maxvy) pl.vy = -PHYS.maxvy
		pl.dir = +(inputs.x > 0)
	}
	if (pl.ground && inputs.y > 0 && !pl.jumpCooldown) {
		// jump
		pl.ground = false
		pl.vy = -PHYS.jumpv
		pl.jumpCooldown = PHYS.jumpcd
	}
	
	if (!pl.vx && !pl.vy && !inputs.x && !inputs.y && pl.ground && !inputs.action) {
		// no motion at all
		return
	}
	let newx = pl.x + pl.vx
	let newy = pl.y + pl.vy
	
	// check ceiling
	if (pl.vy <= 0.0) {
		let crb = getBlockAt(pl.x + PHYS.ulw, newy - PHYS.uh)
		let clb = getBlockAt(pl.x - PHYS.ulw, newy - PHYS.uh)
		if (isSolid(crb) || isSolid(clb)) {
			pl.y = Math.ceil(newy - PHYS.uh) + PHYS.uh + PHYS.eps
			pl.vy = 0.0
		}
	}
	
	// check walls
	for (let dir of [-1.0, 1.0]) {
		let wlb = getBlockAt(newx + PHYS.uw * dir, pl.y - 0.3)
		let wub = getBlockAt(newx + PHYS.uw * dir, pl.y - 0.5)
		if (isSolid(wlb) || isSolid(wub)) {
			pl.vx = 0.0
			if (isSolid(wlb)) {
				pl.x = Math.floor(pl.x) + 0.5 + dir * (0.5 - PHYS.uw - PHYS.eps)
			}
		}
	}
	
	// movement
	pl.x += pl.vx
	if (!pl.ground) {
		pl.y += pl.vy
		pl.vy += PHYS.ga
		if (pl.vy > PHYS.maxvy) pl.vy = PHYS.maxvy
		
		// landing
		let rb = getBlockAt(pl.x + (inputs.x > 0 ? PHYS.uw : PHYS.ulw), pl.y)
		let lb = getBlockAt(pl.x - (inputs.x < 0 ? PHYS.uw : PHYS.ulw), pl.y)
		if (isDeadly(rb) || isDeadly(lb)) {
			pl.alive = false
			pl.bored = true
		}
		if (isSolid(rb) || isSolid(lb)) {
			pl.y = Math.floor(pl.y)
			pl.vy = 0.0
			pl.ground = true
		}
	} else {
		// fall down
		let rb = getBlockAt(pl.x + PHYS.ulw, pl.y + PHYS.eps)
		let lb = getBlockAt(pl.x - PHYS.ulw, pl.y + PHYS.eps)
		if (!isSolid(rb) && !isSolid(lb)) {
			pl.ground = false
		} else if (inputs.y < 0) {
			// falling down intentionally
			let rb = getBlockAt(pl.x + PHYS.uw, pl.y + PHYS.eps)
			let lb = getBlockAt(pl.x - PHYS.uw, pl.y + PHYS.eps)
			let dir = (!isSolid(rb) - !isSolid(lb))
			if (dir && dir * pl.vx >= 0) {
				pl.x += 0.17 * dir
				pl.vx = 0
			}
		}
	}
	
	// horizontal movement friction
	if (inputs.x == 0 && Math.abs(pl.vx) < PHYS.stopv) {
		pl.vx = 0.0
	} else {
		pl.vx *= pl.ground ? PHYS.gammar : PHYS.gammaf
	}
	// vertical movement friction
	pl.vy *= PHYS.gammaf
	
	let bi = Math.floor(pl.x)
	let bj = Math.floor(pl.y - PHYS.uh / 2)
	
	// tileentity collision
	let te = getTileEntity(bi, bj)
	if (!te || te.type != 'portal') {
		pl.portalImmune = false
	}
	if (te) {
		if (te.collect) {
			collectTileEntity(te)
		} else {
			tryEnterPortal(te)
			if (te.type === 'sign' && inputs.action) {
				// alert is to be replaced with an appropriate way of displaying
				resetControls()
				alert(te.text)
			}
		}
	}
	
	// foreground uncover
	let bpos = getValidIndex(bi, bj)
	let fg = map.fgData[bpos]
	let fgCurr = map.fgDataCurr[bpos]
	if (map.fgEntrance) {
		// leave hidden area
		if (fg === 0 || fgCurr !== 0) {
			mapFloodFill(map.fgEntrance,
				(i, j) => map.fgDataCurr[index(i, j)] === 0 && map.fgData[index(i, j)] !== 0,
				(i, j) => {
					map.fgDataCurr[index(i, j)] = map.fgData[index(i, j)]
					requestTileUpdate(i, j, true)
				})
			map.fgEntrance = null
		}
	}
	if (!map.fgEntrance) {
		// enter hidden area
		if (fgCurr !== 0) {
			map.fgEntrance = [bi, bj]
			mapFloodFill(map.fgEntrance,
				(i, j) => map.fgDataCurr[index(i, j)] !== 0,
				(i, j) => {
					map.fgDataCurr[index(i, j)] = 0
					requestTileUpdate(i, j, true)
				})
		}
	}
}

function tryEnterPortal(te) {
	if (te.type !== 'portal') return
	if (pl.portalImmune) return
	if (!te.lvl || !te.dest) return
	
	let lvlName = te.lvl
	let destId = te.dest
	
	let newMap = map
	if (lvlName != '@') {
		let lvl = getLvl(te.lvl)
		if (!lvl) {
			pl.bored = true // lvl not ready = game boring
			return
		}
		newMap = loadMap(lvl, pl.progress)
	}
	let destTE = newMap.tileEntityList.find((te) => te.id == destId)
	if (!destTE) {
		console.error('no destination found', te.lvl, te.dest)
		return
	}
	
	//pl.x = pl.x - te.x + destTE.x
	//pl.y = pl.y - te.y + destTE.y
	pl.x = destTE.x + 0.5
	pl.y = destTE.y + 1
	pl.portalImmune = true
	if (lvlName != '@') {
		map = newMap
		// save player when entering another lvl
		savePlayer()
	}
	requestFullTileUpdate()
}

function collectTileEntity(te) {
	pl.score += te.score
	pl.progress[map.name + ':' + te.id] = 1
	destroyTileEntity(te)
}
