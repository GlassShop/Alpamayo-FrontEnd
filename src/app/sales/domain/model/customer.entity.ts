export interface Customer {
  id: string;
  name: string;
  docType: 'RUC' | 'DNI';
  docNumber: string;
}

