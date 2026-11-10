'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import {
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';

export function MarketplaceHeader() {
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        router.push('/');
      } catch (error) {
        console.error("Error signing out: ", error);
      }
    }
  };


  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container mx-auto flex h-20 max-sm:h-14 items-center justify-end gap-4 px-4 md:px-6">
        <div className="flex items-center gap-4">
          {isUserLoading ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : user && !user.isAnonymous ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar className="h-9 w-9">
                    {user.photoURL ? <AvatarImage src={user.photoURL} alt={user.displayName || 'Avatar'} /> : <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email!.charAt(0).toUpperCase()}</AvatarFallback>}
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push('/wallet')}>Mis Compras</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push('/ingresos')}>Mis Ingresos</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4"/>
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login">
                <UserIcon className="mr-2 h-4 w-4" />
                Ingresar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
