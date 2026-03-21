/* ═══════════════════════════════════════════════
   shared-forms.js — Form control wiring utilities
   Shared across sim projects for consistent handling of
   mode-toggle groups, range sliders, and toggle checkboxes.
   ═══════════════════════════════════════════════ */

// eslint-disable-next-line no-unused-vars
var _forms = (function () {
    'use strict';

    /**
     * Bind a mode-toggle button group with event delegation.
     * Clicks on .mode-btn children swap the .active class and call onChange.
     * Triggers 'selection' haptic automatically.
     * @param {HTMLElement} container - The container element holding .mode-btn children.
     * @param {string} dataAttr - The data-* attribute name to read from clicked button.
     * @param {function} onChange - Called with the attribute value string.
     */
    function bindModeGroup(container, dataAttr, onChange) {
        container.addEventListener('click', function (e) {
            var btn = e.target.closest('.mode-btn');
            if (!btn) return;
            var btns = container.querySelectorAll('.mode-btn');
            for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
            btn.classList.add('active');
            onChange(btn.dataset[dataAttr]);
            if (typeof _haptics !== 'undefined') _haptics.trigger('selection');
        });
    }

    /**
     * Bind a range slider to a value display element and callback.
     * Parses the slider value as a float, updates the display, and calls onChange.
     * @param {HTMLInputElement} slider - The range input element.
     * @param {HTMLElement} [display] - Element whose textContent is set to the formatted value.
     * @param {function} [onChange] - Called with the parsed float value.
     * @param {function} [format] - Format function (value → string). Default: toString.
     */
    function updateSliderFill(slider) {
        var min = parseFloat(slider.min) || 0;
        var max = parseFloat(slider.max) || 100;
        var val = parseFloat(slider.value);
        var pct = ((val - min) / (max - min)) * 100;
        slider.style.setProperty('--slider-fill', pct + '%');
    }

    function bindSlider(slider, display, onChange, format) {
        updateSliderFill(slider);
        slider.addEventListener('input', function () {
            var v = parseFloat(slider.value);
            updateSliderFill(slider);
            if (display) display.textContent = format ? format(v) : v.toString();
            if (onChange) onChange(v);
        });
    }

    /**
     * Bind a toggle checkbox to a callback.
     * Triggers 'light' haptic automatically on change.
     * @param {HTMLInputElement} checkbox - The checkbox input element.
     * @param {function} onChange - Called with the checked boolean.
     */
    function bindToggle(checkbox, onChange) {
        checkbox.addEventListener('change', function () {
            onChange(checkbox.checked);
            if (typeof _haptics !== 'undefined') _haptics.trigger('light');
        });
    }

    return {
        bindModeGroup: bindModeGroup,
        bindSlider: bindSlider,
        updateSliderFill: updateSliderFill,
        bindToggle: bindToggle
    };
})();
