import {x} from "./measures.js";

export default class Camera {
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

        this.objectPos = [50,0];
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