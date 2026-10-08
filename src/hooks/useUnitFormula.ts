import { useEffect, useState } from 'react';
import {
  unitTransactionItemService,
  UnitFormulaInput,
  UnitTransactionItemFormulaResponse,
} from '@/services/unitTransactionItem.service';

export function useUnitFormula(form: UnitFormulaInput) {
  const [formula, setFormula] = useState<UnitTransactionItemFormulaResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    qty_total,
    price,
    bbn_price,
    expedition_fee,
    other_fee,
    price_discount,
    price_usd_discount,
    dpp_tax_id,
    ppn_tax_id,
    price_per_unit_usd,
    price_usd,
    usd_costs,
  } = form;

  const usdCostsSerialized = JSON.stringify(usd_costs ?? []);

  useEffect(() => {
    const qty = Number(qty_total ?? 0);
    const priceVal = Number(price ?? 0);
    const priceUsdVal = Number(price_usd ?? 0);
    const pricePerUnitUsdVal = Number(price_per_unit_usd ?? 0);

    const hasPrice = priceVal > 0 || priceUsdVal > 0 || pricePerUnitUsdVal > 0;

    if (!qty || qty <= 0 || !hasPrice || priceVal < 0 || priceUsdVal < 0 || pricePerUnitUsdVal < 0) {
      setFormula(null);
      setLoading(false);
      return;
    }

    let active = true;

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await unitTransactionItemService.getFormula({
          qty_total: qty,
          price: priceVal,
          bbn_price: Number(bbn_price ?? 0),
          expedition_fee: Number(expedition_fee ?? 0),
          other_fee: Number(other_fee ?? 0),
          price_discount: Number(price_discount ?? 0),
          price_usd_discount: Number(price_usd_discount ?? 0),
          dpp_tax_id,
          ppn_tax_id,
          price_per_unit_usd: price_per_unit_usd !== undefined && price_per_unit_usd !== null && price_per_unit_usd !== '' ? Number(price_per_unit_usd) : undefined,
          price_usd: price_usd !== undefined && price_usd !== null && price_usd !== '' ? Number(price_usd) : undefined,
          usd_costs,
        });

        if (!active) return;
        setFormula(result);
      } catch {
        if (!active) return;
        setFormula(null);
      } finally {
        if (active) setLoading(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [
    qty_total,
    price,
    bbn_price,
    expedition_fee,
    other_fee,
    price_discount,
    price_usd_discount,
    dpp_tax_id,
    ppn_tax_id,
    price_per_unit_usd,
    price_usd,
    usd_costs,
    usdCostsSerialized,
  ]);

  return { formula, loading };
}
