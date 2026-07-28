import mongoose from 'mongoose';
import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { Expense } from '@/models/Expense';
import { Ingredient } from '@/models/Ingredient';
import { Order } from '@/models/Order';
import { Payment } from '@/models/Payment';

export const GET=defineRoute({anyPermission:[PERMISSIONS.REPORT_VIEW_SALES,PERMISSIONS.REPORT_VIEW_FINANCIAL,PERMISSIONS.REPORT_VIEW_INVENTORY,PERMISSIONS.REPORT_VIEW_STAFF]},async({user,branchId,query})=>{
 const from=query.from??new Date(Date.now()-29*86_400_000);from.setHours(0,0,0,0);const to=query.to??new Date();to.setHours(23,59,59,999);
 const match:Record<string,unknown>={restaurantId:new mongoose.Types.ObjectId(user.restaurantId!),createdAt:{$gte:from,$lte:to},status:{$in:['paid','completed','partially_refunded','refunded']}};if(branchId)match.branchId=new mongoose.Types.ObjectId(branchId);
 const expenseMatch:Record<string,unknown>={restaurantId:new mongoose.Types.ObjectId(user.restaurantId!),expenseDate:{$gte:from,$lte:to},status:'approved',deletedAt:null};if(branchId)expenseMatch.branchId=new mongoose.Types.ObjectId(branchId);
 const [daily,types,categories,totals,expenses,payments,lowStock]=await Promise.all([
  Order.aggregate([{$match:match},{$group:{_id:{$dateToString:{format:'%Y-%m-%d',date:'$createdAt'}},revenue:{$sum:'$grandTotalMinor'},orders:{$sum:1}}},{$sort:{_id:1}}]),
  Order.aggregate([{$match:match},{$group:{_id:'$type',revenue:{$sum:'$grandTotalMinor'},orders:{$sum:1}}},{$sort:{revenue:-1}}]),
  Order.aggregate([{$match:match},{$unwind:'$items'},{$group:{_id:'$items.name',revenue:{$sum:{$multiply:['$items.unitPriceMinor','$items.quantity']}},quantity:{$sum:'$items.quantity'}}},{$sort:{revenue:-1}},{$limit:10}]),
  Order.aggregate([{$match:match},{$group:{_id:null,revenue:{$sum:'$grandTotalMinor'},orders:{$sum:1},discounts:{$sum:'$discountTotalMinor'},tax:{$sum:'$taxMinor'},avgOrder:{$avg:'$grandTotalMinor'}}}]),
  Expense.aggregate([{$match:expenseMatch},{$group:{_id:'$category',amount:{$sum:'$amountMinor'}}},{$sort:{amount:-1}}]),
  Payment.aggregate([{$match:{restaurantId:new mongoose.Types.ObjectId(user.restaurantId!),createdAt:{$gte:from,$lte:to},status:'completed'}},{$group:{_id:'$method',amount:{$sum:'$amountMinor'},count:{$sum:1}}},{$sort:{amount:-1}}]),
  Ingredient.find({restaurantId:user.restaurantId,...(branchId?{branchId}:{}),$expr:{$lte:['$currentStockBase','$reorderLevelBase']}}).select('name currentStockBase reorderLevelBase consumptionUnit').limit(20).lean(),
 ]);
 const expenseTotal=expenses.reduce((s:number,e:{amount:number})=>s+e.amount,0);return ok({range:{from:from.toISOString(),to:to.toISOString()},summary:{...(totals[0]??{revenue:0,orders:0,discounts:0,tax:0,avgOrder:0}),expenses:expenseTotal,netProfit:(totals[0]?.revenue??0)-expenseTotal},daily,types,categories,expenses,payments,lowStock});
});
