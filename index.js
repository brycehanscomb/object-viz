import { fabric } from 'fabric';
import { xpc, xpx, ypc, ypx, pc, x, y, $, $$, getAngle, tanDeg } from './measures';
import { inRange } from 'lodash';
import Camera from './camera';
import BezierEasing from 'bezier-easing';
import {realAngle} from "./measures.js";

const floorPlanSource = $('#floorplan');
const floorImageSize = floorPlanSource.getBoundingClientRect();

const stage = $('#stage');
stage.width = floorImageSize.width;
stage.height = floorImageSize.height;

const bounds = stage.getBoundingClientRect();

const colors = [
    '#FF0000',
    '#0000FF',
    '#00FF00',
    '#FFA500',
    '#3D9970',
    '#B10DC9',
    '#111111',
    '#85144b'
];

const canvas = new fabric.Canvas('stage', {
    width: bounds.width,
    height: bounds.height
});

const modeButtons = $$('input[name="mode"]');
const images = $$('.image');
const checkBoxes = $$('input[type="checkbox"]');
const cursor = $('#cursor');

/**
 * @type {{mode: string, selectedImage: number, imageCameraMap: Map<HTMLImageElement, Camera>}}
 */
let state = {
    mode: 'camera',
    selectedImage: 5,
    imageCameraMap: new Map()
};

const sampleCameras = [
    [images[0], new Camera({
        position: [0, 80],
        viewLeft: [58, 2],
        viewRight: [18, 100],
        active: false
    })],
    [images[1], new Camera({
        position: [0, 50],
        viewLeft: [36, 0],
        viewRight: [28, 100],
        active: false
    })],
    [images[2], new Camera({
        position: [36, 0],
        viewLeft: [0, 43],
        viewRight: [0, 0],
        active: false
    })],
    [images[3], new Camera({
        position: [61, 0],
        viewLeft: [66, 99],
        viewRight: [16, 99],
        active: false
    })],
    [images[4], new Camera({
        position: [49, 40],
        viewLeft: [0, 19],
        viewRight: [66, 24],
        active: false
    })],
    [images[5], new Camera({
        position: [48.4, 44.9],
        viewLeft: [100, 100],
        viewRight: [38, 60.7],
        active: true
    })],
    [images[6], new Camera({
        position: [52.2, 100],
        viewLeft: [99.5, 53],
        viewRight: [99.5, 95],
        active: false
    })],
    [images[7], new Camera({
        position: [73, 100],
        viewLeft: [0, 20],
        viewRight: [100, 80],
        active: false
    })]
];

function setMode(newMode) {
    modeButtons.forEach(el => {
        if (el.getAttribute('value') === newMode) {
            el.checked = true;
        } else {
            el.checked = false;
        }
    })
}

function getQuadraticCurve(startPoint, endPoint, controlPoint) {
    function x(tuple) { return tuple[0];}
    function y(tuple) { return tuple[1];}

    const relativeEndPoint = [
        (x(endPoint) - x(startPoint)),
        (y(endPoint) - y(startPoint))
    ];

    const relativeControlPoint = [
        (x(controlPoint) - x(startPoint)),
        (y(controlPoint) - y(startPoint))
    ];

    return [...relativeControlPoint, ...relativeEndPoint];
}

/**
 * @param {number} target
 * @param {number} approx
 * @param {number} tolerance
 * @return {boolean}
 */
function isCloseTo(target, approx, tolerance) {
    return inRange(approx, target - tolerance, target + tolerance);
}

/**
 * @typedef {Array<number>} Point
 */

/**
 * @param {Point} startPoint
 * @param {Point} endPoint
 * @param {Point} controlPoint
 * returns {[number, number]}
 */
function quadraticBezierToEasing(startPoint, endPoint, controlPoint) {
    const absoluteS = startPoint;
    const absoluteE = endPoint;
    const absoluteC = controlPoint;

    function x(tuple) { return tuple[0]; }
    function y(tuple) { return tuple[1]; }
    function lerp(val, max, min) { return (val - min) / (max - min); }

    const relativeS = [
        x(absoluteS) - x(absoluteS),
        y(absoluteS) - y(absoluteS)
    ];
    const relativeE = [
        x(absoluteE) - x(absoluteS),
        y(absoluteE) - y(absoluteS),
    ];
    const relativeC = [
        x(absoluteC) - x(absoluteS),
        y(absoluteC) - y(absoluteS),
    ];

    const lerpedC = [
        lerp(x(relativeC), x(relativeE), x(relativeS)),
        lerp(y(relativeC), y(relativeE), y(relativeS))
    ];

    return lerpedC;
}

/**
 * @param {Camera} cam
 * @param {string} color
 * @param {boolean} isHighlighted
 */
function drawCameraView(cam, color, isHighlighted) {
    const dashes = [5,5];
    const strokeColor = `${color}AA`;

    let options = {
        stroke: strokeColor,
        strokeDashArray: dashes,
        selectable: false
    };

    if (isHighlighted) {
        options = {
            stroke: color,
            strokeWidth: 2,
            selectable: false
        };
    }

    console.log([
        `M ${xpx(x(cam.viewLeft))} ${ypx(y(cam.viewLeft))}`, // start here
        `Q ${xpx(x(cam.position))}, ${ypx(y(cam.position))}`, // gravity well here
        `${xpx(x(cam.viewRight))}, ${ypx(y(cam.viewRight))}` // finish here
    ].join(' '));

    const line = new fabric.Path(
        [
            `M ${xpx(x(cam.viewLeft))} ${ypx(y(cam.viewLeft))}`, // start here
            `Q ${xpx(x(cam.position))}, ${ypx(y(cam.position))}`, // gravity well here
            `${xpx(x(cam.viewRight))}, ${ypx(y(cam.viewRight))}` // finish here
        ].join(' ')
        , { fill: '', stroke: 'black', objectCaching: false });


    canvas.add(
        line,
        new fabric.Line(
            [
                xpx(x(cam.viewLeft)), ypx(y(cam.viewLeft)),
                xpx(x(cam.viewRight)), ypx(y(cam.viewRight)),
            ],
            {
                stroke: `${color}AA`,
                strokeWidth: 1,
                selectable: false
            }
        ),
        new fabric.Line(
            [
                xpx(x(cam.viewLeft)), ypx(y(cam.viewLeft)),
                xpx(x(cam.position)), ypx(y(cam.position)),
            ],
            options
        ),
        new fabric.Line(
            [
                xpx(x(cam.viewRight)), ypx(y(cam.viewRight)),
                xpx(x(cam.position)), ypx(y(cam.position)),
            ],
            options
        )
    );
}

/**
 * @param {Camera} cam
 * @param {string} color
 */
function drawCameraBase(cam, color) {
    const baseSize = 10;

    canvas.add(
        new fabric.Rect({
            left: xpx(x(cam.position)) - (baseSize / 2),
            top: ypx(y(cam.position)) - (baseSize / 2),
            width: baseSize,
            height: baseSize,
            fill: color,
            selectable: false,
            data: {
                cameraPart: 'base'
            }
        })
    );
}

/**
 * @param {Camera} cam
 * @param {string} color
 */
function drawCameraObject(cam, color) {
    if (cam.getObjectX() === null) {
        return;
    }

    const baseSize = 5;

    const planeIntersectionPosition = getPointAlongCamView(cam.getObjectX(), cam);

    const insideRayStart = cam.position;
    const insideRayEnd = planeIntersectionPosition;

    canvas.add(
        new fabric.Circle({
            left: xpx(x(planeIntersectionPosition)) - baseSize,
            top: ypx(y(planeIntersectionPosition)) - baseSize,
            radius: baseSize,
            fill: `${color}66`,
            strokeWidth: 2,
            stroke: color,
            selectable: false,
            data: {
                cameraPart: 'object'
            }
        }),
        new fabric.Text(
            `${cam.getObjectX()}`,
            {
                fontSize: 25,
                left: xpx(x(planeIntersectionPosition)) - baseSize,
                top: ypx(y(planeIntersectionPosition)) - baseSize,
            }
        ),
        new fabric.Line( // inside ray
            [
                xpx(x(insideRayStart)), ypx(y(insideRayStart)),
                xpx(x(insideRayEnd)), ypx(y(insideRayEnd)),
            ],
            {
                stroke: `${color}AA`,
                strokeWidth: 1,
                selectable: false,
                strokeDashArray: [2,2]
            }
        )
    );
}

/**
 * @param {number} percentAlongCamView
 * @param {Camera} camera
 */
function getPointAlongCamView(percentAlongCamView, camera) {
    const smallestX = Math.min(
        x(camera.viewLeft),
        x(camera.viewRight)
    );

    const largestX = Math.max(
        x(camera.viewLeft),
        x(camera.viewRight)
    );

    const smallestY = Math.min(
        y(camera.viewLeft),
        y(camera.viewRight)
    );

    const largestY = Math.max(
        y(camera.viewLeft),
        y(camera.viewRight)
    );

    const curve = BezierEasing( 0.00, 0.66, 0.00, 0.66);
    percentAlongCamView = curve(percentAlongCamView / 100) * 100;

    const xSize = largestX - smallestX;
    const ySize = largestY - smallestY;

    const viewVerticalDirection = y(camera.viewLeft) >= y(camera.viewRight)
        ? 'up'
        : 'down';

    const viewHorizontalDirection = x(camera.viewLeft) >= x(camera.viewRight)
        ? 'right'
        : 'left';

    let X;
    let Y;

    switch (viewVerticalDirection) {
        case 'down':
            Y = smallestY + pc(percentAlongCamView, ySize);
            break;
        case 'up':
            Y = largestY - pc(percentAlongCamView, ySize);
            break;
    }

    switch (viewHorizontalDirection) {
        case 'left':
            X = smallestX + pc(percentAlongCamView, xSize);
            break;
        case 'right':
            X = largestX - pc(percentAlongCamView, xSize);
            break;
    }

    return [X,Y];
}

/**
 * @param {Array.<Camera>} cameras
 */
function drawCameras(cameras) {
    cameras.forEach((cam, index) => {
        const color = colors[index];
        drawCameraBase(cam, color);
        drawCameraView(cam, color, state.selectedImage === index);
        drawCameraObject(cam, color);
    })
}

function onModeChanged(e) {
    setMode(e.target.value);
    state.mode = e.target.value;
}

/**
 * @param {MouseEvent<HTMLImageElement>} e
 */
function onImageClicked(e) {
    const img = e.target;
    state.selectedImage = images.indexOf(img);

    if (state.mode === 'object') {
        const bounds = img.getBoundingClientRect();

        const clickedPoint = [
            100 - ((e.layerX / bounds.width) * 100),
            100 - ((e.layerY / bounds.height) * 100)
        ];

        const cam = state.imageCameraMap.get(img);

        cam.setObjectX(x(clickedPoint));
    }

    render();
}

function onCheckboxClicked(e) {
    const which = checkBoxes.indexOf(e.target);
    const value = String(e.target.checked) === 'true';

    state.imageCameraMap.get(images[which]).active = value;

    render();
}

function styleImages() {
    images.forEach(i => i.className = 'image');
    images[state.selectedImage].classList.add('selected');
}

function getCameraIndex(cam) {
    let index = -1;

    Array.from(state.imageCameraMap.values()).forEach((c, i) => {
        if (c === cam) {
            index = i;
        }
    });

    return index;
}

function onCanvasClicked(options) {
    const clickedPoint = [
        xpc(options.e.layerX),
        ypc(options.e.layerY)
    ];

    if (state.mode === 'camera') {
        const target = findClosestCamera(clickedPoint, Array.from(state.imageCameraMap.values()));

        if (target) {
            state.selectedImage = getCameraIndex(target);
        }

        // const viewLeft = window.prompt(
        //     'Where is the left boundary (X%, Y%) of this camera\'s view?',
        //     target
        //         ? JSON.stringify(target.viewLeft)
        //         : '[40, 0]'
        // );
        //
        // const viewRight = window.prompt(
        //     'Where is the right boundary (X%, Y%) of this camera\'s view?',
        //     target
        //         ? JSON.stringify(target.viewRight)
        //         : '[60, 100]'
        // );
        //
        // state.imageCameraMap.set(images[state.selectedImage], new Camera({
        //     position: clickedPoint,
        //     viewLeft: !!viewLeft
        //         ? JSON.parse(viewLeft)
        //         : [40, 0],
        //     viewRight: !!viewRight
        //         ? JSON.parse(viewRight)
        //         : [60, 100],
        //     active: true
        // }));
    }

    render();
}

/**
 * @param {Array<number>} point
 * @param {Array<Camera>} cameras
 * @returns {?Camera}
 */
function findClosestCamera(point, cameras, precision = 15) {
    const plausibleTargets = cameras.filter(cam => {
        return (
            isCloseTo(x(point), x(cam.position), precision) &&
            isCloseTo(y(point), y(cam.position), precision)
        );
    });

    if (plausibleTargets.length === 1) {
        return plausibleTargets[0];
    }

    if (plausibleTargets.length === 0) {
        return null;
    }

    return findClosestCamera(point, cameras, precision / 2);
}

function render() {
    clearStage();

    const cams = Array.from(state.imageCameraMap.values());

    styleImages();
    drawCameras(cams.filter(cam => cam.active));
}

function clearStage() {
    canvas.clear();
}

function init() {
    modeButtons.forEach(el => {
        el.addEventListener('change', onModeChanged);
    });

    images.forEach(el => {
        el.addEventListener('click', onImageClicked);
    });

    checkBoxes.forEach(el => {
        el.addEventListener('click', onCheckboxClicked);
    });

    window.addEventListener('mousemove', syncCursor);

    canvas.on('mouse:down', onCanvasClicked);

    setMode(state.mode);

    sampleCameras.forEach(([key, val]) => {
        state.imageCameraMap.set(key, val);
    });

    window.canvas = canvas;
    window.state = state;

    return Promise.resolve();
}

/**
 * @param {MouseEvent} e
 */
function syncCursor(e) {
    const x = e.layerX;
    const y = e.layerY;

    const style = `translate3d(${e.clientX + 10}px, ${e.clientY + 10}px, 0px)`;

    cursor.style.transform = style;

    $('.x', cursor).innerText = Math.min(xpc(x), 100).toFixed(1) + '%';
    $('.y', cursor).innerText = Math.min(ypc(y), 100).toFixed(1) + '%';
}

// -------------------------------------------------------- //

init().then(render)
    /*
    .then(() => {
    const firstCam = state.imageCameraMap.get(images[state.selectedImage]);

    window.xxx = setInterval(() => {
        if (firstCam.getObjectX() > 99) {
            firstCam.setObjectX(0);
            return;
        }
        firstCam.setObjectX(firstCam.getObjectX() + 1.5);
        render();
    }, 150);
});
// */