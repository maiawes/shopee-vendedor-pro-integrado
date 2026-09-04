import { motion } from "framer-motion";
import { DollarSign, ShoppingBag, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import StatCard from "@/components/StatCard";
import { useFirebaseData } from "@/hooks/useFirebaseData";

const BRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const tooltipStyle = { background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 15%)", borderRadius: 10, color: "hsl(0 0% 92%)" };

export default function Financial() {
  const { products, sales, purchases, expenses, isLoading, error } = useFirebaseData();
  const valid = sales.filter(s => s.status !== "canceled");
  const revenue = valid.reduce((sum, s) => sum + s.total, 0);
  const costs = valid.reduce((sum, s) => sum + s.costOfGoods + (s.packagingCost ?? 0) + (s.linkedCosts ?? 0), 0);
  const fees = valid.reduce((sum, s) => sum + (s.shopeeFee ?? 0), 0);
  const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = valid.reduce((sum, s) => sum + s.grossProfit, 0) - expensesTotal;
  const monthly = useMemo(() => {
    const grouped: Record<string, { receita: number; custo: number; lucro: number }> = {};
    for (const sale of valid) {
      const d = new Date(sale.date);
      const key = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      grouped[key] ??= { receita: 0, custo: 0, lucro: 0 };
      grouped[key].receita += sale.total;
      grouped[key].custo += sale.costOfGoods + (sale.packagingCost ?? 0) + (sale.linkedCosts ?? 0);
      grouped[key].lucro += sale.grossProfit;
    }
    return Object.entries(grouped).slice(-6).map(([mes, values]) => ({ mes, ...values }));
  }, [sales]);
  const inventoryValue = products.reduce((sum, p) => sum + p.averageCost * Math.max(0, p.currentStock), 0);
  return <div className="space-y-6"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><h1 className="text-xl sm:text-2xl font-bold text-foreground">Financeiro</h1><p className="text-sm text-muted-foreground mt-1">P&L calculado sobre vendas e despesas do Firestore</p></motion.div>{isLoading && <p className="text-sm text-muted-foreground">Carregando dados financeiros…</p>}{error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">Não foi possível carregar os dados financeiros.</p>}<div className="grid gap-3 grid-cols-2 xl:grid-cols-4"><StatCard title="Receita" value={BRL(revenue)} icon={TrendingUp} index={0} /><StatCard title="Custos e CMV" value={BRL(costs)} icon={TrendingDown} index={1} /><StatCard title="Taxas Shopee" value={BRL(fees)} icon={DollarSign} index={2} /><StatCard title="Lucro líquido" value={BRL(profit)} change={revenue ? `${(profit / revenue * 100).toFixed(1)}% margem` : "—"} changeType={profit >= 0 ? "positive" : "negative"} icon={ShoppingBag} index={3} /></div><div className="grid gap-3 grid-cols-2 xl:grid-cols-3"><div className="card-pro p-4"><p className="text-xs text-muted-foreground">Investido em compras</p><p className="mt-1 text-xl font-bold text-card-foreground">{BRL(purchases.reduce((s, p) => s + p.totalCost, 0))}</p></div><div className="card-pro p-4"><p className="text-xs text-muted-foreground">Despesas</p><p className="mt-1 text-xl font-bold text-card-foreground">{BRL(expensesTotal)}</p></div><div className="card-pro p-4"><p className="text-xs text-muted-foreground">Estoque atual</p><p className="mt-1 text-xl font-bold text-card-foreground">{BRL(inventoryValue)}</p></div></div>{monthly.length > 0 && <div className="card-static p-5"><h3 className="mb-1 text-sm font-semibold text-card-foreground">Receita, custos e lucro por mês</h3><p className="mb-4 text-xs text-muted-foreground">Dados reais das vendas não canceladas</p><ResponsiveContainer width="100%" height={280}><AreaChart data={monthly}><defs><linearGradient id="finRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(152,69%,40%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(152,69%,40%)" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 12%)" vertical={false} /><XAxis dataKey="mes" stroke="hsl(0 0% 40%)" fontSize={11} /><YAxis stroke="hsl(0 0% 40%)" fontSize={11} /><Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [BRL(v), ""]} /><Area type="monotone" dataKey="receita" name="Receita" stroke="hsl(152,69%,40%)" fill="url(#finRevenue)" /><Area type="monotone" dataKey="custo" name="Custo" stroke="hsl(0,70%,55%)" fill="transparent" /><Area type="monotone" dataKey="lucro" name="Lucro" stroke="hsl(14,100%,50%)" fill="transparent" /></AreaChart></ResponsiveContainer></div>}</div>;
}

