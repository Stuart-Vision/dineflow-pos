'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { addDays, format, isSameDay, parseISO, startOfWeek } from 'date-fns';
import { CalendarDays, CalendarPlus, Clock, Users } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { useSessionUser } from '@/components/providers/session-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RESERVATION_STATUS, type ReservationStatus } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { ApiRequestError, apiGet, apiPatch, apiPost } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { ReservationListItem } from '@/services/reservation-service';

const STATUS_BADGE: Record<ReservationStatus, 'success' | 'warning' | 'destructive' | 'info' | 'muted'> = {
  pending: 'warning',
  confirmed: 'info',
  seated: 'success',
  completed: 'muted',
  cancelled: 'destructive',
  no_show: 'destructive',
};

/** Statuses a reservation can be moved to from its current one. */
const NEXT_STATUSES: Record<ReservationStatus, ReservationStatus[]> = {
  pending: [RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.CANCELLED],
  confirmed: [RESERVATION_STATUS.SEATED, RESERVATION_STATUS.NO_SHOW, RESERVATION_STATUS.CANCELLED],
  seated: [RESERVATION_STATUS.COMPLETED],
  completed: [],
  cancelled: [],
  no_show: [],
};

interface AvailableTable {
  id: string;
  label: string;
  capacity: number;
}

export function ReservationsClient() {
  const user = useSessionUser();
  const canManage = user.permissions.includes(PERMISSIONS.RESERVATION_MANAGE);

  const [reservations, setReservations] = React.useState<ReservationListItem[] | null>(null);
  const [weekStart, setWeekStart] = React.useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDay, setSelectedDay] = React.useState(() => new Date());
  const [createOpen, setCreateOpen] = React.useState(false);
  const [availableTables, setAvailableTables] = React.useState<AvailableTable[]>([]);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '19:00',
    partySize: '2',
    durationMinutes: '90',
    tableId: '',
    specialRequests: '',
  });

  const load = React.useCallback(async () => {
    const data = await apiGet<ReservationListItem[]>('/api/reservations');
    setReservations(data);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Re-probe availability whenever the slot or party size changes.
  React.useEffect(() => {
    if (!createOpen) return;
    const iso = new Date(`${form.date}T${form.time}`).toISOString();
    const params = new URLSearchParams({ availableAt: iso, durationMinutes: form.durationMinutes, partySize: form.partySize });
    void apiGet<{ tables: AvailableTable[] }>(`/api/reservations?${params}`)
      .then((r) => setAvailableTables(r.tables))
      .catch(() => setAvailableTables([]));
  }, [createOpen, form.date, form.time, form.partySize, form.durationMinutes]);

  async function submit() {
    setSaving(true);
    try {
      await apiPost('/api/reservations', {
        guestName: form.guestName,
        guestPhone: form.guestPhone,
        guestEmail: form.guestEmail || undefined,
        reservationDate: new Date(`${form.date}T${form.time}`).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        partySize: Number(form.partySize),
        tableId: form.tableId || null,
        specialRequests: form.specialRequests || null,
      });
      setCreateOpen(false);
      setForm({ ...form, guestName: '', guestPhone: '', guestEmail: '', specialRequests: '', tableId: '' });
      await load();
      toast.success('Reservation booked');
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not book that reservation.');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(reservation: ReservationListItem, status: ReservationStatus) {
    try {
      await apiPatch(`/api/reservations/${reservation.id}`, {
        status,
        cancelReason: status === RESERVATION_STATUS.CANCELLED ? 'Cancelled by the restaurant' : undefined,
      });
      await load();
      toast.success(`${reservation.guestName} marked ${status.replace(/_/g, ' ')}`);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not update that reservation.');
    }
  }

  const columns = React.useMemo<ColumnDef<ReservationListItem, unknown>[]>(
    () => [
      {
        id: 'guest',
        header: 'Guest',
        accessorFn: (row) => row.guestName,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.guestName}</p>
            <p className="text-xs text-muted-foreground">{row.original.guestPhone}</p>
          </div>
        ),
      },
      {
        id: 'when',
        header: 'Date & time',
        accessorFn: (row) => row.reservationDate,
        cell: ({ row }) => (
          <div>
            <p>{format(parseISO(row.original.reservationDate), 'EEE, MMM d')}</p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(row.original.reservationDate), 'HH:mm')} · {row.original.durationMinutes} min
            </p>
          </div>
        ),
      },
      { id: 'partySize', header: 'Guests', accessorFn: (row) => row.partySize, meta: { numeric: true } },
      {
        id: 'table',
        header: 'Table',
        accessorFn: (row) => row.tableLabel ?? '—',
        cell: ({ row }) => row.original.tableLabel ?? <span className="text-muted-foreground">Unassigned</span>,
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => row.status,
        cell: ({ row }) => (
          <Badge variant={STATUS_BADGE[row.original.status]} size="sm">
            {row.original.status.replace(/_/g, ' ')}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const next = NEXT_STATUSES[row.original.status];
          if (!canManage || next.length === 0) return null;
          return (
            <div className="flex justify-end gap-1.5">
              {next.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={status === RESERVATION_STATUS.CANCELLED || status === RESERVATION_STATUS.NO_SHOW ? 'ghost' : 'outline'}
                  onClick={() => changeStatus(row.original, status)}
                >
                  {status === RESERVATION_STATUS.CONFIRMED && 'Confirm'}
                  {status === RESERVATION_STATUS.SEATED && 'Seat'}
                  {status === RESERVATION_STATUS.COMPLETED && 'Complete'}
                  {status === RESERVATION_STATUS.CANCELLED && 'Cancel'}
                  {status === RESERVATION_STATUS.NO_SHOW && 'No-show'}
                </Button>
              ))}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManage],
  );

  if (!reservations) return <SkeletonTable rows={8} columns={5} />;

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayReservations = reservations
    .filter((r) => isSameDay(parseISO(r.reservationDate), selectedDay))
    .sort((a, b) => a.reservationDate.localeCompare(b.reservationDate));

  const upcoming = reservations.filter(
    (r) => parseISO(r.reservationDate) >= new Date() && (r.status === 'pending' || r.status === 'confirmed'),
  );

  return (
    <div className="space-y-5">
      <PageHeader
        description="Book, confirm and seat parties. Conflicting table bookings are rejected automatically."
        actions={
          canManage && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <CalendarPlus className="size-3.5" />
              New reservation
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Tabs defaultValue="calendar">
          <TabsList variant="underline">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="list">All reservations</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">{format(weekStart, 'MMMM yyyy')}</p>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                    This week
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                    Next
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map((day) => {
                  const count = reservations.filter((r) => isSameDay(parseISO(r.reservationDate), day)).length;
                  const isSelected = isSameDay(day, selectedDay);
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors',
                        isSelected ? 'border-primary bg-accent' : 'border-border hover:bg-muted',
                      )}
                    >
                      <span className="text-[11px] text-muted-foreground">{format(day, 'EEE')}</span>
                      <span className="text-sm font-semibold">{format(day, 'd')}</span>
                      {count > 0 ? (
                        <Badge variant="info" size="sm">
                          {count}
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60">—</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold">{format(selectedDay, 'EEEE, MMMM d')}</p>
                <p className="text-xs text-muted-foreground">
                  {dayReservations.length} reservation{dayReservations.length === 1 ? '' : 's'}
                </p>
              </div>
              {dayReservations.length === 0 ? (
                <EmptyState icon={CalendarDays} title="Nothing booked" description="This day has no reservations yet." />
              ) : (
                <ul className="divide-y divide-border">
                  {dayReservations.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <span className="flex w-16 shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
                        <Clock className="size-3.5 text-muted-foreground" />
                        {format(parseISO(r.reservationDate), 'HH:mm')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.guestName}</p>
                        <p className="text-xs text-muted-foreground">
                          <Users className="mr-1 inline size-3" />
                          {r.partySize} guests {r.tableLabel ? `· Table ${r.tableLabel}` : '· No table yet'}
                        </p>
                        {r.specialRequests && <p className="truncate text-xs text-info">{r.specialRequests}</p>}
                      </div>
                      <Badge variant={STATUS_BADGE[r.status]} size="sm">
                        {r.status.replace(/_/g, ' ')}
                      </Badge>
                      {canManage &&
                        NEXT_STATUSES[r.status].slice(0, 1).map((status) => (
                          <Button key={status} size="sm" variant="outline" onClick={() => changeStatus(r, status)}>
                            {status === RESERVATION_STATUS.CONFIRMED && 'Confirm'}
                            {status === RESERVATION_STATUS.SEATED && 'Seat'}
                            {status === RESERVATION_STATUS.COMPLETED && 'Complete'}
                          </Button>
                        ))}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <DataTable
              columns={columns}
              data={reservations}
              searchPlaceholder="Search guest name or phone…"
              globalFilterFn={(row, q) =>
                row.guestName.toLowerCase().includes(q) || row.guestPhone.toLowerCase().includes(q)
              }
              emptyIcon={CalendarDays}
              emptyTitle="No reservations"
              emptyDescription="Bookings will appear here as they come in."
              csvFileName="dineflow-reservations"
            />
          </TabsContent>
        </Tabs>

        <aside className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Upcoming</h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming reservations.</p>
          ) : (
            <ul className="space-y-2.5">
              {upcoming.slice(0, 8).map((r) => (
                <li key={r.id} className="rounded-lg border border-border p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{r.guestName}</p>
                    <Badge variant={STATUS_BADGE[r.status]} size="sm">
                      {r.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(r.reservationDate), 'MMM d, HH:mm')} · {r.partySize} guests
                  </p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>New reservation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="res-name" required>
                Guest name
              </Label>
              <Input id="res-name" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-phone" required>
                Contact number
              </Label>
              <Input id="res-phone" value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-email">Email</Label>
              <Input id="res-email" type="email" value={form.guestEmail} onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-party" required>
                Party size
              </Label>
              <Input id="res-party" type="number" min={1} max={40} value={form.partySize} onChange={(e) => setForm({ ...form, partySize: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-date" required>
                Date
              </Label>
              <Input id="res-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-time" required>
                Time
              </Label>
              <Input id="res-time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-duration">Duration</Label>
              <Select value={form.durationMinutes} onValueChange={(v) => setForm({ ...form, durationMinutes: v })}>
                <SelectTrigger id="res-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['60', '90', '120', '150', '180'].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-table">Table</Label>
              <Select value={form.tableId || 'none'} onValueChange={(v) => setForm({ ...form, tableId: v === 'none' ? '' : v })}>
                <SelectTrigger id="res-table">
                  <SelectValue placeholder="Assign later" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Assign later</SelectItem>
                  {availableTables.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label} · seats {t.capacity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {availableTables.length} table{availableTables.length === 1 ? '' : 's'} free in this slot
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="res-notes">Special requests</Label>
              <Textarea
                id="res-notes"
                rows={2}
                placeholder="Window seat, high chair, allergy note…"
                value={form.specialRequests}
                onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving} disabled={!form.guestName.trim() || !form.guestPhone.trim()}>
              Book reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
