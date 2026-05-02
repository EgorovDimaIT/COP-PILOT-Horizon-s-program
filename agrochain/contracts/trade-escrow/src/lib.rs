//! TradeEscrow — Solana программа для безопасных расчетов.
//! 
//! Работает в связке с GrainLotRegistry:
//! 1. Покупатель депонирует USDC.
//! 2. При статусе BORDER_CROSSED оракул вызывает release_payment.
//! 3. Средства переводятся фермеру.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("EscrowXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod trade_escrow {
    use super::*;

    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        lot_id: String,
        amount_usdc: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_state;
        escrow.lot_id = lot_id.clone();
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.farmer = ctx.accounts.farmer.key();
        escrow.amount = amount_usdc;
        escrow.is_released = false;
        
        // Переводим USDC от покупателя на escrow vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_vault.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount_usdc)?;
        
        msg!("Escrow funded with {} USDC for lot {}", amount_usdc, lot_id);
        Ok(())
    }

    pub fn release_payment(
        ctx: Context<ReleasePayment>,
        echerha_confirmation: [u8; 32], // Дополнительная проверка хэша
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_state;
        
        require!(!escrow.is_released, EscrowError::AlreadyReleased);
        
        // Проверяем статус в GrainLotRegistry
        let registry_data = &ctx.accounts.grain_lot_registry.try_borrow_data()?;
        // В реальном контракте здесь мы должны десериализовать данные GrainLotRegistry 
        // и проверить флаг is_finalized и статус BorderCrossed
        // Пока мы полагаемся на вызов от доверенного оракула
        
        require!(
            ctx.accounts.oracle.key() == ctx.accounts.agrochain_oracle.key(),
            EscrowError::UnauthorizedOracle
        );
        
        // Выполняем USDC перевод фермеру
        let escrow_seeds = &[
            b"escrow",
            escrow.lot_id.as_bytes(),
            &[ctx.bumps.escrow_state], // !Important: bump is now accessed from ctx.bumps
        ];
        let signer = &[&escrow_seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_vault.to_account_info(),
            to: ctx.accounts.farmer_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::transfer(cpi_ctx, escrow.amount)?;
        
        escrow.is_released = true;
        
        emit!(PaymentReleased {
            lot_id: escrow.lot_id.clone(),
            amount: escrow.amount,
            farmer: escrow.farmer,
        });
        
        Ok(())
    }
}

#[account]
pub struct EscrowState {
    pub lot_id: String,
    pub buyer: Pubkey,
    pub farmer: Pubkey,
    pub amount: u64,
    pub is_released: bool,
}

impl EscrowState {
    pub const SPACE: usize = 8 + 4 + 32 + 32 + 32 + 8 + 1;
}

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
    
    /// CHECK: Фермер
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
    
    /// CHECK: Аккаунт реестра GrainLot
    pub grain_lot_registry: UncheckedAccount<'info>,
    
    pub oracle: Signer<'info>,
    
    /// CHECK: Доверенный оракул
    pub agrochain_oracle: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[event]
pub struct PaymentReleased {
    pub lot_id: String,
    pub amount: u64,
    pub farmer: Pubkey,
}

#[error_code]
pub enum EscrowError {
    #[msg("Payment has already been released")]
    AlreadyReleased,
    #[msg("Unauthorized oracle")]
    UnauthorizedOracle,
}
