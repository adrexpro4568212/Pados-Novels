# Diseño: Racha de Escritura por Novela

**Fecha:** 2026-05-09
**Estado:** Aprobado
**Alcance:** Racha diaria de escritura por novela — cálculo, configuración y visualización

---

## 1. Objetivo

Motivar al usuario a escribir todos los días mostrando una racha de días consecutivos por novela. La racha le permite saber qué novelas tienen impulso activo y priorizar su tiempo. El mínimo de palabras es configurable por novela para que el usuario adapte el reto a cada proyecto.

---

## 2. Modelo de datos

### Campo nuevo en `Novel`

```typescript
// lib/db.types.ts — añadir campo opcional
interface Novel {
  // ...campos existentes...
  streakMinWords?: number   // mínimo de palabras/día para contar como día válido. Default: 50
}
```

No se requiere migración de Dexie porque el campo es opcional y no necesita índice. Los registros existentes tendrán `streakMinWords === undefined`, que se interpreta como 50.

### Sin cambios en `WritingSession`

La racha se calcula desde los datos existentes: `{ date: string, wordCount: number }` donde `wordCount` es el total acumulado de palabras de la novela al final de esa sesión.

---

## 3. Lógica de cálculo

### `computeStreak(sessions, minWords, today?)`

Función pura, completamente testeable sin Dexie:

```
1. Ordenar sesiones por fecha ascendente
2. Para cada sesión i, calcular delta:
     delta[i] = sessions[i].wordCount − sessions[i−1].wordCount
     delta[0] = sessions[0].wordCount
3. Marcar cada fecha con delta >= minWords como "día válido"
4. Desde today hacia atrás:
     - Si today no es día válido (aún no se ha escrito suficiente hoy),
       empezar desde yesterday (no rompe la racha por "todavía no escribí")
     - Contar días consecutivos válidos hasta encontrar un hueco
5. Devolver el conteo
```

**Regla clave:** si el usuario no ha escrito hoy todavía, la racha no se rompe — se evalúa desde el día anterior. La racha solo se rompe si ayer tampoco cumplió el mínimo.

### `useStreak(novelId): number`

Hook React que combina sesiones y configuración:

```typescript
function useStreak(novelId: string): number {
  const sessions = useWritingSessions(novelId) ?? []
  const novel = useNovel(novelId)
  const minWords = novel?.streakMinWords ?? 50
  return useMemo(() => computeStreak(sessions, minWords), [sessions, minWords])
}
```

---

## 4. Configuración por novela

El usuario edita el mínimo directamente en la página de Stats de cada novela. Un input numérico pequeño debajo de las métricas:

```
Mínimo diario para racha: [50] palabras
```

Al cambiar el valor se llama `updateNovel(novelId, { streakMinWords: value })`. No hay confirmación — el cambio es inmediato.

Restricciones: mínimo 1 palabra, máximo 10 000. Si el input queda vacío o inválido, se mantiene el valor anterior.

---

## 5. Visualización

### 5.1 Página de Stats (`app/novel/[novelId]/stats/page.tsx`)

La racha aparece como **4ª tarjeta de métrica** junto a palabras totales, palabras hoy y progreso. La tarjeta tiene borde en `var(--accent)` cuando la racha es ≥ 1, borde normal cuando es 0.

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   82k    │ │   340    │ │  🔥 12   │ │   68%    │
│ palabras │ │   hoy    │ │  días    │ │ progreso │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

El historial de sesiones añade un 🔥 al final de cada fila cuyo delta cumplió el mínimo ese día.

Campo de configuración debajo del historial:
```
Mínimo diario para racha: [50] palabras
```

### 5.2 Barra de tabs del workspace (`components/workspace/workspace-tabs.tsx`)

Badge `🔥 N días` antes del botón Exportar, en el extremo derecho:

```
✦  La Tormenta  |Manuscrito| Biblia | Tablero | Stats     [🔥 12 días] [⬇ Exportar]
```

- Racha ≥ 1: badge con borde y texto `var(--accent)`
- Racha = 0: badge apagado (opacity 0.4), texto `0 días`

---

## 6. Archivos

### Nuevos

```
lib/hooks/use-streak.ts          — computeStreak() + useStreak()
tests/lib/use-streak.test.ts     — tests unitarios de computeStreak
```

### Modificados

```
lib/db.types.ts                  — añadir streakMinWords?: number a Novel
components/workspace/workspace-tabs.tsx   — badge 🔥 N días
app/novel/[novelId]/stats/page.tsx        — tarjeta racha + 🔥 en historial + config input
```

---

## 7. Tests

`computeStreak` es una función pura — todos los casos se testean sin Dexie:

| Caso | Esperado |
|------|----------|
| Sin sesiones | 0 |
| Una sesión hoy con delta ≥ minWords | 1 |
| Una sesión ayer con delta ≥ minWords, hoy sin sesión | 1 |
| Tres días consecutivos cumpliendo el mínimo | 3 |
| Hueco en la racha (día sin sesión en medio) | cuenta solo los días recientes |
| Delta < minWords en algún día | ese día no cuenta, rompe la racha |
| Sesión con exactamente minWords | cuenta (borde exacto) |

---

## 8. Fuera de alcance

- Racha global entre todas las novelas
- Notificaciones push o recordatorios
- Historial de rachas pasadas (solo se muestra la racha actual)
- Badges o logros por rachas largas
