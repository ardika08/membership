<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>Invoice {{ $transaction->invoice_number }} — Grafista Digital</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
    background: #0b0d12;
    color: #e7eaf0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    -webkit-font-smoothing: antialiased;
  }
  .card {
    width: 100%;
    max-width: 420px;
    background: #141821;
    border: 1px solid #232936;
    border-radius: 20px;
    padding: 32px 28px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    letter-spacing: -0.02em;
    font-size: 15px;
  }
  .brand .logo {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
  .badge {
    margin-left: auto;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #fbbf24;
    background: rgba(251, 191, 36, 0.12);
    border: 1px solid rgba(251, 191, 36, 0.25);
    padding: 4px 8px;
    border-radius: 999px;
  }
  h1 { font-size: 20px; margin-top: 24px; letter-spacing: -0.02em; }
  .muted { color: #8a93a6; font-size: 13px; line-height: 1.5; }
  .detail {
    margin-top: 20px;
    background: #0f131b;
    border: 1px solid #232936;
    border-radius: 14px;
    padding: 18px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    padding: 7px 0;
  }
  .row + .row { border-top: 1px dashed #232936; }
  .row span:first-child { color: #8a93a6; }
  .row span:last-child { font-weight: 600; text-align: right; }
  .amount {
    margin-top: 20px;
    text-align: center;
    padding: 20px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(99, 102, 241, 0.10));
    border: 1px solid rgba(139, 92, 246, 0.25);
  }
  .amount .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8a93a6; }
  .amount .value { font-size: 30px; font-weight: 700; letter-spacing: -0.03em; margin-top: 6px; }
  .status {
    margin-top: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
  }
  .spinner {
    width: 18px;
    height: 18px;
    border: 3px solid #2b3245;
    border-top-color: #8b5cf6;
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .status.paid { color: #34d399; }
  .status.expired { color: #f87171; }
  .status.pending { color: #c7cdd9; }
  .check {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    background: rgba(52, 211, 153, 0.15);
    color: #34d399;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 700;
    margin: 18px auto 0;
  }
  .hidden { display: none; }
  .btn {
    display: block;
    margin-top: 22px;
    width: 100%;
    padding: 13px;
    border-radius: 12px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    text-decoration: none;
    font-family: inherit;
  }
  .btn-primary {
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    color: #fff;
  }
  .btn-ghost {
    background: transparent;
    border: 1px solid #2b3245;
    color: #c7cdd9;
  }
  .footer {
    margin-top: 20px;
    text-align: center;
    font-size: 11px;
    color: #5b6373;
    line-height: 1.6;
  }
</style>
</head>
<body>
<div class="card">
  <div class="brand">
    <div class="logo">✦</div>
    Grafista Digital
    <span class="badge">Sandbox</span>
  </div>

  <h1>Invoice {{ $transaction->invoice_number }}</h1>
  <p class="muted">Halaman simulasi pembayaran Mayar untuk keperluan development. Invoice ini dikonfirmasi otomatis 15 detik setelah dibuat.</p>

  <div class="detail">
    <div class="row"><span>Produk</span><span>{{ $transaction->product->title }}</span></div>
    <div class="row"><span>Pembeli</span><span>{{ $transaction->user->name }}</span></div>
    <div class="row"><span>Metode</span><span>QRIS (simulasi)</span></div>
  </div>

  <div class="amount">
    <div class="label">Total pembayaran</div>
    <div class="value">Rp {{ number_format($transaction->amount, 0, ',', '.') }}</div>
  </div>

  <div id="status-pending" class="status pending">
    <div class="spinner"></div>
    Menunggu konfirmasi pembayaran…
  </div>

  <div id="status-paid" class="hidden">
    <div class="check">✓</div>
    <div class="status paid">Pembayaran berhasil</div>
  </div>

  <div id="status-expired" class="hidden">
    <div class="status expired">Invoice kedaluwarsa</div>
  </div>

  @if ($transaction->status === 'paid')
    <a class="btn btn-primary" href="{{ $frontendUrl }}/transactions">Kembali ke aplikasi</a>
  @else
    <a class="btn btn-ghost" href="{{ $frontendUrl }}/transactions">Kembali ke aplikasi</a>
  @endif

  <p class="footer">Simulasi berjalan di driver <code>sandbox</code>. Saat produksi, halaman ini digantikan invoice asli Mayar dan konfirmasi dikirim via webhook.</p>
</div>

<script>
  (function () {
    var pending = document.getElementById('status-pending');
    var paid = document.getElementById('status-paid');
    var expired = document.getElementById('status-expired');

    if ('{{ $transaction->status }}' === 'paid') { showPaid(); return; }
    if ('{{ $transaction->status }}' === 'expired') { showExpired(); return; }

    var timer = setInterval(poll, 3000);
    poll();

    function poll() {
      fetch('/pay-sandbox/{{ $transaction->invoice_number }}/status', { headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.status === 'paid') { clearInterval(timer); showPaid(); }
          else if (data.status === 'expired') { clearInterval(timer); showExpired(); }
        })
        .catch(function () {});
    }

    function showPaid() {
      pending.classList.add('hidden');
      paid.classList.remove('hidden');
      setTimeout(function () { window.location.href = '{{ $frontendUrl }}/transactions'; }, 2500);
    }

    function showExpired() {
      pending.classList.add('hidden');
      expired.classList.remove('hidden');
    }
  })();
</script>
</body>
</html>
