## Codebase Index

This document provides a concise map of the repository to help you navigate quickly.

### Top-level

- **`app/`**: Next.js App Router entry (layouts, global styles, root page)
- **`components/`**: Reusable UI and feature components (includes `pages/` feature pages and `ui/` primitives)
- **`hooks/`**: Reusable React hooks
- **`lib/`**: Utilities and shared helpers
- **`public/`**: Static assets
- **`styles/`**: Global stylesheet(s)
- **Config**: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`, `pnpm-lock.yaml`

### `app/`

- `globals.css`: Global styles for the App Router
- `layout.tsx`: Root layout wrapper
- `page.tsx`: Root landing page

#### API Routes

- `api/upload/route.ts`: Accepts file uploads (PDF/DOCX) and returns extracted text
- `api/extract/route.ts`: Calls DeepSeek to structure resume text into JSON

### `components/pages/` (Feature pages)

- `analysis-page.tsx`: Analysis feature page UI
- `extraction-page.tsx`: Data/insight extraction page UI
- `feedback-page.tsx`: Feedback collection page UI
- `keyword-page.tsx`: Keyword operations page UI
- `recommendations-page.tsx`: Recommendations display page UI
- `results-page.tsx`: Results output page UI
- `upload-page.tsx`: Upload workflow page UI

### `components/`

- `settings-modal.tsx`: Application settings modal component
- `theme-provider.tsx`: Theme context/provider (likely wraps shadcn/ui + system theme)

### `components/ui/` (UI primitives and building blocks)

- `accordion.tsx`, `alert-dialog.tsx`, `alert.tsx`, `aspect-ratio.tsx`, `avatar.tsx`, `badge.tsx`, `breadcrumb.tsx`, `button-group.tsx`, `button.tsx`, `calendar.tsx`, `card.tsx`, `carousel.tsx`, `chart.tsx`, `checkbox.tsx`, `collapsible.tsx`, `command.tsx`, `context-menu.tsx`, `dialog.tsx`, `drawer.tsx`, `dropdown-menu.tsx`, `empty.tsx`, `field.tsx`, `form.tsx`, `hover-card.tsx`, `input-group.tsx`, `input-otp.tsx`, `input.tsx`, `item.tsx`, `kbd.tsx`, `label.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `pagination.tsx`, `popover.tsx`, `progress.tsx`, `radio-group.tsx`, `resizable.tsx`, `scroll-area.tsx`, `select.tsx`, `separator.tsx`, `sheet.tsx`, `sidebar.tsx`, `skeleton.tsx`, `slider.tsx`, `sonner.tsx`, `spinner.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `toast.tsx`, `toaster.tsx`, `toggle-group.tsx`, `toggle.tsx`, `tooltip.tsx`, `use-mobile.tsx`, `use-toast.ts`

### `hooks/`

- `use-mobile.ts`: Mobile breakpoint detection
- `use-toast.ts`: Toast notification hook

### `lib/`

- `utils.ts`: General utilities (e.g., className helpers, formatting)
- `deepseek.ts`: DeepSeek API client and resume extraction

### `public/`

- `placeholder-logo.png`, `placeholder-logo.svg`, `placeholder-user.jpg`, `placeholder.jpg`, `placeholder.svg`: App placeholder assets

### `styles/`

- `globals.css`: Additional global styles (may complement `app/globals.css`)

### Configuration

- `components.json`: UI component generator/config (e.g., shadcn/ui)
- `next.config.mjs`: Next.js configuration
- `package.json`: Project metadata and scripts
- `pnpm-lock.yaml`: Lockfile
- `postcss.config.mjs`: PostCSS pipeline
- `tsconfig.json`: TypeScript configuration

---

### Navigation Tips

- Pages under `components/pages/` appear to be routed via composing in `app/page.tsx` or nested routes (not included here). Check `app/` for actual route entry points.
- UI primitives in `components/ui/` are generally stateless and can be composed inside feature pages.

### Quick Tasks

- Add new route: create a folder and `page.tsx` under `app/your-route/`.
- Add a feature page: add a file under `components/pages/` and compose it into a route component under `app/`.
