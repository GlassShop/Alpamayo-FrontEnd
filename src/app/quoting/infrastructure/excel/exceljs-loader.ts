import type ExcelJS from 'exceljs';

/**
 * Loads ExcelJS on demand so its ~1 MB never weighs on the initial page load.
 * Handles both ESM and UMD/CommonJS shapes of the bundled module.
 */
export async function loadExcelJs(): Promise<typeof ExcelJS> {
  const mod: any = await import('exceljs');
  return (mod.default ?? mod) as typeof ExcelJS;
}
