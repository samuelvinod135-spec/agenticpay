import { Router, Request, Response } from 'express';
import { executeUsdcTransfer } from '../services/transfer';
import { supabase } from '../lib/supabase.js';

const router = Router();

/**
 * POST /api/v1/payments/transfer
 * Transfers USDC on Base Sepolia from a developer-controlled wallet
 * and logs the transaction record to Supabase.
 */
router.post('/transfer', async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletId, destinationAddress, amount, tokenId } = req.body;

    // Validate walletId
    if (!walletId || typeof walletId !== 'string' || walletId.trim() === '') {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Missing or invalid required parameter: walletId must be a non-empty string.',
      });
      return;
    }

    // Validate destinationAddress
    if (
      !destinationAddress ||
      typeof destinationAddress !== 'string' ||
      !/^0x[a-fA-F0-9]{40}$/.test(destinationAddress.trim())
    ) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message:
          'Missing or invalid required parameter: destinationAddress must be a valid 42-character EVM address (0x...).',
      });
      return;
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (amount === undefined || isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Missing or invalid required parameter: amount must be a positive number greater than 0.',
      });
      return;
    }

    // Execute the USDC transfer via Circle Web3 SDK
    const transferResult = await executeUsdcTransfer({
      walletId: walletId.trim(),
      destinationAddress: destinationAddress.trim(),
      amount: parsedAmount,
      tokenId,
    });

    // Log the transaction in Supabase
    let dbRecordId: string | null = null;
    try {
      const { data: dbData, error: dbError } = await supabase
        .from('transactions')
        .insert({
          transaction_id: transferResult.transactionId,
          wallet_id: transferResult.walletId,
          destination_address: transferResult.destinationAddress,
          amount: parseFloat(transferResult.amount),
          token_address: transferResult.tokenAddress,
          blockchain: transferResult.blockchain || 'base-sepolia',
          status: transferResult.state || 'INITIATED',
        })
        .select('id')
        .single();

      if (dbError) {
        console.warn('[paymentRoutes] Supabase transaction logging notice:', dbError.message);
      } else if (dbData) {
        dbRecordId = dbData.id;
      }
    } catch (insertError: any) {
      console.warn('[paymentRoutes] Failed to record transaction in Supabase:', insertError.message);
    }

    res.status(200).json({
      success: true,
      message: 'USDC transfer successfully initiated on Base Sepolia.',
      recordId: dbRecordId,
      transaction: {
        ...transferResult,
        dbRecordId,
      },
    });
  } catch (error: any) {
    console.error('[paymentRoutes] Error processing transfer:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to process USDC transfer.',
    });
  }
});

export default router;
