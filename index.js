import { fabric } from 'fabric';
import { xpc, xpx, ypc, ypx, pc, x, y, $, $$, getAngle, tanDeg } from './measures';
import { inRange, throttle } from 'lodash';
import Camera from './camera';
import BezierEasing from 'bezier-easing';
import {realAngle} from "./measures.js";
import cameraData from './camera-data.js';

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

images.forEach(img => {
    $('.checkbox-container').appendChild(createCheckbox());
});

const checkBoxes = $$('input[type="checkbox"]');
const cursor = $('#cursor');
const slider = $('.slider');

function createCheckbox() {
    const el = document.createElement('input');
    el.type = 'checkbox';
    return el;
}

/**
 * @type {{mode: string, selectedImage: number, selectedCorrection: number, imageCameraMap: Map<HTMLImageElement, Camera>}}
 */
let state = {
    mode: 'camera',
    selectedImage: 0,
    selectedCorrection: 0,
    imageCameraMap: new Map()
};

const sampleCameras = [
    [images[0], new Camera(cameraData[0])],
    [images[1], new Camera(cameraData[1])],
    [images[2], new Camera(cameraData[2])],
    [images[3], new Camera(cameraData[3])],
    [images[4], new Camera(cameraData[4])],
    [images[5], new Camera(cameraData[5])],
    [images[6], new Camera(cameraData[6])],
    [images[7], new Camera(cameraData[7])]
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

    // console.log([
    //     `M ${xpx(x(cam.viewLeft))} ${ypx(y(cam.viewLeft))}`, // start here
    //     `Q ${xpx(x(cam.position))}, ${ypx(y(cam.position))}`, // gravity well here
    //     `${xpx(x(cam.viewRight))}, ${ypx(y(cam.viewRight))}` // finish here
    // ].join(' '));
    //
    // const line = new fabric.Path(
    //     [
    //         `M ${xpx(x(cam.viewLeft))} ${ypx(y(cam.viewLeft))}`, // start here
    //         `Q ${xpx(x(cam.position))}, ${ypx(y(cam.position))}`, // gravity well here
    //         `${xpx(x(cam.viewRight))}, ${ypx(y(cam.viewRight))}` // finish here
    //     ].join(' ')
    //     , { fill: '', stroke: 'black', objectCaching: false });


    canvas.add(
        // line,
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
                fontSize: 20,
                left: xpx(x(planeIntersectionPosition)) - baseSize,
                top: ypx(y(planeIntersectionPosition)) - baseSize,
                selectable: false
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
        const isCurrent = state.selectedImage === index;
        drawCameraBase(cam, color);
        drawCameraView(cam, color, isCurrent);
        // drawCameraObject(cam, color);

        if (isCurrent && state.mode === 'object') {
            cam.corrections.forEach(correction => {
                drawCameraCorrection(color, cam, correction)
            });
        }
    })
}

/**
 * @param {string} color
 * @param {Camera} cam
 * @param {PlaneCorrection} correction
 */
function drawCameraCorrection(color, cam, correction) {
    const baseSize = 3;

    const planeIntersectionPosition = getPointAlongCamView(correction.actualPosition, cam);
    const insideRayStart = cam.position;
    const insideRayEnd = planeIntersectionPosition;

    canvas.add(
        new fabric.Circle({
            left: xpx(x(planeIntersectionPosition)) - baseSize,
            top: ypx(y(planeIntersectionPosition)) - baseSize,
            radius: baseSize,
            fill: color,
            stroke: color,
            strokeWidth: 1,
            selectable: false
        }),
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

function onModeChanged(e) {
    setMode(e.target.value);

    state.mode = e.target.value;

    if (state.mode === 'object') {
        // $('#cursor').removeAttribute('hidden');
        // window.addEventListener('mousemove', syncCursor);
    } else {
        // $('#cursor').setAttribute('hidden', true);
        // window.removeEventListener('mousemove', syncCursor);
    }

    render();
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
            ((e.layerX / bounds.width) * 100),
            ((e.layerY / bounds.height) * 100)
        ];

        const cam = state.imageCameraMap.get(img);
        cam.addCorrection(x(clickedPoint), x(clickedPoint));
        slider.value = x(clickedPoint);
        state.selectedCorrection = cam.corrections.length - 1;
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
    images.forEach(i => i.parentElement.className = 'image-container');
    images[state.selectedImage].parentElement.classList.add('selected');
    $$('.x-guy').forEach(node => node.remove());

    if (state.mode === 'object') {

        const container = images[state.selectedImage].parentElement;
        const corrections = state.imageCameraMap.get(images[state.selectedImage]).corrections;

        corrections.forEach(correction => {
            container.appendChild(createXGuy(correction.apparentPosition + '%'))
            // create an x-guy and move him to apparentPositionX%
        })
    }
}

function createXGuy(xPosition = '50%') {
    const el = document.createElement('span');
    el.classList.add('x-guy');
    el.style.left = xPosition;
    return el;
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

/**
 * @return {Camera | undefined}
 */
function getCurrentCamera() {
    return state.imageCameraMap.get(
        getImageForCamera(state.selectedImage)
    );
}

function getImageForCamera(camNumber) {
    return [...state.imageCameraMap.keys()][camNumber];
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

const render = throttle(() => {
    clearStage();

    const cams = Array.from(state.imageCameraMap.values());

    styleImages();
    drawCameras(cams.filter(cam => cam.active));
}, 1000 / 24);

function clearStage() {
    canvas.clear();
}

function onSliderChanged(e) {
    const value = parseFloat(e.target.value);

    const cam = getCurrentCamera();
    cam.changeCorrection(state.selectedCorrection, value);

    render();
}

function init() {
    $('.logit').addEventListener('click', () => {
        console.log(Array.from(state.imageCameraMap.values()));
    });

    modeButtons.forEach(el => {
        el.addEventListener('change', onModeChanged);
    });

    images.forEach(el => {
        el.addEventListener('click', onImageClicked);
    });

    checkBoxes.forEach(el => {
        el.addEventListener('click', onCheckboxClicked);
    });

    slider.addEventListener('input', onSliderChanged);
    canvas.on('mouse:down', onCanvasClicked);

    setMode(state.mode);

    sampleCameras.forEach(([key, val]) => {
        state.imageCameraMap.set(key, val);
    });

    checkBoxes.forEach((el, index) => {
        if (state.imageCameraMap.get(getImageForCamera(index)).active) {
            el.checked = true;
        }
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

init().then(render);
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