"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const SiteContext = createContext(undefined);

export function SiteProvider({ children, storageKey = "selectedSite" }) {
  const [selectedSite, setSelectedSiteState] = useState("thailand");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    const valid = ["thailand", "korea", "vietnam", "malaysia"];
    if (saved && valid.includes(saved)) {
      setSelectedSiteState(saved);
    }
    setMounted(true);
  }, [storageKey]);

  const setSelectedSite = useCallback((site) => {
    setSelectedSiteState(site);
    try {
      localStorage.setItem(storageKey, site);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const activeSite = mounted ? selectedSite : "thailand";

  return (
    <SiteContext.Provider value={{ selectedSite: activeSite, setSelectedSite }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  return context ?? { selectedSite: 'thailand', setSelectedSite: (_) => {} };
}
