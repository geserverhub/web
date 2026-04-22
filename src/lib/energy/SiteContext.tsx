"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Site = "thailand" | "korea" | "vietnam" | "malaysia";

interface SiteContextType {
  selectedSite: Site;
  setSelectedSite: (site: Site) => void;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [selectedSite, setSelectedSiteState] = useState<Site>("thailand");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("selectedSite") as Site;
    const valid: Site[] = ["thailand", "korea", "vietnam", "malaysia"];
    if (saved && valid.includes(saved)) {
      setSelectedSiteState(saved);
    }
    setMounted(true);
  }, []);

  const setSelectedSite = (site: Site) => {
    setSelectedSiteState(site);
    localStorage.setItem("selectedSite", site);
  };

  // Use default "thailand" during SSR and first client render to prevent hydration mismatch
  const activeSite = mounted ? selectedSite : "thailand";

  return (
    <SiteContext.Provider value={{ selectedSite: activeSite, setSelectedSite }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  return context ?? { selectedSite: 'thailand' as Site, setSelectedSite: (_: Site) => {} };
}
