"use client";

import { useState, useEffect } from "react";

type LogEntry = { time: string; msg: string };

export default function TestPrintPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [env, setEnv] = useState({
    isAndroid: false,
    isHttps: false,
    isWebView: false,
    userAgent: "",
  });

  // Cek environment saat halaman dimuat
  useEffect(() => {
    const ua = navigator.userAgent;
    setEnv({
      isAndroid: /Android/i.test(ua),
      isHttps: location.protocol === "https:" || location.hostname === "localhost",
      isWebView: /; wv\)/i.test(ua) || /WebView/i.test(ua),
      userAgent: ua,
    });
  }, []);

  const log = (msg: string) => {
    const time = new Date().toLocaleTimeString("id-ID");
    setLogs((prev) => [...prev, { time, msg }]);
  };

  const openIntent = (url: string, label: string) => {
    log(`▶ ${label}`);
    log(`  URL: ${url.length > 120 ? url.substring(0, 120) + "..." : url}`);
    try {
      window.location.href = url;
      log(`  ✅ Intent dipicu`);
    } catch (e: any) {
      log(`  ❌ Gagal: ${e?.message || e}`);
    }
  };

  // ============================================================
  // RAWBT
  // ============================================================
  const testRawBT_Open = () => {
    openIntent(
      "intent:#Intent;package=ru.a402d.rawbtprinter;end",
      "RawBT: Buka aplikasi saja"
    );
  };

  const testRawBT_Simple = () => {
    const text = "<11><1>TEST PRINT<0>\n<10>Halo dari Chrome\n\n\n\n";
    const url = `intent:${encodeURIComponent(text)}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
    openIntent(url, "RawBT: Cetak teks sederhana");
  };

  const testRawBT_Full = () => {
    let str = "";
    str += "<11><1>HOTEL BELITANG<0>\n";
    str += "<11>Jl. Raya Belitang No. 123\n";
    str += "<11>--------------------------------\n";
    str += "<10>No  : TEST-001\n";
    str += `<10>Tgl : ${new Date().toLocaleString("id-ID")}\n`;
    str += "<11>--------------------------------\n";
    str += "<10>1x Nasi Goreng\n";
    str += "<12>    Rp 25.000\n";
    str += "<10>2x Es Teh\n";
    str += "<12>    Rp 10.000\n";
    str += "<11>--------------------------------\n";
    str += "<10><1>TOTAL: Rp 35.000<0>\n";
    str += "<11>Terima Kasih\n\n\n\n";

    const url = `intent:${encodeURIComponent(str)}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
    openIntent(url, "RawBT: Cetak struk lengkap");
  };

  // ============================================================
  // BLUETOOTH PRINT (mate.bluetoothprint)
  // ============================================================
  const testBP_Open = () => {
    openIntent(
      "intent:#Intent;package=mate.bluetoothprint;end",
      "Bluetooth Print: Buka aplikasi saja"
    );
  };

  const testBP_Simple = () => {
    const text = "<112>TEST PRINT\n<010>Halo dari Chrome\n\n\n\n";
    const url =
      "intent:#Intent;" +
      "action=android.intent.action.SEND;" +
      "type=text/plain;" +
      "package=mate.bluetoothprint;" +
      `S.android.intent.extra.TEXT=${encodeURIComponent(text)};` +
      "end;";
    openIntent(url, "Bluetooth Print: Cetak teks sederhana");
  };

  const testBP_Full = () => {
    let str = "";
    str += "<112>HOTEL BELITANG\n";
    str += "<010>Jl. Raya Belitang No. 123\n";
    str += "<010>--------------------------------\n";
    str += "<000>No  : TEST-001\n";
    str += `<000>Tgl : ${new Date().toLocaleString("id-ID")}\n`;
    str += "<010>--------------------------------\n";
    str += "<100>1x Nasi Goreng\n";
    str += "<020>    Rp 25.000\n";
    str += "<100>2x Es Teh\n";
    str += "<020>    Rp 10.000\n";
    str += "<010>--------------------------------\n";
    str += "<112>TOTAL: Rp 35.000\n";
    str += "<010>Terima Kasih\n\n\n\n";

    const url =
      "intent:#Intent;" +
      "action=android.intent.action.SEND;" +
      "type=text/plain;" +
      "package=mate.bluetoothprint;" +
      `S.android.intent.extra.TEXT=${encodeURIComponent(str)};` +
      "end;";
    openIntent(url, "Bluetooth Print: Cetak struk lengkap");
  };

  // ============================================================
  // RENDER
  // ============================================================
  const statusColor = (ok: boolean) =>
    ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">
          🧪 Test Cetak Thermal
        </h1>

        {/* ---------- STATUS ENVIRONMENT ---------- */}
        <div className="bg-white rounded-lg shadow p-4 space-y-2 text-sm">
          <h2 className="font-bold text-gray-700 mb-2">Status Environment</h2>
          <div className="flex justify-between">
            <span>Android</span>
            <span className={`px-2 py-0.5 rounded font-mono text-xs ${statusColor(env.isAndroid)}`}>
              {env.isAndroid ? "✅ YA" : "❌ TIDAK"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>HTTPS / Localhost</span>
            <span className={`px-2 py-0.5 rounded font-mono text-xs ${statusColor(env.isHttps)}`}>
              {env.isHttps ? "✅ YA" : "❌ TIDAK"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Bukan WebView</span>
            <span className={`px-2 py-0.5 rounded font-mono text-xs ${statusColor(!env.isWebView)}`}>
              {env.isWebView ? "❌ WebView" : "✅ Chrome"}
            </span>
          </div>
          <details className="text-xs text-gray-500 pt-2">
            <summary className="cursor-pointer">User Agent</summary>
            <p className="mt-1 break-all font-mono">{env.userAgent}</p>
          </details>
        </div>

        {/* ---------- PERINGATAN ---------- */}
        {(!env.isAndroid || env.isWebView) && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded p-3 text-sm">
            ⚠️{" "}
            {!env.isAndroid
              ? "Anda tidak membuka dari Android. Fitur cetak tidak akan berfungsi."
              : "Anda membuka dari in-app browser (WebView). Buka di Chrome Android asli."}
          </div>
        )}

        {/* ---------- RAWBT ---------- */}
        <div className="bg-white rounded-lg shadow p-4 space-y-2">
          <h2 className="font-bold text-gray-700">
            🖨️ RawBT <span className="text-xs font-normal text-gray-400">(ru.a402d.rawbtprinter)</span>
          </h2>
          <button
            onClick={testRawBT_Open}
            className="w-full py-3 bg-blue-500 text-white rounded font-bold hover:bg-blue-600"
          >
            1. Buka RawBT (test intent dasar)
          </button>
          <button
            onClick={testRawBT_Simple}
            className="w-full py-3 bg-blue-500 text-white rounded font-bold hover:bg-blue-600"
          >
            2. Cetak Teks Sederhana
          </button>
          <button
            onClick={testRawBT_Full}
            className="w-full py-3 bg-blue-500 text-white rounded font-bold hover:bg-blue-600"
          >
            3. Cetak Struk Lengkap
          </button>
        </div>

        {/* ---------- BLUETOOTH PRINT ---------- */}
        <div className="bg-white rounded-lg shadow p-4 space-y-2">
          <h2 className="font-bold text-gray-700">
            🖨️ Bluetooth Print <span className="text-xs font-normal text-gray-400">(mate.bluetoothprint)</span>
          </h2>
          <button
            onClick={testBP_Open}
            className="w-full py-3 bg-green-500 text-white rounded font-bold hover:bg-green-600"
          >
            1. Buka App (test intent dasar)
          </button>
          <button
            onClick={testBP_Simple}
            className="w-full py-3 bg-green-500 text-white rounded font-bold hover:bg-green-600"
          >
            2. Cetak Teks Sederhana
          </button>
          <button
            onClick={testBP_Full}
            className="w-full py-3 bg-green-500 text-white rounded font-bold hover:bg-green-600"
          >
            3. Cetak Struk Lengkap
          </button>
        </div>

        {/* ---------- LOG ---------- */}
        <div className="bg-black text-green-400 rounded-lg p-3 font-mono text-xs max-h-64 overflow-y-auto">
          <div className="flex justify-between mb-2 text-gray-400">
            <span>Log</span>
            <button
              onClick={() => setLogs([])}
              className="text-white bg-gray-700 px-2 py-0.5 rounded text-[10px]"
            >
              Clear
            </button>
          </div>
          {logs.length === 0 && <p className="text-gray-500">Belum ada aksi...</p>}
          {logs.map((l, i) => (
            <div key={i} className="whitespace-pre-wrap break-all">
              <span className="text-gray-500">[{l.time}]</span> {l.msg}
            </div>
          ))}
        </div>

        {/* ---------- PANDUAN ---------- */}
        <details className="bg-white rounded-lg shadow p-4 text-sm text-gray-700">
          <summary className="font-bold cursor-pointer">📖 Panduan Singkat</summary>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Install RawBT atau Bluetooth Print dari Play Store</li>
            <li>Pair printer lewat <b>Setelan Bluetooth HP</b></li>
            <li>Di aplikasi: Settings → pilih printer → Test Print</li>
            <li>
              Chrome → Setelan → Setelan Situs → <b>Buka Aplikasi</b> → aktifkan
            </li>
            <li>Buka halaman ini di Chrome Android (bukan in-app browser)</li>
            <li>
              Tekan <b>tombol 1</b> dulu — kalau aplikasi terbuka berarti intent OK
            </li>
            <li>Lanjut <b>tombol 2</b>, lalu <b>tombol 3</b></li>
          </ol>
        </details>
      </div>
    </div>
  );
}