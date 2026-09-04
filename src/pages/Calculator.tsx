import { motion } from "framer-motion";
import { Calculator as CalcIcon, FileText, Info, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";

const BRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Calculator() {
  const { profile } = useProfile();
  const [cost, setCost] = useState("");
  const [commission, setCommission] = useState("14");
  const [transactionRate, setTransactionRate] = useState("2");
  const [shipping, setShipping] = useState("5");
  const [packaging, setPackaging] = useState("2");
  const [otherCosts, setOtherCosts] = useState("0");
  const [margin, setMargin] = useState("30");

  useEffect(() => {
    if (profile) {
      setCommission(String(profile.shopee_commission));
      setMargin(String(profile.target_margin));
    }
  }, [profile]);

  const costNum = Number(cost) || 0;
  const fees = (Number(commission) || 0) + (Number(transactionRate) || 0);
  const fixed = costNum + (Number(shipping) || 0) + (Number(packaging) || 0) + (Number(otherCosts) || 0);
  const targetMargin = Number(margin) || 0;
  const divisor = 1 - fees / 100 - targetMargin / 100;
  const recommended = divisor > 0 ? fixed / divisor : 0;
  const minimum = fees < 100 ? fixed / (1 - fees / 100) : 0;
  const profit = recommended - fixed - recommended * fees / 100;
  const scenarios = [20, 30, 40].map((scenarioMargin) => {
    const scenarioDivisor = 1 - fees / 100 - scenarioMargin / 100;
    const price = scenarioDivisor > 0 ? fixed / scenarioDivisor : 0;
    return { margin: scenarioMargin, price, profit: price - fixed - price * fees / 100 };
  });

  return <div className="space-y-6">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-xl sm:text-2xl font-bold text-foreground">Calculadora de Preço</h1>
      <p className="text-sm text-muted-foreground mt-1">Precifique com base no seu custo real e defina sua margem ideal</p>
    </motion.div>

    <div className="grid gap-6 lg:grid-cols-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-static p-5 sm:p-6 lg:col-span-3">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-4 w-4 text-primary" /></div>
          <h3 className="text-sm font-semibold text-card-foreground">Custos e Taxas</h3>
        </div>
        <div className="grid gap-4 grid-cols-2">
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Custo por par (R$)</label><input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} className="input-pro" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Margem desejada (%)</label><input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} className="input-pro" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Comissão Shopee (%)</label><input type="number" step="0.5" value={commission} onChange={(e) => setCommission(e.target.value)} className="input-pro" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Taxa transação (%)</label><input type="number" step="0.5" value={transactionRate} onChange={(e) => setTransactionRate(e.target.value)} className="input-pro" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Subsídio frete (R$)</label><input type="number" step="0.01" value={shipping} onChange={(e) => setShipping(e.target.value)} className="input-pro" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Embalagem (R$)</label><input type="number" step="0.01" value={packaging} onChange={(e) => setPackaging(e.target.value)} className="input-pro" /></div>
          <div className="col-span-2"><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Outros custos (R$)</label><input type="number" step="0.01" value={otherCosts} onChange={(e) => setOtherCosts(e.target.value)} className="input-pro" /></div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Taxas Shopee ({fees.toFixed(1)}%) são descontadas do preço de venda. O preço recomendado garante exatamente a margem desejada após todos os descontos.</div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 lg:col-span-2">
        <div className="card-static p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2"><CalcIcon className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold text-card-foreground">Resultado</h3></div>
          <div className="grid grid-cols-2 gap-3 text-center"><div className="rounded-xl bg-muted/40 p-3"><p className="text-[11px] text-muted-foreground">Custo total</p><p className="mt-1 font-bold text-card-foreground">{BRL(fixed)}</p></div><div className="rounded-xl bg-muted/40 p-3"><p className="text-[11px] text-muted-foreground">Preço mínimo</p><p className="mt-1 font-bold text-card-foreground">{BRL(minimum)}</p></div></div>
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center"><p className="text-[10px] font-bold tracking-widest text-primary uppercase">Preço recomendado</p><p className="mt-1 text-3xl font-bold text-primary">{BRL(recommended)}</p><p className="mt-2 text-xs text-muted-foreground">Lucro líquido: <strong className="text-emerald-400">{BRL(profit)}</strong> · margem: {recommended ? ((profit / recommended) * 100).toFixed(1) : "0.0"}%</p></div>
        </div>
        <div className="card-static p-5"><div className="mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold text-card-foreground">Cenários de margem</h3></div><div className="space-y-2">{scenarios.map((scenario) => <div key={scenario.margin} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm"><span className="text-muted-foreground">{scenario.margin}% de margem</span><span className="font-bold text-card-foreground">{BRL(scenario.price)} <small className="ml-1 font-normal text-emerald-400">+{BRL(scenario.profit)}</small></span></div>)}</div></div>
      </motion.div>
    </div>
  </div>;
}
