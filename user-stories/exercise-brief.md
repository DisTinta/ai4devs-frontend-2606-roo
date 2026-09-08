# Creando la interfaz de gestión de aplicaciones de LTI

**Autora del enunciado:** Lia Carrizo  
**Fecha límite (curso):** martes 8 de septiembre, al final del día.

## Contexto

En LTI ya existe la funcionalidad para listar las posiciones requeridas por la empresa. Está disponible en la página **positions**: una lista de tarjetas por posición, con filtros por texto, fecha límite, estado y administrador responsable.

Al pulsar **"Ver proceso"** en cualquiera de las posiciones, se debe abrir la vista de detalle de esa posición, denominada **position**.

## 1. Repositorio base

Apoyarse en el repositorio base del ejercicio:

- Interfaz de usuario de **AI4Devs-2606-roo** (fork/repo de trabajo del alumno).

## 2. Objetivo del ejercicio

Crear la interfaz **position**: una página para visualizar y gestionar los candidatos de un puesto concreto.

La interfaz será tipo **kanban**:

- Los candidatos se muestran como tarjetas.
- Las columnas representan las fases del proceso de contratación.
- Se puede actualizar la fase de un candidato **arrastrando** su tarjeta a otra columna.

### Requisitos de diseño

- Mostrar el **título de la posición** en la parte superior (contexto).
- Una **flecha a la izquierda del título** para volver al listado de posiciones.
- Tantas **columnas como fases** tenga el proceso.
- Cada tarjeta en la fase correspondiente, mostrando **nombre completo** y **puntuación media**.
- Si es posible, **responsive en móvil**: fases en vertical ocupando todo el ancho.

### Observaciones de alcance

- La página de listado de posiciones se asume existente.
- Se asume la estructura global de la página (menú superior, pie de página, etc.). Lo que se crea es el **contenido interno** de la página position.
- La funcionalidad se apoya en endpoints preparados por backend (ver siguiente sección).

### API disponible

#### `GET /positions/:id/interviewFlow`

Devuelve información del proceso de contratación:

- `positionName`: título de la posición
- `interviewFlow.interviewSteps`: id y nombre de las fases (`orderIndex` para ordenar)

```json
{
  "positionName": "Senior backend engineer",
  "interviewFlow": {
    "id": 1,
    "description": "Standard development interview process",
    "interviewSteps": [
      {
        "id": 1,
        "interviewFlowId": 1,
        "interviewTypeId": 1,
        "name": "Initial Screening",
        "orderIndex": 1
      },
      {
        "id": 2,
        "interviewFlowId": 1,
        "interviewTypeId": 2,
        "name": "Technical Interview",
        "orderIndex": 2
      },
      {
        "id": 3,
        "interviewFlowId": 1,
        "interviewTypeId": 3,
        "name": "Manager Interview",
        "orderIndex": 3
      }
    ]
  }
}
```

#### `GET /positions/:id/candidates`

Devuelve todas las aplicaciones de ese `positionId`:

- `fullName`: nombre completo
- `currentInterviewStep`: fase actual (nombre de la fase)
- `averageScore`: puntuación media

```json
[
  {
    "fullName": "Jane Smith",
    "currentInterviewStep": "Technical Interview",
    "averageScore": 4
  },
  {
    "fullName": "Carlos García",
    "currentInterviewStep": "Initial Screening",
    "averageScore": 0
  },
  {
    "fullName": "John Doe",
    "currentInterviewStep": "Manager Interview",
    "averageScore": 5
  }
]
```

#### `PUT /candidates/:id/stage`

Actualiza la fase del candidato movido. El body indica la aplicación y el id de la fase (columna) destino:

```json
{
  "applicationId": "1",
  "currentInterviewStep": "3"
}
```

Ejemplo de respuesta:

```json
{
  "message": "Candidate stage updated successfully",
  "data": {
    "id": 1,
    "positionId": 1,
    "candidateId": 1,
    "applicationDate": "2024-06-04T13:34:58.304Z",
    "currentInterviewStep": 3,
    "notes": null,
    "interviews": []
  }
}
```

## 3. Entrega

Se espera un **pull request** en el repositorio que incluya:

- Cambios de páginas, lógica, etc. en la carpeta `/frontend`.
- Un fichero de avisos / prompts según las instrucciones personalizadas del alumno (en esta entrega: `prompts/prompts-CRN.md`).

Pasos habituales:

1. Completar el ejercicio (código en frontend y registro de prompts/avisos).
2. Crear la rama del entregable (en esta entrega: `frontend-CRN`).
3. Commit y push.
4. Abrir el Pull request en la interfaz del repositorio.

Si el PR no es viable, alternativa: enviar el proyecto en zip a `dago@lidr.es`.

Dudas: grupo de WhatsApp del curso.
