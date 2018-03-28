import {x} from "./measures.js";

class PlaneCorrection {
    constructor({ apparentPosition, actualPosition }) {
        this.apparentPosition = apparentPosition;
        this.actualPosition = actualPosition;
    }
}

export default class Camera {
    constructor({ position, viewLeft, viewRight, active, corrections = [] }) {
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

        this.objectPos = [0,0];

        this.corrections = corrections.map(c => new PlaneCorrection(c));
    }

    changeCorrection(correctionIndex, actualPosition) {
        this.corrections[correctionIndex].actualPosition = actualPosition;
    }

    addCorrection(apparentPosition, actualPosition) {
        this.corrections.push(
            new PlaneCorrection({
                apparentPosition,
                actualPosition
            })
        )
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