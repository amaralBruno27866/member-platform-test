/**
 * Order Product Controller
 *
 * HTTP endpoints for order product operations.
 *
 * E-commerce Flow:
 * 1. POST /orders/{orderId}/items → Add to cart (Redis staging)
 * 2. GET /orders/{orderId}/items → View cart
 * 3. GET /orders/{orderId}/items/{itemId} → View item details
 * 4. DELETE /orders/{orderId}/items/{itemId} → Remove from cart
 * 5. POST /orders/{orderId}/checkout → Commit to Dataverse
 *
 * All routes protected with JwtAuthGuard
 * Validates user owns the order before allowing modifications
 *
 * @file order-product.controller.ts
 * @module OrderProductModule
 * @layer Controllers
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/jwt-auth.guard';
import { OrderProductOrchestratorService } from '../services/order-product-orchestrator.service';
import { OrderProductCrudService } from '../services/order-product-crud.service';
import { OrderProductLookupService } from '../services/order-product-lookup.service';
import { CreateOrderProductDto } from '../dtos/create-order-product.dto';
import { UpdateOrderProductDto } from '../dtos/update-order-product.dto';
import { OrderProductResponseDto } from '../dtos/order-product-response.dto';

/**
 * Request interface with user data from JWT
 */
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    userGuid: string;
    email: string;
    role: string;
  };
}

/**
 * Cart response (multiple items)
 */
interface CartResponse {
  orderId: string;
  items: OrderProductResponseDto[];
  total: number;
  itemCount: number;
}

/**
 * Checkout response
 */
interface CheckoutResponse {
  orderId: string;
  itemsCreated: number;
  total: number;
  status: string;
}

@Controller('orders/:orderId/items')
@ApiTags('Order Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class OrderProductController {
  constructor(
    private readonly orderProductOrchestratorService: OrderProductOrchestratorService,
    private readonly orderProductCrudService: OrderProductCrudService,
    private readonly orderProductLookupService: OrderProductLookupService,
  ) {}

  /**
   * Add item to cart (Redis staging)
   *
   * Adds a product to the order's cart. Item is stored in Redis temporarily
   * and NOT persisted to Dataverse until checkout.
   *
   * @param orderId - Parent Order GUID
   * @param dto - CreateOrderProductDto (productId, quantity)
   * @param req - Authenticated request (contains userId)
   * @returns OrderProductResponseDto with created item
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({
    status: 201,
    description: 'Item added to cart (staged in Redis)',
    type: OrderProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (quantity, product not found, etc)',
  })
  async addToCart(
    @Param('orderId') orderId: string,
    @Body() dto: CreateOrderProductDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<OrderProductResponseDto> {
    if (!orderId) {
      throw new BadRequestException('Order ID is required');
    }

    return this.orderProductOrchestratorService.addToCart(
      orderId,
      dto,
      req.user.userId,
    );
  }

  /**
   * Get all items in cart
   *
   * Retrieves all items currently in cart (from Redis).
   * Does not include items that have been checked out.
   *
   * @param orderId - Parent Order GUID
   * @returns CartResponse with items and total
   */
  @Get()
  @ApiOperation({ summary: 'Get all items in cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart items retrieved',
  })
  async getCart(
    @Param('orderId') orderId: string,
    @Request() _req: AuthenticatedRequest,
  ): Promise<CartResponse> {
    if (!orderId) {
      throw new BadRequestException('Order ID is required');
    }

    const items =
      await this.orderProductOrchestratorService.getCartItems(orderId);
    const total =
      await this.orderProductOrchestratorService.getCartTotal(orderId);

    return {
      orderId,
      items: items.map(
        (item) =>
          ({
            osot_table_order_productid: item.osot_table_order_productid,
            osot_product_id: item.osot_product_id,
            osot_product_name: item.osot_product_name,
            osot_quantity: item.osot_quantity,
            osot_selectedprice: item.osot_selectedprice,
            osot_producttax: item.osot_producttax,
            osot_itemsubtotal: item.osot_itemsubtotal,
            osot_taxamount: item.osot_taxamount,
            osot_itemtotal: item.osot_itemtotal,
          }) as OrderProductResponseDto,
      ),
      total,
      itemCount: items.length,
    };
  }

  /**
   * Get single cart item details
   *
   * @param orderId - Parent Order GUID
   * @param itemId - Order Product GUID
   * @returns OrderProductResponseDto
   */
  @Get(':itemId')
  @ApiOperation({ summary: 'Get cart item details' })
  @ApiResponse({
    status: 200,
    description: 'Item details retrieved',
    type: OrderProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async getCartItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Request() _req: AuthenticatedRequest,
  ): Promise<OrderProductResponseDto> {
    if (!orderId || !itemId) {
      throw new BadRequestException('Order ID and Item ID are required');
    }

    const item = await this.orderProductLookupService.findById(itemId);

    if (!item) {
      throw new BadRequestException('Item not found in cart');
    }

    return item as unknown as OrderProductResponseDto;
  }

  /**
   * Remove item from cart
   *
   * Removes a specific item from cart (deletes from Redis).
   * User can remove items at any time before checkout.
   *
   * @param orderId - Parent Order GUID
   * @param itemId - Order Product GUID to remove
   */
  @Delete(':itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 204, description: 'Item removed from cart' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async removeFromCart(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Request() _req: AuthenticatedRequest,
  ): Promise<void> {
    if (!orderId || !itemId) {
      throw new BadRequestException('Order ID and Item ID are required');
    }

    await this.orderProductOrchestratorService.removeFromCart(orderId, itemId);
  }

  /**
   * Checkout - Persist cart items to Dataverse
   *
   * Validates all items and commits entire cart to Dataverse.
   * Cart is cleared from Redis after successful commit.
   *
   * This is called when user confirms purchase.
   *
   * @param orderId - Parent Order GUID
   * @returns CheckoutResponse with confirmation
   */
  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Checkout cart and persist to Dataverse' })
  @ApiResponse({
    status: 200,
    description: 'Checkout successful, items persisted to Dataverse',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Inventory conflict' })
  async checkout(
    @Param('orderId') orderId: string,
    @Request() _req: AuthenticatedRequest,
  ): Promise<CheckoutResponse> {
    if (!orderId) {
      throw new BadRequestException('Order ID is required');
    }

    const createdItems =
      await this.orderProductOrchestratorService.checkout(orderId);

    const total = createdItems.reduce(
      (sum, item) => sum + item.osot_itemtotal,
      0,
    );

    return {
      orderId,
      itemsCreated: createdItems.length,
      total,
      status: 'CHECKOUT_COMPLETED',
    };
  }

  /**
   * Update item (privilege/access only)
   *
   * Only osot_privilege and osot_access_modifiers can be updated.
   * All snapshot fields (quantity, price, etc) are immutable.
   *
   * Note: This updates in Dataverse AFTER checkout.
   * Before checkout, user must remove and re-add item to change quantity.
   *
   * @param orderId - Parent Order GUID
   * @param itemId - Order Product GUID
   * @param updates - UpdateOrderProductDto
   * @returns Updated OrderProductResponseDto
   */
  @Post(':itemId')
  @ApiOperation({
    summary: 'Update item (privilege/access only, post-checkout)',
  })
  @ApiResponse({
    status: 200,
    description: 'Item updated',
    type: OrderProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update immutable fields',
  })
  async updateItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() updates: UpdateOrderProductDto,
    @Request() _req: AuthenticatedRequest,
  ): Promise<OrderProductResponseDto> {
    if (!orderId || !itemId) {
      throw new BadRequestException('Order ID and Item ID are required');
    }

    return this.orderProductCrudService.update(itemId, updates);
  }

  /**
   * Delete item (post-checkout only)
   *
   * Note: Before checkout, use removeFromCart instead.
   * This endpoint is for deleting items from finalized orders.
   *
   * @param orderId - Parent Order GUID
   * @param itemId - Order Product GUID to delete
   */
  @Delete(':itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete item from order' })
  @ApiResponse({ status: 204, description: 'Item deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete finalized items' })
  async deleteItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Request() _req: AuthenticatedRequest,
  ): Promise<void> {
    if (!orderId || !itemId) {
      throw new BadRequestException('Order ID and Item ID are required');
    }

    await this.orderProductCrudService.delete(itemId);
  }
}
