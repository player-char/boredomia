function getBlockAt(x, y) {
	return getBlock(Math.floor(x), Math.floor(y))
}

function isOutOfMap(bi, bj) {
	return bi < 0 || bj < 0 || bi >= map.w || bj >= map.h
}

function isMapEdge(bi, bj) {
	return bi <= 0 || bj <= 0 || bi >= map.w-1 || bj >= map.h-1
}

function getValidIndex(i, j) {
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
	
	return index(i, j)
}

function getBlock(i, j) {
	return map.blData[getValidIndex(i, j)]
}

function getTileEntity(i, j) {
	return map.tileEntityMap.get(i + '_' + j)
}

function destroyTileEntity(te) {
	if (!te) return
	map.tileEntityList = map.tileEntityList.filter((z) => (z != te))
	map.tileEntityMap.delete(te.x + '_' + te.y)
	requestTileUpdate(te.x, te.y)
}

function addTileEntity(te) {
	if (!te) return
	map.tileEntityList.push(te)
	map.tileEntityMap.set(te.x + '_' + te.y, te)
	requestTileUpdate(te.x, te.y)
}

function mapFloodFill(start, condition, callback) {
	let queue = [start]
	while (queue.length) {
		let [bi, bj] = queue.shift()
		if (isOutOfMap(bi, bj)) continue
		if (condition(bi, bj)) {
			callback(bi, bj)
			queue.push([bi + 1, bj])
			queue.push([bi - 1, bj])
			queue.push([bi, bj + 1])
			queue.push([bi, bj - 1])
		}
	}
}

function loadMap(lvlData) {
	map = JSON.parse(lvlData)
	for (let prop of ['blData', 'bgData', 'fgData']) {
		map[prop] = Uint8ClampedArray.from(map[prop])
	}
	preprocessMap(map)
}

function createEmptyMap() {
	map = {
		w: 10,
		h: 10,
		defaultPlayerPos: {x: 4.5, y: 6, dir: 0},
		tileEntityList: [],
	}
	for (let prop of ['blData', 'bgData', 'fgData']) {
		map[prop] = new Uint8ClampedArray(map.w * map.h)
		map[prop].fill(0)
	}
	preprocessMap(map)
}

function preprocessMap(map) {
	map.fgDataCurr = Uint8ClampedArray.from(map.fgData)
	map.fgEntrance = null
	map.area = map.w * map.h
	
	map.tileEntityMap = new Map()
	for (let te of map.tileEntityList) {
		map.tileEntityMap.set(te.x + '_' + te.y, te)
	}
	
	// load all linked lvls
	for (let te of map.tileEntityList) {
		if (te.type !== 'portal') continue
		let lvlName = te.lvl
		let destId = te.destination
		if (!lvlName || !destId) continue
		loadLvl(lvlName)
	}
	
	tileCache = null
}

function index(i, j) {
	return i + j * map.w
}
