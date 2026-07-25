// ============================================================
// RIHANIO — Verrouillage de compte (abonnement expiré / suspendu)
// + formulaire d'envoi de justificatif de paiement
// À inclure sur chaque page protégée, APRÈS rihanio-config.js
// Utilisation (après requireAuth) :
//     if (!profile) return;
//     checkAccountAccess(profile);
// ============================================================

// ⚠️ عدّل هاد المعلومات بالمعلومات الحقيقية ديال الحساب البنكي
const RH_PAYMENT_BANK_NAME = 'Attijariwafa Bank';
const RH_PAYMENT_ACCOUNT_NUMBER = '000 000 0000000000000000 00'; // <-- بدّل برقم الحساب الحقيقي (RIB)
const RH_PAYMENT_ACCOUNT_HOLDER = 'RIHANIO AUTO-ÉCOLE SARL';      // <-- بدّل باسم صاحب الحساب الحقيقي

// عدد أيام مهلة السماح بعد انتهاء الاشتراك، قبل ما يتبلوكا الحساب بالكامل
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

    .rh-gate-pay-form{text-align:right;direction:rtl;}
    .rh-gate-bank-info{
      background:var(--surface-2,#F7F8FD);border:1px solid var(--border,#EBECF7);border-radius:14px;padding:14px 16px;margin-bottom:16px;
    }
    .rh-gate-bank-row{display:flex;align-items:center;justify-content:space-between;padding:7px 0;font-size:12.5px;gap:10px;}
    .rh-gate-bank-row + .rh-gate-bank-row{border-top:1px dashed var(--border,#EBECF7);}
    .rh-gate-bank-row span{color:var(--ink-soft,#6E7191);flex-shrink:0;}
    .rh-gate-bank-val{display:flex;align-items:center;gap:6px;min-width:0;}
    .rh-gate-bank-val b{color:var(--ink,#171933);font-family:'Plus Jakarta Sans',sans-serif;direction:ltr;unicode-bidi:embed;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .rh-gate-bank-row.motif b{color:var(--primary,#5B62F4);font-weight:800;}
    .rh-gate-copy-btn{
      width:26px;height:26px;border-radius:8px;border:1px solid var(--border,#EBECF7);background:var(--surface,#fff);
      color:var(--ink-pale,#A6A9C8);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;
    }
    .rh-gate-copy-btn:hover{color:var(--primary,#5B62F4);border-color:var(--primary,#5B62F4);}
    .rh-gate-copy-btn.copied{color:var(--available,#18B368);border-color:var(--available,#18B368);}
    .rh-gate-copy-btn svg{width:13px;height:13px;}
    .rh-gate-field{margin-bottom:12px;text-align:right;}
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
 * يتحقق من حالة اشتراك الشركة، وإلا كانت موقوفة أو ماشي فعالة، كيبلوكي الصفحة كاملة.
 */
async function checkAccountAccess(profile) {
  if (!profile || profile.role === 'super_admin' || !profile.company_id) return;

  const { data: company, error } = await supabaseClient
    .from('companies')
    .select('id, name, subscription_start_date, subscription_duration_days, is_suspended, payment_code')
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

  if (blocked) showAccessGate(profile, company);
}

function showAccessGate(profile, company) {
  if (document.querySelector('.rh-gate-overlay')) return; // ما تكررش النافدة

  const paymentCode = (company && company.payment_code) || '—';

  document.documentElement.style.overflow = 'hidden';

  const overlay = document.createElement('div');
  overlay.className = 'rh-gate-overlay';
  overlay.innerHTML = `
    <div class="rh-gate-card">
      <div class="rh-gate-icon"><i data-lucide="lock"></i></div>
      <h2>تم انتهاء صلاحية اشتراككم</h2>
      <p>لإعادة تفعيل الحساب، يمكنكم دفع الاشتراك عبر الحساب البنكي أسفله وإرسال إثبات الأداء، وسيتم تفعيل الحساب من طرف الإدارة بعد التحقق.</p>

      <div class="rh-gate-actions" id="rhGateStep1">
        <button type="button" class="rh-gate-btn-pay" id="rhGatePayBtn"><i data-lucide="credit-card"></i>دفع الاشتراك</button>
        <button type="button" class="rh-gate-btn-logout" id="rhGateLogoutBtn">تسجيل الخروج</button>
      </div>

      <form class="rh-gate-pay-form" id="rhGatePayForm" style="display:none;">
        <div class="rh-gate-bank-info">
          <div class="rh-gate-bank-row">
            <span>البنك</span>
            <div class="rh-gate-bank-val"><b>${RH_PAYMENT_BANK_NAME}</b><button type="button" class="rh-gate-copy-btn" data-copy="${RH_PAYMENT_BANK_NAME}" title="نسخ"><i data-lucide="copy"></i></button></div>
          </div>
          <div class="rh-gate-bank-row">
            <span>رقم الحساب</span>
            <div class="rh-gate-bank-val"><b>${RH_PAYMENT_ACCOUNT_NUMBER}</b><button type="button" class="rh-gate-copy-btn" data-copy="${RH_PAYMENT_ACCOUNT_NUMBER}" title="نسخ"><i data-lucide="copy"></i></button></div>
          </div>
          <div class="rh-gate-bank-row">
            <span>الاسم</span>
            <div class="rh-gate-bank-val"><b>${RH_PAYMENT_ACCOUNT_HOLDER}</b><button type="button" class="rh-gate-copy-btn" data-copy="${RH_PAYMENT_ACCOUNT_HOLDER}" title="نسخ"><i data-lucide="copy"></i></button></div>
          </div>
          <div class="rh-gate-bank-row motif">
            <span>Motif</span>
            <div class="rh-gate-bank-val"><b>${paymentCode}</b><button type="button" class="rh-gate-copy-btn" data-copy="${paymentCode}" title="نسخ"><i data-lucide="copy"></i></button></div>
          </div>
        </div>
        <p style="font-size:11px;color:var(--ink-soft,#6E7191);margin:-8px 0 14px;line-height:1.7;">⚠️ كتبو "Motif: ${paymentCode}" فالتحويل البنكي باش نقدرو نتعرفو على الأداء ديالكم بسرعة.</p>
        <div class="rh-gate-field">
          <label>صورة إثبات الأداء *</label>
          <input type="file" accept="image/*" id="rhGateProofFile" required>
        </div>
        <div class="rh-gate-field">
          <label>ملاحظة (اختياري)</label>
          <textarea id="rhGateNote" rows="2" placeholder="مثال: رقم العملية، التاريخ..."></textarea>
        </div>
        <div class="rh-gate-msg" id="rhGateMsg"></div>
        <div class="rh-gate-form-actions">
          <button type="button" class="rh-gate-btn-back" id="rhGateBackBtn">رجوع</button>
          <button type="submit" class="rh-gate-btn-confirm" id="rhGateConfirmBtn"><i data-lucide="check"></i>موافقة</button>
        </div>
      </form>

      <div class="rh-gate-success" id="rhGateSuccess" style="display:none;">
        <i data-lucide="check-circle-2"></i>
        <p>تم إرسال طلبكم بنجاح.<br>سيتم تفعيل الاشتراك بعد التحقق من الإدارة.</p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  if (window.lucide) lucide.createIcons();
  requestAnimationFrame(() => overlay.classList.add('open'));

  overlay.querySelectorAll('.rh-gate-copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy');
      if (!text || text === '—') return;
      try {
        await navigator.clipboard.writeText(text);
        const original = btn.innerHTML;
        btn.classList.add('copied');
        btn.innerHTML = '<i data-lucide="check"></i>';
        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = original;
          if (window.lucide) lucide.createIcons();
        }, 1400);
      } catch (err) {
        alert('ماقدرش يتنسخ، نسخو يدويا: ' + text);
      }
    });
  });

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
      msg.textContent = 'خاصك تزيد صورة إثبات الأداء';
      return;
    }

    btn.disabled = true;
    btn.innerHTML = 'جاري الإرسال...';

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
      msg.textContent = err.message || 'حدث خطأ، حاول مرة أخرى';
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check"></i>موافقة';
      if (window.lucide) lucide.createIcons();
    }
  });
}
