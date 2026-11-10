'use client';

import React from 'react';
import { SuppliersManager } from '@/components/accounting/suppliers-manager';
import { RoleGuard } from '@/components/role-guard';

export default function RetailerProvidersPage() {
  return (
    <RoleGuard moduleName="Proveedores">
      <SuppliersManager 
        ownerRole="retailer"
        backHref="/redeconomix/dashboard-negocio"
        title="Proveedores & Mayoristas"
        accentColor="red"
      />
    </RoleGuard>
  );
}
