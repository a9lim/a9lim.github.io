// shared-tabs.js — Tab switching for sidebar panels.
// Loaded as a plain <script> (not a module) so tabs work even if the main module fails.
(function () {
    var btns = document.querySelectorAll('.tab-btn');
    var activeBtn = null;
    var activePanel = null;
    // Find initial active state
    for (var i = 0; i < btns.length; i++) {
        if (btns[i].classList.contains('active')) { activeBtn = btns[i]; break; }
    }
    if (activeBtn) activePanel = document.getElementById('tab-' + activeBtn.dataset.tab);

    btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (btn === activeBtn) return;
            if (activeBtn) { activeBtn.classList.remove('active'); activeBtn.setAttribute('aria-selected', 'false'); }
            if (activePanel) activePanel.classList.remove('active');
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            if (typeof _haptics !== 'undefined') _haptics.trigger('selection');
            var target = document.getElementById('tab-' + btn.dataset.tab);
            if (target) target.classList.add('active');
            activeBtn = btn;
            activePanel = target;
        });
    });
})();
