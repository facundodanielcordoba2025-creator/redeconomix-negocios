'use client';

import React from 'react';
import { ProjectsManager } from '@/components/accounting/projects-manager';
import { RoleGuard } from '@/components/role-guard';

export default function RetailerProjectsPage() {
  return (
    <RoleGuard moduleName="Proyectos">
      <ProjectsManager 
        ownerRole="retailer"
        backHref="/redeconomix/dashboard-negocio"
        title="Proyectos de Sucursales"
        accentColor="red"
      />
    </RoleGuard>
  );
}
