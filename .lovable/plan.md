

## Auditoría del Plan v2 — Command Center Upgrade

### Resumen del plan

El documento propone pasar de v1 (4 páginas, 5 tablas) a v2 (8 páginas, 8 tablas) añadiendo un sistema de visibilidad sobre agentes autónomos de ATLAS. Es un plan ambicioso pero bien estructurado. Aquí va mi análisis.

---

### Lo que está bien

1. **Read-only scope**: Mantener todo sin escrituras simplifica enormemente. No hay mutaciones, no hay conflictos de estado, no hay RLS complejas de escritura.
2. **Reutilización de patrones**: El plan pide usar el mismo `supabase` client, mismo estilo de Realtime hooks, mismos componentes shadcn/ui. Esto es correcto y eficiente.
3. **Tablas ya creadas con RLS y Realtime**: No hay trabajo de backend, solo frontend. Ideal para Lovable.
4. **Diseño consistente**: Las especificaciones de badges, colores, empty states siguen exactamente lo que ya existe.

---

### Riesgos y problemas que veo

#### 1. Tamaño del sprint — demasiado para un solo paso
El plan tiene **4 páginas nuevas + 4 widgets de dashboard + sidebar reestructurado + Realtime para 3 tablas**. Eso son ~12-15 archivos nuevos. Lovable rinde mejor con cambios incrementales. Recomiendo dividir en **3 sub-sprints**:

- **4a**: Tipos, hooks de datos, Realtime para las 3 tablas nuevas, sidebar actualizado
- **4b**: Páginas Agent Feed + Approvals (comparten `agent_activity`)
- **4c**: Páginas Follow-Ups + Improvements + 4 widgets del Dashboard

#### 2. Widget "Outreach This Week" depende de columnas que no existen
El widget 3 (Outreach) espera `prospects_found`, `cold_emails_sent`, `outreach_response_rate` en `daily_metrics`. Pero el tipo `DailyMetric` actual solo tiene: `total_active_deals`, `total_pipeline_value`, `deals_at_risk`, `deals_by_stage`, `avg_days_to_close`, `win_rate`. **Si esas columnas no existen en la tabla real, el widget siempre mostrará 0.** Hay que verificar que la tabla tenga esas columnas o eliminar ese widget.

#### 3. Emojis como iconos de agente
El plan usa emojis (☀️, ⚙️, 📋, etc.) como iconos de agente. En producción con Tailwind/shadcn, es mejor usar **Lucide icons con colores** (Sun, Cog, ClipboardList, Mail, Target, BarChart, Search, TrendingUp). Los emojis se renderizan distinto por OS y no escalan bien en dark mode.

#### 4. Threshold de Agent Health para agentes semanales
El plan menciona ajustar el threshold a >8 días para `improvement-scan` y `weekly-report`. Esto es un detalle importante que debe estar en el código, no solo en la documentación. Lo implementaré como constante configurable.

#### 5. "Emails due today" es un cálculo complejo
Calcular `created_at + sum(delay_days de steps previos)` en el cliente para cada plan y cada step es ineficiente si hay muchos planes. Pero siendo read-only y con volúmenes bajos (probablemente <50 planes), es aceptable hacerlo client-side.

#### 6. Playbooks sin página dedicada
La tabla `playbooks` tiene 5 rows pero no hay página para mostrarlos. El plan menciona vagamente "can be displayed on `/improvements` or as a reference somewhere". Sugiero mostrarlos como una sección colapsable en `/improvements`.

---

### Lo que cambiaría

| Aspecto | Plan original | Mi recomendación |
|---|---|---|
| Iconos de agente | Emojis | Lucide icons con colores CSS |
| Ejecución | Todo de golpe | 3 sub-sprints incrementales |
| Widget Outreach | Asume columnas en daily_metrics | Verificar schema primero, o usar datos de agent_activity como fallback |
| Playbooks | Sin ubicación clara | Sección en `/improvements` |
| Animaciones slide-in | CSS animations | Framer Motion no está instalado, usaría CSS `@keyframes` o Tailwind `animate-` |
| Lazy loading | No mencionado | Las 4 páginas nuevas deberían ser `React.lazy()` como ya hacemos con Metrics |

---

### Preguntas antes de implementar

Necesito confirmar un punto antes de arrancar:

1. **¿La tabla `daily_metrics` ya tiene las columnas `prospects_found`, `cold_emails_sent`, `outreach_response_rate`?** Si no, elimino el widget Outreach o lo reemplazo con datos de `agent_activity` (contando action_type='prospect_found' y 'follow_up_sent').

---

### Plan de implementación propuesto (3 sub-sprints)

**Sprint 4a — Infraestructura + Sidebar**
- Crear tipos TypeScript para `AgentActivity`, `FollowUpPlan`, `Playbook`
- Crear hooks: `useAgentActivity`, `useFollowUpPlans`, `usePlaybooks`, `useImprovementTasks`
- Crear hook de Realtime para las 3 tablas nuevas
- Actualizar sidebar con secciones agrupadas ("ATLAS Engine", "Analytics") y footer v2.0 con dot verde
- Actualizar rutas en App.tsx con lazy loading

**Sprint 4b — Agent Feed + Approvals**
- Página `/agents` con filtros, feed de actividad, cards con iconos Lucide por agente
- Página `/approvals` con tabs Pending/History, cards con borde amarillo
- Realtime para nuevas entradas

**Sprint 4c — Follow-Ups + Improvements + Dashboard Widgets**
- Página `/follow-ups` con stepper horizontal, expand/collapse
- Página `/improvements` con agrupación por semana + sección de playbooks
- 4 widgets nuevos en Dashboard (Agent Pulse, Follow-Up Plans, Outreach o alternativa, Agent Health)

