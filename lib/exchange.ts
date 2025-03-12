"use server";

import NodeCache from "node-cache";

interface ApiCurrency {
  date: string;
  time: string;
  price: number;
  name: string;
  unit: string | undefined;
}

let last_price: number = 90000;
const cacheKey = "exchangeRate";
const cache = new NodeCache({ stdTTL: 70 });

function onError(response: unknown): number {
  console.error({
    msg: "Failed to fetch currency exchange rate.",
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
    const response = await fetch(
      "https://brsapi.ir/FreeTsetmcBourseApi/Api_Free_Gold_Currency.json",
    );
    const json: {
      currency: ApiCurrency[];
    } = await response.json();
    if (response.status !== 200 || !json || !json["currency"]) {
      return onError(response);
    }

    let currency: ApiCurrency;
    if (json.currency[0].name === "دلار") {
      currency = json.currency[0];
    } else {
      currency = json.currency.filter((e) => e.name === "ﺩﻻﺭ")?.[0];
      if (!currency) return onError(response);
    }

    if (currency.unit && currency.unit === "ریال") {
      data = currency.price * 10;
    } else data = currency.price;

    last_price = data;
    cache.set(cacheKey, data);
  }

  return data;
}
