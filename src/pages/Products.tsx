import { motion } from "framer-motion";
import { Package, Search, Boxes } from "lucide-react";
import { useMemo, useState } from "react";
import { useFirebaseData } from "@/hooks/useFirebaseData";

const BRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Products() {
  const { products, isLoading, error } = useFirebaseData();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const categories = useMemo(() => ["Todas", ...Array.from(new Set(products.map((p) => p.category ?? "Geral"))).sort()], [products]);
  const filtered = products.filter((p) => {
    const term = search.toLowerCase();
    return (!term || p.name.toLowerCase().includes(term) || (p.sku ?? "").toLowerCase().includes(term)) && (category === "Todas" || (p.category ?? "Geral") === category);
  });
  const invested = products.reduce((sum, p) => sum + p.averageCost * Math.max(0, p.currentStock), 0);
  return <div className="space-y-6">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><h1 className="text-xl sm:text-2xl font-bold text-foreground">Produtos</h1><p className="text-sm text-muted-foreground mt-1">Catálogo sincronizado diretamente com o Firestore</p></motion.div>
    <div className="grid gap-3 grid-cols-2 xl:grid-cols-3">
      <div className="card-pro p-4"><p className="text-xs text-muted-foreground">Produtos ativos</p><p className="mt-1 text-2xl font-bold text-card-foreground">{products.filter(p => p.status !== "inactive").length}</p></div>
      <div className="card-pro p-4"><p className="text-xs text-muted-foreground">Unidades em estoque</p><p className="mt-1 text-2xl font-bold text-card-foreground">{products.reduce((s, p) => s + Math.max(0, p.currentStock), 0)}</p></div>
      <div className="card-pro p-4 col-span-2 xl:col-span-1"><p className="text-xs text-muted-foreground">Custo imobilizado</p><p className="mt-1 text-2xl font-bold text-card-foreground">{BRL(invested)}</p></div>
    </div>
    <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou SKU..." className="input-pro pl-10" /></div><select value={category} onChange={(e) => setCategory(e.target.value)} className="input-pro w-full sm:w-auto sm:min-w-[180px]">{categories.map((c) => <option key={c}>{c}</option>)}</select></div>
    {isLoading && <p className="text-sm text-muted-foreground">Carregando produtos do Firestore…</p>}
    {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">Não foi possível carregar os produtos. Confirme o login Firebase e as regras do Firestore.</p>}
    <div className="space-y-2.5">{filtered.map((p, i) => <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="card-pro px-4 py-4 sm:px-5"><div className="flex items-start gap-3 sm:items-center sm:gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/8"><Package className="h-5 w-5 text-primary/70" /></div><div className="flex-1 min-w-0"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-card-foreground">{p.name}</p><div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><span className="font-mono">{p.sku || "sem SKU"}</span><span>•</span><span>{p.brand || p.category || "Produto"}</span>{p.volume && <><span>•</span><span>{p.volume}</span></>}<span className="badge badge-success">{p.currentStock} em estoque</span></div></div><div className="flex items-center gap-5 text-right"><div><p className="text-[11px] text-muted-foreground">Custo</p><p className="text-sm font-bold text-card-foreground">{BRL(p.averageCost)}</p></div><div><p className="text-[11px] text-muted-foreground">Preço sugerido</p><p className="text-sm font-bold text-primary">{BRL(p.suggestedPrice)}</p></div></div></div></div></div></motion.div>)}{!isLoading && !error && filtered.length === 0 && <div className="card-pro p-8 text-center text-sm text-muted-foreground"><Boxes className="mx-auto mb-2 h-6 w-6" />Nenhum produto encontrado.</div>}</div>
  </div>;
}

