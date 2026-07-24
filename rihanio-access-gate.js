const RH_PAYMENT_BANK_NAME = 'Attijariwafa Bank';
const RH_PAYMENT_ACCOUNT_NUMBER = '000 000 0000000000000000 00'; // <-- Remplacez par le numéro de compte réel (RIB)
const RH_PAYMENT_ACCOUNT_HOLDER = 'RIHANIO AUTO-ÉCOLE SARL';      // <-- Remplacez par le nom du titulaire du compte

const RH_GRACE_DAYS = 4;

(function injectGateStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .rh-gate-overlay{
      position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
      padding:20px;background:rgba(15,16,35,.45);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
      opacity:0;transition:opacity .25s ease;
    }
    .rh-gate-overlay.open{opacity:1;}
    .rh-gate-card{
      width:100%;max-width:420px;max-height:90vh;overflow-y:auto;background:var(--surface,#fff);
      border-radius:24px;padding:34px 28px;text-align:center;box-shadow:0 40px 80px -20px rgba(0,0,0,.5);
      transform:scale(.96);transition:transform .25s ease;
    }
    .rh-gate-overlay.open .rh-gate-card{transform:scale(1);}
    .rh-gate-icon{
      width:60px;height:60px;border-radius:18px;margin:0 auto 18px;display:flex;align-items:center;justify-content:center;
      background:var(--danger-soft,#FDECEB);color:var(--danger,#F0473F);
    }
    .rh-gate-icon svg{width:28px;height:28px;}
    .rh-gate-card h2{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:18px;color:var(--ink,#171933);margin-bottom:8px;}
    .rh-gate-card > p{font-size:12.5px;color:var(--ink-soft,#6E7191);line-height:1.8;margin-bottom:22px;}
    .rh-gate-actions{display:flex;flex-direction:column;gap:10px;}
    .rh-gate-btn-pay{
      background:linear-gradient(135deg,var(--primary,#5B62F4),var(--primary-2,#8B6FF2));color:#fff;border:none;
      font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;padding:13px;border-radius:13px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;gap:8px;
    }
    .rh-gate-btn-pay svg{width:17px;height:17px;}
    .rh-gate-btn-logout{
      background:none;border:none;color:var(--ink-pale,#A6A9C8);font-size:12.5px;font-weight:600;cursor:pointer;padding:6px;
    }
    .rh-gate-btn-logout:hover{color:var(--danger,#F0473F);}

    .rh-gate-pay-form{text-align:left;direction:ltr;}
    .rh-gate-bank-info{
      background:var(--surface-2,#F7F8FD);border:1px solid var(--border,#EBECF7);border-radius:14px;padding:14px 16px;margin-bottom:16px;
    }
    .rh-gate-bank-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;font-size:12.5px;}
    .rh-gate-bank-row + .rh-gate-bank-row{border-top:1px dashed var(--border,#EBECF7);}
    .rh-gate-bank-row span{color:var(--ink-soft,#6E7191);}
    .rh-gate-bank-row b{color:var(--ink,#171933);font-family:'Plus Jakarta Sans',sans-serif;direction:ltr;unicode-bidi:embed;}
    .rh-gate-field{margin-bottom:12px;text-align:left;}
    .rh-gate-field label{display:block;font-size:12px;font-weight:700;color:var(--ink-soft,#6E7191);margin-bottom:6px;}
    .rh-gate-field input[type="file"]{
      width:100%;border:1.5px dashed var(--border,#EBECF7);border-radius:12px;padding:10px 12px;font-size:12px;
      background:var(--surface-2,#F7F8FD);color:var(--ink,#171933);cursor:pointer;
    }
    .rh-gate-field textarea{
      width:100%;border:1.5px solid var(--border,#EBECF7);border-radius:12px;padding:10px 12px;font-size:12.5px;
      background:var(--surface-2,#F7F8FD);color:var(--ink,#171933);outline:none;font-family:'Inter',sans-serif;resize:vertical;
    }
    .rh-gate-field textarea:focus{border-color:var(--primary,#5B62F4);}
    .rh-gate-msg{font-size:12px;margin-bottom:10px;padding:9px 12px;border-radius:10px;display:none;text-align:center;}
    .rh-gate-msg.err{display:block;background:var(--danger-soft,#FDECEB);color:var(--danger,#F0473F);}
    .rh-gate-msg.ok{display:block;background:var(--available-soft,#E5F9EF);color:var(--available,#18B368);}
    .rh-gate-form-actions{display:flex;gap:10px;margin-top:6px;}
    .rh-gate-btn-back{
      flex:1;padding:12px;border-radius:12px;border:1.5px solid var(--border,#EBECF7);background:none;
      font-weight:700;font-size:13px;color:var(--ink-soft,#6E7191);cursor:pointer;
    }
    .rh-gate-btn-confirm{
      flex:1.4;display:flex;align-items:center;justify-content:center;gap:7px;
      background:linear-gradient(135deg,var(--primary,#5B62F4),var(--primary-2,#8B6FF2));color:#fff;border:none;
      font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13.5px;padding:12px;border-radius:12px;cursor:pointer;
    }
    .rh-gate-btn-confirm:disabled{opacity:.6;cursor:not-allowed;}
    .rh-gate-btn-confirm svg{width:15px;height:15px;}

    .rh-gate-success{display:flex;flex-direction:column;align-items:center;gap:12px;}
    .rh-gate-success svg{width:44px;height:44px;color:var(--available,#18B368);}
    .rh-gate-success p{font-size:13px;color:var(--ink,#171933);line-height:1.8;}
  `;
  document.head.appendChild(style);
})();

/**
 * Vérifie le statut de l'abonnement de la société, sinon s'il est suspendu ou inactif, il bloque toute la page.
 */
async function checkAccountAccess(profile) {
  if (!profile || profile.role === 'super_admin' || !profile.company_id) return;

  const { data: company, error } = await supabaseClient
    .from('companies')
    .select('id, name, subscription_start_date, subscription_duration_days, is_suspended')
    .eq('id', profile.company_id)
    .single();
  if (error || !company) return;

  let blocked = false;
  if (company.is_suspended) {
    blocked = true;
  } else if (company.subscription_start_date) {
    const start = new Date(company.subscription_start_date);
    const end = new Date(start);
    end.setDate(end.getDate() + (company.subscription_duration_days || 30));
    const graceEnd = new Date(end);
    graceEnd.setDate(graceEnd.getDate() + RH_GRACE_DAYS);
    if (new Date() > graceEnd) blocked = true;
  }

  if (blocked) showAccessGate(profile);
}

function showAccessGate(profile) {
  if (document.querySelector('.rh-gate-overlay')) return; // Ne pas répéter la fenêtre

  document.documentElement.style.overflow = 'hidden';

  const overlay = document.createElement('div');
  overlay.className = 'rh-gate-overlay';
  overlay.innerHTML = `
    <div class="rh-gate-card">
      <div class="rh-gate-icon"><i data-lucide="lock"></i></div>
      <h2>Votre abonnement a expiré</h2>
      <p>Pour réactiver votre compte, vous pouvez régler votre abonnement via le compte bancaire ci-dessous et envoyer une preuve de paiement. Le compte sera réactivé par l'administration après vérification.</p>

      <div class="rh-gate-actions" id="rhGateStep1">
        <button type="button" class="rh-gate-btn-pay" id="rhGatePayBtn"><i data-lucide="credit-card"></i>Payer l'abonnement</button>
        <button type="button" class="rh-gate-btn-logout" id="rhGateLogoutBtn">Se déconnecter</button>
      </div>

      <form class="rh-gate-pay-form" id="rhGatePayForm" style="display:none;">
        <div class="rh-gate-bank-info">
          <div class="rh-gate-bank-row"><span>Banque</span><b>${RH_PAYMENT_BANK_NAME}</b></div>
          <div class="rh-gate-bank-row"><span>Numéro de compte</span><b>${RH_PAYMENT_ACCOUNT_NUMBER}</b></div>
          <div class="rh-gate-bank-row"><span>Titulaire du compte</span><b>${RH_PAYMENT_ACCOUNT_HOLDER}</b></div>
        </div>
        <div class="rh-gate-field">
          <label>Preuve de paiement (Image) *</label>
          <input type="file" accept="image/*" id="rhGateProofFile" required>
        </div>
        <div class="rh-gate-field">
          <label>Note (optionnel)</label>
          <textarea id="rhGateNote" rows="2" placeholder="Exemple : Numéro de transaction, Date..."></textarea>
        </div>
        <div class="rh-gate-msg" id="rhGateMsg"></div>
        <div class="rh-gate-form-actions">
          <button type="button" class="rh-gate-btn-back" id="rhGateBackBtn">Retour</button>
          <button type="submit" class="rh-gate-btn-confirm" id="rhGateConfirmBtn"><i data-lucide="check"></i>Confirmer</button>
        </div>
      </form>

      <div class="rh-gate-success" id="rhGateSuccess" style="display:none;">
        <i data-lucide="check-circle-2"></i>
        <p>Votre demande a été envoyée avec succès.<br>L'abonnement sera activé après vérification par l'administration.</p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  if (window.lucide) lucide.createIcons();
  requestAnimationFrame(() => overlay.classList.add('open'));

  const step1 = overlay.querySelector('#rhGateStep1');
  const form = overlay.querySelector('#rhGatePayForm');
  const success = overlay.querySelector('#rhGateSuccess');

  overlay.querySelector('#rhGatePayBtn').addEventListener('click', () => {
    step1.style.display = 'none';
    form.style.display = 'block';
  });
  overlay.querySelector('#rhGateBackBtn').addEventListener('click', () => {
    form.style.display = 'none';
    step1.style.display = 'flex';
  });
  overlay.querySelector('#rhGateLogoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'rihanio-connexion.html';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = overlay.querySelector('#rhGateMsg');
    const btn = overlay.querySelector('#rhGateConfirmBtn');
    const fileInput = overlay.querySelector('#rhGateProofFile');
    msg.className = 'rh-gate-msg';

    const file = fileInput.files[0];
    if (!file) {
      msg.classList.add('err');
      msg.textContent = 'Veuillez ajouter une photo de la preuve de paiement';
      return;
    }

    btn.disabled = true;
    btn.innerHTML = 'Envoi en cours...';

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${profile.company_id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabaseClient.storage
        .from('payment-proofs')
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabaseClient.from('payment_submissions').insert({
        company_id: profile.company_id,
        submitted_by: session.user.id,
        file_path: path,
        note: overlay.querySelector('#rhGateNote').value.trim() || null
      });
      if (insertError) throw insertError;

      form.style.display = 'none';
      success.style.display = 'flex';
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      msg.classList.add('err');
      msg.textContent = err.message || 'Une erreur est survenue, veuillez réessayer';
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check"></i>Confirmer';
      if (window.lucide) lucide.createIcons();
    }
  });
}
