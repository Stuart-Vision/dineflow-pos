import type { Metadata } from 'next';import { AuditClient } from './audit-client';export const metadata:Metadata={title:'Audit Log'};export default function Page(){return <AuditClient/>}
