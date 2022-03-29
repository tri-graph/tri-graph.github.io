const nodeStyle = {
  fill: [
    {r:55/255,g:126/255,b:184/255, a:1},
    {r:166/255,g:86/255,b:40/255, a:1},
    {r:228/255,g:26/255,b:28/255, a:1},
    {r:77/255,g:175/255,b:74/255, a:1},
    {r:152/255,g:78/255,b:163/255, a:1},
    {r:255/255,g:127/255,b:0/255, a:1},
    {r:247/255,g:129/255,b:191/255, a:1},
    {r:224/255,g:130/255,b:20/255, a:1},
    {r:153/255,g:153/255,b:153/255, a:1}
    ],
  r: 3,
  strokeColor: {
    r: 255 / 255,
    g: 255 / 255,
    b: 255 / 255,
    a: 1,
  },
  egoStrokeWidth: 3,
  egoStrokeColor: {
    r: 2 / 255,
    g: 2 / 255,
    b: 2 / 255,
    a: 1,
  },
  lassoFill: {
    r: 255 / 255,
    g: 0,
    b: 0,
    a: 1,
  },
  lassoR: 8,
  clickFill: {
    r: 205 / 255,
    g: 205 / 255,
    b: 180 / 255,
    a: 1,
  },
  clickR: 10,
  strokeWidth: 0.5,
};
const linkStyle = {
  strokeColor: {
    //103, 105, 107
    r: 140 / 255,
    g: 140 / 255,
    b: 140 / 255,
    a: 0.1,
  },
  strokeWidth: 1,
  highLightStrokeColor: {
    r: 49 / 255,
    g: 134 / 255,
    b: 199 / 255,
    a: 1,
  },
  highLightTriStrokeColor: {
    r: 251 / 255,
    g: 154 / 255,
    b: 153 / 255,
    a: 1,
  },
  highLightStrokeWidth: 3,
  highLightStrokeTriWidth: 1.5,
};

export { nodeStyle, linkStyle };
