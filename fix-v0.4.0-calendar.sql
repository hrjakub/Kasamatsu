-- One-time repair for the v0.4.0 staff calendar function.

create or replace function public.get_staff_calendar(
  p_start_date date,
  p_end_date date
)
returns table (
  reservation_date date,
  reservation_count bigint,
  guest_count bigint,
  booked_table_count bigint,
  waiting_count bigint,
  table_bookings jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with calendar_days as (
    select generated_day::date as day
    from generate_series(p_start_date, p_end_date, interval '1 day') as generated(generated_day)
  ),
  reservation_totals as (
    select
      r.reservation_date,
      count(*)::bigint as reservation_count,
      coalesce(sum(r.guests), 0)::bigint as guest_count,
      count(distinct r.table_id)::bigint as booked_table_count,
      jsonb_agg(
        jsonb_build_object(
          'table_code', t.table_code,
          'time', r.reservation_time,
          'guests', r.guests,
          'status', r.status
        )
        order by r.reservation_time, t.table_code
      ) as table_bookings
    from public.reservations r
    join public.restaurant_tables t on t.id = r.table_id
    where r.reservation_date between p_start_date and p_end_date
      and r.status in ('confirmed', 'requested', 'seated')
    group by r.reservation_date
  ),
  waiting_totals as (
    select
      w.requested_date,
      count(*)::bigint as waiting_count
    from public.waitlist_entries w
    where w.requested_date between p_start_date and p_end_date
      and w.status in ('waiting', 'notified')
    group by w.requested_date
  )
  select
    d.day as reservation_date,
    coalesce(r.reservation_count, 0::bigint) as reservation_count,
    coalesce(r.guest_count, 0::bigint) as guest_count,
    coalesce(r.booked_table_count, 0::bigint) as booked_table_count,
    coalesce(w.waiting_count, 0::bigint) as waiting_count,
    coalesce(r.table_bookings, '[]'::jsonb) as table_bookings
  from calendar_days d
  left join reservation_totals r on r.reservation_date = d.day
  left join waiting_totals w on w.requested_date = d.day
  order by d.day;
$$;

revoke all on function public.get_staff_calendar(date, date) from public, anon, authenticated;
grant execute on function public.get_staff_calendar(date, date) to service_role;

select * from public.get_staff_calendar(current_date, current_date + 6);
