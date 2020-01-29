// physical constants
const PHYS = {
	ga: 0.03,       // gravity acceleration
	runa: 0.06,     // running acceleration
	flya: 0.01,     // flying acceleration
	stopv: 0.08,    // stop speed
	jumpv: 0.47,    // jump start speed
	maxvx: 0.5,     // max horizontal speed
	maxvy: 0.9375,  // max vertical speed
	gammar: 0.8,    // ground non-friction
	gammaf: 0.983,  // air non-friction
	uh: 0.65,       // height of player character
	uw: 0.4,        // half of thickness of player character
	ulw: 0.2,       // landing width
	jumpcd: 20,     // jump cooldown ticks
	edflyv: 0.5,    // editor fly speed
	eps: 0.01,      // epsilon, a small number for offsets
}

function isSolid(b) {
	return blockSolid[b]
}

function isDeadly(b) {
	return b === 10
}

function processPhysics() {
	let inp = getKeyInputs()
	// editor physics
	if (g.editor) {
		pl.x += PHYS.edflyv * inp.x
		pl.y -= PHYS.edflyv * inp.y
		return
	}
	// game physics
	if (pl.jumpCooldown) {
		pl.jumpCooldown--
	}
	if (inp.x) {
		// run
		pl.vx += inp.x * (pl.ground ? PHYS.runa : PHYS.flya)
		if (pl.vx > PHYS.maxvy) pl.vy = PHYS.maxvy
		if (pl.vx < -PHYS.maxvy) pl.vy = -PHYS.maxvy
		pl.dir = +(inp.x > 0)
	}
	if (pl.ground && inp.y > 0 && !pl.jumpCooldown) {
		// jump
		pl.ground = false
		pl.vy = -PHYS.jumpv
		pl.jumpCooldown = PHYS.jumpcd
	}
	
	if (!pl.vx && !pl.vy && !inp.x && !inp.y && pl.ground) {
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
	let dir = Math.sign(pl.vx)
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
		let rb = getBlockAt(pl.x + (inp.x > 0 ? PHYS.uw : PHYS.ulw), pl.y)
		let lb = getBlockAt(pl.x - (inp.x < 0 ? PHYS.uw : PHYS.ulw), pl.y)
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
		} else if (inp.y < 0 && (!isSolid(rb) || !isSolid(lb))) {
			// falling down intentionally
			pl.x += 0.17 * (!isSolid(rb) - !isSolid(lb))
		}
	}
	
	// horizontal movement friction
	if (inp.x == 0 && Math.abs(pl.vx) < PHYS.stopv) {
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
	if (te) {
		if (te.collect) {
			pl.score += te.score
			destroyTileEntity(te)
		}
	}
	
	// foreground uncover
	let bpos = getValidIndex(bi, bj)
	let fg = map.fgData[bpos]
	let fgCurr = map.fgDataCurr[bpos]
	if (map.fgEntrance) {
		if (fg === 0) {
			mapFloodFill(map.fgEntrance,
				(i, j) => map.fgDataCurr[index(i, j)] === 0 && map.fgData[index(i, j)] !== 0,
				(i, j) => {
					map.fgDataCurr[index(i, j)] = map.fgData[index(i, j)]
					renderTileGlobal(i, j)
				})
			map.fgEntrance = null
		}
	} else {
		if (fgCurr !== 0) {
			map.fgEntrance = [bi, bj]
			mapFloodFill(map.fgEntrance,
				(i, j) => map.fgDataCurr[index(i, j)] !== 0,
				(i, j) => {
					map.fgDataCurr[index(i, j)] = 0
					renderTileGlobal(i, j)
				})
		}
	}
}
