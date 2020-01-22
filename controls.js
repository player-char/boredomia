let kd = new Map()
let availableKeys = [
	37 /* left  */, 65 /* A */,
	38 /* up    */, 87 /* W */,
	39 /* right */, 68 /* D */,
	40 /* down  */, 83 /* S */,
]
for (let k of availableKeys) {
	kd.set(k, 0)
}

window.onkeydown = function(e) {
	let k = e.keyCode
	//console.log(k)
	if (!kd.has(k)) return
	e.preventDefault()
	if (kd.get(k) == 1) return
	kd.set(k, 1)
	//btDown(k)
}

window.onkeyup = function(e) {
	let k = e.keyCode
	if (!kd.has(k)) return
	e.preventDefault()
	kd.set(k, 0)
}

window.onblur = function(e) {
	for (let k of availableKeys) {
		kd.set(k, 0)
	}
}

function getKeyInputs() {
	return {
		y: (kd.get(38) || kd.get(87)) - (kd.get(40) || kd.get(83)),
		x: (kd.get(39) || kd.get(68)) - (kd.get(37) || kd.get(65)),
	}
}
