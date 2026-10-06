import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import https from 'https';
import { webhookService } from '../services/webhookService';

const router = Router();

/**
 * POST /api/v1/webhooks/circle
 * Circle Developer Services Webhook Notification Listener
 *
 * Receives and processes transfer events (e.g. transfers.update, transfer.complete, transfer.failed),
 * extracts transfer details, and updates transaction state and txHash in Supabase.
 */
router.post('/circle', async (req: Request, res: Response): Promise<void> => {
  try {
    let payload = req.body;

    // Support text/plain payloads (e.g., from AWS SNS or proxy)
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        console.warn('[Circle Webhook] Raw body is not valid JSON string');
      }
    }

    // 1. Handle AWS SNS SubscriptionConfirmation if Circle routes via AWS SNS
    if (payload?.Type === 'SubscriptionConfirmation' && payload?.SubscribeURL) {
      console.log('[Circle Webhook] Handling SNS Subscription Confirmation:', payload.SubscribeURL);
      https.get(payload.SubscribeURL, (confirmRes) => {
        console.log('[Circle Webhook] Subscription confirmed with status:', confirmRes.statusCode);
      });
      res.status(200).json({ success: true, message: 'Subscription confirmed' });
      return;
    }

    // 2. Handle stringified SNS Message envelope
    if (payload?.Type === 'Notification' && typeof payload?.Message === 'string') {
      try {
        payload = JSON.parse(payload.Message);
      } catch (e) {
        console.warn('[Circle Webhook] Could not parse nested SNS Message string');
      }
    }

    console.log('[Circle Webhook] Received webhook payload:', JSON.stringify(payload, null, 2));

    // 3. Extract event / notification type
    const eventType =
      payload?.notificationType ||
      payload?.notification?.notificationType ||
      payload?.event ||
      payload?.type ||
      'unknown';

    // 4. Extract notification / transfer object across standard Circle structures
    const transferData =
      payload?.notification ||
      payload?.transaction ||
      payload?.data?.transaction ||
      payload?.data ||
      payload;

    const walletId =
      transferData?.walletId ||
      transferData?.wallet_id ||
      payload?.walletId ||
      null;

    const transactionId =
      transferData?.transactionId ||
      transferData?.id ||
      transferData?.transaction_id ||
      payload?.transactionId ||
      payload?.id ||
      null;

    const recordId =
      transferData?.recordId ||
      transferData?.dbRecordId ||
      payload?.recordId ||
      payload?.dbRecordId ||
      null;

    const rawState =
      transferData?.state ||
      transferData?.status ||
      payload?.state ||
      payload?.status;

    const txHash =
      transferData?.txHash ||
      transferData?.tx_hash ||
      transferData?.transactionHash ||
      payload?.txHash ||
      payload?.tx_hash ||
      null;

    if (!transactionId && !recordId) {
      console.warn('[Circle Webhook] Missing transactionId and recordId in payload, acknowledging receipt.');
      res.status(200).json({
        success: true,
        message: 'Webhook received but no matching transaction identifier was provided.',
      });
      return;
    }

    // 5. Normalize state to COMPLETE or FAILED (with fallback to INITIATED/PENDING)
    let normalizedState = 'COMPLETE';
    const stateStr = String(rawState || eventType || '').toUpperCase();

    if (
      stateStr.includes('COMPLETE') ||
      stateStr.includes('CONFIRMED') ||
      stateStr.includes('SUCCESS')
    ) {
      normalizedState = 'COMPLETE';
    } else if (
      stateStr.includes('FAIL') ||
      stateStr.includes('CANCEL') ||
      stateStr.includes('DENIED') ||
      stateStr.includes('REJECT')
    ) {
      normalizedState = 'FAILED';
    } else if (stateStr.includes('INITIATED')) {
      normalizedState = 'INITIATED';
    } else {
      normalizedState = 'PENDING';
    }

    const now = new Date().toISOString();
    console.log(
      `[Circle Webhook] Syncing transaction (ID: ${transactionId || recordId}) -> Status: ${normalizedState}, txHash: ${txHash || 'N/A'}`
    );

    // 6. Database Synchronization in Supabase transactions table
    const updatePayload: any = {
      status: normalizedState,
      updated_at: now,
    };

    let updatedRows: any[] | null = null;
    let dbErrorMsg: string | null = null;

    // Try updating with tx_hash if provided
    if (txHash) {
      const payloadWithTxHash = { ...updatePayload, tx_hash: txHash };

      if (transactionId) {
        const { data, error } = await supabase
          .from('transactions')
          .update(payloadWithTxHash)
          .eq('transaction_id', transactionId)
          .select();

        if (!error && data && data.length > 0) {
          updatedRows = data;
        } else if (error) {
          dbErrorMsg = error.message;
        }
      }

      if ((!updatedRows || updatedRows.length === 0) && recordId) {
        const { data, error } = await supabase
          .from('transactions')
          .update(payloadWithTxHash)
          .eq('id', recordId)
          .select();

        if (!error && data && data.length > 0) {
          updatedRows = data;
        } else if (error) {
          dbErrorMsg = error.message;
        }
      }
    }

    // Fallback if tx_hash column doesn't exist or wasn't provided
    if (!updatedRows || updatedRows.length === 0) {
      if (transactionId) {
        const { data, error } = await supabase
          .from('transactions')
          .update(updatePayload)
          .eq('transaction_id', transactionId)
          .select();

        if (!error && data && data.length > 0) {
          updatedRows = data;
        } else if (error) {
          dbErrorMsg = error.message;
        }
      }

      if ((!updatedRows || updatedRows.length === 0) && recordId) {
        const { data, error } = await supabase
          .from('transactions')
          .update(updatePayload)
          .eq('id', recordId)
          .select();

        if (!error && data && data.length > 0) {
          updatedRows = data;
        } else if (error) {
          dbErrorMsg = error.message;
        }
      }
    }

    if (updatedRows && updatedRows.length > 0) {
      console.log(
        `[Circle Webhook] Successfully updated transaction in Supabase. ID: ${updatedRows[0].id}, Status: ${updatedRows[0].status}`
      );
    } else {
      console.warn(
        `[Circle Webhook] No matching transaction found to update for ID: ${transactionId || recordId}. Notice: ${dbErrorMsg || 'No matching row'}`
      );
    }

    // Return 200 OK to acknowledge receipt to Circle
    res.status(200).json({
      success: true,
      message: 'Circle webhook notification processed successfully.',
      walletId,
      transactionId: transactionId || updatedRows?.[0]?.transaction_id,
      state: normalizedState,
      txHash,
      updatedRecordId: updatedRows?.[0]?.id || recordId || null,
      rowsUpdated: updatedRows?.length || 0,
    });
  } catch (error: any) {
    console.error('[Circle Webhook] Unhandled exception:', error);
    // Respond 200 to prevent notification storms from webhook providers
    res.status(200).json({
      success: false,
      error: error.message || 'Internal webhook processing error',
    });
  }
});

/**
 * POST /api/v1/webhooks/subscriptions
 * Register a tenant webhook endpoint
 */
router.post('/subscriptions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orgId, url, events } = req.body;
    if (!url || !url.startsWith('http')) {
      res.status(400).json({ success: false, error: 'Valid HTTP(S) webhook url is required' });
      return;
    }

    const endpoint = await webhookService.registerEndpoint(
      orgId || req.orgId || '00000000-0000-0000-0000-000000000001',
      url,
      events
    );

    res.status(201).json({
      success: true,
      endpoint,
      message: 'Webhook subscription created successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/webhooks/subscriptions
 * List registered webhook endpoints
 */
router.get('/subscriptions', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = (req.query.orgId as string) || req.orgId;
    const endpoints = await webhookService.listEndpoints(orgId);
    res.json({ success: true, count: endpoints.length, endpoints });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/webhooks/events
 * List webhook delivery logs
 */
router.get('/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = (req.query.orgId as string) || req.orgId;
    const limit = Number(req.query.limit) || 50;
    const events = await webhookService.listEvents(orgId, limit);
    res.json({ success: true, count: events.length, events });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
