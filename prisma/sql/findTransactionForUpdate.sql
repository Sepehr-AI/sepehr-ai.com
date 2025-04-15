-- @param {Int} $1:id
SELECT id, amount, "respCode", "traceNumber"
FROM "Transaction"
WHERE id = $1
  AND "createdAt" >= NOW() - INTERVAL '15 minutes'
FOR UPDATE
