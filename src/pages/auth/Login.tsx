import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/auth/login"
      : "/api/auth/login";

    try {
      setIsSubmitting(true);
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Login gagal");

      // Redirect ke POS setelah login sukses
      window.location.href = "/pos";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-coffee-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border-t-4 border-coffee-500">
        <h2 className="text-2xl font-bold text-coffee-900 mb-6 text-center">
          Login Kasir
        </h2>
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-2 rounded">
            {error}
          </p>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-coffee-900 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-coffee-900 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-coffee-500 text-white py-3 rounded-lg font-bold hover:bg-coffee-700 transition"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sedang masuk..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
