
-- supabase/migrations/YYYYMMDDHHMMSS_add_upsert_budget_function.sql

CREATE OR REPLACE FUNCTION upsert_budget(
    p_family_id uuid,
    p_user_id uuid,
    p_category_id uuid,
    p_member_id uuid,
    p_year integer,
    p_month integer,
    p_amount numeric,
    p_currency text
)
RETURNS void AS $$
BEGIN
    INSERT INTO budgets (family_id, user_id, category_id, member_id, year, month, amount, currency)
    VALUES (p_family_id, p_user_id, p_category_id, p_member_id, p_year, p_month, p_amount, p_currency)
    ON CONFLICT (family_id, category_id, member_id, year, month)
    DO UPDATE SET amount = p_amount;
END;
$$ LANGUAGE plpgsql;
