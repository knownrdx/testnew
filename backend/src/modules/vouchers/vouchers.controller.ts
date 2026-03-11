import { Request, Response } from 'express';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { asyncHandler } from '../../utils/asyncHandler';
import * as svc from './vouchers.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const result = await svc.listVouchers(req.hotelId!, page, limit);
  res.json({ success: true, data: result });
});

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const data = svc.generateVouchersSchema.parse(req.body);
  const vouchers = await svc.generateVouchers(req.hotelId!, data);
  res.status(201).json({ success: true, data: vouchers });
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  await svc.deactivateVoucher(req.params.id, req.hotelId!);
  res.json({ success: true, message: 'Voucher deactivated' });
});

export const exportPdf = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({ codes: z.array(z.object({ id: z.string(), code: z.string() })) });
  const { codes } = schema.parse(req.body);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="vouchers.pdf"');
  doc.pipe(res);

  doc.fontSize(20).text('WiFi Voucher Codes', { align: 'center' });
  doc.moveDown();

  const perPage = 10;
  codes.forEach((v, i) => {
    if (i > 0 && i % perPage === 0) doc.addPage();
    doc
      .rect(50, doc.y, 495, 50)
      .stroke()
      .fontSize(14)
      .text(`Code: ${v.code}`, 60, doc.y + 15);
    doc.moveDown(2);
  });

  doc.end();
});
