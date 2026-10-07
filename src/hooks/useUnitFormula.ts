import { useEffect, useState } from 'react';
import { unitTransactionItemService, UnitFormulaInput, UnitFormulaResult } from '@/services/unitTransactionItem.service';

export function useUnitFormula(form: UnitFormulaInput) {
  const [formula, setFormula] = useState<UnitFormulaResult | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    qty_total,
    price,
    bbn_price,
    expedition_fee,
    other_fee,
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

    if (!qty || qty <= 0 || !priceVal || priceVal < 0) {
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
          dpp_tax_id,
          ppn_tax_id,
          price_per_unit_usd: price_per_unit_usd ? Number(price_per_unit_usd) : undefined,
          price_usd: price_usd ? Number(price_usd) : undefined,
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
    dpp_tax_id,
    ppn_tax_id,
    price_per_unit_usd,
    price_usd,
    usd_costs,
    usdCostsSerialized,
  ]);

  return { formula, loading };
}
