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
	let loader = document.createElement('div')
	loader.style.position = 'fixed'
	loader.style.left = '100vw'
	loader.style.top = '100vh'
	document.body.appendChild(loader)
	
    let imgsRequired = 0
    for (let imgName in imgs) {
		if (imgs[imgName]) continue
		imgsRequired++
	}

    for (let imgName in imgs) {
		if (imgs[imgName]) continue
        let i = document.createElement('img')
        i.onload = () => {
			console.log('loaded ' + imgName)
			loader.removeChild(i)
            if (--imgsRequired == 0) {
				document.body.removeChild(loader)
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
		.then(data => insertLvlName(data, lvlName))
		.then(data => lvls[lvlName] = data)
}

function insertLvlName(data, name) {
	return data && (`{"name":"${name}",` + data.slice(1))
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
