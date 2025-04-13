/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

// href="https://trustseal.enamad.ir/?id=593304&Code=iBVvanLu9LP3vHi1re7rpmxqplW0S7mq"
export default function Enamad() {
  return process.env.NODE_ENV === "production" ? (
    <a target="_blank" referrerPolicy="origin">
      <img
        alt="enamad"
        referrerPolicy="origin"
        src="https://trustseal.enamad.ir/logo.aspx?id=593304&Code=iBVvanLu9LP3vHi1re7rpmxqplW0S7mq"
        style={{ cursor: "pointer" }}
        {...({ code: "iBVvanLu9LP3vHi1re7rpmxqplW0S7mq" } as any)}
      />
    </a>
  ) : (
    <></>
  );
}
