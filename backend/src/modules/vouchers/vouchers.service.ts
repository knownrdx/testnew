import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler.middleware';
import { generateBulkCodes } from '../../utils/voucher.generator';
import { z } from 'zod';

export const generateVouchersSchema = z.object({
  count: z.coerce.number().int().min(1).max(500).default(10),
  maxUses: z.coerce.number().int().min(1).default(1),
  bandwidthProfileId: z.string().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export interface VoucherWithCode {
  id: string;
  code: string; // plaintext, shown once
  maxUses: number;
  usedCount: number;
  bandwidthProfileId: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export async function generateVouchers(
  hotelId: string,
  data: z.infer<typeof generateVouchersSchema>,
): Promise<VoucherWithCode[]> {
  const codes = generateBulkCodes(data.count);
  const results: VoucherWithCode[] = [];

  for (const code of codes) {
    const hashedCode = await bcrypt.hash(code, 10);
    const voucher = await prisma.voucher.create({
      data: {
        hotelId,
        code: hashedCode,
        maxUses: data.maxUses,
        bandwidthProfileId: data.bandwidthProfileId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
    results.push({
      id: voucher.id,
      code, // plaintext returned once
      maxUses: voucher.maxUses,
      usedCount: voucher.usedCount,
      bandwidthProfileId: voucher.bandwidthProfileId,
      expiresAt: voucher.expiresAt,
      isActive: voucher.isActive,
      createdAt: voucher.createdAt,
    });
  }

  return results;
}

export async function listVouchers(hotelId: string, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [vouchers, total] = await Promise.all([
    prisma.voucher.findMany({
      where: { hotelId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { bandwidthProfile: true },
    }),
    prisma.voucher.count({ where: { hotelId } }),
  ]);
  return { vouchers, total, page, limit };
}

export async function validateVoucher(
  hotelId: string,
  code: string,
): Promise<{ valid: boolean; voucherId?: string; bandwidthProfileId?: string | null }> {
  const vouchers = await prisma.voucher.findMany({
    where: { hotelId, isActive: true },
  });

  for (const voucher of vouchers) {
    if (voucher.expiresAt && voucher.expiresAt < new Date()) continue;
    if (voucher.usedCount >= voucher.maxUses) continue;

    const match = await bcrypt.compare(code, voucher.code);
    if (match) {
      return { valid: true, voucherId: voucher.id, bandwidthProfileId: voucher.bandwidthProfileId };
    }
  }

  return { valid: false };
}

export async function redeemVoucher(voucherId: string): Promise<void> {
  await prisma.voucher.update({
    where: { id: voucherId },
    data: {
      usedCount: { increment: 1 },
      isActive: {
        // Deactivate if single-use
      },
    },
  });

  const voucher = await prisma.voucher.findUnique({ where: { id: voucherId } });
  if (voucher && voucher.usedCount >= voucher.maxUses) {
    await prisma.voucher.update({ where: { id: voucherId }, data: { isActive: false } });
  }
}

export async function deactivateVoucher(id: string, hotelId: string): Promise<void> {
  const voucher = await prisma.voucher.findFirst({ where: { id, hotelId } });
  if (!voucher) throw new AppError(404, 'Voucher not found');
  await prisma.voucher.update({ where: { id }, data: { isActive: false } });
}
