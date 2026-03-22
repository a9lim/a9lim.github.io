/* ═══════════════════════════════════════════════
   shared-shortcuts.js — Keyboard shortcut registry and
   help overlay for the three a9l.im simulation projects.
   "?" opens the help modal; Escape closes it.
   ═══════════════════════════════════════════════ */

/**
 * Initialize a keyboard shortcut system with a help overlay.
 *
 * @param {Array<Object>} shortcuts  Shortcut definitions:
 *   - key:    Key name matching KeyboardEvent.key, with optional Ctrl+/Shift+ prefix
 *   - label:  Human-readable description shown in help overlay
 *   - group:  Category for grouping in help overlay (e.g. "Simulation", "View")
 *   - action: Handler function
 *   - when:   Optional predicate — shortcut only fires if when() returns true
 * @param {Object} [opts]
 * @param {string} [opts.helpTitle='Keyboard Shortcuts']
 * @returns {{ destroy: Function }}
 */
function initShortcuts(shortcuts, opts) {
    if (!opts) opts = {};
    var helpTitle = opts.helpTitle || 'Keyboard Shortcuts';
    var overlay = null;
    var overlayEl = null; // cached DOM, built once

    /** Normalize key strings for lookup: lowercase, no whitespace. */
    function normalizeKey(key) {
        return key.toLowerCase().replace(/\s+/g, '');
    }

    /**
     * Convert a KeyboardEvent to its normalized key string.
     * Combines modifiers (ctrl/shift/alt) with the key name.
     * Uses Ctrl for both Ctrl and Meta (Cmd) for cross-platform support.
     */
    function eventToKey(e) {
        var parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');

        var key = e.key;
        if (key === ' ') key = 'space';
        else if (key === '+' || key === '=') key = e.shiftKey ? '+' : key;
        else key = key.toLowerCase();

        // Avoid "ctrl+ctrl" when only a modifier key is pressed
        if (key !== 'control' && key !== 'meta' && key !== 'shift' && key !== 'alt') {
            parts.push(key);
        }

        return parts.join('+');
    }

    /** True if focus is in a text-editable element (suppress shortcuts). */
    function isInputFocused() {
        var el = document.activeElement;
        if (!el) return false;
        var tag = el.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    }

    function buildOverlay() {
        var el = document.createElement('div');
        el.className = 'shortcut-overlay';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', helpTitle);

        var content = document.createElement('div');
        content.className = 'shortcut-content';

        var header = document.createElement('div');
        header.className = 'shortcut-header';
        var title = document.createElement('h2');
        title.textContent = helpTitle;
        var closeBtn = document.createElement('button');
        closeBtn.className = 'tool-btn shortcut-close';
        closeBtn.setAttribute('aria-label', 'Close');
        // Static SVG X icon — not user-provided content
        closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        closeBtn.addEventListener('click', hideOverlay);
        header.appendChild(title);
        header.appendChild(closeBtn);
        content.appendChild(header);

        // Preserve registration order within each group
        var groups = {};
        var groupOrder = [];
        shortcuts.forEach(function(s) {
            var g = s.group || 'General';
            if (!groups[g]) {
                groups[g] = [];
                groupOrder.push(g);
            }
            groups[g].push(s);
        });

        groupOrder.forEach(function(name) {
            var section = document.createElement('div');
            section.className = 'shortcut-group';

            var groupLabel = document.createElement('div');
            groupLabel.className = 'shortcut-group-label';
            groupLabel.textContent = name;
            section.appendChild(groupLabel);

            groups[name].forEach(function(s) {
                var row = document.createElement('div');
                row.className = 'shortcut-row';

                var label = document.createElement('span');
                label.className = 'shortcut-label';
                label.textContent = s.label;

                var keyEl = document.createElement('kbd');
                keyEl.className = 'shortcut-key';
                keyEl.textContent = formatKey(s.key);

                row.appendChild(label);
                row.appendChild(keyEl);
                section.appendChild(row);
            });

            content.appendChild(section);
        });

        el.appendChild(content);

        // Backdrop click closes
        el.addEventListener('click', function(e) {
            if (e.target === el) hideOverlay();
        });

        return el;
    }

    /** Format a key string for display (e.g. "ctrl+z" -> "Ctrl + Z"). */
    function formatKey(key) {
        return key
            .replace(/ctrl\+/i, 'Ctrl + ')
            .replace(/shift\+/i, 'Shift + ')
            .replace(/alt\+/i, 'Alt + ')
            .replace(/^space$/i, 'Space')
            .replace(/^escape$/i, 'Esc');
    }

    function showOverlay() {
        if (overlay) return;
        // Build DOM once, reuse on subsequent opens
        if (!overlayEl) overlayEl = buildOverlay();
        overlay = overlayEl;
        document.body.appendChild(overlay);
        requestAnimationFrame(function() {
            if (overlay) overlay.classList.add('shortcut-overlay-visible');
        });
    }

    function hideOverlay() {
        if (!overlay) return;
        overlay.classList.remove('shortcut-overlay-visible');
        var el = overlay;
        overlay = null;
        // 200ms matches CSS fade-out transition
        setTimeout(function() {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 200);
    }

    var keyMap = {};
    shortcuts.forEach(function(s) {
        keyMap[normalizeKey(s.key)] = s;
    });

    function onKeyDown(e) {
        // "?" toggles the help overlay (even when another shortcut is bound to "?")
        if (e.key === '?' && !isInputFocused()) {
            e.preventDefault();
            if (overlay) hideOverlay();
            else showOverlay();
            return;
        }

        // Escape gets priority: close overlay first, then fall through to registered handlers
        if (e.key === 'Escape') {
            if (overlay) {
                hideOverlay();
                e.preventDefault();
                return;
            }
            var escEntry = keyMap['escape'];
            if (escEntry && (!escEntry.when || escEntry.when())) {
                e.preventDefault();
                escEntry.action();
            }
            return;
        }

        if (isInputFocused()) return;

        var evKey = eventToKey(e);
        var entry = keyMap[normalizeKey(evKey)];
        if (entry && (!entry.when || entry.when())) {
            e.preventDefault();
            entry.action();
        }
    }

    document.addEventListener('keydown', onKeyDown);

    return {
        destroy: function() {
            document.removeEventListener('keydown', onKeyDown);
            hideOverlay();
        }
    };
}
