# Hallazgos — ai4devs-frontend-2606-roo

Bitácora informal de cosas que vamos descubriendo al trabajar con el harness y el ejercicio (S10).  
Vive junto al registro de prompts (`prompts/`). No sustituye a `docs/project-context.md` (contexto estable para el agente); aquí va lo puntual, el “por qué falló” y decisiones pendientes.

**Cómo usarlo:** una entrada por hallazgo, en orden de aparición (la más reciente siempre al final). Fecha · área · estado.

---

## 2026-09-08 · Proceso / entrega · vigente

**Qué:** premisa obligatoria — `prompts/prompts-CRN.md` con prompts significativos curados (no el chat entero).

**Decisión:** tres entradas (install/adaptación, hallazgo+test, premisa); regla en `docs/project-context.md`.

---

## 2026-09-08 · Backend / tests · cerrado

**Qué:** `backend/src/application/services/positionService.test.ts` fallaba.

**Por qué:** desfase de contrato entre test y servicio (`id` + `applicationId` en el DTO; mock de `candidate` sin `id`).

**Decisión:** actualizar el test al contrato actual del servicio (no recortar el servicio).

**Hecho:** mock con `candidate.id: 10`; expect incluye `id` y `applicationId`. `KIT_SKIP_STOP_TESTS` vuelve a `0`.

---

## 2026-09-08 · Frontend / servicios · cerrado

**Qué:** `frontend/src/services/candidateService.js` importaba `axios`, pero `axios` **no está declarado en `frontend/package.json` ni instalado en `node_modules`** — y el fichero era **código muerto** (nada bajo `frontend/src` lo importa). El import habría fallado si se usara.

**Por qué importa:** al enriquecer HU-2..4 hubo que decidir cliente HTTP para los servicios frontend nuevos (`positionService.ts`). Aparente disyuntiva "fetch diverge / axios consistente" era falsa: axios no existe vivo, así que adoptarlo = **instalar una dependencia nueva** para simples JSON GET/PUT.

**Decisión:** servicios frontend usan **`fetch` nativo** — ver [ADR 20260908 — frontend HTTP fetch](../docs/adr/20260908-frontend-http-native-fetch.md). Y resolver la deuda: migrar el fichero muerto a `fetch` en vez de instalar axios.

**Hecho:** `candidateService.js` migrado a `fetch` (`uploadCV`, `sendCandidateData`); firmas y retorno (JSON parseado) preservados; sin `Content-Type` manual en el multipart (el navegador pone el boundary); non-2xx → `throw` vía `response.ok`; mensajes de error pasados a inglés (§2). Sin dependencia axios en el proyecto.
