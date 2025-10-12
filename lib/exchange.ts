"use server";

import NodeCache from "node-cache";
import { z } from "zod";

const brsapiSchema = z.object({
  currency: z.array(
    z.object({
      unit: z.string(),
      name: z.string(),
      price: z.number(),
      symbol: z.string(),
    }),
  ),
});

const cacheKey = "exchangeRate";
let last_price: number = 1_050_000;
const cache = new NodeCache({ stdTTL: 70 });
const BRSAPI_KEY = process.env.BRSAPI_KEY as string;

function onError(response: unknown, msg: string): number {
  console.error({
    msg,
    info: response,
  });

  const cachedV = cache.get(cacheKey);
  if (cachedV) {
    return cachedV as number;
  } else {
    cache.set(cacheKey, last_price);
    return last_price;
  }
}

export default async function getExchangeRate(): Promise<number> {
  let data: number | null | undefined = cache.get(cacheKey);

  if (!data) {
    let json: unknown;
    let response: Response;
    try {
      response = await fetch(
        `https://BrsApi.ir/Api/Market/Gold_Currency.php?key=${BRSAPI_KEY}`,
      );
    } catch (e) {
      return onError(e, "Exchange: Unsuccessful fetch!");
    }
    try {
      json = await response.json();
    } catch (e) {
      return onError(e, "Exchange: Failed to parse the response body as json!");
    }
    if (response.status !== 200 || !json) {
      return onError(response, "Exchange: Unsuccessful status!");
    }

    const parsedJson = await brsapiSchema.safeParseAsync(json);
    if (!parsedJson.success) {
      return onError(response, "Exchange: Failed to parse the output!");
    }
    const apiData = parsedJson.data;

    let currency;
    if (apiData.currency[0].name === "دلار") {
      currency = apiData.currency[0];
    } else {
      currency = apiData.currency.filter(
        (e) => e.name === "ﺩﻻﺭ" || e.symbol === "USD",
      )[0];
      if (!currency) {
        return onError(response, "Exchange: Failed to find the USD rate!");
      }
    }

    if (currency.unit && currency.unit === "تومان") {
      data = currency.price * 10;
    } else data = currency.price;
    // 5000 tomas tolerance.
    data += 50_000;

    last_price = data;
    cache.set(cacheKey, data);
  }

  return data;
}
