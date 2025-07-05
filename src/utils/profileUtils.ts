import { User } from '@supabase/supabase-js';

/**
 * Get the best available profile picture URL
 * Priority: 1. Custom uploaded picture, 2. Google picture, 3. Default picture
 */
export const getProfilePictureUrl = (userProfile: { profilePic?: string | null }, authUser: User | null): string => {
  // If user has a custom uploaded picture, use it
  if (userProfile?.profilePic && !userProfile.profilePic.startsWith('data:')) {
    return userProfile.profilePic;
  }
  
  // If user has Google picture and no custom picture, use Google picture
  if (authUser?.user_metadata?.avatar_url && !userProfile?.profilePic) {
    return authUser.user_metadata.avatar_url;
  }
  
  // If user has a data URL (custom uploaded), use it
  if (userProfile?.profilePic && userProfile.profilePic.startsWith('data:')) {
    return userProfile.profilePic;
  }
  
  // Fallback to default picture
  return '/pictures/profilepic.jpg';
};

/**
 * Check if user has a Google profile picture available
 */
export const hasGooglePicture = (authUser: User | null): boolean => {
  return !!(authUser?.user_metadata?.avatar_url);
};

/**
 * Get Google profile picture URL
 */
export const getGooglePictureUrl = (authUser: User | null): string | null => {
  return authUser?.user_metadata?.avatar_url || null;
};

/**
 * Validate profile picture URL
 */
export const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Get the best available name for a user
 * Priority: 1. Google full name, 2. Stored profile name, 3. Email username, 4. Default
 */
export const getBestAvailableName = (userProfile: { name?: string }, authUser: User | null): string => {
  // First priority: Google full name
  if (authUser?.user_metadata?.full_name) {
    return authUser.user_metadata.full_name;
  }
  
  // Second priority: Stored profile name
  if (userProfile?.name) {
    return userProfile.name;
  }
  
  // Third priority: Email username
  if (authUser?.email) {
    return authUser.email.split('@')[0];
  }
  
  // Fallback
  return 'User';
};

/**
 * Convert file to base64 data URL
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}; 