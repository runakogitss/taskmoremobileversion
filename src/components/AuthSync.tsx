import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/GoalContext';

export function AuthSync() {
  const { user: authUser } = useAuth();
  const { fetchUserProfile, setUser } = useUser();

  useEffect(() => {
    if (authUser) {
      // Fetch user profile when authenticated
      fetchUserProfile(authUser.id);
    } else {
      // Clear user profile when not authenticated
      setUser(null);
    }
  }, [authUser, fetchUserProfile, setUser]);

  return null; // This component doesn't render anything
} 