"""The Python end of bridge.mjs: one node process per session, JSON lines, so the analysis runs the site's own code
(tools/horizon-fit.mjs) for the figure's table and fit. Opus 5.5 (claude-opus-5-5), 2026-11-20."""
import atexit, json, os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
_NODE = None

def js(op, **q):
    """One request to tools/horizon-fit.mjs through bridge.mjs; see that file for the operations."""
    global _NODE
    if _NODE is None:
        _NODE = subprocess.Popen(['node', os.path.join(HERE, 'bridge.mjs')], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
        atexit.register(_NODE.terminate)
    _NODE.stdin.write(json.dumps(dict(op=op, **q), default=lambda o: o.tolist() if hasattr(o, 'tolist') else int(o)) + '\n')
    _NODE.stdin.flush()
    r = json.loads(_NODE.stdout.readline())
    if 'error' in r: raise RuntimeError('tools/horizon-fit.mjs: ' + r['error'])
    return r['ok']
