import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Team, ContentModule } from '../types';
import { getAllTeams, getAllModules, saveTeam, saveModule, deleteTeam, deleteModule } from '../db/indexedDB';

interface AppContextValue {
  teams: Team[];
  modules: ContentModule[];
  isLoading: boolean;
  activeTeamId: string | null;
  setActiveTeamId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  addTeam: (team: Team) => Promise<void>;
  updateTeam: (team: Team) => Promise<void>;
  removeTeam: (id: string) => Promise<void>;
  addModule: (module: ContentModule, fileData?: ArrayBuffer) => Promise<void>;
  updateModule: (module: ContentModule) => Promise<void>;
  removeModule: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  getTeamModules: (teamId: string) => ContentModule[];
  getModuleCount: (teamId: string) => number;
}

const AppContext = createContext<AppContextValue>({} as AppContextValue);

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [modules, setModules] = useState<ContentModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const refreshData = useCallback(async () => {
    try {
      const [t, m] = await Promise.all([getAllTeams(), getAllModules()]);
      setTeams(t);
      setModules(m);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  const addTeam = useCallback(async (team: Team) => {
    await saveTeam(team);
    setTeams(prev => [...prev, team]);
  }, []);

  const updateTeam = useCallback(async (team: Team) => {
    await saveTeam(team);
    setTeams(prev => prev.map(t => t.id === team.id ? team : t));
  }, []);

  const removeTeam = useCallback(async (id: string) => {
    await deleteTeam(id);
    setTeams(prev => prev.filter(t => t.id !== id));
    setModules(prev => prev.filter(m => m.teamId !== id));
  }, []);

  const addModule = useCallback(async (module: ContentModule, fileData?: ArrayBuffer) => {
    await saveModule(module, fileData);
    setModules(prev => [...prev, module]);
  }, []);

  const updateModule = useCallback(async (module: ContentModule) => {
    await saveModule(module);
    setModules(prev => prev.map(m => m.id === module.id ? module : m));
  }, []);

  const removeModule = useCallback(async (id: string) => {
    await deleteModule(id);
    setModules(prev => prev.filter(m => m.id !== id));
  }, []);

  const getTeamModules = useCallback((teamId: string) => {
    return modules.filter(m => m.teamId === teamId);
  }, [modules]);

  const getModuleCount = useCallback((teamId: string) => {
    return modules.filter(m => m.teamId === teamId).length;
  }, [modules]);

  return (
    <AppContext.Provider value={{
      teams, modules, isLoading,
      activeTeamId, setActiveTeamId,
      searchQuery, setSearchQuery,
      addTeam, updateTeam, removeTeam,
      addModule, updateModule, removeModule,
      refreshData,
      getTeamModules, getModuleCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}
