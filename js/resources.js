let loader = document.getElementById('loader')
let imgs = {
    'orangec0': null,
    'orangec1': null,
    'boring': null,
    'bored0': null,
    'bored1': null,
}

let cachedSprites = {}

let lvls = {}

function loadRes(callback) {
    let imgsRequired = Object.keys(imgs).length

    for (let imgName in imgs) {
        let i = document.createElement('img')
        i.onload = () => {
			loader.removeChild(i)
            if (--imgsRequired == 0) {
				if (callback) callback()
            }
        }
        i.onerror = () => alert('Потрачено, релоадните страницу')
        i.src = `./img/${imgName}.png`
        imgs[imgName] = i
        loader.appendChild(i)
    }
}

function getCachedSprite(name, size) {
	let key = name + '_' + size
	if (!(key in cachedSprites)) {
		let spriteCanv = createCanvas(size, size)
		let bm = spriteCanv.getContext('2d')
		bm.drawImage(imgs[name], 0, 0, size, size)
		cachedSprites[key] = spriteCanv
	}
	return cachedSprites[key]
}

function getLvl(lvlName) {
	return lvls[lvlName]
}

function loadLvl(lvlName) {
	if (lvlName in lvls) {
		return Promise.resolve(lvls[lvlName])
	}
	return fetch(`./lvls/${lvlName}.json`)
		.then((response) => response.status == 200 ? response.text() : null)
		.then(data => data && (`{"name":"${lvlName}",` + data.slice(1)))
		.then(data => lvls[lvlName] = data)
}

function loadLvlInBackground(lvlName) {
	setTimeout(() => loadLvl(lvlName), 0)
}

function createCanvas(w, h) {
	if (typeof(OffscreenCanvas) != 'undefined') {
		return new OffscreenCanvas(w, h)
	}
	let c = document.createElement('canvas')
	c.width = w
	c.height = h
	return c
}
