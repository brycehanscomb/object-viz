import { fabric } from 'fabric';
import { xpc, xpx, ypc, ypx, pc, x, y } from './measures';
import { inRange } from 'lodash';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)].filter(Boolean);

const stage = $('#stage');
const bounds = stage.getBoundingClientRect();

const colors = [
    '#FF0000',
    '#0000FF',
    '#00FF00',
    '#FFA500'
];

const canvas = new fabric.Canvas('stage', {
    width: bounds.width,
    height: bounds.height
});

const modeButtons = $$('input[name="mode"]');
const images = $$('.image');
const checkBoxes = $$('input[type="checkbox"]');

/**
 * @type {{mode: string, selectedImage: number, imageCameraMap: Map<HTMLImageElement, Camera>}}
 */
let state = {
    mode: 'camera',
    selectedImage: 0,
    imageCameraMap: new Map()
};

class Camera {
    constructor({ position, viewLeft, viewRight, active }) {
        /**
         * @type {Array.<number>}
         */
        this.position = position;
        /**
         * @type {Array.<number>}
         */
        this.viewLeft = viewLeft;
        /**
         * @type {Array.<number>}
         */
        this.viewRight = viewRight;

        /**
         * @type {boolean}
         */
        this.active = active;

        this.objectPos = null;
    }

    setObjectX(x) {
        this.objectPos = [x, 50];
    }

    getObjectX() {
        if (this.objectPos) {
            return x(this.objectPos);
        } else {
            return null;
        }
    }
}

const sampleCameras = [
    // [images[0], new Camera({
    //     position: [100, 100],
    //     viewLeft: [0, 80],
    //     viewRight: [80, 0],
    //     active: true
    // })],
    // [images[1], new Camera({
    //     position: [0, 0],
    //     viewLeft: [100, 15],
    //     viewRight: [30, 100],
    //     active: true
    // })],
    // [images[2], new Camera({
    //     position: [100, 0],
    //     viewLeft: [100, 20],
    //     viewRight: [0, 75],
    //     active: true
    // })],
    // [images[3], new Camera({
    //     position: [0, 100],
    //     viewLeft: [25, 0],
    //     viewRight: [100, 65],
    //     active: true
    // })]
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
 * @param {Camera} cam
 * @param {string} color
 */
function drawCameraView(cam, color) {
    const camViewCenter = getPointAlongCamView(50, cam);

    canvas.add(
        new fabric.Line(
            [
                xpx(x(cam.viewLeft)), ypx(y(cam.viewLeft)),
                xpx(x(cam.viewRight)), ypx(y(cam.viewRight)),
            ],
            {
                stroke: color,
                strokeWidth: 2,
                selectable: false
            }
        ),
        new fabric.Line(
            [
                xpx(x(camViewCenter)), ypx(y(camViewCenter)),
                xpx(x(cam.position)), ypx(y(cam.position)),
            ],
            {
                stroke: `${color}66`,
                strokeDashArray: [5,5],
                selectable: false
            }
        )
    );
}

/**
 * @param {Camera} cam
 * @param {string} color
 */
function drawCameraBase(cam, color) {
    const baseSize = 20;

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

    const baseSize = 10;

    const position = getPointAlongCamView(cam.getObjectX(), cam);

    canvas.add(
        new fabric.Circle({
            left: xpx(x(position) - (baseSize / 2)),
            top: ypx(y(position) - (baseSize / 2)),
            radius: baseSize,
            fill: `${color}66`,
            strokeWidth: 2,
            stroke: color,
            selectable: false,
            data: {
                cameraPart: 'object'
            }
        })
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

    const viewVerticalDirection = y(camera.viewLeft) >= y(camera.viewRight) ? (
        'up'
    ) : (
        'down'
    );

    switch (viewVerticalDirection) {
        case 'down':
            return [
                smallestX + pc(percentAlongCamView, xSize),
                smallestY + pc(percentAlongCamView, ySize),
            ];
        case 'up':
            return [
                smallestX + pc(percentAlongCamView, xSize),
                largestY - pc(percentAlongCamView, ySize),
            ];
    }
}

/**
 * @param {Array.<Camera>} cameras
 */
function drawCameras(cameras) {
    cameras.forEach((cam, index) => {
        const color = colors[index];
        drawCameraBase(cam, color);
        drawCameraView(cam, color);
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

function onCanvasClicked(options) {
    const clickedPoint = [
        xpc(options.e.layerX),
        ypc(options.e.layerY)
    ];

    if (state.mode === 'camera') {
        const target = findClosestCamera(clickedPoint, Array.from(state.imageCameraMap.values()));

        const viewLeft = window.prompt(
            'Where is the left boundary (X%, Y%) of this camera\'s view?',
            target
                ? JSON.stringify(target.viewLeft)
                : '[40, 0]'
        );

        const viewRight = window.prompt(
            'Where is the right boundary (X%, Y%) of this camera\'s view?',
            target
                ? JSON.stringify(target.viewRight)
                : '[60, 100]'
        );

        state.imageCameraMap.set(images[state.selectedImage], new Camera({
            position: clickedPoint,
            viewLeft: !!viewLeft
                ? JSON.parse(viewLeft)
                : [40, 0],
            viewRight: !!viewRight
                ? JSON.parse(viewRight)
                : [60, 100],
            active: true
        }));
    }

    render();
}

/**
 * @param {Array<number>} point
 * @param {Array<Camera>} cameras
 * @returns {?Camera}
 */
function findClosestCamera(point, cameras) {
    const plausibleTargets = cameras.filter(cam => {
        return (
            isCloseTo(x(point), x(cam.position), 15) &&
            isCloseTo(y(point), y(cam.position), 15)
        );
    });

    return plausibleTargets[0];
}

function render() {
    canvas.clear();

    const cams = Array.from(state.imageCameraMap.values());

    styleImages();
    drawCameras(cams.filter(cam => cam.active));
}

// -------------------------------------------------------- //

modeButtons.forEach(el => {
    el.addEventListener('change', onModeChanged);
});

images.forEach(el => {
    el.addEventListener('click', onImageClicked);
});

checkBoxes.forEach(el => {
    el.addEventListener('click', onCheckboxClicked);
});

canvas.on('mouse:down', onCanvasClicked);

setMode(state.mode);

sampleCameras.forEach(([key, val]) => {
    state.imageCameraMap.set(key, val);
});

render();

window.canvas = canvas;
window.state = state;