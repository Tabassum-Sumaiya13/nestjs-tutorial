import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Tenant, TenantDocument, TenantStatus } from './schemas/tenant.schema';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantServiceService {
  constructor(
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
  ) {}

  async create(dto: CreateTenantDto): Promise<Tenant> {
    try {
      const tenant = new this.tenantModel(dto);
      return await tenant.save();
    } catch (e: any) {
      if (e?.code === 11000)
        throw new ConflictException('Tenant name already exists');
      throw e;
    }
  }

  async findAll(
    status?: TenantStatus,
    page = 1,
    pageSize = 10,
  ): Promise<{ data: Tenant[]; total: number; meta: any }> {
    const query: any = { deleted: false };
    if (status) query.status = status;

    const total = await this.tenantModel.countDocuments(query);

    // Negative page means "all data"
    if (page < 0) {
      const data = await this.tenantModel
        .find(query)
        .sort({ createdAt: -1 })
        .lean()
        .exec();
      return {
        data,
        total,
        meta: {
          total,
          page: -1,
          pageSize: total,
          totalPages: 1,
        },
      };
    }

    const skip = (page - 1) * pageSize;
    const data = await this.tenantModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    return {
      data,
      total,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }
  async findById(id: string): Promise<Tenant> {
    const doc = await this.tenantModel
      .findOne({ _id: id as any, deleted: false } as any)
      .lean()
      .exec();
    if (!doc) throw new NotFoundException('Tenant not found');
    return doc;
  }

  async findByName(name: string): Promise<Tenant> {
    const doc = await this.tenantModel
      .findOne({ name, deleted: false })
      .lean()
      .exec();
    if (!doc) throw new NotFoundException('Tenant not found');
    return doc;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const updated = await this.tenantModel
      .findOneAndUpdate(
        { _id: id as any, deleted: false } as any,
        { $set: dto },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();
    if (!updated) throw new NotFoundException('Tenant not found');
    return updated;
  }

  async changeStatus(id: string, status: TenantStatus): Promise<Tenant> {
    const updated = await this.tenantModel
      .findOneAndUpdate(
        { _id: id as any, deleted: false } as any,
        { $set: { status } },
        { new: true },
      )
      .lean()
      .exec();
    if (!updated) throw new NotFoundException('Tenant not found');
    return updated;
  }

  async softDelete(id: string): Promise<{ deleted: boolean }> {
    const res = await this.tenantModel
      .findOneAndUpdate({ _id: id as any, deleted: false } as any, {
        $set: { deleted: true, status: TenantStatus.INACTIVE },
      })
      .lean()
      .exec();
    if (!res) throw new NotFoundException('Tenant not found');
    return { deleted: true };
  }
}
