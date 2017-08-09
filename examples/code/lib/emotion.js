'use strict';

const states = {
    "PAD": ["excited"],
    "PAd": ["curious"],
    "PaD": ["relaxed"],
    "Pad": ["sleepy"],
    "pAD": ["angry"],
    "pAd": ["frustrated"],
    "paD": ["indifferent"],
    "pad": ["bored"],
};

class EmotionalModel {

    constructor(options) {

        let opts = options || {};

        // state uses either upper or lower case letters to indicate
        // positive (uppercase) or negative (lowercase) vector of the
        // range. An _ denotes a neutral position on the range
        this.pleasure = opts.pleasure || "_";
        this.arousal = opts.arousal || "_";
        this.dominance = opts.dominance || "_";

        // this will modify the behaviour of a neutral avatar towards the
        // positive side of the state model when in doubt.
        this.positivity = opts.positivity || 0.6;
    }

    emotion() {
        // returns an emotion based on a best guess from the state

        let state_arr = [this.pleasure, this.arousal, this.dominance];

        if (state_arr.includes("_")) {

            let tmp_arr = [];

            tmp_arr[0] = (this.pleasure !== "_" ? this.pleasure : this._chooseState("P", "p"));
            tmp_arr[1] = (this.arousal !== "_" ? this.arousal : this._chooseState("A", "a"));
            tmp_arr[2] = (this.dominance !== "_" ? this.dominance : this._chooseState("D", "d"));

            return states[tmp_arr.join('')];

        } else {
            return states[state_arr.join('')];
        }
    }

    state() {
        // returns the current modelled state
        return '' + this.pleasure + this.arousal + this.dominance;
    }

    negative(dimension) {
        this._updateState(dimension, dimension.charAt(0));
    }

    neutral(dimension) {
        this._updateState(dimension, "_");
    }

    positive(dimension) {
        this._updateState(dimension, dimension.toUpperCase().charAt(0));
    }

    _updateState(dimension, value) {
        // updates the state map.
        this[dimension] = value;
    }

    _chooseState(pos, neg) {
        // private function to take a choice pair and uses the positivity value
        // and return one of the two options.

        if (Math.random() < this.positivity) {
            return pos;
        } else {
            return neg;
        }
    }
}

module.exports = EmotionalModel;

