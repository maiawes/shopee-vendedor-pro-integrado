import { motion } from "framer-motion";
import { AlertTriangle, Boxes, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import StatCard from "@/components/StatCard";
import { useFirebaseData } from "@/hooks/useFirebaseData";

const BRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const tooltipStyle = { background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 15%)", borderRadius: 10, color: "hsl(0 0% 92%)" };

export default function Dashboard() {
  const { products, sales, purchases, isLoading, error } = useFirebaseData();
  const activeSales = sales.filter(s => s.status !== "canceled");
  const revenue = activeSales.reduce((sum, s) => sum + s.total, 0);
  const profit = activeSales.reduce((sum, s) => sum + s.grossProfit, 0);
  const unitsSold = activeSales.reduce((sum, s) => sum + s.items.reduce((n, i) => n + i.quantity, 0), 0);
  const inventoryValue = products.reduce((sum, p) => sum + p.averageCost * Math.max(0, p.currentStock), 0);
  const low = products.filter(p => p.currentStock <= p.minimumStock);

  const monthly = useMemo(() => {
    const grouped: Record<string, { receita: number; custo: number; lucro: number }> = {};
    for (const sale of activeSales) {
      const d = new Date(sale.date);
      const key = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      grouped[key] ??= { receita: 0, custo: 0, lucro: 0 };
      grouped[key].receita += sale.total;
      grouped[key].custo += sale.costOfGoods;
      grouped[key].lucro += sale.grossProfit;
    }
    return Object.entries(grouped).slice(-6).map(([mes, values]) => ({ mes, ...values }));
  }, [sales]);

  const ranking = useMemo(() => {
    const totals = new Map<string, { quantidade: number; lucro: number }>();
    for (const sale of activeSales) for (const item of sale.items) {
      const current = totals.get(item.productName) ?? { quantidade: 0, lucro: 0 };
      totals.set(item.productName, { quantidade: current.quantidade + item.quantity, lucro: current.lucro + (item.total ?? item.quantity * item.unitPrice) - (item.costOfGoods ?? item.quantity * (item.averageCost ?? 0)) });
    }
    return [...totals.entries()].sort((a, b) => b[1].lucro - a[1].lucro).slice(0, 5);
  }, [sales]);

  return <div className="space-y-6">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1><p className="text-sm text-muted-foreground mt-1">Visão geral dos dados do seu Firestore</p></motion.div>
    {isLoading && <p className="text-sm text-muted-foreground">Sincronizando dados do Firebase…</p>}
    {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">Não foi possível sincronizar o Firestore. Verifique se a conta conectada é a proprietária dos dados.</p>}
    {low.length > 0 && <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-300"><AlertTriangle className="h-4 w-4" /><span>{low.length} produto(s) no limite ou abaixo do estoque mínimo.</span><Link className="ml-auto underline" to="/estoque">Ver estoque</Link></div>}
    <div className="grid gap-3 grid-cols-2 xl:grid-cols-4"><StatCard title="Valor em estoque" value={BRL(inventoryValue)} change={`${products.filter(p => p.currentStock > 0).length} produtos com saldo`} changeType="neutral" icon={Boxes} index={0} /><StatCard title="Receita de vendas" value={BRL(revenue)} change={`${unitsSold} unidades vendidas`} changeType="positive" icon={DollarSign} index={1} /><StatCard title="Compras registradas" value={BRL(purchases.reduce((s, p) => s + p.totalCost, 0))} change={`${purchases.length} compras`} changeType="neutral" icon={ShoppingCart} index={2} /><StatCard title="Lucro bruto" value={BRL(profit)} change={revenue ? `${(profit / revenue * 100).toFixed(1)}% margem` : "—"} changeType={profit >= 0 ? "positive" : "negative"} icon={TrendingUp} index={3} /></div>
    {monthly.length > 0 && <div className="grid gap-6 lg:grid-cols-2"><div className="card-static p-4 sm:p-6"><h3 className="mb-1 text-sm font-semibold text-card-foreground">Receita vs custo</h3><p className="mb-4 text-xs text-muted-foreground">Vendas não canceladas agrupadas por mês</p><ResponsiveContainer width="100%" height={240}><BarChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 12%)" vertical={false} /><XAxis dataKey="mes" stroke="hsl(0 0% 40%)" fontSize={11} /><YAxis stroke="hsl(0 0% 40%)" fontSize={11} /><Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [BRL(v), ""]} /><Legend /><Bar dataKey="receita" name="Receita" fill="hsl(152,69%,40%)" radius={[5,5,0,0]} /><Bar dataKey="custo" name="Custo" fill="hsl(0,70%,55%)" radius={[5,5,0,0]} /></BarChart></ResponsiveContainer></div><div className="card-static p-4 sm:p-6"><h3 className="mb-1 text-sm font-semibold text-card-foreground">Evolução do lucro</h3><p className="mb-4 text-xs text-muted-foreground">Lucro bruto por mês</p><ResponsiveContainer width="100%" height={240}><LineChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 12%)" vertical={false} /><XAxis dataKey="mes" stroke="hsl(0 0% 40%)" fontSize={11} /><YAxis stroke="hsl(0 0% 40%)" fontSize={11} /><Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [BRL(v), "Lucro"]} /><Line type="monotone" dataKey="lucro" stroke="hsl(14,100%,50%)" strokeWidth={3} /></LineChart></ResponsiveContainer></div></div>}
    <div className="card-static p-5"><h3 className="mb-4 text-sm font-semibold text-card-foreground">Ranking de lucro por produto</h3>{ranking.length ? <div className="space-y-2">{ranking.map(([name, data], i) => <div key={name} className="flex items-center justify-between rounded-lg border border-border/50 bg-background px-3 py-3"><div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{i + 1}</span><div><p className="text-sm font-medium text-card-foreground">{name}</p><p className="text-xs text-muted-foreground">{data.quantidade} unidades</p></div></div><span className="text-sm font-bold text-emerald-400">{BRL(data.lucro)}</span></div>)}</div> : <p className="text-sm text-muted-foreground">Nenhuma venda disponível para ranking.</p>}</div>
  </div>;
}

