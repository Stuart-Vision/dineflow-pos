import { z } from 'zod';
import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { created, ok } from '@/lib/api/response';
import { Branch } from '@/models/Branch';
const schema=z.object({name:z.string().min(1).max(160),code:z.string().min(2).max(12),phone:z.string().min(1),email:z.string().email().optional().or(z.literal('')),currency:z.string().min(3).max(3).default('USD'),timezone:z.string().default('UTC'),address:z.object({line1:z.string().min(1),city:z.string().min(1),country:z.string().min(1),state:z.string().optional(),postalCode:z.string().optional()}),isActive:z.boolean().default(true)});
export const GET=defineRoute({permissions:[PERMISSIONS.BRANCH_VIEW]},async({user})=>ok(await Branch.find({restaurantId:user.restaurantId,deletedAt:null}).sort({isMain:-1,name:1}).lean()));
export const POST=defineRoute({permissions:[PERMISSIONS.BRANCH_MANAGE],bodySchema:schema},async({body,user})=>created(await Branch.create({restaurantId:user.restaurantId,...body,email:body.email||undefined,openingHours:[0,1,2,3,4,5,6].map(day=>({day,open:'09:00',close:'22:00',isClosed:false}))})));
