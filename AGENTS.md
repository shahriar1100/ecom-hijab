# Project preferences

- Do not generate new pictures or use image-generation tools unless the user explicitly requests image generation. Use the user's supplied images and existing local assets.
- Images will eventually come from dynamic data. Keep image paths and alt text in the typed data layer so they can be replaced without changing the layout. Do not add a backend just to prepare for this.
- Preserve existing work and keep changes within the requested scope. Static homepage content should remain Server Components; use Client Components only for interactions.
- Use npm. On this Windows machine, use `npm.cmd` when PowerShell blocks `npm.ps1`.
