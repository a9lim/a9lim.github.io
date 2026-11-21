# draft/

Unpublished content, read only when `DRAFTS=1` (`./dev.sh` sets it; `./deploy.sh` and `npm test` clear it). It mirrors `content/` file for file (`draft/posts/`, `draft/projects/`, `draft/home/`), and a draft shadows the `content/` file with the same slug. The same frontmatter rules apply; a draft project card needs `planned: true` unless its submodule exists. Draft posts carry a `draft` badge. Publishing is `git mv` into `content/`.

Everything here but this README is gitignored, so drafts exist only on this machine: back them up yourself, and `git clean -fdx` deletes them.
