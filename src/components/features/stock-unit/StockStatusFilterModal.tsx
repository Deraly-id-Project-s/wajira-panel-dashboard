"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StockStatus } from '@/types/stock-unit.types';
import { cn } from '@/lib/utils';

interface StockStatusFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeStatus: StockStatus | 'all' | undefined;
    onSelectStatus: (status: StockStatus | 'all' | undefined) => void;
}

const statusDisplayNames: Record<StockStatus | 'all', string> = {
    all: 'Semua Status',
    draft: 'Draf',
    cancel: 'Batal',
    rejected: 'Ditolak',
    prepare: 'Persiapan',
    inbound_purcase_order: 'Inbound Pesanan Pembelian',
    inbound_incoming_goods: 'Inbound Barang Masuk',
    inbound_receipt: 'Inbound Penerimaan',
    inbound_return: 'Inbound Retur',
    outbound_reserved: 'Outbound Dipesan',
    outbound_in_transit: 'Outbound Dalam Pengiriman',
    outbound_delivered: 'Outbound Terkirim',
    outbound_return: 'Outbound Retur',
};

const statusCategories = {
    umum: ['draft', 'cancel', 'rejected'],
    inbound: ['prepare', 'inbound_purcase_order', 'inbound_incoming_goods', 'inbound_receipt', 'inbound_return'],
    outbound: ['outbound_reserved', 'outbound_in_transit', 'outbound_delivered', 'outbound_return'],
};

export default function StockStatusFilterModal({ isOpen, onClose, activeStatus, onSelectStatus }: StockStatusFilterModalProps) {
    const handleSelect = (status: StockStatus | 'all') => {
        onSelectStatus(status === 'all' ? undefined : status);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Filter Status Unit</DialogTitle>
                    <DialogDescription>Pilih status unit untuk memfilter tabel.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Button
                        variant={activeStatus === undefined ? 'default' : 'outline'}
                        onClick={() => handleSelect('all')}
                        className="w-full justify-start"
                    >
                        {statusDisplayNames['all']}
                    </Button>

                    <h3 className="text-lg font-semibold mt-4">Umum</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {statusCategories.umum.map((status) => (
                            <Button
                                key={status}
                                variant={activeStatus === status ? 'default' : 'outline'}
                                onClick={() => handleSelect(status as StockStatus)}
                            >
                                {statusDisplayNames[status as StockStatus]}
                            </Button>
                        ))}
                    </div>

                    <h3 className="text-lg font-semibold mt-4">Inbound / Pembelian Unit</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {statusCategories.inbound.map((status) => (
                            <Button
                                key={status}
                                variant={activeStatus === status ? 'default' : 'outline'}
                                onClick={() => handleSelect(status as StockStatus)}
                            >
                                {statusDisplayNames[status as StockStatus]}
                            </Button>
                        ))}
                    </div>

                    <h3 className="text-lg font-semibold mt-4">Outbound / Penjualan Unit</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {statusCategories.outbound.map((status) => (
                            <Button
                                key={status}
                                variant={activeStatus === status ? 'default' : 'outline'}
                                onClick={() => handleSelect(status as StockStatus)}
                            >
                                {statusDisplayNames[status as StockStatus]}
                            </Button>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={onClose}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}