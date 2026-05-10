# Gastos Santa Elena

App mobile-first para registrar y administrar los gastos diarios del Hostal Santa Elena.

## Características

- Registro rápido de gastos (< 10 segundos desde el celular)
- Compras agrupadas con múltiples ítems
- Foto de boleta opcional con **análisis automático por IA** (Claude Vision)
- Sugerencia automática de categoría al escribir el detalle
- Chatbot del hostal: pregunta en lenguaje natural sobre los gastos
- Resumen mensual con gráficos y análisis de IA
- Historial con filtros por categoría, responsable y período
- Formato CLP chileno ($12.000)
- Supabase Auth + RLS

---

## Requisitos previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Vercel](https://vercel.com)
- API Key de [Anthropic](https://console.anthropic.com)

---

## Instalación local

### 1. Clonar y configurar variables de entorno

```bash
git clone <url-del-repo>
cd gastos-santa-elena
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
ANTHROPIC_API_KEY=sk-ant-api03-...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

> **IMPORTANTE:** `ANTHROPIC_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` son secretos del servidor.
> Nunca deben tener el prefijo `VITE_` ni ser expuestos al navegador.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Correr en desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:5173`

---

## Configurar Supabase

### 1. Crear proyecto

1. Ve a [app.supabase.com](https://app.supabase.com)
2. Crea un nuevo proyecto
3. Copia la URL y las API keys en tu `.env`

### 2. Ejecutar migraciones

En el **SQL Editor** de Supabase, ejecuta en orden:

```sql
-- Primero: tablas, RLS, storage
-- Contenido de: supabase/migrations/001_schema.sql
```

```sql
-- Segundo: datos iniciales
-- Contenido de: supabase/migrations/002_seed.sql
```

O usando la CLI de Supabase:

```bash
npx supabase db push
```

### 3. Configurar Auth

1. Ve a **Authentication > Settings**
2. Habilita **Email** como proveedor
3. (Opcional) Configura un dominio personalizado para magic links

---

## Build para producción

```bash
npm run build
```

Los archivos de salida estarán en `dist/`.

---

## Deploy en Vercel

### 1. Conectar repositorio

1. Ve a [vercel.com](https://vercel.com) y crea un nuevo proyecto
2. Conecta tu repositorio de GitHub
3. Vercel detectará automáticamente que es un proyecto Vite

### 2. Configurar variables de entorno en Vercel

En **Settings > Environment Variables**, agrega:

| Variable | Valor | Entorno |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | Anon key de Supabase | Production, Preview |
| `ANTHROPIC_API_KEY` | Tu API key de Anthropic | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase | Production, Preview |

### 3. Deploy

Vercel hace deploy automático en cada push a `main`.

También puedes hacer deploy manual:

```bash
npx vercel --prod
```

---

## Estructura del proyecto

```
├── api/                    # Vercel Serverless Functions (IA)
│   ├── analyze-receipt.ts  # OCR de boletas con Claude Vision
│   ├── suggest-category.ts # Categorización automática
│   ├── monthly-insights.ts # Análisis mensual con IA
│   └── chat.ts             # Chatbot con tool_use + Supabase
├── src/
│   ├── components/         # Componentes reutilizables
│   ├── pages/              # Páginas de la app
│   ├── services/           # Llamadas a Supabase
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utilidades (formatos CLP, fechas)
│   ├── contexts/           # Auth y Toast context
│   └── types/              # TypeScript types
├── supabase/
│   └── migrations/         # SQL migrations
└── public/
```

---

## Seguridad

- RLS activado en todas las tablas de Supabase
- Solo usuarios autenticados pueden leer/escribir datos
- La API key de Anthropic y el Service Role Key de Supabase **nunca** llegan al navegador
- Las Vercel Functions actúan como proxy seguro para todas las llamadas a la IA

---

## Comandos principales

```bash
npm install      # Instalar dependencias
npm run dev      # Servidor de desarrollo (http://localhost:5173)
npm run build    # Build para producción
npm run preview  # Preview del build
```
