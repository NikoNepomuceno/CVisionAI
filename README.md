CVisionAI Backend Setup (DeepSeek)

Environment Variables

Create a `.env.local` file with:

```
DEEPSEEK_API_KEY=your_api_key_here
# Optional, defaults to deepseek-chat
DEEPSEEK_MODEL=deepseek-chat
```

Endpoints

- POST `/api/upload`

  - multipart/form-data with `file` (PDF or DOCX)
  - Returns: `{ text, filename, size }`

- POST `/api/extract`
  - JSON `{ text: string }`
  - Returns: `{ data: { skills[], experience[], education[], summary? } }`

Local Development

- Install deps: `pnpm install`
- Run dev: `pnpm dev`

Notes

- `.doc` legacy files are not fully supported; prefer PDF/DOCX.
