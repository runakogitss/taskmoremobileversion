import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  color: string;
  archived?: boolean;
}

interface GoalContextType {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  clearGoals: () => void;
  archiveGoal: (id: string) => void;
  getArchivedGoals: () => Goal[];
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

const initialGoals: Goal[] = [];

export function GoalProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('goals');
    return saved ? JSON.parse(saved) : initialGoals;
  });

  // Save to localStorage whenever goals change
  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);

  const addGoal = (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      archived: false
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, ...updates } : goal
    ));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  const updateProgress = (id: string, progress: number) => {
    setGoals(prev => prev.map(goal => 
      goal.id === id ? { 
        ...goal, 
        currentValue: Math.min(progress, goal.targetValue),
        status: progress >= goal.targetValue ? 'completed' : goal.status
      } : goal
    ));
  };

  const clearGoals = () => {
    setGoals([]);
  };

  const archiveGoal = (id: string) => {
    setGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, archived: true } : goal
    ));
  };

  const getArchivedGoals = () => {
    return goals.filter(goal => goal.archived);
  };

  return (
    <GoalContext.Provider value={{
      goals,
      addGoal,
      updateGoal,
      deleteGoal,
      updateProgress,
      clearGoals,
      archiveGoal,
      getArchivedGoals
    }}>
      {children}
    </GoalContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
}

// User context for profile name, bio, picture
interface UserProfile {
  id: string;
  name: string;
  profilePic: string | null;
}

interface UserContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  fetchUserProfile: (id: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  // Fetch user profile from Supabase
  const fetchUserProfile = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (data) {
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Update user profile in Supabase and local state
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user profile:', error);
        return;
      }
      
      if (data) {
        setUser(data);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, fetchUserProfile, updateUserProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}