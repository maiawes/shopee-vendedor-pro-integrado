import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CreditCard,
  FileText,
  Landmark,
  Receipt,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import StatCard from "@/components/StatCard";
import { useFirebaseData, type FirebasePayment } from "@/hooks/useFirebaseData";

const BRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const tooltipStyle = { background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 15%)", borderRadius: 10, color: "hsl(0 0% 92%)" };
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function dateOnly(value?: string) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

function monthKey(value?: string) {
  return value?.slice(0, 7) ?? "";
}

function paymentStatusLabel(payment: FirebasePayment) {
  if (payment.status === "overdue") return "Vencido";
  if (payment.status === "paid") return "Pago";
  return "Pendente";
}

function paymentMethodLabel(method?: string) {
  const labels: Record<string, string> = { pix: "Pix", cash: "Dinheiro", card: "Cartão", boleto: "Boleto", transfer: "Transferência", other: "Outro" };
  return method ? labels[method] ?? method : "—";
}

export default function Financial() {
  const { products, sales, purchases, expenses, payments, bankAccounts, bankTransactions, serviceSales, isLoading, error, createBankAccount, createBankTransaction, markPaymentAsPaid } = useFirebaseData();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedPaymentAccounts, setSelectedPaymentAccounts] = useState<Record<string, string>>({});
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountBalance, setNewAccountBalance] = useState("");
  const [transactionType, setTransactionType] = useState<"deposit" | "withdrawal">("deposit");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const validSales = useMemo(() => sales.filter((sale) => sale.status !== "canceled"), [sales]);
  const pendingReceivables = useMemo(() => payments.filter((payment) => payment.type === "receivable" && payment.status !== "paid"), [payments]);
  const pendingPayables = useMemo(() => payments.filter((payment) => payment.type === "payable" && payment.status !== "paid"), [payments]);

  const metrics = useMemo(() => {
    const revenue = validSales.reduce((sum, sale) => sum + sale.total, 0) + serviceSales.filter((sale) => sale.status !== "canceled").reduce((sum, sale) => sum + sale.amount, 0);
    const cogs = validSales.reduce((sum, sale) => sum + sale.costOfGoods + (sale.packagingCost ?? 0) + (sale.linkedCosts ?? 0), 0);
    const shopeeFees = validSales.reduce((sum, sale) => sum + (sale.shopeeFee ?? 0), 0);
    const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const receivable = pendingReceivables.reduce((sum, payment) => sum + payment.amount, 0);
    const payable = pendingPayables.reduce((sum, payment) => sum + payment.amount, 0);
    const gross = revenue - cogs - shopeeFees;
    return { revenue, cogs, shopeeFees, expensesTotal, gross, net: gross - expensesTotal, margin: revenue ? (gross / revenue) * 100 : 0, receivable, payable };
  }, [expenses, pendingPayables, pendingReceivables, serviceSales, validSales]);

  const accountBalance = (accountId: string) => {
    const account = bankAccounts.find((item) => item.id === accountId);
    if (!account) return 0;
    const paidSales = sales.filter((sale) => sale.status === "paid" && sale.accountId === accountId).reduce((sum, sale) => sum + sale.total, 0);
    const received = payments.filter((payment) => payment.type === "receivable" && payment.status === "paid" && payment.accountId === accountId).reduce((sum, payment) => sum + payment.amount, 0);
    const paidPurchases = purchases.filter((purchase) => purchase.status === "paid" && purchase.accountId === accountId).reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const paidPayables = payments.filter((payment) => payment.type === "payable" && payment.status === "paid" && payment.accountId === accountId).reduce((sum, payment) => sum + payment.amount, 0);
    const deposits = bankTransactions.filter((transaction) => transaction.accountId === accountId && transaction.type === "deposit").reduce((sum, transaction) => sum + transaction.amount, 0);
    const withdrawals = bankTransactions.filter((transaction) => transaction.accountId === accountId && transaction.type === "withdrawal").reduce((sum, transaction) => sum + transaction.amount, 0);
    return account.initialBalance + paidSales + received + deposits - paidPurchases - paidPayables - withdrawals;
  };

  const realBalance = useMemo(() => bankAccounts.reduce((sum, account) => sum + accountBalance(account.id), 0), [bankAccounts, bankTransactions, payments, purchases, sales]);

  const cashFlow = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return { key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`, label: MONTHS[date.getMonth()] };
    });
    return months.map((month) => {
      const incoming = sales.filter((sale) => sale.status === "paid" && monthKey(sale.date) === month.key).reduce((sum, sale) => sum + sale.total, 0)
        + payments.filter((payment) => payment.type === "receivable" && payment.status === "paid" && monthKey(payment.paidAt ?? payment.dueDate) === month.key).reduce((sum, payment) => sum + payment.amount, 0)
        + bankTransactions.filter((transaction) => transaction.type === "deposit" && monthKey(transaction.date) === month.key).reduce((sum, transaction) => sum + transaction.amount, 0);
      const outgoing = purchases.filter((purchase) => purchase.status === "paid" && monthKey(purchase.date) === month.key).reduce((sum, purchase) => sum + purchase.totalCost, 0)
        + expenses.filter((expense) => monthKey(expense.date) === month.key).reduce((sum, expense) => sum + expense.amount, 0)
        + payments.filter((payment) => payment.type === "payable" && payment.status === "paid" && monthKey(payment.paidAt ?? payment.dueDate) === month.key).reduce((sum, payment) => sum + payment.amount, 0)
        + bankTransactions.filter((transaction) => transaction.type === "withdrawal" && monthKey(transaction.date) === month.key).reduce((sum, transaction) => sum + transaction.amount, 0);
      const salesTotal = sales.filter((sale) => sale.status !== "canceled" && monthKey(sale.date) === month.key).reduce((sum, sale) => sum + sale.total, 0);
      return { ...month, incoming, outgoing, salesTotal };
    });
  }, [bankTransactions, expenses, payments, purchases, sales]);

  const activeAccountId = selectedAccountId && bankAccounts.some((account) => account.id === selectedAccountId) ? selectedAccountId : bankAccounts[0]?.id;
  const activeAccount = bankAccounts.find((account) => account.id === activeAccountId);
  const accountHistory = useMemo(() => {
    if (!activeAccountId) return [];
    const account = bankAccounts.find((item) => item.id === activeAccountId);
    const history: Array<{ id: string; date: string; description: string; amount: number; type: "in" | "out" }> = [];
    if (account) history.push({ id: `initial-${account.id}`, date: account.createdAt, description: "Saldo inicial", amount: account.initialBalance, type: "in" });
    for (const sale of sales.filter((item) => item.status === "paid" && item.accountId === activeAccountId)) history.push({ id: sale.id, date: sale.date, description: `Venda · ${sale.customerName ?? "Consumidor final"}`, amount: sale.total, type: "in" });
    for (const purchase of purchases.filter((item) => item.status === "paid" && item.accountId === activeAccountId)) history.push({ id: purchase.id, date: purchase.date ?? "", description: `Compra · ${purchase.supplierName ?? "Fornecedor"}`, amount: -purchase.totalCost, type: "out" });
    for (const payment of payments.filter((item) => item.status === "paid" && item.accountId === activeAccountId)) history.push({ id: payment.id, date: payment.paidAt ?? payment.dueDate, description: payment.description, amount: payment.type === "receivable" ? payment.amount : -payment.amount, type: payment.type === "receivable" ? "in" : "out" });
    for (const transaction of bankTransactions.filter((item) => item.accountId === activeAccountId)) history.push({ id: transaction.id, date: transaction.date, description: transaction.description, amount: transaction.type === "deposit" ? transaction.amount : -transaction.amount, type: transaction.type === "deposit" ? "in" : "out" });
    return history.sort((a, b) => b.date.localeCompare(a.date));
  }, [activeAccountId, bankAccounts, bankTransactions, payments, purchases, sales]);

  async function handleCreateAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newAccountName.trim();
    const balance = Number(newAccountBalance || 0);
    if (!name || !Number.isFinite(balance) || balance < 0) return;
    try {
      setSaving(true);
      await createBankAccount(name, balance);
      setNewAccountName("");
      setNewAccountBalance("");
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "Não foi possível criar a conta.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(transactionAmount);
    if (!activeAccountId || !Number.isFinite(amount) || amount <= 0 || !transactionDescription.trim() || !transactionDate) return;
    try {
      setSaving(true);
      await createBankTransaction(activeAccountId, transactionType, amount, transactionDescription, transactionDate);
      setTransactionAmount("");
      setTransactionDescription("");
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "Não foi possível lançar a movimentação.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkAsPaid(paymentId: string) {
    const accountId = selectedPaymentAccounts[paymentId];
    if (!accountId) return;
    try {
      setSaving(true);
      await markPaymentAsPaid(paymentId, accountId);
      setSelectedPaymentAccounts((current) => {
        const next = { ...current };
        delete next[paymentId];
        return next;
      });
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "Não foi possível dar baixa no pagamento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-xl font-bold text-foreground sm:text-2xl">Financeiro</h1><p className="mt-1 text-sm text-muted-foreground">Receitas, pendências, contas bancárias e extratos sincronizados do Firestore.</p></div><span className="badge badge-success">Dados integrados</span></div>
      </motion.div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando dados financeiros…</p>}
      {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">Não foi possível carregar todos os dados financeiros.</p>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5"><StatCard title="Saldo real" value={BRL(realBalance)} icon={Wallet} index={0} /><StatCard title="Receita bruta" value={BRL(metrics.revenue)} icon={ArrowUpRight} index={1} /><StatCard title="Lucro bruto" value={BRL(metrics.gross)} change={`${metrics.margin.toFixed(1)}% margem`} changeType={metrics.gross >= 0 ? "positive" : "negative"} icon={Receipt} index={2} /><StatCard title="A receber" value={BRL(metrics.receivable)} icon={CalendarClock} index={3} /><StatCard title="A pagar" value={BRL(metrics.payable)} icon={ArrowDownLeft} index={4} /></div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="card-static p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-card-foreground">Fluxo de caixa · 6 meses</h3><p className="mt-1 text-xs text-muted-foreground">Entradas e saídas realizadas nas contas integradas.</p></div><Landmark className="h-5 w-5 text-primary" /></div><ResponsiveContainer width="100%" height={260}><AreaChart data={cashFlow}><defs><linearGradient id="cashIncoming" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(152,69%,40%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(152,69%,40%)" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 12%)" vertical={false} /><XAxis dataKey="label" stroke="hsl(0 0% 40%)" fontSize={11} /><YAxis stroke="hsl(0 0% 40%)" fontSize={11} tickFormatter={(value) => `R$ ${value}`} /><Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [BRL(value), name === "incoming" ? "Entradas" : "Saídas"]} /><Area type="monotone" dataKey="incoming" name="incoming" stroke="hsl(152,69%,40%)" fill="url(#cashIncoming)" /><Area type="monotone" dataKey="outgoing" name="outgoing" stroke="hsl(0,70%,55%)" fill="transparent" /></AreaChart></ResponsiveContainer><div className="grid grid-cols-2 gap-3 text-xs"><div className="rounded-lg bg-emerald-400/10 p-3 text-emerald-400">Entradas no período<strong className="mt-1 block text-sm">{BRL(cashFlow.reduce((sum, item) => sum + item.incoming, 0))}</strong></div><div className="rounded-lg bg-rose-400/10 p-3 text-rose-400">Saídas no período<strong className="mt-1 block text-sm">{BRL(cashFlow.reduce((sum, item) => sum + item.outgoing, 0))}</strong></div></div></div>
        <div className="card-static p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-card-foreground">Posição pendente</h3><p className="mt-1 text-xs text-muted-foreground">Parcelas ainda não liquidadas.</p></div><CreditCard className="h-5 w-5 text-primary" /></div><div className="space-y-5"><div><div className="flex justify-between text-sm"><span>Contas a receber</span><strong className="text-emerald-400">{BRL(metrics.receivable)}</strong></div><div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (metrics.receivable / Math.max(metrics.receivable, metrics.payable, 1)) * 100)}%` }} /></div><p className="mt-1 text-xs text-muted-foreground">{pendingReceivables.length} lançamento(s)</p></div><div><div className="flex justify-between text-sm"><span>Contas a pagar</span><strong className="text-rose-400">{BRL(metrics.payable)}</strong></div><div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-rose-500" style={{ width: `${Math.min(100, (metrics.payable / Math.max(metrics.receivable, metrics.payable, 1)) * 100)}%` }} /></div><p className="mt-1 text-xs text-muted-foreground">{pendingPayables.length} lançamento(s)</p></div><div className="rounded-lg bg-muted/40 p-3"><span className="text-xs text-muted-foreground">Saldo projetado das pendências</span><strong className={`mt-1 block text-lg ${metrics.receivable - metrics.payable >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{BRL(metrics.receivable - metrics.payable)}</strong></div></div></div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2"><div className="card-static overflow-x-auto p-5"><div className="mb-4 flex items-start justify-between"><div><h3 className="text-sm font-semibold text-card-foreground">Contas a receber</h3><p className="mt-1 text-xs text-muted-foreground">Pagamentos pendentes e vencidos do sistema original.</p></div><ArrowUpRight className="h-5 w-5 text-emerald-400" /></div><table className="table-pro min-w-[850px]"><thead><tr><th>Vencimento</th><th>Descrição</th><th>Método</th><th className="text-right">Valor</th><th>Status</th><th>Ação</th></tr></thead><tbody>{pendingReceivables.map((payment) => <tr key={payment.id}><td>{dateOnly(payment.dueDate)}</td><td className="font-medium text-card-foreground">{payment.description}</td><td className="text-muted-foreground">{paymentMethodLabel(payment.method)}</td><td className="text-right font-semibold text-emerald-400">{BRL(payment.amount)}</td><td><span className={`badge ${payment.status === "overdue" ? "badge-danger" : "badge-warning"}`}>{paymentStatusLabel(payment)}</span></td><td><div className="flex items-center gap-2"><select className="rounded-md border border-border bg-background px-2 py-1 text-xs" value={selectedPaymentAccounts[payment.id] ?? ""} onChange={(event) => setSelectedPaymentAccounts((current) => ({ ...current, [payment.id]: event.target.value }))}><option value="">Conta</option>{bankAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><button type="button" className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50" disabled={!selectedPaymentAccounts[payment.id] || saving} onClick={() => void handleMarkAsPaid(payment.id)}>Dar baixa</button></div></td></tr>)}{pendingReceivables.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum valor a receber pendente.</td></tr>}</tbody></table></div><div className="card-static overflow-x-auto p-5"><div className="mb-4 flex items-start justify-between"><div><h3 className="text-sm font-semibold text-card-foreground">Contas a pagar</h3><p className="mt-1 text-xs text-muted-foreground">Obrigações pendentes importadas do Firestore.</p></div><ArrowDownLeft className="h-5 w-5 text-rose-400" /></div><table className="table-pro min-w-[850px]"><thead><tr><th>Vencimento</th><th>Descrição</th><th>Origem</th><th className="text-right">Valor</th><th>Status</th><th>Ação</th></tr></thead><tbody>{pendingPayables.map((payment) => <tr key={payment.id}><td>{dateOnly(payment.dueDate)}</td><td className="font-medium text-card-foreground">{payment.description}</td><td className="text-muted-foreground">{payment.source ?? "—"}</td><td className="text-right font-semibold text-rose-400">{BRL(payment.amount)}</td><td><span className={`badge ${payment.status === "overdue" ? "badge-danger" : "badge-warning"}`}>{paymentStatusLabel(payment)}</span></td><td><div className="flex items-center gap-2"><select className="rounded-md border border-border bg-background px-2 py-1 text-xs" value={selectedPaymentAccounts[payment.id] ?? ""} onChange={(event) => setSelectedPaymentAccounts((current) => ({ ...current, [payment.id]: event.target.value }))}><option value="">Conta</option>{bankAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><button type="button" className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50" disabled={!selectedPaymentAccounts[payment.id] || saving} onClick={() => void handleMarkAsPaid(payment.id)}>Dar baixa</button></div></td></tr>)}{pendingPayables.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum valor a pagar pendente.</td></tr>}</tbody></table></div></div>

      <div className="card-static p-5"><div className="mb-4 flex items-start justify-between"><div><h3 className="text-sm font-semibold text-card-foreground">Contas bancárias</h3><p className="mt-1 text-xs text-muted-foreground">Saldos iniciais e atuais calculados a partir do extrato integrado.</p></div><Building2 className="h-5 w-5 text-primary" /></div><form onSubmit={(event) => void handleCreateAccount(event)} className="mb-5 flex flex-wrap gap-2 rounded-lg border border-border bg-muted/20 p-3"><input aria-label="Nome da nova conta" value={newAccountName} onChange={(event) => setNewAccountName(event.target.value)} placeholder="Nome da conta (ex.: Nubank)" className="min-w-[220px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" /><input aria-label="Saldo inicial" value={newAccountBalance} onChange={(event) => setNewAccountBalance(event.target.value)} type="number" min="0" step="0.01" placeholder="Saldo inicial" className="w-[150px] rounded-md border border-border bg-background px-3 py-2 text-sm" /><button type="submit" disabled={!newAccountName.trim() || saving} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">Adicionar conta</button></form><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{bankAccounts.map((account) => <button key={account.id} type="button" onClick={() => setSelectedAccountId(account.id)} className={`rounded-xl border p-4 text-left transition-colors ${activeAccountId === account.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"}`}><div className="flex items-center justify-between gap-2"><span className="font-medium text-card-foreground">{account.name}</span><Landmark className="h-4 w-4 text-muted-foreground" /></div><p className="mt-3 text-xl font-bold text-card-foreground">{BRL(accountBalance(account.id))}</p><p className="mt-1 text-xs text-muted-foreground">Saldo inicial: {BRL(account.initialBalance)}</p></button>)}{bankAccounts.length === 0 && <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">Nenhuma conta bancária encontrada no sistema original.</div>}</div></div>

      {activeAccount && <div className="card-static overflow-x-auto p-5"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-card-foreground">Extrato · {activeAccount.name}</h3><p className="mt-1 text-xs text-muted-foreground">Vendas, compras, pagamentos e lançamentos manuais vinculados à conta.</p></div><div className="text-right"><span className="text-xs text-muted-foreground">Saldo atual</span><strong className="mt-1 block text-lg text-card-foreground">{BRL(accountBalance(activeAccount.id))}</strong></div></div><form onSubmit={(event) => void handleCreateTransaction(event)} className="mb-5 flex flex-wrap gap-2 rounded-lg border border-border bg-muted/20 p-3"><select aria-label="Tipo de lançamento" value={transactionType} onChange={(event) => setTransactionType(event.target.value as "deposit" | "withdrawal")} className="rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="deposit">Entrada</option><option value="withdrawal">Saída</option></select><input aria-label="Valor do lançamento" value={transactionAmount} onChange={(event) => setTransactionAmount(event.target.value)} type="number" min="0.01" step="0.01" placeholder="Valor" className="w-[130px] rounded-md border border-border bg-background px-3 py-2 text-sm" /><input aria-label="Descrição do lançamento" value={transactionDescription} onChange={(event) => setTransactionDescription(event.target.value)} placeholder="Descrição" className="min-w-[220px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" /><input aria-label="Data do lançamento" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} type="date" className="rounded-md border border-border bg-background px-3 py-2 text-sm" /><button type="submit" disabled={!transactionAmount || !transactionDescription.trim() || saving} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">Lançar</button></form><table className="table-pro min-w-[650px]"><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th className="text-right">Valor</th></tr></thead><tbody>{accountHistory.map((item) => <tr key={item.id}><td>{dateOnly(item.date)}</td><td className="font-medium text-card-foreground">{item.description}</td><td><span className={`badge ${item.type === "in" ? "badge-success" : "badge-danger"}`}>{item.type === "in" ? "Entrada" : "Saída"}</span></td><td className={`text-right font-semibold ${item.type === "in" ? "text-emerald-400" : "text-rose-400"}`}>{BRL(item.amount)}</td></tr>)}{accountHistory.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Nenhum lançamento encontrado nessa conta.</td></tr>}</tbody></table></div>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><div className="card-pro p-4"><p className="text-xs text-muted-foreground">Despesas operacionais</p><p className="mt-1 text-xl font-bold text-card-foreground">{BRL(metrics.expensesTotal)}</p></div><div className="card-pro p-4"><p className="text-xs text-muted-foreground">Taxas Shopee</p><p className="mt-1 text-xl font-bold text-card-foreground">{BRL(metrics.shopeeFees)}</p></div><div className="card-pro p-4"><p className="text-xs text-muted-foreground">Investido em compras</p><p className="mt-1 text-xl font-bold text-card-foreground">{BRL(purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0))}</p></div><div className="card-pro p-4"><p className="text-xs text-muted-foreground">Estoque atual</p><p className="mt-1 text-xl font-bold text-card-foreground">{BRL(products.reduce((sum, product) => sum + product.averageCost * Math.max(0, product.currentStock), 0))}</p></div></div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><FileText className="h-4 w-4" /> Valores exibidos diretamente das coleções financeiras do Firestore, sem duplicar ou modificar seus lançamentos.</div>
    </div>
  );
}
