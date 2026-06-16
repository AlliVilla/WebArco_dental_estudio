import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { obtenerHoyLocal } from "./formatters";

type Column = { header: string; key: string; width: number };

export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: Column[],
  sheetName: string,
  fileName: string,
): Promise<void> {
  if (data.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns;

  const headerRow = worksheet.getRow(1);
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0BC5DF" },
  };
  headerRow.font = {
    color: { argb: "FFFFFFFF" },
    bold: true,
    size: 12,
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  data.forEach((row, index) => {
    const addedRow = worksheet.addRow(row);

    if (index % 2 === 0) {
      addedRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8F9FA" },
      };
    }

    const currencyKeys = ["monto", "precio_costo", "valor_total"];
    currencyKeys.forEach((key) => {
      if (row[key] != null && typeof row[key] === "number") {
        addedRow.getCell(key).numFmt = '"L." #,##0.00';
      }
    });

    addedRow.alignment = { vertical: "middle" };
    addedRow.font = { color: { argb: "FF203F49" } };
  });

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFD3D7DA" } },
        left: { style: "thin", color: { argb: "FFD3D7DA" } },
        bottom: { style: "thin", color: { argb: "FFD3D7DA" } },
        right: { style: "thin", color: { argb: "FFD3D7DA" } },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${fileName}_${obtenerHoyLocal()}.xlsx`);
}
