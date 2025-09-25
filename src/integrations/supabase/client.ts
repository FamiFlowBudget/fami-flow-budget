// src/integrations/supabase/client.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Lee la URL secreta desde el archivo .env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// Lee la llave pública secreta desde el archivo .env
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Un chequeo de seguridad para asegurar que las variables existen
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Las variables de Supabase (URL y Key) no están definidas en el archivo .env");
}

// Importa el cliente de supabase de esta manera en otros archivos:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});