import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  store_name: string | null;
  avatar_url: string | null;
  shopee_commission: number;
  target_margin: number;
  stock_alert_threshold: number;
  meta_pares_mes: number;
  meta_receita_mes: number;
}

const DEFAULTS = { full_name: null, store_name: null, avatar_url: null, shopee_commission: 14, target_margin: 30, stock_alert_threshold: 3, meta_pares_mes: 0, meta_receita_mes: 0 };

function storageKey(userId: string) { return `seller-pro-profile-${userId}`; }

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery<UserProfile>({
    queryKey: ["firebase-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const saved = localStorage.getItem(storageKey(user!.id));
      const local = saved ? JSON.parse(saved) as Partial<UserProfile> : {};
      return { ...DEFAULTS, user_id: user!.id, full_name: (local.full_name ?? user?.user_metadata?.full_name ?? null) as string | null, store_name: (local.store_name ?? null) as string | null, ...local };
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const current = query.data ?? { ...DEFAULTS, user_id: user!.id };
      localStorage.setItem(storageKey(user!.id), JSON.stringify({ ...current, ...updates }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["firebase-profile", user?.id] }),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      reader.readAsDataURL(file);
    }),
    onSuccess: async (avatar_url) => updateProfile.mutateAsync({ avatar_url }),
  });

  return { profile: query.data, isLoading: query.isLoading, updateProfile, uploadAvatar };
}
