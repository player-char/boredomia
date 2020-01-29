let loader = document.getElementById('loader')
let imgs = {
    'orangec0': null,
    'orangec1': null,
    'boring': null,
    'bored0': null,
    'bored1': null,
}

let lvls = {}

function loadRes(callback) {
    let imgsRequired = Object.keys(imgs).length

    for (let imgName in imgs) {
        let i = document.createElement('img')
        i.onload = () => {
            //console.log('loaded', imgName)
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

function loadLvl(lvlName) {
	return fetch(`./lvls/${lvlName}.json`)
		.then((response) => response.text())
		.then(data => lvls[lvlName] = data)
}

//loadRes(startGame)
