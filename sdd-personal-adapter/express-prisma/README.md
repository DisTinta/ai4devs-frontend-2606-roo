# Adaptador personal: `express-prisma`

Plantilla reutilizable para repos del máster AI4Devs con:

- monorepo `frontend/` + `backend/`
- backend **Express + TypeScript + Prisma + Jest**
- frontend **React CRA + Bootstrap**
- Postgres solo en **Docker Compose** (front/back en local)

No forma parte del kit oficial; vive en el repo del ejercicio para copiarlo a la siguiente práctica.

## Contenido

| Fichero | Destino tras instalar el kit |
|---|---|
| `express-prisma.env` | `.claude/sdd-harness.env` |
| `express-prisma.backend-standards.md` | `docs/backend-standards.md` |
| `express-prisma.frontend-standards.md` | `docs/frontend-standards.md` |
| `express-prisma.rules.mdc` | `.cursor/rules/30-stack.mdc` |

## Cómo reutilizarlo en otro repo

1. Instala el kit desde `sdd-harness-kit` (cae en `_template` si no hay adaptador Express):

```powershell
cd "C:\ruta\a\sdd-harness-kit"
.\install.ps1 -Dest "C:\ruta\al\nuevo-repo" -Frontend react
```

2. Sobrescribe los cuatro ficheros con las copias de esta carpeta.
3. Reescribe `docs/project-context.md` para el producto concreto (puertos, gotchas, nombre).
4. Prueba `npm --prefix backend test` a mano antes de confiar en el hook Stop.
5. Opcional más adelante: mover estos ficheros a `sdd-harness-kit/adapters/` como adaptador oficial (`express-prisma.*`) y documentarlos en el README del kit.

## Recordatorios

- Arranque: `docker compose up -d` → Prisma generate/migrate → backend `:3010` → frontend `:3000`.
- Los unit tests mockean Prisma: **no** exigen Docker.
- Si la suite Jest viene en rojo, usa `KIT_SKIP_STOP_TESTS=1` solo como escape temporal (si no, el hook Stop bloquea cada turno).
- No pegues secretos de `.env` en docs ni en el chat.
- Tras editar skills en `ai-specs/`, ejecuta `.claude\sync-artifacts.ps1`.
