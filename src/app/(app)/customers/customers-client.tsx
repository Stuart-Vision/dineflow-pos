'use client';

import { CalendarDays, Crown, Plus, Search, ShieldAlert, Star, Users } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { useSessionUser } from '@/components/providers/session-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SkeletonTable } from '@/components/ui/skeleton';
import { PERMISSIONS } from '@/constants/permissions';
import { apiGet, apiPatch, apiPost, ApiRequestError } from '@/lib/api/client';
import { formatMoney } from '@/lib/money';

interface Customer {
  _id: string; name: string; phone: string; email?: string; address?: string; birthday?: string | null;
  notes?: string | null; tags: string[]; segment: string; membershipTier: string; loyaltyPointsBalance: number;
  totalSpentMinor: number; totalOrders: number; lastVisitAt?: string | null; isBlacklisted: boolean;
}
const emptyForm = { name: '', phone: '', email: '', address: '', birthday: '', notes: '', tags: '' };
const tierTone: Record<string, 'muted' | 'info' | 'warning' | 'success'> = { bronze: 'muted', silver: 'info', gold: 'warning', platinum: 'success' };

export function CustomersClient() {
  const user = useSessionUser();
  const canManage = user.permissions.includes(PERMISSIONS.CUSTOMER_MANAGE);
  const canBlacklist = user.permissions.includes(PERMISSIONS.CUSTOMER_BLACKLIST);
  const [items, setItems] = React.useState<Customer[] | null>(null);
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Customer | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const suffix = search.trim() ? `?pageSize=100&search=${encodeURIComponent(search)}` : '?pageSize=100';
    setItems(await apiGet<Customer[]>(`/api/customers${suffix}`));
  }, [search]);
  React.useEffect(() => { const timer = setTimeout(() => void load(), 200); return () => clearTimeout(timer); }, [load]);

  function startEdit(customer?: Customer) {
    setSelected(customer ?? null);
    setForm(customer ? {
      name: customer.name, phone: customer.phone, email: customer.email ?? '', address: customer.address ?? '',
      birthday: customer.birthday?.slice(0, 10) ?? '', notes: customer.notes ?? '', tags: customer.tags.join(', '),
    } : emptyForm);
    setOpen(true);
  }
  async function save() {
    setSaving(true);
    try {
      const body = { ...form, birthday: form.birthday || null, notes: form.notes || null, tags: form.tags.split(',').map((v) => v.trim()).filter(Boolean) };
      if (selected) await apiPatch(`/api/customers/${selected._id}`, body); else await apiPost('/api/customers', body);
      setOpen(false); await load(); toast.success(selected ? 'Customer updated' : 'Customer added');
    } catch (error) { toast.error(error instanceof ApiRequestError ? error.message : 'Could not save customer.'); }
    finally { setSaving(false); }
  }
  async function toggleBlacklist(customer: Customer) {
    try {
      await apiPatch(`/api/customers/${customer._id}/blacklist`, { isBlacklisted: !customer.isBlacklisted, reason: customer.isBlacklisted ? null : 'Flagged for manager review' });
      await load(); toast.success(customer.isBlacklisted ? 'Customer restored' : 'Customer access restricted');
    } catch (error) { toast.error(error instanceof ApiRequestError ? error.message : 'Could not update customer.'); }
  }

  const totalSpend = items?.reduce((sum, item) => sum + item.totalSpentMinor, 0) ?? 0;
  const vipCount = items?.filter((item) => ['vip', 'high_spender'].includes(item.segment)).length ?? 0;
  return <div className="space-y-5">
    <PageHeader description="Customer profiles, visit history, segments and relationship notes." actions={canManage ? <Button onClick={() => startEdit()}><Plus className="size-4" />Add customer</Button> : undefined} />
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric icon={Users} label="Customer base" value={String(items?.length ?? '—')} />
      <Metric icon={Crown} label="VIP & high spenders" value={String(vipCount)} />
      <Metric icon={Star} label="Recorded lifetime value" value={formatMoney(totalSpend)} />
    </div>
    <Card>
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="font-semibold">Customer directory</h3><p className="text-xs text-muted-foreground">Profiles ranked and tagged for faster service.</p></div>
        <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone or email" /></div>
      </div>
      <CardContent className="p-0">
        {!items ? <div className="p-5"><SkeletonTable rows={6} columns={5} /></div> :
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/45 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Segment</th><th className="px-4 py-3">Visits</th><th className="px-4 py-3">Lifetime spend</th><th className="px-4 py-3">Last visit</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
          <tbody>{items.map((c) => <tr key={c._id} className="border-t hover:bg-muted/25"><td className="px-4 py-3"><button className="text-left" onClick={() => canManage && startEdit(c)}><span className="font-medium">{c.name}</span>{c.isBlacklisted && <ShieldAlert className="ml-1 inline size-3.5 text-destructive" />}<span className="block text-xs text-muted-foreground">{c.phone} · {c.email || 'No email'}</span></button></td><td className="px-4 py-3"><div className="flex flex-wrap gap-1"><Badge variant={tierTone[c.membershipTier] ?? 'muted'}>{c.membershipTier}</Badge><Badge variant="outline">{c.segment.replace('_', ' ')}</Badge></div></td><td className="px-4 py-3 tabular-nums">{c.totalOrders}</td><td className="px-4 py-3 font-medium tabular-nums">{formatMoney(c.totalSpentMinor)}</td><td className="px-4 py-3 text-muted-foreground">{c.lastVisitAt ? new Date(c.lastVisitAt).toLocaleDateString() : 'New'}</td><td className="px-4 py-3 text-right">{canBlacklist && <Button size="sm" variant="ghost" onClick={() => void toggleBlacklist(c)}>{c.isBlacklisted ? 'Restore' : 'Restrict'}</Button>}</td></tr>)}</tbody></table></div>}
      </CardContent>
    </Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{selected ? 'Edit customer profile' : 'Add customer'}</DialogTitle></DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Full name"><Input value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} /></Field><Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({...form,phone:e.target.value})} /></Field><Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} /></Field><Field label="Birthday"><Input type="date" value={form.birthday} onChange={(e) => setForm({...form,birthday:e.target.value})} /></Field><div className="sm:col-span-2"><Field label="Address"><Input value={form.address} onChange={(e) => setForm({...form,address:e.target.value})} /></Field></div><div className="sm:col-span-2"><Field label="Tags"><Input value={form.tags} onChange={(e) => setForm({...form,tags:e.target.value})} placeholder="regular, family, terrace" /></Field></div><div className="sm:col-span-2"><Field label="Service notes"><Textarea value={form.notes} onChange={(e) => setForm({...form,notes:e.target.value})} /></Field></div></div>
      <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={saving} disabled={!form.name || !form.phone} onClick={() => void save()}>Save profile</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
}
function Metric({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) { return <Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon className="size-5" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-semibold">{value}</p></div></CardContent></Card>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>; }
