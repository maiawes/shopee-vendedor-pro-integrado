import { useFirebaseData, type FirebaseProduct } from "@/hooks/useFirebaseData";

export interface Produto extends FirebaseProduct {
  nome: string;
  categoria: string;
  sku: string | null;
  preco_custo: number;
  preco_venda: number | null;
  estoque_atual: number;
  estoque_minimo: number;
  unidade: string;
}

export function useProdutos() {
  const { products, isLoading, error } = useFirebaseData();
  const produtos: Produto[] = products.map((product) => ({ ...product, nome: product.name, categoria: product.category ?? "Geral", sku: product.sku ?? null, preco_custo: product.averageCost, preco_venda: product.suggestedPrice || null, estoque_atual: product.currentStock, estoque_minimo: product.minimumStock, unidade: "un." }));
  const alertas = produtos.filter((product) => product.estoque_atual <= product.estoque_minimo);
  return { produtos, isLoading, error, alertas };
}
