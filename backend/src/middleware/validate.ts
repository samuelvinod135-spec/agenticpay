import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const transferPayloadSchema = z
  .object({
    agentId: z.string().min(1, 'agentId must be a non-empty string').optional(),
    walletId: z.string().min(1, 'walletId must be a non-empty string').optional(),
    recipient: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'recipient must be a valid 42-character EVM address (0x...)')
      .optional(),
    destinationAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'destinationAddress must be a valid 42-character EVM address (0x...)')
      .optional(),
    amount: z
      .union([z.number(), z.string()])
      .transform((val) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return num;
      })
      .refine((num) => !isNaN(num) && num > 0, {
        message: 'amount must be a positive number greater than 0',
      })
      .refine(
        (num) => {
          const str = num.toString();
          if (str.includes('.')) {
            const decimals = str.split('.')[1].length;
            return decimals <= 4;
          }
          return true;
        },
        {
          message: 'amount cannot exceed 4 decimal places of precision',
        }
      ),
    reason: z.string().optional(),
    tokenId: z.string().optional(),
  })
  .refine((data) => !!(data.agentId || data.walletId), {
    message: 'Either agentId or walletId must be specified.',
    path: ['agentId'],
  })
  .refine((data) => !!(data.recipient || data.destinationAddress), {
    message: 'Either recipient or destinationAddress must be specified.',
    path: ['recipient'],
  });

/**
 * Edge validation middleware: validates transfer requests with Zod.
 * Returns HTTP 422 for malformed payloads.
 */
export const validateTransferPayload = (req: Request, res: Response, next: NextFunction): void => {
  const result = transferPayloadSchema.safeParse(req.body);
  if (!result.success) {
    const errorMessages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    res.status(422).json({
      success: false,
      error: 'Unprocessable Entity',
      message: 'Validation failed on transfer payload',
      details: errorMessages,
      issues: result.error.format(),
    });
    return;
  }

  // Normalize request body with sanitized values
  req.body.amount = result.data.amount;
  req.body.walletId = result.data.walletId || result.data.agentId;
  req.body.destinationAddress = result.data.destinationAddress || result.data.recipient;
  next();
};
