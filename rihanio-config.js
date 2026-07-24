// ============================================================
// RIHANIO AUTO-ÉCOLE — Configuration Supabase partagée
// À inclure dans toutes les pages protégées (après le script Supabase CDN)
// ============================================================

const SUPABASE_URL = 'https://zenisqrgaiemicfqzudr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_I5721kHC1W91CwMTY4GkZg_Tm2vWD5g';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Profil de l'utilisateur connecté (rempli par requireAuth)
let currentProfile = null;

/**
 * Protège une page : redirige vers la connexion si non connecté,
 * ou si le compte n'a pas de société associée.
 * À appeler au chargement de chaque page protégée (dashboard, candidats, etc.)
 */
async function requireAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = 'rihanio-connexion.html';
    return null;
  }

  const { data: profile, error } = await supabaseClient
    .from('user_profiles')
    .select('company_id, role, full_name')
    .eq('id', session.user.id)
    .single();

  if (error || !profile) {
    await supabaseClient.auth.signOut();
    window.location.href = 'rihanio-connexion.html';
    return null;
  }

  currentProfile = profile;
  currentProfile.email = session.user.email;
  return currentProfile;
}

/**
 * Déconnexion : à brancher sur le bouton "Déconnexion" de chaque page.
 */
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'rihanio-connexion.html';
}
