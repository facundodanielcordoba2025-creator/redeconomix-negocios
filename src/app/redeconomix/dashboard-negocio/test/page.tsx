'use client';

import React from 'react';
import Link from 'next/link';

export default function RecoveryPage() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#FF0000' }}>MODO RECUPERACIÓN</h1>
      <p>Si ves esta página, la conexión básica funciona.</p>
      
      <div style={{ display: 'grid', gap: '20px', marginTop: '40px' }}>
        <Link href="/redeconomix/dashboard-negocio/control-ventas" style={{ padding: '20px', background: '#000', color: '#fff', borderRadius: '15px', textDecoration: 'none', fontWeight: 'bold' }}>
          IR A TERMINAL DE VENTAS (DIRECTO)
        </Link>
        <Link href="/redeconomix/dashboard-negocio/stock" style={{ padding: '20px', background: '#333', color: '#fff', borderRadius: '15px', textDecoration: 'none', fontWeight: 'bold' }}>
          GESTIONAR STOCK
        </Link>
        <Link href="/redeconomix/dashboard-negocio" style={{ padding: '20px', background: '#eee', color: '#000', borderRadius: '15px', textDecoration: 'none' }}>
          VOLVER AL DASHBOARD ORIGINAL
        </Link>
      </div>
    </div>
  );
}
