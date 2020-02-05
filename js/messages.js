let signBox = document.createElement('div')
signBox.style.position = 'fixed'
signBox.style.top = '0'
signBox.style.left = '0'
signBox.style.width = '100vw'
signBox.style.height = '100vh'
signBox.style.display = 'none'
signBox.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'
document.body.appendChild(signBox)

let signText = document.createElement('div')
signText.style.fontSize = '3vw'
signText.style.textAlign = 'center'
signText.style.maxWidth = '80vw'
signText.style.padding = '4vw'
signText.style.margin = '10vh auto'
signText.style.boxShadow = '0 -0.5vh 1vw #000'
signBox.appendChild(signText)

function showSignMessage(text, color) {
	if (!pl) return
	pl.paused = true
	signText.textContent = text
	signText.style.fontSize = (2 + Math.sqrt(1000 / (1 + text.length))) + 'vw'
	signText.style.backgroundColor = color ? color : '#fff'
	signBox.style.display = ''
}

function hideSignMessage() {
	if (!pl || !pl.paused) return
	pl.paused = false
	signBox.style.display = 'none'
	resetControls()
}