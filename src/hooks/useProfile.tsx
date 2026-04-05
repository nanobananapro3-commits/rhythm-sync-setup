import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState, getDefaultGameState } from '@/lib/gameState';
import { Json } from '@/integrations/supabase/types';

export function useProfile(userId: string | undefined) {
  const [gameState, setGameState] = useState<GameState>(getDefaultGameState());
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setGameState({
        coins: data.coins,
        maxUnlocked: data.max_unlocked,
        activeSkin: data.active_skin,
        ownedSkins: data.owned_skins,
        levelProgress: (data.level_progress as Record<string, { stars: number; completed: boolean }>) || {},
      });
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveProfile = useCallback(async (newState: GameState) => {
    if (!userId) return;
    setGameState(newState);
    await supabase
      .from('profiles')
      .update({
        coins: newState.coins,
        max_unlocked: newState.maxUnlocked,
        active_skin: newState.activeSkin,
        owned_skins: newState.ownedSkins,
        level_progress: newState.levelProgress as unknown as Json,
      })
      .eq('user_id', userId);
  }, [userId]);

  return { gameState, setGameState: saveProfile, loading };
}
