This is the first post on **a9l.im**. Mostly a quick tour of the blog and a test of every markdown feature the parser supports.

## Why a blog?

I build a lot of interactive sims and I run into a lot of weird problems while making them: numerical precision stuff, rendering tricks, weird algorithmic tradeoffs that don't have a clean answer. A blog seemed like a good place to write some of it down.

## What the parser handles

### Text formatting

You can do **bold**, *italic*, and ***bold italic*** text. Inline `code` works too.

### Links and images

Here's a [link to the repo](https://github.com/a9lim) and an image:

![Placeholder](https://placehold.co/600x200/F0EDE4/1A1612?text=a9l.im)

### Lists

Unordered:

- Zero dependencies
- Vanilla JS only
- No build step

Ordered:

1. Write a markdown file
2. Add it to `posts.json`
3. Deploy

### Blockquotes

> The purpose of computation is insight, not numbers.
> — Richard Hamming

### Code blocks

```js
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet('world'));
```

### Horizontal rules

---

That's basically everything. More posts coming.
