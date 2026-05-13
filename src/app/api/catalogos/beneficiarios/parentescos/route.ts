// src/app/api/catalogos/parentescos/route.ts

import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export async function GET() {
  try {
    const result = await executeQuery(`
      SELECT ID_PARENTESCO, PARENTESCO
      FROM PARENTESCO
      WHERE VISIBLE = 1
      ORDER BY ID_PARENTESCO
    `);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('❌ Error al obtener parentescos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al consultar parentescos' },
      { status: 500 }
    );
  }
}