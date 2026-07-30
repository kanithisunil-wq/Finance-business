/* Renders the sidebar + wraps page content in the app shell. */

const ICONS = {
  customers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  balance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
};

function renderShell(activePage, contentHTML) {
  if (!requireSession()) return;
  const user = getUser();

  document.body.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="ledger-mark"><span class="dot"></span>Ledger</div>
        <nav>
          <a href="/home.html" class="${activePage === 'home' ? 'active' : ''}">${ICONS.home}Home</a>
          <a href="/customers.html" class="${activePage === 'customers' ? 'active' : ''}">${ICONS.customers}Customers</a>
          <a href="/calendar.html" class="${activePage === 'calendar' ? 'active' : ''}">${ICONS.calendar}Calendar</a>
          <a href="/balance.html" class="${activePage === 'balance' ? 'active' : ''}">${ICONS.balance}Balance</a>
        </nav>
        <div class="user-chip">
          <strong>${user ? escapeHtml(user.name) : ''}</strong>
          <a href="#" id="logoutBtn" style="display:flex;align-items:center;gap:6px;color:#C7D0CB;text-decoration:none;">${ICONS.logout} Log out</a>
        </div>
      </aside>
      <main class="main" id="mainContent">${contentHTML}</main>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    clearSession();
    window.location.href = '/index.html';
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
