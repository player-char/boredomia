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
		paused: false,
		score: 0,
		portalImmune: false,
		editor: false,
		progress: {},
		save: null,
    }
	savePlayer()
}

function savePlayer(x, y) {
	let saveData = Object.assign({}, pl)
	saveData.save = null
	if (x && y) {
		saveData.x = x
		saveData.y = y
		saveData.vx = 0.0
		saveData.vy = 0.0
	}
	pl.save = JSON.stringify(saveData)
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
	stopv:    0.12   * timeFactor      , // stop speed
	jumpv:    0.485  * timeFactor      , // jump start speed
	maxvx:    0.5    * timeFactor      , // max horizontal speed
	maxvy:    0.9375 * timeFactor      , // max vertical speed
	ladderv:  0.1    * timeFactor      , // speed when on ladder
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
	eps:      0.001                    , // epsilon, a small number for offsets
}

function isSolidAt(x, y) {
	return blockSolid[getBlockAt(x, y)]
}

function isLadderAt(x, y) {
	let te = getTileEntity(Math.floor(x), Math.floor(y))
	return te && te.type == 'ladder'
}

function processGameTick() {
	if (!pl || pl.paused) return

	let inputs = getKeyInputs()
	
	if (pl.editor) {
		processEditorActions(pl, inputs)
	} else {
		processPlayerActions(pl, inputs)
	}
	//if (!pl.editor) {
	//	processWorldActions()
	//}
}

function processEditorActions(pl, inputs) {
	pl.x += PHYS.edflyv * inputs.x
	pl.y -= PHYS.edflyv * inputs.y
	
	if (inputs.zoom) {
		zoom *= PHYS.zoombase ** inputs.zoom
		zoom = Math.min(Math.max(PHYS.zoommin, zoom), PHYS.zoommax)
		resize()
	}
}


function processPlayerActions(pl, inputs) {
	processPlayerMovement(pl, inputs)
	processPlayerTileVisit(pl, inputs.action)
	processPlayerHazards(pl)
}

function processPlayerMovement(pl, inputs) {
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
	if (pl.ground && (inputs.y > 0 || inputs.space) && !pl.jumpCooldown) {
		// jump
		pl.ground = false
		pl.vy = -PHYS.jumpv
		pl.jumpCooldown = PHYS.jumpcd
	}
	
	let onLadder = isLadderAt(pl.x, pl.y - PHYS.eps)
	if (onLadder) {
		if (pl.ground && inputs.y > 0) {
			pl.ground = false
		}
		if (!pl.ground) {
			pl.vx = inputs.x * PHYS.ladderv
			pl.vy = -inputs.y * PHYS.ladderv
		}
	}
	
	//if (!pl.vx && !pl.vy && !inputs.x && !inputs.y && pl.ground && !inputs.action) {
	//	// no motion at all
	//	return
	//}
	let newx = pl.x + pl.vx
	let newy = pl.y + pl.vy
	
	// check ceiling
	if (pl.vy <= 0.0) {
		let crb = isSolidAt(pl.x + PHYS.ulw, newy - PHYS.uh)
		let clb = isSolidAt(pl.x - PHYS.ulw, newy - PHYS.uh)
		if (crb || clb) {
			pl.y = Math.ceil(newy - PHYS.uh) + PHYS.uh + PHYS.eps
			pl.vy = 0.0
		}
	}
	
	// check walls
	for (let dir of [-1.0, 1.0]) {
		let wlb = isSolidAt(newx + PHYS.uw * dir, pl.y - 0.3)
		let wub = isSolidAt(newx + PHYS.uw * dir, pl.y - 0.5)
		if (wlb || wub) {
			pl.vx = 0.0
			if (wlb) {
				pl.x = Math.floor(pl.x) + 0.5 + dir * (0.5 - PHYS.uw - PHYS.eps)
			}
		}
	}
	
	// movement
	pl.x += pl.vx
	if (pl.ground) {
		if (inputs.y < 0) {
			// falling down intentionally
			let rb = isSolidAt(pl.x + PHYS.uw, pl.y + PHYS.eps)
			let lb = isSolidAt(pl.x - PHYS.uw, pl.y + PHYS.eps)
			let dir = (!rb - !lb)
			if (dir && dir * pl.vx >= 0) {
				pl.x += 0.17 * dir
				pl.vx = 0
			}
		}
		// fall down
		let rb = isSolidAt(pl.x + PHYS.ulw, pl.y + PHYS.eps)
		let lb = isSolidAt(pl.x - PHYS.ulw, pl.y + PHYS.eps)
		if (!rb && !lb) {
			pl.ground = false
		}
	}
	if (!pl.ground) {
		// not on ground
		pl.y += pl.vy + 0.5 * PHYS.ga
		pl.vy += PHYS.ga
		if (pl.vy > PHYS.maxvy) pl.vy = PHYS.maxvy
		
		// landing
		let rb = isSolidAt(pl.x + (inputs.x > 0 ? PHYS.uw : PHYS.ulw), pl.y)
		let lb = isSolidAt(pl.x - (inputs.x < 0 ? PHYS.uw : PHYS.ulw), pl.y)
		
		if (rb || lb) {
			pl.y = Math.floor(pl.y)
			pl.vy = 0.0
			pl.ground = true
		}
	}
	
	// horizontal movement friction
	if (pl.ground && inputs.x == 0 && Math.abs(pl.vx) < PHYS.stopv) {
		// full stop
		pl.vx = 0.0
	} else {
		// friction
		pl.vx *= pl.ground ? PHYS.gammar : PHYS.gammaf
	}
	// vertical movement friction
	pl.vy *= PHYS.gammaf
}

function killPlayer() {
	pl.paused = true
	pl.alive = false
	pl.bored = true
}

function isDeadlyAt(x, y) {
	let b = getBlockAt(x, y)
	return b === 10
}

function processPlayerHazards(pl) {
	// check if player fell out of map
	if (pl.y > map.w + 3) {
		killPlayer()
		return
	}
	
	// check nearby blocks for being dangerous
	let rlb = isDeadlyAt(pl.x + PHYS.uw, pl.y - PHYS.eps)
	let llb = isDeadlyAt(pl.x - PHYS.uw, pl.y - PHYS.eps)
	let rub = isDeadlyAt(pl.x + PHYS.uw, pl.y - PHYS.uh)
	let lub = isDeadlyAt(pl.x - PHYS.uw, pl.y - PHYS.uh)
	if (rlb || rub || llb || lub) {
		killPlayer()
		return
	}
}

function processPlayerTileVisit(pl, action) {
	let bi = Math.floor(pl.x)
	let bj = Math.floor(pl.y - PHYS.uh / 2)
	
	processForegroundDiscovery(bi, bj)
	processPlayerTileEntityCollision(pl, bi, bj, action)
}

function processForegroundDiscovery(bi, bj) {
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

function processPlayerTileEntityCollision(pl, bi, bj, action) {
	let te = getTileEntity(bi, bj)
	
	if (!te || te.type != 'portal') {
		pl.portalImmune = false
	}
	if (!te) return
	if (te.collect) {
		collectTileEntity(te)
		return
	}
	
	switch (te.type) {
		case 'portal':
			tryEnterPortal(te)
		break
		case 'sign':
			if (action) {
				let signColor = te.sprite != 'signrock' ? '#974' : '#666'
				showSignMessage(te.text, signColor)
			}
		break
		case 'checkpoint':
			savePlayer(te.x + 0.5, te.y + 1.0)
		break
		case 'death':
			killPlayer()
		break
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
	
	// teleport player to the center of the tile
	pl.x = destTE.x + 0.5
	pl.y = destTE.y + 1
	
	// prevent entering portal again
	pl.portalImmune = true
	
	if (lvlName != '@') {
		map = newMap
		// save player when entering another lvl
		savePlayer(pl.x, pl.y)
	}
	processPlayerTileVisit(pl, false)
	requestFullTileUpdate()
}

function collectTileEntity(te) {
	if (te.score) {
		pl.score += te.score
	}
	pl.progress[map.name + ':' + te.id] = 1
	destroyTileEntity(te)
}
