# draft/

Unpublished content. Mirrors `content/` file-for-file and is read only when
`DRAFTS=1` — which `./dev.sh` sets by default and `./deploy.sh`, `npm run
check`, and `npm test` explicitly clear. Nothing here can reach a deploy.

```
draft/posts/{slug}.md      → /blog/{slug}, listing entry, feeds, llms.txt
draft/projects/{slug}.md   → /sims or /projects card
draft/home/{name}.md       → homepage region
```

A draft file shadows the `content/` file with the same slug, so a draft is
either a new entry or a preview of a revision to a published one. Frontmatter
rules are identical to `content/` — same required fields, same validation, same
`{slug}.ja.md` sibling convention. A draft project card needs its `.ja.md`
sibling like any other, and needs `planned: true` unless a real submodule with
an `about.md` exists at `projects/{slug}/`.

Draft posts show a `draft` badge in the blog listing. Everything else renders
exactly as it will once the file moves to `content/` — publishing is `git mv`.

`DRAFTS=0 ./dev.sh` previews the deployable tree instead.

Everything here except this README is gitignored (`draft/*`, `!draft/README.md`),
so drafts stay off the public repository as well as off the site — and stay out
of version control entirely. Back them up yourself, and remember that `git clean
-fdx` will take them.
