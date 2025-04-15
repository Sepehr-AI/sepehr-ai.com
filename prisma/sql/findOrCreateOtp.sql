-- @param {String} $1:mobile
-- @param {String} $2:hashedOtp
INSERT INTO "Otp" ("userId", "code")
VALUES (
  (SELECT id FROM "User" WHERE mobile = $1),
  $2
)
ON CONFLICT ("userId")
DO UPDATE SET
  "code" = $2,
  "createdAt" = NOW()
WHERE "Otp"."createdAt" < (NOW() - INTERVAL '2 minute')
RETURNING "code";
