# Deployment Notes

## Vercel

Vercel should deploy this Vite app using the normal static build path:

- Build command: `npm run build`
- Output directory: `dist`
- Development command: `npm run dev`

`vercel.json` keeps client-side routes working after refresh.

## Docker

A Dockerfile is included for container verification or alternate hosting.

```bash
docker build -t billsync-legal-frontend .
docker run --rm -p 8080:80 billsync-legal-frontend
```

Docker was not available on the local machine used for this branch, so the container image was not built locally.

