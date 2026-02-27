This is the first post on **a9l.im** — a quick tour of the blog and a test of every markdown feature the parser supports.

## Why a blog?

Building interactive simulations generates a lot of *interesting problems* — numerical precision, rendering tricks, algorithmic trade-offs. A blog is a good place to write them up.

## What the parser handles

### Text formatting

You can write **bold**, *italic*, and ***bold italic*** text. Inline `code` works too.

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

That covers all the basics. More posts to come.
