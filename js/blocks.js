const blockSkyColor = '#adf'
const blockInfo = [
	/*   0 [.] */ {color: '', bg: '', top: '', solid: false, name: 'air'},
	/*   1 [#] */ {color: '', bg: '', top: '', solid: true, name: 'barrier'},
	/*   2 [g] */ {color: '#532', bg: '#5a7', top: '#5a5', solid: true, name: 'grass'},
	/*   3 [d] */ {color: '#532', bg: '#421', top: '#642', solid: true, name: 'dirt'},
	/*   4 [s] */ {color: '#555', bg: '#333', top: '#666', solid: true, name: 'stone'},
	/*   5 [n] */ {color: '#ca5', bg: '#653', top: '#cb7', solid: true, name: 'sand'},
	/*   6 [t] */ {color: '#974', bg: '#532', top: '#642', solid: true, name: 'wood'},
	/*   7 [f] */ {color: '#282', bg: '#263', top: '#151', solid: true, name: 'foliage'},
	/*   8 [o] */ {color: '#102', bg: '#324', top: '#213', solid: true, name: 'obsidian'},
	/*   9 [b] */ {color: '#522', bg: '#422', top: '#633', solid: true, name: 'brick'},
	/*  10 [l] */ {color: '#e51', bg: '#d60', top: '#f82', solid: false, name: 'lava'},
	/*  11 [w] */ {color: '#36b', bg: '#47b', top: '#48c', solid: false, name: 'water'},
	/*  12 [|] */ {color: '#888', bg: '#777', top: '#999', solid: true, name: 'pole'},
]

// optimize access because prop lookup is slow
const blockColor = []
const blockBGColor = []
const blockTopColor = []
const blockName = []
const blockSolid = []
for (let b of blockInfo) {
	blockColor.push(b.color)
	blockBGColor.push(b.bg || blockSkyColor)
	blockTopColor.push(b.top || null)
	blockName.push(b.name)
	blockSolid.push(b.solid)
}