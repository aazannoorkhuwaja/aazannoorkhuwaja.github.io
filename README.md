# My Hugo Blog

A personal blog built with [Hugo](https://gohugo.io/) static site generator using the [Blowfish](https://github.com/nunocoracao/blowfish) theme.

## Quick Start

### Prerequisites
- [Hugo](https://gohugo.io/installation/)
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/aazannoorkhuwaja/aazannoorkhuwaja.github.io.git
cd aazannoorkhuwaja.github.io

# Start the local development server
hugo server -D
```

Visit `http://localhost:1313` to see your site.

### Build for Production

```bash
hugo --minify
```

The generated site will be in the `public/` directory.

## 📁 Project Structure

```
.
├── archetypes/          # Content templates
├── assets/              # CSS, JS, images (processed by Hugo)
├── config/              # Hugo configuration
├── content/             # Your content (posts, pages)
├── static/              # Static files (images, etc.)
├── themes/              # Hugo themes
│   └── blowfish/        # Blowfish theme
├── hugo.toml            # Hugo configuration file
└── .github/workflows/   # GitHub Actions for deployment
```

## Adding Content

### New Blog Post
```bash
hugo new content/post/my-new-post.md
```

### New Page
```bash
hugo new content/page/about.md
```

## Deployment

This site is automatically deployed using GitHub Actions. Every push to the `main` branch triggers a build and deploy to GitHub Pages.

To enable GitHub Pages:
1. Go to **Settings → Pages** in your repository
2. Select **GitHub Actions** as the source

## Customization

Edit `hugo.toml` and files in `config/_default/` to customize:
- Site title and description
- Menu items
- Theme options
- And more...

## 📄 License

MIT License - feel free to use this as a template for your own blog!
