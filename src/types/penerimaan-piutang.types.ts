import type { CreateLiabilityPaymentPayload, LiabilityDetail, LiabilityListItem, LiabilityListResult } from '@/types/pembayaran-hutang.types';

export type PenerimaanPiutang = LiabilityListItem;
export type PenerimaanPiutangListResult = LiabilityListResult;
export type PenerimaanPiutangDetail = LiabilityDetail;
export type CreatePenerimaanPiutangPaymentPayload = CreateLiabilityPaymentPayload;
