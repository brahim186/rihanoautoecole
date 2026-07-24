// ============================================================
// RIHANIO — Cloche de notifications + rappel d'expiration d'abonnement
// À inclure sur chaque page protégée, JUSTE APRÈS rihanio-config.js
// Utilisation (dans le .then(profile => { ... }) après requireAuth()) :
//     if (!profile) return;
//     initNotificationsBell(profile);
//     checkSubscriptionExpiryPopup(profile);
// ============================================================

(function injectNotifStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .rh-notif-dot{
      position:absolute;top:6px;right:6px;min-width:16px;height:16px;padding:0 3px;
      border-radius:50%;background:var(--danger,#F0473F);color:#fff;font-size:9.5px;font-weight:800;
      display:none;align-items:center;justify-content:center;border:2px solid var(--surface,#fff);
      font-family:'Inter',sans-serif;line-height:1;z-index:1;
    }
    .rh-notif-panel{
      position:fixed;width:360px;max-width:calc(100vw - 24px);max-height:460px;
      background:var(--surface,#fff);border:1px solid var(--border,#EBECF7);border-radius:18px;
      box-shadow:0 24px 48px -16px rgba(15,16,35,.35);z-index:500;
      opacity:0;visibility:hidden;transform:translateY(-8px);
      transition:opacity .15s ease,transform .15s ease,visibility .15s;
      overflow:hidden;display:flex;flex-direction:column;
    }
    .rh-notif-panel.open{opacity:1;visibility:visible;transform:translateY(0);}
    .rh-notif-panel-head{
      display:flex;align-items:center;justify-content:space-between;padding:15px 18px;
      border-bottom:1px solid var(--border,#EBECF7);flex-shrink:0;
    }
    .rh-notif-panel-head span{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:14px;color:var(--ink,#171933);}
    .rh-notif-mark-all{background:none;border:none;color:var(--primary,#5B62F4);font-size:11.5px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;}
    .rh-notif-mark-all:hover{text-decoration:underline;}
    .rh-notif-panel-list{overflow-y:auto;}
    .rh-notif-empty{padding:34px 18px;text-align:center;color:var(--ink-pale,#A6A9C8);font-size:12.5px;}
    .rh-notif-item{display:flex;gap:11px;padding:13px 18px;border-bottom:1px solid var(--border,#EBECF7);cursor:pointer;}
    .rh-notif-item:last-child{border-bottom:none;}
    .rh-notif-item:hover{background:var(--surface-2,#F7F8FD);}
    .rh-notif-item.unread{background:var(--primary-soft,rgba(91,98,244,.07));}
    .rh-notif-item-icon{
      width:34px;height:34px;border-radius:10px;background:var(--primary-soft,#EEEEFE);color:var(--primary,#5B62F4);
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    .rh-notif-item-icon svg{width:16px;height:16px;}
    .rh-notif-item-body{min-width:0;flex:1;}
    .rh-notif-item-title-row{display:flex;align-items:center;gap:6px;}
    .rh-notif-item-dot-mark{width:7px;height:7px;border-radius:50%;background:var(--primary,#5B62F4);flex-shrink:0;}
    .rh-notif-item-title{font-size:12.5px;font-weight:700;color:var(--ink,#171933);}
    .rh-notif-item-msg{font-size:11.5px;color:var(--ink-soft,#6E7191);margin-top:3px;line-height:1.5;word-break:break-word;}
    .rh-notif-item-time{font-size:10.5px;color:var(--ink-pale,#A6A9C8);margin-top:6px;}

    .rh-sub-reminder-overlay{
      position:fixed;inset:0;background:rgba(15,16,35,.55);display:flex;align-items:center;justify-content:center;
      z-index:1000;padding:20px;opacity:0;transition:opacity .2s ease;
    }
    .rh-sub-reminder-overlay.open{opacity:1;}
    .rh-sub-reminder-card{
      background:var(--surface,#fff);border-radius:22px;padding:32px 26px;max-width:380px;width:100%;
      text-align:center;box-shadow:0 30px 60px -20px rgba(0,0,0,.4);transform:scale(.95);transition:transform .2s ease;
    }
    .rh-sub-reminder-overlay.open .rh-sub-reminder-card{transform:scale(1);}
    .rh-sub-reminder-icon{
      width:56px;height:56px;border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;
      background:var(--maintenance-soft,#FDF1DD);color:#B5720B;
    }
    .rh-sub-reminder-card.danger .rh-sub-reminder-icon{background:var(--danger-soft,#FDECEB);color:var(--danger,#F0473F);}
    .rh-sub-reminder-icon svg{width:26px;height:26px;}
    .rh-sub-reminder-card h3{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:16.5px;color:var(--ink,#171933);margin-bottom:8px;}
    .rh-sub-reminder-card p{font-size:12.5px;color:var(--ink-soft,#6E7191);line-height:1.7;margin-bottom:22px;}
    .rh-sub-reminder-close{
      background:linear-gradient(135deg,var(--primary,#5B62F4),var(--primary-2,#8B6FF2));color:#fff;border:none;
      font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13.5px;padding:12px 26px;border-radius:12px;cursor:pointer;
    }
  `;
  document.head.appendChild(style);
})();

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str == null ? '' : String(str);
  return d.innerHTML;
}

function notifTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} س`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `منذ ${days} ي`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

/**
 * Active la cloche de notifications sur la page en cours.
 * Recherche le bouton .icon-btn[title="Notifications"] déjà présent dans le topbar.
 */
async function initNotificationsBell(profile) {
  const bellBtn = document.querySelector('.icon-btn[title="Notifications"]');
  if (!bellBtn || !profile) return;

  bellBtn.style.position = 'relative';
  let dot = bellBtn.querySelector('.rh-notif-dot');
  if (dot) dot.remove(); // enlève l'ancien point statique éventuel
  dot = document.createElement('span');
  dot.className = 'rh-notif-dot';
  bellBtn.appendChild(dot);

  const { data: { session } } = await supabaseClient.auth.getSession();
  const userId = session && session.user ? session.user.id : null;

  const panel = document.createElement('div');
  panel.className = 'rh-notif-panel';
  panel.innerHTML = `
    <div class="rh-notif-panel-head">
      <span>Notifications</span>
      <button type="button" class="rh-notif-mark-all">Tout marquer comme lu</button>
    </div>
    <div class="rh-notif-panel-list"><div class="rh-notif-empty">جاري التحميل...</div></div>
  `;
  document.body.appendChild(panel);

  let notifications = [];
  let readIds = new Set();

  async function loadReadIds() {
    if (!userId) return;
    const { data } = await supabaseClient
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', userId);
    readIds = new Set((data || []).map(r => r.notification_id));
  }

  async function loadNotifications() {
    const companyId = profile.company_id;
    let query = supabaseClient.from('notifications').select('*').order('created_at', { ascending: false }).limit(30);
    query = companyId ? query.or(`company_id.eq.${companyId},company_id.is.null`) : query.is('company_id', null);
    const { data, error } = await query;
    notifications = error ? [] : (data || []);
  }

  function updateDot() {
    const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;
    if (unreadCount > 0) {
      dot.style.display = 'flex';
      dot.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
    } else {
      dot.style.display = 'none';
    }
  }

  function render() {
    const list = panel.querySelector('.rh-notif-panel-list');
    if (!notifications.length) {
      list.innerHTML = '<div class="rh-notif-empty">لا توجد إشعارات حاليا</div>';
      updateDot();
      return;
    }
    list.innerHTML = notifications.map(n => {
      const unread = !readIds.has(n.id);
      const icon = n.company_id ? 'user' : 'megaphone';
      return `
        <div class="rh-notif-item ${unread ? 'unread' : ''}" data-id="${n.id}">
          <div class="rh-notif-item-icon"><i data-lucide="${icon}"></i></div>
          <div class="rh-notif-item-body">
            <div class="rh-notif-item-title-row">
              ${unread ? '<span class="rh-notif-item-dot-mark"></span>' : ''}
              <span class="rh-notif-item-title">${escapeHtml(n.title)}</span>
            </div>
            <div class="rh-notif-item-msg">${escapeHtml(n.message)}</div>
            <div class="rh-notif-item-time">${notifTimeAgo(n.created_at)}</div>
          </div>
        </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
    updateDot();
  }

  async function markRead(id) {
    if (!userId || readIds.has(id)) return;
    readIds.add(id);
    render();
    await supabaseClient.from('notification_reads').upsert(
      { notification_id: id, user_id: userId },
      { onConflict: 'notification_id,user_id' }
    );
  }

  panel.addEventListener('click', (e) => {
    const item = e.target.closest('.rh-notif-item');
    if (item) markRead(item.dataset.id);
  });

  panel.querySelector('.rh-notif-mark-all').addEventListener('click', async () => {
    const unreadIds = notifications.filter(n => !readIds.has(n.id)).map(n => n.id);
    if (!unreadIds.length) return;
    unreadIds.forEach(id => readIds.add(id));
    render();
    if (userId) {
      await supabaseClient.from('notification_reads').upsert(
        unreadIds.map(id => ({ notification_id: id, user_id: userId })),
        { onConflict: 'notification_id,user_id' }
      );
    }
  });

  function positionPanel() {
    const rect = bellBtn.getBoundingClientRect();
    panel.style.top = (rect.bottom + 10) + 'px';
    let left = rect.right - 360;
    if (left < 12) left = 12;
    const maxLeft = window.innerWidth - 360 - 12;
    if (left > maxLeft) left = maxLeft;
    panel.style.left = left + 'px';
  }

  let isOpen = false;
  async function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    positionPanel();
    await Promise.all([loadNotifications(), loadReadIds()]);
    render();
  }
  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
  }

  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen) closePanel(); else openPanel();
  });
  document.addEventListener('click', (e) => {
    if (isOpen && !panel.contains(e.target) && e.target !== bellBtn) closePanel();
  });
  document.addEventListener('scroll', () => { if (isOpen) positionPanel(); }, true);
  window.addEventListener('resize', () => { if (isOpen) positionPanel(); });

  // Vérifie s'il y a des non-lus dès le chargement de la page (pour le badge)
  await Promise.all([loadNotifications(), loadReadIds()]);
  updateDot();
}

/**
 * Affiche, une seule fois par jour et par entreprise, une pop-up indiquant
 * le nombre de jours restants avant la fin de l'abonnement.
 */
async function checkSubscriptionExpiryPopup(profile) {
  if (!profile || profile.role === 'super_admin' || !profile.company_id) return;

  const { data: company, error } = await supabaseClient
    .from('companies')
    .select('subscription_start_date, subscription_duration_days, is_suspended')
    .eq('id', profile.company_id)
    .single();
  if (error || !company || !company.subscription_start_date || company.is_suspended) return;

  const start = new Date(company.subscription_start_date);
  const end = new Date(start);
  end.setDate(end.getDate() + (company.subscription_duration_days || 30));
  const now = new Date();
  const daysLeft = Math.ceil((end - now) / 86400000);

  const THRESHOLD_DAYS = 7; // على قد ما يبان التنبيه
  if (daysLeft > THRESHOLD_DAYS) return;

  const todayKey = now.toISOString().split('T')[0];
  const storageKey = `rihanio_sub_popup_${profile.company_id}_${todayKey}`;
  if (localStorage.getItem(storageKey)) return;
  localStorage.setItem(storageKey, '1');

  showSubscriptionReminderModal(daysLeft);
}

function showSubscriptionReminderModal(daysLeft) {
  const overlay = document.createElement('div');
  overlay.className = 'rh-sub-reminder-overlay';

  let headline, tone;
  if (daysLeft > 1) {
    headline = `باقي ${daysLeft} أيام على انتهاء الاشتراك`;
    tone = 'warn';
  } else if (daysLeft === 1) {
    headline = 'باقي غير يوم واحد على انتهاء الاشتراك';
    tone = 'warn';
  } else if (daysLeft === 0) {
    headline = 'اليوم هو آخر يوم فالاشتراك ديالك';
    tone = 'danger';
  } else {
    headline = 'الاشتراك ديالك سالا، راك دابا فمهلة السماح';
    tone = 'danger';
  }
  const sub = 'تواصل مع الإدارة باش تجدد الاشتراك وما يتوقفش الوصول للمنصة.';

  overlay.innerHTML = `
    <div class="rh-sub-reminder-card ${tone}">
      <div class="rh-sub-reminder-icon"><i data-lucide="${tone === 'danger' ? 'alert-triangle' : 'clock-alert'}"></i></div>
      <h3>${headline}</h3>
      <p>${sub}</p>
      <button type="button" class="rh-sub-reminder-close">فهمت</button>
    </div>`;
  document.body.appendChild(overlay);
  if (window.lucide) lucide.createIcons();
  requestAnimationFrame(() => overlay.classList.add('open'));

  overlay.querySelector('.rh-sub-reminder-close').addEventListener('click', () => {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 200);
  });
}
