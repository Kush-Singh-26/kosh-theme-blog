# Kosh Blog Theme Example

This directory contains a complete, working example site configured for the **Kosh Blog Theme**. It showcases a premium, tech-focused personal portfolio combined with a high-performance blog.

## 🚀 Quick Start

To preview this example site locally, ensure you have the `kosh` binary installed, and execute the following command directly from this `example/` directory:

```bash
# Start the local development server with hot-reload
kosh serve --dev
```

By default, the dev server will launch at `http://localhost:8080/`. Changes to your content or configuration will apply instantly!

---

## 📁 Directory Structure

```
.
├── kosh.yaml              # Core Kosh site configuration
├── README.md              # This guide
├── data/
│   └── portfolio.yaml     # Portfolio data driving the home page profile
└── content/
    ├── _index.md          # Frontmatter defining the home page layout
    ├── index.md           # Dual-indexing home fallback
    └── blogs/
        └── getting-started.md  # A sample technical blog post
```

---

## ⚙️ How It Works

### 1. Main Configuration (`kosh.yaml`)
The site maps to the parent theme folder via relative path definitions:
```yaml
themeDir: "../.."
theme: "kosh-theme-blog"
```

### 2. Portfolio Profile (`data/portfolio.yaml`)
The blog home page (`templates/home.html`) is structured dynamically from data. You can customize the entire layout — including your biographic intro, avatar image, projects grid, competency list, and timeline milestones — directly inside `data/portfolio.yaml`.

### 3. Pinned Blog Posts
To display a blog post in the **Featured Bento Grid** on the homepage, simply add `pinned: true` to the frontmatter of your markdown files (as demonstrated in `content/blogs/getting-started.md`). Regular posts will list under the "Latest Updates" section.

### 4. Custom Taxonomies
This theme supports federated tags and series navigation out of the box. Taxonomy lists will automatically generate links at `/blogs/tags/`.
