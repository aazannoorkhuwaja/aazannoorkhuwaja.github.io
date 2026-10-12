# Aazan Noor Khuwaja — Portfolio

Personal engineering portfolio for **Aazan Noor Khuwaja**, Computer Science undergraduate at FAST-NUCES Peshawar.

The site highlights selected work across software engineering, databases, AI/ML, and open-source tooling, with longer-form writing for technical project stories.

## Stack

- **Hugo** static site generator
- **Blowfish** theme with project-level overrides
- Custom homepage partial in `layouts/partials/home/custom.html`
- Custom styles in `assets/css/custom.css`
- **GitHub Pages** deployment through GitHub Actions

## Local development

### Prerequisites

- Hugo Extended `0.159.1`
- Git

```bash
git clone https://github.com/aazannoorkhuwaja/aazannoorkhuwaja.github.io.git
cd aazannoorkhuwaja.github.io
hugo server -D
```

Open `http://localhost:1313`.

## Production build

```bash
hugo --minify
```

Generated output is written to `public/`.

## Content structure

```text
content/
├── page/
│   ├── about.md
│   ├── contact.md
│   └── projects.md
└── post/
    └── flashyt.md
```

## Portfolio customization

The site intentionally keeps custom work outside the vendored Blowfish theme wherever possible:

- `layouts/partials/home/custom.html` — portfolio homepage composition
- `assets/css/custom.css` — visual system, responsive layout, interaction states
- `config/_default/` — navigation, author identity, and theme behavior

This makes future theme maintenance safer than modifying theme internals directly.

## Deployment

The default production branch is `master`. Pushes to `master` trigger the Hugo build and GitHub Pages deployment workflow in `.github/workflows/hugo.yaml`.

The workflow builds the Hugo site first and deploys only the generated `public/` output.

## Portfolio goals

The site is designed around a few principles:

1. Projects and outcomes before generic skill claims.
2. Clear contribution statements for team projects.
3. Measurable evidence where a project supports it.
4. Professional navigation with minimal distractions.
5. Responsive, keyboard-accessible interactions with reduced-motion support.

## Links

- Website: https://aazannoorkhuwaja.github.io/
- GitHub: https://github.com/aazannoorkhuwaja
- LinkedIn: https://www.linkedin.com/in/aazan-noor-khuwaja-cs/
