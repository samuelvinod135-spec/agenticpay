import { Router, Request, Response } from 'express';
import { executeUsdcTransfer } from '../services/transfer';

const router = Router();

/**
 * POST /api/v1/payments/transfer
 * Transfers USDC on Base Sepolia from a developer-controlled wallet.
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

    res.status(200).json({
      success: true,
      message: 'USDC transfer successfully initiated on Base Sepolia.',
      transaction: transferResult,
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
