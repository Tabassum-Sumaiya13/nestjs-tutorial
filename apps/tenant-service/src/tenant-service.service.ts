import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
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

  async findAll(status?: TenantStatus): Promise<Tenant[]> {
    const query: FilterQuery<Tenant> = { deleted: false };
    if (status) query.status = status;
    return this.tenantModel.find(query).sort({ createdAt: -1 }).lean().exec();
  }

  async findById(id: string): Promise<Tenant> {
    const doc = await this.tenantModel
      .findOne({ _id: id, deleted: false })
      .lean()
      .exec();
    if (!doc) throw new NotFoundException('Tenant not found');
    return doc;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const updated = await this.tenantModel
      .findOneAndUpdate(
        { _id: id, deleted: false },
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
        { _id: id, deleted: false },
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
      .findOneAndUpdate(
        { _id: id, deleted: false },
        { $set: { deleted: true, status: TenantStatus.INACTIVE } },
      )
      .lean()
      .exec();
    if (!res) throw new NotFoundException('Tenant not found');
    return { deleted: true };
  }
}
