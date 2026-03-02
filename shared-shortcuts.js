/* ═══════════════════════════════════════════════
   shared-shortcuts.js — Keyboard shortcut registry
   for all a9l.im sites.
   Loaded after shared-utils.js, before colors.js.
   ═══════════════════════════════════════════════ */

/**
 * Initialize keyboard shortcut system.
 *
 * @param {Array} shortcuts  Array of { key, label, group, action, when }
 *   - key:    Key name (e.g. 'Space', 'T', '?', 'Escape', 'Ctrl+Z')
 *   - label:  Human-readable description for help overlay
 *   - group:  Group name for help overlay (e.g. 'Simulation', 'View')
 *   - action: Function to call when shortcut is triggered
 *   - when:   Optional predicate function; shortcut fires only if when() returns true
 * @param {Object} [opts]
 * @param {string} [opts.helpTitle='Keyboard Shortcuts']  Title for help overlay
 * @returns {{ destroy: Function }}  Cleanup object
 */
function initShortcuts(shortcuts, opts) {
    if (!opts) opts = {};
    var helpTitle = opts.helpTitle || 'Keyboard Shortcuts';
    var overlay = null;

    function normalizeKey(key) {
        return key.toLowerCase().replace(/\s+/g, '');
    }

    function eventToKey(e) {
        var parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');

        var key = e.key;
        if (key === ' ') key = 'space';
        else if (key === '+' || key === '=') key = e.shiftKey ? '+' : key;
        else key = key.toLowerCase();

        // Don't duplicate modifier in the key name
        if (key !== 'control' && key !== 'meta' && key !== 'shift' && key !== 'alt') {
            parts.push(key);
        }

        return parts.join('+');
    }

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
        closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        closeBtn.addEventListener('click', hideOverlay);
        header.appendChild(title);
        header.appendChild(closeBtn);
        content.appendChild(header);

        // Group shortcuts
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

        // Click backdrop to close
        el.addEventListener('click', function(e) {
            if (e.target === el) hideOverlay();
        });

        return el;
    }

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
        overlay = buildOverlay();
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
        setTimeout(function() {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 200);
    }

    // Build lookup map
    var keyMap = {};
    shortcuts.forEach(function(s) {
        keyMap[normalizeKey(s.key)] = s;
    });

    function onKeyDown(e) {
        // ? key for help overlay
        if (e.key === '?' && !isInputFocused()) {
            e.preventDefault();
            if (overlay) hideOverlay();
            else showOverlay();
            return;
        }

        // Esc closes overlay (and any open dialogs)
        if (e.key === 'Escape') {
            if (overlay) {
                hideOverlay();
                e.preventDefault();
                return;
            }
            // Still fire registered Escape shortcuts
            var escEntry = keyMap['escape'];
            if (escEntry && (!escEntry.when || escEntry.when())) {
                e.preventDefault();
                escEntry.action();
            }
            return;
        }

        // Skip if input is focused
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
