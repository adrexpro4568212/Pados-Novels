# Diseño: Backup — Exportar e Importar Novela

**Fecha:** 2026-05-09
**Estado:** Aprobado
**Alcance:** Exportación por novela a JSON + importación con modal de vista previa

---

## 1. Objetivo

Permitir al usuario hacer backup de cualquier novela individual descargando un archivo `.novelr.json`, y restaurarla (o moverla entre navegadores) importando ese archivo. Al importar, el usuario puede editar el título y elegir el color de portada antes de confirmar.

---

## 2. Formato del archivo

**Nombre:** `{titulo-novela}.novelr.json`

```typescript
interface NovelrBackup {
  version: 1
  exportedAt: string          // 'YYYY-MM-DD'
  novel: Novel
  chapters: Chapter[]
  scenes: Scene[]             // incluye content (JSON Tiptap serializado)
  characters: Character[]
  notes: Note[]
  writingSessions: WritingSession[]
}
```

El campo `version` permite migraciones futuras si el schema cambia.

---

## 3. Flujo de exportación

### Disparadores
Dos puntos de acceso, ambos descargan el mismo archivo:

1. **Home — hover de tarjeta:** botón `⬇ Exportar` aparece junto a Renombrar y Eliminar al pasar el cursor sobre una tarjeta de novela.
2. **Workspace — barra de tabs:** botón `⬇ Exportar` en el extremo derecho de la barra superior del workspace (junto a los tabs Manuscrito / Biblia / Tablero / Stats).

### Lógica
```
exportNovel(novelId):
  1. Leer de Dexie: novel, chapters, scenes, characters, notes, writing_sessions
  2. Construir objeto NovelrBackup
  3. JSON.stringify con indentación legible
  4. Descargar via <a download> con Blob
  5. Nombre del archivo: sanitize(novel.title) + '.novelr.json'
```

La función `sanitize` elimina caracteres no válidos en nombres de archivo (`/\:*?"<>|`) y reemplaza espacios por guiones. Los caracteres Unicode (tildes, ñ, etc.) se conservan ya que los navegadores modernos los manejan correctamente en descargas.

---

## 4. Flujo de importación

### Disparador
Botón `⬆ Importar novela` en el header del home, junto al botón `+ Nueva novela`.

### Pasos
```
1. Click → abre <input type="file" accept=".json,.novelr.json">
2. Usuario selecciona archivo
3. FileReader lee el JSON → parse y validación básica:
   - ¿Tiene campo 'version'?
   - ¿Tiene campos 'novel', 'chapters', 'scenes'?
   - Si falla o `version !== 1`: mostrar mensaje de error dentro del modal (no hay sistema de toasts aún): "Archivo no válido o versión incompatible"
4. Abrir modal de vista previa
5. Usuario edita título y elige color → confirma
6. Importar: generar nuevos IDs para todos los registros,
   reescribir relaciones (novelId, chapterId, etc.) con los nuevos IDs,
   insertar todo en Dexie en una sola transacción
7. Cerrar modal → el home muestra la novela importada
```

### Modal de vista previa

El modal muestra antes de insertar nada en la base de datos:

| Elemento | Detalle |
|----------|---------|
| **Estadísticas del archivo** | Nº capítulos, escenas, personajes, palabras totales, fecha de exportación |
| **Título** | Input editable, pre-relleno con el título del backup |
| **Color de portada** | 8 círculos de color (misma paleta que "Nueva novela"), selección con borde activo |
| **Botones** | Cancelar / ✦ Importar novela |

El color seleccionado reemplaza `novel.color` antes de insertar.

---

## 5. Reescritura de IDs al importar

Todos los IDs son UUIDs v4. Al importar se generan IDs nuevos para evitar colisiones:

```typescript
// Mapa: id_original → id_nuevo
const novelMap  = { [backup.novel.id]:  newId() }
const chapMap   = Object.fromEntries(backup.chapters.map(c => [c.id, newId()]))
const sceneMap  = Object.fromEntries(backup.scenes.map(s => [s.id, newId()]))
const charMap   = Object.fromEntries(backup.characters.map(c => [c.id, newId()]))
const noteMap   = Object.fromEntries(backup.notes.map(n => [n.id, newId()]))
const sessMap   = Object.fromEntries(backup.writingSessions.map(s => [s.id, newId()]))

// Cada registro usa el mapa para reescribir su id y sus FK
novel.id = novelMap[novel.id]
chapters: c.id = chapMap[c.id], c.novelId = novelMap[c.novelId]
scenes:   s.id = sceneMap[s.id], s.novelId = novelMap[s.novelId], s.chapterId = chapMap[s.chapterId]
// etc.
```

Todo se inserta en una sola transacción Dexie para garantizar atomicidad.

---

## 6. Nuevos archivos

```
lib/
  backup.ts                        — exportNovel(), importNovel(), NovelrBackup type

components/
  home/
    import-novel-modal.tsx          — modal de vista previa con edición de título y color
```

### Archivos modificados
- `components/home/novel-card.tsx` — añadir botón Exportar en hover
- `components/home/novel-grid.tsx` — añadir botón "⬆ Importar novela" en header
- `app/novel/[novelId]/layout.tsx` — añadir botón Exportar en tab bar

---

## 7. Fuera de alcance

- Exportar múltiples novelas a la vez
- Importar desde Scrivener, Word u otros formatos
- Cifrado del backup
- Backup automático programado
