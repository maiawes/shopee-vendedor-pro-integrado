import { useFirebaseData } from "@/hooks/useFirebaseData";

export interface Fornecedor { id: string; nome: string; cnpj: string | null; contato_nome: string | null; contato_telefone: string | null; contato_email: string | null; prazo_pagamento_dias: number; observacoes: string | null; ativo: boolean; created_at: string; updated_at: string; }
export type FornecedorInput = Omit<Fornecedor, "id" | "ativo" | "created_at" | "updated_at">;

export function useFornecedores() {
  const { suppliers, isLoading, error } = useFirebaseData();
  const fornecedores: Fornecedor[] = suppliers.map((supplier) => ({ id: supplier.id, nome: supplier.name, cnpj: supplier.document ?? null, contato_nome: null, contato_telefone: supplier.phone ?? supplier.whatsapp ?? null, contato_email: supplier.email ?? null, prazo_pagamento_dias: 0, observacoes: supplier.address ?? null, ativo: supplier.status !== "inactive", created_at: supplier.createdAt ?? "", updated_at: supplier.createdAt ?? "" }));
  return { fornecedores, isLoading, error };
}
