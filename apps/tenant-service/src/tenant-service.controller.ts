import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TenantServiceService } from './tenant-service.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { TenantStatus } from './schemas/tenant.schema';
import { apiResponse } from '@app/common-lib';

@Controller('tenants')
export class TenantServiceController {
  constructor(private readonly service: TenantServiceService) {}

  @Post()
  async create(@Body() dto: CreateTenantDto) {
    const data = await this.service.create(dto);
    return apiResponse('Tenant created successfully', data);
  }

  @Get()
  async findAll(@Query('status') status?: TenantStatus) {
    const data = await this.service.findAll(status as TenantStatus);
    return apiResponse('Tenant list fetched successfully', data);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.service.findById(id);
    return apiResponse('Tenant details fetched successfully', data);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    const data = await this.service.update(id, dto);
    return apiResponse('Tenant updated successfully', data);
  }

  @Patch(':id/status')
  async changeStatus(@Param('id') id: string, @Body() body: ChangeStatusDto) {
    const data = await this.service.changeStatus(id, body.status);
    return apiResponse(`Tenant status changed to ${body.status}`, data);
  }

  @Delete(':id')
  async softDelete(@Param('id') id: string) {
    const data = await this.service.softDelete(id);
    return apiResponse('Tenant deleted successfully', data);
  }
}