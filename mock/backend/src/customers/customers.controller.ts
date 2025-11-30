import { Controller, Post, Body, HttpCode, HttpStatus, Get, Put, UseGuards, Req, Delete, Param, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { CustomersService } from './customers.service';
import { LoginDto } from '../auth/dto/login.dto';
import { RegisterCustomerDto } from '../auth/dto/register-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(
    private authService: AuthService,
    private customersService: CustomersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new customer' })
  @ApiResponse({ status: 201, description: 'Customer registered successfully.' })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  async registerCustomer(@Body() registerCustomerDto: RegisterCustomerDto) {
    return this.authService.registerCustomer(registerCustomerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Customer login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginCustomer(@Body() loginDto: LoginDto) {
    return this.authService.loginCustomer(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Get customer profile' })
  @ApiResponse({ status: 200, description: 'Customer profile data' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  async getProfile(@Req() req) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated or token is invalid');
    }
    const customer = await this.customersService.findOne(Number(userId));
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({ summary: 'Update customer profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateProfile(@Req() req, @Body() updateData: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated or token is invalid');
    }
    return this.customersService.update(Number(userId), updateData);
  }
  
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('orders')
  @ApiOperation({ summary: 'Get customer order history' })
  @ApiResponse({ status: 200, description: 'List of customer orders' })
  getOrders(@Req() req) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated or token is invalid');
    }
    return this.customersService.findOrders(Number(userId));
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'List of all customers' })
  getAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer data' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(@Param('id') id: string) {
    const customer = await this.customersService.findOne(Number(id));
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  deleteCustomer(@Param('id') id: string) {
    return this.customersService.delete(Number(id));
  }
}
