'use client';

import React from 'react';
import { InvoicesManager } from '@/components/accounting/invoices-manager';
import { RoleGuard } from '@/components/role-guard';

export default function RetailerAccountingPage() {
  return (
    <RoleGuard moduleName="Contabilidad">
      <InvoicesManager 
        ownerRole="retailer"
        backHref="/redeconomix/dashboard-negocio"
        title="Contabilidad & Facturas"
        accentColor="red"
      />
    </RoleGuard>
  );
}
