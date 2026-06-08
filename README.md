# Kosh Blog Theme

A technical, portfolio-first blog theme designed for developers, systems engineers, and computer scientists. Features an interactive command-line style header, a modern Bento-style featured grid, a timeline component, and automated syntax-highlighted list pages.

> [!TIP]
> This theme works out of the box with the **Kosh Static Site Generator**. You can check the complete working configuration inside the [example/](file:///home/kush26/Projects/kosh-theme-blog/example) folder!

---

## ✨ Features

- **Context-Aware Branding**: Distinct styles and nav controls optimized for the home portfolio landing vs deep blog lists.
- **Bento Grid Layout**: Beautiful, structured showcase for featured articles, projects, or taxonomies.
- **Milestone Timeline**: Chronological presentation of experience or education powered dynamically by YAML data.
- **Ultra Fast WASM Search**: Integrated client-side full-text search with automatic snippet extraction and scoring.
- **Rich Typographic Hierarchy**: OKLCH-based theme palette designed for readability, high-contrast, and eye comfort.

---

## 🚀 Quick Setup

To use this theme in your Kosh site:

1. Clone or copy this theme folder into your site's `themes/` directory as `blog`.
2. Configure your `kosh.yaml` to reference the theme:

```yaml
themeDir: "themes"
theme: "blog"
contentPrefix: "blogs"
taxonomies:
  tags: "tags"
  series: "series"
```

3. Initialize your portfolio data structure in `data/portfolio.yaml` (see schema details below).
4. Run `kosh build` or `kosh serve --dev` to render!

---

## 📁 Repository Structure

- `templates/` — HTML layout definitions extending the Kosh core base layer.
  - `home.html` — The main profile landing page (renders for pages with `layout: "home"`).
  - `index.html` — List pages for taxonomies, tags, and general blog post list.
  - `layout.html` — Layout structure for single technical blog articles.
- `static/` — Assets including stylesheets, interactive canvas scripts, and web components.
- `example/` — A complete working sample playground.

---

## ⚙️ Data Schemas

### `data/portfolio.yaml`

The home page is driven by a data model. Below is the required YAML structure:

```yaml
identity: "usr // your_handle"
headline: "Your Name"
subHeadline: "A short, professional description of your work."

about:
  largeText: "A longer profile text highlighting your engineering philosophy."
  profileImg: "images/profile.webp"

projects:
  - eyebrow: "Category (e.g. Systems)"
    title: "Project Name"
    description: "Brief summary of what was accomplished."
    tags: ["Go", "SIMD", "quantization"]
    github: "https://github.com/..."
    demo: "https://..."

competencies:
  - category: "// languages"
    items: "Go · C++ · Python"

timeline:
  - hash: "c389bf4" # Optional commit-like hash for aesthetic
    date: "2024 - Present"
    title: "Position/Role"
    subtitle: "Organization/Company Name"
    meta: "Special achievements"

socials:
  email: "your@email.com"
  github: "https://github.com/your-username"
```

---

## 📝 Post Frontmatter

Individual articles inside `content/blogs/` should define the following parameters:

```yaml
---
title: "Article Title"
date: "2026-05-22"
description: "A short summary of what this article covers."
pinned: true             # Set true to feature in the Bento Grid
tags:
  - "systems-programming"
series:
  - "Internals Deep Dive"
---
```