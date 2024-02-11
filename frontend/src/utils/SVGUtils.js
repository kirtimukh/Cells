const getSvgPath = (heads, cMeta) => {
    let [height, width] = [cMeta.ch, cMeta.cw];
    let [startX, startY] = [0, 0];

    if (heads[0] === 1) {
        height += cMeta.os
        startY = cMeta.os
    }
    if (heads[1] === 1) {
        width += cMeta.os
    }
    if (heads[2] === 1) {
        height += cMeta.os
    }
    if (heads[3] === 1) {
        width += cMeta.os
        startX = cMeta.os
    }

    const distanceC2C = Math.round(cMeta.radius * Math.sin(Math.PI * (100 / 360)));
    const [rx, ry] = [cMeta.radius, cMeta.radius]
    const arcToEdge = cMeta.cw / 2 - distanceC2C

    let [pointX, pointY] = [startX, startY]
    let svgPath = `M ${pointX} ${pointY}`
    let svgPin;

    let cellPin = heads[0]
    if (cellPin !== 0) {
        pointX = pointX + arcToEdge
        svgPath += ` L ${pointX} ${pointY}`

        svgPin = (cellPin === -1) ? 0 : 1
        pointX = pointX + 2 * distanceC2C
        svgPath += ` A ${rx} ${ry} 0 1 ${svgPin} ${pointX} ${pointY}`
    }
    pointX = startX + cMeta.cw
    svgPath += ` L ${pointX} ${pointY}`

    cellPin = heads[1]
    if (cellPin !== 0) {
        pointY = pointY + arcToEdge
        svgPath += ` L ${pointX} ${pointY}`

        svgPin = (cellPin === -1) ? 0 : 1
        pointY = pointY + 2 * distanceC2C
        svgPath += ` A ${rx} ${ry} 0 1 ${svgPin} ${pointX} ${pointY}`
    }
    pointY = startY + cMeta.ch
    svgPath += ` L ${pointX} ${pointY}`

    cellPin = heads[2]
    if (cellPin !== 0) {
        pointX = pointX - arcToEdge
        svgPath += ` L ${pointX} ${pointY}`

        svgPin = (cellPin === -1) ? 0 : 1
        pointX = pointX - 2 * distanceC2C
        svgPath += ` A ${rx} ${ry} 0 1 ${svgPin} ${pointX} ${pointY}`
    }
    pointX = startX
    svgPath += ` L ${pointX} ${pointY}`

    cellPin = heads[3]
    if (cellPin !== 0) {
        pointY = pointY - arcToEdge
        svgPath += ` L ${pointX} ${pointY}`

        svgPin = (cellPin === -1) ? 0 : 1
        pointY = pointY - 2 * distanceC2C
        svgPath += ` A ${rx} ${ry} 0 1 ${svgPin} ${pointX} ${pointY}`
    }
    pointY = startY
    svgPath += ` L ${pointX} ${pointY}`

    return svgPath
}


const svgColors = ['aqua',
    'aquamarine',
    'blue',
    'blueviolet',
    'chartreuse',
    'coral',
    'cornflowerblue',
    'crimson',
    'darkmagenta',
    'darkorchid',
    'darkturquoise',
    'darkviolet',
    'deeppink',
    'deepskyblue',
    'dodgerblue',
    'fuchsia',
    'gold',
    'greenyellow',
    'hotpink',
    'indigo',
    'lavender',
    'lawngreen',
    'lightblue',
    'lightcoral',
    'lightgreen',
    'lightpink',
    'lightsalmon',
    'lightseagreen',
    'lightskyblue',
    'lime',
    'limegreen',
    'magenta',
    'mediumaquamarine',
    'mediumblue',
    'mediumorchid',
    'mediumpurple',
    'mediumseagreen',
    'mediumslateblue',
    'mediumspringgreen',
    'mediumturquoise',
    'mediumvioletred',
    'orangered',
    'orchid',
    'palegreen',
    'palevioletred',
    'plum',
    'powderblue',
    'rebeccapurple',
    'royalblue',
    'seagreen',
    'skyblue',
    'slateblue',
    'springgreen',
    'steelblue',
    'teal',
    'tomato',
    'turquoise',
    'violet',
    'whitesmoke',
    'yellowgreen'
]

export { getSvgPath, svgColors }