import { motion } from "framer-motion";
import { CheckCircle2, Code2, Clock3, Plus, Wallet } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { useFirebaseData } from "@/hooks/useFirebaseData";

const BRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function dateOnly(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

export default function Services() {
  const { serviceSales, bankAccounts, isLoading, error, createServiceSale } = useFirebaseData();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("Desenvolvimento de software");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"paid" | "pending">("paid");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [accountId, setAccountId] = useState("");
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const active = serviceSales.filter((sale) => sale.status !== "canceled");
    return {
      total: active.reduce((sum, sale) => sum + sale.amount, 0),
      paid: active.filter((sale) => sale.status === "paid").reduce((sum, sale) => sum + sale.amount, 0),
      pending: active.filter((sale) => sale.status === "pending").reduce((sum, sale) => sum + sale.amount, 0),
    };
  }, [serviceSales]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!clientName.trim() || !description.trim() || !date || !Number.isFinite(numericAmount) || numericAmount <= 0 || (status === "paid" && !accountId)) return;
    try {
      setSaving(true);
      await createServiceSale({ date, clientName, description, amount: numericAmount, status, paymentMethod, accountId: status === "paid" ? accountId : undefined });
      setClientName("");
      setDescription("Desenvolvimento de software");
      setAmount("");
      setStatus("paid");
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "Não foi possível registrar o serviço.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-xl font-bold text-foreground sm:text-2xl">Serviços</h1><p className="mt-1 text-sm text-muted-foreground">Registre serviços de desenvolvimento e acompanhe os recebimentos.</p></div><span className="badge badge-success">Entrada bancária integrada</span></div>
      </motion.div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando serviços do Firestore…</p>}
      {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">Não foi possível carregar os serviços.</p>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><div className="card-pro p-4"><p className="text-xs text-muted-foreground">Serviços registrados</p><p className="mt-1 text-2xl font-bold text-card-foreground">{serviceSales.filter((sale) => sale.status !== "canceled").length}</p></div><div className="card-pro p-4"><p className="text-xs text-muted-foreground">Valor total</p><p className="mt-1 text-2xl font-bold text-card-foreground">{BRL(totals.total)}</p></div><div className="card-pro p-4"><p className="text-xs text-muted-foreground">Recebido</p><p className="mt-1 text-2xl font-bold text-emerald-400">{BRL(totals.paid)}</p></div><div className="card-pro p-4"><p className="text-xs text-muted-foreground">A receber</p><p className="mt-1 text-2xl font-bold text-amber-400">{BRL(totals.pending)}</p></div></div>

      <div className="card-static p-5"><div className="mb-4 flex items-start gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary"><Plus className="h-5 w-5" /></div><div><h2 className="text-sm font-semibold text-card-foreground">Nova venda de serviço</h2><p className="mt-1 text-xs text-muted-foreground">Serviços pagos entram imediatamente no extrato da conta escolhida.</p></div></div><form onSubmit={(event) => void handleSubmit(event)} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><label className="text-xs text-muted-foreground">Data<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" /></label><label className="text-xs text-muted-foreground">Cliente<input required value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Nome do cliente" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" /></label><label className="text-xs text-muted-foreground md:col-span-2">Descrição do serviço<input required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex.: Sistema web, manutenção, consultoria" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" /></label><label className="text-xs text-muted-foreground">Valor<input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="R$ 0,00" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" /></label><label className="text-xs text-muted-foreground">Situação<select value={status} onChange={(event) => setStatus(event.target.value as "paid" | "pending")} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"><option value="paid">Recebido</option><option value="pending">Pendente</option></select></label><label className="text-xs text-muted-foreground">Forma de pagamento<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"><option value="pix">Pix</option><option value="transfer">Transferência</option><option value="card">Cartão</option><option value="cash">Dinheiro</option><option value="boleto">Boleto</option><option value="other">Outro</option></select></label><label className="text-xs text-muted-foreground">Conta de destino<select required={status === "paid"} value={accountId} onChange={(event) => setAccountId(event.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"><option value="">{status === "paid" ? "Selecione a conta" : "Defina ao receber"}</option>{bankAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><div className="flex items-end"><button type="submit" disabled={saving || !clientName.trim() || !amount || (status === "paid" && !accountId)} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Code2 className="h-4 w-4" />{saving ? "Salvando…" : "Registrar serviço"}</button></div></form>{status === "paid" && bankAccounts.length === 0 && <p className="mt-3 text-xs text-amber-400">Cadastre uma conta bancária no Financeiro antes de registrar um serviço recebido.</p>}</div>

      <div className="card-static overflow-x-auto p-5"><div className="mb-4 flex items-start justify-between"><div><h2 className="text-sm font-semibold text-card-foreground">Histórico de serviços</h2><p className="mt-1 text-xs text-muted-foreground">Serviços pagos aparecem também como entrada no extrato da conta.</p></div><Wallet className="h-5 w-5 text-primary" /></div><table className="table-pro min-w-[800px]"><thead><tr><th>Data</th><th>Cliente</th><th>Serviço</th><th>Forma</th><th className="text-right">Valor</th><th>Status</th></tr></thead><tbody>{serviceSales.map((sale) => <tr key={sale.id}><td className="text-muted-foreground">{dateOnly(sale.date)}</td><td className="font-medium text-card-foreground">{sale.clientName}</td><td className="text-muted-foreground">{sale.description}</td><td className="text-muted-foreground">{sale.paymentMethod ?? "—"}</td><td className="text-right font-semibold">{BRL(sale.amount)}</td><td><span className={`badge ${sale.status === "paid" ? "badge-success" : sale.status === "pending" ? "badge-warning" : "badge-neutral"}`}>{sale.status === "paid" ? <><CheckCircle2 className="mr-1 inline h-3 w-3" />Recebido</> : sale.status === "pending" ? <><Clock3 className="mr-1 inline h-3 w-3" />Pendente</> : "Cancelado"}</span></td></tr>)}{serviceSales.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum serviço registrado ainda.</td></tr>}</tbody></table></div>
    </div>
  );
}
