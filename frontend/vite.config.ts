import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Produção: o Laravel serve os assets a partir de backend/public/build,
// mesma origem do domínio da API (ver docs/deployment/ARQUITETURA_PRODUCAO.md
// §3 e ADR-015). Só ativa com VITE_BUILD_TARGET=locaweb (script
// `build:locaweb`, usado pelo job de CI de deploy) — `npm run build`
// (validação do CI de testes, imagem Docker de dev local via
// docker-compose) continua com o outDir padrão (`dist`), sem o qual a
// etapa `COPY --from=build /app/dist ...` do Dockerfile quebraria.
// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  ...(process.env.VITE_BUILD_TARGET === 'locaweb'
    ? {
        base: '/build/',
        build: {
          outDir: '../backend/public/build',
          emptyOutDir: true,
        },
      }
    : {}),
}))
