import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CsvGuideProps {
    headers: string[];
    rows: React.ReactNode[][];
    guideNotes?: React.ReactNode;
}

export function CsvGuide({ headers, rows, guideNotes }: CsvGuideProps) {
    return (
        <div className="rounded-md bg-orange-50/70 border border-orange-200/60 p-4">
            <h4 className="text-sm font-medium text-orange-900 mb-2">Panduan Struktur File CSV</h4>
            <p className="text-xs text-orange-800/90 mb-3">
                File excel/CSV anda wajib memiliki header (baris pertama) persis seperti di bawah ini:
            </p>
            <div className="rounded-md border bg-white overflow-x-auto">
                <Table className="text-xs">
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            {headers.map((header, idx) => (
                                <TableHead key={idx} className="h-8 py-1 whitespace-nowrap">{header}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, rowIdx) => (
                            <TableRow key={rowIdx}>
                                {row.map((cell, cellIdx) => (
                                    <TableCell key={cellIdx} className="py-1 whitespace-nowrap">{cell}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {guideNotes && (
                <p className="text-[10px] text-orange-700 mt-2 font-medium">
                    {guideNotes}
                </p>
            )}
        </div>
    );
}
