import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { UserService } from '../services/user.service';
import { User } from '@/lib/types';

interface UseUserReturn {
  user: User | undefined;
  isLoading: boolean;
  error: string | null;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [error, setError] = useState<string | null>(null);
  const { data: user, isLoading, mutate } = useSWR('/user/profile', () => UserService.getProfile() as Promise<User>, {
    revalidateOnFocus: false,
  });

  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      setError(null);
      try {
        await UserService.updateProfile(data as any);
        mutate();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al actualizar perfil');
      }
    },
    [mutate]
  );

  return {
    user,
    isLoading,
    error,
    updateProfile,
  };
}
