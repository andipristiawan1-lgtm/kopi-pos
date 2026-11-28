<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test RawBT</title>
</head>
<body style="font-family:sans-serif;padding:20px;">
  <h2>Test Cetak RawBT</h2>

  <button id="btn1" style="padding:15px;font-size:16px;margin:5px;width:100%;">
    1. Buka RawBT (Intent Kosong)
  </button>

  <button id="btn2" style="padding:15px;font-size:16px;margin:5px;width:100%;">
    2. Cetak Teks Sederhana
  </button>

  <button id="btn3" style="padding:15px;font-size:16px;margin:5px;width:100%;">
    3. Cetak Struk Lengkap
  </button>

  <pre id="log" style="background:#f0f0f0;padding:10px;margin-top:20px;font-size:11px;white-space:pre-wrap;"></pre>

  <script>
    const log = (msg) => {
      document.getElementById('log').textContent += msg + "\n";
    };

    // Tombol 1: Buka aplikasi saja, tanpa data
    document.getElementById('btn1').onclick = () => {
      log("Membuka RawBT...");
      window.location.href =
        "intent:#Intent;package=ru.a402d.rawbtprinter;end";
    };

    // Tombol 2: Cetak teks sederhana
    document.getElementById('btn2').onclick = () => {
      const text = "<110><1>TEST PRINT<0>\n<10>Halo dari Chrome\n\n\n\n";
      const encoded = encodeURIComponent(text);
      const url = `intent:${encoded}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
      log("Kirim: " + url.substring(0, 80) + "...");
      window.location.href = url;
    };

    // Tombol 3: Struk lengkap
    document.getElementById('btn3').onclick = () => {
      let str = "";
      str += "<11><1>HOTEL BELITANG<0>\n";
      str += "<11>Jl. Raya Belitang No. 123\n";
      str += "<11>--------------------------------\n";
      str += "<10>No  : TEST-001\n";
      str += "<10>Tgl : " + new Date().toLocaleString("id-ID") + "\n";
      str += "<11>--------------------------------\n";
      str += "<10>1x Nasi Goreng\n";
      str += "<12>    Rp 25.000\n";
      str += "<10>2x Es Teh\n";
      str += "<12>    Rp 10.000\n";
      str += "<11>--------------------------------\n";
      str += "<10><1>TOTAL: Rp 35.000<0>\n";
      str += "<11>Terima Kasih\n\n\n\n";

      const encoded = encodeURIComponent(str);
      const url = `intent:${encoded}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
      log("Mengirim struk...");
      window.location.href = url;
    };

    log("User Agent: " + navigator.userAgent);
    log("Android? " + /Android/i.test(navigator.userAgent));
    log("HTTPS? " + location.protocol);
  </script>
</body>
</html>