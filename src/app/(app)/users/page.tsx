import type { Metadata } from 'next';import { UsersClient } from './users-client';export const metadata:Metadata={title:'Users & Roles'};export default function Page(){return <UsersClient/>}
