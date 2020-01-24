function windowPosToCoords(x, y, check) {
	let rect = canv.getBoundingClientRect()
	x = (x - rect.x) / rect.width
	y = (y - rect.y) / rect.height
	if (x < 0 || y < 0 || x >= 1 || y >= 1) return
	let bi = Math.floor((x * w - w2) / tsz + pl.x)
	let bj = Math.floor((y * h - h2) / tsz + pl.y + camYOffset)
	if (check && (bi < 0 || bj < 0 || bi >= map.w || bj >= map.h)) return
	return [bi, bj]
}

function setBlock(bi, bj, value) {
	bj = map.h - 1 - bj
	map.data[bj] = map.data[bj].slice(0, bi) + value + map.data[bj].slice(bi + 1)
}

let mouseActive = false

window.addEventListener('mousedown', (event) => {
	if (!g || !g.editor) return
	let result = windowPosToCoords(event.pageX, event.pageY, true)
	if (!result) return
	let [bi, bj] = result
	setBlock(bi, bj, 's')
	mouseActive = true
})

window.addEventListener('mouseup', (event) => {
	if (!g || !g.editor) return
	mouseActive = false
})

window.addEventListener('mousemove', (event) => {
	if (!g || !g.editor || !mouseActive) return
	let result = windowPosToCoords(event.pageX, event.pageY, true)
	if (!result) return
	let [bi, bj] = result
	setBlock(bi, bj, 's')
})