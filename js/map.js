// 'map' means 'current part of the game world'

function getBlockAt(x, y) {
	return getBlock(Math.floor(x), Math.floor(y))
}

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
	
	j = map.h - 1 - j
    return map.data[j][i]
}

function getTileEntityAt(x, y) {
	return map.tileEntityMap.get(Math.floor(x) + '_' + Math.floor(y))
}

function destroyTileEntity(te) {
	map.tileEntityList = map.tileEntityList.filter((z) => (z != te))
	map.tileEntityMap.delete(te.x + '_' + te.y)
	renderTileGlobal(te.x, te.y)
}

function loadMap() {
	// map is hardcoded at the moment
	map = {}
	map.data = `
		s#............................................................................................................#
		ss............................................................................................................#
		ss..............................................................ssss.....................................gg...#
		ss.................................ggggggg......................|..|.............g.......................dd...#
		ss.................................|.....|..............g.......|..|..sss........ggggg...................;;;..#
		ss:................................|.....|..........g..;;.......|..|..s:;;.......|...|.......gg..........dd;..#
		ss:...g.............g.....g;gg;g...|gg...|....g.g...gg.;;......g;;g|.:s:ddgggggggggg.|.......||...ggg...:dd;;.#
		sss...;;......g...ggg;....d;.d;g..g;;;...|..g;;;;;;ggg;;;;..g;;;;;;:::s:ss;ssss:..:s.|.......||...|.|...:dd;;.#
		sssg.;;;...gggglllgggd.g..dd;;;ggggd;;;.gg;;;;;;;;;;;dd;d;;.;;;;;;::::s:::::::::s::sg|.......||...|.|..::ddd;.#
		sssdgdddgggddddlllsdsggggggddddddddddddggddddd;;;ddd;;dddddgdddddddslsssssssssssssssdgg.gg;ggllllllllllllddddgg
		ssssdddddddddddsllsdddddddddddddddddddddddddddddddddd;;;;;;;;;;;ddsssssssssssssssssssddgd;;ddlllllllllllldddddd
		ssssdddddddddddslllsddddddddddddddddddddddddddddddddddddddddddddddsssssssssssssssssssddddddddlllllllllllldddddd
	`.trim().split('\n').reverse().map(s => s.trim()),
    map.h = map.data.length
    map.w = map.data[0].length
	map.tileEntityList = [
		{
			type: 'food',
			sprite: '🍌',
			collect: true,
			score: 5,
			x: 6,
			y: 5,
		}
	]
	map.tileEntityMap = new Map()
	for (let te of map.tileEntityList) {
		map.tileEntityMap.set(te.x + '_' + te.y, te)
	}

	// init player
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
}

