import { useEffect, useState } from 'react';
import { http } from '../../../services/http';
interface Row { id:string; kind:string; status:string; provider?:string; attempts:number; created_at:string; error?:string; attempt_history?:Array<{attempt:number;status:string;provider?:string;error?:string;at:string}> }
export function BookingEmailStatus({reservationId, siteId}:{reservationId:string;siteId:string}) {
  const [rows,setRows] = useState<Row[]>([]); const [error,setError] = useState(''); const [busy,setBusy] = useState(false); const [preview,setPreview] = useState<string | null>(null);
  const path = `/notifications/bookings/${encodeURIComponent(reservationId)}?siteId=${encodeURIComponent(siteId)}`;
  useEffect(() => { let active=true; http.get<{items:Row[]}>(path).then(r=>{if(active)setRows(r.items);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;}; },[path]);
  async function resend() { setBusy(true);setError('');try {const r=await http.post<{items:Row[]}>(path,{});setRows(r.items);}catch(e){setError(e instanceof Error?e.message:'Unable to resend.');}finally{setBusy(false);} }
  async function view() {try {const r=await http.get<{preview:string}>(path+'&include_preview=1');setPreview(r.preview);}catch(e){setError(e instanceof Error?e.message:'Unable to preview.');}}
  return <section className="border-t border-outline-variant/20 pt-4 space-y-3"><h3 className="font-semibold">Confirmation email</h3><p className="text-sm text-secondary">Accepted means submitted to the provider. Delivered means the recipient’s mail server accepted it; it does not confirm the email was read.</p>{error&&<p role="alert">{error}</p>}{rows.length===0&&!error&&<p>No email record yet.</p>}
    <ul>{rows.map(r=><li key={r.id} className="text-sm py-1">{r.kind}: <strong>{r.status}</strong> · {r.provider || 'unassigned'} · {r.attempts} attempt(s){r.error&&` · ${r.error}`}<ul>{r.attempt_history?.map(a=><li key={a.attempt} className="text-secondary pl-3">Attempt {a.attempt}: {a.status} · {a.provider ?? 'unassigned'}{a.error&&` · ${a.error}`}</li>)}</ul></li>)}</ul>
    <button className="text-primary underline mr-4" onClick={()=>void view()}>Preview email</button><button className="text-primary underline" onClick={()=>void resend()} disabled={busy||['preparing','sending','unknown'].includes(rows[0]?.status)}>Resend email</button>
    {preview&&<iframe title="Booking email preview" srcDoc={preview} sandbox="" className="w-full h-[620px] border" />}
  </section>;
}
