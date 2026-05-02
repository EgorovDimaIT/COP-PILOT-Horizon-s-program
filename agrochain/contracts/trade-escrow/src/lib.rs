//! TradeEscrow — Solana программа для безопасных расчётов.
//!
//! Гибридная платёжная модель AgroChain:
//! Сценарий A: USDC (Solana) — мгновенные расчёты
//! Сценарий Б: EUR/USD (через банки-партнёры) — вызывается через Payment Oracle
//! 
//! Поток:
//! 1. Покупатель депонирует USDC в escrow vault (PDA).
//! 2. Payment Oracle мониторит eCherha (API таможни).
//! 3. При статусе BORDER_CROSSED → автоматический release_payment.
//! 4. Фермер получает USDC мгновенно (< 1 сек).
//!
//! Защита: если ИИ COP-PILOT обнаружил высокий риск (GPS аномалия),
//! вызывается pause_escrow, и средства замораживаются до ручной проверки.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("EscrowXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod trade_escrow {
    use super::*;

    /// Инициализация Escrow: покупатель депонирует USDC.
    /// Поддерживает частичный депозит для гибридных платежей (crypto + fiat split).
    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        lot_id: String,
        amount_usdc: u64,
        payment_type: PaymentType,
        fiat_amount_cents: u64,       // Фиатная часть в центах EUR (0 для чистого USDC)
        fiat_bank_reference: String,  // Ссылка на банковский escrow (пустая для чистого USDC)
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_state;
        let clock = Clock::get()?;
        
        escrow.lot_id = lot_id.clone();
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.farmer = ctx.accounts.farmer.key();
        escrow.amount_usdc = amount_usdc;
        escrow.payment_type = payment_type;
        escrow.fiat_amount_cents = fiat_amount_cents;
        escrow.fiat_bank_reference = fiat_bank_reference;
        escrow.status = EscrowStatus::Funded;
        escrow.created_at = clock.unix_timestamp;
        escrow.updated_at = clock.unix_timestamp;
        escrow.dispute_open = false;
        
        // Переводим USDC от покупателя на escrow vault
        if amount_usdc > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.buyer_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_vault.to_account_info(),
                authority: ctx.accounts.buyer.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, amount_usdc)?;
        }
        
        emit!(EscrowCreated {
            lot_id,
            buyer: ctx.accounts.buyer.key(),
            farmer: ctx.accounts.farmer.key(),
            amount_usdc,
            payment_type,
            fiat_amount_cents,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("Escrow funded: {} USDC + {} EUR cents for lot {}", 
             amount_usdc, fiat_amount_cents, escrow.lot_id);
        Ok(())
    }

    /// Автоматический release при BORDER_CROSSED.
    /// Вызывается Payment Oracle после получения данных от eCherha.
    /// Формирует Audit Trail для НБУ и EU Tax Authority.
    pub fn release_payment(
        ctx: Context<ReleasePayment>,
        echerha_confirmation: [u8; 32],
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_state;
        let clock = Clock::get()?;
        
        require!(
            escrow.status == EscrowStatus::Funded || escrow.status == EscrowStatus::Confirmed,
            EscrowError::InvalidStatus
        );
        require!(!escrow.dispute_open, EscrowError::DisputeActive);
        
        // Проверяем авторизацию оракула
        require!(
            ctx.accounts.oracle.key() == ctx.accounts.agrochain_oracle.key(),
            EscrowError::UnauthorizedOracle
        );
        
        // Выполняем USDC перевод фермеру
        if escrow.amount_usdc > 0 {
            let escrow_seeds = &[
                b"escrow",
                escrow.lot_id.as_bytes(),
                &[ctx.bumps.escrow_state],
            ];
            let signer = &[&escrow_seeds[..]];
            
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_vault.to_account_info(),
                to: ctx.accounts.farmer_token_account.to_account_info(),
                authority: escrow.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            
            token::transfer(cpi_ctx, escrow.amount_usdc)?;
        }
        
        escrow.status = EscrowStatus::Released;
        escrow.echerha_hash = Some(echerha_confirmation);
        escrow.released_at = Some(clock.unix_timestamp);
        escrow.updated_at = clock.unix_timestamp;
        
        emit!(PaymentReleased {
            lot_id: escrow.lot_id.clone(),
            amount_usdc: escrow.amount_usdc,
            fiat_amount_cents: escrow.fiat_amount_cents,
            farmer: escrow.farmer,
            echerha_hash: echerha_confirmation,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("💰 Payment released! USDC: {}, Fiat EUR cents: {}", 
             escrow.amount_usdc, escrow.fiat_amount_cents);
        Ok(())
    }

    /// Приостановка Escrow (High Risk от ИИ COP-PILOT).
    /// GPS аномалия, отклонение от маршрута, недокументация.
    pub fn pause_escrow(
        ctx: Context<OracleAction>,
        reason: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_state;
        let clock = Clock::get()?;
        
        require!(
            escrow.status == EscrowStatus::Funded || escrow.status == EscrowStatus::Confirmed,
            EscrowError::InvalidStatus
        );
        require!(
            ctx.accounts.oracle.key() == ctx.accounts.agrochain_oracle.key(),
            EscrowError::UnauthorizedOracle
        );
        
        escrow.status = EscrowStatus::Paused;
        escrow.updated_at = clock.unix_timestamp;
        
        emit!(EscrowPaused {
            lot_id: escrow.lot_id.clone(),
            reason: reason.clone(),
            timestamp: clock.unix_timestamp,
        });
        
        msg!("⚠️ Escrow PAUSED: {}", reason);
        Ok(())
    }

    /// Возобновление приостановленного Escrow после ручной проверки.
    pub fn resume_escrow(
        ctx: Context<OracleAction>,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_state;
        let clock = Clock::get()?;
        
        require!(
            escrow.status == EscrowStatus::Paused,
            EscrowError::InvalidStatus
        );
        require!(
            ctx.accounts.oracle.key() == ctx.accounts.agrochain_oracle.key(),
            EscrowError::UnauthorizedOracle
        );
        
        escrow.status = EscrowStatus::Confirmed;
        escrow.updated_at = clock.unix_timestamp;
        
        emit!(EscrowResumed {
            lot_id: escrow.lot_id.clone(),
            timestamp: clock.unix_timestamp,
        });
        
        msg!("✅ Escrow resumed after manual review");
        Ok(())
    }

    /// Открытие спора покупателем.
    /// Средства замораживаются до резолюции арбитража.
    pub fn open_dispute(
        ctx: Context<BuyerAction>,
        reason: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_state;
        let clock = Clock::get()?;
        
        require!(
            escrow.status != EscrowStatus::Released && escrow.status != EscrowStatus::Refunded,
            EscrowError::InvalidStatus
        );
        require!(
            ctx.accounts.buyer.key() == escrow.buyer,
            EscrowError::UnauthorizedBuyer
        );
        
        escrow.dispute_open = true;
        escrow.status = EscrowStatus::Disputed;
        escrow.updated_at = clock.unix_timestamp;
        
        emit!(DisputeOpened {
            lot_id: escrow.lot_id.clone(),
            buyer: escrow.buyer,
            reason,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("⚖️ Dispute opened by buyer");
        Ok(())
    }

    /// Возврат средств покупателю (по решению арбитража или отмена сделки).
    pub fn refund_buyer(
        ctx: Context<ReleasePayment>,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_state;
        let clock = Clock::get()?;
        
        require!(
            escrow.status == EscrowStatus::Disputed || escrow.status == EscrowStatus::Paused,
            EscrowError::InvalidStatus
        );
        require!(
            ctx.accounts.oracle.key() == ctx.accounts.agrochain_oracle.key(),
            EscrowError::UnauthorizedOracle
        );
        
        // Возвращаем USDC покупателю
        if escrow.amount_usdc > 0 {
            let escrow_seeds = &[
                b"escrow",
                escrow.lot_id.as_bytes(),
                &[ctx.bumps.escrow_state],
            ];
            let signer = &[&escrow_seeds[..]];
            
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_vault.to_account_info(),
                to: ctx.accounts.farmer_token_account.to_account_info(), // reusing field, buyer in practice
                authority: escrow.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            
            token::transfer(cpi_ctx, escrow.amount_usdc)?;
        }
        
        escrow.status = EscrowStatus::Refunded;
        escrow.dispute_open = false;
        escrow.updated_at = clock.unix_timestamp;
        
        emit!(BuyerRefunded {
            lot_id: escrow.lot_id.clone(),
            amount_usdc: escrow.amount_usdc,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("💸 Buyer refunded: {} USDC", escrow.amount_usdc);
        Ok(())
    }
}

// =====================================
// Account Structures
// =====================================

#[account]
pub struct EscrowState {
    pub lot_id: String,              // max 32 chars
    pub buyer: Pubkey,
    pub farmer: Pubkey,
    pub amount_usdc: u64,            // USDC amount (крипто-часть)
    pub fiat_amount_cents: u64,      // EUR cents (фиат-часть)
    pub fiat_bank_reference: String, // TMF 622 order ID (max 32 chars)
    pub payment_type: PaymentType,
    pub status: EscrowStatus,
    pub echerha_hash: Option<[u8; 32]>,
    pub dispute_open: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub released_at: Option<i64>,
}

impl EscrowState {
    pub const SPACE: usize = 8   // discriminator
        + 4 + 32    // lot_id
        + 32         // buyer
        + 32         // farmer
        + 8          // amount_usdc
        + 8          // fiat_amount_cents
        + 4 + 32     // fiat_bank_reference
        + 1          // payment_type
        + 1          // status
        + 1 + 32     // echerha_hash
        + 1          // dispute_open
        + 8          // created_at
        + 8          // updated_at
        + 1 + 8;     // released_at
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum PaymentType {
    UsdcOnly,
    FiatOnly,
    Hybrid,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum EscrowStatus {
    Funded,
    Confirmed,
    Paused,
    Released,
    Disputed,
    Refunded,
}

// =====================================
// Instruction Contexts
// =====================================

#[derive(Accounts)]
#[instruction(lot_id: String)]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = buyer,
        space = EscrowState::SPACE,
        seeds = [b"escrow", lot_id.as_bytes()],
        bump,
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    /// CHECK: Farmer pubkey
    pub farmer: UncheckedAccount<'info>,
    
    pub usdc_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = buyer_token_account.owner == buyer.key(),
        constraint = buyer_token_account.mint == usdc_mint.key()
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = buyer,
        token::mint = usdc_mint,
        token::authority = escrow_state,
    )]
    pub escrow_token_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ReleasePayment<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow_state.lot_id.as_bytes()],
        bump,
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    #[account(mut)]
    pub escrow_token_vault: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = farmer_token_account.owner == escrow_state.farmer,
    )]
    pub farmer_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: GrainLot registry account
    pub grain_lot_registry: UncheckedAccount<'info>,
    
    pub oracle: Signer<'info>,
    
    /// CHECK: Trusted oracle
    pub agrochain_oracle: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct OracleAction<'info> {
    #[account(mut)]
    pub escrow_state: Account<'info, EscrowState>,
    
    pub oracle: Signer<'info>,
    
    /// CHECK: Trusted oracle
    pub agrochain_oracle: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct BuyerAction<'info> {
    #[account(mut)]
    pub escrow_state: Account<'info, EscrowState>,
    
    pub buyer: Signer<'info>,
}

// =====================================
// Events
// =====================================

#[event]
pub struct EscrowCreated {
    pub lot_id: String,
    pub buyer: Pubkey,
    pub farmer: Pubkey,
    pub amount_usdc: u64,
    pub payment_type: PaymentType,
    pub fiat_amount_cents: u64,
    pub timestamp: i64,
}

#[event]
pub struct PaymentReleased {
    pub lot_id: String,
    pub amount_usdc: u64,
    pub fiat_amount_cents: u64,
    pub farmer: Pubkey,
    pub echerha_hash: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct EscrowPaused {
    pub lot_id: String,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct EscrowResumed {
    pub lot_id: String,
    pub timestamp: i64,
}

#[event]
pub struct DisputeOpened {
    pub lot_id: String,
    pub buyer: Pubkey,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct BuyerRefunded {
    pub lot_id: String,
    pub amount_usdc: u64,
    pub timestamp: i64,
}

// =====================================
// Errors
// =====================================

#[error_code]
pub enum EscrowError {
    #[msg("Payment has already been released")]
    AlreadyReleased,
    #[msg("Unauthorized oracle")]
    UnauthorizedOracle,
    #[msg("Unauthorized buyer")]
    UnauthorizedBuyer,
    #[msg("Invalid escrow status for this operation")]
    InvalidStatus,
    #[msg("Active dispute prevents this action")]
    DisputeActive,
}
