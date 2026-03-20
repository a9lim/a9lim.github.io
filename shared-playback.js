/* ═══════════════════════════════════════════════
   shared-playback.js — Play/pause + speed button utilities
   Shared across sim projects for consistent toolbar playback controls.
   ═══════════════════════════════════════════════ */

// eslint-disable-next-line no-unused-vars
var _playback = (function () {
    'use strict';

    var NS = 'http://www.w3.org/2000/svg';
    var _playSvg = null;
    var _pauseSvg = null;

    function _createSvg() {
        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('width', '18');
        svg.setAttribute('height', '18');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        return svg;
    }

    function _getPlaySvg() {
        if (_playSvg) return _playSvg;
        var svg = _createSvg();
        var poly = document.createElementNS(NS, 'polygon');
        poly.setAttribute('points', '5 3 19 12 5 21 5 3');
        svg.appendChild(poly);
        _playSvg = svg;
        return svg;
    }

    function _getPauseSvg() {
        if (_pauseSvg) return _pauseSvg;
        var svg = _createSvg();
        var coords = [[6, 4, 4, 16], [14, 4, 4, 16]];
        for (var i = 0; i < coords.length; i++) {
            var rect = document.createElementNS(NS, 'rect');
            rect.setAttribute('x', coords[i][0]);
            rect.setAttribute('y', coords[i][1]);
            rect.setAttribute('width', coords[i][2]);
            rect.setAttribute('height', coords[i][3]);
            svg.appendChild(rect);
        }
        _pauseSvg = svg;
        return svg;
    }

    /**
     * Update a play/pause button's icon and accessibility attributes.
     * @param {HTMLElement} btn - The play/pause button element.
     * @param {boolean} playing - Whether the simulation is currently playing.
     */
    function updatePlayBtn(btn, playing) {
        btn.setAttribute('aria-label', playing ? 'Pause simulation' : 'Play simulation');
        btn.title = playing ? 'Pause' : 'Play';
        btn.textContent = '';
        btn.appendChild((playing ? _getPauseSvg() : _getPlaySvg()).cloneNode(true));
        btn.classList.toggle('playing', playing);
    }

    /**
     * Update a speed button's label and title.
     * @param {HTMLElement} btn - The speed button element (must contain a .speed-label span).
     * @param {number} speed - The current speed multiplier value.
     */
    function updateSpeedBtn(btn, speed) {
        var label = btn.querySelector('.speed-label');
        if (label) label.textContent = speed + 'x';
        btn.title = 'Speed: ' + speed + 'x';
    }

    return {
        updatePlayBtn: updatePlayBtn,
        updateSpeedBtn: updateSpeedBtn
    };
})();
