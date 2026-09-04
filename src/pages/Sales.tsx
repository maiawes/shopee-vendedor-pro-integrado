import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";
import { useFirebaseData } from "@/hooks/useFirebaseData";

const BRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (value: string) => new Date(value).toLocaleDateString("pt-BR");

export default function Sales() {
  const { sales, isLoading, error } = useFirebaseData();
  const active = sales.filter((s) => s.status !== "canceled");
  const units = active.reduce((sum, s) => sum + s.items.reduce((n, i) => n + i.quantity, 0), 0);
  const revenue = active.reduce((sum, s) => sum + s.total, 0);
  const profit = active.reduce((sum, s) => sum + s.grossProfit, 0);
  return <div className="space-y-6">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><h1 className="text-xl sm:text-2xl font-bold text-foreground">Vendas</h1><p className="text-sm text-muted-foreground mt-1">Histórico real sincronizado com o Firestore</p></motion.div>
    <div className="grid gap-3 grid-cols-2 xl:grid-cols-4"><div className="card-pro p-4"><p className="text-xs text-muted-foreground">Unidades vendidas</p><p className="mt-1 text-2xl font-bold text-card-foreground">{units}</p></div><div className="card-pro p-4"><p className="text-xs text-muted-foreground">Receita total</p><p className="mt-1 text-2xl font-bold text-card-foreground">{BRL(revenue)}</p></div><div className="card-pro p-4"><p className="text-xs text-muted-foreground">Lucro bruto</p><p className="mt-1 text-2xl font-bold text-emerald-400">{BRL(profit)}</p></div><div className="card-pro p-4"><p className="text-xs text-muted-foreground">Pedidos ativos</p><p className="mt-1 text-2xl font-bold text-card-foreground">{active.length}</p></div></div>
    {isLoading && <p className="text-sm text-muted-foreground">Carregando vendas do Firestore…</p>}
    {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">Não foi possível carregar as vendas.</p>}
    <div className="card-static overflow-x-auto"><table className="table-pro min-w-[850px]"><thead><tr><th>Data</th><th>Cliente</th><th>Produtos</th><th className="text-right">Total</th><th className="text-right">CMV</th><th className="text-right">Taxa Shopee</th><th className="text-right">Lucro</th><th>Status</th></tr></thead><tbody>{sales.map((s) => <tr key={s.id}><td className="text-muted-foreground">{date(s.date)}</td><td className="font-medium text-card-foreground">{s.customerName}</td><td className="text-muted-foreground">{s.items.reduce((n, i) => n + i.quantity, 0)} un. · {s.items.map(i => i.productName).join(", ")}</td><td className="text-right font-semibold">{BRL(s.total)}</td><td className="text-right text-muted-foreground">{BRL(s.costOfGoods)}</td><td className="text-right text-muted-foreground">{BRL(s.shopeeFee ?? 0)}</td><td className={`text-right font-semibold ${s.grossProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{BRL(s.grossProfit)}</td><td><span className={`badge ${s.status === "canceled" ? "badge-neutral" : "badge-success"}`}>{s.status === "canceled" ? "Cancelada" : s.status === "installments" ? "Parcelada" : s.status === "pending" ? "Pendente" : "Paga"}</span></td></tr>)}{!isLoading && sales.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-muted-foreground"><DollarSign className="mx-auto mb-2 h-6 w-6" />Nenhuma venda encontrada.</td></tr>}</tbody></table></div>
  </div>;
}

