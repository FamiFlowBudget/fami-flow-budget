// src/integrations/supabase/client.ts

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Lee la URL secreta desde el archivo .env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
// Lee la llave pública secreta desde el archivo .env
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// 🔒 Chequeo de seguridad: asegúrate de tener las variables definidas
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Las variables de Supabase (URL y Key) no están definidas en el archivo .env'
  )
}

// Crea el cliente de Supabase (sesión persistente + auto refresh)
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

// Evita el warning "Multiple GoTrueClient instances" en desarrollo (opcional)
if (import.meta.hot) {
  // @ts-ignore
  window.__SUPABASE__ ??= supabase
}

// ✅ Exportación por nombre y por defecto (para compatibilidad total)
export default supabase

