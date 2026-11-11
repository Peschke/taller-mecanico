import { supabase } from '@/lib/supabaseClient'

const origin = () => window.location.origin

export const authService = {
  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (callback) => supabase.auth.onAuthStateChange(callback),

  signInStaff: (email, password) =>
    supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }),

  // Enlace mágico para clientes: el trigger fn_nuevo_usuario_auth vincula clientes.auth_user_id por correo
  signInCliente: (email) =>
    supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${origin()}/auth/callback`, shouldCreateUser: true },
    }),

  signOut: () => supabase.auth.signOut(),

  resetPassword: (email) =>
    supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${origin()}/actualizar-clave`,
    }),

  updatePassword: (password) => supabase.auth.updateUser({ password }),
}
