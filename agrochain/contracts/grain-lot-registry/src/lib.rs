//! GrainLotRegistry — Solana программа для хранения 
//! верифицированной цепочки хэшей зернового лота.
//!
//! Архитектура:
//! - GrainLotRegistry: PDA аккаунт, привязанный к lot_id
//! - Хранит SHA-256 хэши всех этапов верификации
//! - Неизменяема после финализации

use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash;

declare_id!("GrainXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod grain_lot_registry {
    use super::*;

    /// Регистрирует новый зерновой лот в блокчейне.
    /// Вызывается после подписания фермером через КЕП.
    pub fn initialize_lot(
        ctx: Context<InitializeLot>,
        lot_id: String,
        kep_hash: [u8; 32],          // SHA-256 КЕП подписи фермера
        cadastre_hash: [u8; 32],     // SHA-256 данных кадастра
        farmer_rno_kpp: String,      // РНОКПП (публично, для верификации)
        cadastre_number: String,
    ) -> Result<()> {
        let lot = &mut ctx.accounts.grain_lot;
        let clock = Clock::get()?;
        
        lot.lot_id = lot_id.clone();
        lot.farmer = ctx.accounts.farmer.key();
        lot.farmer_rno_kpp = farmer_rno_kpp;
        lot.cadastre_number = cadastre_number;
        lot.kep_hash = kep_hash;
        lot.cadastre_hash = cadastre_hash;
        lot.created_at = clock.unix_timestamp;
        lot.updated_at = clock.unix_timestamp;
        lot.status = LotStatus::KepSigned;
        lot.is_finalized = false;
        
        // Вычисляем первоначальный корневой хэш цепочки
        let chain_data = [kep_hash, cadastre_hash].concat();
        let chain_hash = hash::hashv(&[&chain_data]);
        lot.chain_root_hash = chain_hash.to_bytes();
        
        emit!(LotInitialized {
            lot_id,
            farmer: ctx.accounts.farmer.key(),
            timestamp: clock.unix_timestamp,
        });
        
        msg!("GrainLot зарегистрирован в Solana blockchain");
        Ok(())
    }

    /// Обновляет лот после UKAS верификации лаборатории.
    pub fn add_ukas_verification(
        ctx: Context<UpdateLot>,
        ukas_hash: [u8; 32],         // SHA-256 PDF сертификата
        lab_cert_number: String,
        lab_name: String,
    ) -> Result<()> {
        let lot = &mut ctx.accounts.grain_lot;
        let clock = Clock::get()?;
        
        // Только владелец лота может обновлять
        require!(
            lot.farmer == ctx.accounts.authority.key() || 
            ctx.accounts.authority.key() == lot.agrochain_operator,
            AgroChainError::Unauthorized
        );
        
        require!(!lot.is_finalized, AgroChainError::LotFinalized);
        
        lot.ukas_hash = Some(ukas_hash);
        lot.lab_cert_number = Some(lab_cert_number);
        lot.lab_name = Some(lab_name);
        lot.status = LotStatus::UkasVerified;
        lot.updated_at = clock.unix_timestamp;
        
        // Обновляем корневой хэш цепочки
        let chain_data = [
            lot.kep_hash.to_vec(),
            lot.cadastre_hash.to_vec(),
            ukas_hash.to_vec(),
        ].concat();
        let new_chain_hash = hash::hashv(&[&chain_data]);
        lot.chain_root_hash = new_chain_hash.to_bytes();
        
        emit!(LotUkasVerified {
            lot_id: lot.lot_id.clone(),
            ukas_hash,
            timestamp: clock.unix_timestamp,
        });
        
        Ok(())
    }

    /// Обновляет лот после получения фитосанитарного сертификата.
    pub fn add_phyto_certification(
        ctx: Context<UpdateLot>,
        phyto_hash: [u8; 32],        // SHA-256 фитосанитарного сертификата
        phyto_cert_number: String,
    ) -> Result<()> {
        let lot = &mut ctx.accounts.grain_lot;
        let clock = Clock::get()?;
        
        require!(!lot.is_finalized, AgroChainError::LotFinalized);
        
        lot.phyto_hash = Some(phyto_hash);
        lot.phyto_cert_number = Some(phyto_cert_number);
        lot.status = LotStatus::ExportReady;
        lot.updated_at = clock.unix_timestamp;
        
        // Обновляем цепочку хэшей
        let chain_data = [
            lot.chain_root_hash.to_vec(),
            phyto_hash.to_vec(),
        ].concat();
        let new_chain_hash = hash::hashv(&[&chain_data]);
        lot.chain_root_hash = new_chain_hash.to_bytes();
        
        emit!(LotExportReady {
            lot_id: lot.lot_id.clone(),
            timestamp: clock.unix_timestamp,
        });
        
        Ok(())
    }

    /// Финальный шаг: подтверждение пересечения границы через eCherha.
    /// Вызывается оракулом AgroChain при получении статуса BORDER_CROSSED.
    pub fn confirm_border_crossing(
        ctx: Context<ConfirmBorderCrossing>,
        echerha_hash: [u8; 32],      // SHA-256 подтверждения от eCherha
        crossed_at: i64,             // Timestamp пересечения
        checkpoint_id: u8,
    ) -> Result<()> {
        let lot = &mut ctx.accounts.grain_lot;
        let clock = Clock::get()?;
        
        // Только авторизованный оракул AgroChain может вызвать это
        require!(
            ctx.accounts.oracle.key() == ctx.accounts.agrochain_oracle.key(),
            AgroChainError::OracleUnauthorized
        );
        
        require!(!lot.is_finalized, AgroChainError::LotFinalized);
        
        lot.echerha_hash = Some(echerha_hash);
        lot.border_crossed_at = Some(crossed_at);
        lot.checkpoint_id = Some(checkpoint_id);
        lot.status = LotStatus::BorderCrossed;
        lot.is_finalized = true;  // Лот финализирован
        lot.updated_at = clock.unix_timestamp;
        
        // Финальный хэш цепочки
        let chain_data = [
            lot.chain_root_hash.to_vec(),
            echerha_hash.to_vec(),
        ].concat();
        let final_chain_hash = hash::hashv(&[&chain_data]);
        lot.chain_root_hash = final_chain_hash.to_bytes();
        
        emit!(BorderCrossed {
            lot_id: lot.lot_id.clone(),
            crossed_at,
            checkpoint_id,
            final_hash: final_chain_hash.to_bytes(),
        });
        
        msg!("Граница пересечена! Лот {} финализирован.", lot.lot_id);
        Ok(())
    }
}

// =====================================
// Account Structures
// =====================================

#[account]
#[derive(Default)]
pub struct GrainLot {
    pub lot_id: String,              // max 32 chars
    pub farmer: Pubkey,
    pub agrochain_operator: Pubkey,
    pub farmer_rno_kpp: String,      // max 10 chars
    pub cadastre_number: String,     // max 24 chars
    
    // Хэши верификаций
    pub kep_hash: [u8; 32],
    pub cadastre_hash: [u8; 32],
    pub ukas_hash: Option<[u8; 32]>,
    pub phyto_hash: Option<[u8; 32]>,
    pub echerha_hash: Option<[u8; 32]>,
    pub chain_root_hash: [u8; 32],    // Аккумулятивный хэш цепочки
    
    // Метаданные
    pub lab_cert_number: Option<String>,
    pub lab_name: Option<String>,
    pub phyto_cert_number: Option<String>,
    pub border_crossed_at: Option<i64>,
    pub checkpoint_id: Option<u8>,
    
    pub status: LotStatus,
    pub is_finalized: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

impl GrainLot {
    // Размер аккаунта для расчёта rent
    pub const SPACE: usize = 8   // discriminator
        + 4 + 32    // lot_id String
        + 32        // farmer Pubkey
        + 32        // operator Pubkey
        + 4 + 10    // rno_kpp
        + 4 + 24    // cadastre_number
        + 32        // kep_hash
        + 32        // cadastre_hash
        + 1 + 32    // ukas_hash Option
        + 1 + 32    // phyto_hash Option
        + 1 + 32    // echerha_hash Option
        + 32        // chain_root_hash
        + 1 + 4 + 32  // lab_cert_number Option<String>
        + 1 + 4 + 64  // lab_name Option<String>
        + 1 + 4 + 32  // phyto_cert_number Option<String>
        + 1 + 8     // border_crossed_at Option<i64>
        + 1 + 1     // checkpoint_id Option<u8>
        + 1         // status
        + 1         // is_finalized
        + 8         // created_at
        + 8;        // updated_at
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, PartialEq)]
pub enum LotStatus {
    #[default]
    Draft,
    KepSigned,
    CadastreVerified,
    UkasVerified,
    ExportReady,
    InTransit,
    AtBorder,
    BorderCrossed,
    PaymentReleased,
}

// =====================================
// Instruction Contexts
// =====================================

#[derive(Accounts)]
#[instruction(lot_id: String)]
pub struct InitializeLot<'info> {
    #[account(
        init,
        payer = farmer,
        space = GrainLot::SPACE,
        seeds = [b"grain_lot", lot_id.as_bytes()],
        bump,
    )]
    pub grain_lot: Account<'info, GrainLot>,
    
    #[account(mut)]
    pub farmer: Signer<'info>,
    
    /// CHECK: Адрес оператора AgroChain (для обновлений)
    pub agrochain_operator: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateLot<'info> {
    #[account(mut)]
    pub grain_lot: Account<'info, GrainLot>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ConfirmBorderCrossing<'info> {
    #[account(mut)]
    pub grain_lot: Account<'info, GrainLot>,
    
    pub oracle: Signer<'info>,
    
    /// CHECK: Хранится в конфиге программы
    pub agrochain_oracle: UncheckedAccount<'info>,
}

// =====================================
// Events
// =====================================

#[event]
pub struct LotInitialized {
    pub lot_id: String,
    pub farmer: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct LotUkasVerified {
    pub lot_id: String,
    pub ukas_hash: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct LotExportReady {
    pub lot_id: String,
    pub timestamp: i64,
}

#[event]
pub struct BorderCrossed {
    pub lot_id: String,
    pub crossed_at: i64,
    pub checkpoint_id: u8,
    pub final_hash: [u8; 32],
}

// =====================================
// Errors
// =====================================

#[error_code]
pub enum AgroChainError {
    #[msg("Unauthorized: тільки власник або оператор може оновлювати лот")]
    Unauthorized,
    #[msg("Lot is finalized and cannot be modified")]
    LotFinalized,
    #[msg("Oracle unauthorized: невірний оракул")]
    OracleUnauthorized,
    #[msg("Invalid hash length")]
    InvalidHash,
}
