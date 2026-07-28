import { z } from 'zod';
import { DELIVERY_STATUS_VALUES, type DeliveryStatus } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { NotFoundError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { Order } from '@/models/Order';
type Params={id:string};
const schema=z.object({status:z.enum(DELIVERY_STATUS_VALUES as [DeliveryStatus,...DeliveryStatus[]]).optional(),driverId:z.string().nullable().optional(),estimatedDeliveryAt:z.coerce.date().nullable().optional()});
export const PATCH=defineRoute<z.infer<typeof schema>,Params>({permissions:[PERMISSIONS.DELIVERY_MANAGE],bodySchema:schema},async({params,body,user})=>{
 const update:Record<string,unknown>={}; if(body.status)update['delivery.status']=body.status;if(body.driverId!==undefined)update['delivery.driverId']=body.driverId;if(body.estimatedDeliveryAt!==undefined)update['delivery.estimatedDeliveryAt']=body.estimatedDeliveryAt;
 const order=await Order.findOneAndUpdate({_id:params.id,restaurantId:user.restaurantId,type:'delivery'},{$set:update},{new:true}).lean();if(!order)throw new NotFoundError('Delivery order');return ok(order);
});
