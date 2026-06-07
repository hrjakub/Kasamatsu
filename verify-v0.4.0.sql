-- Verify that the Kasamatsu v0.4.0 database upgrade is installed.

select
  to_regclass('public.waitlist_entries') is not null as waitlist_table_installed,
  to_regprocedure('public.create_waitlist_request(date,time without time zone,integer,text,text,text,text,text,text)') is not null
    as waitlist_function_installed,
  to_regprocedure('public.get_staff_calendar(date,date)') is not null
    as calendar_function_installed,
  to_regprocedure('public.promote_waitlist_entry(uuid,uuid)') is not null
    as promotion_function_installed;

select * from public.get_staff_calendar(current_date, current_date + 6);
