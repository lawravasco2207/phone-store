import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../utils/api';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

// Import all ai-pages for Vite HMR; each file must default export a React component
const modules = import.meta.glob('../ai-pages/**/*.tsx');

type ManifestEntry = { routePath: string; file: string; title?: string };

export default function AIDynamicRoutes() {
  const [manifest, setManifest] = useState<ManifestEntry[]>([]);
  const location = useLocation();

  // Fetch manifest on load and when path changes (keeps it fresh without full reload)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Try backend API first for CORS-safe manifest
        let data: any = [];
        try {
          const apiRes = await fetch(`${API_BASE_URL}/ai/pages/manifest`, { cache: 'no-store', credentials: 'include' });
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            data = apiData?.data ?? [];
          }
        } catch {}
        if (!Array.isArray(data) || data.length === 0) {
          // Fallback to reading directly if dev server serves src
          const res = await fetch('/src/ai-pages/manifest.json', { cache: 'no-store' });
          if (res.ok) data = await res.json();
        }
        if (!cancelled) setManifest(Array.isArray(data) ? data : []);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [location.pathname]);

  // Map route to lazy-loaded component from modules
  const routes = useMemo(() => {
    return manifest.map((entry) => {
      // Build a module key relative to this file's glob pattern
      const key = `../ai-pages/${entry.file}`;
      const importer = modules[key] as (() => Promise<{ default: React.ComponentType<any> }>) | undefined;
      const Comp = React.lazy(importer || (async () => ({ default: () => <div>Page not found</div> })));
      return (
        <Route key={entry.routePath} path={entry.routePath} element={
          <Suspense fallback={<div>Loading page...</div>}>
            <Comp />
          </Suspense>
        } />
      );
    });
  }, [manifest]);

  if (manifest.length === 0) return null;

  return (
    <Routes>
      {routes}
      {/* Redirect /ai to first page if present */}
      <Route path="/ai" element={<Navigate to={manifest[0]?.routePath || '/'} replace />} />
    </Routes>
  );
}
