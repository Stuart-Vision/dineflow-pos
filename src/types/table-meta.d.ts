import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  /**
   * Lets a column declare itself numeric so the shared DataTable can
   * right-align and tabular-align it without each page repeating classes.
   *
   * The two generics are required to match the interface being augmented,
   * even though this declaration does not reference them.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    numeric?: boolean;
  }
}
