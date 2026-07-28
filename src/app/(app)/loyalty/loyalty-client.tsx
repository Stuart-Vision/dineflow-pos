'use client';
import { Award, Gift, Medal, Sparkles } from 'lucide-react';
import * as React from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SkeletonStatCard } from '@/components/ui/skeleton';
import { apiGet } from '@/lib/api/client';
import type { MembershipTier } from '@/constants/enums';

interface Overview { totalMembers:number; pointsOutstanding:number; pointsIssuedThisMonth:number; pointsRedeemedThisMonth:number; tierBreakdown:Array<{tier:MembershipTier;members:number;discountPercent:number;minLifetimePoints:number}>; topMembers:Array<{name:string;tier:MembershipTier;points:number;lifetimePoints:number}>; recentActivity:Array<{customerName:string;type:string;points:number;description:string;createdAt:string}> }
export function LoyaltyClient() {
  const [data,setData]=React.useState<Overview|null>(null);
  React.useEffect(()=>{void apiGet<Overview>('/api/loyalty').then(setData)},[]);
  if(!data) return <div className="space-y-5"><PageHeader description="Membership tiers, rewards and points activity."/><div className="grid gap-3 sm:grid-cols-4">{[1,2,3,4].map(i=><SkeletonStatCard key={i}/>)}</div></div>;
  return <div className="space-y-5"><PageHeader description="Membership tiers, rewards and points activity."/>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Mini icon={Award} label="Members" value={data.totalMembers.toLocaleString()}/><Mini icon={Sparkles} label="Points outstanding" value={data.pointsOutstanding.toLocaleString()}/><Mini icon={Gift} label="Issued this month" value={`+${data.pointsIssuedThisMonth.toLocaleString()}`}/><Mini icon={Medal} label="Redeemed this month" value={data.pointsRedeemedThisMonth.toLocaleString()}/></div>
    <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]"><Card><CardHeader><CardTitle>Membership tiers</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{data.tierBreakdown.map(t=><div key={t.tier} className="rounded-lg border p-4"><div className="flex items-center justify-between"><Badge variant={t.tier==='gold'?'warning':t.tier==='platinum'?'success':'muted'}>{t.tier}</Badge><span className="text-2xl font-semibold">{t.members}</span></div><p className="mt-3 text-xs text-muted-foreground">{t.minLifetimePoints.toLocaleString()} lifetime points · {t.discountPercent}% member discount</p><Progress className="mt-2" value={data.totalMembers ? (t.members/data.totalMembers)*100 : 0}/></div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Top members</CardTitle></CardHeader><CardContent className="space-y-1">{data.topMembers.map((m,i)=><div key={m.name} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/40"><span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i+1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.lifetimePoints.toLocaleString()} lifetime points</p></div><Badge variant="outline">{m.tier}</Badge><span className="text-sm font-semibold tabular-nums">{m.points.toLocaleString()}</span></div>)}</CardContent></Card></div>
    <Card><CardHeader><CardTitle>Recent points activity</CardTitle></CardHeader><CardContent className="divide-y p-0">{data.recentActivity.map(a=><div key={`${a.customerName}-${a.createdAt}`} className="flex items-center gap-3 px-5 py-3"><div className={`flex size-8 items-center justify-center rounded-lg ${a.points>=0?'bg-success/10 text-success':'bg-warning/10 text-warning'}`}><Gift className="size-4"/></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{a.customerName}</p><p className="truncate text-xs text-muted-foreground">{a.description} · {new Date(a.createdAt).toLocaleDateString()}</p></div><span className={`font-semibold tabular-nums ${a.points>=0?'text-success':'text-warning'}`}>{a.points>0?'+':''}{a.points}</span></div>)}</CardContent></Card>
  </div>
}
function Mini({icon:Icon,label,value}:{icon:typeof Award;label:string;value:string|number}){return <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div><Icon className="size-5 text-primary"/></CardContent></Card>}
