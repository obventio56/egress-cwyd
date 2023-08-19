/**
 * Ensure that example row columns are never unworkably long
 *
 * @param exampleRows
 */

const MAX_COLUMN_LENGTH = 140;
export const truncateExampleColumns = (exampleRows: any[]) => {
  return exampleRows.map((row) => {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]: any) => {
        if (typeof value === "string" && value.length > MAX_COLUMN_LENGTH) {
          return [
            key,
            `${value.slice(
              0,
              MAX_COLUMN_LENGTH
            )}... column continues but truncated for brevity`,
          ];
        }
        return [key, value];
      })
    );
  });
};
