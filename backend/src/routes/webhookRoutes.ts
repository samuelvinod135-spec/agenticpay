import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import https from 'https';

const router = Router();

/**
 * POST /api/v1/webhooks/circle
 * Circle W3S Developer-Controlled Wallets Webhook Listener
 *
 * Handles transaction state updates (INITIATED, PENDING, COMPLETE, FAILED)
 * and synchronizes them with the Supabase `transactions` table.
 */
router.post('/circle', async (req: Request, res: Response): Promise<void> => {
  try {
    let payload = req.body;

    // Handle AWS SNS SubscriptionConfirmation if Circle routes via SNS
    if (payload?.Type === 'SubscriptionConfirmation' && payload?.SubscribeURL) {
      console.log('[Circle Webhook] Handling SNS Subscription Confirmation:', payload.SubscribeURL);
      https.get(payload.SubscribeURL, (confirmRes) => {
        console.log('[Circle Webhook] Subscription confirmed with status:', confirmRes.statusCode);
      });
      res.status(200).json({ success: true, message: 'Subscription confirmed' });
      return;
    }

    // Handle stringified SNS Message payload
    if (payload?.Type === 'Notification' && typeof payload?.Message === 'string') {
      try {
        payload = JSON.parse(payload.Message);
      } catch (e) {
        console.warn('[Circle Webhook] Could not parse nested SNS Message string');
      }
    }

    console.log('[Circle Webhook] Received webhook payload:', JSON.stringify(payload, null, 2));

    // Extract notification type
    const notificationType =
      payload?.notificationType ||
      payload?.notification?.notificationType ||
      payload?.type ||
      'unknown';

    // Extract transaction object from common Circle W3S webhook structures
    const transaction =
      payload?.transaction ||
      payload?.notification?.transaction ||
      payload?.data?.transaction ||
      payload?.data ||
      payload;

    const circleTransactionId = transaction?.id || transaction?.transactionId;
    const rawState = transaction?.state || transaction?.status;

    if (!circleTransactionId) {
      console.warn('[Circle Webhook] No transaction ID found in payload, acknowledging receipt.');
      res.status(200).json({
        success: true,
        message: 'Webhook received but no transaction ID was present in payload.',
      });
      return;
    }

    // Normalize state to allowed check constraint values: INITIATED, PENDING, COMPLETE, FAILED
    let normalizedState = 'PENDING';
    if (rawState) {
      const upperState = String(rawState).toUpperCase();
      if (['COMPLETE', 'COMPLETED', 'CONFIRMED', 'SUCCESS'].includes(upperState)) {
        normalizedState = 'COMPLETE';
      } else if (['FAILED', 'CANCELLED', 'DENIED', 'REJECTED'].includes(upperState)) {
        normalizedState = 'FAILED';
      } else if (['INITIATED'].includes(upperState)) {
        normalizedState = 'INITIATED';
      } else {
        normalizedState = 'PENDING';
      }
    }

    const now = new Date().toISOString();
    console.log(
      `[Circle Webhook] Updating transaction ${circleTransactionId} -> Status: ${normalizedState} (Type: ${notificationType})`
    );

    // Update row in Supabase transactions table
    const updatePayload: any = {
      status: normalizedState,
      updated_at: now,
    };

    if (transaction?.txHash) {
      updatePayload.tx_hash = transaction.txHash;
    }

    const { data: updatedRows, error: dbError } = await supabase
      .from('transactions')
      .update(updatePayload)
      .eq('transaction_id', circleTransactionId)
      .select();

    if (dbError) {
      console.error('[Circle Webhook] Supabase update error:', dbError.message);
    } else {
      console.log(
        `[Circle Webhook] Supabase transaction row updated successfully. Rows affected: ${updatedRows?.length || 0}`
      );
    }

    // Always respond with 200 OK to acknowledge receipt to Circle
    res.status(200).json({
      success: true,
      transactionId: circleTransactionId,
      status: normalizedState,
      updatedRowsCount: updatedRows?.length || 0,
    });
  } catch (error: any) {
    console.error('[Circle Webhook] Processing error:', error);
    // Respond 200 to avoid Circle webhook retrying on internal handler error
    res.status(200).json({
      success: true,
      error: error.message || 'Internal processing error',
    });
  }
});

export default router;
