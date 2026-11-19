# DEV//SIM_01 — Portafolio

Sitio estático (HTML, CSS y JavaScript, sin build) con un portafolio bilingüe ES/EN, escena Three.js de fondo, laboratorio interactivo y una biblioteca de proyectos basada en JSON.

## Añadir proyectos

Toda la vitrina se genera desde [`projects.json`](./projects.json). Para publicar un proyecto nuevo basta con añadir un objeto dentro de `projects`, sin tocar el HTML.

### Categorías

Las categorías actuales son:

| `id` | Español | English |
| --- | --- | --- |
| `videojuegos` | Videojuegos | Games |
| `simulaciones` | Simulaciones | Simulations |
| `shaders-tech` | Shaders / Tech | Shaders / Tech |

Cada categoría crea automáticamente su botón de filtro. Si añades una categoría nueva al array `categories`, el filtro aparece solo. Si usas una categoría no declarada en un proyecto, la web crea un filtro de respaldo con ese `id` como nombre.

### Estructura de un proyecto

```json
{
  "id": "mi-proyecto",
  "category": "videojuegos",
  "layout": "standard",
  "visual": "generic",
  "mediaCode": "GAME.04",
  "engine": "UNITY",
  "tech": {
    "es": "Unity • C# • Sistemas de combate",
    "en": "Unity • C# • Combat systems"
  },
  "tags": {
    "es": "VIDEOJUEGO // RPG",
    "en": "GAME // RPG"
  },
  "preview": {
    "es": "DEMO JUGABLE",
    "en": "PLAYABLE DEMO"
  },
  "title": {
    "es": "Nombre del proyecto",
    "en": "Project name"
  },
  "description": {
    "es": "Descripción breve para la tarjeta.",
    "en": "Short description for the card."
  },
  "specs": ["GAMEPLAY", "C#", "UNITY"],
  "link": {
    "url": "https://github.com/usuario/repositorio",
    "label": {
      "es": "GitHub",
      "en": "GitHub"
    }
  },
  "details": {
    "es": {
      "challenge": "Reto técnico del proyecto.",
      "solution": "Arquitectura y solución aplicada.",
      "metrics": "Resultado o telemetría."
    },
    "en": {
      "challenge": "Technical challenge of the project.",
      "solution": "Architecture and solution applied.",
      "metrics": "Result or telemetry."
    }
  }
}
```

### Campos

- `id`: identificador único, sin espacios. Se usa para abrir la ficha técnica.
- `category`: uno de los `id` del array `categories`.
- `layout`: `featured` (tarjeta grande), `standard` (tarjeta normal) o `wide` (fila completa).
- `visual`: `fluid`, `tactical`, `boids` o cualquier otro valor para usar el arte genérico.
- `mediaCode` y `engine`: etiquetas cortas que aparecen sobre la portada.
- `tech`: texto técnico de la tarjeta y de la ficha. Acepta un string o un objeto `{ "es": "...", "en": "..." }`.
- `tags`, `preview`, `title`, `description`: textos bilingües. También aceptan un string si es igual en ambos idiomas.
- `specs`: etiquetas cortas de la tarjeta.
- `link.url`: URL opcional. Si está vacía, el enlace no se muestra. Si se rellena, se abre en una pestaña nueva.
- `details`: contenido de la ficha técnica en español e inglés.

### Arte de la tarjeta

Las portadas de los tres proyectos actuales viven como plantillas SVG en `index.html` (`art-fluid`, `art-tactical`, `art-boids`). Cualquier otro valor de `visual` genera una portada procedural con el título, la categoría y el color de la categoría.

## Añadir una categoría

```json
{
  "id": "herramientas",
  "label": {
    "es": "Herramientas",
    "en": "Tools"
  }
}
```

Añádela al array `categories` y usa `"category": "herramientas"` en los proyectos.

## Probar en local

La biblioteca se carga con `fetch`, así que necesita un servidor HTTP (no abras `index.html` con doble clic):

```powershell
python -m http.server 8123
```

Después abre `http://127.0.0.1:8123/`.
