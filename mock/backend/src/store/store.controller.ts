import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('store')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StoreController {
  constructor(private storeService: StoreService) {}

  @Get('storeGeneral')
  @ApiOperation({ summary: 'Get store general info' })
  getGeneral() {
    return this.storeService.getGeneral();
  }

  @Put('storeGeneral')
  @ApiOperation({ summary: 'Update store general info' })
  updateGeneral(@Body() data: any) {
    return this.storeService.updateGeneral(data);
  }

  @Get('storeSocial')
  @ApiOperation({ summary: 'Get store social links' })
  getSocial() {
    return this.storeService.getSocial();
  }

  @Put('storeSocial')
  @ApiOperation({ summary: 'Update store social links' })
  updateSocial(@Body() data: any) {
    return this.storeService.updateSocial(data);
  }

  @Get('storeSchedule')
  @ApiOperation({ summary: 'Get store schedule' })
  getSchedule() {
    return this.storeService.getSchedule();
  }

  @Put('storeSchedule')
  @ApiOperation({ summary: 'Update store schedule' })
  updateSchedule(@Body() data: any) {
    return this.storeService.updateSchedule(data);
  }

  @Get('storePayment')
  @ApiOperation({ summary: 'Get store payment methods' })
  getPayment() {
    return this.storeService.getPayment();
  }

  @Put('storePayment')
  @ApiOperation({ summary: 'Update store payment methods' })
  updatePayment(@Body() data: any) {
    return this.storeService.updatePayment(data);
  }

  @Get('storeShipping')
  @ApiOperation({ summary: 'Get store shipping info' })
  getShipping() {
    return this.storeService.getShipping();
  }

  @Put('storeShipping')
  @ApiOperation({ summary: 'Update store shipping info' })
  updateShipping(@Body() data: any) {
    return this.storeService.updateShipping(data);
  }

  @Get('storeTheme')
  @ApiOperation({ summary: 'Get store theme' })
  getTheme() {
    return this.storeService.getTheme();
  }

  @Put('storeTheme')
  @ApiOperation({ summary: 'Update store theme' })
  updateTheme(@Body() data: any) {
    return this.storeService.updateTheme(data);
  }

  @Get('storeLogo')
  @ApiOperation({ summary: 'Get store logo' })
  getLogo() {
    return this.storeService.getLogo();
  }

  @Put('storeLogo')
  @ApiOperation({ summary: 'Update store logo' })
  updateLogo(@Body() data: any) {
    return this.storeService.updateLogo(data);
  }

  @Get('storeFavicon')
  @ApiOperation({ summary: 'Get store favicon' })
  getFavicon() {
    return this.storeService.getFavicon();
  }

  @Put('storeFavicon')
  @ApiOperation({ summary: 'Update store favicon' })
  updateFavicon(@Body() data: any) {
    return this.storeService.updateFavicon(data);
  }
}
