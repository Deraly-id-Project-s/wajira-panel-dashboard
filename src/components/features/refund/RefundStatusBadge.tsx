import type { RefundApprovalStatus } from '@/types/finance-refund.types';
import { Badge } from '@/components/ui/badge';
import { getRefundStatusClasses, refundStatusLabel } from './refund.utils';

interface RefundStatusBadgeProps {
  status: RefundApprovalStatus;
}

export function RefundStatusBadge({ status }: RefundStatusBadgeProps) {
  return (
    <Badge variant="outline" className={getRefundStatusClasses(status)}>
      {refundStatusLabel[status]}
    </Badge>
  );
}
