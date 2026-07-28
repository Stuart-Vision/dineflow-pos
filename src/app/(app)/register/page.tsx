import type { Metadata } from 'next';
import { RegisterClient } from './register-client';
export const metadata: Metadata = { title: 'Cash Register' };
export default function RegisterPage(){return <RegisterClient/>}
