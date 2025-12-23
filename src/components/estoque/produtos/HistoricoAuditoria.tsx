import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function HistoricoAuditoria({ targetId, module }: { targetId: string; module: string }) {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("security_audit_log")
        .select("*")
        .eq("event_description", `${module}:${targetId}`)
        .order("created_at", { ascending: false })
        .limit(100);
      setRows(data ?? []);
    })();
  }, [targetId, module]);

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-2 text-left">Quando</th>
            <th className="p-2 text-left">Ação</th>
            <th className="p-2 text-left">Usuário</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
              <td className="p-2">{r.event_type}</td>
              <td className="p-2">{r.user_id || "-"}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="p-4 text-center text-muted-foreground">
                Sem eventos de auditoria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
