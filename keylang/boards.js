export const BOARDS = {
    "canvas":{
        name:"canvas",
        before:`import {KCanvas} from './canvas.js'`,
        standard_cycle:true,
    },


    "matrix":{
        name:"matrix",
        before:`
        import {KCanvas} from './matrixportal.js'
        let screen = new KCanvas(0,0,64,32)`,
        standard_cycle:true,
        python:{
            libs:[
                'common',
                'tasks',
                'matrix',
                'lists',
            ],
            imports: `
import displayio
from adafruit_matrixportal.matrixportal import MatrixPortal
import adafruit_fancyled.adafruit_fancyled as fancy
from adafruit_display_shapes import roundrect
from common import WHITE, BLACK, RED, GREEN, BLUE, remap, sine1, floor, System, pick, Obj, randi, randf
from lists import List, range, wrap, add
from matrix import Canvas
  `.trim(),
            template_path:'templates/matrix_template.py'
        }
    },


    "trellis":{
        name:"trellis",
        before:`import {Trellis} from './trellis.js'
        let trellis = new Trellis(8,4)`,
        standard_cycle:true,
        python:{
            libs:[
                'common',
                'tasks',
                'trellis',
                'lists',
            ],
            imports:`
from lists import List
            `,
            template_path:'templates/trellis.py'
        }
    },


    "trinkey":{
        name:"trinkey",
        before:`import {board, Button, NeoPixel, print, GREEN, RED, BLACK, WHITE, BLUE, TaskManager, _NOW} from './trinkey.js'`,
        standard_cycle:true,
        python: {
            libs:[
                'common',
                'tasks',
            ],
            imports:`
            `,
            template_path:'templates/trinkey.py'
        }
    },


    "thumby":{
        name:"thumby",
        before:`import {board, ThumbyCanvas, Button, DPad} from './thumby.js'`,
        standard_cycle:true,
        template_path:'templates/thumby.html'
    },
}
