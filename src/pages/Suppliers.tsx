import { motion } from "framer-motion";
import { Factory, Mail, Phone } from "lucide-react";
import { useFirebaseData } from "@/hooks/useFirebaseData";

export default function Suppliers() {
  const { suppliers, isLoading, error } = useFirebaseData();
  return <div className="space-y-6"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><h1 className="text-xl sm:text-2xl font-bold text-foreground">Fornecedores</h1><p className="text-sm text-muted-foreground mt-1">Cadastros sincronizados com o Firestore</p></motion.div>{isLoading && <p className="text-sm text-muted-foreground">Carregando fornecedores…</p>}{error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">Não foi possível carregar os fornecedores.</p>}<div className="grid gap-3 md:grid-cols-2">{suppliers.map((s) => <div key={s.id} className="card-pro p-5"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Factory className="h-5 w-5 text-primary" /></div><div className="min-w-0"><p className="font-semibold text-card-foreground">{s.name}</p><p className="mt-1 text-xs text-muted-foreground">{s.document || "Documento não informado"}</p>{s.phone && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Phone className="h-3.5 w-3.5" />{s.phone}</p>}{s.email && <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" />{s.email}</p>}</div></div></div>)}</div>{!isLoading && suppliers.length === 0 && <div className="card-pro p-8 text-center text-sm text-muted-foreground">Nenhum fornecedor encontrado.</div>}</div>;
}

