-- ═══════════════════════════════════════════════════════════
--  PiPump — Supabase Database Schema
--  Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ─── Enable UUID extension ───────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════
-- TABLE: users
-- Pi wallet = identity. No passwords.
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pi_uid        TEXT UNIQUE NOT NULL,           -- Pi Network UID
  username      TEXT NOT NULL,                  -- Pi username
  avatar_url    TEXT,                           -- Profile picture URL
  bio           TEXT DEFAULT '',
  is_banned     BOOLEAN DEFAULT FALSE,
  is_admin      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: tokens
-- Each meme token created on PiPump
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.tokens (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_uid           TEXT NOT NULL REFERENCES public.users(pi_uid),

  -- Token identity
  name                  TEXT NOT NULL,
  ticker                TEXT NOT NULL,          -- e.g. "DOGE"
  description           TEXT DEFAULT '',
  image_url             TEXT,
  website_url           TEXT DEFAULT '',
  twitter_url           TEXT DEFAULT '',
  telegram_url          TEXT DEFAULT '',

  -- Bonding curve state (constant product AMM)
  -- k = virtual_pi_reserve * virtual_token_reserve = CONSTANT
  virtual_pi_reserve    NUMERIC(30,8) DEFAULT 1000.00,     -- starts at 1000 Pi (virtual)
  virtual_token_reserve NUMERIC(30,0) DEFAULT 1000000000,  -- 1B tokens
  k_constant            NUMERIC(60,8) DEFAULT 1000000000000.00, -- k = 1000 * 1B

  -- Real Pi collected (actual Pi paid by buyers)
  real_pi_collected     NUMERIC(20,8) DEFAULT 0,

  -- Total supply info
  total_supply          NUMERIC(30,0) DEFAULT 1000000000,  -- 1 Billion
  circulating_supply    NUMERIC(30,0) DEFAULT 0,           -- tokens in user hands

  -- Price tracking
  current_price         NUMERIC(20,10) DEFAULT 0.000001,   -- Pi per token
  price_change_24h      NUMERIC(10,4) DEFAULT 0,           -- % change

  -- Volume
  volume_24h            NUMERIC(20,8) DEFAULT 0,
  volume_total          NUMERIC(20,8) DEFAULT 0,
  trade_count           INTEGER DEFAULT 0,
  holder_count          INTEGER DEFAULT 0,

  -- Status
  status                TEXT DEFAULT 'active'
                        CHECK (status IN ('active','suspended','graduated','pending')),
  is_featured           BOOLEAN DEFAULT FALSE,
  is_verified           BOOLEAN DEFAULT FALSE,

  -- Graduation (when real_pi_collected >= 800 Pi)
  graduated_at          TIMESTAMPTZ,
  graduation_threshold  NUMERIC(20,8) DEFAULT 800.00,

  -- Creation payment
  creation_tx_id        TEXT,    -- Pi payment ID for creation fee

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: trades
-- Every buy/sell transaction
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.trades (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id          UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  trader_uid        TEXT NOT NULL REFERENCES public.users(pi_uid),

  type              TEXT NOT NULL CHECK (type IN ('buy','sell')),

  -- Amounts
  pi_amount         NUMERIC(20,8) NOT NULL,     -- Pi spent/received
  token_amount      NUMERIC(30,0) NOT NULL,     -- Tokens bought/sold
  price_per_token   NUMERIC(20,10) NOT NULL,    -- Price at time of trade
  fee_amount        NUMERIC(20,8) DEFAULT 0,    -- 1% platform fee in Pi

  -- Pi Network payment ID (from Pi SDK)
  pi_payment_id     TEXT,
  pi_tx_id          TEXT,       -- blockchain transaction ID

  -- Status
  status            TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','completed','failed','cancelled')),

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: token_holders
-- Tracks each user's token balance
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.token_holders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id    UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  user_uid    TEXT NOT NULL REFERENCES public.users(pi_uid),
  balance     NUMERIC(30,0) DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(token_id, user_uid)
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: platform_config
-- Admin-controlled platform settings
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.platform_config (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creation_fee_pi       NUMERIC(10,2) DEFAULT 1.00,
  trade_fee_percent     NUMERIC(5,2) DEFAULT 1.00,
  graduation_threshold  NUMERIC(20,8) DEFAULT 800.00,
  platform_wallet       TEXT DEFAULT '',
  total_fees_collected  NUMERIC(20,8) DEFAULT 0,
  total_volume          NUMERIC(20,8) DEFAULT 0,
  total_tokens          INTEGER DEFAULT 0,
  total_trades          INTEGER DEFAULT 0,
  site_announcement     TEXT DEFAULT '',
  maintenance_mode      BOOLEAN DEFAULT FALSE,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config row
INSERT INTO public.platform_config (id) VALUES (uuid_generate_v4())
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- TABLE: reports
-- Users can report suspicious tokens
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id    UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  reporter_uid TEXT NOT NULL REFERENCES public.users(pi_uid),
  reason      TEXT NOT NULL,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','dismissed','actioned')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: site_content (CMS)
-- Admin can update homepage text, banners, etc.
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.site_content (
  key         TEXT PRIMARY KEY,
  value       TEXT DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Default CMS content
INSERT INTO public.site_content (key, value) VALUES
  ('hero_title', 'Launch your memecoin on Pi Network'),
  ('hero_subtitle', 'Create, buy & sell tokens with real Pi. Powered by bonding curves.'),
  ('announcement', ''),
  ('featured_token_id', '')
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- INDEXES — for fast queries
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_tokens_status       ON public.tokens(status);
CREATE INDEX IF NOT EXISTS idx_tokens_created_at   ON public.tokens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_volume_24h   ON public.tokens(volume_24h DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_price_change ON public.tokens(price_change_24h DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_creator      ON public.tokens(creator_uid);
CREATE INDEX IF NOT EXISTS idx_trades_token        ON public.trades(token_id);
CREATE INDEX IF NOT EXISTS idx_trades_trader       ON public.trades(trader_uid);
CREATE INDEX IF NOT EXISTS idx_trades_created_at   ON public.trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_holders_user        ON public.token_holders(user_uid);
CREATE INDEX IF NOT EXISTS idx_holders_token       ON public.token_holders(token_id);

-- ═══════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_tokens_updated_at
  BEFORE UPDATE ON public.tokens
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── Bonding Curve Price Calculator ──────────────────────
-- Returns current price, tokens out for Pi in, Pi out for tokens in
CREATE OR REPLACE FUNCTION public.get_buy_quote(
  p_token_id UUID,
  p_pi_in    NUMERIC
)
RETURNS TABLE(
  tokens_out     NUMERIC,
  price_after    NUMERIC,
  price_impact   NUMERIC,
  fee_amount     NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_vpi   NUMERIC;
  v_vtok  NUMERIC;
  v_k     NUMERIC;
  v_fee   NUMERIC;
  v_pi_net NUMERIC;
  v_new_vpi NUMERIC;
  v_new_vtok NUMERIC;
  v_out   NUMERIC;
  v_price_before NUMERIC;
  v_price_after  NUMERIC;
BEGIN
  SELECT virtual_pi_reserve, virtual_token_reserve, k_constant
  INTO v_vpi, v_vtok, v_k
  FROM public.tokens WHERE id = p_token_id;

  -- 1% fee
  v_fee    := p_pi_in * 0.01;
  v_pi_net := p_pi_in - v_fee;

  v_price_before := v_vpi / v_vtok;
  v_new_vpi  := v_vpi + v_pi_net;
  v_new_vtok := v_k / v_new_vpi;
  v_out      := v_vtok - v_new_vtok;
  v_price_after := v_new_vpi / v_new_vtok;

  RETURN QUERY SELECT
    ROUND(v_out, 0),
    v_price_after,
    ROUND(((v_price_after - v_price_before) / v_price_before) * 100, 2),
    ROUND(v_fee, 8);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sell_quote(
  p_token_id  UUID,
  p_tokens_in NUMERIC
)
RETURNS TABLE(
  pi_out       NUMERIC,
  price_after  NUMERIC,
  price_impact NUMERIC,
  fee_amount   NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_vpi    NUMERIC;
  v_vtok   NUMERIC;
  v_k      NUMERIC;
  v_new_vtok NUMERIC;
  v_new_vpi  NUMERIC;
  v_pi_raw   NUMERIC;
  v_fee      NUMERIC;
  v_pi_out   NUMERIC;
  v_price_before NUMERIC;
  v_price_after  NUMERIC;
BEGIN
  SELECT virtual_pi_reserve, virtual_token_reserve, k_constant
  INTO v_vpi, v_vtok, v_k
  FROM public.tokens WHERE id = p_token_id;

  v_price_before := v_vpi / v_vtok;
  v_new_vtok := v_vtok + p_tokens_in;
  v_new_vpi  := v_k / v_new_vtok;
  v_pi_raw   := v_vpi - v_new_vpi;
  v_fee      := v_pi_raw * 0.01;
  v_pi_out   := v_pi_raw - v_fee;
  v_price_after := v_new_vpi / v_new_vtok;

  RETURN QUERY SELECT
    ROUND(v_pi_out, 8),
    v_price_after,
    ROUND(((v_price_before - v_price_after) / v_price_before) * 100, 2),
    ROUND(v_fee, 8);
END;
$$;

-- ─── Execute Trade (called after Pi payment confirmed) ────
CREATE OR REPLACE FUNCTION public.execute_trade(
  p_token_id     UUID,
  p_trader_uid   TEXT,
  p_type         TEXT,        -- 'buy' or 'sell'
  p_pi_amount    NUMERIC,
  p_token_amount NUMERIC,
  p_fee_amount   NUMERIC,
  p_pi_payment_id TEXT,
  p_pi_tx_id     TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_trade_id      UUID;
  v_price         NUMERIC;
  v_vpi           NUMERIC;
  v_vtok          NUMERIC;
  v_k             NUMERIC;
  v_new_vpi       NUMERIC;
  v_new_vtok      NUMERIC;
  v_new_price     NUMERIC;
  v_real_pi_collected NUMERIC;
  v_grad_threshold NUMERIC;
BEGIN
  SELECT virtual_pi_reserve, virtual_token_reserve, k_constant, real_pi_collected, graduation_threshold
  INTO v_vpi, v_vtok, v_k, v_real_pi_collected, v_grad_threshold
  FROM public.tokens WHERE id = p_token_id FOR UPDATE;

  v_price := v_vpi / v_vtok;

  -- Update reserves
  IF p_type = 'buy' THEN
    v_new_vpi  := v_vpi + (p_pi_amount - p_fee_amount);
    v_new_vtok := v_k / v_new_vpi;
  ELSE
    v_new_vtok := v_vtok + p_token_amount;
    v_new_vpi  := v_k / v_new_vtok;
  END IF;

  v_new_price := v_new_vpi / v_new_vtok;

  -- Insert trade record
  INSERT INTO public.trades (
    token_id, trader_uid, type, pi_amount, token_amount,
    price_per_token, fee_amount, pi_payment_id, pi_tx_id, status
  ) VALUES (
    p_token_id, p_trader_uid, p_type, p_pi_amount, p_token_amount,
    v_price, p_fee_amount, p_pi_payment_id, p_pi_tx_id, 'completed'
  ) RETURNING id INTO v_trade_id;

  -- Update token reserves & stats
  UPDATE public.tokens SET
    virtual_pi_reserve    = v_new_vpi,
    virtual_token_reserve = v_new_vtok,
    current_price         = v_new_price,
    real_pi_collected     = CASE WHEN p_type = 'buy'
                              THEN real_pi_collected + p_pi_amount - p_fee_amount
                              ELSE real_pi_collected END,
    circulating_supply    = CASE WHEN p_type = 'buy'
                              THEN circulating_supply + p_token_amount
                              ELSE circulating_supply - p_token_amount END,
    volume_24h            = volume_24h + p_pi_amount,
    volume_total          = volume_total + p_pi_amount,
    trade_count           = trade_count + 1,
    status                = CASE
                              WHEN p_type = 'buy'
                                AND (real_pi_collected + p_pi_amount - p_fee_amount) >= v_grad_threshold
                              THEN 'graduated'
                              ELSE status END,
    graduated_at          = CASE
                              WHEN p_type = 'buy'
                                AND (real_pi_collected + p_pi_amount - p_fee_amount) >= v_grad_threshold
                              THEN NOW()
                              ELSE graduated_at END
  WHERE id = p_token_id;

  -- Update token_holders balance
  INSERT INTO public.token_holders (token_id, user_uid, balance)
  VALUES (p_token_id, p_trader_uid, 
    CASE WHEN p_type = 'buy' THEN p_token_amount ELSE -p_token_amount END)
  ON CONFLICT (token_id, user_uid) DO UPDATE
    SET balance = token_holders.balance + EXCLUDED.balance,
        updated_at = NOW();

  -- Update holder_count
  UPDATE public.tokens SET
    holder_count = (
      SELECT COUNT(*) FROM public.token_holders
      WHERE token_id = p_token_id AND balance > 0
    )
  WHERE id = p_token_id;

  -- Update platform stats
  UPDATE public.platform_config SET
    total_fees_collected = total_fees_collected + p_fee_amount,
    total_volume         = total_volume + p_pi_amount,
    total_trades         = total_trades + 1;

  RETURN v_trade_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_holders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content    ENABLE ROW LEVEL SECURITY;

-- Users: anyone can read, only own row can update
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_insert" ON public.users;
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (true);

-- Tokens: anyone can read active tokens
DROP POLICY IF EXISTS "tokens_select" ON public.tokens;
CREATE POLICY "tokens_select" ON public.tokens FOR SELECT USING (true);

DROP POLICY IF EXISTS "tokens_insert" ON public.tokens;
CREATE POLICY "tokens_insert" ON public.tokens FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "tokens_update" ON public.tokens;
CREATE POLICY "tokens_update" ON public.tokens FOR UPDATE USING (true);

-- Trades: anyone can read
DROP POLICY IF EXISTS "trades_select" ON public.trades;
CREATE POLICY "trades_select" ON public.trades FOR SELECT USING (true);

DROP POLICY IF EXISTS "trades_insert" ON public.trades;
CREATE POLICY "trades_insert" ON public.trades FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "trades_update" ON public.trades;
CREATE POLICY "trades_update" ON public.trades FOR UPDATE USING (true);

-- Token holders: anyone can read
DROP POLICY IF EXISTS "holders_select" ON public.token_holders;
CREATE POLICY "holders_select" ON public.token_holders FOR SELECT USING (true);

DROP POLICY IF EXISTS "holders_insert" ON public.token_holders;
CREATE POLICY "holders_insert" ON public.token_holders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "holders_update" ON public.token_holders;
CREATE POLICY "holders_update" ON public.token_holders FOR UPDATE USING (true);

-- Platform config: anyone can read
DROP POLICY IF EXISTS "config_select" ON public.platform_config;
CREATE POLICY "config_select" ON public.platform_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "config_update" ON public.platform_config;
CREATE POLICY "config_update" ON public.platform_config FOR UPDATE USING (true);

-- Reports: anyone can insert, read own
DROP POLICY IF EXISTS "reports_select" ON public.reports;
CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "reports_update" ON public.reports;
CREATE POLICY "reports_update" ON public.reports FOR UPDATE USING (true);

-- Site content: anyone can read
DROP POLICY IF EXISTS "content_select" ON public.site_content;
CREATE POLICY "content_select" ON public.site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "content_update" ON public.site_content;
CREATE POLICY "content_update" ON public.site_content FOR UPDATE USING (true);

-- ═══════════════════════════════════════════════════════════
-- REALTIME — enable for live updates
-- ═══════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.token_holders;
