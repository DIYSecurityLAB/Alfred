import { Order } from '../../domain/entities/Order';
import { paymentSchema } from '../../domain/validations/paymentValidation';
import { paymentService } from '../../infrastructure/services/paymentService';
import { Result } from '../../utils/Result';
import { UseCase } from '../../utils/UseCase';

export interface ProcessPaymentRequest {
  PaymentRequest: Order;
}

export class ProcessPaymentUseCase
  implements
    UseCase<ProcessPaymentRequest, Promise<Result<Order, { code: string }>>>
{
  async execute(
    request: ProcessPaymentRequest,
  ): Promise<Result<Order, { code: string }>> {
    const validation = paymentSchema.safeParse(request.PaymentRequest);
    if (!validation.success) {
      return Result.Error({ code: 'INVALID_DATA' });
    }

    try {
      const order = await paymentService.createOrder(validation.data);
      return Result.Success(order);
    } catch (error) {
      console.error('Error while creating order:', error);
      return Result.Error({ code: 'UNKNOWN' });
    }
  }
}
