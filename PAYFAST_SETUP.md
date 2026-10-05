# PayFast confirmation fix and deployment

## What was wrong

The old ITN handler reused the outgoing checkout signature helper. That helper
omits empty fields and trims values. PayFast's incoming notifications sign all
posted fields, including empty fields, in their original order. This causes
valid notifications to fail the signature check with HTTP 400.

The fix uses separate serializers for checkout and ITNs, preserves ITN values,
uses PHP-compatible form encoding (including `~`), and submits the unsigned
ITN parameter string to PayFast's server-validation endpoint.

Database read/write failures now produce a retryable error instead of an
acknowledgment. Conditional writes prevent duplicate timestamps, late failed
notifications overwriting paid orders, and payment confirmation resetting an
order already being fulfilled. The database total is checked in integer cents.

The return page reads server status for up to roughly two minutes and offers a
manual recheck afterward. It does not infer payment from the URL, show a success
tick for pending payments, or promise an email the application hasn't sent.
Admins can see the payment status, PayFast reference and payment date on an order.

## Deploy to the existing project

No additional database migration is required for this fix. The existing payment
columns must already be installed (the October 5 payment migration).

From this repository, authenticate locally and deploy **both** functions:

If the CLI returns HTTP 403, log in with an account that has permission to deploy
Edge Functions in this project's organization. During this repair the available
CLI account received that 403, so the remote functions could not be deployed.

```powershell
supabase login
supabase functions deploy payfast-itn --project-ref ewfxapllzhuniwqvsyxm --no-verify-jwt --use-api
supabase functions deploy payfast-checkout --project-ref ewfxapllzhuniwqvsyxm --no-verify-jwt --use-api
```

The functions are public endpoints because PayFast sends no Supabase JWT and
customers use guest checkout. ITN authentication is performed by the signature,
merchant, exact order amount, and PayFast server confirmation checks. Do not
bypass any of these checks. `supabase/config.toml` already has the correct JWT
settings. The `--use-api` option deploys without Docker.

Publish the updated frontend through your normal website deployment so the
return page and admin order details use the updated UI.

## Sandbox configuration

In Supabase **Edge Functions > Secrets**, keep these server-side only:

| Secret | Sandbox setting |
| --- | --- |
| `PAYFAST_SANDBOX` | `true` |
| `PAYFAST_MERCHANT_ID` | Your sandbox merchant ID |
| `PAYFAST_MERCHANT_KEY` | Your sandbox merchant key |
| `PAYFAST_PASSPHRASE` | Exactly the Salt Passphrase configured in the sandbox |

Do not include quotes or surrounding spaces in the secret values. No payment
credentials belong in `VITE_*` variables or in Git. Supabase provides
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to deployed functions.

The generated checkout form uses this callback:

```text
https://ewfxapllzhuniwqvsyxm.supabase.co/functions/v1/payfast-itn
```

Do not attach a browser login, redirect or JWT requirement to that URL.

## Verify and recover the failed test

1. After deployment, submit one sandbox checkout through the store.
2. Confirm PayFast's ITN log shows HTTP 200 with body `ok`.
3. Confirm the Supabase `payfast-itn` logs contain `payment_updated` for that
   order, or `already_paid` for a duplicate notification.
4. The order should contain `payment_status = paid`, the PayFast transaction
   reference, and `paid_at`. A new order becomes confirmed. Existing fulfilment
   statuses are preserved.
5. Refresh the payment return page or choose **Check payment again**. It must say
   **Payment received** only once the database confirms payment.

For the original failed test, inspect its state without altering it:

```sql
SELECT id, order_number, total, status, payment_status, payment_reference, paid_at
FROM public.orders
WHERE order_number = 'MBM-20261005-628C0721BD';
```

Sandbox notifications are sent once; deploying new code does not itself replay
the original ITN. If the sandbox dashboard offers a resend/retry action, resend
the original notification after deployment. Otherwise create a new sandbox
test order. Keep the old test order for diagnosis; do not manually mark it paid
just because the customer reached the return page.

## Diagnosing further ITN failures

Function logs record a reason and, after authentication, an order ID. They never
include notification bodies, signatures, passphrases or customer information.

| Response/log reason | Check |
| --- | --- |
| `bad_signature` (400) | Corrected function deployed; passphrase exactly matches the selected PayFast account |
| `bad_merchant` (400) | Merchant ID belongs to that sandbox/live account |
| `payfast_rejected_notification` (400) | Matching sandbox/live mode and an authentic PayFast notification |
| `amount_mismatch` (400) | Notification gross amount equals the stored order total after discounts |
| `order_not_found` (404) | Notification's `m_payment_id` is the stored order UUID |
| `payfast_validation_unavailable` (502) | PayFast validation endpoint returned a non-success HTTP response |
| `notification_processing_failed` (503) | Network timeout or database read/write failure; retry the notification |
| `order_changed_retry_notification` (503) | Concurrent order change; retry without changing the original notification |
| `different_payment_for_paid_order` (409) | A different payment was received for an already-paid order; investigate before any refund/action |
| `configuration_error` (500) | Required server secrets missing or sandbox flag/passphrase formatting invalid |

## Switching to live

Complete the sandbox verification above first. Then set `PAYFAST_SANDBOX=false`
and replace **all three** merchant credentials/passphrase with the live account's
values in Supabase secrets. Use a new live passphrase rather than one shared in
chat. Both functions select the same host from this setting; no source change
is needed. Use your production HTTPS storefront and verify one controlled live
transaction, its ITN and its stored payment status before accepting customers.
Old sandbox transactions cannot be validated against the live environment.

## References and local verification

- [PayFast custom integration and ITN documentation](https://developers.payfast.co.za/docs)
- [PayFast ITN security-check troubleshooting](https://support.payfast.help/portal/en/kb/articles/what-causes-the-itn-security-check-errors-20-9-2022)
- `npm test`: signed ITNs, blank fields, wrong signatures/merchants/amounts,
  provider/database failures, duplicate and concurrent notifications, and
  return-page polling/retry/cancellation tests. Fixtures use dummy credentials
  and mocked PayFast/database calls; no real orders are marked paid.
- `npx --yes deno check --no-lock supabase/functions/payfast-itn/index.ts supabase/functions/payfast-checkout/index.ts`
  checks the Edge Functions with their runtime dependencies.

Local tests do not prove that deployed secrets match your PayFast account. The
end-to-end sandbox test after deployment remains necessary.
