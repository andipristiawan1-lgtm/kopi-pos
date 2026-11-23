import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/auth/me"
      : "/api/auth/me";
    fetch(apiUrl)
      .then((res) => {
        if (res.ok) setIsAuthenticated(true);
        else setIsAuthenticated(false);
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null)
    return <div className="p-10 text-center">Memeriksa sesi...</div>;
  if (isAuthenticated === false) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
