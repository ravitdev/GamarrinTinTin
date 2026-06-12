import { useState, useCallback } from 'react';
import useSWR from 'swr';
import {
  UserService,
  type UpdateProfilePayload,
  type UserProfile,
} from '../services/user.service';

interface UseUserReturn {
  profile: UserProfile | undefined;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<UserProfile | undefined>;
  updateProfile: (data: UpdateProfilePayload) => Promise<UserProfile>;
}

export function useUser(): UseUserReturn {
  const [error, setError] = useState<string | null>(null);
  const { data: profile, isLoading, mutate } = useSWR(
    '/usuarios/perfil',
    () => UserService.getProfile(),
    { revalidateOnFocus: false },
  );

  const refreshProfile = useCallback(async () => {
    return mutate();
  }, [mutate]);

  const updateProfile = useCallback(
    async (data: UpdateProfilePayload) => {
      setError(null);
      try {
        const updated = await UserService.updateProfile(data);
        await mutate(updated, false);
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar perfil';
        setError(message);
        throw err;
      }
    },
    [mutate],
  );

  return {
    profile,
    isLoading,
    error,
    refreshProfile,
    updateProfile,
  };
}
